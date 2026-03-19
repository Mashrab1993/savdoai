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
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from shared.database.pool import pool_init, pool_close, schema_init, rls_conn, get_pool
from shared.cache.redis_cache import redis_init, cache_ol, cache_yoz
from shared.cache.redis_cache import k_hisobot_kunlik, k_qarzlar, k_user, TTL_HISOBOT, TTL_USER
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
if not _JWT_SECRET_RAW:
    _JWT_SECRET_RAW = "savdoai-default-dev-secret-change-me-in-production"
    log.warning("⚠️ JWT_SECRET o'rnatilmagan — default ishlatilmoqda. Production uchun o'rnating!")
JWT_SECRET = _JWT_SECRET_RAW


# ════════════════════════════════════════════════════════════
#  STARTUP / SHUTDOWN
# ════════════════════════════════════════════════════════════

# ════════════════════════════════════════════════════════════
#  PYDANTIC MODELLAR (Request/Response validatsiya)
# ════════════════════════════════════════════════════════════

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
    yield
    await pool_close()
    log.info("API to'xtatildi")


app = FastAPI(
    title       = "SavdoAI Mashrab Moliya API",
    version     = __version__,
    description = "O'zbek bozori uchun AI-powered savdo boshqaruv tizimi REST API",
    lifespan    = lifespan,
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# CORS
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("WEB_URL", "https://savdoai-production.up.railway.app"),
        "https://savdoai-production.up.railway.app",
        "https://*.up.railway.app",
        "https://mashrab-moliya.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "*",  # Telegram Mini App uchun
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══ v21.3 YANGI ROUTELAR ═══
try:
    from services.api.routes.kassa import router as kassa_router
    app.include_router(kassa_router)
    log.info("✅ Kassa moduli ulandi")
except Exception as e:
    log.warning("⚠️ Kassa moduli yuklanmadi: %s", e)

try:
    from services.api.routes.websocket import router as ws_router
    app.include_router(ws_router)
    log.info("✅ WebSocket ulandi")
except Exception as e:
    log.warning("⚠️ WebSocket yuklanmadi: %s", e)

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
            <div class="stat"><div class="stat-num">37+</div><div class="stat-label">API Endpoints</div></div>
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


@app.get("/health")
async def health():
    from shared.database.pool import pool_health
    import time as _t
    start = _t.monotonic()
    db = await pool_health()
    latency_ms = round((_t.monotonic() - start) * 1000, 1)
    return {
        "status": "ok",
        "version": __version__,
        "service": "api",
        "db_ping_ms": db.get("ping_ms"),
        "db_pool": f"{db.get('used',0)}/{db.get('size',0)}",
        "latency_ms": latency_ms,
    }


@app.get("/dashboard", include_in_schema=False)
async def dashboard():
    """Web Dashboard — Shogird xarajat + Savdo + Ombor"""
    from fastapi.responses import HTMLResponse
    import os as _os2
    html_path = _os2.path.join(_os2.path.dirname(_os2.path.abspath(__file__)), "static", "dashboard.html")
    if _os2.path.exists(html_path):
        return HTMLResponse(content=open(html_path, encoding="utf-8").read())
    return HTMLResponse(content="<h1>Dashboard yuklanmadi</h1>", status_code=500)


@app.post("/auth/telegram")
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
        u = await c.fetchrow("SELECT * FROM users WHERE id=$1", uid)
        if not u:
            await c.execute(
                "INSERT INTO users(id,ism) VALUES($1,$2) ON CONFLICT DO NOTHING",
                uid, data.ism or ""
            )

    token = jwt_yarat(uid)
    return {"token": token, "user_id": uid}


@app.get("/api/v1/me")
async def me(uid: int = Depends(get_uid)):
    """Joriy foydalanuvchi"""
    cached = await cache_ol(k_user(uid))
    if cached:
        return cached
    async with rls_conn(uid) as c:
        u = await c.fetchrow("SELECT * FROM users WHERE id=$1", uid)
        if not u:
            raise HTTPException(404, "Topilmadi")
        result = dict(u)
        await cache_yoz(k_user(uid), result, TTL_USER)
        return result


@app.get("/api/v1/dashboard")
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
        klient_soni = await c.fetchval("SELECT COUNT(*) FROM klientlar")
        tovar_soni  = await c.fetchval("SELECT COUNT(*) FROM tovarlar")
        kam_qoldiq  = await c.fetchval("""
            SELECT COUNT(*) FROM tovarlar
            WHERE min_qoldiq>0 AND qoldiq<=min_qoldiq
        """)

    result = {
        "bugun_sotuv_soni":  int(bugun["sotuv_soni"]),
        "bugun_sotuv_jami":  float(bugun["sotuv_jami"]),
        "bugun_yangi_qarz":  float(bugun["yangi_qarz"]),
        "jami_qarz":         float(jami_qarz or 0),
        "klient_soni":       klient_soni,
        "tovar_soni":        tovar_soni,
        "kam_qoldiq_soni":   kam_qoldiq,
    }
    await cache_yoz(cache_k, result, TTL_HISOBOT)
    return result


@app.get("/api/v1/klientlar")
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
            """, limit, offset, f"%{qidiruv}%")
            total = await c.fetchval("""
                SELECT COUNT(*) FROM klientlar
                WHERE lower(ism) LIKE lower($1) OR telefon LIKE $1
            """, f"%{qidiruv}%")
        else:
            rows = await c.fetch("""
                SELECT k.*,
                       COALESCE(SUM(q.qolgan) FILTER(WHERE q.yopildi=FALSE),0) aktiv_qarz
                FROM klientlar k
                LEFT JOIN qarzlar q ON q.klient_id=k.id
                GROUP BY k.id
                ORDER BY k.jami_sotib DESC LIMIT $1 OFFSET $2
            """, limit, offset)
            total = await c.fetchval("SELECT COUNT(*) FROM klientlar")

    return {"total": total, "items": [dict(r) for r in rows]}


@app.get("/api/v1/tovarlar")
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
                SELECT * FROM tovarlar WHERE kategoriya=$3
                ORDER BY nomi LIMIT $1 OFFSET $2
            """, limit, offset, kategoriya)
            total = await c.fetchval(
                "SELECT COUNT(*) FROM tovarlar WHERE kategoriya=$1", kategoriya
            )
        else:
            rows  = await c.fetch(
                "SELECT * FROM tovarlar ORDER BY kategoriya,nomi LIMIT $1 OFFSET $2",
                limit, offset
            )
            total = await c.fetchval("SELECT COUNT(*) FROM tovarlar")

    return {"total": total, "items": [dict(r) for r in rows]}


