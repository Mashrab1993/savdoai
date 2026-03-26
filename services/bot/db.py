"""
╔══════════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA — MA'LUMOTLAR BAZASI                             ║
║                                                                  ║
║  TUZILMA:                                                        ║
║  § 1. Import va sozlamalar                                       ║
║  § 2. Schema (jadvallar)                                         ║
║  § 3. Ulanish (pool)                                             ║
║  § 4. Yordamchi funksiyalar                                      ║
║  § 5. Foydalanuvchilar                                           ║
║  § 6. Klientlar                                                  ║
║  § 7. Tovarlar                                                   ║
║  § 8. Kirim                                                      ║
║  § 9. Sotuv (chiqim)                                             ║
║  § 10. Qaytarish                                                 ║
║  § 11. Qarzlar                                                   ║
║  § 12. Nakladnoy                                                 ║
║  § 13. Menyu                                                     ║
║  § 14. Hisobotlar                                                ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import sys as _sys, os as _os
_sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))))


# ════════════════════════════════════════════════════════════════
#  § 1. IMPORT VA SOZLAMALAR
# ════════════════════════════════════════════════════════════════
import logging
from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Optional

import asyncio
import asyncpg
import asyncpg.exceptions
import pytz

# ── DB xato handleri ─────────────────────────────────────
class DBXato(Exception):
    """Ma'lumotlar bazasi xatosi"""
    pass

class TakrorXato(DBXato):
    """Takroriy yozuv (UniqueViolation)"""
    pass

class UlanishXato(DBXato):
    """Ulanish xatosi"""
    pass

def _db_xato_tekshir(exc: Exception) -> None:
    """asyncpg xatolarini aniq xatolarga o'tkazish"""
    if isinstance(exc, asyncpg.UniqueViolationError):
        raise TakrorXato(str(exc))
    if isinstance(exc, (asyncpg.PostgresConnectionError,
                        ConnectionResetError,
                        asyncpg.TooManyConnectionsError)):
        raise UlanishXato(str(exc))
    raise DBXato(str(exc))

log = logging.getLogger(__name__)
TZ  = pytz.timezone("Asia/Tashkent")
_pool: Optional[asyncpg.Pool] = None


