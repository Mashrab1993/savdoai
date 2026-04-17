-- v25.4.0 — TOVAR KLASSIFIKATORLARI (7 tab)
-- 2026-04-17
-- SalesDoc /settings/view/productCategory: 7 tab (kategoriya, subkat, gruppa, brend,
-- ishlab chiqaruvchi, segment, gruppa kategoriya). Unified single-table approach.

-- ═══ tovar_klassifikatorlari — 7 tur uchun yagona jadval ═══
CREATE TABLE IF NOT EXISTS tovar_klassifikatorlari (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    turi TEXT NOT NULL CHECK (turi IN (
        'kategoriya',      -- Category
        'subkategoriya',   -- Subcategory (parent_id → kategoriya.id)
        'gruppa',          -- Group
        'brend',           -- Brand
        'ishlab_chiqaruvchi', -- Producer / Manufacturer
        'segment',         -- Segment
        'gruppa_kategoriya'-- Group category
    )),
    nomi TEXT NOT NULL,
    kod TEXT NULL,                 -- custom_id (SalesDoc parity)
    davlat TEXT NULL,              -- Producer uchun
    birlik_id INT NULL,            -- Category uchun (dona/kg/litr)
    parent_id INT NULL REFERENCES tovar_klassifikatorlari(id) ON DELETE SET NULL,
    tartib INT DEFAULT 0,
    faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMP DEFAULT NOW(),
    yangilangan TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, turi, nomi)
);

CREATE INDEX IF NOT EXISTS idx_klf_uid_turi ON tovar_klassifikatorlari(user_id, turi);
CREATE INDEX IF NOT EXISTS idx_klf_parent ON tovar_klassifikatorlari(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_klf_faol ON tovar_klassifikatorlari(user_id, turi, faol);

ALTER TABLE tovar_klassifikatorlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS klf_iso ON tovar_klassifikatorlari;
CREATE POLICY klf_iso ON tovar_klassifikatorlari
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ tovarlar jadvaliga klassifikator havolalari ═══
-- Eski TEXT ustunlari (kategoriya, brend, segment) saqlanadi — backward compat.
-- Yangi *_id ustunlari — yangi tizim.
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS kategoriya_id INT NULL;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS subkategoriya_id INT NULL;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS gruppa_id INT NULL;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS brend_id INT NULL;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS ishlab_chiqaruvchi_id INT NULL;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS segment_id INT NULL;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS gruppa_kategoriya_id INT NULL;

CREATE INDEX IF NOT EXISTS idx_tov_kat_id ON tovarlar(user_id, kategoriya_id);
CREATE INDEX IF NOT EXISTS idx_tov_brend_id ON tovarlar(user_id, brend_id);
CREATE INDEX IF NOT EXISTS idx_tov_seg_id ON tovarlar(user_id, segment_id);

COMMENT ON TABLE tovar_klassifikatorlari IS
    'Tovar tasnif etish: 7 tur bitta jadvalda. SalesDoc /settings/view/productCategory funksiyasiga mos, lekin aksariyat atributlar yagona tablitsada.';
