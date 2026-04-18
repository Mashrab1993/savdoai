#!/usr/bin/env python3
"""
Voice Intent Audit Scanner v25.6 — xavfli substring match'larni topadi.

Ishlatish:
  python3 scripts/voice_intent_audit.py

Natija:
  1. Har intent uchun keyword ro'yxati
  2. SHUBHALI PATTERNS: ikki keyword prefix/suffix collision
  3. WORD-BOUNDARY QILISH TAVSIYA qilingan joylar
  4. JAMI NECHA TA "xavfli" collision topildi
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

VOICE_MASTER = Path(__file__).resolve().parent.parent / "services/bot/handlers/voice_master.py"


def extract_keywords_from_file(path: Path) -> list[tuple[int, str, list[str]]]:
    """voice_master.py'dan har intent uchun (qator, type, keywords) ajratish."""
    src = path.read_text(encoding="utf-8")
    results = []

    # _any(m, ("a", "b", ...))
    for m in re.finditer(
        r'(_any)\(m,\s*\(\s*((?:"[^"]+"(?:,\s*)?)+)\s*\)',
        src, re.DOTALL
    ):
        line = src[:m.start()].count('\n') + 1
        kws = re.findall(r'"([^"]+)"', m.group(2))
        if kws:
            results.append((line, "_any", kws))

    # any(kw in m for kw in ("a", "b", ...))
    for m in re.finditer(
        r'any\(kw in m for kw in \(\s*((?:"[^"]+"(?:,\s*)?)+)\s*\)\)',
        src, re.DOTALL
    ):
        line = src[:m.start()].count('\n') + 1
        kws = re.findall(r'"([^"]+)"', m.group(1))
        if kws:
            results.append((line, "any_kw_in_m", kws))

    return results


def detect_risky_substrings(all_keywords: set[str]) -> list[tuple[str, str]]:
    """Har juft keyword ni tekshir — biri ikkinchisining prefix/substring?"""
    risky = []
    kws = sorted(all_keywords, key=len)
    for i, a in enumerate(kws):
        for b in kws[i + 1:]:
            if a == b:
                continue
            if a in b and len(a) >= 4:
                # "narx" substring "yangi narx" ichida — ikki intent'ni adashtirib yuborishi mumkin
                risky.append((a, b))
    return risky


def main() -> int:
    if not VOICE_MASTER.exists():
        print(f"❌ Fayl topilmadi: {VOICE_MASTER}")
        return 1

    intents = extract_keywords_from_file(VOICE_MASTER)

    all_kws: set[str] = set()
    print("=" * 70)
    print(f" VOICE INTENT AUDIT — {VOICE_MASTER.name}")
    print("=" * 70)
    print(f"\n📊 JAMI {len(intents)} ta intent branch topildi:")

    for line, kind, kws in intents:
        print(f"\n  ─ Qator {line} ({kind}) — {len(kws)} keyword:")
        for kw in kws[:5]:
            print(f"      • '{kw}'")
        if len(kws) > 5:
            print(f"      ... +{len(kws) - 5} ta yana")
        all_kws.update(kws)

    print(f"\n\n📈 UMUMIY METRIKA:")
    print(f"  • Jami unique keyword: {len(all_kws)}")
    print(f"  • O'rtacha keyword/intent: {len(all_kws) / max(1, len(intents)):.1f}")

    # Risky substring detection
    risky = detect_risky_substrings(all_kws)
    print(f"\n🔴 XAVFLI PREFIX/SUBSTRING JUFTLAR: {len(risky)}")
    if risky:
        print("  (bular word-boundary bilan tuzatilishi kerak)\n")
        for a, b in risky[:15]:
            print(f"  ⚠️  '{a}'  →  ichida bor  '{b}'")
            print(f"      Risk: '{a}' keyword '{b}' ni noto'g'ri match qiladi")
        if len(risky) > 15:
            print(f"  ... va yana {len(risky) - 15} ta juft")

    # Known false-positive patterns
    print(f"\n🐛 MA'LUM FALSE-POSITIVE PATTERN:")
    false_positives = [
        ("bekor qil", "bekor qilmay", "negative (qilmay) substring ichidagi positive"),
        ("tasdiqla", "tasdiqlamay", "negative -may suffiks"),
        ("kirim", "shokirim", "inside another word"),
        ("narx", "narxlar yangi", "general word inside specific"),
    ]
    for kw, fake, reason in false_positives:
        in_kws = kw in all_kws
        print(f"  • '{kw}' → '{fake}': {reason} {'[ISHLATILADI]' if in_kws else ''}")

    # Recommendations
    print(f"\n💡 TAVSIYALAR:")
    print(f"  1. _any() ni _any_word() ga o'zgartirish — word-boundary match")
    print(f"  2. 'bekor qilmay', 'tasdiqlamay' kabi negation rule qo'shish")
    print(f"  3. Intent priority test suite yaratish (tests/test_voice_intents.py YARATILGAN ✅)")
    print(f"  4. STT prompt cache invalidation — API yangi tovar qo'shganida")

    print("\n" + "=" * 70)
    return 0 if len(risky) < 20 else 1  # 20+ risky pair — warning


if __name__ == "__main__":
    sys.exit(main())
