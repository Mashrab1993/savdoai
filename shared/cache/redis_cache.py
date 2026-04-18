"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — REDIS CACHE                           ║
║  Nur tezligida cache:                                        ║
║  ✅ Foydalanuvchi sessiya (30 daqiqa)                       ║
║  ✅ Hisobot cache (5 daqiqa)                                ║
║  ✅ Kognitiv natija cache (1 soat)                          ║
║  ✅ Rate limiting (sliding window)                          ║
║  ✅ Distributed lock (qo'sh yozuv oldini olish)             ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
import os
import time
from typing import Any, Optional

log = logging.getLogger(__name__)

_redis = None
# Cache sog'lig'i hisoblagichlari — Grafana/Prometheus'ga olib chiqish uchun
_redis_disconnected_at: float = 0.0
_cache_miss_due_to_redis_down = 0
REDIS_OPTIONAL = os.getenv("REDIS_OPTIONAL", "false").lower() == "true"

# TTL konstantalar (sekund)
TTL_SESSIYA   = 1800   # 30 daqiqa
TTL_HISOBOT   = 300    # 5 daqiqa
TTL_KOGNITIV  = 3600   # 1 soat
TTL_USER      = 600    # 10 daqiqa
TTL_LOCK      = 30     # 30 sekund
RATE_LIMIT    = 100    # req/daqiqa (max)
RATE_WINDOW   = 60     # sekund


async def redis_init(url: str) -> None:
    """Redis ulanishini ishga tushirish"""
    global _redis, _redis_disconnected_at
    try:
        import redis.asyncio as aioredis
        _redis = aioredis.from_url(
            url,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5,
            retry_on_timeout=True,
        )
        await _redis.ping()
        _redis_disconnected_at = 0.0
        log.info("✅ Redis ulandi")
    except Exception as e:
        _redis = None
        _redis_disconnected_at = time.time()
        # Production'da Redis yo'qligi ERROR darajasida — monitoring
        # tizimlari alert chiqarishi kerak. REDIS_OPTIONAL=true bo'lsagina
        # WARNING bo'ladi (dev/test muhiti uchun).
        if REDIS_OPTIONAL:
            log.warning("⚠️ Redis ulana olmadi: %s — memoriy fallback (REDIS_OPTIONAL=true)", e)
        else:
            log.error(
                "❌ REDIS YO'Q — cache ishlamayapti! Ishlash darajasi va RLS sessiyalar "
                "ta'sir ostida. URL=%s xato=%s. Monitoring alert tekshiring.",
                url[:50] + "..." if len(url) > 50 else url, e,
            )


def cache_health() -> dict:
    """Cache sog'lig'i — metriklar uchun (/health endpoint ishlatadi)."""
    return {
        "redis_connected": _redis is not None,
        "redis_disconnected_since": _redis_disconnected_at,
        "cache_misses_due_to_redis_down": _cache_miss_due_to_redis_down,
    }


def _r():
    return _redis


# ════════════════════════════════════════════════════════════
#  ASOSIY OPERATSIYALAR
# ════════════════════════════════════════════════════════════

async def cache_ol(kalit: str) -> Any | None:
    """Keshdan qiymat olish"""
    global _cache_miss_due_to_redis_down
    if not _r():
        _cache_miss_due_to_redis_down += 1
        return None
    try:
        qiymat = await _r().get(kalit)
        if qiymat:
            return json.loads(qiymat)
    except Exception as e:
        log.warning("Redis get xato: %s", e)
    return None


async def cache_yoz(kalit: str, qiymat: Any,
                    ttl: int = TTL_USER) -> bool:
    """Keshga qiymat yozish"""
    if not _r():
        return False
    try:
        await _r().setex(kalit, ttl, json.dumps(qiymat, ensure_ascii=False, default=str))
        return True
    except Exception as e:
        log.warning("Redis set xato: %s", e)
        return False


async def cache_del(kalit: str) -> None:
    """Keshdan o'chirish"""
    if not _r():
        return
    try:
        await _r().delete(kalit)
    except Exception as _exc:
        log.debug("%s: %s", "redis_cache", _exc)  # was silent


# ════════════════════════════════════════════════════════════
#  MAXSUS CACHE KALITLARI
# ════════════════════════════════════════════════════════════

def k_user(uid: int) -> str:
    return f"user:{uid}"

def k_sessiya(uid: int) -> str:
    return f"sess:{uid}"

def k_hisobot_kunlik(uid: int) -> str:
    return f"hisobot:kunlik:{uid}"

def k_hisobot_oylik(uid: int) -> str:
    return f"hisobot:oylik:{uid}"

def k_kognitiv(matn_hash: str) -> str:
    return f"kognitiv:{matn_hash}"

def k_qarzlar(uid: int) -> str:
    return f"qarzlar:{uid}"


async def kognitiv_cache_ol(matn: str) -> dict | None:
    """Kognitiv natijani keshdan olish"""
    import hashlib
    h = hashlib.sha256(matn.encode()).hexdigest()[:32]
    return await cache_ol(k_kognitiv(h))


async def kognitiv_cache_yoz(matn: str, natija: dict) -> None:
    """Kognitiv natijani keshga yozish"""
    import hashlib
    h = hashlib.sha256(matn.encode()).hexdigest()[:32]
    await cache_yoz(k_kognitiv(h), natija, TTL_KOGNITIV)


async def user_cache_tozala(uid: int) -> None:
    """Foydalanuvchi keshini tozalash"""
    for k in [k_user(uid), k_sessiya(uid),
              k_hisobot_kunlik(uid), k_hisobot_oylik(uid),
              k_qarzlar(uid)]:
        await cache_del(k)


# ════════════════════════════════════════════════════════════
#  RATE LIMITING (Sliding Window)
# ════════════════════════════════════════════════════════════

async def rate_limit_tekshir(kalit: str,
                              max_req: int = 100,
                              window_s: int = 60) -> bool:
    """
    Sliding window rate limiting.
    True → ruxsat, False → blok
    """
    if not _r():
        return True  # Redis yo'q — o'tkazib yuborish

    now = time.time()
    pipe_key = f"rate:{kalit}"

    try:
        pipe = _r().pipeline()
        pipe.zremrangebyscore(pipe_key, 0, now - window_s)
        pipe.zcard(pipe_key)
        pipe.zadd(pipe_key, {str(now): now})
        pipe.expire(pipe_key, window_s + 1)
        results = await pipe.execute()
        soni = results[1]
        return soni < max_req
    except Exception as e:
        log.warning("Rate limit xato: %s", e)
        return True


# ════════════════════════════════════════════════════════════
#  DISTRIBUTED LOCK
# ════════════════════════════════════════════════════════════

async def lock_ol(kalit: str, ttl: int = TTL_LOCK) -> bool:
    """
    Distributed lock olish.
    Parallel so'rovlarda faqat bitta bajariladigan (sotuv saqlash va h.k.)
    """
    if not _r():
        return True
    try:
        return await _r().set(
            f"lock:{kalit}", "1",
            nx=True, ex=ttl
        ) is not None
    except Exception:
        return True


async def lock_qo_yber(kalit: str) -> None:
    """Lockni bo'shatish"""
    await cache_del(f"lock:{kalit}")


# ════════════════════════════════════════════════════════════
#  PIPELINE (BATCH) — Nur tezligida bir necha operatsiya
# ════════════════════════════════════════════════════════════

async def cache_pipeline_yoz(items: list[tuple[str, Any, int]]) -> int:
    """
    Bir vaqtda bir necha kalitni yozish (pipeline).
    items: [(kalit, qiymat, ttl), ...]
    Qaytaradi: muvaffaqiyatli yozilgan soni.
    """
    if not _r() or not items:
        return 0
    try:
        pipe = _r().pipeline(transaction=False)
        for kalit, qiymat, ttl in items:
            pipe.setex(kalit, ttl, json.dumps(qiymat, ensure_ascii=False, default=str))
        await pipe.execute()
        return len(items)
    except Exception as e:
        log.warning("Pipeline yozish xato: %s", e)
        return 0


async def cache_pipeline_ol(kalitlar: list[str]) -> dict[str, Any]:
    """
    Bir vaqtda bir necha kalitni olish (pipeline).
    Qaytaradi: {kalit: qiymat} dict.
    """
    if not _r() or not kalitlar:
        return {}
    try:
        pipe = _r().pipeline(transaction=False)
        for k in kalitlar:
            pipe.get(k)
        results = await pipe.execute()
        out = {}
        for k, v in zip(kalitlar, results):
            if v:
                try:
                    out[k] = json.loads(v)
                except Exception:
                    out[k] = v
        return out
    except Exception as e:
        log.warning("Pipeline olish xato: %s", e)
        return {}


async def redis_health() -> dict:
    """Redis holat tekshiruvi"""
    if not _r():
        return {"status": "disconnected", "latency_ms": None}
    try:
        import time
        t0 = time.monotonic()
        await _r().ping()
        ms = round((time.monotonic() - t0) * 1000, 2)
        return {"status": "ok", "latency_ms": ms}
    except Exception as e:
        log.warning("Redis health check xato: %s", e)
        return {"status": "error", "latency_ms": None}