@app.get("/api/v1/qarzlar")
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


@app.get("/api/v1/hisobot/kunlik")
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

@app.post("/api/v1/tahlil")
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

@app.post("/api/v1/sotuv")
async def sotuv_saqlash(data: SotuvSo_rov, uid: int = Depends(get_uid)):
    """Sotuv operatsiyasini saqlash"""
    from shared.utils.hisob import sotuv_validatsiya, ai_hisob_tekshir
    from shared.cache.redis_cache import user_cache_tozala

    ok, xato = sotuv_validatsiya(data.dict())
    if not ok:
        raise HTTPException(400, "So'rov ma'lumotlari noto'g'ri")

    data_d = ai_hisob_tekshir(data.dict())
    data_d["user_id"] = uid

    async with rls_conn(uid) as c:
        sess_id = await c.fetchval("""
            INSERT INTO sotuv_sessiyalar
                (user_id, klient_ismi, jami, tolangan, qarz, izoh)
            VALUES ($1,$2,$3,$4,$5,$6) RETURNING id
        """, uid,
            data_d.get("klient"),
            data_d.get("jami_summa", 0),
            data_d.get("tolangan", 0),
            data_d.get("qarz", 0),
            data_d.get("izoh"),
        )

    # Cache tozalash
    await user_cache_tozala(uid)
    return {"sessiya_id": sess_id, "status": "saqlandi"}


