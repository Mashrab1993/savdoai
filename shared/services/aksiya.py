"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — AKSIYA VA CHEGIRMA TIZIMI (PRO)              ║
║                                                                  ║
║  Smartup ERP'dan o'rganilgan (30+ jadval → soddalashtirilgan):  ║
║                                                                  ║
║  AKSIYA TURLARI:                                                 ║
║  1. FOIZ_CHEGIRMA   — jami summadan X% chegirma                ║
║  2. SUMMA_CHEGIRMA  — jami summadan X so'm chegirma            ║
║  3. TOVAR_HADYA     — N dona olganda M dona bepul              ║
║  4. BONUS_BALL      — har X so'mga Y ball                      ║
║  5. NARX_TUSHIRISH  — muayyan tovarlarga maxsus narx           ║
║  6. MIN_SUMMA       — X so'mdan ortiq xaridda faollashadi      ║
║                                                                  ║
║  SD Agent'dagi Manual + calculateDiscount analogi               ║
║  + Smartup'dagi mcg_* aksiya jadvallari soddalashtirilgan       ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
from dataclasses import dataclass
from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional, Dict, Any

log = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════
#  AKSIYA MODELLARI
# ════════════════════════════════════════════════════════════

AKSIYA_TURLARI = {
    "foiz_chegirma": "Foiz chegirma",
    "summa_chegirma": "Summa chegirma",
    "tovar_hadya": "Tovar hadya (N+M)",
    "bonus_ball": "Bonus ball",
    "narx_tushirish": "Maxsus narx",
    "min_summa": "Minimal summa chegirma",
}


# ════════════════════════════════════════════════════════════
#  DB SCHEMA
# ════════════════════════════════════════════════════════════

AKSIYA_MIGRATION_SQL = """
-- Aksiyalar jadvali
CREATE TABLE IF NOT EXISTS aksiyalar (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi VARCHAR(200) NOT NULL,
    turi VARCHAR(30) NOT NULL,  -- foiz_chegirma, summa_chegirma, tovar_hadya, bonus_ball, narx_tushirish, min_summa
    faol BOOLEAN DEFAULT TRUE,
    boshlanish_sanasi DATE,
    tugash_sanasi DATE,
    
    -- Shartlar
    min_summa NUMERIC(18,2) DEFAULT 0,
    min_miqdor INTEGER DEFAULT 0,
    max_qollash_soni INTEGER DEFAULT 0,  -- 0 = cheksiz
    
    -- Qiymatlar
    chegirma_foiz NUMERIC(5,2) DEFAULT 0,
    chegirma_summa NUMERIC(18,2) DEFAULT 0,
    maxsus_narx NUMERIC(18,2) DEFAULT 0,
    bonus_ball_koeffitsient NUMERIC(5,2) DEFAULT 0,
    
    -- Hadya (N+M)
    hadya_shart_miqdor INTEGER DEFAULT 0,   -- N dona olganda
    hadya_bepul_miqdor INTEGER DEFAULT 0,   -- M dona bepul
    
    -- Qo'llanish doirasi
    barcha_tovarlar BOOLEAN DEFAULT TRUE,
    barcha_klientlar BOOLEAN DEFAULT TRUE,
    
    -- Prioritet (bir nechta aksiya to'qnashganda)
    prioritet INTEGER DEFAULT 0,
    
    yaratilgan TIMESTAMPTZ DEFAULT NOW(),
    yangilangan TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aksiyalar_user ON aksiyalar(user_id);
CREATE INDEX IF NOT EXISTS idx_aksiyalar_faol ON aksiyalar(user_id, faol) WHERE faol = TRUE;

-- Aksiya-tovar bog'lanishi
CREATE TABLE IF NOT EXISTS aksiya_tovarlar (
    id SERIAL PRIMARY KEY,
    aksiya_id INTEGER NOT NULL REFERENCES aksiyalar(id) ON DELETE CASCADE,
    tovar_id INTEGER NOT NULL,
    UNIQUE(aksiya_id, tovar_id)
);

-- Aksiya-klient bog'lanishi
CREATE TABLE IF NOT EXISTS aksiya_klientlar (
    id SERIAL PRIMARY KEY,
    aksiya_id INTEGER NOT NULL REFERENCES aksiyalar(id) ON DELETE CASCADE,
    klient_id INTEGER NOT NULL,
    UNIQUE(aksiya_id, klient_id)
);

-- Aksiya-kategoriya bog'lanishi
CREATE TABLE IF NOT EXISTS aksiya_kategoriyalar (
    id SERIAL PRIMARY KEY,
    aksiya_id INTEGER NOT NULL REFERENCES aksiyalar(id) ON DELETE CASCADE,
    kategoriya_nomi VARCHAR(100) NOT NULL
);

-- Aksiya qo'llanish tarixi
CREATE TABLE IF NOT EXISTS aksiya_tarix (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    aksiya_id INTEGER NOT NULL,
    buyurtma_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL,
    asl_summa NUMERIC(18,2),
    chegirma_summa NUMERIC(18,2),
    yangi_summa NUMERIC(18,2),
    qollangan_vaqt TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aksiya_tarix_user ON aksiya_tarix(user_id, qollangan_vaqt DESC);
"""


