"""
Text Fixer — passthrough.
Claude Haiku o'chirildi: FuzzyMatcher + Claude Sonnet Analyst yetarli.
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# Haiku client — O'CHIRILDI
client = None
KNOWN_PRODUCTS: list[str] = []
KNOWN_CLIENTS: list[str] = []


async def fix_stt_text(
    raw_text: str,
    fuzzy_fixed: str,
    *,
    products: list[str] | None = None,
    clients: list[str] | None = None,
) -> str:
    """Passthrough — matnni o'zgartirmasdan qaytaradi."""
    return fuzzy_fixed
