# Mashrab Moliya — Bazani boshlash (schema + migrations)
# Ishga tushirish: .\scripts\init_db.ps1
# Oldin: docker-compose up -d (PostgreSQL ishlashi kerak)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$env:PGPASSWORD = "postgres"

$schemaPath = Join-Path $root "shared\database\schema.sql"
$m1 = Join-Path $root "shared\migrations\versions\001_v21_3_kassa_vision_faktura.sql"
$m2 = Join-Path $root "shared\migrations\versions\002_v21_5_sap_grade_ledger.sql"

if (-not (Test-Path $schemaPath)) {
    Write-Error "Schema topilmadi: $schemaPath"
}

Write-Host "PostgreSQL ga ulanish..." -ForegroundColor Cyan
$conn = "postgresql://postgres:postgres@localhost:5432/mashrab"

# psql mavjudligini tekshirish; bo'lmasa Docker orqali
$psql = Get-Command psql -ErrorAction SilentlyContinue
$useDocker = $false
if (-not $psql) {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
        $useDocker = $true
        Write-Host "psql topilmadi; Docker orqali bajariladi." -ForegroundColor Yellow
    } else {
        Write-Host "psql va docker topilmadi. PostgreSQL client yoki Docker Desktop o'rnating." -ForegroundColor Red
        exit 1
    }
}

function Run-Sql($path) {
    if ($useDocker) {
        Get-Content $path -Raw | docker exec -i mashrab_postgres psql -U postgres -d mashrab
    } else {
        & psql $conn -f $path
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Schema yuklanmoqda..." -ForegroundColor Green
Run-Sql $schemaPath

if (Test-Path $m1) {
    Write-Host "Migration 001 yuklanmoqda..." -ForegroundColor Green
    Run-Sql $m1
}

if (Test-Path $m2) {
    Write-Host "Migration 002 yuklanmoqda..." -ForegroundColor Green
    Run-Sql $m2
}

Write-Host "Baza tayyor." -ForegroundColor Green
