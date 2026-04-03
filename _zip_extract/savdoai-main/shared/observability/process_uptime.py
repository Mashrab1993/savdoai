"""Jarayon boshlangan vaqt — crash/restart ajratish uchun."""
from __future__ import annotations

import os
import time

# Modul importida bir marta (yangi process = yangi qiymat)
STARTED_AT_WALL: float = time.time()
PID: int = os.getpid()


def uptime_s() -> float:
    return round(time.time() - STARTED_AT_WALL, 3)


def process_info() -> dict:
    return {
        "pid": PID,
        "started_at_unix": round(STARTED_AT_WALL, 3),
        "uptime_s": uptime_s(),
    }
