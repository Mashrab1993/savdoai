"""
API Auth Dependencies — get_uid va rate limiting.
Kassa, WebSocket va boshqa route modullari shu moduldan import qiladi.
Circular import muammosini hal qiladi (main.py ↔ routes/).
"""
from __future__ import annotations
import os
import sys
import time
import json
import hmac
import base64
import logging

from fastapi import HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from shared.cache.redis_cache import rate_limit_tekshir, cache_ol, cache_yoz, k_user, TTL_USER

log = logging.getLogger(__name__)

_JWT_SECRET_RAW = os.getenv("JWT_SECRET", "")
_bearer = HTTPBearer(auto_error=False)


def _get_jwt_secret() -> str:
    """JWT secret — lazy load (env o'zgarishi mumkin)"""
    s = _JWT_SECRET_RAW or os.getenv("JWT_SECRET", "")
    if not s:
        raise RuntimeError("JWT_SECRET muhit o'zgaruvchisi o'rnatilmagan!")
    return s


def jwt_tekshir(token: str) -> int | None:
    """JWT tokenni PyJWT bilan tekshirib user_id qaytarish.

    PyJWT bilan to'g'ri tekshirish (algorithm whitelist, exp tekshirish):
    - HS256 algorithm whitelist (algorithm confusion himoya)
    - exp tekshiriladi (token muddati)
    - iat tekshiriladi (kelajak vaqt aldash himoya)
    - 10s leeway clock skew uchun
    - Eski custom-format tokenlar ham qabul qilinadi (PyJWT decode qiladi)
    """
    try:
        import jwt as _pyjwt
        from jwt import InvalidTokenError, ExpiredSignatureError, DecodeError

        secret = _get_jwt_secret()
        try:
            payload = _pyjwt.decode(
                token,
                secret,
                algorithms=["HS256"],  # algorithm whitelist (security)
                options={
                    "require": ["sub", "exp"],
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": False,  # eski tokenlarda iat yo'q
                    "verify_nbf": True,
                },
                leeway=10,  # 10 sekund clock skew tolerance
            )
        except ExpiredSignatureError:
            log.info("JWT reject: expired")
            return None
        except DecodeError as e:
            log.warning("JWT reject: decode_error %s", e)
            return None
        except InvalidTokenError as e:
            log.warning("JWT reject: invalid_token %s: %s", type(e).__name__, e)
            return None

        sub = payload.get("sub", 0)
        try:
            uid = int(sub)
        except (ValueError, TypeError):
            log.warning("JWT reject: sub_not_int %r", sub)
            return None
        return uid if uid > 0 else None

    except RuntimeError as e:
        # JWT_SECRET yo'q bo'lsa — deployment muammosi
        log.error("JWT reject: config_error %s", e)
        return None
    except Exception as e:
        log.warning("JWT reject: unexpected %s: %s", type(e).__name__, e)
        return None


