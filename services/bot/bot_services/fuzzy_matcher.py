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
            from shared.database.pool import get_pool
            async with get_pool().acquire() as conn:
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

    def match_product(self, raw_name: str, uid: int, threshold: int = 65) -> Optional[str]:
        snap = self._snapshot(uid)
        if not snap:
            return None
        products, _, aliases = snap
        if not products:
            return None
        raw_lower = raw_name.lower().strip()
        if raw_lower in aliases:
            return aliases[raw_lower]
        product_lowers = [p.lower() for p in products]
        result = process.extractOne(raw_lower, product_lowers, scorer=fuzz.ratio)
        if result and result[1] >= threshold:
            idx = product_lowers.index(result[0])
            matched = products[idx]
            logger.info(
                "Fuzzy product: '%s' -> '%s' (%s%%)",
                raw_name,
                matched,
                result[1],
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
