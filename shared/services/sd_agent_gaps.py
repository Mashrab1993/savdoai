"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — SD AGENT / SMARTUP YAKUNIY GAPLAR TO'LDIRISH         ║
║                                                                          ║
║  SD Agent 182,000 qatordan HALI olinmagan 10 ta xususiyat:              ║
║                                                                          ║
║  ╔════════════════════════════════════════════════════════════╗          ║
║  ║  1. DONA + BLOK TIZIMI (countPcs + countBlocks)           ║          ║
║  ║     ► Tovar dona va qadoq (blok) bo'yicha sotish          ║          ║
║  ║     ► 1 blok = 12 dona (packQuantity)                     ║          ║
║  ║     ► sumPcs + sumBlocks alohida hisoblash                 ║          ║
║  ║                                                            ║          ║
║  ║  2. TARA (IDISH) BOSHQARUVI                               ║          ║
║  ║     ► Qaytariladigan idishlarni kuzatish                   ║          ║
║  ║     ► Klientga berildi / Qaytarildi / Yo'qoldi            ║          ║
║  ║     ► TaraProductType → idish turlari                      ║          ║
║  ║                                                            ║          ║
║  ║  3. ODDMENT (QOLDIQ TEKSHIRISH)                            ║          ║
║  ║     ► Agent klientda fizik inventarizatsiya                ║          ║
║  ║     ► totalPcs + totalBlocks bo'yicha hisoblash            ║          ║
║  ║     ► Farq = DB qoldiq - fizik qoldiq                      ║          ║
║  ║                                                            ║          ║
║  ║  4. ALMASHTIRISH BUYURTMASI (Replacement)                 ║          ║
║  ║     ► Defektli tovarni yangi bilan almashtirish            ║          ║
║  ║     ► Foto talab qilinadi (defekt isboti)                  ║          ║
║  ║                                                            ║          ║
║  ║  5. KLIENT TOVAR KATEGORIYA CHEKLOVI                       ║          ║
║  ║     ► salesCategoriesList — klient faqat ruxsat             ║          ║
║  ║       etilgan kategoriya tovarlarni ko'radi                ║          ║
║  ║                                                            ║          ║
║  ║  6. JUFT/TOQ HAFTA TASHRIFI (weekType)                     ║          ║
║  ║     ► Klient faqat juft yoki toq haftalarda                ║          ║
║  ║       tashrifga rejalashtiriladi                           ║          ║
║  ║                                                            ║          ║
║  ║  7. KLIENT QR KOD                                          ║          ║
║  ║     ► Har klientga unikal QR yaratish                      ║          ║
║  ║     ► Scanlab darhol klient profilini ochish               ║          ║
║  ║                                                            ║          ║
║  ║  8. BILIMLAR BAZASI (Knowledge Base)                       ║          ║
║  ║     ► Agent ta'lim materiallari                            ║          ║
║  ║     ► Savol-javob, qo'llanma, video                       ║          ║
║  ║                                                            ║          ║
║  ║  9. SERVER CHEGIRMA TEKSHIRISH (CheckDiscount)             ║          ║
║  ║     ► Chegirmani server tasdiqlaydi                        ║          ║
║  ║     ► Agentning o'zboshimchalik chegirmasi oldini olish    ║          ║
║  ║                                                            ║          ║
║  ║  10. TASHRIF TURLARI (11 ta VisitingType)                  ║          ║
║  ║     ► order, replacement, refund, oddment, payment,        ║          ║
║  ║       photo, survey, task, equipment, tara, other          ║          ║
║  ╚════════════════════════════════════════════════════════════╝          ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import uuid
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

log = logging.getLogger(__name__)
def D(v):
    return Decimal(str(v or 0)).quantize(Decimal("0.01"), ROUND_HALF_UP)

# ════════════════════════════════════════════════════════════
#  MIGRATION SQL
# ════════════════════════════════════════════════════════════

