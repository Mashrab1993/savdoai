"""
╔══════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA v21.3 — API SERVISI (FastAPI)                 ║
║  Bot va Web App uchun markaziy gateway                      ║
║                                                              ║
║  ✅ JWT autentifikatsiya                                     ║
║  ✅ Rate limiting (100 req/daqiqa)                          ║
║  ✅ Redis cache (5 daqiqa TTL)                              ║
║  ✅ PostgreSQL RLS (20,000 user izolyatsiyasi)              ║
║  ✅ CORS (Web uchun)                                        ║
║  ✅ /health Railway monitoring                              ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import os, sys, logging, time, hashlib, hmac, base64, json
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from shared.database.pool import pool_init, pool_close, schema_init, rls_conn, get_pool
from shared.cache.redis_cache import redis_init, cache_ol, cache_yoz
from shared.cache.redis_cache import k_hisobot_kunlik, k_qarzlar, k_user, TTL_HISOBOT, TTL_USER
from shared.utils import like_escape
try:
    from shared.rag.vector_db import rag_init
except (ImportError, ModuleNotFoundError):
    rag_init = None

log = logging.getLogger(__name__)

# Sentry (ixtiyoriy — SENTRY_DSN bo'lsa uladi)
_SENTRY_DSN = os.getenv("SENTRY_DSN")
if _SENTRY_DSN:
    try:
        import sentry_sdk
        sentry_sdk.init(dsn=_SENTRY_DSN, traces_sample_rate=0.1)
        log.info("✅ Sentry ulandi")
    except ImportError:
        pass  # optional import

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s"
)

__version__ = "25.3"
_JWT_SECRET_RAW = os.getenv("JWT_SECRET", "")
_IS_PRODUCTION = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_SERVICE_ID"))
if not _JWT_SECRET_RAW:
    if _IS_PRODUCTION:
        log.critical("🚨 JWT_SECRET o'rnatilmagan! Production'da default secret ishlatilmaydi. Startup bekor.")
        sys.exit(1)
    else:
        _JWT_SECRET_RAW = "savdoai-dev-only-secret-NOT-FOR-PRODUCTION"
        log.warning("⚠️ JWT_SECRET o'rnatilmagan — faqat dev uchun default ishlatilmoqda.")
JWT_SECRET = _JWT_SECRET_RAW

# Process uptime — restart/crash ajratish (/live, /healthz, print_escpos trace)
from shared.observability.process_uptime import process_info  # noqa: E402

# ════════════════════════════════════════════════════════════
#  STARTUP / SHUTDOWN
# ════════════════════════════════════════════════════════════

# ════════════════════════════════════════════════════════════
#  PYDANTIC MODELLAR (Request/Response validatsiya)
# ════════════════════════════════════════════════════════════

# ── Response modellar ──────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    service: str = "api"
    db_ping_ms: Optional[float] = None
    db_pool: Optional[str] = None
    latency_ms: Optional[float] = None


class DashboardResponse(BaseModel):
    bugun_sotuv_soni: int = 0
    bugun_sotuv_jami: float = 0
    bugun_yangi_qarz: float = 0
    jami_qarz: float = 0
    klient_soni: int = 0
    tovar_soni: int = 0
    kam_qoldiq_soni: int = 0


class TovarResponse(BaseModel):
    id: int
    nomi: str
    kategoriya: str = "Boshqa"
    birlik: str = "dona"
    olish_narxi: float = 0
    sotish_narxi: float = 0
    min_sotish_narxi: float = 0
    qoldiq: float = 0
    min_qoldiq: float = 0


class KlientResponse(BaseModel):
    id: int
    ism: str
    telefon: Optional[str] = None
    manzil: Optional[str] = None
    kredit_limit: float = 0
    jami_sotib: float = 0
    aktiv_qarz: float = 0


class SotuvResponse(BaseModel):
    sessiya_id: int
    status: str = "saqlandi"


class BildirishnomaTuri(BaseModel):
    tur: str
    darajasi: str
    matn: str
    klient: Optional[str] = None
    tovar: Optional[str] = None
    summa: Optional[float] = None
    qoldiq: Optional[float] = None
    soni: Optional[int] = None


class BildirishnomaResponse(BaseModel):
    items: List[BildirishnomaTuri] = []
    jami: int = 0


class FoydaResponse(BaseModel):
    kunlar: int
    brutto_sotuv: float
    tannarx: float
    sof_foyda: float
    xarajatlar: float
    toza_foyda: float
    margin_foiz: float
    top_foyda: List[dict] = []
    top_zarar: List[dict] = []


class StatistikaResponse(BaseModel):
    tovar_soni: int
    klient_soni: int
    faol_qarz: float
    kam_qoldiq_soni: int
    muddat_otgan_qarz: int
    bugun: dict
    hafta: dict
    oy: dict


# ── Request modellar ───────────────────────────────────────

class TovarModel(BaseModel):
    nomi:           str          = Field(..., min_length=1, max_length=200)
    miqdor:         float        = Field(..., gt=0)
    birlik:         str          = Field("dona")
    narx:           float        = Field(0, ge=0)
    jami:           float        = Field(0, ge=0)
    kategoriya:     str          = Field("Boshqa")
    chegirma_foiz:  float        = Field(0, ge=0, le=100)


class SotuvSo_rov(BaseModel):
    klient:         Optional[str] = None
    tovarlar:       List[TovarModel]
    jami_summa:     float         = Field(0, ge=0)
    tolangan:       float         = Field(0, ge=0)
    qarz:           float         = Field(0, ge=0)
    izoh:           Optional[str] = None


class KirimSo_rov(BaseModel):
    tovar_nomi:     str   = Field(..., min_length=1)
    miqdor:         float = Field(..., gt=0)
    narx:           float = Field(0, ge=0)
    jami:           float = Field(0, ge=0)
    birlik:         str   = Field("dona")
    kategoriya:     str   = Field("Boshqa")
    manba:          Optional[str] = None


class QarzTolashSo_rov(BaseModel):
    klient_ismi:    str   = Field(..., min_length=1)
    summa:          float = Field(..., gt=0)


class TelegramAuthSo_rov(BaseModel):
    user_id:        int
    ism:            Optional[str] = ""
    hash:           str


class PaginatsiyaResponse(BaseModel):
    total:          int
    page:           int
    limit:          int
    total_pages:    int
    has_next:       bool
    has_prev:       bool
    items:          list


@asynccontextmanager
async def lifespan(app: FastAPI):
    dsn    = os.environ.get("DATABASE_URL", "")
    # Railway postgres:// → asyncpg postgresql://
    if dsn.startswith("postgres://"):
        dsn = dsn.replace("postgres://", "postgresql://", 1)
    r_url  = os.getenv("REDIS_URL", "")
    q_url  = os.getenv("QDRANT_URL")
    q_key  = os.getenv("QDRANT_API_KEY")

    await pool_init(dsn,
                    min_size=int(os.getenv("DB_MIN", "2")),
                    max_size=int(os.getenv("DB_MAX", "10")))

    try:
        await schema_init()
    except Exception as _schema_err:
        log.error("⚠️ Schema init xato (API davom etadi): %s", _schema_err)

    if r_url:
        try:
            await redis_init(r_url)
        except Exception as _r:
            log.warning("Redis ulana olmadi: %s", _r)

    if rag_init and q_url:
        try:
            rag_init(q_url, q_key)
        except Exception as _e:
            log.warning("Qdrant ulana olmadi (RAG o'chirildi): %s", _e)

    log.info("🚀 SavdoAI API v%s tayyor", __version__)
    log.info(
        "API boot ok: pid=%s port=%s env=%s print_secret_set=%s",
        os.getpid(),
        os.getenv("PORT", "8000"),
        os.getenv("RAILWAY_ENVIRONMENT") or "local",
        bool((os.getenv("PRINT_SECRET") or "").strip()),
    )
    yield
    await pool_close()
    log.info("API to'xtatildi")


app = FastAPI(
    title       = "SavdoAI Mashrab Moliya API",
    version     = __version__,
    description = "O'zbek bozori uchun AI-powered savdo boshqaruv tizimi REST API — 62+ endpoint, CRUD, hisobotlar, foyda tahlili, real-time WebSocket",
    lifespan    = lifespan,
    docs_url    = "/docs",
    redoc_url   = "/redoc",
    openapi_tags = [
        {"name": "Auth",           "description": "Autentifikatsiya — login, token"},
        {"name": "Dashboard",      "description": "Bosh sahifa statistikasi"},
        {"name": "Tovarlar",       "description": "Tovarlar CRUD, import, export"},
        {"name": "Klientlar",      "description": "Klientlar CRUD, tarix"},
        {"name": "Sotuv",          "description": "Sotuv operatsiyalari"},
        {"name": "Qarz",           "description": "Qarzlar va to'lovlar"},
        {"name": "Hisobotlar",     "description": "Kunlik, haftalik, oylik, foyda"},
        {"name": "Xarajatlar",     "description": "Xarajatlar boshqaruvi"},
        {"name": "Kassa",          "description": "Kassa operatsiyalari"},
        {"name": "Narx",           "description": "Narx guruhlari va shaxsiy narxlar"},
        {"name": "Ledger",         "description": "SAP-grade buxgalteriya"},
        {"name": "Bildirishnoma",  "description": "Ogohlantirish va bildirishnomalar"},
        {"name": "Export",         "description": "Excel/PDF eksport"},
        {"name": "Monitoring",     "description": "Health check va metrikalar"},
    ],
)

# CORS — browser Origin must match exactly (no trailing slash). WEB_URL is the web app origin, not API.
def _cors_origin(url: str) -> str:
    u = (url or "").strip()
    return u.rstrip("/") if u else u


_web_cors_origins = [
    _cors_origin("https://savdoai-web-production.up.railway.app"),
    _cors_origin("http://localhost:3000"),
    _cors_origin("http://127.0.0.1:3000"),
    _cors_origin("https://mashrab-moliya.vercel.app"),
    _cors_origin("http://localhost:5173"),
    _cors_origin("http://localhost:8000"),
]
_web_url = _cors_origin(os.getenv("WEB_URL", "https://savdoai-web-production.up.railway.app"))
if _web_url and _web_url not in _web_cors_origins:
    _web_cors_origins.insert(0, _web_url)

# CORS only (no GZip here) — gzip has interfered with preflight/OPTIONS in some deployments.
# Explicit methods/headers avoid Starlette edge cases with "*" + credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_web_cors_origins,
    allow_origin_regex=r"https://.*\.up\.railway\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Har so'rovga X-Request-ID (502 da loglarni bog'lash)
from shared.middleware.request_id import RequestIDMiddleware  # noqa: E402

app.add_middleware(RequestIDMiddleware)

# ═══ v21.3 YANGI ROUTELAR ═══
try:
    from services.api.routes.kassa import router as kassa_router
    app.include_router(kassa_router, tags=["Kassa"])
    log.info("✅ Kassa moduli ulandi")
except Exception as e:
    log.warning("⚠️ Kassa moduli yuklanmadi: %s", e)

try:
    from services.api.routes.websocket import router as ws_router
    app.include_router(ws_router, tags=["Monitoring"])
    log.info("✅ WebSocket ulandi")
except Exception as e:
    log.warning("⚠️ WebSocket yuklanmadi: %s", e)

# Print HMAC: shared.services.print_session (lazy secret — import-time crash oldini olish)

try:
    from services.api.routes.printer import router as printer_router
    app.include_router(printer_router, tags=["Sotuv"])
    log.info("✅ Printer API ulandi")
except Exception as e:
    log.warning("⚠️ Printer API yuklanmadi: %s", e)

# ════════════════════════════════════════════════════════════
#  JWT + AUTH — deps.py dan import (shared bilan kassa/ws)
# ════════════════════════════════════════════════════════════

from services.api.deps import get_uid, jwt_tekshir


def jwt_yarat(user_id: int, ttl: int = 86400) -> str:
    """JWT token yaratish"""
    h64 = base64.urlsafe_b64encode(
        b'{"alg":"HS256","typ":"JWT"}'
    ).rstrip(b"=").decode()
    payload = json.dumps({"sub": str(user_id), "exp": int(time.time()) + ttl})
    p64 = base64.urlsafe_b64encode(payload.encode()).rstrip(b"=").decode()
    sig = base64.urlsafe_b64encode(
        hmac.new(JWT_SECRET.encode(), f"{h64}.{p64}".encode(), "sha256").digest()
    ).rstrip(b"=").decode()
    return f"{h64}.{p64}.{sig}"


# ════════════════════════════════════════════════════════════
#  ENDPOINTLAR
# ════════════════════════════════════════════════════════════

@app.get("/", include_in_schema=False)
async def root():
    """Landing page — API ishlayotganini ko'rsatadi"""
    from fastapi.responses import HTMLResponse
    html = f"""<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SavdoAI Mashrab Moliya v{__version__}</title>
    <style>
        * {{ margin:0; padding:0; box-sizing:border-box; }}
        body {{ font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
               background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);
               color:#e2e8f0; min-height:100vh; display:flex; align-items:center; justify-content:center; }}
        .card {{ background:#1e293b; border:1px solid #334155; border-radius:16px;
                padding:48px; max-width:600px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,0.4); }}
        h1 {{ font-size:28px; margin-bottom:8px; color:#38bdf8; }}
        .version {{ color:#94a3b8; font-size:14px; margin-bottom:24px; }}
        .status {{ display:flex; align-items:center; gap:8px; margin-bottom:24px;
                  padding:12px 16px; background:#0f172a; border-radius:8px; }}
        .dot {{ width:10px; height:10px; border-radius:50%; background:#22c55e; animation:pulse 2s infinite; }}
        @keyframes pulse {{ 0%,100%{{opacity:1}} 50%{{opacity:0.5}} }}
        .links {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:24px; }}
        .links a {{ display:block; padding:12px 16px; background:#334155; border-radius:8px;
                   color:#38bdf8; text-decoration:none; text-align:center; font-size:14px;
                   transition:background 0.2s; }}
        .links a:hover {{ background:#475569; }}
        .stats {{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:24px; }}
        .stat {{ text-align:center; padding:16px; background:#0f172a; border-radius:8px; }}
        .stat-num {{ font-size:24px; font-weight:700; color:#38bdf8; }}
        .stat-label {{ font-size:12px; color:#94a3b8; margin-top:4px; }}
    </style>
</head>
<body>
    <div class="card">
        <h1>SavdoAI Mashrab Moliya</h1>
        <div class="version">v{__version__} &mdash; AI-powered savdo boshqaruv tizimi</div>
        <div class="status">
            <div class="dot"></div>
            <span>API ishlayapti</span>
        </div>
        <div class="stats">
            <div class="stat"><div class="stat-num">72+</div><div class="stat-label">API Endpoints</div></div>
            <div class="stat"><div class="stat-num">19</div><div class="stat-label">DB Jadvallar</div></div>
            <div class="stat"><div class="stat-num">2</div><div class="stat-label">AI Modellar</div></div>
        </div>
        <div class="links">
            <a href="/docs">API Docs</a>
            <a href="/health">Health Check</a>
            <a href="/redoc">ReDoc</a>
            <a href="https://t.me/savdoai_mashrab_bot">Telegram Bot</a>
        </div>
    </div>
</body>
</html>"""
    return HTMLResponse(content=html)


