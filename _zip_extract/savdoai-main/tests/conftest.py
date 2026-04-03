"""
pytest configuration: adds repo root to sys.path so
  'from shared.utils.hisob import ...' and
  'from services.bot.db import ...'
work without PYTHONPATH tricks.

Windows: default text encoding is often cp1251/cp1252; repo sources are UTF-8.
Mirror CI/Linux by defaulting text-mode open() to UTF-8 for all tests.
"""
import builtins
import sys
from pathlib import Path

# Repo root = two levels up from tests/
REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT))

_real_open = builtins.open


def _open_utf8_default(file, mode="r", buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None):
    if encoding is None and "b" not in mode:
        encoding = "utf-8"
    return _real_open(
        file, mode, buffering, encoding, errors, newline, closefd, opener
    )


builtins.open = _open_utf8_default  # type: ignore[misc, assignment]
