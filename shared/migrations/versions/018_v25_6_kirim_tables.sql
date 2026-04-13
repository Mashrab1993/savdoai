-- v25.6 — Voice Kirim + Missing Tables
-- 2026-04-13

-- narx_turlar — price types
CREATE TABLE IF NOT EXISTS narx_turlar (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,
    foiz NUMERIC DEFAULT 0,
    faol BOOLEAN DEFAULT TRUE
);
ALTER TABLE narx_turlar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS narx_turlar_rls ON narx_turlar;
CREATE POLICY narx_turlar_rls ON narx_turlar FOR ALL
    USING (user_id = current_setting('app.uid')::bigint);
CREATE INDEX IF NOT EXISTS idx_narx_turlar_uid ON narx_turlar(user_id);

-- ombor_qoldiq — warehouse stock per product
CREATE TABLE IF NOT EXISTS ombor_qoldiq (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tovar_id INT REFERENCES tovarlar(id),
    ombor_id INT,
    miqdor NUMERIC DEFAULT 0,
    yangilangan TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ombor_qoldiq ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ombor_qoldiq_rls ON ombor_qoldiq;
CREATE POLICY ombor_qoldiq_rls ON ombor_qoldiq FOR ALL
    USING (user_id = current_setting('app.uid')::bigint);
CREATE INDEX IF NOT EXISTS idx_ombor_qoldiq_uid ON ombor_qoldiq(user_id);
CREATE INDEX IF NOT EXISTS idx_ombor_qoldiq_tovar ON ombor_qoldiq(tovar_id);

-- klient_kategoriyalar — client categories
CREATE TABLE IF NOT EXISTS klient_kategoriyalar (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,
    rang TEXT DEFAULT '#3B82F6',
    tartib INT DEFAULT 0
);
ALTER TABLE klient_kategoriyalar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS klient_kategoriyalar_rls ON klient_kategoriyalar;
CREATE POLICY klient_kategoriyalar_rls ON klient_kategoriyalar FOR ALL
    USING (user_id = current_setting('app.uid')::bigint);
CREATE INDEX IF NOT EXISTS idx_klient_kat_uid ON klient_kategoriyalar(user_id);

-- webhooklar — webhook integrations
CREATE TABLE IF NOT EXISTS webhooklar (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    event_type TEXT NOT NULL,
    faol BOOLEAN DEFAULT TRUE,
    secret TEXT,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE webhooklar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS webhooklar_rls ON webhooklar;
CREATE POLICY webhooklar_rls ON webhooklar FOR ALL
    USING (user_id = current_setting('app.uid')::bigint);
CREATE INDEX IF NOT EXISTS idx_webhooklar_uid ON webhooklar(user_id);
