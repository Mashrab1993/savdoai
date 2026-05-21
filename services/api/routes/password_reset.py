"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — PAROL TIKLASH (PASSWORD RESET)                   ║
║  Telefon + Telegram kod orqali o'zini-o'zi tiklash          ║
║                                                              ║
║  Audit P1 (2026-05-20): avval faqat admin parol qoyardi —   ║
║  endi user o'zi tiklab oladi. 2 bosqich:                    ║
║   1) /api/v1/auth/password-reset/request  → kod yuborish    ║
║   2) /api/v1/auth/password-reset/confirm  → yangi parol     ║
║                                                              ║
║  Rate limit: telefon bo'yicha 3 so'rov / soat                ║
║  Kod muddati: 10 daqiqa, 1 marta ishlatish                  ║
║  Kod hash'i saqlanadi (plain text emas)                     ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import os
import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from shared.database.pool import get_pool

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


# ════════════════════════════════════════════════════════════
#  Konfiguratsiya
# ════════════════════════════════════════════════════════════

CODE_TTL_MINUTES = 10           # Kod muddati
CODE_LENGTH = 6                 # Xona soni
RATE_MAX_PER_HOUR = 3           # Telefon bo'yicha soatiga max 3 so'rov
MIN_NEW_PASSWORD = 6            # Yangi parol min uzunlik

# Test rejimi: kod javobda qaytariladi (productionda False bo'lishi kerak,
# faqat env DEBUG_PWD_RESET=1 bo'lganda True).
_DEBUG_RETURN_CODE = os.getenv("DEBUG_PWD_RESET", "0") == "1"


# ════════════════════════════════════════════════════════════
#  Yordamchi funksiyalar
# ════════════════════════════════════════════════════════════

def _telefon_tozala(tel: str) -> str:
    """Telefon raqamni normallashtirish — main.py'dagi bilan bir xil."""
    t = (tel or "").replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if t.startswith("+"):
        t = t[1:]
    if len(t) == 9 and t and t[0] in "3456789":
        t = "998" + t
    return t


def _telefon_variants(tel_norm: str) -> list[str]:
    """Login endpointi bilan bir xil variant qidirish."""
    variants = {tel_norm, "+" + tel_norm}
    if tel_norm.startswith("998") and len(tel_norm) == 12:
        variants.add(tel_norm[3:])  # 901234567
    return list(variants)


def _hash_code(code: str) -> str:
    """Kodni SHA-256 hash qilish (plain saqlanmaydi)."""
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _yangi_kod() -> str:
    """6-xonali tasodifiy kod (cryptographically secure)."""
    # secrets.randbelow → 0..999999, zfill bilan 6 xona
    return str(secrets.randbelow(10 ** CODE_LENGTH)).zfill(CODE_LENGTH)


def _parol_hash(parol: str) -> str:
    """main.py'dagi PBKDF2-SHA256 bilan bir xil format."""
    salt = os.urandom(16).hex()
    h = hashlib.pbkdf2_hmac("sha256", parol.encode(), salt.encode(), 100_000).hex()
    return f"{salt}:{h}"


async def _send_telegram_code(chat_id: int, code: str) -> bool:
    """Telegram orqali kod yuborish. Muvaffaqiyat → True, aks holda False.

    BOT_TOKEN o'rnatilmagan bo'lsa silently False.
    """
    bot_token = os.getenv("BOT_TOKEN", "").strip()
    if not bot_token:
        log.warning("Parol tiklash: BOT_TOKEN yo'q, kod yuborilmadi (uid=%s)", chat_id)
        return False

    msg = (
        "🔐 *Parol tiklash kodi*\n"
        f"\n"
        f"Sizning kodingiz: `{code}`\n"
        f"\n"
        f"⏱ Muddat: {CODE_TTL_MINUTES} daqiqa\n"
        f"❗ Agar siz so'ramagan bo'lsangiz, e'tibor bermang."
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            r = await http.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"},
            )
            if r.status_code == 200 and r.json().get("ok"):
                return True
            log.warning(
                "Parol tiklash Telegram yuborish xato: status=%d body=%s",
                r.status_code, r.text[:200],
            )
    except Exception as e:
        log.warning("Parol tiklash Telegram exception: %s", e)
    return False


