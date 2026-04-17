"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — WEBHOOK INTEGRATSIYA PLATFORMASI                     ║
║                                                                          ║
║  Zapier/Make.com darajasida — tashqi tizimlar bilan bog'lanish:         ║
║  • 1C, iiko, R-Keeper, Poster — O'zbekiston POS tizimlari             ║
║  • Telegram guruhlar — sotuv hisobotlarini yuborish                    ║
║  • Google Sheets — real-time ma'lumot eksport                          ║
║  • Bitrix24, AmoCRM — CRM integratsiya                                 ║
║                                                                          ║
║  EVENTLAR:                                                               ║
║  sotuv.yaratildi     → yangi sotuv bo'lganda                           ║
║  sotuv.bekor_qilindi → sotuv bekor qilinganda                         ║
║  klient.yaratildi    → yangi klient qo'shilganda                      ║
║  qarz.yaratildi      → yangi qarz paydo bo'lganda                     ║
║  qoldiq.tugadi       → tovar qoldig'i tugaganda                       ║
║  tolov.qabul_qilindi → to'lov qabul qilinganda                       ║
║  hisobot.tayyor      → kunlik/haftalik hisobot tayyor bo'lganda       ║
║                                                                          ║
║  FORMAT: POST JSON — industry standard webhook                          ║
║  XAVFSIZLIK: HMAC-SHA256 signature + retry (3x exponential backoff)    ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import hashlib
import hmac
import json
import logging
import time
import asyncio
from datetime import datetime
from typing import List, Optional
from decimal import Decimal

log = logging.getLogger(__name__)

WEBHOOK_EVENTLAR = {
    "sotuv.yaratildi": "Yangi sotuv",
    "sotuv.bekor_qilindi": "Sotuv bekor qilindi",
    "sotuv.tasdiqlandi": "Sotuv tasdiqlandi",
    "klient.yaratildi": "Yangi klient",
    "klient.yangilandi": "Klient ma'lumotlari yangilandi",
    "qarz.yaratildi": "Yangi qarz",
    "qarz.tolandi": "Qarz to'landi",
    "qoldiq.tugadi": "Tovar qoldig'i tugadi",
    "qoldiq.kam": "Tovar qoldig'i kam",
    "tolov.qabul_qilindi": "To'lov qabul qilindi",
    "hisobot.kunlik": "Kunlik hisobot tayyor",
    "hisobot.haftalik": "Haftalik hisobot tayyor",
    "aksiya.boshlandi": "Yangi aksiya boshlandi",
    "checkin.yaratildi": "Check-in qilindi",
}

WEBHOOK_MIGRATION = """
CREATE TABLE IF NOT EXISTS webhooklar (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(100),
    eventlar TEXT[] NOT NULL DEFAULT '{}',
    faol BOOLEAN DEFAULT TRUE,
    retry_soni INTEGER DEFAULT 3,
    yaratilgan TIMESTAMPTZ DEFAULT NOW(),
    oxirgi_chaqiruv TIMESTAMPTZ,
    muvaffaqiyatli_soni INTEGER DEFAULT 0,
    xato_soni INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_webhooklar_user ON webhooklar(user_id);

CREATE TABLE IF NOT EXISTS webhook_log (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER NOT NULL,
    event VARCHAR(50) NOT NULL,
    payload JSONB,
    status_kod INTEGER,
    javob TEXT,
    urinish_soni INTEGER DEFAULT 1,
    muvaffaqiyatli BOOLEAN DEFAULT FALSE,
    davomiyligi_ms INTEGER,
    vaqt TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_log ON webhook_log(webhook_id, vaqt DESC);
"""


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)


def _sign_payload(payload: str, secret: str) -> str:
    """HMAC-SHA256 imzo yaratish."""
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()


