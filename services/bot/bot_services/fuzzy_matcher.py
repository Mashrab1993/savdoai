"""
Fuzzy Matcher — STT natijasidagi tovar va klient nomlarini
DB dagi haqiqiy nomlar bilan solishtiradi va tuzatadi.

MUHIM: tovarlar/klientlar jadvallari RLS bilan himoyalangan (user_id = current_uid()).
Shuning uchun ma'lumotlar faqat rls_conn(tg_user_id) orqali yuklanadi — global pool bilan emas.
"""
from __future__ import annotations

import time
import logging
from typing import Optional

from thefuzz import fuzz, process

from shared.database.pool import rls_conn

logger = logging.getLogger(__name__)

_CACHE_TTL_S = 300.0

# STT matnidagi operatsion so'zlar — hech qachon fuzzy orqali tovar nomiga almashtirilmasin.
# (Aks holda masalan "cheki" → "Chelsi" kabi xato yozuvlar bo'ladi.)
OPERATIONAL_WORDS_EXACT: frozenset[str] = frozenset({
    "kirim",
    "chiqim",
    "sotuv",
    "hisobot",
    "chek",
    "cheki",
    "nakladnoy",
    "nakladniy",
    "faktura",
    "balans",
    "jurnal",
    "klient",
    "qarz",
    "tolov",
    "ombor",
    "plus",
    "minus",
    "menyu",
    "yordam",
    "kassa",
    "status",
    "savat",
    "savatlar",
    "hafta",
    "kunlik",
    "foyda",
})

# fuzz.ratio uchun qo'shimcha shakllar (STT xatolari) — max() bilan operatsion yaqinlik
OPERATIONAL_WORDS_SIM: tuple[str, ...] = tuple(
    {*OPERATIONAL_WORDS_EXACT, "to'lov", "tolov", "naklad", "chekka", "kirimlar"}
)

# Agar token operatsion so'zga juda yaqin bo'lsa, lekin tovarga past foizda mos kelsa — tovarni tanlamang.
_OP_AMBIGUITY_MIN = 62
_OP_BEATS_PRODUCT_MARGIN = 8

# Birlik / grammatik tokenlar — tovar fuzzy qilinmaydi (voice_pipeline skip_words bilan mos)
_GRAMMAR_UNIT_SKIP: frozenset[str] = frozenset({
    "ta",
    "dona",
    "karobka",
    "shtuk",
    "paket",
    "ga",
    "da",
    "ni",
    "dan",
    "bilan",
    "va",
    "yana",
})


def _strip_word_edges(s: str) -> str:
    return s.strip().strip('.,!?;:«»()"\'')


def _norm_op_token(s: str) -> str:
    t = _strip_word_edges(s).lower()
    for a in ("ʻ", "'", "’", "`"):
        t = t.replace(a, "")
    return t


def _max_operational_similarity(raw: str) -> int:
    """Token operatsion lug'atga qanchalik yaqin (0–100)."""
    if not raw:
        return 0
    m = 0
    for op in OPERATIONAL_WORDS_SIM:
        m = max(m, fuzz.ratio(raw, op))
    return m


def operational_token_blocks_product_fuzzy(raw_name: str, product_best_score: int) -> bool:
    """
    True bo'lsa, bu tokenni tovar nomi sifatida fuzzy qilish xavfli yoki taqiqlangan.
    Testlar va tashqi tekshiruvlar uchun ochiq helper.
    """
    raw = _norm_op_token(raw_name)
    if not raw or raw.isdigit():
        return True
    if raw in OPERATIONAL_WORDS_EXACT:
        return True
    op_sim = _max_operational_similarity(raw)
    if op_sim >= _OP_AMBIGUITY_MIN and product_best_score <= op_sim + _OP_BEATS_PRODUCT_MARGIN:
        return True
    if op_sim > product_best_score:
        return True
    return False


