"""
SAVDOAI — Self-Serve Signup + Multi-Tenant Auth
2026-05-23

Yangi do'kon /signup orqali tenant ochishi (admin aralashuvisiz).
SalesDoc/Smartup tipida — har do'kon o'z kompaniya kodi (company_kod) oladi.

ARXITEKTURA (multi-tenant):
- Owner user signup qiladi → company_kod avto-generatsiya (slug + suffix)
- 14 kun bepul sinov boshlanadi
- JWT token avtomatik (user darrov login bo'ladi)
- Owner sotuvchilarni keyin qo'shadi (parent_id=owner.id)
- Data isolation: queries filtered by tenant_id = COALESCE(parent_id, user_id)

DEPLOY:
1. Migration: shared/migrations/versions/037_multitenant_company_kod.sql
2. main.py'ga `from services.api.routes.signup import signup_router`
3. `app.include_router(signup_router, tags=["Auth"])`
"""
from __future__ import annotations
import hashlib
import logging
import os
import re
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field

from services.api.deps import get_uid

log = logging.getLogger(__name__)

signup_router = APIRouter()


class SignupSorov(BaseModel):
    """Owner signup so'rovi."""
    dokon_nomi: str = Field(..., min_length=2, max_length=200)
    ism: str = Field(..., min_length=2, max_length=100)
    telefon: str = Field(..., min_length=9, max_length=20)
    parol: str = Field(..., min_length=6, max_length=100)
    company_kod: str | None = Field(default=None, max_length=30, pattern=r"^[a-z0-9\-]*$")


class CheckKodSorov(BaseModel):
    kod: str = Field(..., min_length=2, max_length=30, pattern=r"^[a-z0-9\-]+$")


class SotuvchiQoshSorov(BaseModel):
    """Owner sotuvchini qo'shadi."""
    ism: str = Field(..., min_length=2, max_length=100)
    telefon: str = Field(..., min_length=9, max_length=20)
    login: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_\.\-]+$")
    parol: str = Field(..., min_length=4, max_length=100)
    role: str = Field(default="sotuvchi", pattern="^(admin|sotuvchi|agent|merchant)$")


def _parol_hash(parol: str) -> str:
    salt = os.urandom(16).hex()
    h = hashlib.pbkdf2_hmac("sha256", parol.encode(), salt.encode(), 100_000).hex()
    return f"{salt}:{h}"


def _telefon_tozala(tel: str) -> str:
    t = tel.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if t.startswith("+"):
        t = t[1:]
    if len(t) == 9 and t[0] in "3456789":
        t = "998" + t
    return t


def _slugify(text: str) -> str:
    """Brend nomidan slug yaratish (kompaniya kodi uchun)."""
    t = text.lower().strip()
    # Kirill -> lotin (asosiy ozbek harflari)
    kirill_map = {
        "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e",
        "ж":"j","з":"z","и":"i","й":"i","к":"k","л":"l","м":"m",
        "н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u",
        "ф":"f","х":"x","ц":"c","ч":"c","ш":"s","щ":"s","ъ":"",
        "ы":"i","ь":"","э":"e","ю":"yu","я":"ya","ғ":"g","қ":"q",
        "ў":"w","ҳ":"h",
    }
    for k, v in kirill_map.items():
        t = t.replace(k, v)
    # Faqat harf, raqam va tireni qoldirish
    t = re.sub(r"[^a-z0-9\-]+", "-", t)
    t = re.sub(r"-+", "-", t)
    t = t.strip("-")
    return t[:30] if t else "shop"


