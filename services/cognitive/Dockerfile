FROM python:3.12-slim

WORKDIR /app

COPY services/cognitive/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY shared /app/shared
COPY services/cognitive /app/services/cognitive

WORKDIR /app/services/cognitive

ENV PYTHONPATH=/app

RUN chmod +x /app/services/cognitive/start.sh

# api:app - cognitive service entry is api.py not main.py
ENTRYPOINT ["/app/services/cognitive/start.sh"]
