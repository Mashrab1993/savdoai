#!/usr/bin/env python3
"""Print real thermal receipt samples (UTF-8). Run from repo root: python scripts/print_thermal_sample.py"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from shared.services.thermal_receipt import (  # noqa: E402
    demo_thermal_receipt_preview_text,
    production_verification_samples,
)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    print("=== production_verification_samples['full_mixed_uz_ru'] ===\n")
    print(production_verification_samples(80)["full_mixed_uz_ru"])
    print("\n=== demo_thermal_receipt_preview_text(80) ===\n")
    print(demo_thermal_receipt_preview_text(80))


if __name__ == "__main__":
    main()
