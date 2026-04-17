-- v25.4.0 — HAYOTIM MODULI
-- 2026-04-17
-- Admin (va kelajakda shogird) uchun shaxsiy biznes co-pilot:
-- maqsadlar, g'oyalar, shaxsiy xarajat — Opus 4.7 tahlili bilan.

-- ═══ shaxsiy_maqsadlar — maqsadlar va rejalar ═══
CREATE TABLE IF NOT EXISTS shaxsiy_maqsadlar (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Kim uchun: NULL = admin o'zi, >0 = shogirdning ID si (kelajakda)
    shogird_id BIGINT NULL,
    matn TEXT NOT NULL,
    kategoriya TEXT DEFAULT 'umumiy',  -- biznes / shaxsiy / soglik / ta'lim / oila / moliya
    ustuvorlik SMALLINT DEFAULT 2,      -- 1=yuqori, 2=normal, 3=past
    deadline DATE NULL,
    bajarildi BOOLEAN DEFAULT FALSE,
    bajarilgan_sana TIMESTAMP NULL,
    yaratilgan TIMESTAMP DEFAULT NOW(),
    yangilangan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shaxsiy_maqsadlar_uid ON shaxsiy_maqsadlar(user_id);
CREATE INDEX IF NOT EXISTS idx_shaxsiy_maqsadlar_bajarildi ON shaxsiy_maqsadlar(user_id, bajarildi);
CREATE INDEX IF NOT EXISTS idx_shaxsiy_maqsadlar_deadline ON shaxsiy_maqsadlar(user_id, deadline) WHERE NOT bajarildi;
ALTER TABLE shaxsiy_maqsadlar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shaxsiy_maqsadlar_iso ON shaxsiy_maqsadlar;
CREATE POLICY shaxsiy_maqsadlar_iso ON shaxsiy_maqsadlar
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

COMMENT ON TABLE shaxsiy_maqsadlar IS
    'Hayotim moduli: admin va shogirdlarning maqsadlari/rejalari. shogird_id NULL = admin o''zi.';


-- ═══ shaxsiy_goyalar — g'oyalar (spontaneous ideas) ═══
CREATE TABLE IF NOT EXISTS shaxsiy_goyalar (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shogird_id BIGINT NULL,
    matn TEXT NOT NULL,
    kategoriya TEXT DEFAULT 'umumiy',  -- marketing / mahsulot / operatsiya / moliya / boshqa
    cluster_id INT NULL,                -- Opus 4.7 o'xshash g'oyalarni gruppa qiladi
    holat TEXT DEFAULT 'yangi',         -- yangi / korib_chiqildi / amalga_oshirildi / rad_etildi
    manba TEXT DEFAULT 'ovoz',          -- ovoz / matn / import
    yaratilgan TIMESTAMP DEFAULT NOW(),
    yangilangan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shaxsiy_goyalar_uid ON shaxsiy_goyalar(user_id);
CREATE INDEX IF NOT EXISTS idx_shaxsiy_goyalar_cluster ON shaxsiy_goyalar(user_id, cluster_id) WHERE cluster_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shaxsiy_goyalar_holat ON shaxsiy_goyalar(user_id, holat);
ALTER TABLE shaxsiy_goyalar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shaxsiy_goyalar_iso ON shaxsiy_goyalar;
CREATE POLICY shaxsiy_goyalar_iso ON shaxsiy_goyalar
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

COMMENT ON TABLE shaxsiy_goyalar IS
    'Hayotim moduli: g''oyalar (ovoz yoki matn). Opus 4.7 cluster_id bilan o''xshashlarni gruppa qiladi.';


-- ═══ shaxsiy_xarajat — shaxsiy xarajat (biznes xarajatdan alohida) ═══
-- Biznes xarajat "xarajatlar" jadvalida, bu esa admin o'zining
-- shaxsiy xarajati (ovqat, yoq'ilg'i, kiyim, boshqa)
CREATE TABLE IF NOT EXISTS shaxsiy_xarajat (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    summa NUMERIC(18, 2) NOT NULL CHECK (summa >= 0),
    kategoriya TEXT DEFAULT 'boshqa',   -- ovqat / transport / dokon / kiyim / xizmat / soglik / oila / boshqa
    manba TEXT DEFAULT 'naqd',          -- naqd / karta / otkazma / shogird_foydasi
    izoh TEXT DEFAULT '',
    sana DATE DEFAULT CURRENT_DATE,
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shaxsiy_xarajat_uid_sana ON shaxsiy_xarajat(user_id, sana DESC);
CREATE INDEX IF NOT EXISTS idx_shaxsiy_xarajat_kategoriya ON shaxsiy_xarajat(user_id, kategoriya);
ALTER TABLE shaxsiy_xarajat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shaxsiy_xarajat_iso ON shaxsiy_xarajat;
CREATE POLICY shaxsiy_xarajat_iso ON shaxsiy_xarajat
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

COMMENT ON TABLE shaxsiy_xarajat IS
    'Hayotim moduli: admin shaxsiy xarajatlari (ovqat, transport, oila). Biznes xarajat "xarajatlar" jadvalida alohida.';
