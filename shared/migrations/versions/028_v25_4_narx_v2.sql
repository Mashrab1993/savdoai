-- v25.4.0 — NARX TURLARI v2 (SalesDoc /settings/priceType mos)
-- 2026-04-17
-- SalesDoc: Тип цены (ID, Код, Название, Тип [Продажа/Закуп], Описание)
-- Qo'shiladi: kod, turi, tavsif, tolov_usuli (nomi string)

-- ═══ narx_turlari ustunlarni kengaytirish ═══
ALTER TABLE narx_turlari ADD COLUMN IF NOT EXISTS kod TEXT NULL;
ALTER TABLE narx_turlari ADD COLUMN IF NOT EXISTS turi TEXT NOT NULL DEFAULT 'prodaja'
    CHECK (turi IN ('prodaja', 'zakup', 'prayslist'));
ALTER TABLE narx_turlari ADD COLUMN IF NOT EXISTS tavsif TEXT NULL;
ALTER TABLE narx_turlari ADD COLUMN IF NOT EXISTS tolov_usuli TEXT NULL;  -- "Naqd Sum", "Karta", "Plastik"
ALTER TABLE narx_turlari ADD COLUMN IF NOT EXISTS oxirgi_narx_sanasi TIMESTAMP NULL;

-- ═══ tovar_narxlari.tolov_usuli ═══
-- Bir tovar turli to'lov usullarida turli narxda bo'lishi mumkin (SalesDocda shunaqa)
ALTER TABLE tovar_narxlari ADD COLUMN IF NOT EXISTS tolov_usuli TEXT NULL;

-- ═══ prayslist — alohida jadval (nomerov, sana, holat) ═══
-- Prayslist = zakup narxlari ro'yxati + chegirmalar + oylik tarif
CREATE TABLE IF NOT EXISTS prayslist (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,                          -- "Aprel 2026 chakana"
    boshlangich TIMESTAMP NOT NULL DEFAULT NOW(),
    tugash TIMESTAMP NULL,                        -- NULL = cheksiz
    faol BOOLEAN DEFAULT TRUE,
    izoh TEXT,
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prayslist_uid ON prayslist(user_id, faol);
ALTER TABLE prayslist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prayslist_iso ON prayslist;
CREATE POLICY prayslist_iso ON prayslist
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ prayslist_narxlari — prayslist ichidagi har tovar narxi ═══
CREATE TABLE IF NOT EXISTS prayslist_narxlari (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prayslist_id INT NOT NULL REFERENCES prayslist(id) ON DELETE CASCADE,
    tovar_id BIGINT NOT NULL REFERENCES tovarlar(id) ON DELETE CASCADE,
    narx NUMERIC(18,2) NOT NULL CHECK (narx >= 0),
    chegirma_foiz NUMERIC(5,2) DEFAULT 0,
    UNIQUE(prayslist_id, tovar_id)
);
CREATE INDEX IF NOT EXISTS idx_prn_pid ON prayslist_narxlari(prayslist_id);
ALTER TABLE prayslist_narxlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prn_iso ON prayslist_narxlari;
CREATE POLICY prn_iso ON prayslist_narxlari
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

COMMENT ON COLUMN narx_turlari.turi IS
    'prodaja (sotish), zakup (olish narxi), prayslist (oylik/aksiya tariffi)';
COMMENT ON TABLE prayslist IS
    'SalesDoc /settings/prices "Прайс лист" tabiga mos — muddati belgilangan narx ro''yxatlari';
