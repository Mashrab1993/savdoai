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


def _jwt_tekshir(token: str, secret: str) -> int | None:
    """JWT dan user_id ajratish"""
    import base64
    import hmac
    try:
        parts = token.split(".")
        if len(parts) != 3: return None
        h64, p64, s64 = parts
        msg = f"{h64}.{p64}".encode()
        kutilgan = base64.urlsafe_b64encode(
            hmac.new(secret.encode(), msg, "sha256").digest()
        ).rstrip(b"=").decode()
        if not hmac.compare_digest(s64, kutilgan): return None
        pad = p64 + "=" * (-len(p64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(pad))
        if payload.get("exp", 0) < time.time(): return None
        return int(payload.get("sub", 0)) or None
    except Exception:
        return None


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """
    WebSocket endpoint.
    Ulanish: ws://host/ws?token=JWT_TOKEN
    Xabarlar: {"type": "ping"} → {"type": "pong"}
              {"type": "sync", "data": {...}} → broadcast to user devices
    """
    import os
    token = ws.query_params.get("token", "")
    secret = os.getenv("JWT_SECRET", "")

    if not secret:
        await ws.close(code=4001, reason="JWT_SECRET o'rnatilmagan")
        return

    user_id = _jwt_tekshir(token, secret)
    if not user_id:
        await ws.close(code=4003, reason="Token yaroqsiz")
        return

    await _manager.connect(ws, user_id)
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
