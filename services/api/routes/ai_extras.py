"""
AI Extras endpoints — Claude Opus 4.7 second opinion, DeepSeek batch, Grok market intel.

Faqat tegishli env key bor bo'lsa ishlaydi. Key bo'lmasa 503 qaytadi.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from services.cognitive.ai_extras import (
    active_providers,
    cheap_batch,
    claude_opus,
    generate_ui,
    deepseek,
    grok,
    market_intel,
    second_opinion,
    v0,
)
from services.api.deps import get_uid

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])


# ─── Schemas ────────────────────────────────────────────────────────

class SecondOpinionIn(BaseModel):
    savol: str       = Field(..., min_length=3, max_length=4000)
    claude_javobi: str = Field(..., min_length=3, max_length=20000)
    kontekst: str    = Field("", max_length=8000)


class BatchIn(BaseModel):
    system: str = Field(..., max_length=2000)
    user:   str = Field(..., max_length=8000)


class MarketIn(BaseModel):
    savol: str = Field(..., min_length=3, max_length=500)


class UIGenIn(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=4000)


# ─── Endpoints ──────────────────────────────────────────────────────

@router.get("/status")
async def ai_status():
    """
    Qaysi AI providerlar faol ekanini ko'rsatadi.
    Public — faqat bool flag qaytaradi, maxfiy ma'lumot chiqmaydi,
    shuning uchun auth talab qilmaydi (health check uchun).
    """
    return {
        "faol": active_providers(),
        "claude_opus_4_7": claude_opus.ready,
        "deepseek":        deepseek.ready,
        "grok":            grok.ready,
        "v0":              v0.ready,
    }


import time as _time

# ── Per-endpoint, per-user rate limits (AI budjetni himoyalash)
# Har endpoint alohida limit — arzon vs qimmat AI provider'lar farqli
_AI_RATE_LIMITS = {
    "second_opinion": 20,   # Opus 4.7 — $25/M output, soatiga 20
    "batch":          200,  # DeepSeek — arzon, 200 OK
    "market_intel":   40,   # Grok 4 — o'rta narx, 40/soat
    "generate_ui":    10,   # v0.dev — qimmat, 10/soat
}
_ai_buckets: dict[tuple[str, int], list[float]] = {}


def _check_rate(endpoint: str, uid: int) -> None:
    """Per-user, per-endpoint rate limit — 429 HTTPException raise qiladi.

    Sliding window (1 soat) pattern. Memory protection: 5000+ user bo'lsa
    eski yozuvlar tozalanadi.
    """
    max_per_hour = _AI_RATE_LIMITS.get(endpoint, 60)
    key = (endpoint, uid)
    now = _time.time()
    bucket = _ai_buckets.setdefault(key, [])
    bucket[:] = [t for t in bucket if now - t < 3600]
    if len(bucket) >= max_per_hour:
        raise HTTPException(
            429,
            f"AI limiti: soatiga {max_per_hour} ta so'rov ({endpoint}). "
            "Keyinroq urinib ko'ring."
        )
    if len(_ai_buckets) > 5000:
        stale = [k for k, v in _ai_buckets.items() if not v or now - max(v) > 7200]
        for k in stale:
            _ai_buckets.pop(k, None)
    bucket.append(now)


@router.post("/second-opinion")
async def api_second_opinion(inp: SecondOpinionIn,
                              uid: int = Depends(get_uid)):
    """Claude Opus 4.7 dan birlamchi javobni mustaqil tekshirish (audit).

    Narx: $5/M input, $25/M output. Soatiga 20 so'rov cheklangan (per user).
    """
    if not claude_opus.ready:
        raise HTTPException(503, "ANTHROPIC_API_KEY sozlanmagan (Opus 4.7 kerak)")

    _check_rate("second_opinion", uid)

    result = await second_opinion(
        inp.savol, inp.claude_javobi, context=inp.kontekst,
    )
    if result is None:
        raise HTTPException(502, "Opus 4.7 javob qaytarmadi")
    return result


@router.post("/batch")
async def api_batch(inp: BatchIn, uid: int = Depends(get_uid)):
    """DeepSeek V3 — arzon va tez batch chaqiruv. Soatiga 200 so'rov."""
    if not deepseek.ready:
        raise HTTPException(503, "DeepSeek kaliti sozlanmagan")

    _check_rate("batch", uid)

    result = await cheap_batch(inp.system, inp.user)
    if result is None:
        raise HTTPException(502, "DeepSeek javob qaytarmadi")
    return {"javob": result}


@router.post("/market-intel")
async def api_market_intel(inp: MarketIn, uid: int = Depends(get_uid)):
    """Grok 4 — real-time bozor tahlil. Soatiga 40 so'rov."""
    if not grok.ready:
        raise HTTPException(503, "Grok kaliti sozlanmagan")

    _check_rate("market_intel", uid)

    result = await market_intel(inp.savol)
    if result is None:
        raise HTTPException(502, "Grok javob qaytarmadi")
    return {"javob": result}


@router.post("/generate-ui")
async def api_generate_ui(inp: UIGenIn, uid: int = Depends(get_uid)):
    """v0.dev — matn → shadcn/ui + Tailwind React komponent. Soatiga 10 so'rov."""
    if not v0.ready:
        raise HTTPException(503, "v0.dev kaliti sozlanmagan")

    _check_rate("generate_ui", uid)

    result = await generate_ui(inp.prompt)
    if result is None:
        raise HTTPException(502, "v0 javob qaytarmadi")
    return {"kod": result}
