"""
pytest configuration: adds repo root to sys.path so
  'from shared.utils.hisob import ...' and
  'from services.bot.db import ...'
work without PYTHONPATH tricks.
"""
import sys
from pathlib import Path

# Repo root = two levels up from tests/
REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(REPO_ROOT))
