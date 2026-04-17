-- v25.4.0 — NARX TURLARI (Multi-price per product)
-- 2026-04-17
-- SalesDoc inspiration: bir tovar — bir necha narx (chakana/optom/VIP)
-- User klient turiga qarab avtomatik mos narx tanlanadi.

-- ═══ narx_turlari — narx turlari (chakana, optom, VIP, diler, xodim) ═══
CREATE TABLE IF NOT EXISTS narx_turlari (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,                        -- "Chakana", "Optom", "VIP"
    foiz_chegirma NUMERIC(5,2) DEFAULT 0,      -- bazaviy narxdan chegirma % (optom uchun -10)
    klient_turi_id INT NULL,                    -- klient_turlari'ga bog'lanish (ixtiyoriy)
    tartib INT DEFAULT 0,
    faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_narx_turlari_uid ON narx_turlari(user_id);
ALTER TABLE narx_turlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS narx_turlari_iso ON narx_turlari;
CREATE POLICY narx_turlari_iso ON narx_turlari
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ tovar_narxlari — har tovar uchun har narx turida alohida narx ═══
-- Agar yozuv yo'q bo'lsa — tovarlar.sotish_narxi ishlatiladi (bazaviy)
CREATE TABLE IF NOT EXISTS tovar_narxlari (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tovar_id BIGINT NOT NULL REFERENCES tovarlar(id) ON DELETE CASCADE,
    narx_turi_id INT NOT NULL REFERENCES narx_turlari(id) ON DELETE CASCADE,
    narx NUMERIC(18,2) NOT NULL CHECK (narx >= 0),
    yaratilgan TIMESTAMP DEFAULT NOW(),
    yangilangan TIMESTAMP DEFAULT NOW(),
    UNIQUE(tovar_id, narx_turi_id)
);
CREATE INDEX IF NOT EXISTS idx_tovar_narxlari_uid ON tovar_narxlari(user_id);
CREATE INDEX IF NOT EXISTS idx_tovar_narxlari_tovar ON tovar_narxlari(tovar_id);
ALTER TABLE tovar_narxlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tovar_narxlari_iso ON tovar_narxlari;
CREATE POLICY tovar_narxlari_iso ON tovar_narxlari
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ klient narx turi — qaysi klientga qaysi narx turi qo'llaniladi ═══
-- klientlar.narx_turi_id ustuni (agar bo'lmasa — chakana default)
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS narx_turi_id INT NULL;
CREATE INDEX IF NOT EXISTS idx_klientlar_narx_turi ON klientlar(user_id, narx_turi_id);

COMMENT ON TABLE narx_turlari IS
    'Narx turlari (chakana/optom/VIP/...). Har tovar uchun har narx turida tovar_narxlari jadvalida alohida narx.';
COMMENT ON TABLE tovar_narxlari IS
    'Tovar → Narx turi → narx. Yo''q bo''lsa bazaviy tovarlar.sotish_narxi ishlatiladi.';