async def _company_kod_yaratish(c, base_nomi: str, custom_kod: str | None = None) -> str:
    """Unikal company_kod yaratish."""
    if custom_kod:
        # User o'zi tanlagan kod — unique tekshirish
        mavjud = await c.fetchval(
            "SELECT 1 FROM users WHERE lower(company_kod) = lower($1) LIMIT 1",
            custom_kod,
        )
        if mavjud:
            raise HTTPException(409, f"'{custom_kod}' kodi band. Boshqa kod tanlang.")
        return custom_kod.lower()

    base = _slugify(base_nomi)
    if not base:
        base = "shop"

    candidate = base
    suffix = 0
    while True:
        mavjud = await c.fetchval(
            "SELECT 1 FROM users WHERE lower(company_kod) = $1 LIMIT 1",
            candidate,
        )
        if not mavjud:
            return candidate
        suffix += 1
        candidate = f"{base}-{suffix}"
        if suffix > 999:
            # Fallback: random suffix
            import secrets
            candidate = f"{base}-{secrets.token_hex(3)}"
            break

    return candidate


@signup_router.post("/auth/signup", tags=["Auth"])
async def auth_signup(data: SignupSorov, request: Request):
    """
    Yangi do'kon signup — 14 kun bepul sinov, kompaniya kodi avto-generatsiya.

    Returns:
        {
          "token": "...",
          "user_id": 123,
          "company_kod": "salom-market",
          "dokon_nomi": "Salom Market",
          "sinov_tugash": "2026-06-06",
          "tarif": "sinov",
          "role": "owner",
          "message": "Xush kelibsiz..."
        }
    """
    from services.api.main import get_pool, jwt_yarat
    from services.api.deps import login_rate_check

    await login_rate_check(request)

    tel_norm = _telefon_tozala(data.telefon)
    if not re.fullmatch(r"998\d{9}", tel_norm):
        raise HTTPException(400, "Telefon noto'g'ri formatda. Misol: +998901234567")

    dokon_nomi = data.dokon_nomi.strip()
    ism = data.ism.strip()
    if not dokon_nomi or not ism:
        raise HTTPException(400, "Do'kon nomi va ism kerak")

    parol_hashed = _parol_hash(data.parol)
    sinov_tugash = date.today() + timedelta(days=14)

    pool = get_pool()
    async with pool.acquire() as c:
        # Telefon mavjudligini tekshirish (account takeover xavfini oldini olish)
        mavjud = await c.fetchrow(
            "SELECT id FROM users "
            "WHERE regexp_replace(COALESCE(telefon,''), '[^0-9+]', '', 'g') = $1 "
            "AND faol=TRUE AND parent_id IS NULL LIMIT 1",
            tel_norm,
        )
        if mavjud:
            raise HTTPException(409, "Bu telefon raqami allaqachon ro'yxatdan o'tgan. Login qiling.")

        # Kompaniya kodi yaratish
        company_kod = await _company_kod_yaratish(c, dokon_nomi, data.company_kod)

        # Yangi owner user yaratish
        user_id = await c.fetchval(
            """
            INSERT INTO users (
                ism, to_liq_ism, telefon, dokon_nomi, segment,
                login, parol_hash, tarif, sinov_tugash,
                company_kod, role, parent_id,
                faol, yaratilgan
            )
            VALUES ($1, $1, $2, $3, 'universal', $2, $4, 'sinov', $5,
                    $6, 'owner', NULL, TRUE, NOW())
            RETURNING id
            """,
            ism, tel_norm, dokon_nomi, parol_hashed, sinov_tugash, company_kod,
        )

        log.info(
            "🎉 Yangi signup: user_id=%d kod=%s dokon='%s' telefon=%s",
            user_id, company_kod, dokon_nomi, tel_norm,
        )

    # Welcome xabar Telegram'ga (asinxron Celery task — signup'ni bloklamaydi)
    try:
        from services.worker.tasks import welcome_yuborish
        welcome_yuborish.delay(user_id, dokon_nomi, ism, company_kod)
    except Exception as e:
        log.warning("Welcome xabar yuborilmadi (signup davom): %s", e)

    # Demo data seeding (asinxron)
    try:
        from services.worker.tasks import demo_data_seed
        demo_data_seed.delay(user_id)
    except Exception as e:
        log.warning("Demo data seed bekor (signup davom): %s", e)

    token = jwt_yarat(user_id)
    return {
        "token": token,
        "user_id": user_id,
        "company_kod": company_kod,
        "dokon_nomi": dokon_nomi,
        "sinov_tugash": sinov_tugash.isoformat(),
        "tarif": "sinov",
        "role": "owner",
        "message": (
            f"Xush kelibsiz, {ism}! 14 kun bepul sinov boshlandi. "
            f"Sizning kompaniya kodingiz: {company_kod}"
        ),
    }


