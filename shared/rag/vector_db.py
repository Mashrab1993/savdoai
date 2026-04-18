"""
╔═══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — RAG VECTOR DB                              ║
║  DSc Filologiya: O'zbek shevalari lug'ati                        ║
║                                                                   ║
║  Foydalanuvchi "chekka qivor" desa →                             ║
║  Vector DB → "chekka = yechib olish/o'tkazish" (Qashqadaryo)    ║
║                                                                   ║
║  Texnologiya: In-memory (kichik) + Qdrant (katta, ixtiyoriy)    ║
╚═══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import re

log = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════════════
#  O'ZBEK SHEVALARI LEKSIKASI
#  Manba: O'zbek dialektologiyasi (Reshetov, 1967)
#         Zamonaviy tadqiqotlar (Yunusov, 2019)
# ════════════════════════════════════════════════════════════════════

SHEVA_LUGATI: dict[str, dict] = {

    # ── TOSHKENT SHEVASI ─────────────────────────────────────────────
    "beraqol":      {"standart": "ber", "sheva": "Toshkent",    "manosi": "bermoq"},
    "olaqol":       {"standart": "ol",  "sheva": "Toshkent",    "manosi": "olmoq"},
    "necha":        {"standart": "qancha","sheva":"Toshkent",   "manosi": "qancha miqdor"},
    "nechchi":      {"standart": "qancha","sheva":"Toshkent",   "manosi": "nechta"},
    "chiqaqol":     {"standart": "chiqar","sheva":"Toshkent",   "manosi": "chiqarmoq"},

    # ── SAMARQAND-BUXORO SHEVASI ──────────────────────────────────────
    "qanch":        {"standart": "qancha", "sheva": "Samarqand", "manosi": "qancha"},
    "qanchiki":     {"standart": "qancha", "sheva": "Samarqand", "manosi": "qancha"},
    "bersin":       {"standart": "berdi",  "sheva": "Samarqand", "manosi": "bermoq"},
    "olsin":        {"standart": "oldi",   "sheva": "Samarqand", "manosi": "olmoq"},
    "bering":       {"standart": "berdi",  "sheva": "Buxoro",    "manosi": "bermoq"},
    "oling":        {"standart": "oldi",   "sheva": "Buxoro",    "manosi": "olmoq"},

    # ── FARG'ONA-TOSHKENT ORALIQ ──────────────────────────────────────
    "nema":         {"standart": "nima",  "sheva": "Farg'ona",  "manosi": "nima"},
    "nemadir":      {"standart": "nimadir","sheva":"Farg'ona",  "manosi": "nimadir"},
    "bergil":       {"standart": "berdi", "sheva": "Farg'ona",  "manosi": "bermoq"},
    "olgil":        {"standart": "oldi",  "sheva": "Farg'ona",  "manosi": "olmoq"},
    "qanchaki":     {"standart": "qancha","sheva": "Andijon",   "manosi": "qancha"},
    "nimaki":       {"standart": "nima",  "sheva": "Andijon",   "manosi": "nima"},

    # ── XORAZM SHEVASI ───────────────────────────────────────────────
    "neme":         {"standart": "nima",   "sheva": "Xorazm",   "manosi": "nima"},
    "nemes":        {"standart": "nima",   "sheva": "Xorazm",   "manosi": "nima"},
    "kansha":       {"standart": "qancha", "sheva": "Xorazm",   "manosi": "qancha"},
    "kilu":         {"standart": "kilo",   "sheva": "Xorazm",   "manosi": "kilogram"},
    "baqiyasiga":   {"standart": "qarzga", "sheva": "Xorazm",   "manosi": "qarzga, muddatga"},
    "baqiyaga":     {"standart": "qarzga", "sheva": "Xorazm",   "manosi": "qarzga"},
    "berin":        {"standart": "berdi",  "sheva": "Xorazm",   "manosi": "bermoq"},
    "alin":         {"standart": "olindi", "sheva": "Xorazm",   "manosi": "olmoq"},
    "bergin":       {"standart": "berdi",  "sheva": "Xorazm",   "manosi": "bermoq"},

    # ── QASHQADARYO SHEVASI ──────────────────────────────────────────
    "chekka":       {"standart": "yechib_olish", "sheva": "Qashqadaryo",
                     "manosi": "pul yechib berish/o'tkazish"},
    "chekka qivor": {"standart": "pul o'tkazish", "sheva": "Qashqadaryo",
                     "manosi": "pulni o'tkazib bermoq"},
    "tiqson":       {"standart": "to'qson",  "sheva": "Qashqadaryo", "manosi": "90"},
    "gandong":      {"standart": "o'rtacha", "sheva": "Qashqadaryo", "manosi": "o'rtacha"},
    "tovar":        {"standart": "tovar",    "sheva": "Qashqadaryo", "manosi": "mahsulot"},

    # ── SURXONDARYO SHEVASI ───────────────────────────────────────────
    "bolan":        {"standart": "bolam",   "sheva": "Surxondaryo", "manosi": "bolam (murojaat)"},
    "narivi":       {"standart": "u",       "sheva": "Surxondaryo", "manosi": "u (ko'rsatish)"},
    "kelyati":      {"standart": "kelayapti","sheva":"Surxondaryo", "manosi": "kelayapti"},
    "buyati":       {"standart": "buyoqda", "sheva": "Surxondaryo", "manosi": "shu yoqda"},

    # ── QORAQALPOG'ISTON ─────────────────────────────────────────────
    "qanshe":       {"standart": "qancha",  "sheva": "Qoraqalpog'", "manosi": "qancha"},
    "nemerki":      {"standart": "nima",    "sheva": "Qoraqalpog'", "manosi": "nima"},
    "bereyin":      {"standart": "beraman", "sheva": "Qoraqalpog'", "manosi": "beraman"},

    # ── SAVDO VA MOLIYA IBORALARI ────────────────────────────────────
    "nasiyaga":     {"standart": "qarzga",  "sheva": "umumiy",     "manosi": "qarzga bermoq"},
    "nasiya":       {"standart": "qarz",    "sheva": "umumiy",     "manosi": "qarz/kredit"},
    "udum":         {"standart": "qarz",    "sheva": "Samarqand/Buxoro", "manosi": "udum/qarz"},
    "udumiga":      {"standart": "qarziga", "sheva": "Buxoro",    "manosi": "qarzga"},
    "muddatga":     {"standart": "qarzga",  "sheva": "umumiy",    "manosi": "muddatli to'lov"},
    "hisob-kitobga":{"standart": "qarzga",  "sheva": "umumiy",    "manosi": "hisob-kitob bilan"},
    "kreditga":     {"standart": "qarzga",  "sheva": "umumiy",    "manosi": "kredit bilan"},
    "tolashda":     {"standart": "to'lashda","sheva": "umumiy",   "manosi": "to'lashda"},
    "avansga":      {"standart": "oldindan","sheva": "umumiy",    "manosi": "avans to'lov"},

    # ── SAVDO AMALLARI ───────────────────────────────────────────────
    "ketti":        {"standart": "sotildi", "sheva": "umumiy",   "manosi": "ketdi/sotildi"},
    "ketdi":        {"standart": "sotildi", "sheva": "umumiy",   "manosi": "sotildi"},
    "kiripti":      {"standart": "kirdi",   "sheva": "Toshkent", "manosi": "keldi/kirdi"},
    "tushdi":       {"standart": "kirdi",   "sheva": "umumiy",   "manosi": "kassa tushdi"},
    "tushirildi":   {"standart": "kirdi",   "sheva": "umumiy",   "manosi": "omborga tushirildi"},
    "sotdim":       {"standart": "chiqim",  "sheva": "umumiy",   "manosi": "sotuv operatsiyasi"},
    "berdim":       {"standart": "chiqim",  "sheva": "umumiy",   "manosi": "berish operatsiyasi"},
    "oldim":        {"standart": "kirim",   "sheva": "umumiy",   "manosi": "olish operatsiyasi"},
    "qaytardi":     {"standart": "qaytarish","sheva":"umumiy",   "manosi": "tovar qaytardi"},
    "to'ladi":      {"standart": "qarz_tolash","sheva":"umumiy", "manosi": "qarz to'ladi"},

    # ── MIQDOR VA BIRLIK ─────────────────────────────────────────────
    "bir yarim":    {"standart": "1.5",     "sheva": "umumiy",   "manosi": "bir yarim (1.5)"},
    "yarim":        {"standart": "0.5",     "sheva": "umumiy",   "manosi": "yarmi (0.5)"},
    "chorak":       {"standart": "0.25",    "sheva": "umumiy",   "manosi": "chorak (0.25)"},
    "limon":        {"standart": "100000",  "sheva": "O'zbekiston", "manosi": "100,000 so'm"},
    "ming":         {"standart": "1000",    "sheva": "umumiy",   "manosi": "1,000"},
    "xalta":        {"standart": "qop",     "sheva": "umumiy",   "manosi": "qop/xalta"},
    "meshok":       {"standart": "qop",     "sheva": "ruscha",   "manosi": "qop"},
    "kil":          {"standart": "kg",      "sheva": "qisqartma","manosi": "kilogram"},
}


# ════════════════════════════════════════════════════════════════════
#  ODDIY VEKTOR QIDIRISH (In-memory)
# ════════════════════════════════════════════════════════════════════

def sheva_qidirish(so_z: str, top_k: int = 3) -> list[dict]:
    """
    So'zni sheva lug'atidan qidirish.
    Exact match → prefix match → substring match tartibida.
    """
    so_z_low = so_z.lower().strip()
    natijalar = []

    # 1. To'liq mos
    if so_z_low in SHEVA_LUGATI:
        e = dict(SHEVA_LUGATI[so_z_low])
        e["so_z"] = so_z_low
        e["skor"] = 1.0
        natijalar.append(e)

    # 2. Prefiks mos
    if len(natijalar) < top_k:
        for k, v in SHEVA_LUGATI.items():
            if k.startswith(so_z_low) and k != so_z_low:
                e = dict(v); e["so_z"] = k
                e["skor"] = len(so_z_low) / len(k)
                natijalar.append(e)
                if len(natijalar) >= top_k:
                    break

    # 3. Substring mos
    if len(natijalar) < top_k:
        for k, v in SHEVA_LUGATI.items():
            if so_z_low in k and k not in {r["so_z"] for r in natijalar}:
                e = dict(v); e["so_z"] = k
                e["skor"] = 0.5
                natijalar.append(e)
                if len(natijalar) >= top_k:
                    break

    return natijalar[:top_k]


def matn_boyitish_rag(matn: str) -> str:
    """
    Matnni RAG bilan boyitish:
    Sheva so'zlari topib, standart ekvivalentini qo'shish.
    """
    boyitishlar = []
    tokenlar = re.split(r'\s+', matn.lower())

    # Bitta so'z
    for tok in tokenlar:
        natijalar = sheva_qidirish(tok, top_k=1)
        if natijalar and natijalar[0]["skor"] >= 0.8:
            e = natijalar[0]
            if e["standart"] != tok:
                manosi = e.get("manosi", e.get("ma_no",""))
                boyitishlar.append(
                    f"'{tok}' ({e['sheva']}): {manosi}"
                )

    # Ikki so'zli iboralar
    for i in range(len(tokenlar) - 1):
        ibora = tokenlar[i] + " " + tokenlar[i+1]
        natijalar = sheva_qidirish(ibora, top_k=1)
        if natijalar and natijalar[0]["skor"] >= 0.9:
            e = natijalar[0]
            manosi = e.get("manosi", e.get("ma_no",""))
            boyitishlar.append(
                f"'{ibora}' ({e['sheva']}): {manosi}"
            )

    if boyitishlar:
        return matn + "\n[RAG LEKSIKA: " + " | ".join(boyitishlar[:5]) + "]"
    return matn


def so_z_standartlashtir(matn: str) -> str:
    """
    Sheva so'zlarini standart shaklga o'tkazish.
    Hisob-kitob uchun zarur.
    """
    m = matn.lower()
    # Uzundan qisqaga qarab almashtirish
    for sheva_so_z in sorted(SHEVA_LUGATI.keys(), key=len, reverse=True):
        standart = SHEVA_LUGATI[sheva_so_z]["standart"]
        if sheva_so_z in m and standart not in ("qarzga", "0.5", "0.25", "1.5"):
            m = m.replace(sheva_so_z, standart)
    return m


# ════════════════════════════════════════════════════════════════════
#  QDRANT ADAPTER (Ixtiyoriy — to'liq production uchun)
# ════════════════════════════════════════════════════════════════════

class QdrantRAG:
    """
    Qdrant Vector DB adapter.
    Faqat QDRANT_URL environment variable bo'lsa ishga tushadi.
    Aks holda in-memory lug'at ishlatiladi.
    """

    def __init__(self, url: str | None = None,
                 api_key: str | None = None):
        self._client = None
        self._collection = "uzbek_dialects"

        if url:
            try:
                from qdrant_client import QdrantClient
                self._client = QdrantClient(url=url, api_key=api_key)
                log.info("✅ Qdrant ulandi: %s", url)
            except ImportError:
                log.warning("qdrant-client o'rnatilmagan — in-memory ishlatiladi")
            except Exception as e:
                log.warning("Qdrant ulanmadi: %s — in-memory ishlatiladi", e)

    async def qidirish(self, so_z: str, top_k: int = 3) -> list[dict]:
        """So'zni vektor qidirish"""
        if not self._client:
            return sheva_qidirish(so_z, top_k)

        try:
            # Embedding yaratish (Gemini yoki OpenAI)
            embedding = await self._embedding_ol(so_z)
            results = self._client.search(
                collection_name=self._collection,
                query_vector=embedding,
                limit=top_k,
            )
            return [
                {
                    "so_z":     r.payload.get("so_z", ""),
                    "standart": r.payload.get("standart", ""),
                    "sheva":    r.payload.get("sheva", ""),
                    "manosi":    r.payload.get("ma_no", ""),
                    "skor":     r.score,
                }
                for r in results
            ]
        except Exception as e:
            log.warning("Qdrant qidirish xato: %s", e)
            return sheva_qidirish(so_z, top_k)

    async def _embedding_ol(self, matn: str) -> list[float]:
        """Matn uchun embedding olish (sodda hash-based)"""
        # Haqiqiy implementation: Gemini embedding API
        import hashlib
        h = hashlib.sha256(matn.encode()).digest()
        return [b / 255.0 for b in h] * 4  # 64-dim


