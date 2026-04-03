# ═══════════════════════════════════════════════════════════
#  SavdoAI v25.3.2 — Production Dockerfile
#  Multi-stage build: 380MB → ~180MB final image
# ═══════════════════════════════════════════════════════════

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    TZ=Asia/Tashkent

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Dependencies ──
COPY requirements.txt .
COPY services/api/requirements.txt services/api/requirements.txt
COPY services/bot/requirements.txt services/bot/requirements.txt

RUN pip install --no-cache-dir \
    -r requirements.txt \
    -r services/api/requirements.txt \
    -r services/bot/requirements.txt

# ── Application code ──
COPY shared/ shared/
COPY services/ services/

# ── Health check ──
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/healthz || exit 1

# ── Default: API server ──
EXPOSE ${PORT:-8000}
CMD ["sh", "-c", "cd /app && python -m uvicorn services.api.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --log-level info"]
