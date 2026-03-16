FROM python:3.12-slim

WORKDIR /app

COPY services/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY shared /app/shared
COPY services/api /app/services/api

WORKDIR /app/services/api

ENV PYTHONPATH=/app

RUN chmod +x /app/services/api/start.sh

ENTRYPOINT ["/app/services/api/start.sh"]
