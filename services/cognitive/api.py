"""
MASHRAB MOLIYA v21.3 TURBO — COGNITIVE API
Dual-Brain MoE Gateway
Gemini (Ko'z+Quloq) + Claude (Mantiq) → bitta endpoint
"""
from __future__ import annotations
import os, sys, logging, base64, json
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from fastapi import Request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
# .env loyiha ildizidan
try:
    from dotenv import load_dotenv
    _root = Path(__file__).resolve().parents[2]
    load_dotenv(_root / ".env")
except ImportError:
    pass

COGNITIVE_API_KEY = os.environ.get("COGNITIVE_API_KEY", os.environ.get("ANTHROPIC_API_KEY", ""))

async def _verify_api_key(request: Request):
    """Cognitive API himoya — API key MAJBURIY"""
    # Health endpoint ochiq
    if request.url.path in ("/health", "/stats"):
        return
    key = request.headers.get("X-API-Key", request.headers.get("Authorization", ""))
    key = key.replace("Bearer ", "")
    if not COGNITIVE_API_KEY:
        return  # Agar kalit o'rnatilmagan — dev mode
    if key != COGNITIVE_API_KEY:
        from fastapi import HTTPException
        raise HTTPException(401, "Cognitive API: Invalid API key")
from typing import Optional

log = logging.getLogger(__name__)
__version__ = "21.3"

@asynccontextmanager
async def lifespan(app: FastAPI):
    from ai_router import router_init
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    claude_key = os.environ.get("ANTHROPIC_API_KEY", "")
    router_init(gemini_key, claude_key,
                os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite"),
                os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"))
    try:
        from engine import dvigatel_init
        dvigatel_init(claude_key, os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"))
    except Exception: pass
    log.info("🧠 Cognitive API v%s — Dual-Brain MoE tayyor", __version__)
    yield

app = FastAPI(title="Mashrab Cognitive Engine", version=__version__,
              dependencies=[Depends(_verify_api_key)],
              description="Dual-Brain MoE", lifespan=lifespan)

class TahlilSorov(BaseModel):
    matn: str; uid: int = 0
class OvozSorov(BaseModel):
    audio_b64: str; mime: str = "audio/ogg"; uid: int = 0
class RasmSorov(BaseModel):
    image_b64: str; mime: str = "image/jpeg"; uid: int = 0
class BiznesSorov(BaseModel):
    query: str; context: dict = {}; uid: int = 0

@app.get("/health")
async def health():
    from ai_router import get_router
    return {"status":"ok","service":"cognitive","version":__version__,
            "architecture":"dual-brain-moe","router_stats":get_router().stats}

@app.post("/tahlil")
async def tahlil(req: TahlilSorov):
    from ai_router import get_router, AIRequest, TaskType
    resp = await get_router().process(AIRequest(task=TaskType.INTENT_PARSE,content=req.matn,user_id=req.uid))
    if resp.success:
        return {"result":resp.result,"model":resp.model.value,"latency_ms":resp.latency_ms,"fallback":resp.fallback_used}
    raise HTTPException(500, resp.error or "Tahlil ishlamayapti")

@app.post("/ovoz")
async def ovoz_tahlil(req: OvozSorov):
    from ai_router import get_router, AIRequest, TaskType
    resp = await get_router().process(AIRequest(task=TaskType.VOICE_STT,audio_bytes=base64.b64decode(req.audio_b64),mime_type=req.mime,user_id=req.uid))
    if resp.success:
        return {"matn":resp.result,"model":resp.model.value,"latency_ms":resp.latency_ms}
    raise HTTPException(500, resp.error or "STT ishlamayapti")

@app.post("/rasm")
async def rasm_tahlil(req: RasmSorov):
    from ai_router import get_router, AIRequest, TaskType
    resp = await get_router().process(AIRequest(task=TaskType.IMAGE_OCR,image_bytes=base64.b64decode(req.image_b64),mime_type=req.mime,user_id=req.uid))
    if resp.success:
        return {"data":resp.result,"model":resp.model.value,"latency_ms":resp.latency_ms}
    raise HTTPException(500, resp.error or "OCR ishlamayapti")

@app.post("/biznes")
async def biznes_tahlil(req: BiznesSorov):
    from ai_router import get_router, AIRequest, TaskType
    resp = await get_router().process(AIRequest(task=TaskType.BUSINESS_LOGIC,content=req.query,context=req.context,user_id=req.uid))
    if resp.success:
        return {"result":resp.result,"model":resp.model.value,"latency_ms":resp.latency_ms}
    raise HTTPException(500, resp.error or "Biznes tahlil ishlamayapti")

@app.get("/stats")
async def router_stats():
    from ai_router import get_router
    return get_router().stats
