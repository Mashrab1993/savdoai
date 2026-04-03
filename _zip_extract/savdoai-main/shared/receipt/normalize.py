"""Chek `data` dict ni PDF / thermal / Telegram uchun bir xil ko'rinishda."""
from __future__ import annotations


def normalize_sale_receipt_data(data: dict, amal: str | None = None) -> dict:
    d = dict(data)
    if amal is not None:
        d["amal"] = amal
    else:
        d.setdefault("amal", "chiqim")
    return d
