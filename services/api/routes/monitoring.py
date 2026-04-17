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
        # Health check'da Redis fail silent — lekin log'ga yozamiz
        # (production'da Redis'ni tiklash boshlanishi kerak)
        log.warning("Health check: Redis ping xato: %s", _e)
    latency_ms = round((_t.monotonic() - start) * 1000, 1)
    return {
        "status": "ok", "version": __version__, "service": "api",
        "db_ping_ms": db.get("ping_ms"),
        "db_pool": f"{db.get('used',0)}/{db.get('size',0)}",
        "redis_ok": redis_ok, "redis_ms": redis_ms,
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
    """Prometheus-compat metrics"""
    try:
        async with get_pool().acquire() as c:
            user_count = await c.fetchval(
                "SELECT COUNT(*) FROM users WHERE faol=TRUE"
            )
            pool = get_pool()
            pool_size = pool.get_size() if hasattr(pool, 'get_size') else 0
    except Exception:
        user_count = 0
        pool_size = 0

    return (
        f"# HELP mm_faol_users Faol foydalanuvchilar\n"
        f"# TYPE mm_faol_users gauge\n"
        f"mm_faol_users {user_count}\n"
        f"# HELP mm_db_pool DB pool holati\n"
        f"# TYPE mm_db_pool gauge\n"
        f"mm_db_pool_size {pool_size}\n"
    )
