"""
80mm / 58mm thermal receipt — text-first, monospaced, premium POS layout.

Restaurant-style priorities: item name, then qty x unit price, line total, grand total.
No gray, no bitmap dependency; optional ESC/POS bold on names and totals.

Printer safety: `thermal_safe_text` normalizes dashes/quotes and strips control
characters so UTF-8 output is reliable on common portable thermal printers.
"""
from __future__ import annotations

import datetime
import re
import unicodedata
from typing import Any

import pytz

TZ = pytz.timezone("Asia/Tashkent")


def thermal_safe_text(s: str) -> str:
    """
    Normalize text for thermal printers: NFC, ASCII-friendly punctuation,
    no control characters. Uzbek o' / g' apostrophes and Cyrillic stay printable.
    """
    if not s:
        return ""
    t = unicodedata.normalize("NFC", str(s))
    repl = (
        ("\u2014", "-"),  # em dash
        ("\u2013", "-"),  # en dash
        ("\u2212", "-"),  # minus sign
        ("\u2018", "'"),  # ‘
        ("\u2019", "'"),  # ’
        ("\u02bc", "'"),  # modifier letter apostrophe
        ("\u201c", '"'),
        ("\u201d", '"'),
        ("\ufeff", ""),   # BOM
    )
    for a, b in repl:
        t = t.replace(a, b)
    out = []
    for ch in t:
        if ch == "\n" or ch == "\r":
            out.append(" ")
        elif unicodedata.category(ch) == "Cc" and ch not in "\t":
            continue
        else:
            out.append(ch)
    return "".join(out)


def _ts(s: str) -> str:
    return thermal_safe_text(s)

THERMAL_CHARS: dict[int, int] = {58: 32, 80: 48}


def _w(width_mm: int) -> int:
    return THERMAL_CHARS.get(width_mm, THERMAL_CHARS[80])