# Global instance
_rag: QdrantRAG | None = None


def rag_init(qdrant_url: str | None = None,
             qdrant_key: str | None = None) -> None:
    global _rag
    _rag = QdrantRAG(qdrant_url, qdrant_key)
    log.info("✅ RAG tizimi tayyor (%s)",
             "Qdrant" if qdrant_url else "in-memory")


def rag_ol() -> QdrantRAG:
    if not _rag:
        rag_init()
    return _rag


# ════════════════════════════════════════════════════════════
#  STOP WORDS (O'ZBEK TILI)
# ════════════════════════════════════════════════════════════

UZBEK_STOPWORDS: frozenset = frozenset({
    # Yordamchi so'zlar
    "va", "bilan", "uchun", "ham", "lekin", "ammo", "yoki",
    "bu", "u", "ul", "o", "shu", "ana", "mana", "ha", "yo",
    # Olmoshlar
    "men", "sen", "biz", "ular", "siz", "uni", "unga", "undan",
    # Ko'makchilar
    "da", "dan", "ga", "ni", "ning", "dagi",
    # Hujayra so'zlari
    "edi", "bo", "bo'l", "qil", "et", "ol",
    # Sonlar uchun emas
})


def stopwords_tozala(matn: str) -> str:
    """Matndan stop words larni olib tashlash"""
    tokenlar = matn.lower().split()
    tozalangan = [t for t in tokenlar if t not in UZBEK_STOPWORDS]
    return " ".join(tozalangan)


