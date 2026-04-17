-- v25.4.0 — QAYTARISH / ALMASHTIRISH MODULI
-- 2026-04-17
-- Klient buzuq/eskirgan tovar qaytaradi yoki yangisiga almashtirishni so'raydi.

CREATE TABLE IF NOT EXISTS qaytarishlar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    klient_id BIGINT NULL REFERENCES klientlar(id) ON DELETE SET NULL,
    tovar_id BIGINT NULL REFERENCES tovarlar(id) ON DELETE SET NULL,
    tovar_nomi TEXT NOT NULL,                -- snapshot
    miqdor NUMERIC(18, 3) NOT NULL CHECK (miqdor > 0),
    birlik TEXT DEFAULT 'dona',
    sabab TEXT DEFAULT 'brak',                -- brak / muddati / sifatsiz / kelishuv / boshqa
    summa NUMERIC(18, 2) DEFAULT 0,           -- qaytarilayotgan qiymat
    turi TEXT DEFAULT 'qaytarish',            -- qaytarish / almashtirish
    almash_tovar_id BIGINT NULL REFERENCES tovarlar(id),  -- agar almashtirish
    almash_miqdor NUMERIC(18, 3) DEFAULT 0,
    holat TEXT DEFAULT 'yangi',               -- yangi / tasdiqlandi / qaytarildi / bekor
    shogird_id BIGINT NULL,                   -- kim yozdi
    asl_sotuv_id BIGINT NULL REFERENCES sotuv_sessiyalar(id),  -- qaysi sotuvdan
    izoh TEXT DEFAULT '',
    rasm_file_id TEXT NULL,                   -- buzuq tovar rasmi (ixtiyoriy)
    yaratilgan TIMESTAMP DEFAULT NOW(),
    tugatilgan TIMESTAMP NULL
);
CREATE INDEX IF NOT EXISTS idx_qaytarishlar_uid ON qaytarishlar(user_id, yaratilgan DESC);
CREATE INDEX IF NOT EXISTS idx_qaytarishlar_klient ON qaytarishlar(user_id, klient_id);
CREATE INDEX IF NOT EXISTS idx_qaytarishlar_holat ON qaytarishlar(user_id, holat);

ALTER TABLE qaytarishlar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS qaytarishlar_iso ON qaytarishlar;
CREATE POLICY qaytarishlar_iso ON qaytarishlar
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

COMMENT ON TABLE qaytarishlar IS
    'Klient tovar qaytarishi yoki almashtirishi. SalesDoc /orders/recoveryOrder asosida.';
