-- v25.4.0 — STORECHECK MODULI (SalesDoc /audit/storecheck asosida)
-- 2026-04-17
-- Shogird/agent do'konga borganda tekshiruv: SKU mavjudligi, narx, facing foto, poll.

-- ═══ storecheck_sessions — har bir tashrif (visit) ═══
-- Shogird do'konga kiradi, storecheck boshlaydi. Bir sessiya = bir tashrif.
CREATE TABLE IF NOT EXISTS storecheck_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shogird_id BIGINT NULL,                   -- NULL = admin o'zi, >0 = shogirdlar.id
    klient_id BIGINT NULL REFERENCES klientlar(id) ON DELETE SET NULL,
    boshlangan TIMESTAMP DEFAULT NOW(),
    tugagan TIMESTAMP NULL,
    gps_lat NUMERIC(9, 6) NULL,                -- tashrif GPS
    gps_lng NUMERIC(9, 6) NULL,
    holat TEXT DEFAULT 'ochiq',                 -- ochiq / yopildi / bekor
    izoh TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_sc_sessions_uid_sana ON storecheck_sessions(user_id, boshlangan DESC);
CREATE INDEX IF NOT EXISTS idx_sc_sessions_klient ON storecheck_sessions(user_id, klient_id);
CREATE INDEX IF NOT EXISTS idx_sc_sessions_shogird ON storecheck_sessions(user_id, shogird_id);
ALTER TABLE storecheck_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sc_sessions_iso ON storecheck_sessions;
CREATE POLICY sc_sessions_iso ON storecheck_sessions
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ storecheck_sku — tashrifda har bir SKU tekshiruvi ═══
-- Bir session × ko'p SKU (50-200 ta tipik). Har biri: bor/yo'q + narx + izoh.
CREATE TABLE IF NOT EXISTS storecheck_sku (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id BIGINT NOT NULL REFERENCES storecheck_sessions(id) ON DELETE CASCADE,
    tovar_id BIGINT NULL REFERENCES tovarlar(id) ON DELETE SET NULL,
    tovar_nomi TEXT NOT NULL,                 -- snapshot — tovar o'chirilsa ham saqlanadi
    mavjud BOOLEAN DEFAULT FALSE,              -- shogird do'konda bor dedi
    narx NUMERIC(18, 2) NULL,                  -- ko'rilgan narx (raqobat monitoring)
    facing INT DEFAULT 0,                       -- javon'da nechta yuz (facing count)
    tartib INT DEFAULT 0,
    izoh TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_sc_sku_session ON storecheck_sku(session_id);
CREATE INDEX IF NOT EXISTS idx_sc_sku_tovar ON storecheck_sku(user_id, tovar_id);
ALTER TABLE storecheck_sku ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sc_sku_iso ON storecheck_sku;
CREATE POLICY sc_sku_iso ON storecheck_sku
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ storecheck_photos — tashrifda foto hisobot ═══
-- Shogird facing/javon/raqobat rasmlarini yuboradi.
CREATE TABLE IF NOT EXISTS storecheck_photos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id BIGINT NOT NULL REFERENCES storecheck_sessions(id) ON DELETE CASCADE,
    telegram_file_id TEXT NOT NULL,
    turi TEXT DEFAULT 'facing',                 -- facing / raqobat / brak / boshqa
    izoh TEXT DEFAULT '',
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sc_photos_session ON storecheck_photos(session_id);
ALTER TABLE storecheck_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sc_photos_iso ON storecheck_photos;
CREATE POLICY sc_photos_iso ON storecheck_photos
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ storecheck_poll — tashrifda klient so'rovi (bozor tadqiqoti) ═══
CREATE TABLE IF NOT EXISTS storecheck_poll (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id BIGINT NOT NULL REFERENCES storecheck_sessions(id) ON DELETE CASCADE,
    savol TEXT NOT NULL,
    javob TEXT DEFAULT '',
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sc_poll_session ON storecheck_poll(session_id);
ALTER TABLE storecheck_poll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sc_poll_iso ON storecheck_poll;
CREATE POLICY sc_poll_iso ON storecheck_poll
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ storecheck_template — admin oldindan SKU ro'yxat tayyorlaydi ═══
-- Masalan "Chakana do'kon standart SKU ro'yxat — 50 ta tovar"
CREATE TABLE IF NOT EXISTS storecheck_templates (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,                         -- "Chakana", "Optom", "HoReCa"
    klient_turi_id INT NULL,                    -- klient_turlari'ga bog'lanadi
    tovar_idlari BIGINT[] DEFAULT '{}',         -- asosiy SKU ID'lari
    faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sc_templates_uid ON storecheck_templates(user_id);
ALTER TABLE storecheck_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sc_templates_iso ON storecheck_templates;
CREATE POLICY sc_templates_iso ON storecheck_templates
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

COMMENT ON TABLE storecheck_sessions IS
    'SalesDoc /audit/storecheck asosida — shogird tashrif hisoboti.';
COMMENT ON TABLE storecheck_sku IS
    'Har tashrifda SKU tekshiruvi: mavjud, narx, facing soni.';
COMMENT ON TABLE storecheck_photos IS
    'Tashrif foto hisoboti: facing, raqobat, brak.';
COMMENT ON TABLE storecheck_poll IS
    'Klient so''rovi — bozor tadqiqoti natijasi.';
COMMENT ON TABLE storecheck_templates IS
    'Oldindan tayyorlangan SKU ro''yxatlari (klient turi uchun).';
