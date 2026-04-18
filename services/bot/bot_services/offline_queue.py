"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — OFFLINE NAVBAT (Retry Queue) v1.0                 ║
║                                                               ║
║  AI vaqtincha ishlamasa → xabar navbatga tushadi             ║
║  10 sekund keyin qayta uriniladi (3 marta)                   ║
║  Foydalanuvchiga "qayta urinilmoqda" xabari ko'rsatiladi    ║
║                                                               ║
║  Telegram offline: foydalanuvchi internet yo'q paytda         ║
║  ovoz yubora olmaydi — bu Telegram tomonidan boshqariladi.  ║
║  Bot serverda har doim ishlaydi.                              ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import asyncio
import logging
import time
from collections import deque
from typing import Any
from collections.abc import Callable, Coroutine

log = logging.getLogger(__name__)

# Navbat sozlamalari
MAX_QUEUE_SIZE = 100
MAX_RETRIES = 3
RETRY_DELAY_S = 10

# Foydalanuvchi navbatlari
_queues: dict[int, deque] = {}


class QueueItem:
    """Navbatdagi element."""
    __slots__ = ("uid", "func", "args", "kwargs", "retries", "created", "callback")

    def __init__(self, uid: int, func: Callable, args: tuple = (),
                 kwargs: dict = None, callback: Callable = None):
        self.uid = uid
        self.func = func
        self.args = args
        self.kwargs = kwargs or {}
        self.retries = 0
        self.created = time.time()
        self.callback = callback


async def navbatga_qosh(uid: int, func: Callable[..., Coroutine],
                         args: tuple = (), kwargs: dict = None,
                         callback: Callable = None) -> bool:
    """
    Funksiyani navbatga qo'shish.
    
    Args:
        uid: foydalanuvchi ID
        func: async funksiya (masalan: voice.matnga_aylantir)
        args: funksiya argumentlari
        kwargs: funksiya keyword argumentlari
        callback: muvaffaqiyatli bo'lganda chaqiriladigan funksiya
    
    Returns:
        True — navbatga qo'shildi, False — navbat to'liq
    """
    if uid not in _queues:
        _queues[uid] = deque(maxlen=MAX_QUEUE_SIZE)

    q = _queues[uid]
    if len(q) >= MAX_QUEUE_SIZE:
        log.warning("Navbat to'liq (uid=%d, %d ta)", uid, len(q))
        return False

    item = QueueItem(uid, func, args, kwargs, callback)
    q.append(item)
    log.info("📋 Navbatga qo'shildi (uid=%d, navbat=%d)", uid, len(q))

    # Darhol qayta urinish boshlash — task'ning xato'sini ushlab log'ga yozamiz
    # (aks holda fire-and-forget — yashirin xato bo'lib qoladi)
    task = asyncio.create_task(_retry_item(item))
    def _on_done(t: asyncio.Task) -> None:
        if t.cancelled():
            return
        exc = t.exception()
        if exc is not None:
            log.error("❌ Navbat retry task xato (uid=%d): %s", item.uid, exc, exc_info=exc)
    task.add_done_callback(_on_done)
    return True


async def _retry_item(item: QueueItem) -> None:
    """Elementni qayta urinish."""
    while item.retries < MAX_RETRIES:
        item.retries += 1
        await asyncio.sleep(RETRY_DELAY_S)

        try:
            natija = await item.func(*item.args, **item.kwargs)
            log.info("✅ Navbat: %d-urinishda muvaffaqiyat (uid=%d)",
                     item.retries, item.uid)

            # Callback chaqirish
            if item.callback:
                try:
                    await item.callback(natija)
                except Exception as e:
                    log.warning("Navbat callback xato: %s", e)

            # Navbatdan olib tashlash
            _remove(item)
            return

        except Exception as e:
            log.warning("📋 Navbat: %d-urinish xato (uid=%d): %s",
                        item.retries, item.uid, e)

    # Barcha urinishlar tugadi
    log.error("📋 Navbat: %d urinishdan keyin ham fail (uid=%d)",
              MAX_RETRIES, item.uid)
    _remove(item)


def _remove(item: QueueItem) -> None:
    """Elementni navbatdan olib tashlash."""
    q = _queues.get(item.uid)
    if q:
        try:
            q.remove(item)
        except ValueError:
            pass


def navbat_soni(uid: int) -> int:
    """Foydalanuvchi navbatidagi elementlar soni."""
    return len(_queues.get(uid, []))


def navbat_tozalash(uid: int) -> None:
    """Foydalanuvchi navbatini tozalash."""
    _queues.pop(uid, None)