SD_AGENT_GAPS_MIGRATION = """
-- ═══ 1. DONA + BLOK ═══
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS blok_hajmi INTEGER DEFAULT 1;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS blok_narx NUMERIC(18,2) DEFAULT 0;
ALTER TABLE chiqimlar ADD COLUMN IF NOT EXISTS miqdor_dona NUMERIC(12,2) DEFAULT 0;
ALTER TABLE chiqimlar ADD COLUMN IF NOT EXISTS miqdor_blok NUMERIC(12,2) DEFAULT 0;

-- ═══ 2. TARA (IDISH) ═══
CREATE TABLE IF NOT EXISTS tara_turlari (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    nomi VARCHAR(200) NOT NULL, faol BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS tara_harakatlar (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL, tara_turi_id INTEGER NOT NULL,
    turi VARCHAR(20) NOT NULL,  -- berildi, qaytarildi, yoqoldi
    miqdor INTEGER NOT NULL DEFAULT 0,
    izoh TEXT, sana TIMESTAMPTZ DEFAULT NOW(),
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_tara_klient ON tara_harakatlar(user_id, klient_id);

-- ═══ 3. ODDMENT ═══
CREATE TABLE IF NOT EXISTS oddment (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL, sana TIMESTAMPTZ DEFAULT NOW(),
    jami_tovar INTEGER DEFAULT 0, izoh TEXT
);
CREATE TABLE IF NOT EXISTS oddment_tovarlar (
    id SERIAL PRIMARY KEY, oddment_id INTEGER NOT NULL,
    tovar_id INTEGER NOT NULL, tovar_nomi VARCHAR(200),
    db_qoldiq NUMERIC(12,2) DEFAULT 0,
    fizik_qoldiq NUMERIC(12,2) DEFAULT 0,
    farq NUMERIC(12,2) DEFAULT 0
);

-- ═══ 4. ALMASHTIRISH ═══
CREATE TABLE IF NOT EXISTS almashtirishlar (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL, sababi TEXT,
    eski_tovar_id INTEGER, eski_tovar_nomi VARCHAR(200), eski_miqdor NUMERIC(12,2),
    yangi_tovar_id INTEGER, yangi_tovar_nomi VARCHAR(200), yangi_miqdor NUMERIC(12,2),
    foto_url TEXT, holat VARCHAR(20) DEFAULT 'yangi',
    sana TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 5. KLIENT KATEGORIYA CHEKLOVI ═══
CREATE TABLE IF NOT EXISTS klient_kategoriya_ruxsat (
    id SERIAL PRIMARY KEY,
    klient_id INTEGER NOT NULL, kategoriya VARCHAR(100) NOT NULL,
    UNIQUE(klient_id, kategoriya)
);

-- ═══ 6. JUFT/TOQ HAFTA ═══
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS hafta_turi VARCHAR(10) DEFAULT 'har';
  -- har = har hafta, juft = faqat juft, toq = faqat toq

-- ═══ 7. KLIENT QR KOD ═══
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS qr_kod VARCHAR(100) UNIQUE;

-- ═══ 8. BILIMLAR BAZASI ═══
CREATE TABLE IF NOT EXISTS bilimlar_bazasi (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    sarlavha VARCHAR(300) NOT NULL, matn TEXT,
    kategoriya VARCHAR(100), turi VARCHAR(20) DEFAULT 'maqola',
    fayl_url TEXT, video_url TEXT,
    tartib INTEGER DEFAULT 0, faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 9. CHEGIRMA TEKSHIRISH LOG ═══
CREATE TABLE IF NOT EXISTS chegirma_tekshirish (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    sotuv_id INTEGER, klient_id INTEGER,
    soralgan_chegirma NUMERIC(5,2), tasdiqlangan_chegirma NUMERIC(5,2),
    holat VARCHAR(20) DEFAULT 'kutilmoqda',
    sana TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 10. TASHRIF TURLARI ═══
ALTER TABLE checkin_out ADD COLUMN IF NOT EXISTS tashrif_turi VARCHAR(30) DEFAULT 'other';
"""


# ════════════════════════════════════════════════════════════
#  1. DONA + BLOK HISOBLASH
# ════════════════════════════════════════════════════════════

TASHRIF_TURLARI = {
    "order": "Buyurtma",
    "replacement": "Almashtirish",
    "refund": "Qaytarish",
    "oddment": "Qoldiq tekshirish",
    "payment": "To'lov yig'ish",
    "photo": "Foto olish",
    "survey": "So'rovnoma",
    "task": "Topshiriq",
    "equipment": "Uskuna tekshirish",
    "tara": "Idish qaytarish",
    "other": "Boshqa",
}


