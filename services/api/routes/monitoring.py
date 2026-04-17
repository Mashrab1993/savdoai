"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — MONITORING ROUTELARI                             ║
║  health, readyz, live, metrics, version                     ║
║  main.py dan ajratildi — v25.3.2                            ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import os
import logging
import time as _t

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from shared.database.pool import get_pool, pool_health
from shared.observability.process_uptime import process_info

log = logging.getLogger(__name__)
router = APIRouter(tags=["Monitoring"])

__version__ = "25.3.2"


@router.get("/health")
async def health():
    """Kengaytirilgan health check — DB, Redis, pool pressure, AI providers."""
    from shared.cache.redis_cache import cache_health
    db = await pool_health()
    redis_ok = False
    redis_ms = None
    start = _t.monotonic()
    try:
        redis_url = os.getenv("REDIS_URL", "")
        if redis_url:
            import redis.asyncio as _aioredis
            r = _aioredis.from_url(redis_url, socket_connect_timeout=2)
            rs = _t.monotonic()
            await r.ping()
            redis_ms = round((_t.monotonic() - rs) * 1000, 1)
            redis_ok = True
            await r.close()
    except Exception as _e:
        log.warning("Health check: Redis ping xato: %s", _e)
    latency_ms = round((_t.monotonic() - start) * 1000, 1)

    # Umumiy holat — DB degraded yoki pool pressure yuqori bo'lsa aks ettiramiz
    overall = "ok"
    if db.get("status") in ("degraded", "error"):
        overall = "degraded"
    if not redis_ok and os.getenv("REDIS_URL"):
        overall = "degraded"

    # Cache sog'lig'i (Redis uzoq vaqt uzilgan bo'lsa ko'rsatadi)
    cache_hlth = cache_health()

    # AI providerlar (ANTHROPIC_API_KEY, GEMINI_API_KEY — bor/yo'q)
    ai_providers = {
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY", "").strip()),
        "gemini": bool(os.getenv("GEMINI_API_KEY", "").strip() or
                       os.getenv("GOOGLE_API_KEY", "").strip()),
        "opus_4_7_audit": bool(os.getenv("ANTHROPIC_API_KEY", "").strip()),
    }

    return {
        "status": overall, "version": __version__, "service": "api",
        "db_ping_ms": db.get("ping_ms"),
        "db_pool": f"{db.get('used',0)}/{db.get('size',0)}",
        "db_pressure_pct": db.get("pressure_pct", 0),
        "db_status": db.get("status"),
        "redis_ok": redis_ok, "redis_ms": redis_ms,
        "redis_disconnected_since": cache_hlth.get("redis_disconnected_since", 0),
        "cache_miss_due_to_redis_down": cache_hlth.get("cache_misses_due_to_redis_down", 0),
        "ai_providers": ai_providers,
        "latency_ms": latency_ms,
        **process_info(),
    }


@router.get("/version")
@router.get("/version/")
async def version():
    return {
        "status": "ok", "service": "api", "version": __version__,
        "env": os.getenv("RAILWAY_ENVIRONMENT") or "local",
        "port": os.getenv("PORT", "8000"),
        **process_info(),
    }


@router.get("/healthz")
async def healthz(request: Request):
    """Kubernetes/Railway health probe"""
    rid = getattr(request.state, "request_id", None)
    log.info("probe healthz 200 request_id=%s", rid)
    return {"status": "ok", **process_info()}


@router.get("/live")
async def live(request: Request):
    """Minimal liveness — DB/Redis tekshirilmaydi"""
    rid = getattr(request.state, "request_id", None)
    log.info("probe live 200 request_id=%s", rid)
    return {"status": "alive", **process_info()}


