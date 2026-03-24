"""SavdoAI ESC/POS — 80mm (48ch) + 58mm (32ch).

Thermal printers expect a single-byte code page (CP866/CP1251), not raw UTF-8.
Sending UTF-8 bytes makes non-ASCII lines print as garbage on typical Xprinter firmware.
"""
from __future__ import annotations

import datetime
import os
import re
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

try:
    import pytz

    TZ = pytz.timezone("Asia/Tashkent")
except Exception:
    TZ = None

# ESC/POS: select character code table (Epson-compatible; Xprinter clones often follow).
# n=17: PC866 / Cyrillic on many TM-T and ESC/POS devices. Must match ESCPOS_TEXT_ENCODING.
_ESCPOS_TABLE_DEFAULT = int(os.environ.get("ESCPOS_CODE_PAGE", "17"), 10)
# Body text encoding: cp866 (default) or cp1251 — must match printer firmware + ESC t n.
_TEXT_ENCODING = (os.environ.get("ESCPOS_TEXT_ENCODING", "cp866") or "cp866").lower()


class CMD:
    INIT = b"\x1B\x40"
    BOLD_ON = b"\x1B\x45\x01"
    BOLD_OFF = b"\x1B\x45\x00"
    DBL_ON = b"\x1B\x21\x30"
    DBL_OFF = b"\x1B\x21\x00"
    WIDE_ON = b"\x1B\x21\x20"
    WIDE_OFF = b"\x1B\x21\x00"
    CENTER = b"\x1B\x61\x01"
    LEFT = b"\x1B\x61\x00"
    FEED5 = b"\x1B\x64\x05"
    FEED7 = b"\x1B\x64\x07"
    CUT = b"\x1D\x56\x42\x03"
    BEEP = b"\x1B\x42\x03\x02"
    LNSP = b"\x1B\x32"


def esc_select_code_page(table: int | None = None) -> bytes:
    """ESC t n — select character code table before text."""
    n = _ESCPOS_TABLE_DEFAULT if table is None else table
    n = max(0, min(255, int(n)))
    return bytes([0x1B, 0x74, n])


def _transliterate_uzbek_latin(s: str) -> str:
    """Map Latin Uzbek apostrophe letters to plain ASCII; sh/ch stay ASCII."""
    if not s:
        return ""
    t = s
    for ch in ("\u2018", "\u2019", "\u02bc", "\u201b", "`"):
        t = t.replace(ch, "'")
    t = re.sub(r"O['\u2019]", "O", t)
    t = re.sub(r"o['\u2019]", "o", t)
    t = re.sub(r"G['\u2019]", "G", t)
    t = re.sub(r"g['\u2019]", "g", t)
    t = t.replace("Ō", "O").replace("ō", "o")
    t = t.replace("Ğ", "G").replace("ğ", "g")
    t = re.sub(r"(?i)o'", "o", t)
    t = re.sub(r"(?i)g'", "g", t)
    # Drop symbols that cheap printers mishandle; keep ASCII + Cyrillic
    t = re.sub(r"[^\x20-\x7E\u0400-\u04FF]", "", t)
    return t


def _ascii_separators_line(s: str) -> str:
    """Replace fancy Unicode separators with ASCII."""
    return (
        s.replace("═", "=")
        .replace("─", "-")
        .replace("·", ".")
        .replace("—", "-")
        .replace("–", "-")
    )


def _encode_escpos_payload(s: str) -> bytes:
    """
    Encode text for the active ESC/POS code table (one encoding per receipt; no UTF-8).
    Primary: CP866 (matches ESC t 17 on many devices). Optional: cp1251 via ESCPOS_TEXT_ENCODING
    if you also set ESCPOS_CODE_PAGE to the matching table for your printer manual.
    """
    t = _transliterate_uzbek_latin(s)
    t = _ascii_separators_line(t)
    enc = _TEXT_ENCODING if _TEXT_ENCODING in ("cp866", "cp1251") else "cp866"
    try:
        return t.encode(enc, errors="replace")
    except LookupError:
        return t.encode("cp866", errors="replace")


def _encode_escpos_line_with_nl(line: str) -> bytes:
    return _encode_escpos_payload(line) + b"\n"


def _chars(w: int) -> int:
    return 32 if w <= 58 else 48


