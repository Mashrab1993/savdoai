"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — SD AGENT + SMARTUP GAPS TO'LDIRISH                   ║
║                                                                          ║
║  SD Agent'da BOR, SavdoAI'da YO'Q bo'lgan 5 ta modul:                  ║
║                                                                          ║
║  1. TASK MANAGEMENT — topshiriq berish/bajarish/kuzatish                ║
║     SD Agent Task.java (420 qator) analogi                              ║
║                                                                          ║
║  2. FOTO TIZIMI — foto olish, yuklash, klient/tovar/vitrina            ║
║     SD Agent photo/set, photo/category analogi                          ║
║                                                                          ║
║  3. USKUNA KUZATISH — muzlatgich, javon, stend boshqaruvi              ║
║     SD Agent ClientEquipment.java (326 qator) analogi                   ║
║                                                                          ║
║  4. MULTI-FILIAL — ko'p filial/ombor boshqaruvi                        ║
║     Smartup mrf_filials analogi                                          ║
║                                                                          ║
║  5. KUNLIK KASSA — agent kunlik pul oqimi                              ║
║     SD Agent DayTransaction analogi                                      ║
║                                                                          ║
║  Bu modul bilan SavdoAI SD Agent + Smartup'dan OLDINGA o'tadi!          ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional

log = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════
#  DB MIGRATION — barcha yangi jadvallar
# ════════════════════════════════════════════════════════════

ENTERPRISE_MIGRATION_SQL = """
-- ═══ 1. TASK MANAGEMENT ═══
CREATE TABLE IF NOT EXISTS topshiriqlar (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    agent_id INTEGER,
    klient_id INTEGER,
    sarlavha VARCHAR(300) NOT NULL,
    tavsif TEXT,
    turi VARCHAR(30) DEFAULT 'umumiy',  -- umumiy, sotuv, qarz_yigish, foto, tashrif, ombor
    muhimlik VARCHAR(10) DEFAULT 'oddiy',  -- past, oddiy, yuqori, kritik
    holat VARCHAR(20) DEFAULT 'yangi',  -- yangi, jarayonda, bajarildi, bekor
    muddat DATE,
    bajarilgan_vaqt TIMESTAMPTZ,
    natija TEXT,
    foto_url TEXT,
    yaratilgan TIMESTAMPTZ DEFAULT NOW(),
    yaratuvchi VARCHAR(50) DEFAULT 'admin'
);
CREATE INDEX IF NOT EXISTS idx_topshiriq_user ON topshiriqlar(user_id, holat);
CREATE INDEX IF NOT EXISTS idx_topshiriq_agent ON topshiriqlar(agent_id, holat);

-- ═══ 2. FOTO TIZIMI ═══
CREATE TABLE IF NOT EXISTS fotolar (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    turi VARCHAR(30) NOT NULL,  -- klient, tovar, vitrina, akt, topshiriq, checkin
    bog_id INTEGER,  -- klient_id, tovar_id, topshiriq_id ...
    fayl_nomi VARCHAR(300),
    fayl_url TEXT NOT NULL,
    fayl_hajmi INTEGER DEFAULT 0,
    kenglik INTEGER,
    balandlik INTEGER,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    izoh TEXT,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_foto_user ON fotolar(user_id, turi, bog_id);

-- ═══ 3. USKUNA KUZATISH (SD Agent ClientEquipment) ═══
CREATE TABLE IF NOT EXISTS uskunalar (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL,
    nomi VARCHAR(200) NOT NULL,
    turi VARCHAR(50),  -- muzlatgich, javon, stend, banner, tablo
    seriya_raqami VARCHAR(100),
    inventar_raqami VARCHAR(100),
    holat VARCHAR(20) DEFAULT 'faol',  -- faol, tamirda, qaytarildi, yoqoldi
    olingan_sana DATE,
    qaytarilgan_sana DATE,
    foto_url TEXT,
    izoh TEXT,
    oxirgi_tekshirish TIMESTAMPTZ,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_uskuna_klient ON uskunalar(user_id, klient_id);

-- ═══ 4. MULTI-FILIAL ═══
CREATE TABLE IF NOT EXISTS filiallar (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    nomi VARCHAR(200) NOT NULL,
    manzil TEXT,
    telefon VARCHAR(20),
    turi VARCHAR(20) DEFAULT 'dokon',  -- dokon, ombor, ofis
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    bosh_filial BOOLEAN DEFAULT FALSE,
    faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_filial_user ON filiallar(user_id);

-- Filialga biriktirilgan tovarlar (ombor qoldig'i filial bo'yicha)
CREATE TABLE IF NOT EXISTS filial_qoldiq (
    id SERIAL PRIMARY KEY,
    filial_id INTEGER NOT NULL REFERENCES filiallar(id),
    tovar_id INTEGER NOT NULL,
    qoldiq NUMERIC(12,2) DEFAULT 0,
    min_qoldiq NUMERIC(12,2) DEFAULT 0,
    UNIQUE(filial_id, tovar_id)
);

-- ═══ 5. KUNLIK KASSA ═══
CREATE TABLE IF NOT EXISTS kunlik_kassa (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    sana DATE NOT NULL DEFAULT CURRENT_DATE,
    boshlangich_qoldiq NUMERIC(18,2) DEFAULT 0,
    naqd_kirim NUMERIC(18,2) DEFAULT 0,
    karta_kirim NUMERIC(18,2) DEFAULT 0,
    qarz_yigildi NUMERIC(18,2) DEFAULT 0,
    xarajat NUMERIC(18,2) DEFAULT 0,
    inkassa NUMERIC(18,2) DEFAULT 0,
    yakuniy_qoldiq NUMERIC(18,2) DEFAULT 0,
    yopilgan BOOLEAN DEFAULT FALSE,
    izoh TEXT,
    UNIQUE(user_id, sana)
);
CREATE INDEX IF NOT EXISTS idx_kassa_user ON kunlik_kassa(user_id, sana DESC);
"""


