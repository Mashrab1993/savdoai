# Root Dockerfile — Railway default (savdoai-api)
# Build context: repo root
FROM python:3.12-slim

WORKDIR /app

COPY services/api/requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY shared /app/shared
COPY services/api /app/services/api

WORKDIR /app/services/api

ENV PYTHONPATH=/app

RUN chmod +x /app/services/api/start.sh 2>/dev/null || true

EXPOSE 8000

CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