async def get_uid(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> int:
    """
    Rate limiting + JWT tekshirish → user_id.
    Barcha himoyalangan endpointlar shu dependency dan foydalanadi.
    Token manbalari: 1) Authorization Bearer header, 2) ?token= query param (browser download)
    """
    ip = request.client.host if request.client else "unknown"

    if not await rate_limit_tekshir(f"ip:{ip}", max_req=100, window_s=60):
        raise HTTPException(429, "Juda ko'p so'rov. 1 daqiqa kuting.")

    # 1. Bearer header — the ONLY accepted source. We previously allowed a
    # `?token=...` query param for browser download UX, but that put tokens
    # in proxy/CDN logs and in browser history → CSRF/exfil risk. Removed
    # in 2026-05-16 audit. Downloads must now use POST with Authorization
    # header (or a short-lived signed download URL — separate flow).
    token_str = creds.credentials if creds and creds.credentials else None

    if not token_str:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token kerak")

    uid = jwt_tekshir(token_str)
    if not uid:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token yaroqsiz")

    # User aktivligini tekshirish (cache)
    from shared.database.pool import get_pool
    user = await cache_ol(k_user(uid))
    if user is None:
        async with get_pool().acquire() as c:
            u = await c.fetchrow("SELECT id, faol FROM users WHERE id=$1", uid)
        if not u:
            raise HTTPException(404, "Foydalanuvchi topilmadi")
        if not u["faol"]:
            raise HTTPException(403, "Obuna faol emas")
        await cache_yoz(k_user(uid), dict(u), TTL_USER)

    return uid


# ════════════════════════════════════════════════════════════
#  PLAN GATING — pro/enterprise feature himoyasi
# ════════════════════════════════════════════════════════════
#
# 2026-05-16 audit: Copilot, Anomaliya, AI Extras, SD Agent Gaps endi
# obuna talab qiladi. Free user'lar 402 (Payment Required) oladi.
# Sotuvga tayyor: pro $X/oy, enterprise $XX/oy — kuchaytirilgan modul.

_PLAN_RANK = {"free": 0, "pro": 1, "enterprise": 2}


async def _user_plan(uid: int) -> str:
    """User'ning joriy tarifini olish (cache → DB fallback)."""
    user = await cache_ol(k_user(uid))
    if user and "plan" in user:
        return str(user.get("plan") or "free").lower()
    # Cache miss — DB
    from shared.database.pool import get_pool
    async with get_pool().acquire() as c:
        plan = await c.fetchval("SELECT plan FROM users WHERE id=$1", uid)
    plan = (plan or "free").lower()
    # Cache yangilash (best-effort)
    try:
        u = user or {}
        u["plan"] = plan
        await cache_yoz(k_user(uid), u, TTL_USER)
    except Exception:
        pass
    return plan


def require_plan(min_plan: str = "pro"):
    """FastAPI Dependency factory — endpoint min plan talab qiladi.

    Foydalanish:
        @router.post("/ask", dependencies=[Depends(require_plan("pro"))])
        async def copilot_ask(...):
            ...

    Yoki to'g'ridan-to'g'ri:
        async def endpoint(uid: int = Depends(require_plan("pro"))):
            ...
            # uid hali ham mavjud
    """
    min_rank = _PLAN_RANK.get(min_plan.lower(), 1)

    async def _dep(uid: int = Depends(get_uid)) -> int:
        plan = await _user_plan(uid)
        user_rank = _PLAN_RANK.get(plan, 0)
        if user_rank < min_rank:
            log.info(
                "PLAN GATE: uid=%d plan=%s required=%s — 402",
                uid, plan, min_plan,
            )
            raise HTTPException(
                status_code=402,
                detail=(
                    f"Bu funksiya {min_plan.capitalize()} tarif talab qiladi. "
                    f"Joriy tarif: {plan.capitalize()}. "
                    "Tarif yangilash uchun admin bilan bog'laning."
                ),
            )
        return uid

    return _dep


# ════════════════════════════════════════════════════════════
#  LOGIN RATE LIMITING — brute-force himoya
# ════════════════════════════════════════════════════════════

_login_attempts: dict[str, list[float]] = {}
_LOGIN_MAX = 5          # 5 ta urinish
_LOGIN_WINDOW = 60.0    # 1 daqiqa ichida
_LOGIN_MAX_IPS = 5000   # xotira himoyasi


async def login_rate_check(request: Request) -> None:
    """Login endpointi uchun alohida rate limiter — 5 urinish/daqiqa."""
    ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Eski yozuvlar tozalash
    if ip in _login_attempts:
        _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < _LOGIN_WINDOW]
    else:
        _login_attempts[ip] = []

    # Xotira himoyasi
    if len(_login_attempts) > _LOGIN_MAX_IPS:
        expired = [k for k, v in _login_attempts.items() if not v or now - max(v) > _LOGIN_WINDOW * 2]
        for k in expired:
            _login_attempts.pop(k, None)

    if len(_login_attempts[ip]) >= _LOGIN_MAX:
        log.warning("LOGIN RATE LIMIT: %s — %d urinish/daqiqa", ip, len(_login_attempts[ip]))
        raise HTTPException(
            status_code=429,
            detail=f"Juda ko'p urinish. {int(_LOGIN_WINDOW)} sekund kutib qayta urinib ko'ring."
        )

    _login_attempts[ip].append(now)


