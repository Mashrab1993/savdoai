"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — WEBSOCKET REAL-TIME SYNC             ║
║  ✅ JWT autentifikatsiya                                     ║
║  ✅ Tranzaksiya real-time sync                              ║
║  ✅ Ping/pong (connection keep-alive)                       ║
║  ✅ Connection manager (ko'p user)                          ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.api.deps import jwt_tekshir

log = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """WebSocket ulanishlar menejeri"""

    def __init__(self):
        self._active: dict[int, list[WebSocket]] = {}

    async def connect(self, ws: WebSocket, user_id: int) -> None:
        await ws.accept()
        if user_id not in self._active:
            self._active[user_id] = []
        self._active[user_id].append(ws)
        log.info("WS connect: uid=%d (jami=%d)",
                 user_id, sum(len(v) for v in self._active.values()))

    def disconnect(self, ws: WebSocket, user_id: int) -> None:
        if user_id in self._active:
            self._active[user_id] = [w for w in self._active[user_id] if w != ws]
            if not self._active[user_id]:
                del self._active[user_id]
        log.info("WS disconnect: uid=%d", user_id)

    async def send_to_user(self, user_id: int, data: dict) -> int:
        """Foydalanuvchiga xabar yuborish. Qaytaradi: yuborilgan ulanishlar soni."""
        sent = 0
        for ws in self._active.get(user_id, []):
            try:
                await ws.send_json(data)
                sent += 1
            except Exception as _exc:
                log.debug("%s: %s", "websocket", _exc)  # was silent
        return sent

    async def broadcast(self, data: dict) -> int:
        """Barcha ulanganlarga xabar. Qaytaradi: yuborilgan."""
        sent = 0
        for uid, conns in self._active.items():
            for ws in conns:
                try:
                    await ws.send_json(data)
                    sent += 1
                except Exception as _exc:
                    log.debug("%s: %s", "websocket", _exc)  # was silent
        return sent

    @property
    def online_count(self) -> int:
        return sum(len(v) for v in self._active.values())

    @property
    def online_users(self) -> list[int]:
        return list(self._active.keys())


_manager = ConnectionManager()


def get_manager() -> ConnectionManager:
    return _manager


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """
    WebSocket endpoint — PyJWT autentifikatsiya.

    2026-05-20 audit: hand-rolled JWT verifier (HMAC-SHA256) services.api.deps
    ichidagi PyJWT (algorithm whitelist, iat/exp/nbf tekshirish, leeway) bilan
    almashtirildi. Token endi query string'da emas, balki accept() dan keyingi
    BIRINCHI xabarda yuboriladi → token proxy/CDN/server access loglarida
    qolmaydi.

    Mijoz protokoli:
        ws.connect("/ws")           # accept()
        ws.send({"token": "JWT"})   # birinchi xabar
        # endi normal {type: ping/sync/status} xabarlari ishlaydi

    BREAKING-CHANGE: eski mijozlar `?token=JWT` query bilan ulansa endi
    rad etiladi. Frontend/Flutter kodi shu protokolga yangilanishi kerak.
    """
    import os
    secret = os.getenv("JWT_SECRET", "")
    if not secret:
        await ws.close(code=4001, reason="JWT_SECRET o'rnatilmagan")
        return

    await ws.accept()
    # Birinchi xabar — auth handshake. 5s timeout xavfsizlik uchun
    # (idle ulanish JWT'siz socketni egallab turmaslik uchun).
    import asyncio
    try:
        first = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
    except (asyncio.TimeoutError, json.JSONDecodeError, Exception) as e:
        log.info("WS auth timeout/decode: %s", e)
        try:
            await ws.close(code=1008, reason="Auth timeout")
        except Exception:
            pass
        return

    token = (first or {}).get("token", "") if isinstance(first, dict) else ""
    user_id = jwt_tekshir(token) if token else None
    if not user_id:
        try:
            await ws.close(code=1008, reason="Token yaroqsiz")
        except Exception:
            pass
        return

    # Mijozga auth muvaffaqiyat haqida xabar
    try:
        await ws.send_json({"type": "auth_ok", "uid": user_id, "ts": time.time()})
    except Exception:
        return

    # ConnectionManager.connect() ws.accept() ni ham chaqiradi — bizda allaqachon
    # accept() bo'lgan. Manager ro'yxatiga qo'shamiz ikkinchi accept'siz.
    if user_id not in _manager._active:
        _manager._active[user_id] = []
    _manager._active[user_id].append(ws)
    log.info("WS connect (PyJWT): uid=%d (jami=%d)",
             user_id, sum(len(v) for v in _manager._active.values()))
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_json({"type": "error", "message": "JSON xato"})
                continue

            msg_type = msg.get("type", "")

            if msg_type == "ping":
                await ws.send_json({"type": "pong", "ts": time.time()})

            elif msg_type == "sync":
                # Foydalanuvchining barcha qurilmalariga sync
                data = msg.get("data", {})
                await _manager.send_to_user(user_id, {
                    "type": "sync",
                    "data": data,
                    "from": "server",
                    "ts": time.time(),
                })

            elif msg_type == "status":
                await ws.send_json({
                    "type": "status",
                    "online": _manager.online_count,
                    "users": len(_manager.online_users),
                })

            else:
                await ws.send_json({"type": "error", "message": f"Noma'lum tur: {msg_type}"})

    except WebSocketDisconnect:
        _manager.disconnect(ws, user_id)
    except Exception as e:
        log.error("WS xato uid=%d: %s", user_id, e)
        _manager.disconnect(ws, user_id)
