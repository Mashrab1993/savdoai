-- ════════════════════════════════════════════════════════════
--  v25.3 FIX: RLS policy tuzatish — barcha jadvallar app.uid
--  Muammo: 6 ta jadval noto'g'ri setting ishlatgan
--  pool.py SET app.uid ishlatadi → policy ham app.uid bo'lishi SHART
-- ════════════════════════════════════════════════════════════

-- 1. narx_guruhlari
DO $$ BEGIN
  DROP POLICY IF EXISTS rls_narx_guruhlari ON narx_guruhlari;
  CREATE POLICY rls_narx_guruhlari ON narx_guruhlari
    USING (user_id = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 2. guruh_narxlar
DO $$ BEGIN
  DROP POLICY IF EXISTS rls_guruh_narxlar ON guruh_narxlar;
  CREATE POLICY rls_guruh_narxlar ON guruh_narxlar
    USING (user_id = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 3. klient_narxlar
DO $$ BEGIN
  DROP POLICY IF EXISTS rls_klient_narxlar ON klient_narxlar;
  CREATE POLICY rls_klient_narxlar ON klient_narxlar
    USING (user_id = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 4. shogirdlar
DO $$ BEGIN
  DROP POLICY IF EXISTS rls_shogirdlar ON shogirdlar;
  CREATE POLICY rls_shogirdlar ON shogirdlar
    USING (admin_uid = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 5. xarajat_kategoriyalar
DO $$ BEGIN
  DROP POLICY IF EXISTS rls_xarajat_kat ON xarajat_kategoriyalar;
  CREATE POLICY rls_xarajat_kat ON xarajat_kategoriyalar
    USING (admin_uid = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 6. xarajatlar
DO $$ BEGIN
  DROP POLICY IF EXISTS rls_xarajatlar ON xarajatlar;
  CREATE POLICY rls_xarajatlar ON xarajatlar
    USING (admin_uid = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
