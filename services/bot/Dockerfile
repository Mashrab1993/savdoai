FROM python:3.12-slim

# ffmpeg for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies (torch CPU-only — CUDA kerak emas, 1.5GB tejaydi)
COPY services/bot/requirements.txt .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# Copy shared library
COPY shared /app/shared

# Copy bot service
COPY services/bot /app/services/bot

# Copy cognitive (ixtiyoriy — Dual-Brain MoE uchun)
COPY services/cognitive /app/services/cognitive

# Set working directory to bot service
WORKDIR /app/services/bot

ENV PYTHONPATH=/app

CMD ["python", "main.py"]
