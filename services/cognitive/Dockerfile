FROM python:3.12-slim

WORKDIR /app

COPY services/cognitive/requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY shared /app/shared
COPY services/cognitive /app/services/cognitive

WORKDIR /app/services/cognitive

ENV PYTHONPATH=/app

# api:app - cognitive service entry is api.py not main.py
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8001} --workers 2"]
