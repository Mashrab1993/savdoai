# Mashrab Moliya — Barcha servislarni alohida oynalarda ishga tushirish
# 1) docker-compose up -d
# 2) .\scripts\init_db.ps1
# 3) .env da BOT_TOKEN, GEMINI_API_KEY, ANTHROPIC_API_KEY to'ldiring
# 4) .\scripts\run_all.ps1

$root = "c:\Users\Mashrab Hacker\OneDrive\Desktop\savdoai"
Set-Location $root

# Muhitni yuklash
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$env:PYTHONPATH = $root

Write-Host "1) API (port 8000) — yangi oyna" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; `$env:PYTHONPATH='$root'; uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "2) Cognitive (port 8001) — yangi oyna" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; `$env:PYTHONPATH='$root'; uvicorn services.cognitive.api:app --host 0.0.0.0 --port 8001 --reload"

Start-Sleep -Seconds 2

Write-Host "3) Worker (Celery) — yangi oyna" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; `$env:PYTHONPATH='$root'; celery -A services.worker.tasks worker --loglevel=info --pool=solo"

Start-Sleep -Seconds 2

Write-Host "4) Bot — yangi oyna" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; `$env:PYTHONPATH='$root'; python -m services.bot.main"

Write-Host "`nBarcha servislar yangi oynalarda ishga tushdi." -ForegroundColor Green
Write-Host "API: http://localhost:8000/health" -ForegroundColor Yellow
Write-Host "Cognitive: http://localhost:8001/health" -ForegroundColor Yellow
