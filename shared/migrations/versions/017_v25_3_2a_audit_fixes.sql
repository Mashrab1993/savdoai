-- ═══════════════════════════════════════════════════════════
--  017_v25_3_2a_audit_fixes.sql
--  Audit sessiya tuzatishlari:
--  1. shogirdlar RLS: user_id → admin_uid
--  2. xarajatlar RLS: user_id → admin_uid
--  3. xarajat_kategoriyalar RLS: admin_uid policy + ENABLE
--  4. chiqimlar: tovar_id va tovar_nomi indekslari
--  5. qarzlar: dastlabki_summa DEFAULT qo'shish
-- ═══════════════════════════════════════════════════════════

-- 1. shogirdlar — admin_uid asosida RLS
DO $$
BEGIN
  ALTER TABLE shogirdlar ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS shogirdlar_iso ON shogirdlar;
  CREATE POLICY shogirdlar_iso ON shogirdlar
    USING (admin_uid = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 2. xarajatlar — admin_uid asosida RLS
DO $$
BEGIN
  ALTER TABLE xarajatlar ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS xarajatlar_iso ON xarajatlar;
  CREATE POLICY xarajatlar_iso ON xarajatlar
    USING (admin_uid = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 3. xarajat_kategoriyalar — admin_uid RLS (oldin ENABLE qilinmagan!)
DO $$
BEGIN
  ALTER TABLE xarajat_kategoriyalar ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS xarajat_kat_iso ON xarajat_kategoriyalar;
  CREATE POLICY xarajat_kat_iso ON xarajat_kategoriyalar
    USING (admin_uid = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 4. chiqimlar — performance indekslar
CREATE INDEX IF NOT EXISTS idx_ch_tovar_id ON chiqimlar(tovar_id) WHERE tovar_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ch_tovar_nom ON chiqimlar(user_id, tovar_nomi);

-- 5. qarzlar — dastlabki_summa DEFAULT (eski qatorlarda NULL bo'lishi mumkin)
DO $$
BEGIN
  ALTER TABLE qarzlar ALTER COLUMN dastlabki_summa SET DEFAULT 0;
  -- Mavjud NULL larni to'ldirish
  UPDATE qarzlar SET dastlabki_summa = summa WHERE dastlabki_summa IS NULL OR dastlabki_summa = 0;
EXCEPTION WHEN undefined_column THEN
  -- dastlabki_summa ustuni allaqachon NOT NULL bo'lishi mumkin
  NULL;
END $$;

-- Eski noto'g'ri RLS policylarni tozalash (enable_rls yaratgan)
DO $$
BEGIN
  DROP POLICY IF EXISTS shogirdlar_iso_old ON shogirdlar;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
