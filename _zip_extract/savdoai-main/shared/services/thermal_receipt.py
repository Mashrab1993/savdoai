"""
80mm / 58mm thermal receipt — text-first, monospaced, compact premium POS layout.

Priorities: tight vertical rhythm, strong hierarchy, ESC/POS bold on key lines.
Thermal path is primary; PDF is archive-only elsewhere.
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
        ("\u2014", "-"),
        ("\u2013", "-"),
        ("\u2212", "-"),
        ("\u2018", "'"),
        ("\u2019", "'"),
        ("\u02bc", "'"),
        ("\u201c", '"'),
        ("\u201d", '"'),
        ("\ufeff", ""),
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


def _clip_line(s: str, w: int) -> str:
    return s[:w] if len(s) > w else s


Row = tuple[str, bool]


def _format_thermal_receipt_lines(
    data: dict,
    dokon: str = "",
    width_mm: int = 80,
) -> list[Row]:
    """Build (line, escpos_bold) rows — compact, strong hierarchy."""
    w = _w(width_mm)
    rows: list[Row] = []

    def add(line: str, bold: bool = False) -> None:
        rows.append((_clip_line(line, w), bold))

    amal = (data.get("amal") or "chiqim").lower()
    dokon_l = _ts((dokon or "SAVDOAI").strip())[: w - 2]
    title = dokon_l.upper()

    add(_sep_heavy(w), True)
    add(title.center(w)[:w], True)
    add("MASHRAB MOLIYA".center(w)[:w], False)

    now = datetime.datetime.now(TZ).strftime("%d.%m.%Y  %H:%M")
    rid = data.get("sessiya_id") or data.get("chek_raqami") or data.get("raqam")
    chek_left = f"Chek № {rid}" if rid is not None else "Chek №"
    add(_lr_money(chek_left, now, w), True)

    amal_map = {
        "kirim": "KIRIM",
        "chiqim": "SOTUV",
        "qaytarish": "QAYTARISH",
        "qarz_tolash": "QARZ TO'LASH",
        "nakladnoy": "NAKLADNOY",
    }
    add(amal_map.get(amal, "SOTUV").center(w)[:w], True)
    add(_sep_mid(w), False)

    if amal == "kirim" and data.get("manba"):
        for ln in _wrap(f"Manba: {_ts(str(data['manba']))}", w):
            add(ln, True)
        add(_sep_mid(w), False)

    klient = _ts((data.get("klient") or data.get("klient_ismi") or "").strip())
    if klient:
        for ln in _wrap(f"Mijoz: {klient}", w):
            add(ln, True)
        add(_sep_mid(w), False)

    add(_lr_money("TOVAR NOMI", "JAMI (so'm)", w), True)

    tovarlar = data.get("tovarlar") or []
    for i, t in enumerate(tovarlar, 1):
        nomi = _ts((t.get("nomi") or t.get("tovar_nomi") or "?").strip())
        miq = float(t.get("miqdor") or 0)
        bir = _ts((t.get("birlik") or "dona").strip())
        narx = float(t.get("narx") or t.get("sotish_narxi") or 0)
        jami = float(t.get("jami") or 0) or (miq * narx)
        ms = _miq_str(miq)

        head = f"{i:>2}. "
        avail = w - len(head)
        wrapped = _wrap(nomi, max(avail, 6))
        for li, nl in enumerate(wrapped):
            prefix = head if li == 0 else "    "
            add((prefix + nl)[:w], True)

        if narx:
            if bir == "gramm":
                left = f"     {ms} g x {_money(narx)}/kg"
            else:
                left = f"     {ms} {bir} x {_money(narx)}"
        else:
            left = f"     {ms} {bir}"

        add(_lr_money(left, _money(jami), w), True)

    add(_sep_heavy(w), True)

    jami_s = float(data.get("jami_summa") or 0)
    add(_lr_money("JAMI", f"{_money(jami_s)} so'm", w), True)
    add(_sep_heavy(w), True)

    qarz = float(data.get("qarz") or 0)
    jami_s_calc = float(data.get("jami_summa") or 0)
    tol = float(data.get("tolangan") or 0)
    if tol <= 0 and qarz > 0:
        tol = max(jami_s_calc - qarz, 0)
    elif tol <= 0:
        tol = jami_s_calc

    if qarz > 0:
        add(_lr_money("To'langan", _money(tol), w), True)
        add(_lr_money("QARZ", _money(qarz), w), True)
        add(_sep_mid(w), False)

    eski_qarz = float(data.get("eski_qarz") or 0)
    if eski_qarz > 0:
        add(_lr_money("ESKI QARZ", _money(eski_qarz), w), True)
        jq = qarz + eski_qarz
        add(_lr_money("JAMI QARZ", _money(jq), w), True)
        add(_sep_mid(w), False)

    if data.get("manba") and amal != "kirim":
        for ln in _wrap(f"Manba: {_ts(str(data['manba']))}", w):
            add(ln, False)

    add("Xaridingiz uchun rahmat!".center(w)[:w], True)
    add("@savdoai_mashrab_bot".center(w)[:w], True)
    return rows


def format_thermal_receipt(
    data: dict,
    dokon: str = "",
    width_mm: int = 80,
) -> str:
    lines = [ln for ln, _ in _format_thermal_receipt_lines(data, dokon, width_mm)]
    return "\n".join(lines)


def thermal_receipt_utf8_bytes(data: dict, dokon: str = "", width_mm: int = 80) -> bytes:
    return format_thermal_receipt(data, dokon, width_mm).encode("utf-8")


def _escpos_line(line: bytes, bold: bool) -> bytes:
    if bold:
        return b"\x1B\x45\x01" + line + b"\x1B\x45\x00\n"
    return line + b"\n"


def _line_bold_escpos(raw_line: str, w: int) -> bool:
    """Legacy heuristic for tests / callers without structured rows."""
    s = raw_line.strip()
    if not s:
        return False
    if len(s) >= w - 2 and set(s) <= {"="}:
        return True
    if re.match(r"^\s*\d{1,2}\.\s", raw_line):
        return True
    if s.startswith("JAMI"):
        return True
    if s.startswith("Chek №"):
        return True
    if " x " in raw_line and re.search(r"\s+\d", raw_line):
        return True
    return False


def thermal_receipt_escpos_utf8(data: dict, dokon: str = "", width_mm: int = 80) -> bytes:
    """ESC/POS init + UTF-8; bold flags from layout (not heuristics)."""
    rows = _format_thermal_receipt_lines(data, dokon, width_mm)
    out = bytearray(b"\x1B\x40")
    for raw_line, bold in rows:
        line = raw_line.encode("utf-8")
        out.extend(_escpos_line(line, bold))
    return bytes(out)


def _format_qaytarish_lines(
    natijalar: list[dict],
    dokon: str = "",
    width_mm: int = 80,
) -> list[Row]:
    w = _w(width_mm)
    rows: list[Row] = []

    def add(line: str, bold: bool = False) -> None:
        rows.append((_clip_line(line, w), bold))

    dokon_l = _ts((dokon or "SAVDOAI").strip())[: w - 2]
    add(_sep_heavy(w), True)
    add("QAYTARISH".center(w)[:w], True)
    add(dokon_l.upper().center(w)[:w], True)
    add("MASHRAB MOLIYA".center(w)[:w], False)
    now = datetime.datetime.now(TZ).strftime("%d.%m.%Y  %H:%M")
    add(_lr_money("Chek №", now, w), True)
    add(_sep_mid(w), False)

    klient = _ts(next((n.get("klient") for n in natijalar if n.get("klient")), "") or "")
    if klient:
        for ln in _wrap(f"Mijoz: {klient}", w):
            add(ln, True)
        add(_sep_mid(w), False)

    add(_lr_money("TOVAR NOMI", "JAMI (so'm)", w), True)

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
            add((prefix + nl)[:w], True)

        left = f"     {ms} {bir}"
        add(_lr_money(left, _money(summa), w), True)

    add(_sep_heavy(w), True)
    add(_lr_money("JAMI QAYTARISH", f"{_money(jami)} so'm", w), True)
    add(_sep_heavy(w), True)
    add("Xaridingiz uchun rahmat!".center(w)[:w], True)
    add("@savdoai_mashrab_bot".center(w)[:w], True)
    return rows


def format_qaytarish_receipt(
    natijalar: list[dict],
    dokon: str = "",
    width_mm: int = 80,
) -> str:
    lines = [ln for ln, _ in _format_qaytarish_lines(natijalar, dokon, width_mm)]
    return "\n".join(lines)


def production_verification_samples(width_mm: int = 80) -> dict[str, str]:
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
