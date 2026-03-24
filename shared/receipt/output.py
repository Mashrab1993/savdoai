"""
Yuborish qatlami: thermal matn birinchi, PDF ikkinchi (bot `export_pdf` bilan bog‘lanadi).

`thermal_txt_and_payload` — .txt baytlari va PDF uchun normalizatsiyalangan `dict`.
"""
from __future__ import annotations

from typing import Any

from shared.receipt.normalize import normalize_sale_receipt_data
from shared.services.thermal_receipt import thermal_receipt_utf8_bytes


def thermal_txt_and_payload(
    data: dict,
    dokon: str,
    width_mm: int = 80,
    amal: str | None = None,
) -> tuple[bytes, dict[str, Any]]:
    """(UTF-8 thermal .txt, PDF/chop uchun bir xil `data` nusxasi)."""
    d = normalize_sale_receipt_data(data, amal)
    return thermal_receipt_utf8_bytes(d, dokon, width_mm), d