def _money_w(chars: int) -> int:
    """Right column width for sums — stable alignment at a glance."""
    if chars >= 42:
        return 13
    return max(8, min(11, chars // 3 + 4))


def _money(n: Any) -> str:
    try:
        v = int(round(float(n)))
    except Exception:
        v = 0
    return f"{v:,}".replace(",", " ")


def _miq_str(miq: float) -> str:
    s = f"{miq:.3f}".rstrip("0").rstrip(".")
    return s if s else "0"


def _sep_heavy(w: int) -> str:
    return "=" * w


def _sep_mid(w: int) -> str:
    return "-" * w


def _lr_money(left: str, amount: str, w: int) -> str:
    """Left detail + right-justified amount column (stable scan line for line totals)."""
    left = left.rstrip()
    amount = amount.strip()
    mw = _money_w(w)
    rw = max(mw, len(amount))
    rw = min(rw, w - 5)
    right = amount.rjust(rw)
    max_left = w - len(right) - 1
    if max_left < 4:
        max_left = 4
    if len(left) > max_left:
        left = left[:max_left].rstrip()
    pad = w - len(left) - len(right)
    if pad < 1:
        pad = 1
    return left + (" " * pad) + right


def _wrap(name: str, width: int) -> list[str]:
    n = (name or "").strip() or "?"
    out: list[str] = []
    while n:
        if len(n) <= width:
            out.append(n)
            break
        chunk = n[:width]
        sp = chunk.rfind(" ")
        if sp > width // 2:
            out.append(n[:sp].strip())
            n = n[sp:].strip()
        else:
            out.append(n[:width])
            n = n[width:].strip()
    return out or ["?"]


def format_thermal_receipt(
    data: dict,
    dokon: str = "",
    width_mm: int = 80,
) -> str:
    """
    Premium POS-style receipt: heavy rules, fixed money column, clear item blocks.
    """
    w = _w(width_mm)
    lines: list[str] = []

    amal = (data.get("amal") or "chiqim").lower()
    dokon_l = _ts((dokon or "SAVDOAI").strip())[: w - 2]
    title = dokon_l.upper()

    lines.append(_sep_heavy(w))
    lines.append(title.center(w)[:w])
    lines.append(_sep_heavy(w))
    lines.append("MASHRAB MOLIYA".center(w)[:w])
    lines.append(_sep_mid(w))

    now = datetime.datetime.now(TZ).strftime("%d.%m.%Y  %H:%M")
    rid = data.get("sessiya_id") or data.get("chek_raqami") or data.get("raqam")
    if rid is not None:
        lines.append(_lr_money(f"Chek #{rid}", now, w))
    else:
        lines.append(_lr_money("Chek", now, w))

    amal_map = {
        "kirim": "KIRIM",
        "chiqim": "SOTUV",
        "qaytarish": "QAYTARISH",
        "qarz_tolash": "QARZ TO'LASH",
        "nakladnoy": "NAKLADNOY",
    }
    lines.append(amal_map.get(amal, "SOTUV").center(w)[:w])
    lines.append(_sep_mid(w))

    if amal == "kirim" and data.get("manba"):
        for ln in _wrap(f"Manba: {_ts(str(data['manba']))}", w):
            lines.append(ln)
        lines.append(_sep_mid(w))

    klient = _ts((data.get("klient") or data.get("klient_ismi") or "").strip())
    if klient:
        for ln in _wrap(f"Mijoz: {klient}", w):
            lines.append(ln)
        lines.append(_sep_mid(w))

    tovarlar = data.get("tovarlar") or []
    # Column hint — matches restaurant "description | amount" scan
    lines.append(_lr_money("TOVAR NOMI", "JAMI (so'm)", w))
    lines.append(_sep_mid(w))

    for i, t in enumerate(tovarlar, 1):
        nomi = _ts((t.get("nomi") or "?").strip())
        miq = float(t.get("miqdor") or 0)
        bir = _ts((t.get("birlik") or "dona").strip())
        narx = float(t.get("narx") or 0)
        jami = float(t.get("jami") or 0) or (miq * narx)
        ms = _miq_str(miq)

        # Item name — full width, index prominent
        head = f"{i:>2}. "
        avail = w - len(head)
        wrapped = _wrap(nomi, max(avail, 6))
        for li, nl in enumerate(wrapped):
            prefix = head if li == 0 else "    "
            lines.append((prefix + nl)[:w])

        if narx:
            if bir == "gramm":
                left = f"     {ms} g x {_money(narx)}/kg"
            else:
                left = f"     {ms} {bir} x {_money(narx)}"
        else:
            left = f"     {ms} {bir}"

        lines.append(_lr_money(left, _money(jami), w))

        if i < len(tovarlar):
            lines.append(_sep_mid(w))

    lines.append(_sep_heavy(w))

    jami_s = float(data.get("jami_summa") or 0)
    lines.append(_lr_money("JAMI", f"{_money(jami_s)} so'm", w))
    lines.append(_sep_heavy(w))

    qarz = float(data.get("qarz") or 0)
    jami_s_calc = float(data.get("jami_summa") or 0)
    tol = float(data.get("tolangan") or data.get("tolandan") or 0)
    if tol <= 0 and qarz > 0:
        tol = max(jami_s_calc - qarz, 0)
    elif tol <= 0:
        tol = jami_s_calc

    if qarz > 0:
        lines.append(_lr_money("To'langan", _money(tol), w))
        lines.append(_lr_money("QARZ", _money(qarz), w))
        lines.append(_sep_mid(w))

    eski_qarz = float(data.get("eski_qarz") or 0)
    if eski_qarz > 0:
        lines.append(_lr_money("ESKI QARZ", _money(eski_qarz), w))
        jq = qarz + eski_qarz
        lines.append(_lr_money("JAMI QARZ", _money(jq), w))
        lines.append(_sep_mid(w))

    if data.get("manba") and amal != "kirim":
        for ln in _wrap(f"Manba: {_ts(str(data['manba']))}", w):
            lines.append(ln)

    lines.append(_sep_mid(w))
    lines.append("Xaridingiz uchun rahmat!".center(w)[:w])
    lines.append("@savdoai_mashrab_bot".center(w)[:w])
    lines.append(_sep_heavy(w))
    lines.append("")
    lines = [ln[:w] if len(ln) > w else ln for ln in lines]
    return "\n".join(lines)


def thermal_receipt_utf8_bytes(data: dict, dokon: str = "", width_mm: int = 80) -> bytes:
    return format_thermal_receipt(data, dokon, width_mm).encode("utf-8")


def _escpos_line(line: bytes, bold: bool) -> bytes:
    if bold:
        return b"\x1B\x45\x01" + line + b"\x1B\x45\x00\n"
    return line + b"\n"


def _line_bold_escpos(raw_line: str, w: int) -> bool:
    s = raw_line.strip()
    if not s:
        return False
    if len(s) >= w - 2 and set(s) <= {"="}:
        return True
    if re.match(r"^\s*\d{1,2}\.\s", raw_line):
        return True
    if s.startswith("JAMI"):
        return True
    return False


def thermal_receipt_escpos_utf8(data: dict, dokon: str = "", width_mm: int = 80) -> bytes:
    """
    ESC/POS: init, UTF-8 payload with bold on item names, heavy rules, and JAMI line.
    """
    w = _w(width_mm)
    text = format_thermal_receipt(data, dokon, width_mm)
    out = bytearray(b"\x1B\x40")
    for raw_line in text.split("\n"):
        line = raw_line.encode("utf-8")
        bold = _line_bold_escpos(raw_line, w)
        out.extend(_escpos_line(line, bold))
    out.extend(b"\n\n")
    return bytes(out)


def format_qaytarish_receipt(
    natijalar: list[dict],
    dokon: str = "",
    width_mm: int = 80,
) -> str:
    """
    Qaytarish cheki — sotuv cheki bilan bir xil vizual qoidalar (80mm default).
    natijalar: [{tovar, klient?, qaytarildi, birlik, narx?, summa}, ...]
    """
    w = _w(width_mm)
    lines: list[str] = []

    dokon_l = _ts((dokon or "SAVDOAI").strip())[: w - 2]
    lines.append(_sep_heavy(w))
    lines.append("QAYTARISH".center(w)[:w])
    lines.append(dokon_l.upper().center(w)[:w])
    lines.append(_sep_heavy(w))
    lines.append("MASHRAB MOLIYA".center(w)[:w])
    lines.append(_sep_mid(w))

    now = datetime.datetime.now(TZ).strftime("%d.%m.%Y  %H:%M")
    lines.append(_lr_money("Chek", now, w))

    klient = _ts(next((n.get("klient") for n in natijalar if n.get("klient")), "") or "")
    if klient:
        for ln in _wrap(f"Mijoz: {klient}", w):
            lines.append(ln)
        lines.append(_sep_mid(w))

    lines.append(_lr_money("TOVAR NOMI", "JAMI (so'm)", w))
    lines.append(_sep_mid(w))

    jami = 0.0
    for i, n in enumerate(natijalar, 1):
        nomi = _ts((n.get("tovar") or "?").strip())
        miq = float(n.get("qaytarildi") or 0)
        bir = _ts((n.get("birlik") or "dona").strip())
        summa = float(n.get("summa") or 0)
        jami += summa
        ms = _miq_str(miq)

        head = f"{i:>2}. "
        avail = w - len(head)
        for li, nl in enumerate(_wrap(nomi, max(avail, 6))):
            prefix = head if li == 0 else "    "
            lines.append((prefix + nl)[:w])

        left = f"     {ms} {bir}"
        lines.append(_lr_money(left, _money(summa), w))

        if i < len(natijalar):
            lines.append(_sep_mid(w))

    lines.append(_sep_heavy(w))
    lines.append(_lr_money("JAMI QAYTARISH", f"{_money(jami)} so'm", w))
    lines.append(_sep_heavy(w))
    lines.append(_sep_mid(w))
    lines.append("Xaridingiz uchun rahmat!".center(w)[:w])
    lines.append("@savdoai_mashrab_bot".center(w)[:w])
    lines.append(_sep_heavy(w))
    lines.append("")
    lines = [ln[:w] if len(ln) > w else ln for ln in lines]
    return "\n".join(lines)


def production_verification_samples(width_mm: int = 80) -> dict[str, str]:
    """
    Deterministik namunalar (test / dokumentatsiya): qisqa, uzun, aralash narx,
    ko'p miqdor, o'zbek / kirill.
    """
    base: dict = {
        "amal": "chiqim",
        "sessiya_id": 424242,
        "klient": "O'zbekiston Mijozi — Салимов",
        "tovarlar": [
            {"nomi": "A", "miqdor": 1, "birlik": "dona", "narx": 500, "jami": 500},
            {
                "nomi": "Juda uzun tovar nomi bo'lib — printer qatorlarga bo'linishi kerak",
                "miqdor": 3,
                "birlik": "dona",
                "narx": 1_234_567,
                "jami": 3_703_701,
            },
            {"nomi": "Arzon", "miqdor": 50, "birlik": "dona", "narx": 10, "jami": 500},
            {"nomi": "Кефир 1л", "miqdor": 2, "birlik": "dona", "narx": 18_000, "jami": 36_000},
        ],
        "jami_summa": 3_740_701,
        "qarz": 0,
        "tolangan": 3_740_701,
    }
    txt = format_thermal_receipt(base, "O'Rnatilgan DO'KON", width_mm)
    return {"full_mixed_uz_ru": txt}


def demo_thermal_receipt_preview_text(width_mm: int = 80) -> str:
    """Demo: short/long lines, high/low prices, gramm."""
    demo: dict = {
        "amal": "chiqim",
        "klient": "Test mijoz",
        "tovarlar": [
            {"nomi": "Ariel", "miqdor": 2, "birlik": "dona", "narx": 45000, "jami": 90000},
            {
                "nomi": "Juda uzun tovar nomi — printer qatorlarga bo'lishi kerak",
                "miqdor": 10,
                "birlik": "dona",
                "narx": 58000,
                "jami": 580000,
            },
            {"nomi": "Ign", "miqdor": 20, "birlik": "dona", "narx": 100, "jami": 2000},
            {"nomi": "Go'sht (kg)", "miqdor": 1.2, "birlik": "gramm", "narx": 120000, "jami": 144000},
        ],
        "jami_summa": 816000,
        "qarz": 0,
        "tolangan": 816000,
    }
    return format_thermal_receipt(demo, "DEMO DO'KON", width_mm)