# ════════════════════════════════════════════════════════════
#  AKSIYA HISOBLASH MOTORI
# ════════════════════════════════════════════════════════════

@dataclass
class AksiyaNatija:
    aksiya_id: int
    aksiya_nomi: str
    aksiya_turi: str
    asl_summa: Decimal
    chegirma_summa: Decimal
    yangi_summa: Decimal
    bonus_ball: Decimal = Decimal("0")
    hadya_tovarlar: list = None  # [{tovar_id, nomi, miqdor}]
    qoshimcha: str = ""

    def __post_init__(self):
        if self.hadya_tovarlar is None:
            self.hadya_tovarlar = []

    def to_dict(self) -> dict:
        return {
            "aksiya_id": self.aksiya_id,
            "aksiya_nomi": self.aksiya_nomi,
            "aksiya_turi": self.aksiya_turi,
            "asl_summa": str(self.asl_summa),
            "chegirma_summa": str(self.chegirma_summa),
            "yangi_summa": str(self.yangi_summa),
            "bonus_ball": str(self.bonus_ball),
            "hadya_tovarlar": self.hadya_tovarlar,
            "qoshimcha": self.qoshimcha,
        }


async def aksiyalar_hisoblash(
    conn, uid: int, klient_id: int,
    tovarlar: list[dict], jami_summa: Decimal
) -> list[dict]:
    """Buyurtma uchun barcha mos aksiyalarni hisoblash.

    SD Agent calculateDiscount + Smartup mcg_* analogi.

    Args:
        conn: DB connection
        uid: foydalanuvchi ID
        klient_id: klient ID
        tovarlar: [{tovar_id, miqdor, narx, summa, kategoriya}]
        jami_summa: buyurtma jami summasi

    Returns:
        [{aksiya_nomi, chegirma_summa, yangi_summa, bonus_ball, hadya_tovarlar}]
    """
    bugun = date.today()

    # Faol aksiyalarni olish
    aksiyalar = await conn.fetch("""
        SELECT a.*, 
            COALESCE(
                (SELECT array_agg(tovar_id) FROM aksiya_tovarlar WHERE aksiya_id = a.id),
                ARRAY[]::integer[]
            ) as tovar_idlar,
            COALESCE(
                (SELECT array_agg(klient_id) FROM aksiya_klientlar WHERE aksiya_id = a.id),
                ARRAY[]::integer[]
            ) as klient_idlar,
            COALESCE(
                (SELECT array_agg(kategoriya_nomi) FROM aksiya_kategoriyalar WHERE aksiya_id = a.id),
                ARRAY[]::varchar[]
            ) as kategoriyalar
        FROM aksiyalar a
        WHERE a.user_id = $1 AND a.faol = TRUE
            AND (a.boshlanish_sanasi IS NULL OR a.boshlanish_sanasi <= $2)
            AND (a.tugash_sanasi IS NULL OR a.tugash_sanasi >= $2)
        ORDER BY a.prioritet DESC, a.id
    """, uid, bugun)

    natijalar = []

    for aksiya in aksiyalar:
        # Klient filtri
        if not aksiya["barcha_klientlar"]:
            if klient_id not in (aksiya["klient_idlar"] or []):
                continue

        # Tovar filtri
        mos_tovarlar = tovarlar
        if not aksiya["barcha_tovarlar"]:
            aksiya_tovar_ids = set(aksiya["tovar_idlar"] or [])
            mos_tovarlar = [t for t in tovarlar if t.get("tovar_id") in aksiya_tovar_ids]
            if not mos_tovarlar:
                continue

        mos_summa = sum(Decimal(str(t.get("summa", 0))) for t in mos_tovarlar)
        mos_miqdor = sum(int(t.get("miqdor", 0)) for t in mos_tovarlar)

        # Min summa tekshiruvi
        if aksiya["min_summa"] and mos_summa < aksiya["min_summa"]:
            continue

        # Min miqdor tekshiruvi
        if aksiya["min_miqdor"] and mos_miqdor < aksiya["min_miqdor"]:
            continue

        # Max qo'llanish tekshiruvi
        if aksiya["max_qollash_soni"] and aksiya["max_qollash_soni"] > 0:
            qollanish_soni = await conn.fetchval(
                "SELECT COUNT(*) FROM aksiya_tarix WHERE aksiya_id=$1 AND klient_id=$2",
                aksiya["id"], klient_id,
            )
            if qollanish_soni >= aksiya["max_qollash_soni"]:
                continue

        # Aksiya turini hisoblash
        turi = aksiya["turi"]
        natija = None

        if turi == "foiz_chegirma":
            foiz = aksiya["chegirma_foiz"] or Decimal("0")
            chegirma = mos_summa * foiz / Decimal("100")
            natija = AksiyaNatija(
                aksiya_id=aksiya["id"], aksiya_nomi=aksiya["nomi"],
                aksiya_turi=turi, asl_summa=mos_summa,
                chegirma_summa=chegirma, yangi_summa=mos_summa - chegirma,
                qoshimcha=f"{foiz}% chegirma",
            )

        elif turi == "summa_chegirma":
            chegirma = min(aksiya["chegirma_summa"] or Decimal("0"), mos_summa)
            natija = AksiyaNatija(
                aksiya_id=aksiya["id"], aksiya_nomi=aksiya["nomi"],
                aksiya_turi=turi, asl_summa=mos_summa,
                chegirma_summa=chegirma, yangi_summa=mos_summa - chegirma,
                qoshimcha=f"{chegirma} so'm chegirma",
            )

        elif turi == "tovar_hadya":
            shart = aksiya["hadya_shart_miqdor"] or 0
            bepul = aksiya["hadya_bepul_miqdor"] or 0
            if shart > 0 and mos_miqdor >= shart:
                hadya_soni = (mos_miqdor // shart) * bepul
                natija = AksiyaNatija(
                    aksiya_id=aksiya["id"], aksiya_nomi=aksiya["nomi"],
                    aksiya_turi=turi, asl_summa=mos_summa,
                    chegirma_summa=Decimal("0"), yangi_summa=mos_summa,
                    qoshimcha=f"{shart} dona olganda {bepul} dona bepul ({hadya_soni} dona hadya)",
                    hadya_tovarlar=[{"miqdor": hadya_soni}],
                )

        elif turi == "bonus_ball":
            koef = aksiya["bonus_ball_koeffitsient"] or Decimal("0")
            ball = mos_summa * koef / Decimal("100")
            natija = AksiyaNatija(
                aksiya_id=aksiya["id"], aksiya_nomi=aksiya["nomi"],
                aksiya_turi=turi, asl_summa=mos_summa,
                chegirma_summa=Decimal("0"), yangi_summa=mos_summa,
                bonus_ball=ball,
                qoshimcha=f"{ball} bonus ball",
            )

        elif turi == "narx_tushirish":
            maxsus_narx = aksiya["maxsus_narx"] or Decimal("0")
            yangi_summa = sum(
                maxsus_narx * Decimal(str(t.get("miqdor", 0)))
                for t in mos_tovarlar
            )
            chegirma = mos_summa - yangi_summa
            if chegirma > 0:
                natija = AksiyaNatija(
                    aksiya_id=aksiya["id"], aksiya_nomi=aksiya["nomi"],
                    aksiya_turi=turi, asl_summa=mos_summa,
                    chegirma_summa=chegirma, yangi_summa=yangi_summa,
                    qoshimcha=f"Maxsus narx: {maxsus_narx} so'm",
                )

        elif turi == "min_summa":
            if jami_summa >= (aksiya["min_summa"] or Decimal("0")):
                foiz = aksiya["chegirma_foiz"] or Decimal("0")
                chegirma = jami_summa * foiz / Decimal("100")
                natija = AksiyaNatija(
                    aksiya_id=aksiya["id"], aksiya_nomi=aksiya["nomi"],
                    aksiya_turi=turi, asl_summa=jami_summa,
                    chegirma_summa=chegirma, yangi_summa=jami_summa - chegirma,
                    qoshimcha=f"{aksiya['min_summa']}+ so'mda {foiz}% chegirma",
                )

        if natija:
            natijalar.append(natija.to_dict())

    return natijalar


# ════════════════════════════════════════════════════════════
#  AKSIYA CRUD
# ════════════════════════════════════════════════════════════

async def aksiya_yaratish(conn, uid: int, data: dict) -> int:
    """Yangi aksiya yaratish."""
    aksiya_id = await conn.fetchval("""
        INSERT INTO aksiyalar (
            user_id, nomi, turi, faol,
            boshlanish_sanasi, tugash_sanasi,
            min_summa, min_miqdor, max_qollash_soni,
            chegirma_foiz, chegirma_summa, maxsus_narx,
            bonus_ball_koeffitsient,
            hadya_shart_miqdor, hadya_bepul_miqdor,
            barcha_tovarlar, barcha_klientlar, prioritet
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING id
    """,
        uid, data["nomi"], data["turi"], data.get("faol", True),
        data.get("boshlanish_sanasi"), data.get("tugash_sanasi"),
        Decimal(str(data.get("min_summa", 0))),
        data.get("min_miqdor", 0), data.get("max_qollash_soni", 0),
        Decimal(str(data.get("chegirma_foiz", 0))),
        Decimal(str(data.get("chegirma_summa", 0))),
        Decimal(str(data.get("maxsus_narx", 0))),
        Decimal(str(data.get("bonus_ball_koeffitsient", 0))),
        data.get("hadya_shart_miqdor", 0), data.get("hadya_bepul_miqdor", 0),
        data.get("barcha_tovarlar", True), data.get("barcha_klientlar", True),
        data.get("prioritet", 0),
    )

    # Tovar bog'lanishlari
    for tid in data.get("tovar_idlar", []):
        await conn.execute(
            "INSERT INTO aksiya_tovarlar (aksiya_id, tovar_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            aksiya_id, tid,
        )

    # Klient bog'lanishlari
    for kid in data.get("klient_idlar", []):
        await conn.execute(
            "INSERT INTO aksiya_klientlar (aksiya_id, klient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            aksiya_id, kid,
        )

    log.info("Aksiya yaratildi: id=%s nomi=%s turi=%s", aksiya_id, data["nomi"], data["turi"])
    return aksiya_id


async def aksiyalar_royxati(conn, uid: int, faqat_faol: bool = False) -> list[dict]:
    """Aksiyalar ro'yxatini olish."""
    query = "SELECT * FROM aksiyalar WHERE user_id = $1"
    if faqat_faol:
        query += " AND faol = TRUE"
    query += " ORDER BY prioritet DESC, id DESC"

    rows = await conn.fetch(query, uid)
    return [dict(r) for r in rows]


async def aksiya_holati(conn, uid: int, aksiya_id: int, faol: bool) -> dict:
    """Aksiyani yoqish/o'chirish."""
    await conn.execute(
        "UPDATE aksiyalar SET faol=$1, yangilangan=NOW() WHERE id=$2 AND user_id=$3",
        faol, aksiya_id, uid,
    )
    return {"muvaffaqiyat": True, "faol": faol}