@signup_router.get("/auth/check_telefon", tags=["Auth"])
async def check_telefon(telefon: str):
    """Telefon mavjudligini tekshirish (signup real-time)."""
    from services.api.main import get_pool

    tel_norm = _telefon_tozala(telefon)
    if not re.fullmatch(r"998\d{9}", tel_norm):
        return {"mavjud": False, "xato": "noto'g'ri format"}

    async with get_pool().acquire() as c:
        mavjud = await c.fetchval(
            "SELECT 1 FROM users "
            "WHERE regexp_replace(COALESCE(telefon,''), '[^0-9+]', '', 'g') = $1 "
            "AND faol=TRUE AND parent_id IS NULL LIMIT 1",
            tel_norm,
        )
    return {"mavjud": bool(mavjud)}


@signup_router.post("/auth/check_kod", tags=["Auth"])
async def check_kod(data: CheckKodSorov):
    """Kompaniya kodi mavjudligini tekshirish (signup real-time)."""
    from services.api.main import get_pool

    async with get_pool().acquire() as c:
        mavjud = await c.fetchval(
            "SELECT 1 FROM users WHERE lower(company_kod) = $1 LIMIT 1",
            data.kod.lower(),
        )
    return {"mavjud": bool(mavjud), "kod": data.kod.lower()}


@signup_router.post("/auth/suggest_kod", tags=["Auth"])
async def suggest_kod(dokon_nomi: str):
    """Do'kon nomidan kompaniya kodi taklif qilish."""
    from services.api.main import get_pool

    async with get_pool().acquire() as c:
        kod = await _company_kod_yaratish(c, dokon_nomi, None)
    return {"kod": kod}


@signup_router.post("/api/v1/team/sotuvchi", tags=["Team"])
async def sotuvchi_qosh(
    data: SotuvchiQoshSorov,
    uid: int = Depends(get_uid),
):
    """Owner sotuvchi yoki sub-user qo'shadi."""
    from shared.database.pool import get_pool

    owner_id = uid

    pool = get_pool()
    async with pool.acquire() as c:
        owner = await c.fetchrow(
            "SELECT id, company_kod, parent_id, role FROM users WHERE id = $1 AND faol = TRUE",
            owner_id,
        )
        if not owner:
            raise HTTPException(401, "Avtorizatsiya kerak")

        # Faqat owner yoki admin yangi sub-user qo'sha oladi
        if owner["role"] not in ("owner", "admin"):
            raise HTTPException(403, "Faqat owner yoki admin sotuvchi qo'sha oladi")

        # Sub-user parent_id = owner (agar owner sub bo'lsa, parent owner'ni topadi)
        tenant_id = owner["parent_id"] if owner["parent_id"] else owner["id"]

        tel_norm = _telefon_tozala(data.telefon)
        if not re.fullmatch(r"998\d{9}", tel_norm):
            raise HTTPException(400, "Telefon noto'g'ri formatda")

        # Sub-user uchun login tenant ichida unique bo'lishi yetadi (global emas)
        # Lekin: hozirgi unique idx global. Vaqtinchalik: tenant prefix qo'shamiz
        login_full = f"{owner['company_kod']}-{data.login}".lower()

        mavjud = await c.fetchval(
            "SELECT 1 FROM users WHERE lower(login) = $1 LIMIT 1",
            login_full,
        )
        if mavjud:
            raise HTTPException(409, f"Login '{data.login}' band — boshqa tanlang")

        parol_hashed = _parol_hash(data.parol)

        sub_id = await c.fetchval(
            """
            INSERT INTO users (
                ism, to_liq_ism, telefon, dokon_nomi, segment,
                login, parol_hash, role, parent_id, company_kod,
                tarif, faol, yaratilgan
            )
            SELECT $1, $1, $2, dokon_nomi, segment,
                   $3, $4, $5, $6, company_kod,
                   tarif, TRUE, NOW()
            FROM users WHERE id = $7
            RETURNING id
            """,
            data.ism.strip(), tel_norm, login_full, parol_hashed,
            data.role, tenant_id, tenant_id,
        )

        log.info(
            "👤 Sub-user qo'shildi: id=%d parent=%d role=%s login=%s",
            sub_id, tenant_id, data.role, login_full,
        )

    return {
        "user_id": sub_id,
        "parent_id": tenant_id,
        "role": data.role,
        "login": data.login,
        "telefon": tel_norm,
        "message": f"Sotuvchi qo'shildi. Login: {data.login}",
    }