def _money(n: Any) -> str:
    try:
        v = int(Decimal(str(n)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    except Exception:
        v = 0
    return f"{v:,}".replace(",", " ")


def _miq(v: float) -> str:
    return f"{v:.3f}".rstrip("0").rstrip(".") or "0"


def _pad(l: str, r: str, w: int) -> str:
    r = r.strip()
    if len(l) > w - len(r) - 1:
        l = l[: w - len(r) - 1]
    return l + " " * max(1, w - len(l) - len(r)) + r


def _wrap(t: str, w: int) -> list[str]:
    if len(t) <= w:
        return [t]
    lines = []
    while t:
        if len(t) <= w:
            lines.append(t)
            break
        sp = t[:w].rfind(" ")
        if sp > w // 3:
            lines.append(t[:sp])
            t = t[sp:].strip()
        else:
            lines.append(t[:w])
            t = t[w:].strip()
    return lines or [""]


class Receipt:
    def __init__(self, w: int = 80) -> None:
        self.w = w
        self.c = _chars(w)
        self._b = bytearray()
        self._code_page_sent = False

    def _cmd(self, *c: bytes) -> None:
        for x in c:
            self._b.extend(x)

    def _ensure_code_page(self) -> None:
        if not self._code_page_sent:
            self._cmd(esc_select_code_page())
            self._code_page_sent = True

    def _txt(self, t: str) -> None:
        self._ensure_code_page()
        self._b.extend(_encode_escpos_payload(t))

    def _ln(self, t: str = "") -> None:
        self._ensure_code_page()
        self._b.extend(_encode_escpos_line_with_nl(t))

    def init(self) -> Receipt:
        self._cmd(CMD.INIT, CMD.LNSP)
        self._code_page_sent = False
        self._cmd(esc_select_code_page())
        self._code_page_sent = True
        return self

    def sep_h(self) -> Receipt:
        self._cmd(CMD.BOLD_ON)
        self._ln("=" * self.c)
        self._cmd(CMD.BOLD_OFF)
        return self

    def sep(self) -> Receipt:
        self._ln("-" * self.c)
        return self

    def sep_d(self) -> Receipt:
        self._ln("." * self.c)
        return self

    def title(self, t: str) -> Receipt:
        self._cmd(CMD.CENTER, CMD.DBL_ON, CMD.BOLD_ON)
        self._ln(t[: self.c // 2])
        self._cmd(CMD.DBL_OFF, CMD.BOLD_OFF, CMD.LEFT)
        return self

    def sub(self, t: str) -> Receipt:
        self._cmd(CMD.CENTER, CMD.BOLD_ON)
        self._ln(t[: self.c])
        self._cmd(CMD.BOLD_OFF, CMD.LEFT)
        return self

    def center(self, t: str) -> Receipt:
        self._cmd(CMD.CENTER)
        self._ln(t[: self.c])
        self._cmd(CMD.LEFT)
        return self

    def info(self, l: str, v: str, bold: bool = False) -> Receipt:
        if bold:
            self._cmd(CMD.BOLD_ON)
        self._ln(_pad(l, v, self.c))
        if bold:
            self._cmd(CMD.BOLD_OFF)
        return self

    def left(self, t: str, bold: bool = False) -> Receipt:
        if bold:
            self._cmd(CMD.BOLD_ON)
        for ln in _wrap(t, self.c):
            self._ln(ln)
        if bold:
            self._cmd(CMD.BOLD_OFF)
        return self

    def total(self, lab: str, amt: str) -> Receipt:
        h = self.c // 2
        need = len(lab) + 1 + len(amt.strip())
        if h >= need:
            self._cmd(CMD.WIDE_ON, CMD.BOLD_ON)
            self._ln(_pad(lab, amt, h))
            self._cmd(CMD.WIDE_OFF, CMD.BOLD_OFF, CMD.DBL_OFF)
        else:
            self._cmd(CMD.BOLD_ON)
            self._ln(_pad(lab, amt, self.c))
            self._cmd(CMD.BOLD_OFF)
        return self

    def feed(self, n: int = 5) -> Receipt:
        self._cmd(b"\x1B\x64" + bytes([min(n, 20)]))
        return self

    def cut(self) -> Receipt:
        self._cmd(CMD.CUT)
        return self

    def beep(self) -> Receipt:
        self._cmd(CMD.BEEP)
        return self

    def build(self) -> bytes:
        return bytes(self._b)


def printer_encoding_self_test_bytes(width: int = 48, do_cut: bool = True) -> bytes:
    """
    Short ESC/POS sample for hardware encoding check (ASCII + Cyrillic line).
    """
    r = Receipt(width)
    r.init()
    r._ln("TEST CHEK")
    r._ln("SALOM")
    r._ln("JAMI: 150000")
    r._ln("KIRILL: Tovar primer")
    r._ln("Кириллица: пример строки")
    r.feed(5)
    if do_cut:
        r.cut()
    return r.build()


def sotuv_cheki(
    data: dict,
    dokon: str = "SAVDOAI",
    tel: str = "",
    manzil: str = "",
    width: int = 80,
    do_cut: bool = True,
    do_beep: bool = False,
) -> bytes:
    r = Receipt(width)
    w = r.c
    r.init().sep_h().title(dokon.upper())
    r.center("Mashrab Moliya")
    if tel:
        r.center(f"Tel: {tel}")
    if manzil:
        r.center(manzil[:w])
    r.sep()
    now = (
        datetime.datetime.now(TZ).strftime("%d.%m.%Y %H:%M")
        if TZ
        else datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
    )
    amal = (data.get("amal") or "chiqim").lower()
    am = {
        "kirim": "KIRIM",
        "chiqim": "SOTUV",
        "qaytarish": "QAYTARISH",
        "nakladnoy": "NAKLADNOY",
        "qarz_tolash": "QARZ",
    }
    sess = data.get("sessiya_id") or data.get("raqam") or ""
    if sess:
        r.info(f"Chek: #{sess}", am.get(amal, "SOTUV"))
    else:
        r.sub(am.get(amal, "SOTUV"))
    r.info("Sana:", now)
    manba = (data.get("manba") or "").strip()
    if manba and amal == "kirim":
        r.info("Manba:", manba, bold=True)
    klient = (data.get("klient") or data.get("klient_ismi") or "").strip()
    if klient:
        r.info("Mijoz:", klient, bold=True)
    r.sep()
    for i, t in enumerate(data.get("tovarlar") or [], 1):
        nomi = (t.get("nomi") or "?").strip()
        miq = float(t.get("miqdor") or 0)
        bir = (t.get("birlik") or "dona").strip()
        narx = float(t.get("narx") or t.get("sotish_narxi") or 0)
        jami = float(t.get("jami") or 0) or (miq * narx)
        r.left(f"{i}. {nomi}", bold=True)
        ms = _miq(miq)
        if bir == "gramm":
            det = f"{ms} g x {_money(narx)}/kg"
        elif bir == "kg":
            det = f"{ms} kg x {_money(narx)}"
        elif bir in ("dona", ""):
            det = f"{ms} x {_money(narx)}"
        else:
            det = f"{ms} {bir} x {_money(narx)}"
        pf = "     " if width >= 80 else "  "
        r._ln(_pad(f"{pf}{det}", f"= {_money(jami)}", w))
    r.sep_d()
    jami_s = float(data.get("jami_summa") or 0)
    xf = float(data.get("xizmat_foiz") or 0)
    if xf > 0:
        xs = jami_s * xf / 100
        r.info(f"Xizmat {xf:.0f}%", _money(xs), bold=True)
        jami_s += xs
    r.sep_h()
    r.total("JAMI:", f"{_money(jami_s)} so'm")
    r.sep_h()
    qarz = float(data.get("qarz") or 0)
    tol = float(data.get("tolangan") or 0)
    if tol <= 0 and qarz > 0:
        tol = max(jami_s - qarz, 0)
    elif tol <= 0:
        tol = jami_s
    if qarz > 0:
        r.info("Tolangan:", f"{_money(tol)} so'm", bold=True)
        r.total("QARZ:", f"{_money(qarz)} so'm")
        r.sep()
    eski = float(data.get("eski_qarz") or 0)
    if eski > 0:
        r.info("ESKI QARZ:", f"{_money(eski)} so'm", bold=True)
        r.info("JAMI QARZ:", f"{_money(qarz + eski)} so'm", bold=True)
        r.sep()
    r._ln("")
    r.sub("Xaridingiz uchun rahmat!")
    r.center("@savdoai_mashrab_bot")
    if do_beep:
        r.beep()
    r.feed(7 if width >= 80 else 5)
    if do_cut:
        r.cut()
    return r.build()
