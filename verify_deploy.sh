#!/bin/bash
# SavdoAI v25.3 — Deploy oldi tekshiruv
set -e

echo "════════════════════════════════════════"
echo "  SavdoAI v25.3 Deploy Tekshiruv"
echo "════════════════════════════════════════"

ERRORS=0

# 1. Root fayllar
echo ""
echo "1. Root fayllar..."
for f in railway.toml requirements.txt .github/workflows/ci.yml README.md DEPLOY_CHECKLIST.md; do
  if [ -f "$f" ]; then echo "   ✅ $f"; else echo "   ❌ $f TOPILMADI!"; ERRORS=$((ERRORS+1)); fi
done

# 2. Servis fayllar
echo ""
echo "2. Servis fayllar..."
for f in services/api/main.py services/api/Dockerfile services/bot/main.py services/bot/Dockerfile services/bot/bot_helpers.py services/bot/handlers/narx.py services/bot/handlers/shogird.py services/bot/handlers/jobs.py services/web/Dockerfile services/web/app/layout.tsx; do
  if [ -f "$f" ]; then echo "   ✅ $f"; else echo "   ❌ $f TOPILMADI!"; ERRORS=$((ERRORS+1)); fi
done

# 3. Xavfsizlik
echo ""
echo "3. Xavfsizlik tekshiruv..."

SELECT_STAR=$(grep -rn "SELECT \*" services/ shared/ --include="*.py" | grep -v __pycache__ | grep -v test | wc -l)
if [ "$SELECT_STAR" -eq 0 ]; then echo "   ✅ SELECT * = 0"; else echo "   ❌ SELECT * = $SELECT_STAR"; ERRORS=$((ERRORS+1)); fi

BARE_EXCEPT=$(grep -rn "except:$" services/ shared/ --include="*.py" | grep -v __pycache__ | wc -l)
if [ "$BARE_EXCEPT" -eq 0 ]; then echo "   ✅ bare except = 0"; else echo "   ❌ bare except = $BARE_EXCEPT"; ERRORS=$((ERRORS+1)); fi

# 4. Versiya
echo ""
echo "4. Versiya..."
if grep -q '25.3' services/bot/main.py 2>/dev/null; then echo "   ✅ Bot v25.3"; else echo "   ❌ Bot versiya noto'g'ri"; ERRORS=$((ERRORS+1)); fi

# 5. railway.toml
echo ""
echo "5. Railway config..."
if grep -q 'BOT_TOKEN' railway.toml 2>/dev/null; then echo "   ✅ BOT_TOKEN API da bor"; else echo "   ❌ BOT_TOKEN API da YO'Q!"; ERRORS=$((ERRORS+1)); fi
if grep -q 'web.URL' railway.toml 2>/dev/null; then echo "   ✅ NEXT_PUBLIC_API_URL = web.URL"; else echo "   ❌ NEXT_PUBLIC_API_URL noto'g'ri"; ERRORS=$((ERRORS+1)); fi

# 6. Testlar
echo ""
echo "6. Testlar..."
if [ -n "$PYTHONPATH" ]; then
  RESULT=$(python -m pytest tests/ -q --tb=no 2>&1 | tail -1)
  PASSED=$(echo "$RESULT" | grep -oP '\d+ passed' | grep -oP '\d+')
  if [ "${PASSED:-0}" -ge 1000 ]; then echo "   ✅ $PASSED test o'tdi"; else echo "   ❌ $PASSED test — 1000 dan kam!"; ERRORS=$((ERRORS+1)); fi
else
  echo "   ⚠️ PYTHONPATH o'rnatilmagan, testlar o'tkazilmadi"
fi

echo ""
echo "════════════════════════════════════════"
if [ "$ERRORS" -eq 0 ]; then
  echo "  ✅ DEPLOY MUMKIN"
else
  echo "  ❌ $ERRORS TA XATO — DEPLOY QILMA!"
fi
echo "════════════════════════════════════════"
exit $ERRORS