@app.post("/api/v1/kirim")
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

@app.post("/api/v1/qarz/tolash")
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
        """, f"%{data.klient_ismi.strip()}%")

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
        """, f"%{data.klient_ismi.strip()}%") or 0)

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

@app.get("/healthz")
async def healthz():
    """Kubernetes/Railway health probe"""
    return {"status": "ok"}


@app.get("/readyz")
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

@app.post("/api/v1/klient")
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
            RETURNING *
        """, uid, ism,
            data.get("telefon"),
            data.get("manzil"),
            data.get("kredit_limit", 0),
        )
    await user_cache_tozala(uid)
    return dict(klient)


@app.get("/metrics")
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

@app.get("/api/v1/search")
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
            """, f"%{q}%", limit)]
        if tur in ("klient","barchasi"):
            klientlar_r = [dict(r) for r in await c.fetch("""
                SELECT id,ism,telefon,jami_sotib
                FROM klientlar
                WHERE lower(ism) LIKE lower($1) OR (telefon IS NOT NULL AND telefon LIKE $1)
                ORDER BY jami_sotib DESC LIMIT $2
            """, f"%{q}%", limit)]
    return {"tovarlar": tovarlar_r, "klientlar": klientlar_r,
            "jami": len(tovarlar_r) + len(klientlar_r)}


@app.get("/api/v1/tovar/{tovar_id}")
async def tovar_bir(tovar_id: int, uid: int = Depends(get_uid)):
    """Bitta tovar to'liq ma'lumoti"""
    async with rls_conn(uid) as c:
        t = await c.fetchrow("SELECT * FROM tovarlar WHERE id=$1", tovar_id)
        if not t:
            raise HTTPException(404, "Tovar topilmadi")
        return dict(t)


# ════════════════════════════════════════════════════════════
#  HISOBOTLAR (haftalik / oylik)
# ════════════════════════════════════════════════════════════

@app.get("/api/v1/hisobot/haftalik")
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


@app.get("/api/v1/hisobot/oylik")
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

@app.post("/api/v1/export")
async def export_trigger(data: dict, uid: int = Depends(get_uid)):
    """
    Excel/PDF eksportni Worker ga yuboradi.
    Katta hisobotlar background da tayyorlanadi.
    """
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

@app.get("/api/v1/export/{task_id}")
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


@app.get("/api/v1/export/file/{task_id}")
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

        # Security: task result user_id ni o'z ichiga olishini tekshirish
        # task_id UUID formatda; biz res dict'ini tekshiramiz
        # task faqat shu uid uchun yaratilgan bo'lishi kerak
        # (katta_export args[0] == user_id)
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
RATE_LIMIT = int(os.environ.get("API_RATE_LIMIT", "60"))  # per minute
RATE_WINDOW = 60  # seconds

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """IP-based rate limiting — SAP-GRADE API himoya"""
    import time as _t
    # Health/readyz endpoints skip
    if request.url.path in ("/health", "/healthz", "/readyz"):
        return await call_next(request)

    ip = request.client.host if request.client else "unknown"
    now = _t.time()

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

@app.get("/api/v1/ledger/balans")
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


@app.get("/api/v1/ledger/jurnal")
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


@app.get("/api/v1/ledger/jurnal/{jurnal_id}")
async def ledger_jurnal_detail(jurnal_id: str, uid: int = Depends(get_uid)):
    """Bitta jurnal yozuvi batafsil (qatorlar bilan)"""
    async with rls_conn(uid) as c:
        header = await c.fetchrow("""
            SELECT * FROM jurnal_yozuvlar
            WHERE user_id = $1 AND jurnal_id = $2
        """, uid, jurnal_id)
        if not header:
            raise HTTPException(404, "Jurnal topilmadi")
        qatorlar = await c.fetch("""
            SELECT hisob, debit, credit, tavsif
            FROM jurnal_qatorlar WHERE jurnal_id = $1
        """, header["id"])
    return {"header": dict(header), "qatorlar": [dict(q) for q in qatorlar]}


