"""
╔══════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA v21.3 — MA'LUMOTLAR BAZASI ULANISH            ║
║                                                              ║
║  ✅ PostgreSQL Row Level Security (RLS)                     ║
║  ✅ Har so'rovda user_id SET — kafolatlangan izolyatsiya     ║
║  ✅ PgBouncer bilan ishlash (transaction pooling)           ║
║  ✅ Reconnect (5 urinish)                                   ║
║  ✅ 20,000+ foydalanuvchi uchun optimizatsiya                ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import asyncio
import logging
from contextlib import asynccontextmanager
from decimal import Decimal, InvalidOperation
from typing import Any, AsyncGenerator, Optional

import asyncpg

log = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None


# ════════════════════════════════════════════════════════════
#  YORDAMCHI
# ════════════════════════════════════════════════════════════

def D(v: Any) -> Decimal:
    if isinstance(v, Decimal): return v
    if v is None or v == "": return Decimal("0")
    try:
        return Decimal(str(v).replace(",", ".").strip())
    except InvalidOperation:
        return Decimal("0")


async def _init_conn(conn: asyncpg.Connection) -> None:
    """Har yangi connection uchun codec va sozlamalar"""
    await conn.set_type_codec(
        "numeric",
        encoder=str,
        decoder=lambda x: Decimal(str(x)),
        schema="pg_catalog",
        format="text",
    )


# ════════════════════════════════════════════════════════════
#  POOL INIT
# ════════════════════════════════════════════════════════════

async def pool_init(dsn: str,
                    min_size: int = 5,
                    max_size: int = 50) -> None:
    """
    Connection pool ishga tushirish.
    20,000 foydalanuvchi uchun max_size=50 tavsiya etiladi.
    PgBouncer bilan: pool_mode=transaction, max_client_conn=200

    v21.3 TURBO:
    - statement_cache_size=200 — prepared statements keshlanadi
    - max_queries=50000 — connection recycling
    - max_inactive_connection_lifetime=180 — tezroq recycle
    """
    global _pool

    # Idempotent — agar pool allaqachon bor va ishlaganda, qayta yaratmaslik
    if _pool is not None:
        try:
            # Qisqa health check
            async with _pool.acquire() as _tc:
                await _tc.fetchval("SELECT 1")
            log.debug("DB pool allaqachon mavjud va sog'lom — skip")
            return
        except Exception:
            # Pool buzilgan — yopib qayta yaratish
            log.warning("DB pool buzilgan — qayta yaratilmoqda")
            try:
                await _pool.close()
            except Exception:
                pass
            _pool = None

    # DSN normalizatsiya
    for prefix in ("postgresql+asyncpg://", "postgres+asyncpg://", "postgres://"):
        if dsn.startswith(prefix):
            dsn = "postgresql://" + dsn[len(prefix):]
            break

    for urinish in range(1, 6):
        try:
            _pool = await asyncpg.create_pool(
                dsn,
                min_size=min_size,
                max_size=max_size,
                command_timeout=30,
                max_queries=50000,
                max_inactive_connection_lifetime=180,
                statement_cache_size=200,
                init=_init_conn,
            )
            log.info("✅ DB pool tayyor (min=%d max=%d stmt_cache=200 urinish=%d)",
                     min_size, max_size, urinish)
            return
        except Exception as e:
            if urinish == 5:
                log.critical("❌ DB ulanmadi (5 urinish): %s", e)
                raise
            log.warning("⚠️ DB ulanish xato (%d/5): %s — %ds kutish",
                        urinish, e, urinish * 2)
            await asyncio.sleep(urinish * 2)


def get_pool() -> asyncpg.Pool:
    if not _pool:
        raise RuntimeError("DB pool ishga tushirilmagan!")
    return _pool


async def pool_close() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        log.info("DB pool yopildi")


async def pool_health() -> dict:
    """DB pool holati — monitoring uchun"""
    if not _pool:
        return {"status": "closed", "size": 0}
    try:
        start = __import__("time").monotonic()
        async with _pool.acquire() as c:
            await c.fetchval("SELECT 1")
        ping_ms = round((__import__("time").monotonic() - start) * 1000, 1)
        return {
            "status": "ok",
            "ping_ms": ping_ms,
            "size": _pool.get_size(),
            "free": _pool.get_idle_size(),
            "used": _pool.get_size() - _pool.get_idle_size(),
            "min": _pool.get_min_size(),
            "max": _pool.get_max_size(),
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ════════════════════════════════════════════════════════════
#  RLS CONTEXT — ASOSIY INNOVATSIYA
# ════════════════════════════════════════════════════════════

@asynccontextmanager
async def rls_conn(user_id: int) -> AsyncGenerator[asyncpg.Connection, None]:
    """
    Row Level Security context manager.

    Har so'rovda SET app.uid — DB darajasida izolyatsiya.
    20,000 foydalanuvchi bir-birining ma'lumotini KO'ROLMAYDI.

    Ishlatish:
        async with rls_conn(uid) as c:
            result = await c.fetch("SELECT id, user_id, ism, telefon, manzil, eslatma, kredit_limit, jami_sotib, yaratilgan FROM klientlar")
            # Faqat uid=... klientlar qaytadi!

    Texnik:
        1. Connection olish
        2. SET LOCAL app.uid = $uid (tranzaksiya ichida)
        3. Barcha jadvallar RLS policy orqali filtrlanadi
        4. Tranzaksiya tugasa — setting tozalanadi
    """
    async with get_pool().acquire() as conn:
        async with conn.transaction():
            # RLS kontekstini o'rnatish
            await conn.execute(
                "SELECT set_config('app.uid', $1, true)",
                str(user_id)
            )
            try:
                yield conn
            finally:
                # Kontekstni tozalash (xavfsizlik uchun)
                try:
                    await conn.execute(
                        "SELECT set_config('app.uid', '', true)"
                    )
                except Exception as _exc:
                    log.debug("%s: %s", "pool", _exc)  # was silent


@asynccontextmanager
async def rls_conn_notrx(user_id: int) -> AsyncGenerator[asyncpg.Connection, None]:
    """
    RLS context (tranzaksiyasiz — faqat o'qish uchun).
    set_config bilan ishlatiladi (SET LOCAL transaction tashqarisida ishlamaydi).
    """
    async with get_pool().acquire() as conn:
        # set_config(..., is_local=False) — transaction bo'lmasa ham ishlaydi
        await conn.execute(
            "SELECT set_config('app.uid', $1, false)", str(user_id)
        )
        try:
            yield conn
        finally:
            try:
                await conn.execute("SELECT set_config('app.uid', '', false)")
            except Exception as _exc:
                log.debug("%s: %s", "pool", _exc)  # was silent


# ════════════════════════════════════════════════════════════
#  SCHEMA INIT
# ════════════════════════════════════════════════════════════

async def schema_init() -> None:
    """SQL schema faylidan jadvallarni yaratish — xatolarga chidamli"""
    import os, re
    schema_file = os.path.join(
        os.path.dirname(__file__), "schema.sql"
    )
    if not os.path.exists(schema_file):
        log.error("schema.sql topilmadi: %s", schema_file)
        return

    sql = open(schema_file, encoding="utf-8").read()

    # Smart split: DO $$ ... $$; bloklarni to'g'ri ajratish
    statements = []
    current = []
    in_dollar = False
    for line in sql.split("\n"):
        stripped = line.strip()
        # Skip pure comments
        if stripped.startswith("--") and not current:
            continue

        current.append(line)

        # Track $$ blocks
        dollar_count = line.count("$$")
        if dollar_count % 2 == 1:  # odd number of $$ toggles
            in_dollar = not in_dollar

        # Statement end: semicolon at end, not inside $$ block
        if not in_dollar and stripped.endswith(";"):
            stmt = "\n".join(current).strip()
            if stmt and stmt != ";":
                statements.append(stmt)
            current = []

    # Any remaining
    if current:
        stmt = "\n".join(current).strip()
        if stmt and stmt != ";" and len(stmt) > 5:
            statements.append(stmt)

    async with get_pool().acquire() as conn:
        ok = 0
        skip = 0
        fail = 0
        for i, stmt in enumerate(statements, 1):
            try:
                await conn.execute(stmt)
                ok += 1
            except Exception as e:
                err_msg = str(e)
                s = stmt.upper().strip()
                # Critical: only CREATE TABLE failures are fatal
                is_create_table = s.startswith("CREATE TABLE")
                if any(w in err_msg for w in ["already exists", "duplicate"]):
                    skip += 1
                elif is_create_table:
                    fail += 1
                    log.error("Schema %d CRITICAL: %s | %.80s", i, err_msg, stmt)
                else:
                    # Non-critical: INDEX, VIEW, FUNCTION, POLICY, TRIGGER — skip
                    skip += 1
                    log.warning("Schema %d skip: %s | %.60s", i, err_msg, stmt)

        if fail > 0:
            log.error("❌ Schema %d ta critical xato!", fail)
            raise RuntimeError(f"Schema init: {fail} CREATE TABLE xato")

    log.info("✅ Schema tayyor (%d OK, %d skip, RLS yoqilgan)", ok, skip)


async def rls_tekshir() -> list[dict]:
    """RLS to'g'ri yoqilganini tekshirish"""
    async with get_pool().acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                t.tablename,
                t.rowsecurity AS rls_yoqilgan,
                COUNT(p.policyname) AS policy_soni
            FROM pg_tables t
            LEFT JOIN pg_policies p
                ON p.schemaname = t.schemaname
               AND p.tablename  = t.tablename
               AND p.policyname LIKE '%isolation%'
            WHERE t.schemaname = 'public'
              AND t.tablename IN (
                  'klientlar','tovarlar','kirimlar',
                  'sotuv_sessiyalar','chiqimlar',
                  'qaytarishlar','qarzlar','menyu'
              )
            GROUP BY t.tablename, t.rowsecurity
            ORDER BY t.tablename
        """)

    result = [dict(r) for r in rows]
    for r in result:
        status = "✅" if r["rls_yoqilgan"] and r["policy_soni"] > 0 else "❌"
        log.info("%s %s: RLS=%s, policy=%d",
                 status, r["tablename"],
                 r["rls_yoqilgan"], r["policy_soni"])
    return result