@app.get("/health", tags=["Monitoring"])
async def health():
    from shared.database.pool import pool_health
    import time as _t
    start = _t.monotonic()
    db = await pool_health()
    # Redis ping
    redis_ok = False
    redis_ms = None
    try:
        redis_url = os.getenv("REDIS_URL", "")
        if redis_url:
            import redis.asyncio as _aioredis
            r = _aioredis.from_url(redis_url, socket_connect_timeout=2)
            rs = _t.monotonic()
            await r.ping()
            redis_ms = round((_t.monotonic() - rs) * 1000, 1)
            redis_ok = True
            await r.close()
    except Exception:
        pass
    latency_ms = round((_t.monotonic() - start) * 1000, 1)
    return {
        "status": "ok",
        "version": __version__,
        "service": "api",
        "db_ping_ms": db.get("ping_ms"),
        "db_pool": f"{db.get('used',0)}/{db.get('size',0)}",
        "redis_ok": redis_ok,
        "redis_ms": redis_ms,
        "latency_ms": latency_ms,
        **process_info(),
    }


@app.get("/version", tags=["Monitoring"])
@app.get("/version/", tags=["Monitoring"])
async def version():
    return {
        "status": "ok",
        "service": "api",
        "version": __version__,
        "env": os.getenv("RAILWAY_ENVIRONMENT") or "local",
        "port": os.getenv("PORT", "8000"),
        **process_info(),
    }


@app.get("/dashboard", include_in_schema=False)
async def dashboard_redirect():
    """Redirect to Next.js Web Dashboard"""
    from fastapi.responses import RedirectResponse
    web_url = os.getenv("WEB_DASHBOARD_URL", "")
    if web_url:
        return RedirectResponse(url=web_url)
    return {"message": "Dashboard: WEB_DASHBOARD_URL sozlang"}


@app.post("/auth/telegram", tags=["Auth"])
async def auth_telegram(data: TelegramAuthSo_rov):
    """
    Telegram bot → API token olish.
    Bot har foydalanuvchi uchun bu endpoint orqali JWT oladi.
    """
    uid      = data.user_id
    bot_hash = data.hash
    expected = hashlib.sha256(
        (JWT_SECRET + str(uid)).encode()
    ).hexdigest()[:16]

    if bot_hash != expected:
        raise HTTPException(403, "Noto'g'ri hash")

    # User mavjudligini tekshirish/yaratish
    async with get_pool().acquire() as c:
        u = await c.fetchrow("SELECT id, ism, to_liq_ism, username, telefon, inn, manzil, dokon_nomi, segment, faol, obuna_tugash, til, plan, login, parol_hash, yaratilgan FROM users WHERE id=$1", uid)
        if not u:
            await c.execute(
                "INSERT INTO users(id,ism) VALUES($1,$2) ON CONFLICT DO NOTHING",
                uid, data.ism or ""
            )

    token = jwt_yarat(uid)
    return {"token": token, "user_id": uid}


# ════════════════════════════════════════════════════════════
#  TELEGRAM MINI APP (WebApp) AUTH
# ════════════════════════════════════════════════════════════


@app.post("/auth/webapp", tags=["Auth"])
async def auth_webapp(data: dict):
    """
    Telegram Mini App (WebApp) autentifikatsiya.
    Client Telegram.WebApp.initData yuboradi → server tekshiradi → JWT qaytaradi.

    Telegram WebApp initData validatsiya:
    1. initData parse → hash ajratish
    2. Qolgan fieldlarni alifbo tartibida saralash, \\n bilan birlashtirish
    3. secret_key = HMAC-SHA256("WebAppData", BOT_TOKEN)
    4. Tekshirish: HMAC-SHA256(secret_key, data_check_string) == hash
    """
    from urllib.parse import parse_qs

    init_data = data.get("initData", "")
    if not init_data:
        raise HTTPException(400, "initData bo'sh")

    bot_token = os.getenv("BOT_TOKEN", "")
    if not bot_token:
        raise HTTPException(503, "BOT_TOKEN o'rnatilmagan")

    # 1. Parse initData
    parsed = parse_qs(init_data, keep_blank_values=True)
    received_hash = parsed.pop("hash", [""])[0]
    if not received_hash:
        raise HTTPException(400, "hash topilmadi")

    # 2. data_check_string — alifbo tartibida saralangan key=value
    data_check_parts = []
    for key in sorted(parsed.keys()):
        val = parsed[key][0]
        data_check_parts.append(f"{key}={val}")
    data_check_string = "\n".join(data_check_parts)

    # 3. secret_key = HMAC-SHA256("WebAppData", BOT_TOKEN)
    secret_key = hmac.new(
        b"WebAppData", bot_token.encode(), "sha256"
    ).digest()

    # 4. Tekshirish
    computed_hash = hmac.new(
        secret_key, data_check_string.encode(), "sha256"
    ).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise HTTPException(403, "initData tekshiruvi muvaffaqiyatsiz")

    # 5. auth_date tekshirish (24 soatdan eski bo'lmasligi kerak)
    auth_date = int(parsed.get("auth_date", ["0"])[0])
    if time.time() - auth_date > 86400:
        raise HTTPException(403, "initData muddati o'tgan")

    # 6. User ma'lumotlarini olish
    user_json = parsed.get("user", ["{}"])[0]
    try:
        tg_user = json.loads(user_json)
    except json.JSONDecodeError:
        raise HTTPException(400, "user field noto'g'ri")

    tg_id = tg_user.get("id")
    if not tg_id:
        raise HTTPException(400, "user.id topilmadi")

    # 7. User yaratish/olish
    ism = tg_user.get("first_name", "")
    username = tg_user.get("username", "")

    async with get_pool().acquire() as c:
        u = await c.fetchrow(
            "SELECT id, ism FROM users WHERE id=$1", int(tg_id)
        )
        if not u:
            await c.execute(
                "INSERT INTO users(id, ism, username) VALUES($1, $2, $3) ON CONFLICT DO NOTHING",
                int(tg_id), ism, username
            )

    token = jwt_yarat(int(tg_id))
    log.info("📱 Mini App auth: uid=%d ism=%s", tg_id, ism)
    return {"token": token, "user_id": tg_id, "ism": ism}


# ════════════════════════════════════════════════════════════
#  LOGIN/PAROL — Web panel uchun
# ════════════════════════════════════════════════════════════

def _parol_hash(parol: str) -> str:
    """Parolni xavfsiz hash qilish (PBKDF2-SHA256, salt bilan)"""
    import os as _os2
    salt = _os2.urandom(16).hex()
    h = hashlib.pbkdf2_hmac("sha256", parol.encode(), salt.encode(), 100_000).hex()
    return f"{salt}:{h}"


def _parol_tekshir(parol: str, stored: str) -> bool:
    """Saqlangan hash bilan parolni solishtirish"""
    if not stored or ":" not in stored:
        return False
    salt, h = stored.split(":", 1)
    return hashlib.pbkdf2_hmac("sha256", parol.encode(), salt.encode(), 100_000).hex() == h


def _telefon_tozala(tel: str) -> str:
    """Telefon raqamni normallashtirish: +998901234567 → 998901234567"""
    t = tel.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if t.startswith("+"): t = t[1:]
    if len(t) == 9 and t[0] in "3456789":
        t = "998" + t
    return t


class LoginSorov(BaseModel):
    login: Optional[str] = None
    telefon: Optional[str] = None
    parol: str = Field(..., min_length=1)


@app.post("/auth/login", tags=["Auth"])
async def auth_login(data: LoginSorov, request: Request):
    """
    Web panel kirish — login+parol YOKI telefon+parol.
    Admin do'konchilariga login/parol beradi.
    Rate limit: 5 urinish/daqiqa (brute-force himoya).
    """
    from services.api.deps import login_rate_check
    await login_rate_check(request)
    login = (data.login or "").strip().lower()
    telefon = (data.telefon or "").strip()
    parol = data.parol.strip()

    if not login and not telefon:
        raise HTTPException(400, "Login yoki telefon kiriting")

    async with get_pool().acquire() as c:
        if login:
            user = await c.fetchrow(
                "SELECT id, ism, to_liq_ism, username, telefon, dokon_nomi, segment, faol, login, parol_hash FROM users WHERE lower(login)=$1 AND faol=TRUE",
                login,
            )
        else:
            tel = _telefon_tozala(telefon)
            user = await c.fetchrow(
                "SELECT id, ism, to_liq_ism, username, telefon, dokon_nomi, segment, faol, login, parol_hash FROM users WHERE replace(replace(telefon,' ',''),'-','') LIKE '%' || $1 || '%' AND faol=TRUE LIMIT 1",
                tel[-9:],
            )

    if not user:
        raise HTTPException(401, "Login yoki parol noto'g'ri")

    if not user.get("parol_hash"):
        raise HTTPException(401, "Parol o'rnatilmagan. Admin bilan bog'laning.")

    if not _parol_tekshir(parol, user["parol_hash"]):
        raise HTTPException(401, "Login yoki parol noto'g'ri")

    token = jwt_yarat(user["id"])
    log.info("🔐 Web login: uid=%d login=%s", user["id"], login or telefon)
    return {"token": token, "user_id": user["id"]}


@app.post("/api/v1/admin/parol", tags=["Auth"])
async def admin_parol_qoy(data: dict, uid: int = Depends(get_uid)):
    """Admin: do'konchiga login/parol berish"""
    # Admin tekshiruvi
    admin_ids = os.getenv("ADMIN_IDS", "").split(",")
    if str(uid) not in [a.strip() for a in admin_ids]:
        raise HTTPException(403, "Faqat admin uchun")

    target_id = data.get("user_id")
    login = (data.get("login") or "").strip()
    parol = (data.get("parol") or "").strip()

    if not target_id or not parol:
        raise HTTPException(400, "user_id va parol kerak")
    if len(parol) < 4:
        raise HTTPException(400, "Parol kamida 4 belgi bo'lishi kerak")

    hashed = _parol_hash(parol)

    async with get_pool().acquire() as c:
        user = await c.fetchrow("SELECT id, ism FROM users WHERE id=$1", int(target_id))
        if not user:
            raise HTTPException(404, "Foydalanuvchi topilmadi")

        if login:
            # Login band emasligini tekshirish
            existing = await c.fetchrow(
                "SELECT id FROM users WHERE lower(login)=$1 AND id!=$2",
                login.lower(), int(target_id),
            )
            if existing:
                raise HTTPException(409, f"'{login}' login allaqachon band")
            await c.execute(
                "UPDATE users SET login=$1, parol_hash=$2, yangilangan=NOW() WHERE id=$3",
                login, hashed, int(target_id),
            )
        else:
            await c.execute(
                "UPDATE users SET parol_hash=$1, yangilangan=NOW() WHERE id=$2",
                hashed, int(target_id),
            )

    from shared.cache.redis_cache import user_cache_tozala
    await user_cache_tozala(int(target_id))
    log.info("🔐 Admin parol qo'ydi: target=%d login=%s", int(target_id), login)
    return {"ok": True, "user_id": int(target_id), "login": login or None}


@app.get("/api/v1/me", tags=["Auth"])
async def me(uid: int = Depends(get_uid)):
    """Joriy foydalanuvchi"""
    cached = await cache_ol(k_user(uid))
    if cached:
        safe = {k: v for k, v in cached.items() if k != "parol_hash"}
        return safe
    async with rls_conn(uid) as c:
        u = await c.fetchrow("SELECT id, ism, to_liq_ism, username, telefon, inn, manzil, dokon_nomi, segment, faol, obuna_tugash, til, plan, login, yaratilgan FROM users WHERE id=$1", uid)
        if not u:
            raise HTTPException(404, "Topilmadi")
        result = dict(u)
        await cache_yoz(k_user(uid), result, TTL_USER)
        return result


@app.get("/api/v1/dashboard", tags=["Dashboard"])
async def dashboard(uid: int = Depends(get_uid)):
    """Dashboard statistikasi (5 daqiqa cache)"""
    cache_k = f"dashboard:{uid}"
    cached  = await cache_ol(cache_k)
    if cached:
        return cached

    async with rls_conn(uid) as c:
        bugun = await c.fetchrow("""
            SELECT
                COUNT(*)              AS sotuv_soni,
                COALESCE(SUM(jami),0) AS sotuv_jami,
                COALESCE(SUM(qarz),0) AS yangi_qarz
            FROM sotuv_sessiyalar
            WHERE (sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
        """)
        jami_qarz = await c.fetchval("""
            SELECT COALESCE(SUM(qolgan),0)
            FROM qarzlar WHERE yopildi=FALSE
        """)
        klient_soni = await c.fetchval("SELECT COUNT(*) FROM klientlar WHERE user_id=$1", uid)
        tovar_soni  = await c.fetchval("SELECT COUNT(*) FROM tovarlar WHERE user_id=$1", uid)
        kam_qoldiq  = await c.fetchval("""
            SELECT COUNT(*) FROM tovarlar
            WHERE user_id=$1 AND min_qoldiq>0 AND qoldiq<=min_qoldiq
        """, uid)

        # Muddati o'tgan qarzlar
        overdue = await c.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(qolgan), 0) AS jami
            FROM qarzlar
            WHERE yopildi=FALSE AND qolgan>0 AND muddat < CURRENT_DATE
        """)

        # Kutilayotgan xarajatlar
        pending_exp = 0
        try:
            pending_exp = await c.fetchval("""
                SELECT COUNT(*) FROM xarajatlar
                WHERE admin_uid=$1 AND NOT tasdiqlangan AND NOT bekor_qilingan
            """, uid) or 0
        except Exception:
            pass

        # Faol shogirdlar
        active_app = 0
        try:
            active_app = await c.fetchval("""
                SELECT COUNT(*) FROM shogirdlar
                WHERE admin_uid=$1 AND faol=TRUE
            """, uid) or 0
        except Exception:
            pass

    result = {
        "bugun_sotuv_soni":  int(bugun["sotuv_soni"]),
        "bugun_sotuv_jami":  float(bugun["sotuv_jami"]),
        "bugun_yangi_qarz":  float(bugun["yangi_qarz"]),
        "jami_qarz":         float(jami_qarz or 0),
        "klient_soni":       klient_soni,
        "tovar_soni":        tovar_soni,
        "kam_qoldiq_soni":   kam_qoldiq,
        "overdue_count":     int(overdue["soni"]) if overdue else 0,
        "overdue_amount":    float(overdue["jami"]) if overdue else 0,
        "pending_expenses":  int(pending_exp),
        "active_apprentices": int(active_app),
    }
    await cache_yoz(cache_k, result, TTL_HISOBOT)
    return result


@app.get("/api/v1/klientlar", tags=["Klientlar"])
async def klientlar(
    limit: int = 20, offset: int = 0,
    qidiruv: Optional[str] = None,
    uid: int = Depends(get_uid)
):
    """Klientlar ro'yxati"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        if qidiruv:
            rows = await c.fetch("""
                SELECT k.*,
                       COALESCE(SUM(q.qolgan) FILTER(WHERE q.yopildi=FALSE),0) aktiv_qarz
                FROM klientlar k
                LEFT JOIN qarzlar q ON q.klient_id=k.id
                WHERE lower(k.ism) LIKE lower($3) OR k.telefon LIKE $3
                GROUP BY k.id
                ORDER BY k.jami_sotib DESC LIMIT $1 OFFSET $2
            """, limit, offset, f"%{like_escape(qidiruv)}%")
            total = await c.fetchval("""
                SELECT COUNT(*) FROM klientlar
                WHERE user_id=$2 AND (lower(ism) LIKE lower($1) OR telefon LIKE $1)
            """, f"%{like_escape(qidiruv)}%", uid)
        else:
            rows = await c.fetch("""
                SELECT k.*,
                       COALESCE(SUM(q.qolgan) FILTER(WHERE q.yopildi=FALSE),0) aktiv_qarz
                FROM klientlar k
                LEFT JOIN qarzlar q ON q.klient_id=k.id
                GROUP BY k.id
                ORDER BY k.jami_sotib DESC LIMIT $1 OFFSET $2
            """, limit, offset)
            total = await c.fetchval("SELECT COUNT(*) FROM klientlar WHERE user_id=$1", uid)

    return {"total": total, "items": [dict(r) for r in rows]}