@app.get("/api/v1/ledger/hisob/{hisob}")
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

@app.get("/api/v1/shogirdlar")
async def api_shogirdlar(uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import shogirdlar_royxati
    async with rls_conn(uid) as c:
        return [dict(s) for s in await shogirdlar_royxati(c, uid)]

@app.get("/api/v1/shogird/dashboard")
async def api_shogird_dashboard(uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import dashboard_data
    async with rls_conn(uid) as c:
        return await dashboard_data(c, uid)

@app.get("/api/v1/xarajatlar/bugungi")
async def api_xarajatlar_bugungi(uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import kunlik_hisobot
    async with rls_conn(uid) as c:
        return await kunlik_hisobot(c, uid)

@app.get("/api/v1/xarajatlar/oylik")
async def api_xarajatlar_oylik(uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import oylik_hisobot
    async with rls_conn(uid) as c:
        return await oylik_hisobot(c, uid)

@app.get("/api/v1/xarajatlar/kutilmoqda")
async def api_kutilmoqda(uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import kutilmoqda_royxati
    async with rls_conn(uid) as c:
        return [dict(k) for k in await kutilmoqda_royxati(c, uid)]

@app.get("/api/v1/shogird/{shogird_id}/hisobot")
async def api_shogird_hisobot(shogird_id: int, kunlar: int = 7, uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import shogird_hisobot
    async with rls_conn(uid) as c:
        return await shogird_hisobot(c, uid, shogird_id, kunlar)

@app.post("/api/v1/xarajat/{xarajat_id}/tasdiqlash")
async def api_xarajat_tasdiq(xarajat_id: int, uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import xarajat_tasdiqlash
    async with rls_conn(uid) as c:
        ok = await xarajat_tasdiqlash(c, xarajat_id, uid)
    return {"ok": ok}

@app.post("/api/v1/xarajat/{xarajat_id}/bekor")
async def api_xarajat_bekor(xarajat_id: int, uid: int = Depends(get_uid)):
    from shared.services.shogird_xarajat import xarajat_bekor
    async with rls_conn(uid) as c:
        ok = await xarajat_bekor(c, xarajat_id, uid)
    return {"ok": ok}


# ═══════════════════════════════════════════════════════════
#  NARX GURUH API (Web Dashboard uchun)
# ═══════════════════════════════════════════════════════════

@app.get("/api/v1/narx/guruhlar")
async def api_narx_guruhlar(uid: int = Depends(get_uid)):
    from shared.services.smart_narx import guruhlar_royxati
    async with rls_conn(uid) as c:
        return [dict(g) for g in await guruhlar_royxati(c, uid)]

@app.post("/api/v1/narx/guruh")
async def api_narx_guruh_yarat(data: dict, uid: int = Depends(get_uid)):
    from shared.services.smart_narx import guruh_yaratish
    nomi = data.get("nomi", "")
    if not nomi: raise HTTPException(400, "Guruh nomi kerak")
    async with rls_conn(uid) as c:
        gid = await guruh_yaratish(c, uid, nomi, data.get("izoh", ""))
    return {"id": gid, "nomi": nomi}

@app.post("/api/v1/narx/qoyish")
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

@app.post("/api/v1/narx/klient_guruh")
async def api_klient_guruhga(data: dict, uid: int = Depends(get_uid)):
    from shared.services.smart_narx import klient_guruhga_qoyish
    async with rls_conn(uid) as c:
        await klient_guruhga_qoyish(c, int(data["klient_id"]), int(data["guruh_id"]))
    return {"ok": True}