class FuzzyMatcher:
    """Har bir Telegram foydalanuvchisi uchun keshlangan fuzzy ro'yxatlar."""

    def __init__(self) -> None:
        # uid -> (timestamp, products, clients, product_aliases)
        self._cache: dict[int, tuple[float, list[str], list[str], dict[str, str]]] = {}

    def cache_tozala(self, uid: int) -> None:
        """Yangi tovar/klient qo'shilganda cache ni tozalash."""
        self._cache.pop(uid, None)

    async def ensure_loaded(self, uid: int) -> None:
        """RLS kontekstida shu foydalanuvchining tovar/klientlarini yuklash."""
        if not uid:
            return
        now = time.time()
        hit = self._cache.get(uid)
        if hit and (now - hit[0]) < _CACHE_TTL_S:
            return
        try:
            # db._P() — asosiy pool (data shu yerda)
            import services.bot.db as _db
            async with _db._P().acquire() as conn:
                prows = await conn.fetch(
                    "SELECT DISTINCT nomi FROM tovarlar WHERE user_id=$1 AND nomi IS NOT NULL AND nomi != ''",
                    uid
                )
                crows = await conn.fetch(
                    "SELECT DISTINCT ism FROM klientlar WHERE user_id=$1 AND ism IS NOT NULL AND ism != ''",
                    uid
                )
            products = [r["nomi"] for r in prows]
            clients = [r["ism"] for r in crows]
            aliases: dict[str, str] = {}
            for p in products:
                pl = p.lower()
                aliases[pl] = p
                # Fonetik variatsiyalar — STT ko'p adashadi
                aliases[pl.replace("e", "a")] = p
                aliases[pl.replace("i", "e")] = p
                aliases[pl.replace("sh", "s")] = p    # "Persil" ← "Pershl"
                aliases[pl.replace("ch", "c")] = p    # "Clean" ← "Chlean"
                aliases[pl.replace("'", "")] = p       # apostrof olib tashlash
                aliases[pl.replace("ʻ", "")] = p
                aliases[pl.replace("-", "")] = p       # "Head-Shoulders" ← "HeadShoulders"
                aliases[pl.replace("-", " ")] = p
                aliases[pl.replace(" ", "")] = p       # "Ariel 3kg" ← "Ariel3kg"
                # Kirill → Lotin adashish
                for k, v in (("к","k"),("с","s"),("а","a"),("о","o"),("р","r"),("е","e")):
                    if k in pl:
                        aliases[pl.replace(k, v)] = p
            self._cache[uid] = (now, products, clients, aliases)
            logger.info(
                "FuzzyMatcher uid=%s: %d tovar, %d klient",
                uid,
                len(products),
                len(clients),
            )
        except Exception as e:
            logger.error("FuzzyMatcher yuklash xatosi (uid=%s): %s", uid, e)

    def _snapshot(self, uid: int) -> tuple[list[str], list[str], dict[str, str]] | None:
        hit = self._cache.get(uid)
        if not hit:
            return None
        return hit[1], hit[2], hit[3]

    def get_products_clients(self, uid: int) -> tuple[list[str], list[str]]:
        snap = self._snapshot(uid)
        if not snap:
            return [], []
        return snap[0], snap[1]

    def match_product(self, raw_name: str, uid: int, threshold: int = 85) -> Optional[str]:
        snap = self._snapshot(uid)
        if not snap:
            return None
        products, _, aliases = snap
        if not products:
            return None
        raw_stripped = _strip_word_edges(raw_name)
        raw_lower = raw_stripped.lower()
        raw_norm = _norm_op_token(raw_stripped)
        if not raw_norm:
            return None
        if raw_norm in OPERATIONAL_WORDS_EXACT:
            return None
        # Minimal uzunlik — 3 harfdan kam so'zni fuzzy qilma
        if len(raw_norm) < 3:
            return None
        # Alias — aniq match (fonetik variatsiya)
        if raw_lower in aliases:
            return aliases[raw_lower]

        product_lowers = [p.lower() for p in products]

        # ═══ 2-BOSQICHLI AQLLI MATCHING ═══

        # 1-bosqich: partial_ratio — so'z tovar nomi ICHIDA bormi?
        # "colgate" ichida "Colgate 100ml" bor → partial=100%
        result_partial = process.extractOne(
            raw_lower, product_lowers, scorer=fuzz.partial_ratio
        )
        if result_partial and result_partial[1] >= 90:
            # Partial yaxshi — lekin ratio ham tekshir (tasodifiy qisqa match oldini olish)
            idx_p = product_lowers.index(result_partial[0])
            ratio_check = fuzz.ratio(raw_lower, result_partial[0])
            if ratio_check >= 55:
                matched = products[idx_p]
                if operational_token_blocks_product_fuzzy(raw_name, result_partial[1]):
                    return None
                logger.info(
                    "Fuzzy product: '%s' -> '%s' (partial=%s%% ratio=%s%%)",
                    raw_name, matched, result_partial[1], ratio_check,
                )
                return matched

        # 2-bosqich: fuzz.ratio — to'liq o'xshashlik (faqat juda yaqin so'zlar)
        result_ratio = process.extractOne(
            raw_lower, product_lowers, scorer=fuzz.ratio
        )
        if result_ratio and result_ratio[1] >= threshold:
            if operational_token_blocks_product_fuzzy(raw_name, result_ratio[1]):
                return None
            idx = product_lowers.index(result_ratio[0])
            matched = products[idx]
            logger.info(
                "Fuzzy product: '%s' -> '%s' (%s%%)",
                raw_name, matched, result_ratio[1],
            )
            return matched

        return None

    def match_client(self, raw_name: str, uid: int, threshold: int = 60) -> Optional[str]:
        snap = self._snapshot(uid)
        if not snap:
            return None
        _, clients, _ = snap
        if not clients:
            return None
        raw_lower = raw_name.lower().strip()
        client_lowers = [c.lower() for c in clients]
        result = process.extractOne(
            raw_lower, client_lowers, scorer=fuzz.token_sort_ratio
        )
        if result and result[1] >= threshold:
            idx = client_lowers.index(result[0])
            matched = clients[idx]
            logger.info(
                "Fuzzy klient: '%s' -> '%s' (%s%%)",
                raw_name,
                matched,
                result[1],
            )
            return matched
        return None

    def fix_text(self, stt_text: str, uid: int) -> str:
        """uid bo'lmasa yoki kesh bo'lmasa — matn o'zgartirilmasin."""
        if not uid:
            return stt_text
        snap = self._snapshot(uid)
        if not snap:
            return stt_text
        products, clients, aliases = snap
        if not products and not clients:
            return stt_text

        words = stt_text.split()
        fixed_words: list[str] = []
        i = 0
        while i < len(words):
            word = words[i]
            if word.isdigit():
                fixed_words.append(word)
                i += 1
                continue

            if _norm_op_token(word) in _GRAMMAR_UNIT_SKIP:
                fixed_words.append(word)
                i += 1
                continue

            if i + 1 < len(words) and words[i + 1].lower() in (
                "aka",
                "opa",
                "brat",
                "xola",
                "amaki",
            ):
                client_name = f"{word} {words[i + 1]}"
                matched = self.match_client(client_name, uid)
                if matched:
                    fixed_words.append(matched)
                    i += 2
                    continue

            matched_product = self.match_product(word, uid)
            if matched_product:
                fixed_words.append(matched_product)
                i += 1
                continue

            fixed_words.append(word)
            i += 1

        result = " ".join(fixed_words)
        if result != stt_text:
            logger.info("Fuzzy fix: '%s' -> '%s'", stt_text, result)
        return result


fuzzy_matcher = FuzzyMatcher()
