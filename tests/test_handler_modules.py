"""Handler modullari (v25.3.1) — import va eksport tekshiruvi."""
from __future__ import annotations

import importlib
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parent.parent

_HANDLER_EXPORTS: list[tuple[str, str]] = [
    ("services.bot.handlers.savdo", "tasdiq_cb"),
    ("services.bot.handlers.savdo", "_chek_thermal_va_pdf_yuborish"),
    ("services.bot.handlers.savdo", "_qayta_ishlash"),
    ("services.bot.handlers.savdo", "_nakladnoy_yuborish"),
    ("services.bot.handlers.savdo", "_audit_sotuv"),
    ("services.bot.handlers.savdo", "_audit_kirim"),
    ("services.bot.handlers.savdo", "_audit_qaytarish"),
    ("services.bot.handlers.savdo", "_audit_qarz_tolash"),
    ("services.bot.handlers.savdo", "_savat_qosh_va_javob"),
    ("services.bot.handlers.savdo", "_savat_yop_va_nakladnoy"),
    ("services.bot.handlers.commands", "cmd_menyu"),
    ("services.bot.handlers.commands", "cmd_kassa"),
    ("services.bot.handlers.commands", "cmd_hisobot"),
    ("services.bot.handlers.commands", "cmd_chiqim"),
    ("services.bot.handlers.commands", "cmd_savat"),
    ("services.bot.handlers.commands", "inline_qidirish"),
    ("services.bot.handlers.callbacks", "menyu_cb"),
    ("services.bot.handlers.callbacks", "eksport_cb"),
    ("services.bot.handlers.callbacks", "hisobot_cb"),
    ("services.bot.handlers.callbacks", "faktura_cb"),
    ("services.bot.handlers.callbacks", "admin_cb"),
    ("services.bot.handlers.callbacks", "_tezkor_cb"),
    ("services.bot.handlers.matn", "matn_qabul"),
    ("services.bot.handlers.hujjat", "hujjat_qabul"),
]


@pytest.mark.parametrize("module,name", _HANDLER_EXPORTS)
def test_handler_export_mavjud(module: str, name: str) -> None:
    mod = importlib.import_module(module)
    assert hasattr(mod, name), f"{module}.{name} yo'q"
    assert callable(getattr(mod, name))


def test_migration_008_mavjud() -> None:
    p = REPO / "shared" / "migrations" / "versions" / "008_v25_3_rls_himoya.sql"
    assert p.is_file()
    body = p.read_text(encoding="utf-8")
    assert "enable_rls('kassa_operatsiyalar')" in body
    assert "enable_rls('audit_log')" in body


def test_main_handler_importlarga_ulanadi() -> None:
    main_src = (REPO / "services" / "bot" / "main.py").read_text(encoding="utf-8")
    assert "from services.bot.handlers.savdo import" in main_src
    assert "from services.bot.handlers.commands import" in main_src
    assert "from services.bot.handlers.callbacks import" in main_src
    assert "from services.bot.handlers.matn import matn_qabul" in main_src
    assert "from services.bot.handlers.hujjat import hujjat_qabul" in main_src


def test_main_py_modullashtirilgan() -> None:
    """main.py yagona megafayl bo'lib qolmagan."""
    lines = (REPO / "services" / "bot" / "main.py").read_text(encoding="utf-8").count("\n")
    assert lines < 2000, f"main.py juda uzun: {lines} qator"
