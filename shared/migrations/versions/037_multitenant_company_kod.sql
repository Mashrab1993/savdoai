-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  037 — MULTI-TENANT: company_kod + parent_id + role             ║
-- ║  2026-05-23                                                      ║
-- ║                                                                  ║
-- ║  SalesDoc/Smartup tipida professional ko'p-tenant model:         ║
-- ║                                                                  ║
-- ║  - company_kod: unikal qisqa kod (SALOM-2026), brand URL uchun  ║
-- ║  - parent_id: sub-user (sotuvchi/agent) ownerga bog'lanadi      ║
-- ║  - role: owner / admin / sotuvchi / agent / merchant            ║
-- ║                                                                  ║
-- ║  Effective tenant_id (data isolation):                          ║
-- ║    if parent_id IS NULL  →  user_id (owner queries own data)    ║
-- ║    if parent_id IS NOT NULL  →  parent_id (sub queries owner's) ║
-- ║                                                                  ║
-- ║  Mavjud user'lar uchun: parent_id NULL (ular owner), role=owner ║
-- ║                                                                  ║
-- ║  Backfill: company_kod avtomatik dokon_nomi'dan generatsiya      ║
-- ║  qilinadi (slugify + suffix agar kollizion bo'lsa).             ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ═══ 1. Ustunlar qo'shish (mavjud user'larga ta'sir qilmaydi) ═══
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_kod TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner'
    CHECK(role IN('owner','admin','sotuvchi','agent','merchant'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS sinov_tugash DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tarif TEXT NOT NULL DEFAULT 'sinov';
ALTER TABLE users ADD COLUMN IF NOT EXISTS to_liq_ism TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oxirgi_kirish TIMESTAMPTZ;

-- ═══ 2. parent_id self-FK (mavjud bo'lsa qayta yaratmaymiz) ═══
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'users_parent_id_fkey'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ═══ 3. company_kod uchun unique index ═══
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_company_kod
    ON users(lower(company_kod))
    WHERE company_kod IS NOT NULL;

-- ═══ 4. Lookup indekslari ═══
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE faol=TRUE;

-- ═══ 5. Backfill: mavjud user'larga company_kod ═══
-- Slugify funksiyasi (oddiy implementatsiya — extension talab qilmaydi)
CREATE OR REPLACE FUNCTION slugify(input_text TEXT) RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    result := lower(input_text);
    -- Kirill -> lotin (asosiy harflar)
    result := translate(result,
        'абвгдеёжзийклмнопрстуфхцчшщъыьэюяғқўҳ',
        'abvgdeejzijklmnoprstufxccss''i'eyaggwh');
    -- Faqat harf, raqam va tireni qoldirish
    result := regexp_replace(result, '[^a-z0-9\-]+', '-', 'g');
    result := regexp_replace(result, '-+', '-', 'g');
    result := trim(both '-' from result);
    -- Limit uzunlik
    result := substring(result FROM 1 FOR 30);
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Mavjud user'larga unique kod tarqatish
DO $$
DECLARE
    u RECORD;
    base_kod TEXT;
    candidate_kod TEXT;
    suffix INTEGER;
BEGIN
    FOR u IN SELECT id, dokon_nomi FROM users WHERE company_kod IS NULL LOOP
        base_kod := slugify(COALESCE(NULLIF(u.dokon_nomi, ''), 'shop'));
        IF base_kod = '' OR base_kod IS NULL THEN
            base_kod := 'shop';
        END IF;
        candidate_kod := base_kod;
        suffix := 0;
        WHILE EXISTS (
            SELECT 1 FROM users
            WHERE lower(company_kod) = candidate_kod
            AND id != u.id
        ) LOOP
            suffix := suffix + 1;
            candidate_kod := base_kod || '-' || suffix::TEXT;
        END LOOP;
        UPDATE users SET company_kod = candidate_kod WHERE id = u.id;
    END LOOP;
END $$;

-- ═══ 6. Mavjud user'lar barchasi owner ═══
UPDATE users SET role = 'owner' WHERE role IS NULL OR role = '';

-- ═══ 7. sinov_tugash backfill — yaratilgan + 14 kun (mavjud user'lar uchun) ═══
UPDATE users
SET sinov_tugash = (yaratilgan::date + INTERVAL '14 days')::date
WHERE sinov_tugash IS NULL;

-- ═══ 8. Permissions JSONB (sub-user uchun cheklangan ruxsat) ═══
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ═══ 9. Helper view: effective tenant_id ═══
-- Owner sub-userlar uchun parent_id = NULL bo'lganida user_id, aks holda parent_id.
CREATE OR REPLACE VIEW v_user_tenant AS
SELECT
    id AS user_id,
    COALESCE(parent_id, id) AS tenant_id,
    company_kod,
    role,
    dokon_nomi,
    faol
FROM users;

COMMENT ON COLUMN users.company_kod IS 'Unikal kompaniya kodi (slug), brand URL va login uchun';
COMMENT ON COLUMN users.parent_id IS 'Sub-user owner ID (NULL = owner)';
COMMENT ON COLUMN users.role IS 'owner / admin / sotuvchi / agent / merchant';
COMMENT ON COLUMN users.permissions IS 'JSONB ruxsatlar (sub-user uchun)';
