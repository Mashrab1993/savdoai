"""Shared font registration helper for SavdoAI PDF generators.

Registers DejaVu Sans (regular + bold) so Cyrillic, Uzbek apostrophe and a
useful subset of Unicode render correctly in reportlab. Falls back to
Helvetica with a warning if no DejaVu .ttf can be located.

Usage:
    from shared.services._pdf_fonts import register_cyrillic_font
    REG, BOLD = register_cyrillic_font()
    # Use REG / BOLD instead of "Helvetica" / "Helvetica-Bold"
"""
from __future__ import annotations

import logging
import os

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

log = logging.getLogger(__name__)

_REGULAR_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/root/savdo-bot/fonts/DejaVuSans.ttf",
]
_BOLD_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/root/savdo-bot/fonts/DejaVuSans-Bold.ttf",
]

_HELVETICA = ("Helvetica", "Helvetica-Bold")

_cached: tuple[str, str] | None = None


def _first_existing(paths: list[str]) -> str | None:
    for p in paths:
        if os.path.exists(p):
            return p
    return None


def register_cyrillic_font() -> tuple[str, str]:
    """Register DejaVu Sans for Cyrillic support.

    Returns:
        Tuple of (regular_font_name, bold_font_name). Either ("DV", "DV-Bold")
        on success, or ("Helvetica", "Helvetica-Bold") on failure.

    Safe to call multiple times — registration is cached and idempotent.
    """
    global _cached
    if _cached is not None:
        return _cached

    reg_path = _first_existing(_REGULAR_PATHS)
    bold_path = _first_existing(_BOLD_PATHS)

    if not reg_path:
        log.warning(
            "DejaVu Sans .ttf not found in any of: %s — falling back to "
            "Helvetica (Cyrillic / Uzbek apostrophe will render as boxes). "
            "Install with: apt-get install fonts-dejavu",
            _REGULAR_PATHS,
        )
        _cached = _HELVETICA
        return _cached

    registered = set(pdfmetrics.getRegisteredFontNames())
    try:
        if "DV" not in registered:
            pdfmetrics.registerFont(TTFont("DV", reg_path))
        bold_name = "DV-Bold"
        if bold_path:
            if "DV-Bold" not in registered:
                pdfmetrics.registerFont(TTFont("DV-Bold", bold_path))
        else:
            log.warning("DejaVu Bold .ttf not found; using regular for bold.")
            bold_name = "DV"
        _cached = ("DV", bold_name)
        return _cached
    except Exception as e:
        log.warning("DejaVu font registration failed (%s); falling back to Helvetica.", e)
        _cached = _HELVETICA
        return _cached