# ════════════════════════════════════════════════════════════
#  1. TASK MANAGEMENT
# ════════════════════════════════════════════════════════════

async def topshiriq_yaratish(conn, uid: int, data: dict) -> int:
    """Yangi topshiriq yaratish. SD Agent Task analog."""
    return await conn.fetchval("""
        INSERT INTO topshiriqlar (user_id, agent_id, klient_id, sarlavha, tavsif, turi, muhimlik, muddat, yaratuvchi)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9) RETURNING id
    """, uid, data.get("agent_id"), data.get("klient_id"),
        data["sarlavha"], data.get("tavsif", ""),
        data.get("turi", "umumiy"), data.get("muhimlik", "oddiy"),
        data.get("muddat"), data.get("yaratuvchi", "admin"))


async def topshiriq_holat(conn, uid: int, topshiriq_id: int,
                           holat: str, natija: str = None) -> dict:
    """Topshiriq holatini yangilash."""
    if holat == "bajarildi":
        await conn.execute("""
            UPDATE topshiriqlar SET holat=$1, natija=$2, bajarilgan_vaqt=NOW()
            WHERE id=$3 AND user_id=$4
        """, holat, natija, topshiriq_id, uid)
    else:
        await conn.execute(
            "UPDATE topshiriqlar SET holat=$1 WHERE id=$2 AND user_id=$3",
            holat, topshiriq_id, uid)
    return {"muvaffaqiyat": True}


async def topshiriqlar_royxati(conn, uid: int, holat: str = None,
                                 agent_id: int = None) -> list[dict]:
    """Topshiriqlar ro'yxati."""
    query = "SELECT t.*, k.ism as klient_nomi FROM topshiriqlar t LEFT JOIN klientlar k ON k.id=t.klient_id WHERE t.user_id=$1"
    params = [uid]
    idx = 2
    if holat:
        query += f" AND t.holat=${idx}"; params.append(holat); idx += 1
    if agent_id:
        query += f" AND t.agent_id=${idx}"; params.append(agent_id); idx += 1
    query += " ORDER BY CASE t.muhimlik WHEN 'kritik' THEN 0 WHEN 'yuqori' THEN 1 WHEN 'oddiy' THEN 2 ELSE 3 END, t.muddat ASC NULLS LAST"
    rows = await conn.fetch(query, *params)
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════
#  2. FOTO TIZIMI
# ════════════════════════════════════════════════════════════

async def foto_saqlash(conn, uid: int, turi: str, bog_id: int,
                        fayl_url: str, **kwargs) -> int:
    """Foto ma'lumotlarini saqlash."""
    return await conn.fetchval("""
        INSERT INTO fotolar (user_id, turi, bog_id, fayl_url, fayl_nomi, fayl_hajmi,
            kenglik, balandlik, latitude, longitude, izoh)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id
    """, uid, turi, bog_id, fayl_url,
        kwargs.get("fayl_nomi"), kwargs.get("fayl_hajmi", 0),
        kwargs.get("kenglik"), kwargs.get("balandlik"),
        kwargs.get("latitude"), kwargs.get("longitude"),
        kwargs.get("izoh"))


async def foto_royxati(conn, uid: int, turi: str = None,
                        bog_id: int = None) -> list[dict]:
    """Fotolar ro'yxati."""
    query = "SELECT * FROM fotolar WHERE user_id=$1"
    params = [uid]
    idx = 2
    if turi:
        query += f" AND turi=${idx}"; params.append(turi); idx += 1
    if bog_id:
        query += f" AND bog_id=${idx}"; params.append(bog_id); idx += 1
    query += " ORDER BY yaratilgan DESC LIMIT 100"
    return [dict(r) for r in await conn.fetch(query, *params)]


# ════════════════════════════════════════════════════════════
#  3. USKUNA KUZATISH
# ════════════════════════════════════════════════════════════

async def uskuna_yaratish(conn, uid: int, data: dict) -> int:
    return await conn.fetchval("""
        INSERT INTO uskunalar (user_id, klient_id, nomi, turi, seriya_raqami,
            inventar_raqami, olingan_sana, foto_url, izoh)
        VALUES ($1,$2,$3,$4,$5,$6,$7::date,$8,$9) RETURNING id
    """, uid, data["klient_id"], data["nomi"], data.get("turi", "muzlatgich"),
        data.get("seriya_raqami"), data.get("inventar_raqami"),
        data.get("olingan_sana"), data.get("foto_url"), data.get("izoh"))


