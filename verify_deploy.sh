#!/bin/bash
# SavdoAI v23.1 — Deploy oldi tekshiruv
# Bu skript BARCHA critical fayllarni tekshiradi
# BARCHA testlar o'tishi KERAK, aks holda deploy qilma

echo "════════════════════════════════════════"
echo "  SavdoAI v23.1 Deploy Tekshiruv"
echo "════════════════════════════════════════"

ERRORS=0

# 1. Root fayllar
echo ""
echo "1. Root fayllar mavjudligi..."
for f in Procfile railway.toml nixpacks.toml requirements.txt .python-version; do
  if [ -f "$f" ]; then
    echo "   ✅ $f"
  else
    echo "   ❌ $f TOPILMADI!"
    ERRORS=$((ERRORS+1))
  fi
done

# 2. Key source files
echo ""
echo "2. Manba fayllar..."
for f in shared/database/pool.py shared/database/schema.sql services/bot/db.py services/bot/main.py services/api/main.py; do
  if [ -f "$f" ]; then
    echo "   ✅ $f"
  else
    echo "   ❌ $f TOPILMADI!"
    ERRORS=$((ERRORS+1))
  fi
done

# 3. Procfile workers
echo ""
echo "3. Procfile workers=1..."
if grep -q "workers 1" Procfile 2>/dev/null; then
  echo "   ✅ workers=1"
else
  echo "   ❌ Procfile da workers=1 YO'Q!"
  ERRORS=$((ERRORS+1))
fi

# 4. railway.toml workers
echo ""
echo "4. railway.toml workers=1..."
if grep -q "workers 1" railway.toml 2>/dev/null; then
  echo "   ✅ workers=1"
else
  echo "   ❌ railway.toml da workers=1 YO'Q!"
  ERRORS=$((ERRORS+1))
fi

# 5. pool.py crash-proof
echo ""
echo "5. pool.py crash-proof schema_init..."
if grep -q "is_create_table" shared/database/pool.py 2>/dev/null; then
  echo "   ✅ is_create_table logikasi bor"
else
  echo "   ❌ pool.py ESKI — is_create_table YO'Q!"
  ERRORS=$((ERRORS+1))
fi

# 6. db.py crash-proof
echo ""
echo "6. db.py crash-proof schema_init..."
if grep -q "is_create_table" services/bot/db.py 2>/dev/null; then
  echo "   ✅ is_create_table logikasi bor"
else
  echo "   ❌ db.py ESKI — is_create_table YO'Q!"
  ERRORS=$((ERRORS+1))
fi

# 7. Dangerous index removed
echo ""
echo "7. Xavfli idx_ss_uid_sana_btr olib tashlangan..."
if grep -q "idx_ss_uid_sana_btr" shared/database/schema.sql 2>/dev/null; then
  echo "   ❌ idx_ss_uid_sana_btr hali bor — XAVFLI!"
  ERRORS=$((ERRORS+1))
else
  echo "   ✅ idx_ss_uid_sana_btr yo'q"
fi

# 8. No ::date in CREATE INDEX
echo ""
echo "8. CREATE INDEX da ::date yo'q..."
DATECOUNT=$(grep -A2 "CREATE INDEX" shared/database/schema.sql 2>/dev/null | grep -c "::date" || true)
if [ "$DATECOUNT" = "0" ] || [ -z "$DATECOUNT" ]; then
  echo "   ✅ ::date INDEX larda yo'q"
else
  echo "   ❌ ::date INDEX larda topildi — XAVFLI!"
  ERRORS=$((ERRORS+1))
fi

# 9. Version
echo ""
echo "9. Versiya v23.1..."
if grep -q '__version__ = "23.1"' services/bot/main.py 2>/dev/null; then
  echo "   ✅ bot v23.1"
else
  echo "   ❌ bot versiya 23.0 emas!"
  ERRORS=$((ERRORS+1))
fi

# 10. PYTHONPATH in nixpacks.toml
echo ""
echo "10. PYTHONPATH nixpacks.toml da..."
if grep -q 'PYTHONPATH' nixpacks.toml 2>/dev/null; then
  echo "   ✅ PYTHONPATH bor"
else
  echo "   ❌ PYTHONPATH yo'q!"
  ERRORS=$((ERRORS+1))
fi

# 11. API schema try/except
echo ""
echo "11. API schema try/except..."
if grep -q "Schema init xato" services/api/main.py 2>/dev/null; then
  echo "   ✅ API schema try/except bor"
else
  echo "   ❌ API schema try/except YO'Q!"
  ERRORS=$((ERRORS+1))
fi

# 12. Bot schema try/except
echo ""
echo "12. Bot schema try/except..."
if grep -q "Schema init xato" services/bot/main.py 2>/dev/null; then
  echo "   ✅ Bot schema try/except bor"
else
  echo "   ❌ Bot schema try/except YO'Q!"
  ERRORS=$((ERRORS+1))
fi

echo ""
echo "════════════════════════════════════════"
if [ "$ERRORS" -eq 0 ]; then
  echo "  ✅ BARCHA TESTLAR O'TDI — DEPLOY MUMKIN"
  echo "════════════════════════════════════════"
  exit 0
else
  echo "  ❌ $ERRORS TA XATO TOPILDI — DEPLOY QILMA!"
  echo "  ZIP dan fayllarni qayta ko'chiring."
  echo "════════════════════════════════════════"
  exit 1
fi
