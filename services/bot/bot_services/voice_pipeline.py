"""
Voice Pipeline - 2 qatlamli ovoz qayta ishlash (Gemini STT + FuzzyMatcher).
"""
from __future__ import annotations

import logging
import re
import time

from .fuzzy_matcher import fuzzy_matcher
from .text_fixer import fix_stt_text  # passthrough, import buzilmasin

logger = logging.getLogger(__name__)


def clean_stt_output(raw: str) -> str:
    cleaned = re.sub(r"\d{2}:\d{2}\s*", "", raw)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) < 3 or not any(c.isalpha() for c in cleaned):
        return ""
    return cleaned


async def process_voice(raw_stt_text: str, user_id: int | None = None) -> dict:
    start = time.time()
    result = {
        "original": raw_stt_text,
        "cleaned": "",
        "fuzzy_fixed": "",
        "text": "",
        "confidence": "low",
        "processing_ms": 0,
    }

    cleaned = clean_stt_output(raw_stt_text)
    result["cleaned"] = cleaned
    if not cleaned:
        result["text"] = ""
        result["confidence"] = "none"
        result["processing_ms"] = int((time.time() - start) * 1000)
        return result

    uid = user_id or 0
    if uid:
        await fuzzy_matcher.ensure_loaded(uid)

    fuzzy_fixed = fuzzy_matcher.fix_text(cleaned, uid)
    result["fuzzy_fixed"] = fuzzy_fixed

    prods, clits = (
        fuzzy_matcher.get_products_clients(uid) if uid else ([], [])
    )

    has_unknown_words = _has_unknown_words(fuzzy_fixed, uid)
    if not has_unknown_words:
        result["text"] = fuzzy_fixed
        result["confidence"] = "high"
        result["processing_ms"] = int((time.time() - start) * 1000)
        return result

    result["text"] = fuzzy_fixed
    result["confidence"] = "medium"
    logger.info("Pipeline: fuzzy natija → analyst (%d belgi)", len(fuzzy_fixed))

    result["processing_ms"] = int((time.time() - start) * 1000)
    return result


def _has_unknown_words(text: str, uid: int) -> bool:
    skip_words = {
        "ga",
        "da",
        "ni",
        "dan",
        "bilan",
        "va",
        "yana",
        "ta",
        "karobka",
        "dona",
        "shtuk",
        "paket",
        "aka",
        "opa",
        "brat",
        "xola",
        "boldi",
        "bo'ldi",
        "savatlar",
        "savat",
    }
    words = text.lower().split()
    for word in words:
        if word.isdigit() or word in skip_words:
            continue
        if uid and fuzzy_matcher.match_product(word, uid, threshold=80):
            continue
        if uid and fuzzy_matcher.match_client(word, uid, threshold=80):
            continue
        return True
    return False