# ════════════════════════════════════════════════════════════
#  ENDPOINT RATE LIMITING — export va sotuv himoyasi
# ════════════════════════════════════════════════════════════

_endpoint_buckets: dict[str, list[float]] = {}
_EP_MAX_IPS = 5000

# Endpoint-spesifik limitlar: (max_requests, window_seconds)
_EP_LIMITS: dict[str, tuple[int, float]] = {
    "export":  (3,  60.0),   # 3 req/min — server yukini kamaytirish
    "sotuv":   (30, 60.0),   # 30 req/min — spam himoya
    "import":  (5,  60.0),   # 5 req/min — og'ir operatsiya
}


async def endpoint_rate_check(request: Request, endpoint: str) -> None:
    """Endpoint-spesifik rate limiter."""
    if endpoint not in _EP_LIMITS:
        return

    max_req, window = _EP_LIMITS[endpoint]
    ip = request.client.host if request.client else "unknown"
    key = f"{endpoint}:{ip}"
    now = time.time()

    # Tozalash
    if key in _endpoint_buckets:
        _endpoint_buckets[key] = [t for t in _endpoint_buckets[key] if now - t < window]
    else:
        _endpoint_buckets[key] = []

    # Xotira himoyasi
    if len(_endpoint_buckets) > _EP_MAX_IPS:
        expired = [k for k, v in _endpoint_buckets.items() if not v or now - max(v) > window * 2]
        for k in expired:
            _endpoint_buckets.pop(k, None)

    if len(_endpoint_buckets[key]) >= max_req:
        log.warning("ENDPOINT RATE LIMIT [%s]: %s — %d req", endpoint, ip, len(_endpoint_buckets[key]))
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit: {endpoint} uchun {max_req} so'rov/{int(window)} sekund."
        )

    _endpoint_buckets[key].append(now)


# ════════════════════════════════════════════════════════════
#  EFFECTIVE TENANT ID — Multi-tenant data isolation helper
#  2026-05-23
#
#  Sub-user (sotuvchi/agent) login bo'lganda, ular OZINING
#  user_id'sini emas, OWNER'ning user_id'sini ishlatib data
#  qidirishi kerak (parent_id orqali).
#
#  Owner: parent_id IS NULL → tenant_id = user_id (o'zining)
#  Sub:   parent_id IS NOT NULL → tenant_id = parent_id (owner)
#
#  KESHLI: 5 daqiqa user_id → tenant_id mapping cache.
# ════════════════════════════════════════════════════════════

_TENANT_CACHE_TTL = 300  # 5 daqiqa


async def get_tenant_id(uid: int) -> int:
    """
    User'ning effective tenant_id'sini qaytarish.
    Sub-user uchun = owner's id, owner uchun = uid o'zi.

    Usage:
        tid = await get_tenant_id(uid)
        rows = await c.fetch("SELECT * FROM sotuvlar WHERE user_id = $1", tid)
    """
    cache_key = f"tenant:{uid}"
    cached = await cache_ol(cache_key)
    if cached is not None:
        # cached qiymat int yoki dict (eski cache eskirsa)
        if isinstance(cached, int):
            return cached
        if isinstance(cached, dict) and "tenant_id" in cached:
            return cached["tenant_id"]

    # DB'dan olish
    from shared.database.pool import get_pool
    pool = get_pool()
    async with pool.acquire() as c:
        result = await c.fetchrow(
            "SELECT COALESCE(parent_id, id) AS tenant_id, role FROM users WHERE id = $1",
            uid,
        )
        if not result:
            raise HTTPException(401, "Foydalanuvchi topilmadi")

    tenant_id = int(result["tenant_id"])
    await cache_yoz(cache_key, {"tenant_id": tenant_id, "role": result["role"]}, _TENANT_CACHE_TTL)
    return tenant_id


