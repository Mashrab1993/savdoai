#!/bin/bash
# SavdoAI v22.1 / v23.0 deploy tekshiruvi — 12 ta check
set -e
OK=0
FAIL=0

check() {
  if "$@"; then echo "  ✅ $1"; OK=$((OK+1)); return 0; else echo "  ❌ $1"; FAIL=$((FAIL+1)); return 1; fi
}

echo "=== 1. Procfile workers ==="
check "Procfile --workers 1" grep -q 'workers 1' Procfile

echo "=== 2. pool.py is_create_table ==="
check "pool.py is_create_table" grep -q 'is_create_table' shared/database/pool.py

echo "=== 3. schema.sql idx_ss olib tashlangan ==="
check "schema.sql idx_ss commented/removed" grep -q 'olib tashlangan\|^--.*idx_ss' shared/database/schema.sql

echo "=== 4. schema.sql ::date faqat comment da ==="
check "schema.sql no ::date in active stmt" bash -c '! grep -v "^[[:space:]]*--" shared/database/schema.sql | grep -q "::date"'

echo "=== 5. API schema try/except ==="
check "API schema_init xato (API davom" grep -q "schema_init xato (API davom" services/api/main.py

echo "=== 6. Bot schema try/except ==="
check "Bot schema_init xato (bot davom" grep -q "schema_init xato (bot davom" services/bot/main.py

echo "=== 7. Bot version 22.1 / 23.0 / 23.1 ==="
check "Bot __version__ 22.1/23.x" grep -qE '__version__ = "22\.1"|__version__ = "23\.0"|__version__ = "23\.1"' services/bot/main.py

echo "=== 8. API version 22.1 / 23.0 / 23.1 ==="
check "API __version__ 22.1/23.x" grep -qE '__version__ = "22\.1"|__version__ = "23\.0"|__version__ = "23\.1"' services/api/main.py

echo "=== 9. railway.toml root da ==="
check "railway.toml exists" test -f railway.toml

echo "=== 10. railway.toml workers 1 ==="
check "railway.toml workers 1" grep -q 'workers 1' railway.toml

echo "=== 11. railway.toml DB_MAX 10 ==="
check "railway.toml DB_MAX 10" grep -q 'DB_MAX.*=.*"10"\|DB_MAX.*10' railway.toml

echo "=== 12. PYTHONPATH /app ==="
check "railway.toml PYTHONPATH" grep -q 'PYTHONPATH.*/app' railway.toml

echo ""
echo "Natija: $OK ✅  $FAIL ❌"
if [ "$FAIL" -gt 0 ]; then exit 1; fi
echo "BARCHA 12 TA TEKSHIRUV O'TDI. Push qilish mumkin."