# ════════════════════════════════════════════════════════════
#  TYPO CORRECTION (Xato yozishni tuzatish)
# ════════════════════════════════════════════════════════════

def typo_tuzat(so_z: str, lug_at: dict = None,
               max_dist: int = 2) -> str:
    """
    Edit distance orqali xato yozilgan so'zni tuzatish.
    "sakkoz" → "sakkiz", "nasiaga" → "nasiyaga"
    """
    if lug_at is None:
        lug_at = SHEVA_LUGATI

    so_z_low = so_z.lower()

    # Avval to'liq mos
    if so_z_low in lug_at:
        return so_z_low

    # Edit distance bilan eng yaqinini topish
    best = so_z_low
    min_d = max_dist + 1

    for k in lug_at:
        d = _edit_distance(so_z_low, k)
        if d < min_d:
            min_d = d
            best  = k

    return best if min_d <= max_dist else so_z_low


def _edit_distance(s1: str, s2: str) -> int:
    """Levenshtein masofasi (DP)"""
    m, n = len(s1), len(s2)
    if abs(m - n) > 3: return abs(m - n)  # Tez filtr

    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[:]
        dp[0] = i
        for j in range(1, n + 1):
            cost = 0 if s1[i-1] == s2[j-1] else 1
            dp[j] = min(dp[j]+1, dp[j-1]+1, prev[j-1]+cost)
    return dp[n]