async def get_user_context(uid: int) -> dict:
    """
    To'liq user context (effective tenant_id + role + company_kod).

    Returns: {
      "user_id": int,
      "tenant_id": int,        # COALESCE(parent_id, id)
      "role": str,             # owner/admin/sotuvchi/agent/merchant
      "company_kod": str|None,
      "parent_id": int|None,
    }
    """
    cache_key = f"ucontext:{uid}"
    cached = await cache_ol(cache_key)
    if isinstance(cached, dict) and "tenant_id" in cached:
        return cached

    from shared.database.pool import get_pool
    pool = get_pool()
    async with pool.acquire() as c:
        u = await c.fetchrow(
            """
            SELECT id, COALESCE(parent_id, id) AS tenant_id, role,
                   company_kod, parent_id
            FROM users WHERE id = $1
            """,
            uid,
        )
        if not u:
            raise HTTPException(401, "Foydalanuvchi topilmadi")

    ctx = {
        "user_id": uid,
        "tenant_id": int(u["tenant_id"]),
        "role": u["role"] or "owner",
        "company_kod": u["company_kod"],
        "parent_id": u["parent_id"],
    }
    await cache_yoz(cache_key, ctx, _TENANT_CACHE_TTL)
    return ctx


async def require_role(uid: int, *allowed_roles: str) -> dict:
    """
    Role tekshirish — agar user'ning roli allowed_roles ichida bo'lmasa 403.

    Usage:
        ctx = await require_role(uid, "owner", "admin")
    """
    ctx = await get_user_context(uid)
    if ctx["role"] not in allowed_roles:
        raise HTTPException(
            403,
            f"Bu amal uchun {', '.join(allowed_roles)} roli kerak (sizniki: {ctx['role']})",
        )
    return ctx


def invalidate_tenant_cache(uid: int) -> None:
    """User context cache'ni tozalash (role/parent_id o'zgarganda)."""
    # Cache asynxron — fire-and-forget
    import asyncio
    from shared.cache.redis_cache import cache_del
    asyncio.create_task(cache_del(f"tenant:{uid}"))
    asyncio.create_task(cache_del(f"ucontext:{uid}"))


# ════════════════════════════════════════════════════════════
#  ACTIVE COMPANY (multi-company agent support)
#  2026-05-23 — Migration 038 bilan birga
#
#  Agent ko'p firma'da ishlaganda, har request'da qaysi firma
#  uchun ishlayotgani aniqlanishi kerak.
#
#  Manbalar (prioritet bo'yicha):
#  1. JWT payload'da active_company_id (token'da yozilgan)
#  2. Request header X-Active-Company
#  3. Cookie active_company_id
#  4. Database'dan default (agent'ning birinchi/owner firma'si)
#
#  Tekshirish: user shu firma'ga ulanganmi (agent_memberships)
# ════════════════════════════════════════════════════════════

async def get_active_company_id(uid: int, request) -> int:
    """
    Agent'ning hozirgi tanlangan firma ID'sini qaytarish.

    Owner uchun: o'zining user_id'si
    Agent uchun: tanlangan firma (X-Active-Company header yoki default)

    Tekshiriladi: agent shu firma'ga agent_memberships orqali ulanganmi.
    Aks holda 403.

    Cache: 1 daqiqa Redis (har request DB hit qilmasligi uchun)
    """
    # 1. Header'dan
    active_id_str = request.headers.get("x-active-company") if request else None
    if not active_id_str and request:
        active_id_str = request.cookies.get("active_company_id")

    active_id = int(active_id_str) if active_id_str and active_id_str.isdigit() else None

    cache_key = f"active_company:{uid}:{active_id or 'default'}"
    cached = await cache_ol(cache_key)
    if cached is not None and isinstance(cached, int):
        return cached

    from shared.database.pool import get_pool
    pool = get_pool()

    async with pool.acquire() as c:
        if active_id:
            # Tekshirish: user shu firma'ga ulanganmi
            membership = await c.fetchrow(
                """
                SELECT company_id FROM agent_memberships
                WHERE agent_id = $1 AND company_id = $2 AND faol = TRUE
                LIMIT 1
                """,
                uid, active_id,
            )
            if membership:
                await cache_yoz(cache_key, active_id, 60)  # 1 daqiqa cache
                return active_id
            # Ulanmagan — 403
            raise HTTPException(403, f"Bu firma'ga (id={active_id}) ruxsatingiz yo'q")

        # Header yo'q — default firma
        # Prioritet: owner role > oxirgi ulangan > birinchi
        default = await c.fetchval(
            """
            SELECT company_id FROM agent_memberships
            WHERE agent_id = $1 AND faol = TRUE
            ORDER BY (role = 'owner') DESC, oxirgi_ulansh DESC NULLS LAST, qo_shilgan ASC
            LIMIT 1
            """,
            uid,
        )

    if not default:
        # Fallback: parent_id orqali (eski model)
        async with pool.acquire() as c:
            u = await c.fetchrow(
                "SELECT id, COALESCE(parent_id, id) AS tenant_id FROM users WHERE id = $1",
                uid,
            )
            if u:
                default = u["tenant_id"]

    if not default:
        raise HTTPException(404, "Foydalanuvchi hech qaysi firma'ga ulanmagan")

    await cache_yoz(cache_key, int(default), 60)
    return int(default)


