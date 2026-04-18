"""
STT Cache Invalidation Bus — v25.7

MUAMMO:
  services/bot/bot_services/voice.py da _STT_USER_PROMPT_CACHE — IN-PROCESS
  (bot jarayoni xotirasida) tovar nomlari keshi. Bu kesh Gemini STT'ga
  yuboriladigan system prompt'ga tovar nomlarini qo'shadi.

  BUG: foydalanuvchi WEB dashboard orqali yangi tovar qo'shsa
  (services/api/routes/tovarlar.py:tovar_yarat) — bot STT cache'i bilmaydi,
  1 daqiqagacha (TTL) yangi tovarni tanib olmaydi.

YECHIM:
  Redis Pub/Sub kanali orqali cross-service notification.

  API publishes:   stt_cache_invalidate(uid)
  Bot subscribes:  on message → stt_cache_tozala(uid) + fuzzy_matcher.cache_tozala(uid)

Architecture:
  ┌────────────┐   Redis channel        ┌──────────┐
  │ API        │  "stt:invalidate"      │ Bot      │
  │ tovar_yarat├─────PUBLISH───────────>│ listener │
  │            │     message = uid      │          │
  └────────────┘                        └──────────┘
                                              │
                                              ▼
                                    stt_cache_tozala(uid)
                                    fuzzy_matcher.cache_tozala(uid)

USAGE:
  # API tomonda (services/api/routes/tovarlar.py):
  from shared.services.stt_cache_bus import publish_invalidate
  await publish_invalidate(uid)

  # Bot tomonda (services/bot/main.py startup):
  from shared.services.stt_cache_bus import start_invalidate_listener
  await start_invalidate_listener(invalidate_callback)
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Callable, Awaitable

log = logging.getLogger(__name__)

_CHANNEL = "stt:invalidate"
_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


async def _get_redis():
    """Redis async client — lazy import (redis yangi versiya talab qiladi)."""
    try:
        from redis.asyncio import from_url
    except ImportError as e:
        log.warning("redis.asyncio yuklanmadi: %s — kesh bus o'chirilgan", e)
        return None
    try:
        return await from_url(_REDIS_URL, decode_responses=True)
    except Exception as e:
        log.warning("Redis connect xato: %s — kesh bus o'chirilgan", e)
        return None


async def publish_invalidate(uid: int, reason: str = "product_change") -> bool:
    """API tomondan tovar qo'shilganda chaqiriladi.

    Returns True agar xabar yuborildi, False xato bo'lsa (silent fail — bu
    kritik emas, TTL baribir 60s'da tozalaydi).
    """
    r = await _get_redis()
    if r is None:
        return False
    try:
        payload = json.dumps({"uid": uid, "reason": reason})
        count = await r.publish(_CHANNEL, payload)
        log.debug("stt_cache_bus publish uid=%d → %d subscribers", uid, count)
        return True
    except Exception as e:
        log.warning("stt_cache_bus publish xato: %s", e)
        return False
    finally:
        try:
            await r.aclose()
        except Exception:
            pass


async def start_invalidate_listener(
    on_invalidate: Callable[[int, str], Awaitable[None]],
    *,
    max_retries: int = 5,
) -> None:
    """Bot startup paytida chaqiriladi — background task sifatida ishga tushadi.

    on_invalidate: async callback — (uid, reason) qabul qiladi
    max_retries: Redis uzilishida qayta urinish soni (exponential backoff)

    Bu funksiya HECH QACHON RETURN QILMAYDI (daimiy listener).
    Background task sifatida ishga tushiring:

        asyncio.create_task(start_invalidate_listener(my_cb))
    """
    retry_delay = 1
    attempt = 0

    while True:
        r = await _get_redis()
        if r is None:
            attempt += 1
            if attempt >= max_retries:
                log.error("stt_cache_bus listener Redis'ga ulana olmadi %d marta — to'xtatildi", max_retries)
                return
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)
            continue

        pubsub = None
        try:
            pubsub = r.pubsub()
            await pubsub.subscribe(_CHANNEL)
            log.info("stt_cache_bus listener started on channel '%s'", _CHANNEL)
            attempt = 0  # reset on success
            retry_delay = 1

            async for msg in pubsub.listen():
                if msg.get("type") != "message":
                    continue
                raw = msg.get("data", "")
                try:
                    data = json.loads(raw) if raw else {}
                    uid = int(data.get("uid", 0))
                    reason = str(data.get("reason", "unknown"))
                    if uid > 0:
                        try:
                            await on_invalidate(uid, reason)
                        except Exception as e:
                            log.warning("stt_cache invalidate callback xato: %s", e)
                except Exception as e:
                    log.warning("stt_cache_bus message parse xato: %s", e)

        except Exception as e:
            log.warning("stt_cache_bus listener xato: %s — qayta ulanyapman", e)
            attempt += 1
            if attempt >= max_retries:
                log.error("stt_cache_bus listener to'xtatildi (max retries)")
                return
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)
        finally:
            if pubsub is not None:
                try:
                    await pubsub.unsubscribe(_CHANNEL)
                    await pubsub.aclose()
                except Exception:
                    pass
            try:
                await r.aclose()
            except Exception:
                pass


# Test utility (running without Redis will just log and return False)
async def _self_test() -> None:
    """Qisqa self-test — faqat connectivity tekshiradi."""
    r = await _get_redis()
    if r is None:
        print("❌ Redis mavjud emas (REDIS_URL=%s)" % _REDIS_URL)
        return
    try:
        pong = await r.ping()
        print(f"✅ Redis ulanadi: {pong}")
    finally:
        try:
            await r.aclose()
        except Exception:
            pass


if __name__ == "__main__":
    asyncio.run(_self_test())