@app.get("/api/v1/tovarlar", tags=["Tovarlar"])
async def tovarlar(
    limit: int = 20, offset: int = 0,
    kategoriya: Optional[str] = None,
    uid: int = Depends(get_uid)
):
    """Tovarlar ro'yxati"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        if kategoriya:
            rows = await c.fetch("""
                SELECT id, user_id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi, min_sotish_narxi, qoldiq, min_qoldiq, yaratilgan FROM tovarlar WHERE kategoriya=$3
                ORDER BY nomi LIMIT $1 OFFSET $2
            """, limit, offset, kategoriya)
            total = await c.fetchval(
                "SELECT COUNT(*) FROM tovarlar WHERE user_id=$2 AND kategoriya=$1", kategoriya, uid
            )
        else:
            rows  = await c.fetch(
                "SELECT id, user_id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi, min_sotish_narxi, qoldiq, min_qoldiq, yaratilgan FROM tovarlar ORDER BY kategoriya,nomi LIMIT $1 OFFSET $2",
                limit, offset
            )
            total = await c.fetchval("SELECT COUNT(*) FROM tovarlar WHERE user_id=$1", uid)

    return {"total": total, "items": [dict(r) for r in rows]}


@app.get("/api/v1/qarzlar", tags=["Qarz"])
async def qarzlar(uid: int = Depends(get_uid)):
    """Faol qarzlar (10 daqiqa cache)"""
    cached = await cache_ol(k_qarzlar(uid))
    if cached:
        return cached
    async with rls_conn(uid) as c:
        rows = await c.fetch("""
            SELECT klient_ismi,
                   SUM(qolgan)  AS qolgan,
                   COUNT(*)     AS soni,
                   MIN(muddat)  AS muddat
            FROM qarzlar
            WHERE yopildi=FALSE AND qolgan>0
            GROUP BY klient_ismi
            ORDER BY qolgan DESC
        """)
    result = [dict(r) for r in rows]
    await cache_yoz(k_qarzlar(uid), result, TTL_HISOBOT * 2)
    return result


@app.get("/api/v1/hisobot/kunlik", tags=["Hisobotlar"])
async def hisobot_kunlik(uid: int = Depends(get_uid)):
    """Bugungi hisobot (5 daqiqa cache)"""
    cached = await cache_ol(k_hisobot_kunlik(uid))
    if cached:
        return cached
    async with rls_conn(uid) as c:
        kr = await c.fetchrow("""
            SELECT COUNT(*) n, COALESCE(SUM(jami),0) jami
            FROM kirimlar
            WHERE (sana AT TIME ZONE 'Asia/Tashkent')::date=CURRENT_DATE
        """)
        ch = await c.fetchrow("""
            SELECT COUNT(*) n,
                   COALESCE(SUM(jami),0)     jami,
                   COALESCE(SUM(qarz),0)     qarz,
                   COALESCE(SUM(tolangan),0) tolangan
            FROM sotuv_sessiyalar
            WHERE (sana AT TIME ZONE 'Asia/Tashkent')::date=CURRENT_DATE
        """)
        jami_qarz = await c.fetchval(
            "SELECT COALESCE(SUM(qolgan),0) FROM qarzlar WHERE yopildi=FALSE"
        )

    result = {
        "kirim":    {"soni": int(kr["n"]),  "jami": float(kr["jami"])},
        "sotuv":    {"soni": int(ch["n"]),  "jami": float(ch["jami"]),
                     "qarz": float(ch["qarz"])},
        "jami_qarz": float(jami_qarz or 0),
    }
    await cache_yoz(k_hisobot_kunlik(uid), result, TTL_HISOBOT)
    return result


# ════════════════════════════════════════════════════════════
#  KOGNITIV ENGINE PROXY
# ════════════════════════════════════════════════════════════

@app.post("/api/v1/tahlil", tags=["Sotuv"])
async def tahlil(data: dict, uid: int = Depends(get_uid)):
    """
    AI tahlil — Cognitive Engine ga proksi.
    RAG + Tool Calling + temperature=0.0
    """
    import httpx
    matn = data.get("matn", "").strip()
    if not matn:
        raise HTTPException(400, "Matn bo'sh")

    cog_url = os.getenv("COGNITIVE_URL", "")
    if not cog_url:
        raise HTTPException(503, "Kognitiv dvigatel ulanmagan")

    async with httpx.AsyncClient(timeout=35.0) as http:
        try:
            r = await http.post(
                f"{cog_url}/tahlil",
                json={"matn": matn, "uid": uid},
            )
            r.raise_for_status()
            return r.json()
        except httpx.TimeoutException:
            raise HTTPException(504, "AI timeout")
        except Exception as e:
            log.error("Kognitiv xato: %s", e)
            raise HTTPException(502, "AI xato")


# ════════════════════════════════════════════════════════════
#  SOTUV VA KIRIM ENDPOINTLARI
# ════════════════════════════════════════════════════════════

@app.post("/api/v1/sotuv", tags=["Sotuv"])
async def sotuv_saqlash(data: SotuvSo_rov, request: Request, uid: int = Depends(get_uid)):
    """Sotuv operatsiyasini saqlash. Rate limit: 30/daqiqa.

    1. Sessiya yaratish
    2. Har bir tovar uchun chiqim yozuvi + qoldiq kamaytirish
    3. Klient topish/yaratish
    4. Qarz saqlash (agar bor bo'lsa)
    """
    from services.api.deps import endpoint_rate_check
    await endpoint_rate_check(request, "sotuv")
    from shared.utils.hisob import sotuv_validatsiya, ai_hisob_tekshir
    from shared.cache.redis_cache import user_cache_tozala

    ok, xato = sotuv_validatsiya(data.model_dump())
    if not ok:
        raise HTTPException(400, "So'rov ma'lumotlari noto'g'ri")

    data_d = ai_hisob_tekshir(data.model_dump())

    async with rls_conn(uid) as c:
        async with c.transaction():
            # 1. Klient topish/yaratish
            klient_id = None
            klient_ismi = (data_d.get("klient") or "").strip()
            if klient_ismi:
                kl = await c.fetchrow("""
                    INSERT INTO klientlar (user_id, ism) VALUES ($1, $2)
                    ON CONFLICT (user_id, lower(ism))
                    DO UPDATE SET ism = klientlar.ism RETURNING id
                """, uid, klient_ismi)
                klient_id = kl["id"]

            jami = float(data_d.get("jami_summa", 0))
            tolangan = float(data_d.get("tolangan", 0))
            qarz_summa = float(data_d.get("qarz", 0))

            # 2. Sessiya yaratish
            sess_id = await c.fetchval("""
                INSERT INTO sotuv_sessiyalar
                    (user_id, klient_id, klient_ismi, jami, tolangan, qarz, izoh)
                VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id
            """, uid, klient_id, klient_ismi or None,
                jami, tolangan, qarz_summa,
                data_d.get("izoh"),
            )

            # 3. Har bir tovar — chiqim + qoldiq
            tovarlar = data_d.get("tovarlar", [])
            for t in tovarlar:
                nomi = t.get("nomi", "").strip()
                miqdor = float(t.get("miqdor", 0))
                narx = float(t.get("narx", 0))
                t_jami = float(t.get("jami", 0)) or (miqdor * narx)
                birlik = t.get("birlik", "dona")

                # Tovar topish
                tovar = await c.fetchrow("""
                    SELECT id, nomi, olish_narxi, sotish_narxi FROM tovarlar
                    WHERE user_id=$1 AND lower(nomi) LIKE lower($2) LIMIT 1
                """, uid, f"%{like_escape(nomi)}%")

                tovar_id = tovar["id"] if tovar else None
                olish = float(tovar["olish_narxi"]) if tovar else 0

                # Chiqim yozuvi
                await c.execute("""
                    INSERT INTO chiqimlar
                        (user_id, sessiya_id, tovar_id, tovar_nomi, klient_ismi,
                         miqdor, birlik, sotish_narxi, jami, olish_narxi, foyda)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                """, uid, sess_id, tovar_id, nomi, klient_ismi or None,
                    miqdor, birlik, narx, t_jami, olish,
                    t_jami - (olish * miqdor),
                )

                # Qoldiq kamaytirish
                if tovar_id:
                    await c.execute("""
                        UPDATE tovarlar SET qoldiq = GREATEST(qoldiq - $2, 0)
                        WHERE id = $1 AND user_id = $3
                    """, tovar_id, miqdor, uid)

            # 4. Qarz saqlash
            if qarz_summa > 0 and klient_id:
                await c.execute("""
                    INSERT INTO qarzlar
                        (user_id, klient_id, klient_ismi, sessiya_id, summa, qolgan)
                    VALUES ($1,$2,$3,$4,$5,$5)
                """, uid, klient_id, klient_ismi, sess_id, qarz_summa)

                # Klient jami_sotib yangilash
                await c.execute("""
                    UPDATE klientlar SET jami_sotib = jami_sotib + $2 WHERE id=$1
                """, klient_id, jami)

    await user_cache_tozala(uid)
    log.info("📤 Web sotuv: sessiya=%d tovarlar=%d jami=%.0f uid=%d",
             sess_id, len(tovarlar), jami, uid)
    return {"sessiya_id": sess_id, "status": "saqlandi"}


@app.post("/api/v1/kirim", tags=["Sotuv"])
async def kirim_saqlash(data: KirimSo_rov, uid: int = Depends(get_uid)):
    """Tovar kirimini saqlash"""
    from shared.utils.hisob import kirim_validatsiya
    from shared.cache.redis_cache import user_cache_tozala

    ok, xato = kirim_validatsiya({
        "tovar_nomi": data.tovar_nomi,
        "miqdor":     data.miqdor,
        "narx":       data.narx,
    })
    if not ok:
        raise HTTPException(400, "So'rov ma'lumotlari noto'g'ri")

    async with rls_conn(uid) as c:
        kirim_id = await c.fetchval("""
            INSERT INTO kirimlar
                (user_id, tovar_nomi, kategoriya, miqdor, birlik, narx, jami, manba)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id
        """, uid,
            data.tovar_nomi,
            data.kategoriya,
            data.miqdor,
            data.birlik,
            data.narx,
            data.jami,
            data.manba,
        )

    await user_cache_tozala(uid)
    return {"kirim_id": kirim_id, "status": "saqlandi"}


# ════════════════════════════════════════════════════════════
#  QARZ TO'LASH
# ════════════════════════════════════════════════════════════

@app.post("/api/v1/qarz/tolash", tags=["Qarz"])
async def qarz_tolash_endpoint(
    data: QarzTolashSo_rov,
    uid: int = Depends(get_uid)
):
    """Klientning qarzini to'lash (FIFO tartibida)"""
    from shared.utils.hisob import qarz_to_lash_hisob, D
    from shared.cache.redis_cache import user_cache_tozala
    from decimal import Decimal

    async with rls_conn(uid) as c:
        qarzlar = await c.fetch("""
            SELECT id, qolgan FROM qarzlar
            WHERE lower(klient_ismi) LIKE lower($1)
              AND yopildi=FALSE AND qolgan>0
            ORDER BY yaratilgan ASC
            FOR UPDATE
        """, f"%{like_escape(data.klient_ismi.strip())}%")

        if not qarzlar:
            raise HTTPException(404, f"'{data.klient_ismi}' uchun qarz topilmadi")

        summa     = Decimal(str(data.summa))
        qoldi     = summa
        tolandi_j = Decimal("0")

        for q in qarzlar:
            if qoldi <= 0: break
            r = qarz_to_lash_hisob(q["qolgan"], str(qoldi))
            tl = D(r["tolandi"]); yq = D(r["qolgan"])

            await c.execute("""
                UPDATE qarzlar
                SET tolangan=tolangan+$1, qolgan=$2,
                    yopildi=$3, yangilangan=NOW()
                WHERE id=$4
            """, tl, yq, yq == 0, q["id"])

            tolandi_j += tl
            qoldi     -= tl

        qolgan_jami = D(await c.fetchval("""
            SELECT COALESCE(SUM(qolgan),0) FROM qarzlar
            WHERE lower(klient_ismi) LIKE lower($1) AND yopildi=FALSE
        """, f"%{like_escape(data.klient_ismi.strip())}%") or 0)

    await user_cache_tozala(uid)
    return {
        "klient":      data.klient_ismi,
        "tolandi":     str(tolandi_j),
        "qolgan_qarz": str(qolgan_jami),
        "status":      "tolandi" if qolgan_jami == 0 else "qisman_tolandi",
    }


# ════════════════════════════════════════════════════════════
#  MONITORING ENDPOINTLARI
# ════════════════════════════════════════════════════════════

@app.get("/healthz", tags=["Monitoring"])
async def healthz(request: Request):
    """Kubernetes/Railway health probe — process uptime (restart/crash diagnostikasi)."""
    rid = getattr(request.state, "request_id", None)
    log.info("probe healthz 200 request_id=%s", rid)
    return {"status": "ok", **process_info()}


@app.get("/live", tags=["Monitoring"])
async def live(request: Request):
    """
    Minimal liveness — DB/Redis tekshirilmaydi.
    502: edge vs app: bu endpoint javob bersa, process ishlayapti; javob bo'lmasa — upstream/crash.
    """
    rid = getattr(request.state, "request_id", None)
    log.info("probe live 200 request_id=%s", rid)
    return {"status": "alive", **process_info()}


@app.get("/readyz", tags=["Monitoring"])
async def readyz():
    """Ready probe — DB + Redis ulangandan keyin tayyor"""
    from shared.cache.redis_cache import redis_health
    db_ok    = False
    redis_ok = False

    try:
        async with get_pool().acquire() as c:
            await c.fetchval("SELECT 1")
        db_ok = True
    except Exception as e:
        log.error("DB readyz check failed: %s", e)

    r_info   = await redis_health()
    redis_ok = r_info.get("status") == "ok"

    # REDIS_REQUIRED=true (default) → readyz fails if Redis down
    redis_required = os.getenv("REDIS_REQUIRED", "true").lower() == "true"
    is_ready = db_ok and (redis_ok or not redis_required)

    if is_ready:
        return {
            "status": "ready",
            "db":     "ok",
            "redis":  "ok" if redis_ok else "degraded",
        }
    from fastapi.responses import JSONResponse
    deps = {}
    if not db_ok:
        deps["db"] = "unavailable"
    if not redis_ok and redis_required:
        deps["redis"] = "unavailable"
    return JSONResponse(status_code=503, content={
        "status": "not ready",
        **deps,
    })

@app.post("/api/v1/klient", tags=["Klientlar"])
async def klient_yarat(data: dict, uid: int = Depends(get_uid)):
    """Yangi klient yaratish yoki topish"""
    from shared.cache.redis_cache import user_cache_tozala
    ism = (data.get("ism") or "").strip()
    if not ism:
        raise HTTPException(400, "Klient ismi bo'sh")
    async with rls_conn(uid) as c:
        klient = await c.fetchrow("""
            INSERT INTO klientlar(user_id, ism, telefon, manzil, kredit_limit)
            VALUES($1,$2,$3,$4,$5)
            ON CONFLICT(user_id, lower(ism)) DO UPDATE
                SET telefon=EXCLUDED.telefon
            RETURNING id, user_id, ism, telefon, manzil, kredit_limit, jami_sotib, yaratilgan
        """, uid, ism,
            data.get("telefon"),
            data.get("manzil"),
            data.get("kredit_limit", 0),
        )
    await user_cache_tozala(uid)
    return dict(klient)


@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """
    Prometheus-compat metrics (oddiy format).
    Grafana Cloud bilan integratsiya uchun.
    """
    try:
        async with get_pool().acquire() as c:
            user_count = await c.fetchval(
                "SELECT COUNT(*) FROM users WHERE faol=TRUE"
            )
            pool = get_pool()
            pool_size = pool.get_size() if hasattr(pool, 'get_size') else 0
    except Exception:
        user_count = 0; pool_size = 0

    return (
        f"# HELP mm_faol_users Faol foydalanuvchilar\n"
        f"# TYPE mm_faol_users gauge\n"
        f"mm_faol_users {user_count}\n"
        f"# HELP mm_db_pool DB pool holati\n"
        f"# TYPE mm_db_pool gauge\n"
        f"mm_db_pool_size {pool_size}\n"
    )




# ════════════════════════════════════════════════════════════
#  QIDIRUV
# ════════════════════════════════════════════════════════════

@app.get("/api/v1/search", tags=["Sotuv"])
async def search(
    q: str,
    tur: str = "barchasi",   # tovar | klient | barchasi
    limit: int = 10,
    uid: int = Depends(get_uid)
):
    """Global qidiruv — tovar va klientlar"""
    if len(q.strip()) < 2:
        raise HTTPException(400, "Kamida 2 belgi kiriting")
    limit = min(limit, 50)
    async with rls_conn(uid) as c:
        tovarlar_r, klientlar_r = [], []
        if tur in ("tovar","barchasi"):
            tovarlar_r = [dict(r) for r in await c.fetch("""
                SELECT id,nomi,kategoriya,qoldiq,sotish_narxi
                FROM tovarlar
                WHERE lower(nomi) LIKE lower($1) OR lower(kategoriya) LIKE lower($1)
                ORDER BY nomi LIMIT $2
            """, f"%{like_escape(q)}%", limit)]
        if tur in ("klient","barchasi"):
            klientlar_r = [dict(r) for r in await c.fetch("""
                SELECT id,ism,telefon,jami_sotib
                FROM klientlar
                WHERE lower(ism) LIKE lower($1) OR (telefon IS NOT NULL AND telefon LIKE $1)
                ORDER BY jami_sotib DESC LIMIT $2
            """, f"%{like_escape(q)}%", limit)]
    return {"tovarlar": tovarlar_r, "klientlar": klientlar_r,
            "jami": len(tovarlar_r) + len(klientlar_r)}


@app.get("/api/v1/tovar/{tovar_id}", tags=["Tovarlar"])
async def tovar_bir(tovar_id: int, uid: int = Depends(get_uid)):
    """Bitta tovar to'liq ma'lumoti"""
    async with rls_conn(uid) as c:
        t = await c.fetchrow("SELECT id, user_id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi, min_sotish_narxi, qoldiq, min_qoldiq, yaratilgan FROM tovarlar WHERE id=$1", tovar_id)
        if not t:
            raise HTTPException(404, "Tovar topilmadi")
        return dict(t)


# ════════════════════════════════════════════════════════════
#  HISOBOTLAR (haftalik / oylik)
# ════════════════════════════════════════════════════════════

@app.get("/api/v1/hisobot/haftalik", tags=["Hisobotlar"])
async def hisobot_haftalik(uid: int = Depends(get_uid)):
    """7 kunlik hisobot"""
    from shared.cache.redis_cache import cache_ol, cache_yoz, TTL_HISOBOT
    cache_k = f"hisobot:haftalik:{uid}"
    cached  = await cache_ol(cache_k)
    if cached: return cached
    async with rls_conn(uid) as c:
        ch = await c.fetchrow("""
            SELECT COUNT(*) n,
                   COALESCE(SUM(jami),0)     jami,
                   COALESCE(SUM(qarz),0)     qarz,
                   COALESCE(SUM(tolangan),0) tolangan
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - INTERVAL '7 days'
        """)
        kr = await c.fetchrow("""
            SELECT COUNT(*) n, COALESCE(SUM(jami),0) jami
            FROM kirimlar WHERE sana >= NOW() - INTERVAL '7 days'
        """)
        top_klientlar = [dict(r) for r in await c.fetch("""
            SELECT klient_ismi, SUM(jami) jami, COUNT(*) soni
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - INTERVAL '7 days' AND klient_ismi IS NOT NULL
            GROUP BY klient_ismi ORDER BY jami DESC LIMIT 5
        """)]
    result = {
        "davr":          "7 kun",
        "sotuv":         {"soni":int(ch["n"]), "jami":float(ch["jami"]), "qarz":float(ch["qarz"])},
        "kirim":         {"soni":int(kr["n"]), "jami":float(kr["jami"])},
        "top_klientlar": top_klientlar,
    }
    await cache_yoz(cache_k, result, TTL_HISOBOT * 6)
    return result


@app.get("/api/v1/hisobot/oylik", tags=["Hisobotlar"])
async def hisobot_oylik(uid: int = Depends(get_uid)):
    """30 kunlik hisobot"""
    from shared.cache.redis_cache import cache_ol, cache_yoz, TTL_HISOBOT
    cache_k = f"hisobot:oylik:{uid}"
    cached  = await cache_ol(cache_k)
    if cached: return cached
    async with rls_conn(uid) as c:
        ch = await c.fetchrow("""
            SELECT COUNT(*) n,
                   COALESCE(SUM(jami),0)     jami,
                   COALESCE(SUM(qarz),0)     qarz,
                   COALESCE(SUM(tolangan),0) tolangan
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - INTERVAL '30 days'
        """)
        foyda = await c.fetchrow("""
            SELECT COALESCE(SUM(ch.jami - ch.miqdor*ch.olish_narxi),0) sof_foyda
            FROM chiqimlar ch
            WHERE sana >= NOW() - INTERVAL '30 days'
        """)
        top5_tovar = [dict(r) for r in await c.fetch("""
            SELECT tovar_nomi, SUM(miqdor) miqdor, SUM(jami) jami
            FROM chiqimlar
            WHERE sana >= NOW() - INTERVAL '30 days'
            GROUP BY tovar_nomi ORDER BY jami DESC LIMIT 5
        """)]
    result = {
        "davr":       "30 kun",
        "sotuv":      {"soni":int(ch["n"]), "jami":float(ch["jami"])},
        "sof_foyda":  float(foyda["sof_foyda"] or 0),
        "top_tovarlar": top5_tovar,
    }
    await cache_yoz(cache_k, result, TTL_HISOBOT * 12)
    return result


# ════════════════════════════════════════════════════════════
#  EXPORT TRIGGER (Worker ga yuboradi)
# ════════════════════════════════════════════════════════════

@app.post("/api/v1/export", tags=["Export"])
async def export_trigger(data: dict, request: Request, uid: int = Depends(get_uid)):
    """
    Excel/PDF eksportni Worker ga yuboradi.
    Katta hisobotlar background da tayyorlanadi.
    Rate limit: 3 so'rov/daqiqa.
    """
    from services.api.deps import endpoint_rate_check
    await endpoint_rate_check(request, "export")
    tur      = data.get("tur", "kunlik")       # kunlik | haftalik | oylik
    format_  = data.get("format", "excel")     # excel | pdf
    sana_dan   = data.get("sana_dan", "")
    sana_gacha = data.get("sana_gacha", "")

    if tur not in ("kunlik", "haftalik", "oylik"):
        raise HTTPException(400, "tur: kunlik | haftalik | oylik bo'lishi kerak")
    if format_ not in ("excel", "pdf"):
        raise HTTPException(400, "format: excel | pdf bo'lishi kerak")

    redis_url = os.getenv("REDIS_URL","")
    if not redis_url:
        raise HTTPException(503, "Worker ulanganda emas")

    try:
        from celery import Celery as _Celery
        _app = _Celery(broker=redis_url)
        task = _app.send_task(
            "tasks.katta_export",
            args=[uid, tur, sana_dan, sana_gacha, format_],
        )
        return {
            "task_id": task.id,
            "status":  "navbatda",
            "format":  format_,
            "tur":     tur,
        }
    except Exception as e:
        log.error("Export celery xato: %s", e)
        raise HTTPException(503, "Export navbati vaqtincha mavjud emas")

# ════════════════════════════════════════════════════════════
#  EXPORT NATIJA OLISH
# ════════════════════════════════════════════════════════════

@app.get("/api/v1/export/{task_id}", tags=["Export"])
async def export_natija(task_id: str, uid: int = Depends(get_uid)):
    """
    Export task natijasini tekshirish.
    task_id: /api/v1/export POST dan qaytgan task_id (UUID format)

    Holat: pending | processing | ready | error
    ready bo'lsa: file_url yoki file_bytes qaytaradi (bot uchun: file_url=None, download is via /export/file/{task_id})
    """
    # task_id UUID formatini tekshirish (injection himoyasi)
    import uuid as _uuid_mod
    try:
        _uuid_mod.UUID(task_id)
    except ValueError:
        raise HTTPException(400, "task_id noto'g'ri format")
    redis_url = os.getenv("REDIS_URL", "")
    if not redis_url:
        raise HTTPException(503, "Worker ulanganda emas")

    try:
        from celery import Celery as _Celery
        from celery.result import AsyncResult
        _app = _Celery(broker=redis_url, backend=redis_url)
        result = AsyncResult(task_id, app=_app)

        if result.state == "PENDING":
            return {"task_id": task_id, "holat": "kutilmoqda"}
        elif result.state == "STARTED" or result.state == "RETRY":
            return {"task_id": task_id, "holat": "bajarilmoqda"}
        elif result.state == "SUCCESS":
            res = result.result or {}
            status = res.get("status", "")
            if status == "tayyor" and res.get("content_b64"):
                return {
                    "task_id":  task_id,
                    "holat":    "tayyor",
                    "format":   res.get("format", "excel"),
                    "hajm_kb":  res.get("hajm_kb", 0),
                    "download": f"/api/v1/export/file/{task_id}",
                }
            elif status == "katta_fayl":
                return {
                    "task_id": task_id,
                    "holat":   "katta_fayl",
                    "xato":    res.get("xato", "Fayl hajmi katta"),
                }
            else:
                return {
                    "task_id": task_id,
                    "holat":   "xato",
                    "xato":    res.get("xato", "Export bajarilmadi"),
                }
        elif result.state == "FAILURE":
            # Celery task xato bilan tugadi
            err_info = str(result.info) if result.info else "Export bajarilmadi"
            return {
                "task_id": task_id,
                "holat":   "xato",
                "xato":    "Export bajarilmadi. Keyinroq urinib ko'ring.",
            }
        else:
            # REVOKED yoki noma'lum holat
            return {
                "task_id": task_id,
                "holat":   "xato",
                "xato":    f"Task holati: {result.state}",
            }
    except Exception as e:
        log.error("Export natija xato: %s", e)
        raise HTTPException(503, "Export holati tekshirib bo'lmadi")


@app.get("/api/v1/export/file/{task_id}", tags=["Export"])
async def export_file_yuklab(task_id: str, uid: int = Depends(get_uid)):
    """
    Tayyor export faylni yuklash.
    Faqat faylni yaratgan foydalanuvchi uchun (uid tekshiruvi fayl nomida).
    """
    # task_id UUID formatini tekshirish (injection himoyasi)
    import uuid as _uuid_mod
    try:
        _uuid_mod.UUID(task_id)
    except ValueError:
        raise HTTPException(400, "task_id noto'g'ri format")
    redis_url = os.getenv("REDIS_URL", "")
    if not redis_url:
        raise HTTPException(503, "Worker ulanganda emas")

    try:
        from celery import Celery as _Celery
        from celery.result import AsyncResult
        import base64
        from fastapi.responses import Response
        _app = _Celery(broker=redis_url, backend=redis_url)
        result = AsyncResult(task_id, app=_app)
        if result.state != "SUCCESS":
            raise HTTPException(404, "Fayl tayyor emas yoki hali bajarilmoqda")
        res = result.result or {}
        if res.get("status") != "tayyor":
            raise HTTPException(404, "Export muvaffaqiyatsiz tugadi")

        content_b64 = res.get("content_b64", "")
        if not content_b64:
            raise HTTPException(404, "Fayl mazmuni topilmadi (muddati o'tgan bo'lishi mumkin)")

        # Security: task result user_id tekshirish — boshqa user faylini yuklab olishni oldini olish
        task_uid = res.get("user_id")
        if task_uid is not None and int(task_uid) != uid:
            log.warning("EXPORT SECURITY: uid=%d tried to download task for uid=%s", uid, task_uid)
            raise HTTPException(403, "Bu fayl sizga tegishli emas")

        format_ = res.get("format", "excel")
        ext     = "xlsx" if format_ == "excel" else "pdf"
        media   = (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            if ext == "xlsx" else "application/pdf"
        )
        filename = f"export_{uid}.{ext}"
        content  = base64.b64decode(content_b64)
        return Response(
            content=content,
            media_type=media,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error("Export file yuklab xato: %s", e)
        raise HTTPException(500, "Fayl yuklanmadi")


# ════════════════════════════════════════════════════════════
#  GLOBAL XATO HANDLER
# ════════════════════════════════════════════════════════════

@app.exception_handler(Exception)
async def xato_handler(request: Request, exc: Exception):
    log.error("API xato: %s %s — %s", request.method, request.url.path, exc)
    return JSONResponse(status_code=500, content={"detail": "Ichki server xatosi"})


# ════════════════════════════════════════════════════════════
#  v21.3 TURBO — REQUEST TIMING MIDDLEWARE
# ════════════════════════════════════════════════════════════

@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    """Har so'rovda X-Response-Time header qo'shadi"""
    import time as _t
    start = _t.monotonic()
    response = await call_next(request)
    ms = round((_t.monotonic() - start) * 1000, 1)
    response.headers["X-Response-Time"] = f"{ms}ms"
    if ms > 1000:
        log.warning("SLOW: %s %s — %sms", request.method, request.url.path, ms)
    return response


# ═══ RATE LIMITER — SAP-GRADE API HIMOYA ═══
_rate_buckets: dict = {}  # {ip: [timestamps]}
_rate_last_gc: float = 0.0  # oxirgi tozalash vaqti
RATE_LIMIT = int(os.environ.get("API_RATE_LIMIT", "60"))  # per minute
RATE_WINDOW = 60  # seconds
_RATE_GC_INTERVAL = 300  # har 5 daqiqada eski IPlarni tozalash
_RATE_MAX_IPS = 10_000  # max IP soni (DDoS himoya)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """IP-based rate limiting — SAP-GRADE API himoya"""
    import time as _t
    global _rate_last_gc
    # CORS preflight must never be rate-limited (browser needs 200 + ACAO on OPTIONS).
    if request.method == "OPTIONS":
        return await call_next(request)
    # Health/readyz endpoints skip
    if request.url.path in ("/health", "/healthz", "/readyz", "/live"):
        return await call_next(request)
    # Android printer helper — bir nechta tezkor so'rov (yuklash + ack)
    if request.url.path.startswith("/api/print"):
        return await call_next(request)

    ip = request.client.host if request.client else "unknown"
    now = _t.time()

    # Periodic GC — eski IPlarni tozalash (memory leak oldini oladi)
    if now - _rate_last_gc > _RATE_GC_INTERVAL:
        dead_ips = [k for k, v in _rate_buckets.items()
                    if not v or (now - max(v)) > RATE_WINDOW * 2]
        for k in dead_ips:
            del _rate_buckets[k]
        _rate_last_gc = now

    # Max IP cap — DDoS himoya
    if len(_rate_buckets) > _RATE_MAX_IPS and ip not in _rate_buckets:
        return await call_next(request)  # yangi IP qo'shmaymiz

    # Clean old entries
    if ip in _rate_buckets:
        _rate_buckets[ip] = [t for t in _rate_buckets[ip] if now - t < RATE_WINDOW]
    else:
        _rate_buckets[ip] = []

    if len(_rate_buckets[ip]) >= RATE_LIMIT:
        log.warning("RATE LIMIT: %s — %d req/min", ip, len(_rate_buckets[ip]))
        from starlette.responses import JSONResponse
        return JSONResponse(
            {"error": "Rate limit exceeded", "limit": RATE_LIMIT, "window": "60s"},
            status_code=429,
            headers={"Retry-After": "60", "X-RateLimit-Limit": str(RATE_LIMIT)}
        )

    _rate_buckets[ip].append(now)
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT)
    response.headers["X-RateLimit-Remaining"] = str(RATE_LIMIT - len(_rate_buckets[ip]))
    return response


# ════════════════════════════════════════════════════════════
#  v21.3 TURBO — KASSA BOT PROXY (bot → API kassa)
# ════════════════════════════════════════════════════════════



# ════════════════════════════════════════════════════════════════
#  § LEDGER — SAP-GRADE Buxgalteriya
# ════════════════════════════════════════════════════════════════

@app.get("/api/v1/ledger/balans", tags=["Ledger"])
async def ledger_balans(uid: int = Depends(get_uid)):
    """Balans tekshiruvi — debit = credit"""
    from shared.services.ledger import balans_tekshir, hisob_balans, HisobTuri
    async with rls_conn(uid) as c:
        b = await balans_tekshir(c, uid)
        hisoblar = {}
        for h in HisobTuri:
            val = await hisob_balans(c, uid, h)
            hisoblar[h.value] = float(val)
    return {**b, "hisoblar": hisoblar}


@app.get("/api/v1/ledger/jurnal", tags=["Ledger"])
async def ledger_jurnal(uid: int = Depends(get_uid), limit: int = 50):
    """Jurnal yozuvlari"""
    async with rls_conn(uid) as c:
        rows = await c.fetch("""
            SELECT jurnal_id, tur, sana, tavsif, jami_debit, jami_credit
            FROM jurnal_yozuvlar
            WHERE user_id = $1
            ORDER BY sana DESC LIMIT $2
        """, uid, min(limit, 200))
    return [dict(r) for r in rows]


@app.get("/api/v1/ledger/jurnal/{jurnal_id}", tags=["Ledger"])
async def ledger_jurnal_detail(jurnal_id: str, uid: int = Depends(get_uid)):
    """Bitta jurnal yozuvi batafsil (qatorlar bilan)"""
    async with rls_conn(uid) as c:
        header = await c.fetchrow("""
            SELECT id, jurnal_id, user_id, tur, sana, tavsif, jami_debit, jami_credit, manba_id, manba_jadval, idempotency_key, yaratilgan FROM jurnal_yozuvlar
            WHERE user_id = $1 AND jurnal_id = $2
        """, uid, jurnal_id)
        if not header:
            raise HTTPException(404, "Jurnal topilmadi")
        qatorlar = await c.fetch("""
            SELECT hisob, debit, credit, tavsif
            FROM jurnal_qatorlar WHERE jurnal_id = $1
        """, header["id"])
    return {"header": dict(header), "qatorlar": [dict(q) for q in qatorlar]}


@app.get("/api/v1/ledger/hisob/{hisob}", tags=["Ledger"])
async def ledger_hisob(hisob: str, uid: int = Depends(get_uid)):
    """Bitta hisob balansi va tarixi"""
    from shared.services.ledger import hisob_balans, HisobTuri
    try:
        h = HisobTuri(hisob)
    except ValueError:
        raise HTTPException(400, f"Noma'lum hisob: {hisob}")
    async with rls_conn(uid) as c:
        balans = await hisob_balans(c, uid, h)
        tarix = await c.fetch("""
            SELECT jy.jurnal_id, jy.sana, jy.tavsif, jq.debit, jq.credit
            FROM jurnal_qatorlar jq
            JOIN jurnal_yozuvlar jy ON jq.jurnal_id = jy.id
            WHERE jy.user_id = $1 AND jq.hisob = $2
            ORDER BY jy.sana DESC LIMIT 50
        """, uid, hisob)
    return {"hisob": hisob, "balans": float(balans), "tarix": [dict(r) for r in tarix]}


# ═══════════════════════════════════════════════════════════
#  SHOGIRD XARAJAT API (Web Dashboard uchun)
# ═══════════════════════════════════════════════════════════

@app.get("/api/v1/shogirdlar", tags=["Xarajatlar"])
async def api_shogirdlar(uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import shogirdlar_royxati
    async with rls_conn(uid) as c:
        return [dict(s) for s in await shogirdlar_royxati(c, uid)]

@app.get("/api/v1/shogird/dashboard", tags=["Xarajatlar"])
async def api_shogird_dashboard(uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import dashboard_data
    async with rls_conn(uid) as c:
        return await dashboard_data(c, uid)

@app.get("/api/v1/xarajatlar/bugungi", tags=["Xarajatlar"])
async def api_xarajatlar_bugungi(uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import kunlik_hisobot
    async with rls_conn(uid) as c:
        return await kunlik_hisobot(c, uid)

@app.get("/api/v1/xarajatlar/oylik", tags=["Xarajatlar"])
async def api_xarajatlar_oylik(uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import oylik_hisobot
    async with rls_conn(uid) as c:
        return await oylik_hisobot(c, uid)

@app.get("/api/v1/xarajatlar/kutilmoqda", tags=["Xarajatlar"])
async def api_kutilmoqda(uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import kutilmoqda_royxati
    async with rls_conn(uid) as c:
        return [dict(k) for k in await kutilmoqda_royxati(c, uid)]

@app.get("/api/v1/shogird/{shogird_id}/hisobot", tags=["Xarajatlar"])
async def api_shogird_hisobot(shogird_id: int, kunlar: int = 7, uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import shogird_hisobot
    async with rls_conn(uid) as c:
        return await shogird_hisobot(c, uid, shogird_id, kunlar)

@app.post("/api/v1/xarajat/{xarajat_id}/tasdiqlash", tags=["Xarajatlar"])
async def api_xarajat_tasdiq(xarajat_id: int, uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import xarajat_tasdiqlash
    async with rls_conn(uid) as c:
        ok = await xarajat_tasdiqlash(c, xarajat_id, uid)
    return {"ok": ok}

@app.post("/api/v1/xarajat/{xarajat_id}/bekor", tags=["Xarajatlar"])
async def api_xarajat_bekor(xarajat_id: int, uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import xarajat_bekor
    async with rls_conn(uid) as c:
        ok = await xarajat_bekor(c, xarajat_id, uid)
    return {"ok": ok}


# ═══════════════════════════════════════════════════════════
#  NARX GURUH API (Web Dashboard uchun)
# ═══════════════════════════════════════════════════════════

@app.get("/api/v1/narx/guruhlar", tags=["Narx"])
async def api_narx_guruhlar(uid: int = Depends(get_uid)):
    from shared.services.smart_narx import guruhlar_royxati
    async with rls_conn(uid) as c:
        return [dict(g) for g in await guruhlar_royxati(c, uid)]

@app.post("/api/v1/narx/guruh", tags=["Narx"])
async def api_narx_guruh_yarat(data: dict, uid: int = Depends(get_uid)):
    from shared.services.smart_narx import guruh_yaratish
    nomi = data.get("nomi", "")
    if not nomi: raise HTTPException(400, "Guruh nomi kerak")
    async with rls_conn(uid) as c:
        gid = await guruh_yaratish(c, uid, nomi, data.get("izoh", ""))
    return {"id": gid, "nomi": nomi}

@app.post("/api/v1/narx/qoyish", tags=["Narx"])
async def api_narx_qoy(data: dict, uid: int = Depends(get_uid)):
    from shared.services.smart_narx import guruh_narx_qoyish, shaxsiy_narx_qoyish
    from decimal import Decimal
    narx = Decimal(str(data.get("narx", 0)))
    if narx <= 0: raise HTTPException(400, "Narx musbat bo'lishi kerak")
    async with rls_conn(uid) as c:
        if data.get("guruh_id"):
            await guruh_narx_qoyish(c, uid, int(data["guruh_id"]), int(data["tovar_id"]), narx)
        elif data.get("klient_id"):
            await shaxsiy_narx_qoyish(c, uid, int(data["klient_id"]), int(data["tovar_id"]), narx)
    return {"ok": True}

@app.post("/api/v1/narx/klient_guruh", tags=["Narx"])
async def api_klient_guruhga(data: dict, uid: int = Depends(get_uid)):
    from shared.services.smart_narx import klient_guruhga_qoyish
    async with rls_conn(uid) as c:
        await klient_guruhga_qoyish(c, uid, int(data["klient_id"]), int(data["guruh_id"]))
    return {"ok": True}


# ════════════════════════════════════════════════════════════════
#  TOVAR CRUD — Web panel uchun to'liq CRUD
# ════════════════════════════════════════════════════════════════


class TovarYaratSorov(BaseModel):
    nomi:             str   = Field(..., min_length=1, max_length=200)
    kategoriya:       str   = Field("Boshqa")
    birlik:           str   = Field("dona")
    olish_narxi:      float = Field(0, ge=0)
    sotish_narxi:     float = Field(0, ge=0)
    min_sotish_narxi: float = Field(0, ge=0)
    qoldiq:           float = Field(0, ge=0)
    min_qoldiq:       float = Field(0, ge=0)


class TovarYangilaSorov(BaseModel):
    nomi:             Optional[str]   = None
    kategoriya:       Optional[str]   = None
    birlik:           Optional[str]   = None
    olish_narxi:      Optional[float] = None
    sotish_narxi:     Optional[float] = None
    min_sotish_narxi: Optional[float] = None
    qoldiq:           Optional[float] = None
    min_qoldiq:       Optional[float] = None


class QoldiqYangilaSorov(BaseModel):
    qoldiq: float = Field(..., ge=0)


@app.post("/api/v1/tovar", tags=["Tovarlar"])
async def tovar_yarat(data: TovarYaratSorov, uid: int = Depends(get_uid)):
    """Yangi tovar yaratish"""
    from shared.cache.redis_cache import user_cache_tozala
    async with rls_conn(uid) as c:
        tovar = await c.fetchrow("""
            INSERT INTO tovarlar
                (user_id, nomi, kategoriya, birlik,
                 olish_narxi, sotish_narxi, min_sotish_narxi, qoldiq, min_qoldiq)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            ON CONFLICT (user_id, lower(nomi)) DO UPDATE SET
                kategoriya       = EXCLUDED.kategoriya,
                birlik           = EXCLUDED.birlik,
                olish_narxi      = EXCLUDED.olish_narxi,
                sotish_narxi     = EXCLUDED.sotish_narxi,
                min_sotish_narxi = EXCLUDED.min_sotish_narxi
            RETURNING id, nomi
        """, uid, data.nomi.strip(), data.kategoriya, data.birlik,
            data.olish_narxi, data.sotish_narxi, data.min_sotish_narxi,
            data.qoldiq, data.min_qoldiq)
    await user_cache_tozala(uid)
    log.info("📦 Tovar yaratildi: %s (uid=%d)", data.nomi, uid)
    return {"id": tovar["id"], "nomi": tovar["nomi"], "status": "yaratildi"}


@app.put("/api/v1/tovar/{tovar_id}", tags=["Tovarlar"])
async def tovar_yangilash(tovar_id: int, data: TovarYangilaSorov, uid: int = Depends(get_uid)):
    """Tovar ma'lumotlarini yangilash"""
    from shared.cache.redis_cache import user_cache_tozala
    # Faqat berilgan maydonlarni yangilash
    yangilar = {k: v for k, v in data.model_dump().items() if v is not None}
    if not yangilar:
        raise HTTPException(400, "Yangilash uchun kamida 1 ta maydon kerak")

    # Xavfsiz maydonlar ro'yxati (SQL injection himoyasi)
    _RUXSAT = {"nomi", "kategoriya", "birlik", "olish_narxi", "sotish_narxi",
               "min_sotish_narxi", "qoldiq", "min_qoldiq"}
    noma = set(yangilar.keys()) - _RUXSAT
    if noma:
        raise HTTPException(400, f"Ruxsat etilmagan maydon: {noma}")

    set_q = ", ".join(f"{k} = ${i+3}" for i, k in enumerate(yangilar.keys()))
    vals = list(yangilar.values())

    async with rls_conn(uid) as c:
        result = await c.execute(
            f"UPDATE tovarlar SET {set_q} WHERE id=$1 AND user_id=$2",
            tovar_id, uid, *vals
        )
    if "UPDATE 0" in result:
        raise HTTPException(404, "Tovar topilmadi")
    await user_cache_tozala(uid)
    log.info("📦 Tovar yangilandi: id=%d (uid=%d)", tovar_id, uid)
    return {"id": tovar_id, "status": "yangilandi"}


@app.delete("/api/v1/tovar/{tovar_id}", tags=["Tovarlar"])
async def tovar_ochirish(tovar_id: int, uid: int = Depends(get_uid)):
    """Tovarni o'chirish (agar sotuvda ishlatilmagan bo'lsa)"""
    from shared.cache.redis_cache import user_cache_tozala
    async with rls_conn(uid) as c:
        # Sotuvda ishlatilganmi tekshirish
        sotuv_bor = await c.fetchval(
            "SELECT EXISTS(SELECT 1 FROM chiqimlar WHERE tovar_id=$1)", tovar_id
        )
        if sotuv_bor:
            raise HTTPException(
                409,
                "Bu tovar sotuvlarda ishlatilgan — o'chirib bo'lmaydi. "
                "Qoldiqni 0 ga o'zgartiring."
            )
        result = await c.execute(
            "DELETE FROM tovarlar WHERE id=$1 AND user_id=$2", tovar_id, uid
        )
    if "DELETE 0" in result:
        raise HTTPException(404, "Tovar topilmadi")
    await user_cache_tozala(uid)
    log.info("🗑️ Tovar o'chirildi: id=%d (uid=%d)", tovar_id, uid)
    return {"id": tovar_id, "status": "ochirildi"}


@app.post("/api/v1/tovar/{tovar_id}/qoldiq", tags=["Tovarlar"])
async def tovar_qoldiq_yangilash(tovar_id: int, data: QoldiqYangilaSorov,
                                  uid: int = Depends(get_uid)):
    """Inventarizatsiya — tovar qoldiqini yangilash"""
    from shared.cache.redis_cache import user_cache_tozala
    async with rls_conn(uid) as c:
        old = await c.fetchrow(
            "SELECT nomi, qoldiq FROM tovarlar WHERE id=$1 AND user_id=$2 FOR UPDATE",
            tovar_id, uid
        )
        if not old:
            raise HTTPException(404, "Tovar topilmadi")
        await c.execute(
            "UPDATE tovarlar SET qoldiq=$2 WHERE id=$1 AND user_id=$3", tovar_id, data.qoldiq, uid
        )
    await user_cache_tozala(uid)
    log.info("📋 Qoldiq yangilandi: %s %s→%s (uid=%d)",
             old["nomi"], old["qoldiq"], data.qoldiq, uid)
    return {
        "id": tovar_id,
        "nomi": old["nomi"],
        "eski_qoldiq": float(old["qoldiq"]),
        "yangi_qoldiq": data.qoldiq,
        "status": "yangilandi",
    }


# ════════════════════════════════════════════════════════════════
#  KLIENT CRUD — Web panel uchun to'liq CRUD
# ════════════════════════════════════════════════════════════════


class KlientYangilaSorov(BaseModel):
    ism:          Optional[str]   = None
    telefon:      Optional[str]   = None
    manzil:       Optional[str]   = None
    kredit_limit: Optional[float] = None
    eslatma:      Optional[str]   = None


@app.put("/api/v1/klient/{klient_id}", tags=["Klientlar"])
async def klient_yangilash(klient_id: int, data: KlientYangilaSorov,
                            uid: int = Depends(get_uid)):
    """Klient ma'lumotlarini yangilash"""
    from shared.cache.redis_cache import user_cache_tozala
    yangilar = {k: v for k, v in data.model_dump().items() if v is not None}
    if not yangilar:
        raise HTTPException(400, "Yangilash uchun kamida 1 ta maydon kerak")

    _RUXSAT = {"ism", "telefon", "manzil", "kredit_limit", "eslatma"}
    noma = set(yangilar.keys()) - _RUXSAT
    if noma:
        raise HTTPException(400, f"Ruxsat etilmagan maydon: {noma}")

    set_q = ", ".join(f"{k} = ${i+3}" for i, k in enumerate(yangilar.keys()))
    vals = list(yangilar.values())

    async with rls_conn(uid) as c:
        result = await c.execute(
            f"UPDATE klientlar SET {set_q} WHERE id=$1 AND user_id=$2",
            klient_id, uid, *vals
        )
    if "UPDATE 0" in result:
        raise HTTPException(404, "Klient topilmadi")
    await user_cache_tozala(uid)
    log.info("👤 Klient yangilandi: id=%d (uid=%d)", klient_id, uid)
    return {"id": klient_id, "status": "yangilandi"}


@app.delete("/api/v1/klient/{klient_id}", tags=["Klientlar"])
async def klient_ochirish(klient_id: int, uid: int = Depends(get_uid)):
    """Klientni o'chirish (agar faol qarz yoki sotuv bo'lmasa)"""
    from shared.cache.redis_cache import user_cache_tozala
    async with rls_conn(uid) as c:
        # Faol qarz bormi
        qarz_bor = await c.fetchval(
            "SELECT EXISTS(SELECT 1 FROM qarzlar WHERE klient_id=$1 AND yopildi=FALSE AND qolgan>0)",
            klient_id
        )
        if qarz_bor:
            raise HTTPException(409, "Bu klientda faol qarz bor — o'chirib bo'lmaydi")
        result = await c.execute(
            "DELETE FROM klientlar WHERE id=$1 AND user_id=$2", klient_id, uid
        )
    if "DELETE 0" in result:
        raise HTTPException(404, "Klient topilmadi")
    await user_cache_tozala(uid)
    log.info("🗑️ Klient o'chirildi: id=%d (uid=%d)", klient_id, uid)
    return {"id": klient_id, "status": "ochirildi"}


# ════════════════════════════════════════════════════════════════
#  XARAJAT QO'SHISH — Admin o'zi web dan xarajat kiritishi
# ════════════════════════════════════════════════════════════════


class XarajatSorov(BaseModel):
    kategoriya_nomi: str   = Field(..., min_length=1)
    summa:           float = Field(..., gt=0)
    izoh:            str   = Field("")
    shogird_id:      Optional[int] = None


@app.post("/api/v1/xarajat", tags=["Xarajatlar"])
async def api_xarajat_qoshish(data: XarajatSorov, uid: int = Depends(get_uid)):
    """Admin web paneldan xarajat qo'shish"""
    async with rls_conn(uid) as c:
        if data.shogird_id:
            # Shogird xarajati
            from shared.services.shogird_xarajat import xarajat_saqlash
            natija = await xarajat_saqlash(
                c, uid, data.shogird_id,
                data.kategoriya_nomi, data.summa, data.izoh
            )
        else:
            # Admin o'zi xarajat — shogirdsiz
            from shared.services.shogird_xarajat import _default_kategoriyalar
            await _default_kategoriyalar(c, uid)

            # Adminning o'zi uchun shogird yaratish (agar yo'q bo'lsa)
            admin_shogird = await c.fetchrow(
                "SELECT id FROM shogirdlar WHERE admin_uid=$1 AND telegram_uid=$1",
                uid
            )
            if not admin_shogird:
                admin_shogird = await c.fetchrow("""
                    INSERT INTO shogirdlar (admin_uid, telegram_uid, ism, lavozim)
                    VALUES ($1, $1, 'Admin', 'admin')
                    ON CONFLICT (admin_uid, telegram_uid) DO UPDATE SET faol=TRUE
                    RETURNING id
                """, uid)

            from shared.services.shogird_xarajat import xarajat_saqlash
            natija = await xarajat_saqlash(
                c, uid, admin_shogird["id"],
                data.kategoriya_nomi, data.summa, data.izoh
            )
            # Admin xarajatini avtomatik tasdiqlash
            if natija.get("id"):
                await c.execute(
                    "UPDATE xarajatlar SET tasdiqlangan=TRUE, tasdiq_vaqti=NOW() WHERE id=$1",
                    natija["id"]
                )
    log.info("💸 Xarajat qo'shildi: %s %s (uid=%d)", data.kategoriya_nomi, data.summa, uid)
    return {"status": "saqlandi", **natija}


# ════════════════════════════════════════════════════════════════
#  BILDIRISHNOMALAR — Web panel notification tizimi
# ════════════════════════════════════════════════════════════════


@app.get("/api/v1/bildirishnomalar", tags=["Bildirishnoma"])
async def bildirishnomalar(uid: int = Depends(get_uid)):
    """
    Web panel uchun bildirishnomalar:
    - Muddati o'tgan qarzlar
    - Kam qoldiqli tovarlar
    - Tasdiq kutayotgan xarajatlar
    """
    natija = {"items": [], "jami": 0}

    async with rls_conn(uid) as c:
        # 1. Muddati o'tgan qarzlar
        muddat_otgan = await c.fetch("""
            SELECT klient_ismi, COUNT(*) as soni,
                   SUM(qolgan) as jami_qarz
            FROM qarzlar
            WHERE yopildi=FALSE AND qolgan>0
              AND muddat IS NOT NULL AND muddat < NOW()
            GROUP BY klient_ismi
            ORDER BY jami_qarz DESC LIMIT 10
        """)
        for r in muddat_otgan:
            natija["items"].append({
                "tur": "qarz_muddati",
                "darajasi": "xavfli",
                "matn": f"{r['klient_ismi']}: {r['soni']} ta qarz muddati o'tgan ({float(r['jami_qarz']):,.0f} so'm)",
                "klient": r["klient_ismi"],
                "summa": float(r["jami_qarz"]),
            })

        # 2. Kam qoldiqli tovarlar
        kam_qoldiq = await c.fetch("""
            SELECT nomi, qoldiq, min_qoldiq FROM tovarlar
            WHERE min_qoldiq > 0 AND qoldiq <= min_qoldiq
            ORDER BY (qoldiq / NULLIF(min_qoldiq, 0)) ASC
            LIMIT 10
        """)
        for r in kam_qoldiq:
            natija["items"].append({
                "tur": "kam_qoldiq",
                "darajasi": "ogohlantirish",
                "matn": f"{r['nomi']}: qoldiq {float(r['qoldiq'])}, minimum {float(r['min_qoldiq'])}",
                "tovar": r["nomi"],
                "qoldiq": float(r["qoldiq"]),
            })

        # 3. Tasdiq kutayotgan xarajatlar
        kutilmoqda = await c.fetchval("""
            SELECT COUNT(*) FROM xarajatlar
            WHERE admin_uid=$1 AND NOT tasdiqlangan AND NOT bekor_qilingan
        """, uid)
        if kutilmoqda and kutilmoqda > 0:
            natija["items"].append({
                "tur": "xarajat_tasdiq",
                "darajasi": "info",
                "matn": f"{kutilmoqda} ta xarajat tasdiqlashni kutmoqda",
                "soni": kutilmoqda,
            })

    natija["jami"] = len(natija["items"])
    return natija


# ════════════════════════════════════════════════════════════════
#  TOVAR EXCEL EXPORT — Web panel uchun
# ════════════════════════════════════════════════════════════════


@app.get("/api/v1/tovar/export/excel", tags=["Tovarlar"])
async def tovar_excel_export(uid: int = Depends(get_uid)):
    """Tovarlar ro'yxatini Excel faylga export qilish"""
    import io
    import base64
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

    async with rls_conn(uid) as c:
        rows = await c.fetch("""
            SELECT nomi, kategoriya, birlik,
                   olish_narxi, sotish_narxi, qoldiq, min_qoldiq
            FROM tovarlar WHERE user_id=$1 ORDER BY kategoriya, nomi
        """, uid)

    wb = Workbook()
    ws = wb.active
    ws.title = "Tovarlar"

    # Sarlavha stili
    header_font = Font(name="Arial", bold=True, size=11, color="FFFFFF")
    header_fill = PatternFill(start_color="2E75B6", end_color="2E75B6", fill_type="solid")
    header_align = Alignment(horizontal="center", vertical="center")
    thin_border = Border(
        left=Side(style="thin"), right=Side(style="thin"),
        top=Side(style="thin"), bottom=Side(style="thin")
    )

    # Ustun kengliklari
    headers = ["Tovar nomi", "Kategoriya", "Birlik", "Olish narxi", "Sotish narxi", "Qoldiq", "Min qoldiq"]
    widths = [30, 18, 10, 15, 15, 12, 12]
    for i, (h, w) in enumerate(zip(headers, widths), 1):
        cell = ws.cell(row=1, column=i, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = thin_border
        ws.column_dimensions[chr(64 + i)].width = w

    # Ma'lumotlar
    num_fmt = '#,##0'
    for r_idx, row in enumerate(rows, 2):
        d = dict(row)
        ws.cell(row=r_idx, column=1, value=d["nomi"]).border = thin_border
        ws.cell(row=r_idx, column=2, value=d["kategoriya"]).border = thin_border
        ws.cell(row=r_idx, column=3, value=d["birlik"]).border = thin_border
        c4 = ws.cell(row=r_idx, column=4, value=float(d["olish_narxi"]))
        c4.number_format = num_fmt
        c4.border = thin_border
        c5 = ws.cell(row=r_idx, column=5, value=float(d["sotish_narxi"]))
        c5.number_format = num_fmt
        c5.border = thin_border
        c6 = ws.cell(row=r_idx, column=6, value=float(d["qoldiq"]))
        c6.number_format = '#,##0.###'
        c6.border = thin_border
        c7 = ws.cell(row=r_idx, column=7, value=float(d["min_qoldiq"]))
        c7.number_format = '#,##0.###'
        c7.border = thin_border

        # Kam qoldiq — qizil rang
        if d["min_qoldiq"] > 0 and d["qoldiq"] <= d["min_qoldiq"]:
            red_fill = PatternFill(start_color="FFE0E0", end_color="FFE0E0", fill_type="solid")
            for col in range(1, 8):
                ws.cell(row=r_idx, column=col).fill = red_fill

    # Avtomatik filtr
    ws.auto_filter.ref = f"A1:G{len(rows) + 1}"

    # Oxirgi qator — jami
    last = len(rows) + 2
    ws.cell(row=last, column=1, value="JAMI:").font = Font(bold=True)
    ws.cell(row=last, column=6, value=f"=SUM(F2:F{len(rows)+1})").font = Font(bold=True)
    ws.cell(row=last, column=6).number_format = '#,##0.###'

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    log.info("📊 Tovar Excel export: %d ta tovar (uid=%d)", len(rows), uid)
    return {
        "filename": "tovarlar.xlsx",
        "content_base64": base64.b64encode(buf.getvalue()).decode(),
        "tovar_soni": len(rows),
    }


# ════════════════════════════════════════════════════════════════
#  SAVDOLAR — Sotuv sessiyalari ro'yxati (Web panel uchun)
# ════════════════════════════════════════════════════════════════


@app.get("/api/v1/savdolar", tags=["Sotuv"])
async def savdolar_royxati(
    limit: int = 20, offset: int = 0,
    klient: Optional[str] = None,
    sana_dan: Optional[str] = None,
    sana_gacha: Optional[str] = None,
    uid: int = Depends(get_uid),
):
    """
    Sotuv sessiyalari ro'yxati — sanalar va klient bo'yicha filtr.
    Web panel /invoices sahifasi uchun.
    """
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        # Filtr shartlari
        where_parts = []
        params: list = [limit, offset]
        idx = 3

        if klient:
            where_parts.append(f"lower(ss.klient_ismi) LIKE lower(${idx})")
            params.append(f"%{like_escape(klient)}%")
            idx += 1

        if sana_dan:
            where_parts.append(f"ss.sana >= ${idx}::timestamptz")
            params.append(sana_dan)
            idx += 1

        if sana_gacha:
            where_parts.append(f"ss.sana < ${idx}::timestamptz + interval '1 day'")
            params.append(sana_gacha)
            idx += 1

        where_sql = (" AND " + " AND ".join(where_parts)) if where_parts else ""

        rows = await c.fetch(f"""
            SELECT ss.id, ss.klient_ismi, ss.jami, ss.tolangan, ss.qarz,
                   ss.izoh, ss.sana,
                   COUNT(ch.id) AS tovar_soni
            FROM sotuv_sessiyalar ss
            LEFT JOIN chiqimlar ch ON ch.sessiya_id = ss.id
            WHERE 1=1 {where_sql}
            GROUP BY ss.id
            ORDER BY ss.sana DESC
            LIMIT $1 OFFSET $2
        """, *params)

        # Jami (filtr bilan)
        total = await c.fetchval(f"""
            SELECT COUNT(*) FROM sotuv_sessiyalar ss WHERE 1=1 {where_sql}
        """, *params[2:])

        # Umumiy statistika (bugungi)
        stats = await c.fetchrow("""
            SELECT
                COALESCE(SUM(jami), 0)     AS jami_tushum,
                COALESCE(SUM(tolangan), 0) AS tolangan,
                COALESCE(SUM(qarz), 0)     AS qarz,
                COUNT(*)                   AS soni
            FROM sotuv_sessiyalar
            WHERE (sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
        """)

    return {
        "total": total or 0,
        "items": [dict(r) for r in rows],
        "stats": {
            "bugun_tushum": float(stats["jami_tushum"]),
            "bugun_tolangan": float(stats["tolangan"]),
            "bugun_qarz": float(stats["qarz"]),
            "bugun_soni": int(stats["soni"]),
        },
    }


@app.get("/api/v1/savdo/{sessiya_id}", tags=["Sotuv"])
async def savdo_tafsilot(sessiya_id: int, uid: int = Depends(get_uid)):
    """Bitta sotuv sessiyasi tafsiloti — tovarlar bilan"""
    async with rls_conn(uid) as c:
        sess = await c.fetchrow(
            "SELECT id, klient_ismi, jami, tolangan, qarz, izoh, sana FROM sotuv_sessiyalar WHERE id=$1 AND user_id=$2",
            sessiya_id, uid
        )
        if not sess:
            raise HTTPException(404, "Sotuv topilmadi")
        tovarlar = await c.fetch("""
            SELECT tovar_nomi, kategoriya, miqdor, birlik,
                   sotish_narxi, olish_narxi, chegirma_foiz, jami
            FROM chiqimlar WHERE sessiya_id=$1 AND user_id=$2 ORDER BY id
        """, sessiya_id, uid)
    return {**dict(sess), "tovarlar": [dict(r) for r in tovarlar]}


# ════════════════════════════════════════════════════════════════
#  DASHBOARD TOP — Grafiklar uchun top tovar va top klient
# ════════════════════════════════════════════════════════════════


@app.get("/api/v1/dashboard/top", tags=["Dashboard"])
async def dashboard_top(kunlar: int = 30, uid: int = Depends(get_uid)):
    """Dashboard uchun top 5 tovar va top 5 klient (oxirgi N kun)"""
    from shared.cache.redis_cache import cache_ol, cache_yoz, TTL_HISOBOT
    cache_k = f"dashboard_top:{uid}:{kunlar}"
    cached = await cache_ol(cache_k)
    if cached:
        return cached

    async with rls_conn(uid) as c:
        top_tovar = await c.fetch("""
            SELECT ch.tovar_nomi AS nomi, SUM(ch.jami) AS jami, SUM(ch.miqdor) AS miqdor,
                   SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor) AS foyda
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.sana >= NOW() - make_interval(days => $1)
            GROUP BY ch.tovar_nomi
            ORDER BY jami DESC LIMIT 5
        """, kunlar)

        top_klient = await c.fetch("""
            SELECT klient_ismi AS ism, SUM(jami) AS jami, COUNT(*) AS soni,
                   SUM(qarz) AS qarz
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - make_interval(days => $1) AND klient_ismi IS NOT NULL
            GROUP BY klient_ismi
            ORDER BY jami DESC LIMIT 5
        """, kunlar)

        # Kunlik trend (oxirgi 7 kun)
        kunlik = await c.fetch("""
            SELECT (sana AT TIME ZONE 'Asia/Tashkent')::date AS kun,
                   COALESCE(SUM(jami), 0) AS sotuv,
                   COALESCE(SUM(qarz), 0) AS qarz
            FROM sotuv_sessiyalar
            WHERE sana >= NOW() - interval '7 days'
            GROUP BY kun ORDER BY kun
        """)

    result = {
        "top_tovar": [
            {"nomi": r["nomi"], "jami": float(r["jami"]), "miqdor": float(r["miqdor"]),
             "foyda": float(r["foyda"] or 0)}
            for r in top_tovar
        ],
        "top_klient": [
            {"ism": r["ism"], "jami": float(r["jami"]), "soni": int(r["soni"]),
             "qarz": float(r["qarz"] or 0)}
            for r in top_klient
        ],
        "kunlik_trend": [
            {"kun": str(r["kun"]), "sotuv": float(r["sotuv"]), "qarz": float(r["qarz"])}
            for r in kunlik
        ],
    }
    await cache_yoz(cache_k, result, TTL_HISOBOT)
    return result


# ════════════════════════════════════════════════════════════════
#  TOVAR EXCEL IMPORT — Web dan tovar yuklash
# ════════════════════════════════════════════════════════════════


class TovarImportItem(BaseModel):
    nomi:         str
    kategoriya:   str   = "Boshqa"
    birlik:       str   = "dona"
    olish_narxi:  float = 0
    sotish_narxi: float = 0
    qoldiq:       float = 0


class TovarImportSorov(BaseModel):
    tovarlar: List[TovarImportItem]


@app.post("/api/v1/tovar/import", tags=["Tovarlar"])
async def tovar_import(data: TovarImportSorov, request: Request, uid: int = Depends(get_uid)):
    """
    Tovarlarni batch import qilish.
    Web paneldan Excel o'qib, JSON sifatida yuboriladi.
    ON CONFLICT → mavjud tovarni yangilaydi.
    Rate limit: 5/daqiqa.
    """
    from services.api.deps import endpoint_rate_check
    await endpoint_rate_check(request, "import")
    from shared.cache.redis_cache import user_cache_tozala
    if not data.tovarlar:
        raise HTTPException(400, "Tovarlar ro'yxati bo'sh")
    if len(data.tovarlar) > 1000:
        raise HTTPException(400, "Maksimal 1000 ta tovar import qilish mumkin")

    yaratildi = 0
    yangilandi = 0
    xatolar = []

    async with rls_conn(uid) as c:
        for i, t in enumerate(data.tovarlar):
            nomi = t.nomi.strip()
            if not nomi:
                xatolar.append(f"#{i+1}: nom bo'sh")
                continue
            try:
                result = await c.fetchrow("""
                    INSERT INTO tovarlar
                        (user_id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi, qoldiq)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (user_id, lower(nomi)) DO UPDATE SET
                        kategoriya  = EXCLUDED.kategoriya,
                        birlik      = EXCLUDED.birlik,
                        olish_narxi = CASE WHEN EXCLUDED.olish_narxi > 0 THEN EXCLUDED.olish_narxi
                                           ELSE tovarlar.olish_narxi END,
                        sotish_narxi = CASE WHEN EXCLUDED.sotish_narxi > 0 THEN EXCLUDED.sotish_narxi
                                            ELSE tovarlar.sotish_narxi END
                    RETURNING (xmax = 0) AS yangi
                """, uid, nomi, t.kategoriya, t.birlik,
                    t.olish_narxi, t.sotish_narxi, t.qoldiq)

                if result and result["yangi"]:
                    yaratildi += 1
                else:
                    yangilandi += 1
            except Exception as e:
                xatolar.append(f"#{i+1} {nomi}: {str(e)[:50]}")

    await user_cache_tozala(uid)
    log.info("📥 Tovar import: %d yaratildi, %d yangilandi, %d xato (uid=%d)",
             yaratildi, yangilandi, len(xatolar), uid)
    return {
        "yaratildi": yaratildi,
        "yangilandi": yangilandi,
        "xatolar": xatolar[:20],
        "jami": yaratildi + yangilandi,
    }


# ════════════════════════════════════════════════════════════════
#  STATISTIKA — Admin panel uchun tizim statistikasi
# ════════════════════════════════════════════════════════════════


@app.get("/api/v1/statistika", tags=["Dashboard"])
async def admin_statistika(uid: int = Depends(get_uid)):
    """Tizim statistikasi — admin uchun umumiy ko'rsatkichlar"""
    async with rls_conn(uid) as c:
        tovar_soni = await c.fetchval("SELECT COUNT(*) FROM tovarlar WHERE user_id=$1", uid) or 0
        klient_soni = await c.fetchval("SELECT COUNT(*) FROM klientlar WHERE user_id=$1", uid) or 0
        faol_qarz = await c.fetchval(
            "SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar WHERE user_id=$1 AND yopildi=FALSE AND qolgan>0", uid
        ) or 0
        bugun_sotuv = await c.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND (sana AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE
        """, uid)
        hafta_sotuv = await c.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana >= NOW() - interval '7 days'
        """, uid)
        oy_sotuv = await c.fetchrow("""
            SELECT COUNT(*) AS soni, COALESCE(SUM(jami), 0) AS jami
            FROM sotuv_sessiyalar
            WHERE user_id=$1 AND sana >= NOW() - interval '30 days'
        """, uid)
        kam_qoldiq = await c.fetchval(
            "SELECT COUNT(*) FROM tovarlar WHERE user_id=$1 AND min_qoldiq > 0 AND qoldiq <= min_qoldiq", uid
        ) or 0
        muddat_otgan = await c.fetchval(
            "SELECT COUNT(*) FROM qarzlar WHERE user_id=$1 AND yopildi=FALSE AND qolgan>0 AND muddat IS NOT NULL AND muddat < NOW()", uid
        ) or 0

    return {
        "tovar_soni": tovar_soni,
        "klient_soni": klient_soni,
        "faol_qarz": float(faol_qarz),
        "kam_qoldiq_soni": kam_qoldiq,
        "muddat_otgan_qarz": muddat_otgan,
        "bugun": {"soni": int(bugun_sotuv["soni"]), "jami": float(bugun_sotuv["jami"])},
        "hafta": {"soni": int(hafta_sotuv["soni"]), "jami": float(hafta_sotuv["jami"])},
        "oy":    {"soni": int(oy_sotuv["soni"]),    "jami": float(oy_sotuv["jami"])},
    }


# ════════════════════════════════════════════════════════════════
#  FOYDA TAHLILI — maxsus endpoint
# ════════════════════════════════════════════════════════════════


@app.get("/api/v1/hisobot/foyda", tags=["Hisobotlar"])
async def hisobot_foyda(
    kunlar: int = 30,
    uid: int = Depends(get_uid),
):
    """
    Foyda tahlili — sof foyda, xarajatlar, top foyda/zarar tovarlar.
    """
    async with rls_conn(uid) as c:
        # Sof foyda
        foyda = await c.fetchrow("""
            SELECT
                COALESCE(SUM(ch.jami), 0) AS brutto,
                COALESCE(SUM(ch.miqdor * ch.olish_narxi), 0) AS tannarx,
                COALESCE(SUM(ch.jami - ch.miqdor * ch.olish_narxi), 0) AS sof_foyda
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.sana >= NOW() - make_interval(days => $1)
        """, kunlar)

        # Xarajatlar
        xarajat = await c.fetchval("""
            SELECT COALESCE(SUM(summa), 0)
            FROM xarajatlar
            WHERE admin_uid=$1 AND tasdiqlangan=TRUE
              AND vaqt >= NOW() - make_interval(days => $2)
        """, uid, kunlar)

        # Top foyda tovarlar
        top_foyda = await c.fetch("""
            SELECT ch.tovar_nomi,
                   SUM(ch.jami - ch.miqdor * ch.olish_narxi) AS foyda,
                   SUM(ch.miqdor) AS miqdor
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.sana >= NOW() - make_interval(days => $1)
              AND ch.olish_narxi > 0
            GROUP BY ch.tovar_nomi
            ORDER BY foyda DESC LIMIT 5
        """, kunlar)

        # Top zarar tovarlar
        top_zarar = await c.fetch("""
            SELECT ch.tovar_nomi,
                   SUM(ch.jami - ch.miqdor * ch.olish_narxi) AS foyda,
                   SUM(ch.miqdor) AS miqdor
            FROM chiqimlar ch
            JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ss.sana >= NOW() - make_interval(days => $1)
              AND ch.olish_narxi > 0
            GROUP BY ch.tovar_nomi
            HAVING SUM(ch.jami - ch.miqdor * ch.olish_narxi) < 0
            ORDER BY foyda ASC LIMIT 5
        """, kunlar)

    sof = float(foyda["sof_foyda"] or 0)
    xar = float(xarajat or 0)
    return {
        "kunlar": kunlar,
        "brutto_sotuv": float(foyda["brutto"] or 0),
        "tannarx": float(foyda["tannarx"] or 0),
        "sof_foyda": sof,
        "xarajatlar": xar,
        "toza_foyda": sof - xar,
        "margin_foiz": round(sof / float(foyda["brutto"]) * 100, 1) if float(foyda["brutto"]) > 0 else 0,
        "top_foyda": [{"nomi": r["tovar_nomi"], "foyda": float(r["foyda"]), "miqdor": float(r["miqdor"])} for r in top_foyda],
        "top_zarar": [{"nomi": r["tovar_nomi"], "zarar": abs(float(r["foyda"])), "miqdor": float(r["miqdor"])} for r in top_zarar],
    }


# ════════════════════════════════════════════════════════════════
#  QR-KOD — chek uchun QR kod generatsiya
# ════════════════════════════════════════════════════════════════


@app.get("/api/v1/qr/{sessiya_id}", tags=["Sotuv"])
async def qr_kod_generatsiya(sessiya_id: int, uid: int = Depends(get_uid)):
    """
    Sotuv sessiyasi uchun QR-kod SVG generatsiya.
    QR ichida chek URL bo'ladi — klient telefonida skanerlasa chek ko'rinadi.
    """
    import hashlib

    async with rls_conn(uid) as c:
        sess = await c.fetchrow(
            "SELECT id, klient_ismi, jami, sana FROM sotuv_sessiyalar WHERE id=$1 AND user_id=$2",
            sessiya_id, uid
        )
    if not sess:
        raise HTTPException(404, "Sotuv topilmadi")

    # QR mazmuni — chek URL yoki sotuv ma'lumoti
    base_url = os.getenv("PRINT_LANDING_BASE_URL", "")
    if base_url:
        qr_content = f"{base_url}/p/{sessiya_id}"
    else:
        # Agar URL yo'q — sotuv ma'lumotini QR ga yozish
        qr_content = (
            f"SAVDOAI CHEK #{sessiya_id}\n"
            f"Klient: {sess['klient_ismi'] or '-'}\n"
            f"Jami: {float(sess['jami']):,.0f} so'm\n"
            f"Sana: {sess['sana']}"
        )

    # QR-kod SVG generatsiya (kutubxonasiz — oddiy matn QR)
    # Haqiqiy QR uchun qrcode kutubxonasi kerak, hozir placeholder SVG
    # Bu endpoint QR kutubxona o'rnatilganda to'liq ishlaydi
    qr_hash = hashlib.md5(qr_content.encode()).hexdigest()[:8]

    return {
        "sessiya_id": sessiya_id,
        "klient": sess["klient_ismi"],
        "jami": float(sess["jami"]),
        "qr_content": qr_content,
        "qr_hash": qr_hash,
    }


# ════════════════════════════════════════════════════════════════
#  KLIENT TARIXI — sotuv va qarz tarixi
# ════════════════════════════════════════════════════════════════


@app.get("/api/v1/klient/{klient_id}/tarix", tags=["Klientlar"])
async def klient_tarix(klient_id: int, limit: int = 20, uid: int = Depends(get_uid)):
    """Klientning sotuv va qarz tarixi"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        klient = await c.fetchrow(
            "SELECT ism, telefon, kredit_limit, jami_sotib FROM klientlar WHERE id=$1 AND user_id=$2",
            klient_id, uid
        )
        if not klient:
            raise HTTPException(404, "Klient topilmadi")

        sotuvlar = await c.fetch("""
            SELECT ss.id, ss.jami, ss.tolangan, ss.qarz, ss.sana,
                   COUNT(ch.id) AS tovar_soni
            FROM sotuv_sessiyalar ss
            LEFT JOIN chiqimlar ch ON ch.sessiya_id = ss.id
            WHERE ss.klient_ismi = $1
            GROUP BY ss.id
            ORDER BY ss.sana DESC LIMIT $2
        """, klient["ism"], limit)

        qarzlar = await c.fetch("""
            SELECT id, dastlabki_summa, tolangan, qolgan, muddat, yopildi, yaratilgan
            FROM qarzlar WHERE klient_id=$1
            ORDER BY yaratilgan DESC LIMIT $2
        """, klient_id, limit)

    return {
        "klient": dict(klient),
        "sotuvlar": [dict(r) for r in sotuvlar],
        "qarzlar": [dict(r) for r in qarzlar],
    }


# ════════════════════════════════════════════════════════════════
#  PROFIL YANGILASH — Settings sahifasi uchun
# ════════════════════════════════════════════════════════════════


class ProfilYangilaSorov(BaseModel):
    ism:        Optional[str] = None
    dokon_nomi: Optional[str] = None
    telefon:    Optional[str] = None
    manzil:     Optional[str] = None
    inn:        Optional[str] = None
    til:        Optional[str] = None


@app.put("/api/v1/me", tags=["Auth"])
async def profil_yangilash(data: ProfilYangilaSorov, uid: int = Depends(get_uid)):
    """Foydalanuvchi profilini yangilash"""
    yangilar = {k: v for k, v in data.model_dump().items() if v is not None}
    if not yangilar:
        raise HTTPException(400, "Yangilash uchun kamida 1 ta maydon kerak")

    _RUXSAT = {"ism", "dokon_nomi", "telefon", "manzil", "inn", "til"}
    noma = set(yangilar.keys()) - _RUXSAT
    if noma:
        raise HTTPException(400, f"Ruxsat etilmagan maydon: {noma}")

    set_q = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(yangilar.keys()))
    vals = list(yangilar.values())

    async with rls_conn(uid) as c:
        await c.execute(
            f"UPDATE users SET {set_q} WHERE id=$1",
            uid, *vals
        )
    from shared.cache.redis_cache import user_cache_tozala
    await user_cache_tozala(uid)
    log.info("👤 Profil yangilandi: uid=%d, maydonlar=%s", uid, list(yangilar.keys()))
    return {"status": "yangilandi", "maydonlar": list(yangilar.keys())}


@app.put("/api/v1/me/parol", tags=["Auth"])
async def parol_yangilash(data: dict, uid: int = Depends(get_uid)):
    """Foydalanuvchi parolini o'zgartirish"""
    eski = (data.get("eski_parol") or "").strip()
    yangi = (data.get("yangi_parol") or "").strip()
    if not yangi or len(yangi) < 4:
        raise HTTPException(400, "Yangi parol kamida 4 belgi bo'lishi kerak")

    async with rls_conn(uid) as c:
        user = await c.fetchrow(
            "SELECT parol_hash FROM users WHERE id=$1", uid
        )
        if not user:
            raise HTTPException(404, "Foydalanuvchi topilmadi")

        # Agar parol mavjud — eski parolni tekshirish
        if user.get("parol_hash"):
            if not _parol_tekshir(eski, user["parol_hash"]):
                raise HTTPException(401, "Eski parol noto'g'ri")

        new_hash = _parol_hash(yangi)
        await c.execute("UPDATE users SET parol_hash=$2 WHERE id=$1", uid, new_hash)

    log.info("🔐 Parol yangilandi: uid=%d", uid)
    return {"status": "yangilandi"}


# ════════════════════════════════════════════════════════════════
#  TOVAR TARIXI — sotuv, kirim, narx o'zgarish tarixi
# ════════════════════════════════════════════════════════════════


@app.get("/api/v1/tovar/{tovar_id}/tarix", tags=["Tovarlar"])
async def tovar_tarix(tovar_id: int, limit: int = 20, uid: int = Depends(get_uid)):
    """Tovarning sotuv va kirim tarixi"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        tovar = await c.fetchrow(
            "SELECT nomi, kategoriya, birlik, olish_narxi, sotish_narxi, qoldiq FROM tovarlar WHERE id=$1 AND user_id=$2",
            tovar_id, uid
        )
        if not tovar:
            raise HTTPException(404, "Tovar topilmadi")

        # Sotuvlar (chiqimlar)
        sotuvlar = await c.fetch("""
            SELECT ch.miqdor, ch.sotish_narxi, ch.jami, ch.sana,
                   ss.klient_ismi
            FROM chiqimlar ch
            LEFT JOIN sotuv_sessiyalar ss ON ss.id = ch.sessiya_id
            WHERE ch.tovar_id=$1 AND ch.user_id=$2
            ORDER BY ch.sana DESC LIMIT $3
        """, tovar_id, uid, limit)

        # Kirimlar
        kirimlar = await c.fetch("""
            SELECT miqdor, narx, jami, manba, sana
            FROM kirimlar WHERE tovar_id=$1 AND user_id=$2
            ORDER BY sana DESC LIMIT $3
        """, tovar_id, uid, limit)

        # Statistika
        stats = await c.fetchrow("""
            SELECT COUNT(*) AS sotuv_soni,
                   COALESCE(SUM(miqdor), 0) AS jami_sotilgan,
                   COALESCE(SUM(jami), 0) AS jami_tushum
            FROM chiqimlar WHERE tovar_id=$1 AND user_id=$2
        """, tovar_id, uid)

    return {
        "tovar": dict(tovar),
        "sotuvlar": [dict(r) for r in sotuvlar],
        "kirimlar": [dict(r) for r in kirimlar],
        "statistika": {
            "sotuv_soni": int(stats["sotuv_soni"]),
            "jami_sotilgan": float(stats["jami_sotilgan"]),
            "jami_tushum": float(stats["jami_tushum"]),
        },
    }


# ════════════════════════════════════════════════════════════════
#  FAKTURA (Hisob-faktura) CRUD
# ════════════════════════════════════════════════════════════════


class FakturaYaratSorov(BaseModel):
    klient_ismi: str = Field(..., min_length=1, max_length=200)
    tovarlar: list = Field(default_factory=list)
    jami_summa: float = Field(0, ge=0)
    bank_rekvizit: Optional[dict] = None
    izoh: Optional[str] = None


@app.get("/api/v1/fakturalar", tags=["Faktura"])
async def fakturalar_list(
    limit: int = 20, offset: int = 0,
    holat: Optional[str] = None,
    uid: int = Depends(get_uid),
):
    """Hisob-fakturalar ro'yxati"""
    limit = min(limit, 100)
    async with rls_conn(uid) as c:
        if holat:
            rows = await c.fetch("""
                SELECT id, raqam, klient_ismi, jami_summa, holat, yaratilgan
                FROM fakturalar
                WHERE user_id=$3 AND holat=$4
                ORDER BY yaratilgan DESC LIMIT $1 OFFSET $2
            """, limit, offset, uid, holat)
            total = await c.fetchval(
                "SELECT COUNT(*) FROM fakturalar WHERE user_id=$1 AND holat=$2", uid, holat
            )
        else:
            rows = await c.fetch("""
                SELECT id, raqam, klient_ismi, jami_summa, holat, yaratilgan
                FROM fakturalar
                WHERE user_id=$3
                ORDER BY yaratilgan DESC LIMIT $1 OFFSET $2
            """, limit, offset, uid)
            total = await c.fetchval(
                "SELECT COUNT(*) FROM fakturalar WHERE user_id=$1", uid
            )
    return {"total": total, "items": [dict(r) for r in rows]}


@app.get("/api/v1/faktura/{faktura_id}", tags=["Faktura"])
async def faktura_detail(faktura_id: int, uid: int = Depends(get_uid)):
    """Faktura batafsil"""
    async with rls_conn(uid) as c:
        f = await c.fetchrow("""
            SELECT id, raqam, klient_ismi, jami_summa, tovarlar, bank_rekvizit, holat, yaratilgan
            FROM fakturalar
            WHERE id=$1 AND user_id=$2
        """, faktura_id, uid)
        if not f:
            raise HTTPException(404, "Faktura topilmadi")
    return dict(f)


@app.post("/api/v1/faktura", tags=["Faktura"])
async def faktura_yarat(data: FakturaYaratSorov, uid: int = Depends(get_uid)):
    """Yangi hisob-faktura yaratish"""
    async with rls_conn(uid) as c:
        # Unikal raqam yaratish: F-YYYYMMDD-XXXX
        import datetime as _dt
        bugun = _dt.date.today().strftime("%Y%m%d")
        soni = await c.fetchval(
            "SELECT COUNT(*) FROM fakturalar WHERE user_id=$1 AND yaratilgan::date=CURRENT_DATE",
            uid
        )
        raqam = f"F-{bugun}-{(soni or 0) + 1:04d}"

        row = await c.fetchrow("""
            INSERT INTO fakturalar (user_id, raqam, klient_ismi, jami_summa, tovarlar, bank_rekvizit)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
            RETURNING id, raqam, klient_ismi, jami_summa, holat, yaratilgan
        """, uid, raqam, data.klient_ismi.strip(),
            data.jami_summa, json.dumps(data.tovarlar), json.dumps(data.bank_rekvizit))
    log.info("📄 Faktura yaratildi: %s uid=%d", raqam, uid)
    return dict(row)


@app.put("/api/v1/faktura/{faktura_id}/holat", tags=["Faktura"])
async def faktura_holat(faktura_id: int, data: dict, uid: int = Depends(get_uid)):
    """Faktura holatini yangilash (yaratilgan → yuborilgan → tolangan → bekor)"""
    yangi_holat = data.get("holat", "")
    HOLATLAR = {"yaratilgan", "yuborilgan", "tolangan", "bekor"}
    if yangi_holat not in HOLATLAR:
        raise HTTPException(400, f"Noto'g'ri holat. Mumkin: {', '.join(sorted(HOLATLAR))}")

    async with rls_conn(uid) as c:
        old = await c.fetchrow(
            "SELECT id, holat FROM fakturalar WHERE id=$1 AND user_id=$2",
            faktura_id, uid
        )
        if not old:
            raise HTTPException(404, "Faktura topilmadi")
        await c.execute(
            "UPDATE fakturalar SET holat=$2 WHERE id=$1 AND user_id=$3",
            faktura_id, yangi_holat, uid
        )
    log.info("📄 Faktura #%d holat: %s→%s (uid=%d)", faktura_id, old["holat"], yangi_holat, uid)
    return {"id": faktura_id, "holat": yangi_holat}


@app.delete("/api/v1/faktura/{faktura_id}", tags=["Faktura"])
async def faktura_ochir(faktura_id: int, uid: int = Depends(get_uid)):
    """Faktura o'chirish (faqat 'yaratilgan' holatdagi)"""
    async with rls_conn(uid) as c:
        old = await c.fetchrow(
            "SELECT id, holat FROM fakturalar WHERE id=$1 AND user_id=$2",
            faktura_id, uid
        )
        if not old:
            raise HTTPException(404, "Faktura topilmadi")
        if old["holat"] != "yaratilgan":
            raise HTTPException(400, "Faqat 'yaratilgan' holatdagi fakturani o'chirish mumkin")
        await c.execute(
            "DELETE FROM fakturalar WHERE id=$1 AND user_id=$2", faktura_id, uid
        )
    return {"id": faktura_id, "status": "deleted"}


# ════════════════════════════════════════════════════════════════
#  KASSA — tags qo'shilgan endpointlar
# ════════════════════════════════════════════════════════════════
# (Kassa endpointlar routes/kassa.py da — tags app.include_router da qo'shilishi kerak)