async def uskuna_holat(conn, uid: int, uskuna_id: int, holat: str) -> dict:
    await conn.execute(
        "UPDATE uskunalar SET holat=$1, oxirgi_tekshirish=NOW() WHERE id=$2 AND user_id=$3",
        holat, uskuna_id, uid)
    return {"muvaffaqiyat": True}


async def klient_uskunalari(conn, uid: int, klient_id: int) -> list[dict]:
    rows = await conn.fetch(
        "SELECT * FROM uskunalar WHERE user_id=$1 AND klient_id=$2 ORDER BY yaratilgan DESC",
        uid, klient_id)
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════
#  4. MULTI-FILIAL
# ════════════════════════════════════════════════════════════

async def filial_yaratish(conn, uid: int, data: dict) -> int:
    return await conn.fetchval("""
        INSERT INTO filiallar (user_id, nomi, manzil, telefon, turi, latitude, longitude, bosh_filial)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id
    """, uid, data["nomi"], data.get("manzil"), data.get("telefon"),
        data.get("turi", "dokon"), data.get("latitude"), data.get("longitude"),
        data.get("bosh_filial", False))


async def filiallar_royxati(conn, uid: int) -> list[dict]:
    rows = await conn.fetch(
        "SELECT * FROM filiallar WHERE user_id=$1 ORDER BY bosh_filial DESC, nomi", uid)
    return [dict(r) for r in rows]


async def filial_qoldiq_yangilash(conn, filial_id: int, tovar_id: int, qoldiq: float):
    await conn.execute("""
        INSERT INTO filial_qoldiq (filial_id, tovar_id, qoldiq)
        VALUES ($1, $2, $3)
        ON CONFLICT (filial_id, tovar_id) DO UPDATE SET qoldiq = $3
    """, filial_id, tovar_id, Decimal(str(qoldiq)))


async def filial_qoldiqlari(conn, filial_id: int) -> list[dict]:
    rows = await conn.fetch("""
        SELECT fq.*, t.nomi as tovar_nomi FROM filial_qoldiq fq
        JOIN tovarlar t ON t.id = fq.tovar_id
        WHERE fq.filial_id = $1 ORDER BY t.nomi
    """, filial_id)
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════
#  5. KUNLIK KASSA
# ════════════════════════════════════════════════════════════

async def kunlik_kassa_hisoblash(conn, uid: int, sana: str = None) -> dict:
    """Agent kunlik kassasini hisoblash. SD Agent DayTransaction analog."""
    if not sana:
        sana = date.today().isoformat()

    # Sotuvlardan kirimlar — hozircha tolov_turi yo'q, hammasi naqd deb olinadi
    kirim = await conn.fetchrow("""
        SELECT
            COALESCE(SUM(tolangan), 0) AS naqd,
            COALESCE(SUM(tolangan), 0) AS jami_tolangan
        FROM sotuv_sessiyalar
        WHERE user_id = $1
          AND (sana AT TIME ZONE 'Asia/Tashkent')::date = $2::date
    """, uid, sana) or {}

    # Qarz yig'ildi — qarzlar.tolangan davr ichida yangilangan
    qarz_kirim = await conn.fetchval("""
        SELECT COALESCE(SUM(tolangan), 0) FROM qarzlar
        WHERE user_id = $1 AND yopildi
          AND (yangilangan AT TIME ZONE 'Asia/Tashkent')::date = $2::date
    """, uid, sana) or Decimal("0")

    # Xarajatlar — admin_uid va bekor_qilingan filtri
    xarajat = await conn.fetchval("""
        SELECT COALESCE(SUM(summa), 0) FROM xarajatlar
        WHERE admin_uid = $1 AND NOT bekor_qilingan
          AND (sana AT TIME ZONE 'Asia/Tashkent')::date = $2::date
    """, uid, sana) or Decimal("0")

    naqd = Decimal(str(kirim.get("naqd", 0)))
    karta = Decimal("0")  # tolov_turi kiritilgandan keyin ishlaydi
    yakuniy = naqd + Decimal(str(qarz_kirim)) - Decimal(str(xarajat))

    # Saqlash
    await conn.execute("""
        INSERT INTO kunlik_kassa (user_id, sana, naqd_kirim, karta_kirim, qarz_yigildi, xarajat, yakuniy_qoldiq)
        VALUES ($1, $2::date, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, sana) DO UPDATE SET
            naqd_kirim=$3, karta_kirim=$4, qarz_yigildi=$5, xarajat=$6, yakuniy_qoldiq=$7
    """, uid, sana, naqd, karta, qarz_kirim, xarajat, yakuniy)

    return {
        "sana": sana,
        "naqd_kirim": str(naqd),
        "karta_kirim": str(karta),
        "qarz_yigildi": str(qarz_kirim),
        "xarajat": str(xarajat),
        "yakuniy_qoldiq": str(yakuniy),
        "jami_kirim": str(naqd + karta + Decimal(str(qarz_kirim))),
    }