async def get_active_context(uid: int, request) -> dict:
    """
    Active company kontekstini to'liq qaytarish (company_id + role + permissions).

    Usage:
        @app.get("/api/v1/tovarlar")
        async def get_tovarlar(uid: int = Depends(get_uid), request: Request):
            ctx = await get_active_context(uid, request)
            tid = ctx["company_id"]
            # ...
    """
    company_id = await get_active_company_id(uid, request)

    cache_key = f"active_ctx:{uid}:{company_id}"
    cached = await cache_ol(cache_key)
    if isinstance(cached, dict) and "company_id" in cached:
        return cached

    from shared.database.pool import get_pool
    pool = get_pool()

    async with pool.acquire() as c:
        row = await c.fetchrow(
            """
            SELECT
                am.company_id,
                am.role,
                am.permissions,
                c.dokon_nomi,
                c.company_kod,
                c.tarif,
                c.sinov_tugash
            FROM agent_memberships am
            JOIN users c ON c.id = am.company_id
            WHERE am.agent_id = $1 AND am.company_id = $2 AND am.faol = TRUE
            LIMIT 1
            """,
            uid, company_id,
        )

    if not row:
        # Fallback uchun: faqat company_id qaytaramiz
        return {
            "company_id": company_id,
            "role": "owner",
            "permissions": {},
            "dokon_nomi": None,
            "company_kod": None,
        }

    import json as _json
    perms = row["permissions"]
    if isinstance(perms, str):
        perms = _json.loads(perms)

    ctx = {
        "company_id": row["company_id"],
        "role": row["role"],
        "permissions": perms or {},
        "dokon_nomi": row["dokon_nomi"],
        "company_kod": row["company_kod"],
        "tarif": row["tarif"],
        "sinov_tugash": row["sinov_tugash"].isoformat() if row["sinov_tugash"] else None,
    }

    await cache_yoz(cache_key, ctx, 60)
    return ctx


async def require_permission(uid: int, request, permission: str) -> dict:
    """
    Permission tekshirish — agent shu amalga ruxsat oladimi.

    Usage:
        @app.post("/api/v1/sotuv")
        async def yangi_sotuv(uid: int = Depends(get_uid), request: Request):
            ctx = await require_permission(uid, request, "sotuv_qilish")
            # ...

    Owner va admin uchun har doim TRUE.
    Sotuvchi/agent uchun permissions JSONB'da bo'lishi kerak.
    """
    ctx = await get_active_context(uid, request)

    if ctx["role"] in ("owner", "admin"):
        return ctx  # Hammasi ruxsat

    if not ctx["permissions"].get(permission, False):
        raise HTTPException(
            403,
            f"'{permission}' amaliga ruxsatingiz yo'q. Owner'dan so'rang.",
        )

    return ctx


def invalidate_active_company_cache(uid: int, company_id: int | None = None) -> None:
    """Active company cache'ni tozalash (membership o'zgarganda)."""
    import asyncio
    from shared.cache.redis_cache import cache_del

    asyncio.create_task(cache_del(f"active_company:{uid}:default"))
    if company_id:
        asyncio.create_task(cache_del(f"active_company:{uid}:{company_id}"))
        asyncio.create_task(cache_del(f"active_ctx:{uid}:{company_id}"))
