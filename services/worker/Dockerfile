FROM python:3.12-slim

# postgresql-client for pg_dump backup task
RUN apt-get update && apt-get install -y --no-install-recommends     postgresql-client     && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY services/worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY shared /app/shared
COPY services/worker /app/services/worker

WORKDIR /app/services/worker

ENV PYTHONPATH=/app

CMD ["celery", "-A", "tasks", "worker", "--loglevel=info", "--concurrency=2"]