async def dona_blok_hisoblash(conn, tovar_id: int, miqdor_dona: float = 0,
                                miqdor_blok: float = 0) -> dict:
    """SD Agent countPcs + countBlocks analogi.

    Agar 1 blok = 12 dona bo'lsa:
    - 2 blok + 3 dona = 27 dona jami
    - Narx: blok narx * 2 + dona narx * 3
    """
    row = await conn.fetchrow(
        "SELECT sotish_narxi AS sotuv_narx, blok_hajmi, blok_narx "
        "FROM tovarlar WHERE id=$1", tovar_id)
    if not row:
        return {"xato": "Tovar topilmadi"}

    dona_narx = D(row["sotuv_narx"])
    blok_hajmi = max(row.get("blok_hajmi") or 1, 1)
    blok_narx = D(row.get("blok_narx") or (dona_narx * blok_hajmi))

    jami_dona = miqdor_dona + (miqdor_blok * blok_hajmi)
    jami_summa = (D(str(miqdor_dona)) * dona_narx) + (D(str(miqdor_blok)) * blok_narx)

    return {
        "tovar_id": tovar_id,
        "miqdor_dona": miqdor_dona,
        "miqdor_blok": miqdor_blok,
        "blok_hajmi": blok_hajmi,
        "jami_dona": jami_dona,
        "dona_narx": str(dona_narx),
        "blok_narx": str(blok_narx),
        "jami_summa": str(jami_summa),
    }


# ════════════════════════════════════════════════════════════
#  2. TARA (IDISH) BOSHQARUVI
# ════════════════════════════════════════════════════════════

async def tara_harakat(conn, uid: int, klient_id: int, tara_turi_id: int,
                        turi: str, miqdor: int, izoh: str = "",
                        lat: float = None, lon: float = None) -> int:
    """Tara harakati: berildi / qaytarildi / yoqoldi."""
    return await conn.fetchval("""
        INSERT INTO tara_harakatlar (user_id, klient_id, tara_turi_id, turi, miqdor, izoh, latitude, longitude)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id
    """, uid, klient_id, tara_turi_id, turi, miqdor, izoh, lat, lon)


async def klient_tara_qoldiq(conn, uid: int, klient_id: int) -> list[dict]:
    """Klientdagi tara qoldiqlari."""
    rows = await conn.fetch("""
        SELECT tt.nomi AS tara_nomi, tt.id AS tara_turi_id,
            COALESCE(SUM(CASE WHEN th.turi='berildi' THEN th.miqdor ELSE 0 END), 0) AS berilgan,
            COALESCE(SUM(CASE WHEN th.turi='qaytarildi' THEN th.miqdor ELSE 0 END), 0) AS qaytarilgan,
            COALESCE(SUM(CASE WHEN th.turi='yoqoldi' THEN th.miqdor ELSE 0 END), 0) AS yoqolgan
        FROM tara_turlari tt
        LEFT JOIN tara_harakatlar th ON th.tara_turi_id=tt.id AND th.klient_id=$2 AND th.user_id=$1
        WHERE tt.user_id=$1
        GROUP BY tt.id, tt.nomi
    """, uid, klient_id)
    return [{"tara_nomi": r["tara_nomi"], "tara_turi_id": r["tara_turi_id"],
             "berilgan": r["berilgan"], "qaytarilgan": r["qaytarilgan"],
             "yoqolgan": r["yoqolgan"],
             "klientda_bor": r["berilgan"] - r["qaytarilgan"] - r["yoqolgan"],
    } for r in rows]


# ════════════════════════════════════════════════════════════
#  3. ODDMENT (QOLDIQ TEKSHIRISH)
# ════════════════════════════════════════════════════════════