@signup_router.get("/api/v1/team", tags=["Team"])
async def team_royxat(uid: int = Depends(get_uid)):
    """Owner'ning sotuvchilar ro'yxatini olish."""
    from shared.database.pool import get_pool

    owner_id = uid

    async with get_pool().acquire() as c:
        owner = await c.fetchrow(
            "SELECT id, parent_id FROM users WHERE id = $1 AND faol = TRUE",
            owner_id,
        )
        if not owner:
            raise HTTPException(401, "Avtorizatsiya kerak")

        tenant_id = owner["parent_id"] if owner["parent_id"] else owner["id"]

        rows = await c.fetch(
            """
            SELECT id, ism, telefon, login, role, faol, yaratilgan, oxirgi_kirish
            FROM users
            WHERE (id = $1 OR parent_id = $1) AND id != $2
            ORDER BY yaratilgan DESC
            """,
            tenant_id, owner_id,
        )

    return [
        {
            "id": r["id"],
            "ism": r["ism"],
            "telefon": r["telefon"],
            "login": r["login"],
            "role": r["role"],
            "faol": r["faol"],
            "yaratilgan": r["yaratilgan"].isoformat() if r["yaratilgan"] else None,
            "oxirgi_kirish": r["oxirgi_kirish"].isoformat() if r["oxirgi_kirish"] else None,
        }
        for r in rows
    ]


class TeamLoginSorov(BaseModel):
    """Sub-user (sotuvchi/agent) login — kompaniya kodi + login + parol."""
    company_kod: str = Field(..., min_length=2, max_length=30)
    login: str = Field(..., min_length=2, max_length=30)
    parol: str = Field(..., min_length=1)


