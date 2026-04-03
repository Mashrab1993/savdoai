#!/bin/bash
# ═══════════════════════════════════════════════════════
# MASHRAB MOLIYA — DB MAINTENANCE (har hafta)
# ═══════════════════════════════════════════════════════
set -e

DB_URL="${DATABASE_URL}"

echo "🔧 DB maintenance boshlandi: $(date)"

# 1. VACUUM ANALYZE
psql "$DB_URL" -c "VACUUM ANALYZE;"

# 2. Eski audit loglarni tozalash (90 kundan eski)
psql "$DB_URL" -c "
    DELETE FROM audit_log
    WHERE sana < NOW() - INTERVAL '90 days';
"

# 3. Yopilgan qarzlarni arxivlash (1 yildan eski)
psql "$DB_URL" -c "
    DELETE FROM qarzlar
    WHERE yopildi=TRUE
      AND yangilangan < NOW() - INTERVAL '1 year';
"

# 4. Cognitive tasks tozalash (30 kundan eski)
psql "$DB_URL" -c "
    DELETE FROM cognitive_tasks
    WHERE holat IN ('tayyor','xato')
      AND yaratilgan < NOW() - INTERVAL '30 days';
"

# 5. Statistika
psql "$DB_URL" -c "
    SELECT schemaname, tablename,
           pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
    FROM pg_tables
    WHERE schemaname='public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

echo "✅ DB maintenance tugadi: $(date)"