async def oddment_yaratish(conn, uid: int, klient_id: int,
                            tovarlar: list[dict]) -> dict:
    """Agent klientda fizik inventarizatsiya o'tkazadi.

    Args:
        tovarlar: [{"tovar_id": 5, "fizik_qoldiq": 10}, ...]

    Returns:
        {id, farqlar: [{tovar_nomi, db_qoldiq, fizik_qoldiq, farq}]}
    """
    oddment_id = await conn.fetchval(
        "INSERT INTO oddment (user_id, klient_id, jami_tovar) VALUES ($1,$2,$3) RETURNING id",
        uid, klient_id, len(tovarlar))

    farqlar = []
    for t in tovarlar:
        # DB dagi qoldiq
        db_row = await conn.fetchrow(
            "SELECT nomi, qoldiq FROM tovarlar WHERE id=$1 AND user_id=$2",
            t["tovar_id"], uid)
        if not db_row:
            continue
        db_qoldiq = float(db_row["qoldiq"] or 0)
        fizik = float(t.get("fizik_qoldiq", 0))
        farq = db_qoldiq - fizik

        await conn.execute("""
            INSERT INTO oddment_tovarlar (oddment_id, tovar_id, tovar_nomi, db_qoldiq, fizik_qoldiq, farq)
            VALUES ($1,$2,$3,$4,$5,$6)
        """, oddment_id, t["tovar_id"], db_row["nomi"], db_qoldiq, fizik, farq)

        if abs(farq) > 0.01:
            farqlar.append({
                "tovar_nomi": db_row["nomi"],
                "db_qoldiq": db_qoldiq,
                "fizik_qoldiq": fizik,
                "farq": farq,
                "holat": "ortiqcha" if farq < 0 else "kam",
            })

    return {
        "id": oddment_id,
        "klient_id": klient_id,
        "jami_tekshirildi": len(tovarlar),
        "farq_bor": len(farqlar),
        "farqlar": farqlar,
    }


# ════════════════════════════════════════════════════════════
#  4. ALMASHTIRISH BUYURTMASI (Replacement)
# ════════════════════════════════════════════════════════════

async def almashtirish_yaratish(conn, uid: int, data: dict) -> int:
    """Defektli tovarni yangisi bilan almashtirish."""
    # Eski tovarni qaytarish (qoldiq oshadi)
    if data.get("eski_tovar_id") and data.get("eski_miqdor"):
        await conn.execute(
            "UPDATE tovarlar SET qoldiq = qoldiq + $1 WHERE id=$2 AND user_id=$3",
            Decimal(str(data["eski_miqdor"])), data["eski_tovar_id"], uid)

    # Yangi tovarni berish (qoldiq kamayadi)
    if data.get("yangi_tovar_id") and data.get("yangi_miqdor"):
        await conn.execute(
            "UPDATE tovarlar SET qoldiq = qoldiq - $1 WHERE id=$2 AND user_id=$3",
            Decimal(str(data["yangi_miqdor"])), data["yangi_tovar_id"], uid)

    return await conn.fetchval("""
        INSERT INTO almashtirishlar
            (user_id, klient_id, sababi, eski_tovar_id, eski_tovar_nomi, eski_miqdor,
             yangi_tovar_id, yangi_tovar_nomi, yangi_miqdor, foto_url)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id
    """, uid, data["klient_id"], data.get("sababi", ""),
        data.get("eski_tovar_id"), data.get("eski_tovar_nomi"), data.get("eski_miqdor"),
        data.get("yangi_tovar_id"), data.get("yangi_tovar_nomi"), data.get("yangi_miqdor"),
        data.get("foto_url"))


# ════════════════════════════════════════════════════════════
#  5. KLIENT KATEGORIYA CHEKLOVI
# ════════════════════════════════════════════════════════════

async def klient_ruxsat_kategoriyalar(conn, klient_id: int) -> list[str]:
    """Bu klient qaysi kategoriya tovarlarni sotib olishi mumkin."""
    rows = await conn.fetch(
        "SELECT kategoriya FROM klient_kategoriya_ruxsat WHERE klient_id=$1", klient_id)
    return [r["kategoriya"] for r in rows]  # Bo'sh = BARCHASI ruxsat


async def klient_uchun_tovarlar(conn, uid: int, klient_id: int) -> list[dict]:
    """Klientga ruxsat etilgan tovarlar ro'yxati."""
    ruxsat = await klient_ruxsat_kategoriyalar(conn, klient_id)

    if ruxsat:
        rows = await conn.fetch("""
            SELECT * FROM tovarlar WHERE user_id=$1 AND faol=TRUE
            AND kategoriya = ANY($2) ORDER BY nomi
        """, uid, ruxsat)
    else:
        rows = await conn.fetch(
            "SELECT * FROM tovarlar WHERE user_id=$1 AND faol=TRUE ORDER BY nomi", uid)
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════
#  6. JUFT/TOQ HAFTA HISOBLASH
# ════════════════════════════════════════════════════════════

