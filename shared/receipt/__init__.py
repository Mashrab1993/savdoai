"""
Receipt output layer — production split:

- **Thermal (primary)** — `shared.services.thermal_receipt` — UTF-8 text / ESC-POS
- **PDF (archive)** — `services.bot.bot_services.export_pdf.chek_pdf` — ReportLab (bot only)

Telegram / preview / mini-printer matn bitta vizual mantiq: `receipt_text_80mm` yoki
`format_thermal_receipt`.
"""
from __future__ import annotations

from shared.receipt.normalize import normalize_sale_receipt_data
from shared.receipt.output import thermal_txt_and_payload
from shared.services.thermal_receipt import (
    demo_thermal_receipt_preview_text,
    format_thermal_receipt,
    format_qaytarish_receipt,
    thermal_receipt_escpos_utf8,
    thermal_receipt_utf8_bytes,
    thermal_safe_text,
)


def receipt_text_80mm(data: dict, dokon: str = "") -> str:
    """Sotuv/kirim cheki — 80mm ustunlar (Telegram, preview, .txt bilan bir xil)."""
    return format_thermal_receipt(normalize_sale_receipt_data(data), dokon, width_mm=80)


def receipt_utf8_bytes(
    data: dict,
    dokon: str = "",
    width_mm: int = 80,
    amal: str | None = None,
) -> bytes:
    """UTF-8 .txt — mini-printer (Bluetooth) uchun birinchi fayl."""
    return thermal_receipt_utf8_bytes(
        normalize_sale_receipt_data(data, amal), dokon, width_mm
    )


def receipt_escpos_bytes(
    data: dict,
    dokon: str = "",
    width_mm: int = 80,
    amal: str | None = None,
) -> bytes:
    """ESC/POS + UTF-8 (quruq printerlar)."""
    return thermal_receipt_escpos_utf8(
        normalize_sale_receipt_data(data, amal), dokon, width_mm
    )


__all__ = [
    "demo_thermal_receipt_preview_text",
    "format_thermal_receipt",
    "format_qaytarish_receipt",
    "thermal_safe_text",
    "normalize_sale_receipt_data",
    "receipt_escpos_bytes",
    "receipt_text_80mm",
    "receipt_utf8_bytes",
    "thermal_receipt_escpos_utf8",
    "thermal_receipt_utf8_bytes",
    "thermal_txt_and_payload",
]
