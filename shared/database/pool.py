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
            result = await c.fetch("SELECT * FROM klientlar")
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

def _split_sql_statements(sql: str) -> list[str]:
    """SQL ni statement larga ajratadi; $$ ... $$ ichidagi ; ga e'tibor bermaydi.
    )::TYPE; qatorida ; da bo'linmaydi (syntax error at or near :: oldini olish)."""
    statements: list[str] = []
    current: list[str] = []
    i = 0
    n = len(sql)
    in_dollar = False
    last_newline = 0  # current da oxirgi \n indeksi

    while i < n:
        if not in_dollar:
            if i + 1 < n and sql[i:i + 2] == "$$":
                in_dollar = True
                current.append("$$")
                i += 2
                continue
            if sql[i] == "\n":
                last_newline = len(current)
            if sql[i] == ";" and (i + 1 >= n or sql[i + 1] in "\n\r"):
                # Qatorda )::TYPE; bo'lsa shu ; da bo'lmaymiz (expression tugashi)
                line_since_newline = "".join(current[last_newline:])
                if "::" in line_since_newline:
                    current.append(";")
                    i += 1
                    continue
                stmt = "".join(current).strip()
                if stmt:
                    statements.append(stmt)
                current = []
                i += 1
                continue
            current.append(sql[i])
            i += 1
        else:
            if i + 1 < n and sql[i:i + 2] == "$$":
                in_dollar = False
                current.append("$$")
                i += 2
                continue
            current.append(sql[i])
            i += 1

    stmt = "".join(current).strip()
    if stmt:
        statements.append(stmt)
    return _split_combined_statements(statements)


def _split_combined_statements(statements: list[str]) -> list[str]:
    """Bir statement ichida ); keyin CREATE/SELECT/... bo'lsa alohida statementlarga ajratadi.
    ); dan keyin \\n, comment (-- ...) va bo'sh qatorlar bo'lishi mumkin."""
    import re
    result: list[str] = []
    # ); dan keyin ixtiyoriy \n, comment qatorlari, keyin CREATE/SELECT/...
    pat = re.compile(
        r"\);\s*\n(?:\s*\n|\s*--[^\n]*\n)*\s*(?=CREATE\s|SELECT\s|INSERT\s|UPDATE\s|DELETE\s|DROP\s|ALTER\s)",
        re.IGNORECASE,
    )
    for stmt in statements:
        parts = pat.split(stmt)
        if len(parts) == 1:
            result.append(stmt)
            continue
        for i, part in enumerate(parts):
            p = part.strip()
            if not p:
                continue
            if i == 0 and not p.endswith(");"):
                p = p + ");"
            result.append(p)
    return result


async def run_schema_on_conn(conn: asyncpg.Connection) -> None:
    """
    Berilgan connection da schema.sql ni bajaradi (statement-split bilan).
    Bot va boshqa servislar o'z pool ulanishida chaqirishi mumkin.
    """
    import os
    schema_file = os.path.join(
        os.path.dirname(__file__), "schema.sql"
    )
    if not os.path.exists(schema_file):
        log.error("schema.sql topilmadi: %s", schema_file)
        return
    sql = open(schema_file, encoding="utf-8").read()
    statements = _split_sql_statements(sql)
    for idx, stmt in enumerate(statements):
        stmt = stmt.strip()
        no_comment = "".join(
            line for line in stmt.splitlines()
            if line.strip() and not line.strip().startswith("--")
        ).strip()
        if not no_comment:
            continue
        last_err = None
        for attempt in range(3):
            try:
                await conn.execute(stmt)
                break
            except Exception as e:
                last_err = e
                err = str(e).lower()
                if "already exists" in err or "duplicate" in err:
                    log.debug("Schema stmt %s: allaqachon mavjud, o'tkazildi", idx + 1)
                    break
                if "tuple concurrently updated" in err or "could not serialize" in err:
                    if attempt < 2:
                        await asyncio.sleep(0.5 * (attempt + 1))
                        continue
                log.error(
                    "Schema statement %s xato: %s | stmt preview: %.200s...",
                    idx + 1, e, no_comment[:200]
                )
                raise
        else:
            if last_err is not None:
                log.error(
                    "Schema statement %s xato (3 urinish): %s | stmt: %.200s...",
                    idx + 1, last_err, no_comment[:200]
                )
                raise last_err
    log.info("✅ Schema tayyor (RLS yoqilgan)")


async def schema_init() -> None:
    """SQL schema faylidan jadvallarni yaratish (har bir statement alohida)."""
    async with get_pool().acquire() as conn:
        await run_schema_on_conn(conn)


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