# ════════════════════════════════════════════════════════════════
#  § 2. SCHEMA
# ════════════════════════════════════════════════════════════════

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT        PRIMARY KEY,
    to_liq_ism      TEXT          NOT NULL DEFAULT '',
    username        TEXT,
    telefon         TEXT,
    dokon_nomi      TEXT,
    segment         TEXT CHECK (segment IN (
                        'optom','chakana','oshxona','xozmak','kiyim','gosht',
                        'meva','qurilish','avto','dorixona','texnika','mebel',
                        'mato','gul','kosmetika','universal')),
    faol            BOOLEAN       NOT NULL DEFAULT FALSE,
    obuna_tugash    DATE,
    min_qoldiq      DECIMAL(18,3) NOT NULL DEFAULT 5,
    yaratilgan      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS klientlar (
    id              SERIAL        PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    ism             TEXT          NOT NULL,
    telefon         TEXT,
    manzil          TEXT,
    eslatma         TEXT,
    kredit_limit    DECIMAL(18,2) NOT NULL DEFAULT 0,
    jami_sotib      DECIMAL(18,2) NOT NULL DEFAULT 0,
    yaratilgan      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kl_uid_ism
    ON klientlar(user_id, lower(ism));
CREATE INDEX IF NOT EXISTS idx_kl_uid_tel
    ON klientlar(user_id, telefon) WHERE telefon IS NOT NULL;

CREATE TABLE IF NOT EXISTS tovarlar (
    id               SERIAL        PRIMARY KEY,
    user_id          BIGINT        NOT NULL,
    nomi             TEXT          NOT NULL,
    kategoriya       TEXT          NOT NULL DEFAULT 'Boshqa',
    birlik           TEXT          NOT NULL DEFAULT 'dona',
    olish_narxi      DECIMAL(18,2) NOT NULL DEFAULT 0,
    sotish_narxi     DECIMAL(18,2) NOT NULL DEFAULT 0,
    min_sotish_narxi DECIMAL(18,2) NOT NULL DEFAULT 0,
    qoldiq           DECIMAL(18,3) NOT NULL DEFAULT 0,
    min_qoldiq       DECIMAL(18,3) NOT NULL DEFAULT 0,
    yaratilgan       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tv_uid_nom
    ON tovarlar(user_id, lower(nomi));

CREATE TABLE IF NOT EXISTS kirimlar (
    id              SERIAL        PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    tovar_id        INT,
    tovar_nomi      TEXT          NOT NULL,
    kategoriya      TEXT          NOT NULL DEFAULT 'Boshqa',
    miqdor          DECIMAL(18,3) NOT NULL,
    birlik          TEXT          NOT NULL DEFAULT 'dona',
    narx            DECIMAL(18,2) NOT NULL DEFAULT 0,
    jami            DECIMAL(18,2) NOT NULL DEFAULT 0,
    manba           TEXT,
    izoh            TEXT,
    sana            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kr_uid_sana ON kirimlar(user_id, sana DESC);

CREATE TABLE IF NOT EXISTS sotuv_sessiyalar (
    id              SERIAL        PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    klient_id       INT,
    klient_ismi     TEXT,
    jami            DECIMAL(18,2) NOT NULL DEFAULT 0,
    tolangan        DECIMAL(18,2) NOT NULL DEFAULT 0,
    qarz            DECIMAL(18,2) NOT NULL DEFAULT 0,
    izoh            TEXT,
    sana            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ss_uid_sana
    ON sotuv_sessiyalar(user_id, sana DESC);

CREATE TABLE IF NOT EXISTS chiqimlar (
    id               SERIAL        PRIMARY KEY,
    user_id          BIGINT        NOT NULL,
    sessiya_id       INT           NOT NULL,
    klient_id        INT,
    klient_ismi      TEXT,
    tovar_id         INT,
    tovar_nomi       TEXT          NOT NULL,
    kategoriya       TEXT          NOT NULL DEFAULT 'Boshqa',
    miqdor           DECIMAL(18,3) NOT NULL,
    qaytarilgan      DECIMAL(18,3) NOT NULL DEFAULT 0,
    birlik           TEXT          NOT NULL DEFAULT 'dona',
    olish_narxi      DECIMAL(18,2) NOT NULL DEFAULT 0,
    sotish_narxi     DECIMAL(18,2) NOT NULL DEFAULT 0,
    chegirma_foiz    DECIMAL(5,2)  NOT NULL DEFAULT 0,
    jami             DECIMAL(18,2) NOT NULL DEFAULT 0,
    izoh             TEXT,
    sana             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ch_uid_sana ON chiqimlar(user_id, sana DESC);
CREATE INDEX IF NOT EXISTS idx_ch_sessiya  ON chiqimlar(sessiya_id);

CREATE TABLE IF NOT EXISTS qaytarishlar (
    id              SERIAL        PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    chiqim_id       INT,
    sessiya_id      INT,
    klient_ismi     TEXT,
    tovar_nomi      TEXT,
    miqdor          DECIMAL(18,3),
    birlik          TEXT          DEFAULT 'dona',
    narx            DECIMAL(18,2),
    jami            DECIMAL(18,2),
    sabab           TEXT,
    sana            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qr_uid_sana ON qaytarishlar(user_id, sana DESC);

CREATE TABLE IF NOT EXISTS qarzlar (
    id               SERIAL        PRIMARY KEY,
    user_id          BIGINT        NOT NULL,
    klient_id        INT,
    klient_ismi      TEXT          NOT NULL,
    sessiya_id       INT,
    dastlabki_summa  DECIMAL(18,2) NOT NULL,
    tolangan         DECIMAL(18,2) NOT NULL DEFAULT 0,
    qolgan           DECIMAL(18,2) NOT NULL,
    muddat           DATE,
    izoh             TEXT,
    yopildi          BOOLEAN       NOT NULL DEFAULT FALSE,
    yaratilgan       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    yangilangan      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qrz_uid_aktiv
    ON qarzlar(user_id, yopildi) WHERE yopildi = FALSE;

CREATE TABLE IF NOT EXISTS nakladnoylar (
    id              SERIAL        PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    sessiya_id      INT,
    raqam           TEXT          NOT NULL,
    klient_ismi     TEXT,
    jami_summa      DECIMAL(18,2) NOT NULL DEFAULT 0,
    qarz            DECIMAL(18,2) NOT NULL DEFAULT 0,
    sana            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nl_uid_sana ON nakladnoylar(user_id, sana DESC);

CREATE TABLE IF NOT EXISTS menyu (
    id              SERIAL        PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    nomi            TEXT          NOT NULL,
    kategoriya      TEXT          NOT NULL DEFAULT 'Taom',
    narx            DECIMAL(18,2) NOT NULL DEFAULT 0,
    mavjud          BOOLEAN       NOT NULL DEFAULT TRUE,
    yaratilgan      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mn_uid ON menyu(user_id, mavjud) WHERE mavjud = TRUE;

CREATE TABLE IF NOT EXISTS nakladnoy_counter (
    user_id         BIGINT        PRIMARY KEY,
    oxirgi_raqam    INT           NOT NULL DEFAULT 0,
    yangilangan     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
"""


# ════════════════════════════════════════════════════════════════
#  § 3. ULANISH
# ════════════════════════════════════════════════════════════════

def _P() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool ishga tushmagan!")
    return _pool


async def pool_init(dsn: str, min_size: int = 2, max_size: int = 20) -> None:
    global _pool
    dsn = dsn.replace("postgresql+asyncpg://", "postgresql://")
    dsn = dsn.replace("postgres+asyncpg://",   "postgresql://")
    dsn = dsn.replace("postgres://",            "postgresql://")
    for urinish in range(1, 6):
        try:
            _pool = await asyncpg.create_pool(
                dsn, min_size=min_size, max_size=max_size,
                max_inactive_connection_lifetime=300,
                command_timeout=30, init=_init_conn,
            )
            log.info("✅ Ma'lumotlar bazasi ulandi (urinish=%d)", urinish)
            return
        except Exception as e:
            if urinish == 5:
                log.critical("❌ DB ulanmadi (5 urinish): %s", e); raise
            log.warning("⚠️ DB ulanish xato (%d/5): %s", urinish, e)
            await asyncio.sleep(urinish * 2)


async def _init_conn(conn: asyncpg.Connection) -> None:
    await conn.set_type_codec(
        "numeric", encoder=str,
        decoder=lambda s: Decimal(s),
        schema="pg_catalog", format="text",
    )


async def schema_init() -> None:
    """Load shared schema.sql — statement-by-statement (xatolarga chidamli)"""
    import os as _os2
    _schema_path = _os2.path.join(
        _os2.path.dirname(_os2.path.dirname(_os2.path.dirname(_os2.path.abspath(__file__)))),
        "shared", "database", "schema.sql"
    )
    if _os2.path.exists(_schema_path):
        with open(_schema_path, encoding="utf-8") as _sf:
            sql = _sf.read()
    else:
        sql = _SCHEMA  # fallback: embedded schema

    # ═══ STATEMENT-BY-STATEMENT EXECUTION ═══
    # asyncpg conn.execute() ga butun SQL berib bo'lmaydi
    # DO $$ ... $$; bloklarni to'g'ri ajratish kerak
    statements = []
    current = []
    in_dollar = False
    for line in sql.split("\n"):
        stripped = line.strip()
        if stripped.startswith("--") and not current:
            continue
        current.append(line)
        dollar_count = line.count("$$")
        if dollar_count % 2 == 1:
            in_dollar = not in_dollar
        if not in_dollar and stripped.endswith(";"):
            stmt = "\n".join(current).strip()
            if stmt and stmt != ";":
                statements.append(stmt)
            current = []
    if current:
        stmt = "\n".join(current).strip()
        if stmt and stmt != ";" and len(stmt) > 5:
            statements.append(stmt)

    async with _P().acquire() as c:
        ok = skip = fail = 0
        for i, stmt in enumerate(statements, 1):
            try:
                await c.execute(stmt)
                ok += 1
            except Exception as e:
                err = str(e)
                s = stmt.upper().strip()
                is_create_table = s.startswith("CREATE TABLE")
                if any(w in err for w in ["already exists", "duplicate"]):
                    skip += 1
                elif is_create_table:
                    fail += 1
                    log.error("Schema #%d CRITICAL: %s | %.80s", i, err, stmt)
                else:
                    skip += 1
                    log.warning("Schema #%d skip: %s | %.60s", i, err, stmt)

        if fail > 0:
            raise RuntimeError(f"Schema init: {fail} CREATE TABLE xato")
    log.info("✅ Jadvallar tayyor (%d OK, %d skip, RLS yoqilgan)", ok, skip)


async def pool_close() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


# ════════════════════════════════════════════════════════════════
#  § 4. YORDAMCHI FUNKSIYALAR
# ════════════════════════════════════════════════════════════════

def D(v: Any) -> Decimal:
    if isinstance(v, Decimal): return v
    if v is None: return Decimal("0")
    try: return Decimal(str(v).replace(",", ".").strip())
    except Exception: return Decimal("0")


def yaxlit(v: Decimal) -> Decimal:
    return v.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def gramm_jami(kg_narx: Decimal, gramm: Decimal) -> Decimal:
    try:
        from shared.utils.hisob import narx_hisob
        return narx_hisob(gramm, kg_narx, "gramm")
    except Exception:
        return (kg_narx / Decimal("1000") * gramm).quantize(
            Decimal("1"), rounding=ROUND_HALF_UP)


def _hozir() -> datetime:
    return datetime.now(TZ)


def _bugun() -> date:
    return datetime.now(TZ).date()


def _kun_boshi() -> datetime:
    d = _bugun()
    return TZ.localize(datetime(d.year, d.month, d.day))


def _oy_boshi() -> date:
    return _bugun().replace(day=1)


# ════════════════════════════════════════════════════════════════
#  § 5. FOYDALANUVCHILAR
# ════════════════════════════════════════════════════════════════

async def user_ol(uid: int) -> Optional[asyncpg.Record]:
    async with _P().acquire() as c:
        return await c.fetchrow("SELECT * FROM users WHERE id = $1", uid)


async def user_yoz(uid: int, to_liq_ism: str,
                   username: Optional[str] = None) -> None:
    async with _P().acquire() as c:
        # Try both column names — ism (schema.sql) or to_liq_ism (embedded)
        try:
            await c.execute("""
                INSERT INTO users (id, ism, username)
                VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING
            """, uid, to_liq_ism, username)
        except Exception:
            await c.execute("""
                INSERT INTO users (id, to_liq_ism, username)
                VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING
            """, uid, to_liq_ism, username)


_USER_YOZISH_MUMKIN = frozenset({
    "ism", "username", "telefon", "inn", "manzil",
    "dokon_nomi", "segment", "faol", "obuna_tugash",
    "til", "plan",
})

async def user_yangilab(uid: int, **maydonlar) -> None:
    if not maydonlar: return
    noma = set(maydonlar) - _USER_YOZISH_MUMKIN
    if noma:
        raise ValueError(f"Ruxsat etilmagan maydon(lar): {noma}")
    set_q = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(maydonlar))
    async with _P().acquire() as c:
        await c.execute(
            f"UPDATE users SET {set_q} WHERE id = $1",
            uid, *maydonlar.values()
        )


async def user_faollashtir(uid: int, obuna_kun: int = 30) -> None:
    tugash = _bugun() + timedelta(days=obuna_kun)
    async with _P().acquire() as c:
        await c.execute(
            "UPDATE users SET faol = TRUE, obuna_tugash = $2 WHERE id = $1",
            uid, tugash
        )


async def barcha_users() -> list:
    async with _P().acquire() as c:
        _rows = await c.fetch("SELECT * FROM users ORDER BY yaratilgan DESC")
        return [dict(r) for r in _rows]


async def faol_users() -> list:
    async with _P().acquire() as c:
        _rows = await c.fetch("SELECT * FROM users WHERE faol = TRUE")
        return [dict(r) for r in _rows]


async def obuna_tugayotganlar(kun: int = 3) -> list:
    chegara = _bugun() + timedelta(days=kun)
    async with _P().acquire() as c:
        _rows = await c.fetch(
            "SELECT * FROM users WHERE faol = TRUE AND obuna_tugash = $1",
            chegara
        )
        return [dict(r) for r in _rows]


# ════════════════════════════════════════════════════════════════
#  § 6. KLIENTLAR
# ════════════════════════════════════════════════════════════════

async def klient_topish(uid: int, ism: str) -> Optional[dict]:
    """Klient topish — exact match, keyin fuzzy ILIKE"""
    s = ism.strip()
    if not s: return None
    async with _P().acquire() as c:
        # 1. Exact match
        r = await c.fetchrow("""
            SELECT * FROM klientlar
            WHERE user_id = $1 AND lower(ism) = lower($2)
        """, uid, s)
        if r: return dict(r)
        # 2. ILIKE fuzzy (partial match)
        r = await c.fetchrow("""
            SELECT * FROM klientlar
            WHERE user_id = $1 AND lower(ism) LIKE lower($2)
            ORDER BY jami_sotib DESC LIMIT 1
        """, uid, f"%{s}%")
        return dict(r) if r else None


async def klient_olish_yaratish(uid: int, ism: str) -> dict:
    k = await klient_topish(uid, ism)
    if k: return k
    async with _P().acquire() as c:
        r = await c.fetchrow("""
            INSERT INTO klientlar (user_id, ism) VALUES ($1, $2)
            ON CONFLICT (user_id, lower(ism))
            DO UPDATE SET ism = klientlar.ism RETURNING *
        """, uid, ism.strip())
        return dict(r) if r else {}


async def klientlar_ol(uid: int, limit: int = 20, offset: int = 0) -> list:
    async with _P().acquire() as c:
        rows = await c.fetch("""
            SELECT * FROM klientlar WHERE user_id = $1
            ORDER BY jami_sotib DESC, ism ASC LIMIT $2 OFFSET $3
        """, uid, limit, offset)
        return [dict(r) for r in rows]


async def klientlar_soni(uid: int) -> int:
    async with _P().acquire() as c:
        return await c.fetchval(
            "SELECT COUNT(*) FROM klientlar WHERE user_id = $1", uid) or 0


async def klient_qidirish(uid: int, qidiruv: str) -> list:
    q = qidiruv.strip()
    async with _P().acquire() as c:
        _rows = await c.fetch("""
            SELECT * FROM klientlar
            WHERE user_id = $1
              AND (lower(ism) LIKE lower($2) OR telefon LIKE $3)
            ORDER BY jami_sotib DESC LIMIT 10
        """, uid, f"%{q}%", f"%{q}%")
        return [dict(r) for r in _rows]


async def klient_to_liq_hisobi(uid: int, klient_id: int) -> Optional[dict]:
    async with _P().acquire() as c:
        k = await c.fetchrow(
            "SELECT * FROM klientlar WHERE id = $1 AND user_id = $2",
            klient_id, uid)
        if not k: return None
        sotuvlar = await c.fetch("""
            SELECT * FROM sotuv_sessiyalar
            WHERE user_id = $1 AND klient_id = $2
            ORDER BY sana DESC LIMIT 20
        """, uid, klient_id)
        qarzlar = await c.fetch("""
            SELECT * FROM qarzlar
            WHERE user_id = $1 AND klient_id = $2 AND yopildi = FALSE
            ORDER BY yaratilgan ASC
        """, uid, klient_id)
        faol_qarz = await c.fetchval("""
            SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar
            WHERE user_id = $1 AND klient_id = $2 AND yopildi = FALSE
        """, uid, klient_id) or Decimal("0")
        return {
            "klient":    dict(k),
            "sotuvlar":  [dict(s) for s in sotuvlar],
            "qarzlar":   [dict(q) for q in qarzlar],
            "faol_qarz": float(faol_qarz),
        }


async def top_klientlar(uid: int, limit: int = 10) -> list:
    async with _P().acquire() as c:
        _rows = await c.fetch("""
            SELECT
                k.id, k.ism, k.telefon,
                COALESCE(k.jami_sotib, 0) AS jami_sotib,
                COUNT(DISTINCT ss.id) AS sotuv_soni,
                COALESCE(SUM(q.qolgan)
                    FILTER (WHERE q.yopildi = FALSE), 0) AS aktiv_qarz
            FROM klientlar k
            LEFT JOIN sotuv_sessiyalar ss ON ss.klient_id=k.id AND ss.user_id=$1
            LEFT JOIN qarzlar q ON q.klient_id=k.id AND q.user_id=$1
            WHERE k.user_id = $1
            GROUP BY k.id, k.ism, k.telefon, k.jami_sotib
            ORDER BY k.jami_sotib DESC LIMIT $2
        """, uid, limit)
        return [dict(r) for r in _rows]


async def klient_kredit_tekshir(uid: int,
                                  klient_id: int,
                                  yangi_qarz: float) -> dict:
    async with _P().acquire() as c:
        k = await c.fetchrow(
            "SELECT * FROM klientlar WHERE id=$1 AND user_id=$2",
            klient_id, uid)
        if not k: return {"ok": True, "xato": None}
        k = dict(k)
        limit = float(k.get("kredit_limit") or 0)
        if limit <= 0: return {"ok": True, "xato": None}
        aktiv = float(await c.fetchval("""
            SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar
            WHERE user_id=$1 AND klient_id=$2 AND yopildi=FALSE
        """, uid, klient_id) or 0)
        if aktiv + yangi_qarz > limit:
            return {
                "ok": False,
                "xato": (
                    "❌ *Kredit limit oshib ketdi!*\n\n"
                    + f"   Hozirgi qarz: {aktiv:,.0f} so'm\n"
                    + f"   Yangi qarz:   {yangi_qarz:,.0f} so'm\n"
                    + f"   Limit:        {limit:,.0f} so'm"
                ),
            }
        return {"ok": True, "xato": None}


# ════════════════════════════════════════════════════════════════
#  § 7. TOVARLAR
# ════════════════════════════════════════════════════════════════

async def tovar_topish(uid: int, nomi: str) -> Optional[dict]:
    """Tovar topish — exact match, keyin fuzzy ILIKE"""
    s = nomi.strip()
    if not s: return None
    async with _P().acquire() as c:
        # 1. Exact match
        r = await c.fetchrow("""
            SELECT * FROM tovarlar
            WHERE user_id=$1 AND lower(nomi)=lower($2)
        """, uid, s)
        if r: return dict(r)
        # 2. ILIKE fuzzy
        r = await c.fetchrow("""
            SELECT * FROM tovarlar
            WHERE user_id=$1 AND lower(nomi) LIKE lower($2)
            ORDER BY qoldiq DESC LIMIT 1
        """, uid, f"%{s}%")
        return dict(r) if r else None


async def tovar_olish_yaratish(uid: int, nomi: str,
                                kategoriya: str = "Boshqa",
                                birlik: str = "dona") -> dict:
    t = await tovar_topish(uid, nomi)
    if t: return t
    async with _P().acquire() as c:
        r = await c.fetchrow("""
            INSERT INTO tovarlar (user_id, nomi, kategoriya, birlik)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, lower(nomi))
            DO UPDATE SET nomi = EXCLUDED.nomi RETURNING *
        """, uid, nomi.strip(), kategoriya, birlik)
        return dict(r) if r else {}


async def tovarlar_ol(uid: int, limit: int = 20, offset: int = 0) -> list:
    async with _P().acquire() as c:
        _rows = await c.fetch("""
            SELECT * FROM tovarlar WHERE user_id=$1
            ORDER BY kategoriya, nomi LIMIT $2 OFFSET $3
        """, uid, limit, offset)
        return [dict(r) for r in _rows]


async def tovarlar_soni(uid: int) -> int:
    async with _P().acquire() as c:
        return await c.fetchval(
            "SELECT COUNT(*) FROM tovarlar WHERE user_id=$1", uid) or 0


async def tovar_qoldiq_ol(uid: int, nomi: str) -> Optional[Decimal]:
    """Tovar qoldiqini olish — aniq o'qish uchun"""
    async with _P().acquire() as c:
        row = await c.fetchrow("""
            SELECT qoldiq FROM tovarlar
            WHERE user_id=$1 AND lower(nomi) LIKE lower($2)
            LIMIT 1
        """, uid, f"%{nomi.strip()}%")
        return D(row["qoldiq"]) if row else None




async def tovar_qoldiq_atomic_tekshir(uid: int, tovarlar: list) -> list:
    """Atomik qoldiq tekshiruvi — bir transaction da barcha tovarlar"""
    kamchilik = []
    async with _P().acquire() as c:
        async with c.transaction():
            for t in tovarlar:
                nomi = t.get("nomi", "")
                miqdor = D(str(t.get("miqdor", 0)))
                if not nomi or miqdor <= 0:
                    continue
                row = await c.fetchrow("""
                    SELECT nomi, qoldiq FROM tovarlar
                    WHERE user_id=$1 AND lower(nomi) LIKE lower($2)
                    FOR UPDATE LIMIT 1
                """, uid, f"%{nomi.strip()}%")
                if row and D(row["qoldiq"]) < miqdor:
                    kamchilik.append({
                        "nomi": nomi,
                        "qoldiq": str(row["qoldiq"]),
                        "soralgan": str(miqdor),
                    })
    return kamchilik

async def kam_qoldiq_tovarlar(uid: int) -> list:
    async with _P().acquire() as c:
        _rows = await c.fetch("""
            SELECT * FROM tovarlar
            WHERE user_id=$1 AND min_qoldiq > 0 AND qoldiq <= min_qoldiq
            ORDER BY (qoldiq / NULLIF(min_qoldiq, 0)) ASC
        """, uid)
        return [dict(r) for r in _rows]


async def zarar_sotuv_tekshir(uid: int, tovarlar_r: list) -> list[dict]:
    from shared.utils.hisob import foyda_hisob
    zararlilar = []
    async with _P().acquire() as c:
        for t in tovarlar_r:
            tv = await c.fetchrow("""
                SELECT * FROM tovarlar
                WHERE user_id=$1 AND lower(nomi) LIKE lower($2) LIMIT 1
            """, uid, f"%{t.get('nomi','')}%")
            if not tv: continue
            tv = dict(tv)
            olish_n  = float(tv.get("olish_narxi") or 0)
            sotish_n = float(t.get("narx") or 0)
            if olish_n <= 0 or sotish_n <= 0: continue
            f = foyda_hisob(sotish_n, olish_n, 1)
            if f["zararli"]:
                zararlilar.append({
                    "nomi":         t.get("nomi"),
                    "olish_narxi":  olish_n,
                    "sotish_narxi": sotish_n,
                    "zarar":        abs(f["foyda"]),
                })
    return zararlilar


# ════════════════════════════════════════════════════════════════
#  § 8. KIRIM
# ════════════════════════════════════════════════════════════════

async def kirim_saqlash(uid: int, t: dict) -> dict:
    from shared.utils.hisob import narx_hisob
    nomi       = t.get("tovar_nomi") or t.get("nomi", "")
    kategoriya = t.get("kategoriya", "Boshqa")
    birlik     = t.get("birlik", "dona")
    miqdor     = D(t.get("miqdor", 0))
    narx       = D(t.get("narx",   0))
    jami       = narx_hisob(miqdor, narx, birlik)

    async with _P().acquire() as c:
        async with c.transaction():  # ACID
            # Tovarni yaratish/yangilash
            tovar = await c.fetchrow("""
                INSERT INTO tovarlar
                (user_id, nomi, kategoriya, birlik, olish_narxi)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, lower(nomi)) DO UPDATE SET
                kategoriya  = EXCLUDED.kategoriya,
                olish_narxi = EXCLUDED.olish_narxi
            RETURNING *
        """, uid, nomi, kategoriya, birlik, narx)

            # Qoldiqni oshirish
            await c.execute(
                "UPDATE tovarlar SET qoldiq = qoldiq + $2 WHERE id = $1",
                tovar["id"], miqdor
            )

            # Kirimni saqlash
            kirim = await c.fetchrow("""
                INSERT INTO kirimlar
                    (user_id, tovar_id, tovar_nomi, kategoriya,
                     miqdor, birlik, narx, jami, manba, izoh)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            """, uid, tovar["id"], nomi, kategoriya,
                miqdor, birlik, narx, jami,
                t.get("manba"), t.get("izoh"))

    log.info("📥 Kirim: %s %s %s = %s so'm", miqdor, birlik, nomi, jami)

    # ── Cache tozalash — yangi tovar darhol Gemini ga ko'rinadi ──
    try:
        from services.bot.bot_services.voice import stt_cache_tozala
        from services.bot.bot_services.fuzzy_matcher import fuzzy_matcher
        stt_cache_tozala(uid)
        fuzzy_matcher.cache_tozala(uid)
    except Exception:
        pass

    return dict(kirim)


# ════════════════════════════════════════════════════════════════
#  § 9. SOTUV
# ════════════════════════════════════════════════════════════════

async def sotuv_saqlash(uid: int, data: dict) -> dict:
    """
    Sotuv saqlash.
    1. Sessiya yaratish
    2. Har bir tovar — chiqim + qoldiq kamaytirish
    3. Klient jami_sotib yangilash
    4. Qarz saqlash
    """
    from shared.utils.hisob import narx_hisob, ai_hisob_tekshir

    data = ai_hisob_tekshir(data)

    klient_ismi = data.get("klient")
    tovarlar    = data.get("tovarlar", [])
    jami        = D(data.get("jami_summa", 0))
    qarz        = D(data.get("qarz", 0))
    tolangan    = D(data.get("tolangan", 0)) or (jami - qarz)
    izoh        = data.get("izoh")

    async with _P().acquire() as c:
        async with c.transaction():  # ACID — atomik
            # Klientni topish/yaratish
            klient_id = None
            if klient_ismi:
                kl = await c.fetchrow("""
                    INSERT INTO klientlar (user_id, ism) VALUES ($1, $2)
                    ON CONFLICT (user_id, lower(ism))
                    DO UPDATE SET ism = klientlar.ism RETURNING id
                """, uid, klient_ismi.strip())
                klient_id = kl["id"]

            # Sessiya yaratish
            sess = await c.fetchrow("""
                INSERT INTO sotuv_sessiyalar
                    (user_id, klient_id, klient_ismi, jami, tolangan, qarz, izoh)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
            """, uid, klient_id, klient_ismi, jami, tolangan, qarz, izoh)
            sess_id = sess["id"]

            # Har bir tovar
            # ── BATCH LOAD: barcha tovarlarni 1 ta query bilan olish (N+1 → 1) ──
            tovar_nomlari = [t.get("nomi", "").strip().lower() for t in tovarlar if t.get("nomi")]
            if tovar_nomlari:
                tv_rows = await c.fetch("""
                    SELECT id, nomi, olish_narxi, sotish_narxi FROM tovarlar
                    WHERE user_id=$1 AND lower(nomi) = ANY($2)
                """, uid, tovar_nomlari)
                tv_map = {r["nomi"].lower(): r for r in tv_rows}
            else:
                tv_map = {}

            for t in tovarlar:
                nomi       = t.get("nomi", "")
                kategoriya = t.get("kategoriya", "Boshqa")
                birlik     = t.get("birlik", "dona")
                miqdor     = D(t.get("miqdor", 0))
                chegirma   = D(t.get("chegirma_foiz", 0))
                sotish_n   = D(t.get("narx", 0))

                # Tovar ma'lumotlari (batch cache dan)
                tv = tv_map.get(nomi.strip().lower())

                tovar_id = tv["id"] if tv else None
                olish_n  = D(tv["olish_narxi"]) if tv else D(0)
                if not sotish_n and tv:
                    sotish_n = D(tv["sotish_narxi"])

                # ── AUTO-LEARNING: yangi tovar bo'lsa DB ga qo'shish ──
                # Keyingi safar Gemini STT bu tovar nomini biladi
                if not tovar_id and nomi.strip():
                    try:
                        new_tv = await c.fetchrow("""
                            INSERT INTO tovarlar
                                (user_id, nomi, kategoriya, birlik,
                                 sotish_narxi, qoldiq, min_qoldiq)
                            VALUES ($1, $2, $3, $4, $5, 0, 0)
                            ON CONFLICT (user_id, lower(nomi)) DO UPDATE
                                SET sotish_narxi = CASE
                                    WHEN tovarlar.sotish_narxi = 0 THEN $5
                                    ELSE tovarlar.sotish_narxi
                                END
                            RETURNING id, olish_narxi
                        """, uid, nomi.strip(), kategoriya, birlik, sotish_n)
                        tovar_id = new_tv["id"]
                        olish_n = D(new_tv["olish_narxi"] or 0)
                        log.info("📚 AUTO-LEARN: '%s' → tovarlar (uid=%d)", nomi, uid)
                    except Exception as _learn_e:
                        log.debug("auto-learn '%s': %s", nomi, _learn_e)

                # Jami hisoblash
                t_jami = narx_hisob(miqdor, sotish_n, birlik, chegirma)

                # Chiqim saqlash
                await c.execute("""
                    INSERT INTO chiqimlar
                        (user_id, sessiya_id, klient_id, klient_ismi,
                         tovar_id, tovar_nomi, kategoriya,
                         miqdor, birlik, olish_narxi, sotish_narxi,
                         chegirma_foiz, jami, izoh)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
                """, uid, sess_id, klient_id, klient_ismi,
                    tovar_id, nomi, kategoriya,
                    miqdor, birlik, olish_n, sotish_n,
                    chegirma, t_jami, t.get("izoh"))

                # Qoldiqni kamaytirish (manfiy bo'lmaydi)
                if tovar_id:
                    await c.execute("""
                        UPDATE tovarlar
                        SET qoldiq = GREATEST(qoldiq - $2, 0)
                        WHERE id = $1
                    """, tovar_id, miqdor)

            # Klient jami_sotib yangilash
            if klient_id:
                await c.execute("""
                    UPDATE klientlar SET jami_sotib = jami_sotib + $2
                    WHERE id = $1
                """, klient_id, jami)

            # Qarz saqlash
            if qarz > 0:
                await c.execute("""
                    INSERT INTO qarzlar
                        (user_id, klient_id, klient_ismi,
                         sessiya_id, dastlabki_summa, tolangan, qolgan)
                    VALUES ($1, $2, $3, $4, $5, 0, $5)
                """, uid, klient_id, klient_ismi, sess_id, qarz)

        log.info("📤 Sotuv: sess=%d %s jami=%s qarz=%s",
                 sess_id, klient_ismi, jami, qarz)

        # ── Cache tozalash — yangi tovarlar darhol Gemini ga ko'rinadi ──
        try:
            from services.bot.bot_services.voice import stt_cache_tozala
            from services.bot.bot_services.fuzzy_matcher import fuzzy_matcher
            stt_cache_tozala(uid)
            fuzzy_matcher.cache_tozala(uid)
        except Exception:
            pass

        return {
            "sessiya_id": sess_id,
            "klient_id":  klient_id,
            "jami_summa": float(jami),
            "qarz":       float(qarz),
            "tolangan":   float(tolangan),
        }


async def sessiya_ol(uid: int, sess_id: int) -> Optional[dict]:
    async with _P().acquire() as c:
        sess = await c.fetchrow("""
            SELECT * FROM sotuv_sessiyalar WHERE id=$1 AND user_id=$2
        """, sess_id, uid)
        if not sess: return None
        sess_d = dict(sess)  # Record → dict
        chiqimlar = await c.fetch(
            "SELECT * FROM chiqimlar WHERE sessiya_id=$1 ORDER BY id",
            sess_id)
        # chiqimlar jadvalida "tovar_nomi" — chek uchun "nomi" ham kerak
        tovarlar = []
        for ch in chiqimlar:
            td = dict(ch)
            td.setdefault("nomi", td.get("tovar_nomi", "?"))
            td.setdefault("narx", td.get("sotish_narxi", 0))
            tovarlar.append(td)
        return {
            **sess_d,
            "klient":     sess_d.get("klient_ismi"),
            "tovarlar":   tovarlar,
            "jami_summa": float(sess_d.get("jami", 0) or 0),
            "tolandan":   float(sess_d.get("tolangan", 0) or 0),
            "qarz":       float(sess_d.get("qarz", 0) or 0),
        }


# ════════════════════════════════════════════════════════════════
#  § 10. QAYTARISH
# ════════════════════════════════════════════════════════════════

async def qaytarish_tovarlar_ol(uid: int,
                                  klient: str,
                                  tovar_nomi: str) -> list:
    async with _P().acquire() as c:
        _rows = await c.fetch("""
            SELECT ch.*, ss.sana AS sotuv_sana
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ch.user_id = $1
              AND lower(ch.klient_ismi) = lower($2)
              AND lower(ch.tovar_nomi) LIKE lower($3)
              AND ch.miqdor > ch.qaytarilgan
            ORDER BY ch.sana DESC LIMIT 10
        """, uid, klient.strip(), f"%{tovar_nomi.strip()}%")
        return [dict(r) for r in _rows]


async def qaytarish_saqlash(uid: int,
                              qaytarishlar: list[dict],
                              sabab: Optional[str] = None) -> list[dict]:
    """Qaytarishni ACID tranzaksiyada saqlash"""
    from shared.utils.hisob import qaytarish_hisob
    natijalar = []
    async with _P().acquire() as c:
        async with c.transaction():  # ACID
            for q in qaytarishlar:
                chiqim = await c.fetchrow(
                    "SELECT * FROM chiqimlar WHERE id=$1", q["chiqim_id"])
                if not chiqim:
                    continue
                chiqim = dict(chiqim)

                hisob = qaytarish_hisob(
                    chiqim["miqdor"], chiqim["qaytarilgan"],
                    D(q["miqdor"]), chiqim["sotish_narxi"],
                    chiqim["birlik"]
                )
                if hisob["qaytarildi"] <= 0:
                    continue

                aniq_miq = hisob["qaytarildi"]
                aniq_sum = hisob["summa"]

                await c.execute("""
                    UPDATE chiqimlar SET qaytarilgan = qaytarilgan + $2
                    WHERE id = $1
                """, q["chiqim_id"], aniq_miq)

                if chiqim.get("tovar_id"):
                    await c.execute("""
                        UPDATE tovarlar SET qoldiq = qoldiq + $2
                        WHERE id = $1
                    """, chiqim["tovar_id"], aniq_miq)

                await c.execute("""
                    INSERT INTO qaytarishlar
                        (user_id, chiqim_id, sessiya_id, klient_ismi,
                         tovar_nomi, miqdor, birlik, narx, jami, sabab)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                """, uid, q["chiqim_id"], chiqim.get("sessiya_id"),
                     chiqim.get("klient_ismi"), chiqim.get("tovar_nomi"),
                     aniq_miq, chiqim["birlik"],
                     chiqim["sotish_narxi"], aniq_sum, sabab)

                natijalar.append({
                    "tovar":      chiqim.get("tovar_nomi",""),
                    "qaytarildi": float(aniq_miq),
                    "summa":      float(aniq_sum),
                    "qolgan":     float(hisob["qolgan"]),
                })
    return natijalar


async def qarzlar_ol(uid: int) -> list:
    """Faol qarzlar — klient bo'yicha guruhlangan"""
    async with _P().acquire() as c:
        _rows = await c.fetch("""
            SELECT
                klient_ismi,
                SUM(qolgan)  AS qolgan,
                COUNT(*)     AS qarz_soni,
                MIN(muddat)  AS eng_yaqin_muddat
            FROM qarzlar
            WHERE user_id=$1 AND yopildi=FALSE
            GROUP BY klient_ismi
            ORDER BY qolgan DESC
        """, uid)
        return [dict(r) for r in _rows]


async def qarz_tolash(uid: int,
                       klient_ismi: str,
                       summa: Decimal) -> dict:
    """
    Qarz to'lash — eskidan yangiga tartibda.
    Hisob: utils.hisob.qarz_to_lash_hisob
    """
    from shared.utils.hisob import qarz_to_lash_hisob

    async with _P().acquire() as c:
        async with c.transaction():
            qarzlar = await c.fetch("""
                SELECT * FROM qarzlar
                WHERE user_id=$1 AND lower(klient_ismi)=lower($2)
                  AND yopildi=FALSE
                ORDER BY yaratilgan ASC
                FOR UPDATE
            """, uid, klient_ismi.strip())

            if not qarzlar:
                return {"topildi": False}

            jami_qarz = sum(D(q["qolgan"]) for q in qarzlar)
            hisob     = qarz_to_lash_hisob(jami_qarz, summa)
            tolandi   = D(hisob["tolandi"])
            qoldi     = D(hisob["qolgan"])

            # Eskidan yangiga to'lash
            qolgan_tolash = tolandi
            for qarz in qarzlar:
                if qolgan_tolash <= 0: break
                qarz_q = D(qarz["qolgan"])
                if qolgan_tolash >= qarz_q:
                    await c.execute("""
                        UPDATE qarzlar SET
                            tolangan    = tolangan + $2,
                            qolgan      = 0,
                            yopildi     = TRUE,
                            yangilangan = NOW()
                        WHERE id = $1
                    """, qarz["id"], qarz_q)
                    qolgan_tolash -= qarz_q
                else:
                    await c.execute("""
                    UPDATE qarzlar SET
                        tolangan    = tolangan + $2,
                        qolgan      = qolgan - $2,
                        yangilangan = NOW()
                    WHERE id = $1
                """, qarz["id"], qolgan_tolash)
                qolgan_tolash = Decimal("0")

    return {
        "topildi":     True,
        "klient":      klient_ismi,
        "tolandi":     float(tolandi),
        "qolgan_qarz": float(qoldi),
    }


async def muddatli_qarzlar(uid: int, kun: int = 3) -> list:
    chegara = _bugun() + timedelta(days=kun)
    async with _P().acquire() as c:
        _rows = await c.fetch("""
            SELECT * FROM qarzlar
            WHERE user_id=$1 AND yopildi=FALSE
              AND muddat IS NOT NULL AND muddat <= $2
            ORDER BY muddat ASC
        """, uid, chegara)
        return [dict(r) for r in _rows]


# ════════════════════════════════════════════════════════════════
#  § 12. NAKLADNOY
# ════════════════════════════════════════════════════════════════

async def nakladnoy_raqami_ol(uid: int) -> str:
    """Ketma-ket nakladnoy raqami: 2026-0001"""
    async with _P().acquire() as c:
        row = await c.fetchrow("""
            INSERT INTO nakladnoy_counter (user_id, oxirgi_raqam)
            VALUES ($1, 1)
            ON CONFLICT (user_id) DO UPDATE
                SET oxirgi_raqam = nakladnoy_counter.oxirgi_raqam + 1,
                    yangilangan  = NOW()
            RETURNING oxirgi_raqam
        """, uid)
        return f"{datetime.now(TZ).year}-{row['oxirgi_raqam']:04d}"


async def nakladnoy_saqlash(uid: int, sessiya_id: Optional[int],
                              raqam: str, klient_ismi: Optional[str],
                              jami_summa: float, qarz: float = 0) -> None:
    async with _P().acquire() as c:
        await c.execute("""
            INSERT INTO nakladnoylar
                (user_id, sessiya_id, raqam, klient_ismi, jami_summa, qarz)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, uid, sessiya_id, raqam, klient_ismi, jami_summa, qarz)


# ════════════════════════════════════════════════════════════════
#  § 13. MENYU
# ════════════════════════════════════════════════════════════════

async def menyu_ol(uid: int) -> list:
    async with _P().acquire() as c:
        _rows = await c.fetch("""
            SELECT * FROM menyu WHERE user_id=$1 AND mavjud=TRUE
            ORDER BY kategoriya, nomi
        """, uid)
        return [dict(r) for r in _rows]


async def menyu_qoshish(uid: int, nomi: str,
                         narx: float,
                         kategoriya: str = "Taom") -> Optional[asyncpg.Record]:
    async with _P().acquire() as c:
        return await c.fetchrow("""
            INSERT INTO menyu (user_id, nomi, narx, kategoriya)
            VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING *
        """, uid, nomi.strip(), Decimal(str(narx)), kategoriya)


async def menyu_ochirish(uid: int, nomi: str) -> bool:
    async with _P().acquire() as c:
        n = await c.fetchval("""
            UPDATE menyu SET mavjud=FALSE
            WHERE user_id=$1 AND lower(nomi)=lower($2) RETURNING id
        """, uid, nomi.strip())
        return n is not None


# ════════════════════════════════════════════════════════════════
#  § 14. HISOBOTLAR
# ════════════════════════════════════════════════════════════════

async def kunlik_hisobot(uid: int) -> dict:
    """Bugungi kun hisoboti"""
    bosh = _kun_boshi()
    async with _P().acquire() as c:
        kr = await c.fetchrow("""
            SELECT COUNT(*) AS kr_n, COALESCE(SUM(jami),0) AS kr_jami
            FROM kirimlar WHERE user_id=$1 AND sana>=$2
        """, uid, bosh)
        ch = await c.fetchrow("""
            SELECT COUNT(DISTINCT id) AS ch_n,
                   COALESCE(SUM(jami),0) AS ch_jami,
                   COALESCE(SUM(qarz),0) AS yangi_qarz
            FROM sotuv_sessiyalar WHERE user_id=$1 AND sana>=$2
        """, uid, bosh)
        jami_qarz = await c.fetchval("""
            SELECT COALESCE(SUM(qolgan),0) FROM qarzlar
            WHERE user_id=$1 AND yopildi=FALSE
        """, uid) or Decimal("0")
        qa = await c.fetchrow("""
            SELECT COUNT(*) AS qa_n, COALESCE(SUM(jami),0) AS qa_jami
            FROM qaytarishlar WHERE user_id=$1 AND sana>=$2
        """, uid, bosh)
        foyda = await c.fetchval("""
            SELECT COALESCE(SUM(
                (ch.sotish_narxi - ch.olish_narxi) * ch.miqdor
            ), 0)
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id=ch.sessiya_id
            WHERE ch.user_id=$1 AND ss.sana>=$2
        """, uid, bosh) or Decimal("0")

    return {
        "kr_n":       int(kr["kr_n"] or 0),
        "kr_jami":    float(kr["kr_jami"] or 0),
        "ch_n":       int(ch["ch_n"] or 0),
        "ch_jami":    float(ch["ch_jami"] or 0),
        "yangi_qarz": float(ch["yangi_qarz"] or 0),
        "jami_qarz":  float(jami_qarz),
        "qa_n":       int(qa["qa_n"] or 0),
        "qa_jami":    float(qa["qa_jami"] or 0),
        "foyda":      float(foyda),
    }


async def oylik_hisobot(uid: int) -> dict:
    """Oylik hisobot"""
    ob = _oy_boshi()
    bosh = TZ.localize(datetime(ob.year, ob.month, 1))
    async with _P().acquire() as c:
        kr = await c.fetchrow("""
            SELECT COUNT(*) AS kr_n, COALESCE(SUM(jami),0) AS kr_jami
            FROM kirimlar WHERE user_id=$1 AND sana>=$2
        """, uid, bosh)
        ch = await c.fetchrow("""
            SELECT COUNT(DISTINCT id) AS ch_n,
                   COALESCE(SUM(jami),0) AS ch_jami,
                   COALESCE(SUM(qarz),0) AS yangi_qarz
            FROM sotuv_sessiyalar WHERE user_id=$1 AND sana>=$2
        """, uid, bosh)
        jami_qarz = await c.fetchval("""
            SELECT COALESCE(SUM(qolgan),0) FROM qarzlar
            WHERE user_id=$1 AND yopildi=FALSE
        """, uid) or Decimal("0")
        foyda = await c.fetchval("""
            SELECT COALESCE(SUM(
                (ch.sotish_narxi - ch.olish_narxi) * ch.miqdor
            ), 0)
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id=ch.sessiya_id
            WHERE ch.user_id=$1 AND ss.sana>=$2
        """, uid, bosh) or Decimal("0")

    return {
        "kr_n":       int(kr["kr_n"] or 0),
        "kr_jami":    float(kr["kr_jami"] or 0),
        "ch_n":       int(ch["ch_n"] or 0),
        "ch_jami":    float(ch["ch_jami"] or 0),
        "yangi_qarz": float(ch["yangi_qarz"] or 0),
        "jami_qarz":  float(jami_qarz),
        "foyda":      float(foyda),
    }


async def oylik_qoldiq_hisobot(uid: int) -> dict:
    """Oy boshi va hozirgi holat"""
    ob   = _oy_boshi()
    bosh = TZ.localize(datetime(ob.year, ob.month, 1))
    async with _P().acquire() as c:
        kirim_oy  = float(await c.fetchval("""
            SELECT COALESCE(SUM(jami),0) FROM kirimlar
            WHERE user_id=$1 AND sana>=$2
        """, uid, bosh) or 0)
        chiqim_oy = float(await c.fetchval("""
            SELECT COALESCE(SUM(jami),0) FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana>=$2
        """, uid, bosh) or 0)
        tovarlar_q = float(await c.fetchval("""
            SELECT COALESCE(SUM(qoldiq * olish_narxi),0)
            FROM tovarlar WHERE user_id=$1
        """, uid) or 0)

    return {
        "oy_boshi":         str(ob),
        "kirim_oy":         kirim_oy,
        "chiqim_oy":        chiqim_oy,
        "tovarlar_qiymati": tovarlar_q,
    }


async def foyda_tahlil(uid: int) -> dict:
    """Bugungi / haftalik / oylik foyda tahlili"""
    ob  = _oy_boshi()
    bugun_bosh  = _kun_boshi()
    hafta_bosh  = TZ.localize(datetime.combine(
        _bugun() - timedelta(days=_bugun().weekday()),
        datetime.min.time()
    ))
    oy_bosh     = TZ.localize(datetime(ob.year, ob.month, 1))

    async def _foyda(bosh):
        async with _P().acquire() as c:
            return await c.fetchval("""
                SELECT COALESCE(SUM(
                    (ch.sotish_narxi - ch.olish_narxi) * ch.miqdor
                ), 0)
                FROM chiqimlar ch
                JOIN sotuv_sessiyalar ss ON ss.id=ch.sessiya_id
                WHERE ch.user_id=$1 AND ss.sana>=$2
            """, uid, bosh) or Decimal("0")

    bugungi  = await _foyda(bugun_bosh)
    haftalik = await _foyda(hafta_bosh)
    oylik    = await _foyda(oy_bosh)

    async with _P().acquire() as c:
        top_tovar = await c.fetchrow("""
            SELECT ch.tovar_nomi AS nomi,
                   SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor) AS foyda
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id=ch.sessiya_id
            WHERE ch.user_id=$1 AND ss.sana>=$2
            GROUP BY ch.tovar_nomi
            ORDER BY foyda DESC LIMIT 1
        """, uid, oy_bosh)

    return {
        "bugungi":   float(bugungi),
        "haftalik":  float(haftalik),
        "oylik":     float(oylik),
        "top_tovar": dict(top_tovar) if top_tovar else None,
    }


async def haftalik_hisobot(uid: int) -> dict:
    """Oxirgi 7 kunlik hisobot"""
    async with _P().acquire() as c:
        kr = await c.fetchrow("""
            SELECT COUNT(*) AS n, COALESCE(SUM(jami),0) AS jami
            FROM kirimlar
            WHERE user_id=$1
              AND sana >= NOW() AT TIME ZONE 'Asia/Tashkent' - INTERVAL '7 days'
        """, uid)
        ch = await c.fetchrow("""
            SELECT COUNT(*) AS n,
                   COALESCE(SUM(jami),0)     AS jami,
                   COALESCE(SUM(qarz),0)     AS qarz,
                   COALESCE(SUM(tolangan),0) AS tolangan
            FROM sotuv_sessiyalar
            WHERE user_id=$1
              AND sana >= NOW() AT TIME ZONE 'Asia/Tashkent' - INTERVAL '7 days'
        """, uid)
        foyda = await c.fetchrow("""
            SELECT COALESCE(SUM(ch.jami),0)                  AS daromad,
                   COALESCE(SUM(ch.olish_narxi*ch.miqdor),0) AS xarajat
            FROM chiqimlar ch
            WHERE ch.user_id=$1
              AND ch.sana >= NOW() AT TIME ZONE 'Asia/Tashkent' - INTERVAL '7 days'
        """, uid)
        jami_qarz = float(await c.fetchval("""
            SELECT COALESCE(SUM(qolgan),0) FROM qarzlar
            WHERE user_id=$1 AND yopildi=FALSE
        """, uid) or 0)

    d = float(foyda["daromad"]); x = float(foyda["xarajat"])
    return {
        "kr_n":    int(kr["n"]),    "kr_jami":   float(kr["jami"]),
        "ch_n":    int(ch["n"]),    "ch_jami":   float(ch["jami"]),
        "ch_qarz": float(ch["qarz"]),
        "ch_tolangan": float(ch["tolangan"]),
        "foyda":   d - x,          "jami_qarz": jami_qarz,
    }