async def webhook_yuborish(conn, uid: int, event: str, data: dict) -> int:
    """Event bo'lganda barcha mos webhook'larga yuborish.

    Args:
        conn: DB connection
        uid: foydalanuvchi ID
        event: event nomi (masalan: "sotuv.yaratildi")
        data: event ma'lumotlari

    Returns:
        Yuborilgan webhook'lar soni
    """
    webhooklar = await conn.fetch("""
        SELECT id, url, secret, retry_soni FROM webhooklar
        WHERE user_id = $1 AND faol = TRUE AND $2 = ANY(eventlar)
    """, uid, event)

    if not webhooklar:
        return 0

    payload = json.dumps({
        "event": event,
        "vaqt": datetime.utcnow().isoformat(),
        "data": data,
    }, cls=DecimalEncoder, ensure_ascii=False)

    yuborildi = 0
    for wh in webhooklar:
        # Fire-and-forget xato'larini ushlash uchun done_callback qo'shamiz
        # (aks holda task jim o'ladi, monitoring ko'rmaydi)
        task = asyncio.create_task(_yuborish_retry(conn, wh, event, payload))
        wh_id = wh.get("id", "?")
        wh_url_preview = (wh.get("url") or "")[:40]
        def _make_cb(wid, url_p):
            def _cb(t: asyncio.Task) -> None:
                if t.cancelled():
                    return
                exc = t.exception()
                if exc is not None:
                    log.error("❌ Webhook task xato id=%s url=%s...: %s",
                              wid, url_p, exc, exc_info=exc)
            return _cb
        task.add_done_callback(_make_cb(wh_id, wh_url_preview))
        yuborildi += 1

    return yuborildi


async def _yuborish_retry(conn, webhook: dict, event: str, payload: str):
    """Webhook yuborish — exponential backoff retry bilan."""
    import aiohttp

    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "X-SavdoAI-Event": event,
        "X-SavdoAI-Timestamp": str(int(time.time())),
    }

    if webhook["secret"]:
        headers["X-SavdoAI-Signature"] = _sign_payload(payload, webhook["secret"])

    max_retry = webhook.get("retry_soni", 3)
    for urinish in range(1, max_retry + 1):
        boshlangan = time.monotonic()
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook["url"], data=payload, headers=headers, timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    javob = await resp.text()
                    davomiyligi = int((time.monotonic() - boshlangan) * 1000)
                    muvaffaqiyatli = 200 <= resp.status < 300

                    await conn.execute("""
                        INSERT INTO webhook_log (webhook_id, event, payload, status_kod, javob,
                            urinish_soni, muvaffaqiyatli, davomiyligi_ms)
                        VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)
                    """, webhook["id"], event, payload, resp.status,
                        javob[:1000], urinish, muvaffaqiyatli, davomiyligi)

                    if muvaffaqiyatli:
                        await conn.execute("""
                            UPDATE webhooklar SET oxirgi_chaqiruv=NOW(),
                                muvaffaqiyatli_soni = muvaffaqiyatli_soni + 1
                            WHERE id=$1
                        """, webhook["id"])
                        return

        except Exception as e:
            davomiyligi = int((time.monotonic() - boshlangan) * 1000)
            await conn.execute("""
                INSERT INTO webhook_log (webhook_id, event, status_kod, javob,
                    urinish_soni, muvaffaqiyatli, davomiyligi_ms)
                VALUES ($1, $2, 0, $3, $4, FALSE, $5)
            """, webhook["id"], event, str(e)[:500], urinish, davomiyligi)

        # Exponential backoff: 2s, 4s, 8s
        if urinish < max_retry:
            await asyncio.sleep(2 ** urinish)

    # Barcha urinishlar muvaffaqiyatsiz
    await conn.execute("""
        UPDATE webhooklar SET xato_soni = xato_soni + 1 WHERE id=$1
    """, webhook["id"])


# ════════════════════════════════════════════════════════════
#  WEBHOOK CRUD
# ════════════════════════════════════════════════════════════

async def webhook_yaratish(conn, uid: int, data: dict) -> int:
    """Yangi webhook yaratish."""
    import secrets
    secret = data.get("secret") or secrets.token_hex(16)

    return await conn.fetchval("""
        INSERT INTO webhooklar (user_id, nomi, url, secret, eventlar)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
    """, uid, data["nomi"], data["url"], secret, data.get("eventlar", []))


async def webhook_royxati(conn, uid: int) -> List[dict]:
    """Webhook'lar ro'yxati."""
    rows = await conn.fetch(
        "SELECT * FROM webhooklar WHERE user_id=$1 ORDER BY id DESC", uid)
    return [dict(r) for r in rows]
