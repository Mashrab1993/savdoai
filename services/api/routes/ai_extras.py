"""
AI Extras endpoints — GPT-5 second opinion, DeepSeek batch, Grok market intel.

Faqat tegishli env key bor bo'lsa ishlaydi. Key bo'lmasa 503 qaytadi.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from services.cognitive.ai_extras import (
    active_providers,
    cheap_batch,
    gpt5,
    deepseek,
    grok,
    market_intel,
    second_opinion,
)
from services.api.deps import get_current_user  # type: ignore

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


# ─── Endpoints ──────────────────────────────────────────────────────

@router.get("/status")
async def ai_status(_=Depends(get_current_user)):
    """Qaysi AI providerlar faol ekanini ko'rsatadi."""
    return {
        "faol": active_providers(),
        "gpt5":     gpt5.ready,
        "deepseek": deepseek.ready,
        "grok":     grok.ready,
    }


@router.post("/second-opinion")
async def api_second_opinion(inp: SecondOpinionIn,
                              _=Depends(get_current_user)):
    """GPT-5 dan Claude javobini tekshirishni so'rash."""
    if not gpt5.ready:
        raise HTTPException(503, "GPT-5 kaliti sozlanmagan")

    result = await second_opinion(
        inp.savol, inp.claude_javobi, context=inp.kontekst,
    )
    if result is None:
        raise HTTPException(502, "GPT-5 javob qaytarmadi")
    return result


@router.post("/batch")
async def api_batch(inp: BatchIn, _=Depends(get_current_user)):
    """DeepSeek V3 — arzon va tez batch chaqiruv."""
    if not deepseek.ready:
        raise HTTPException(503, "DeepSeek kaliti sozlanmagan")

    result = await cheap_batch(inp.system, inp.user)
    if result is None:
        raise HTTPException(502, "DeepSeek javob qaytarmadi")
    return {"javob": result}


@router.post("/market-intel")
async def api_market_intel(inp: MarketIn, _=Depends(get_current_user)):
    """Grok 4 — real-time bozor tahlil."""
    if not grok.ready:
        raise HTTPException(503, "Grok kaliti sozlanmagan")

    result = await market_intel(inp.savol)
    if result is None:
        raise HTTPException(502, "Grok javob qaytarmadi")
    return {"javob": result}