def hozirgi_hafta_turi() -> str:
    """Hozirgi hafta juft yoki toq ekanligini aniqlash."""
    hafta_raqami = date.today().isocalendar()[1]
    return "juft" if hafta_raqami % 2 == 0 else "toq"


async def bugungi_klientlar_juft_toq(conn, uid: int) -> list[dict]:
    """Juft/toq hafta hisobga olib bugungi klientlarni qaytarish."""
    haftakun = date.today().weekday()
    turi = hozirgi_hafta_turi()

    rows = await conn.fetch("""
        SELECT k.id, k.ism AS nom, k.telefon, k.manzil, k.hafta_turi
        FROM klientlar k
        JOIN tashrif_jadvali tj ON tj.klient_id = k.id AND tj.user_id = k.user_id
        WHERE k.user_id = $1
          AND tj.hafta_kuni = $2
          AND (k.hafta_turi = 'har' OR k.hafta_turi = $3)
        ORDER BY k.ism
    """, uid, haftakun, turi)
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════
#  7. KLIENT QR KOD
# ════════════════════════════════════════════════════════════

async def klient_qr_yaratish(conn, uid: int, klient_id: int) -> str:
    """Klientga unikal QR kod yaratish."""
    qr = f"SAVDOAI-{uid}-{klient_id}-{uuid.uuid4().hex[:8].upper()}"
    await conn.execute(
        "UPDATE klientlar SET qr_kod=$1 WHERE id=$2 AND user_id=$3", qr, klient_id, uid)
    return qr


async def klient_qr_topish(conn, uid: int, qr_kod: str) -> dict | None:
    """QR kod bo'yicha klientni topish."""
    row = await conn.fetchrow(
        "SELECT * FROM klientlar WHERE qr_kod=$1 AND user_id=$2", qr_kod, uid)
    return dict(row) if row else None


# ════════════════════════════════════════════════════════════
#  8. BILIMLAR BAZASI
# ════════════════════════════════════════════════════════════

async def bilimlar_royxati(conn, uid: int, kategoriya: str = None) -> list[dict]:
    query = "SELECT * FROM bilimlar_bazasi WHERE user_id=$1 AND faol=TRUE"
    params = [uid]
    if kategoriya:
        query += " AND kategoriya=$2"; params.append(kategoriya)
    query += " ORDER BY tartib, yaratilgan DESC"
    return [dict(r) for r in await conn.fetch(query, *params)]


async def bilim_yaratish(conn, uid: int, data: dict) -> int:
    return await conn.fetchval("""
        INSERT INTO bilimlar_bazasi (user_id, sarlavha, matn, kategoriya, turi, fayl_url, video_url)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id
    """, uid, data["sarlavha"], data.get("matn", ""), data.get("kategoriya"),
        data.get("turi", "maqola"), data.get("fayl_url"), data.get("video_url"))


# ════════════════════════════════════════════════════════════
#  9. SERVER CHEGIRMA TEKSHIRISH
# ════════════════════════════════════════════════════════════

async def chegirma_tekshir(conn, uid: int, klient_id: int,
                            soralgan_foiz: float) -> dict:
    """Server tomonidan chegirma tasdiqlash.
    Max chegirma config dan olinadi. Agentning o'zboshimchaligi oldini oladi.
    """
    from shared.services.server_config import config_olish
    config = await config_olish(conn, uid, "buyurtma")
    max_chegirma = float(config.get("max_chegirma", 15))

    if soralgan_foiz > max_chegirma:
        tasdiqlangan = max_chegirma
        holat = "qisman"
    else:
        tasdiqlangan = soralgan_foiz
        holat = "tasdiqlandi"

    await conn.execute("""
        INSERT INTO chegirma_tekshirish (user_id, klient_id, soralgan_chegirma, tasdiqlangan_chegirma, holat)
        VALUES ($1,$2,$3,$4,$5)
    """, uid, klient_id, soralgan_foiz, tasdiqlangan, holat)

    return {
        "soralgan": soralgan_foiz,
        "tasdiqlangan": tasdiqlangan,
        "max_ruxsat": max_chegirma,
        "holat": holat,
        "xabar": f"✅ {tasdiqlangan}% chegirma tasdiqlandi" if holat == "tasdiqlandi"
                 else f"⚠️ Max {max_chegirma}% — {tasdiqlangan}% tasdiqlandi"
    }