@router.get("/readyz")
async def readyz():
    """Ready probe — DB + Redis ulangandan keyin tayyor"""
    from shared.cache.redis_cache import redis_health
    db_ok = False
    redis_ok = False

    try:
        async with get_pool().acquire() as c:
            await c.fetchval("SELECT 1")
        db_ok = True
    except Exception as e:
        log.error("DB readyz check failed: %s", e)

    r_info = await redis_health()
    redis_ok = r_info.get("status") == "ok"
    redis_required = os.getenv("REDIS_REQUIRED", "true").lower() == "true"
    is_ready = db_ok and (redis_ok or not redis_required)

    if is_ready:
        return {
            "status": "ready",
            "db": "ok",
            "redis": "ok" if redis_ok else "degraded",
        }
    deps = {}
    if not db_ok:
        deps["db"] = "unavailable"
    if not redis_ok and redis_required:
        deps["redis"] = "unavailable"
    return JSONResponse(status_code=503, content={"status": "not ready", **deps})


@router.get("/metrics")
async def metrics():
    """Prometheus-compat metrics — pool, cache, AI provider holatlari."""
    from shared.cache.redis_cache import cache_health as _cache_health
    user_count = 0
    pool_size = 0
    pool_used = 0
    pool_free = 0
    pool_pressure_pct = 0.0
    try:
        async with get_pool().acquire() as c:
            user_count = await c.fetchval(
                "SELECT COUNT(*) FROM users WHERE faol=TRUE"
            ) or 0
        # Pool holati — o'rtacha pressure'ni hisoblash uchun
        pool = get_pool()
        if hasattr(pool, 'get_size'):
            pool_size = pool.get_size()
            pool_free = pool.get_idle_size() if hasattr(pool, 'get_idle_size') else 0
            pool_used = pool_size - pool_free
            pool_max = pool.get_max_size() if hasattr(pool, 'get_max_size') else 0
            if pool_max > 0:
                pool_pressure_pct = round(pool_used / pool_max * 100, 1)
    except Exception as _e:
        log.debug("metrics: user_count/pool olishda xato: %s", _e)

    # Cache sog'lig'i
    ch = _cache_health()
    redis_connected = 1 if ch.get("redis_connected") else 0
    cache_miss_down = ch.get("cache_misses_due_to_redis_down", 0)

    # AI providerlar
    anthropic_ready = 1 if (os.getenv("ANTHROPIC_API_KEY") or "").strip() else 0
    gemini_ready = 1 if ((os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()) else 0

    return (
        f"# HELP mm_faol_users Faol foydalanuvchilar\n"
        f"# TYPE mm_faol_users gauge\n"
        f"mm_faol_users {user_count}\n"
        f"# HELP mm_db_pool_size DB pool hajmi\n"
        f"# TYPE mm_db_pool_size gauge\n"
        f"mm_db_pool_size {pool_size}\n"
        f"# HELP mm_db_pool_used DB pool band connectionlar\n"
        f"# TYPE mm_db_pool_used gauge\n"
        f"mm_db_pool_used {pool_used}\n"
        f"# HELP mm_db_pool_free DB pool bo'sh connectionlar\n"
        f"# TYPE mm_db_pool_free gauge\n"
        f"mm_db_pool_free {pool_free}\n"
        f"# HELP mm_db_pool_pressure_pct Pool bandlik foizi (0-100)\n"
        f"# TYPE mm_db_pool_pressure_pct gauge\n"
        f"mm_db_pool_pressure_pct {pool_pressure_pct}\n"
        f"# HELP mm_redis_connected Redis ulangan (1) yoki uzilgan (0)\n"
        f"# TYPE mm_redis_connected gauge\n"
        f"mm_redis_connected {redis_connected}\n"
        f"# HELP mm_cache_miss_due_to_redis_down Redis tushgan paytda cache miss\n"
        f"# TYPE mm_cache_miss_due_to_redis_down counter\n"
        f"mm_cache_miss_due_to_redis_down {cache_miss_down}\n"
        f"# HELP mm_ai_anthropic Anthropic API kaliti mavjud (1) yoki yo'q (0)\n"
        f"# TYPE mm_ai_anthropic gauge\n"
        f"mm_ai_anthropic {anthropic_ready}\n"
        f"# HELP mm_ai_gemini Gemini API kaliti mavjud (1) yoki yo'q (0)\n"
        f"# TYPE mm_ai_gemini gauge\n"
        f"mm_ai_gemini {gemini_ready}\n"
    )
