"""
SAVDOAI — Subdomain Tenant Middleware
2026-05-23

Har do'kon o'z subdomain'i: salom-market.savdoai.uz

Middleware vazifalari:
1. Request Host header'dan subdomain ajratish ("salom-market")
2. Subdomain → company_kod lookup → tenant info inject
3. Request state'ga `tenant_kod`, `tenant_id`, `tenant_name` saqlash
4. Token validatsiya (token user.company_kod === subdomain bo'lishi)

Routes ichida foydalanish:
    @app.get("/")
    async def root(request: Request):
        kod = request.state.tenant_kod
        # ...

Configurable via env:
    SAVDOAI_BASE_DOMAIN = "savdoai.uz" (default)
    SAVDOAI_RESERVED_SUBDOMAINS = "www,api,app,admin,blog,docs"
"""
from __future__ import annotations
import logging
import os
from typing import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

log = logging.getLogger(__name__)

BASE_DOMAIN = os.getenv("SAVDOAI_BASE_DOMAIN", "savdoai.uz")
RESERVED = set(
    os.getenv(
        "SAVDOAI_RESERVED_SUBDOMAINS",
        "www,api,app,admin,blog,docs,help,support,status,cdn,static,media,api-docs",
    ).split(",")
)


def _extract_subdomain(host: str) -> str | None:
    """
    Host header'dan subdomain ajratish.

    Examples:
        salom-market.savdoai.uz → "salom-market"
        savdoai.uz              → None
        www.savdoai.uz          → None (reserved)
        api.savdoai.uz          → None (reserved)
        localhost:3000          → None
        savdoai.up.railway.app  → None (railway domain)
    """
    if not host:
        return None
    # Port'ni o'chirish
    h = host.split(":")[0].lower().strip()

    if not h.endswith(f".{BASE_DOMAIN}"):
        return None

    # Subdomain qismini olish (eng oldingi qism)
    prefix = h[: -len(f".{BASE_DOMAIN}")]
    if not prefix:
        return None

    # Nested subdomain'lar ham kuzatadi (a.b.savdoai.uz → "b" eng yaqin parent)
    parts = prefix.split(".")
    subdomain = parts[-1]  # eng yaqin element

    if subdomain in RESERVED:
        return None

    if not subdomain or not subdomain.replace("-", "").isalnum():
        return None

    return subdomain


class SubdomainTenantMiddleware(BaseHTTPMiddleware):
    """
    Request'da subdomain bor bo'lsa → tenant info inject qiladi.
    request.state.tenant_kod, .tenant_id, .tenant_name
    """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        host = request.headers.get("host", "")
        subdomain = _extract_subdomain(host)

        # Default: subdomain yo'q
        request.state.tenant_kod = None
        request.state.tenant_id = None
        request.state.tenant_name = None

        if subdomain:
            # DB'dan tenant ma'lumotlarini olish (cached)
            try:
                from shared.cache.redis_cache import cache_ol, cache_yoz
                cache_key = f"subdomain:{subdomain}"
                cached = await cache_ol(cache_key)

                if cached and isinstance(cached, dict):
                    request.state.tenant_kod = cached.get("kod")
                    request.state.tenant_id = cached.get("id")
                    request.state.tenant_name = cached.get("name")
                else:
                    # DB lookup
                    from shared.database.pool import get_pool
                    pool = get_pool()
                    async with pool.acquire() as c:
                        row = await c.fetchrow(
                            """
                            SELECT id, company_kod, dokon_nomi, faol
                            FROM users
                            WHERE lower(company_kod) = $1 AND parent_id IS NULL
                            LIMIT 1
                            """,
                            subdomain,
                        )

                    if row and row["faol"]:
                        request.state.tenant_kod = row["company_kod"]
                        request.state.tenant_id = row["id"]
                        request.state.tenant_name = row["dokon_nomi"]

                        # Cache 5 daqiqa
                        await cache_yoz(
                            cache_key,
                            {
                                "kod": row["company_kod"],
                                "id": row["id"],
                                "name": row["dokon_nomi"],
                            },
                            300,
                        )
                    elif row and not row["faol"]:
                        # Tenant mavjud lekin faol emas — 410 Gone
                        from starlette.responses import JSONResponse
                        return JSONResponse(
                            status_code=410,
                            content={"detail": f"'{subdomain}' kompaniya faol emas"},
                        )
                    else:
                        # Subdomain noma'lum — 404
                        from starlette.responses import JSONResponse
                        return JSONResponse(
                            status_code=404,
                            content={"detail": f"'{subdomain}.{BASE_DOMAIN}' topilmadi"},
                        )

            except Exception as e:
                log.warning("Subdomain middleware xato: %s", e)

        # Token tenant'ga mos kelishini tekshirish (faqat authenticated route'lar uchun)
        # Bu tekshirish endpoint'da get_uid bilan birga yuritiladi (route handler ichida)

        response = await call_next(request)

        # Header qo'shish — frontend bilishi uchun
        if request.state.tenant_kod:
            response.headers["X-Tenant-Kod"] = request.state.tenant_kod

        return response


async def validate_token_tenant(request: Request, uid: int) -> None:
    """
    Token user'i subdomain tenant'iga mos kelishini tekshirish.
    Endpoint dependency sifatida ishlatish:

        @app.get("/protected")
        async def protected(uid: int = Depends(get_uid), request: Request):
            await validate_token_tenant(request, uid)
            # ...

    Yoki get_uid_with_tenant kabi composite dependency yaratish.
    """
    if not getattr(request.state, "tenant_kod", None):
        # Subdomain yo'q (savdoai.uz on main domain) — tenant cross-check yo'q
        return

    from services.api.deps import get_user_context

    ctx = await get_user_context(uid)
    user_kod = ctx.get("company_kod")

    if user_kod and user_kod.lower() != request.state.tenant_kod.lower():
        from fastapi import HTTPException
        log.warning(
            "Tenant mismatch: token uid=%d kod=%s, subdomain=%s",
            uid, user_kod, request.state.tenant_kod,
        )
        # Cross-tenant token usage — bu xavfli
        raise HTTPException(
            403,
            f"Token boshqa kompaniyaga tegishli. To'g'ri URL: {user_kod}.{BASE_DOMAIN}",
        )
