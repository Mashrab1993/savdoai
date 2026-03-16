#!/bin/sh
# Railway/container har doim python -m uvicorn ishlatadi (PATH dan qat'iy nazar)
set -e
exec python -m uvicorn api:app --host 0.0.0.0 --port "${PORT:-8001}" --workers 2