@signup_router.post("/auth/login_team", tags=["Auth"])
async def auth_login_team(data: TeamLoginSorov, request: Request):
    """
    Sub-user (sotuvchi/agent) login — SalesDoc/Smartup tipida.

    User company_kod + login + parol kiritadi.
    Backend: login_full = kod-login, qidiradi.

    Returns: {"token": "...", "user_id": ..., "role": ..., "parent_id": ...}
    """
    from services.api.main import get_pool, jwt_yarat, _parol_tekshir
    from services.api.deps import login_rate_check

    await login_rate_check(request)

    company_kod = data.company_kod.strip().lower()
    sub_login = data.login.strip().lower()
    parol = data.parol.strip()

    login_full = f"{company_kod}-{sub_login}"

    pool = get_pool()
    async with pool.acquire() as c:
        user = await c.fetchrow(
            """
            SELECT id, ism, telefon, dokon_nomi, login, parol_hash,
                   role, parent_id, faol, company_kod
            FROM users
            WHERE lower(login) = $1 AND faol = TRUE
            LIMIT 1
            """,
            login_full,
        )

    if not user:
        # Owner sifatida ham sinab ko'ramiz (kod owner'niki bo'lishi mumkin)
        async with pool.acquire() as c2:
            owner = await c2.fetchrow(
                """
                SELECT id, ism, telefon, dokon_nomi, login, parol_hash,
                       role, parent_id, faol, company_kod
                FROM users
                WHERE lower(company_kod) = $1
                  AND (lower(login) = $2 OR regexp_replace(COALESCE(telefon,''), '[^0-9+]', '', 'g') = $3)
                  AND faol = TRUE AND parent_id IS NULL
                LIMIT 1
                """,
                company_kod, sub_login, _telefon_tozala(sub_login),
            )
        user = owner

    if not user:
        raise HTTPException(401, "Kod, login yoki parol noto'g'ri")

    if not user.get("parol_hash") or not _parol_tekshir(parol, user["parol_hash"]):
        raise HTTPException(401, "Kod, login yoki parol noto'g'ri")

    # Oxirgi kirish vaqtini yangilash
    async with pool.acquire() as c3:
        await c3.execute(
            "UPDATE users SET oxirgi_kirish = NOW() WHERE id = $1",
            user["id"],
        )

    token = jwt_yarat(user["id"])
    log.info(
        "🔐 Team login: uid=%d kod=%s login=%s role=%s",
        user["id"], company_kod, sub_login, user["role"],
    )

    return {
        "token": token,
        "user_id": user["id"],
        "ism": user["ism"],
        "dokon_nomi": user["dokon_nomi"],
        "company_kod": user["company_kod"],
        "role": user["role"],
        "parent_id": user["parent_id"],
    }


@signup_router.get("/api/v1/me_v2", tags=["Auth"])
async def me_v2(uid: int = Depends(get_uid)):
    """
    Kengaytirilgan /me — multi-tenant ma'lumotlari bilan.
    company_kod, role, parent_id, sinov_tugash, tarif.
    """
    from services.api.main import get_pool

    async with get_pool().acquire() as c:
        u = await c.fetchrow(
            """
            SELECT
                id, ism, to_liq_ism, username, telefon, inn, manzil,
                dokon_nomi, segment, faol, til, login,
                yaratilgan, oxirgi_kirish,
                company_kod, parent_id, role, tarif, sinov_tugash,
                COALESCE(parent_id, id) AS tenant_id
            FROM users WHERE id = $1
            """,
            uid,
        )
        if not u:
            raise HTTPException(404, "Topilmadi")

    result = dict(u)
    # Date/datetime serializatsiya
    for k in ("yaratilgan", "oxirgi_kirish"):
        if result.get(k):
            result[k] = result[k].isoformat()
    if result.get("sinov_tugash"):
        result["sinov_tugash"] = result["sinov_tugash"].isoformat()

    # Sinov kun qoldi
    if result.get("sinov_tugash") and result.get("tarif") == "sinov":
        from datetime import date as _date
        try:
            sinov_date = _date.fromisoformat(result["sinov_tugash"])
            result["sinov_qolgan_kun"] = max(0, (sinov_date - _date.today()).days)
        except Exception:
            result["sinov_qolgan_kun"] = 0
    else:
        result["sinov_qolgan_kun"] = None

    return result


@signup_router.get("/auth/lookup_kod", tags=["Auth"])
async def lookup_kod(kod: str):
    """
    Kompaniya kodi → kompaniya nomi (login screen UX uchun).
    User kod kiritgach "Salom Market" deb ko'rsatamiz.
    """
    from services.api.main import get_pool

    async with get_pool().acquire() as c:
        owner = await c.fetchrow(
            """
            SELECT id, dokon_nomi, faol
            FROM users
            WHERE lower(company_kod) = $1 AND parent_id IS NULL
            LIMIT 1
            """,
            kod.lower().strip(),
        )

    if not owner:
        return {"mavjud": False}

    return {
        "mavjud": True,
        "faol": owner["faol"],
        "dokon_nomi": owner["dokon_nomi"],
    }
