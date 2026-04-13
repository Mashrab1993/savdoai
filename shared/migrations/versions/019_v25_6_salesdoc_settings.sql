-- v25.6 — SalesDoc nastroyka bo'limi funksiyalari
-- 2026-04-13

-- ═══ klient_turlari — klient turlari (optom, chakana, VIP, diler...) ═══
CREATE TABLE IF NOT EXISTS klient_turlari (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,
    rang TEXT DEFAULT '#6366F1',
    tartib INT DEFAULT 0,
    faol BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_klient_turlari_uid ON klient_turlari(user_id);
ALTER TABLE klient_turlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS klient_turlari_iso ON klient_turlari;
CREATE POLICY klient_turlari_iso ON klient_turlari
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ savdo_kanallari — savdo kanallari (telegram, website, agent, telefon...) ═══
CREATE TABLE IF NOT EXISTS savdo_kanallari (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,
    rang TEXT DEFAULT '#10B981',
    tartib INT DEFAULT 0,
    faol BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_savdo_kanallari_uid ON savdo_kanallari(user_id);
ALTER TABLE savdo_kanallari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS savdo_kanallari_iso ON savdo_kanallari;
CREATE POLICY savdo_kanallari_iso ON savdo_kanallari
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ savdo_yunalishlari — savdo yunalishlari (FMCG, HoReCa, farma...) ═══
CREATE TABLE IF NOT EXISTS savdo_yunalishlari (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,
    rang TEXT DEFAULT '#F59E0B',
    tartib INT DEFAULT 0,
    faol BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_savdo_yunalishlari_uid ON savdo_yunalishlari(user_id);
ALTER TABLE savdo_yunalishlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS savdo_yunalishlari_iso ON savdo_yunalishlari;
CREATE POLICY savdo_yunalishlari_iso ON savdo_yunalishlari
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ teglar — universal teglar (tovar, klient, buyurtma uchun) ═══
CREATE TABLE IF NOT EXISTS teglar (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,
    rang TEXT DEFAULT '#8B5CF6',
    turi TEXT DEFAULT 'umumiy', -- umumiy, tovar, klient, buyurtma
    faol BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_teglar_uid ON teglar(user_id);
ALTER TABLE teglar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS teglar_iso ON teglar;
CREATE POLICY teglar_iso ON teglar
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ hududlar — shahar/viloyat/tuman boshqaruvi ═══
CREATE TABLE IF NOT EXISTS hududlar (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,
    turi TEXT DEFAULT 'shahar', -- viloyat, shahar, tuman
    ota_id INT REFERENCES hududlar(id),
    tartib INT DEFAULT 0,
    faol BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_hududlar_uid ON hududlar(user_id);
ALTER TABLE hududlar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hududlar_iso ON hududlar;
CREATE POLICY hududlar_iso ON hududlar
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ rad_etish_sabablari — buyurtma rad etish sabablari ═══
CREATE TABLE IF NOT EXISTS rad_etish_sabablari (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,
    tartib INT DEFAULT 0,
    faol BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_rad_etish_uid ON rad_etish_sabablari(user_id);
ALTER TABLE rad_etish_sabablari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rad_etish_iso ON rad_etish_sabablari;
CREATE POLICY rad_etish_iso ON rad_etish_sabablari
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ birliklar — o'lchov birliklar (dona, kg, litr, karobka...) ═══
CREATE TABLE IF NOT EXISTS birliklar (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,
    qisqa TEXT, -- qisqartma: dona→d, kg→kg, karobka→kr
    tartib INT DEFAULT 0,
    faol BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_birliklar_uid ON birliklar(user_id);
ALTER TABLE birliklar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS birliklar_iso ON birliklar;
CREATE POLICY birliklar_iso ON birliklar
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);