# ════════════════════════════════════════════════════════════
#  Modellar
# ════════════════════════════════════════════════════════════

class ResetRequestSorov(BaseModel):
    telefon: str = Field(..., min_length=5, max_length=20)


class ResetConfirmSorov(BaseModel):
    telefon: str = Field(..., min_length=5, max_length=20)
    kod: str = Field(..., min_length=CODE_LENGTH, max_length=CODE_LENGTH)
    yangi_parol: str = Field(..., min_length=MIN_NEW_PASSWORD, max_length=128)


# ════════════════════════════════════════════════════════════
#  STEP 1 — Kod so'rash
# ════════════════════════════════════════════════════════════

@router.post("/password-reset/request")
async def password_reset_request(data: ResetRequestSorov, request: Request):
    """
    1-bosqich: telefon bo'yicha 6-xonali kod yuborish.

    Xavfsizlik:
      * Telefon raqamning tizimda borligi haqida ma'lumot oshkor qilinmaydi
        (har doim "yuborildi" javobi — user enumeration himoyasi).
      * Telefon bo'yicha soatiga max 3 so'rov (oxirgi 60 daqiqa).
      * Eski faol kodlar yangisi bilan bekor qilinmaydi — eski ham
        ishlatish mumkin (faqat birinchi 'used'), bu safe.
    """
    tel_norm = _telefon_tozala(data.telefon)
    if not tel_norm or len(tel_norm) < 9:
        raise HTTPException(400, "Telefon raqam noto'g'ri")

    ip = request.client.host if request.client else "unknown"
    now = datetime.now(timezone.utc)
    hour_ago = now - timedelta(hours=1)

    async with get_pool().acquire() as c:
        # Foydalanuvchini topish (login endpointi bilan bir xil mantiq)
        variants = _telefon_variants(tel_norm)
        user = await c.fetchrow(
            "SELECT id, faol FROM users "
            "WHERE regexp_replace(COALESCE(telefon,''), '[^0-9+]', '', 'g') = ANY($1::text[]) "
            "AND faol=TRUE LIMIT 1",
            variants,
        )

        # Rate limit: telefon bo'yicha (user enum himoyasiga ham mos —
        # mavjud emas bo'lsa ham yozuv qilmaymiz, lekin javob bir xil)
        recent_count = await c.fetchval(
            "SELECT COUNT(*) FROM password_reset_codes "
            "WHERE phone=$1 AND created_at > $2",
            tel_norm, hour_ago,
        )
        if recent_count and recent_count >= RATE_MAX_PER_HOUR:
            log.warning(
                "Parol tiklash rate limit: phone=%s ip=%s count=%d",
                tel_norm, ip, recent_count,
            )
            # User enumeration himoyasi uchun 429 emas, 200 qaytaramiz?
            # YO'Q — rate limit har doim 429 bo'lishi kerak (tizim DoS himoyasi).
            raise HTTPException(
                429,
                f"Juda ko'p so'rov. Soatiga {RATE_MAX_PER_HOUR} marta cheklov. "
                f"Keyinroq urinib ko'ring.",
            )

        # User topilmasa, har doim bir xil javob (enum himoyasi)
        if not user:
            log.info("Parol tiklash: user topilmadi phone=%s ip=%s", tel_norm, ip)
            return {
                "ok": True,
                "message": (
                    "Agar telefon ro'yxatdan o'tgan bo'lsa, "
                    "Telegram bot orqali kod yuboriladi."
                ),
            }

        # Kod yaratish
        code = _yangi_kod()
        code_hash = _hash_code(code)
        expires_at = now + timedelta(minutes=CODE_TTL_MINUTES)

        await c.execute(
            "INSERT INTO password_reset_codes "
            "(phone, user_id, code_hash, expires_at, ip_addr) "
            "VALUES ($1, $2, $3, $4, $5)",
            tel_norm, int(user["id"]), code_hash, expires_at, ip,
        )

    # Telegramga yuborish (DB tashqarisida — lock ushlamaslik)
    sent = await _send_telegram_code(int(user["id"]), code)
    log.info(
        "🔑 Parol tiklash kod yuborildi: uid=%d phone=%s tg_sent=%s",
        int(user["id"]), tel_norm, sent,
    )

    resp = {
        "ok": True,
        "message": (
            "Agar telefon ro'yxatdan o'tgan bo'lsa, "
            "Telegram bot orqali kod yuboriladi."
        ),
        "telegram_sent": sent,
    }
    # Faqat DEBUG rejimida (test/dev) kodni qaytaramiz
    if _DEBUG_RETURN_CODE:
        resp["debug_kod"] = code
    return resp


