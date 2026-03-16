# Nixpacks/Railway fallback — Dockerfile ishlatilmasa
# API servisi uchun (asosiy web)
web: cd services/api && python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 4