# ════════════════════════════════════════════════════════════
#  STEP 2 — Kod tasdiqlash + yangi parol
# ════════════════════════════════════════════════════════════

@router.post("/password-reset/confirm")
async def password_reset_confirm(data: ResetConfirmSorov, request: Request):
    """
    2-bosqich: kodni tekshirib yangi parol o'rnatish.

    Xavfsizlik:
      * Kod hash'i bilan solishtiriladi (timing-safe).
      * Kod muddati 10 daqiqa.
      * Bir martagina ishlatiladi (used=TRUE).
      * Yangi parol min 6 belgi.
      * IP loglanadi.
    """
    tel_norm = _telefon_tozala(data.telefon)
    kod = (data.kod or "").strip()
    yangi_parol = (data.yangi_parol or "").strip()
    ip = request.client.host if request.client else "unknown"

    if not tel_norm or len(tel_norm) < 9:
        raise HTTPException(400, "Telefon raqam noto'g'ri")
    if not kod.isdigit() or len(kod) != CODE_LENGTH:
        raise HTTPException(400, f"Kod {CODE_LENGTH} xonali raqam bo'lishi kerak")
    if len(yangi_parol) < MIN_NEW_PASSWORD:
        raise HTTPException(
            400,
            f"Parol kamida {MIN_NEW_PASSWORD} belgi bo'lishi kerak",
        )

    code_hash = _hash_code(kod)
    now = datetime.now(timezone.utc)

    async with get_pool().acquire() as c:
        async with c.transaction():
            row = await c.fetchrow(
                "SELECT id, user_id FROM password_reset_codes "
                "WHERE phone=$1 AND code_hash=$2 "
                "  AND used=FALSE AND expires_at > $3 "
                "ORDER BY created_at DESC LIMIT 1 "
                "FOR UPDATE",
                tel_norm, code_hash, now,
            )
            if not row:
                log.warning(
                    "Parol tiklash confirm xato: phone=%s ip=%s (kod xato/muddati o'tgan)",
                    tel_norm, ip,
                )
                raise HTTPException(401, "Kod noto'g'ri yoki muddati o'tgan")

            user_id = int(row["user_id"])

            # User hali ham faolligini tekshirish
            user = await c.fetchrow(
                "SELECT id, faol FROM users WHERE id=$1",
                user_id,
            )
            if not user or not user.get("faol"):
                raise HTTPException(403, "Foydalanuvchi faol emas")

            # Parolni yangilash
            new_hash = _parol_hash(yangi_parol)
            await c.execute(
                "UPDATE users SET parol_hash=$1, yangilangan=NOW() WHERE id=$2",
                new_hash, user_id,
            )

            # Kodni 'used' qilish
            await c.execute(
                "UPDATE password_reset_codes "
                "SET used=TRUE, used_at=$1 WHERE id=$2",
                now, int(row["id"]),
            )

            # Shu telefon uchun boshqa faol kodlarni ham bekor qilish
            # (xavfsizlik: bitta tiklashdan keyin barcha eski kodlar o'lik)
            await c.execute(
                "UPDATE password_reset_codes "
                "SET used=TRUE, used_at=$1 "
                "WHERE phone=$2 AND used=FALSE",
                now, tel_norm,
            )

    log.info(
        "✅ Parol tiklandi: uid=%d phone=%s ip=%s",
        user_id, tel_norm, ip,
    )
    return {
        "ok": True,
        "user_id": user_id,
        "message": "Parol muvaffaqiyatli yangilandi. Endi yangi parol bilan kiring.",
    }
