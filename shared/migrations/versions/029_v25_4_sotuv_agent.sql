-- v25.4.0 — SOTUV SESSIYALARIGA AGENT/EKSPEDITOR/SKLAD LINKLARI
-- 2026-04-17
-- SalesDoc /orders/list da: Agent, Ekspeditor, Sklad ustunlari bor.
-- Bizda ham mos keladigan ustunlar va yordamchi jadvallar.

-- ═══ shogird_id sotuv_sessiyalarga bog'lash ═══
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS shogird_id BIGINT NULL
    REFERENCES shogirdlar(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ss_shogird ON sotuv_sessiyalar(user_id, shogird_id)
    WHERE shogird_id IS NOT NULL;

-- ═══ ekspeditorlar jadvali (yetkazib beruvchilar) ═══
CREATE TABLE IF NOT EXISTS ekspeditorlar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ism TEXT NOT NULL,
    telefon TEXT,
    mashina_nomi TEXT,         -- "Damas", "Labo", "Damas 2022"
    mashina_raqami TEXT,       -- "01 A 123 AB"
    faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eksp_uid ON ekspeditorlar(user_id, faol);
ALTER TABLE ekspeditorlar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS eksp_iso ON ekspeditorlar;
CREATE POLICY eksp_iso ON ekspeditorlar
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ skladlar jadvali (warehouses) ═══
CREATE TABLE IF NOT EXISTS skladlar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,        -- "Asosiy sklad", "Sifatsiz tovar", "Aksiya"
    turi TEXT NULL,            -- "asosiy", "brak", "aksiya"
    kod TEXT NULL,
    faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sklad_uid ON skladlar(user_id, faol);
ALTER TABLE skladlar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sklad_iso ON skladlar;
CREATE POLICY sklad_iso ON skladlar
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ sotuv_sessiyalar bog'lashlar ═══
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS ekspeditor_id BIGINT NULL
    REFERENCES ekspeditorlar(id) ON DELETE SET NULL;
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS sklad_id BIGINT NULL
    REFERENCES skladlar(id) ON DELETE SET NULL;
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS tip_zayavki TEXT NOT NULL DEFAULT 'sotish'
    CHECK (tip_zayavki IN ('sotish', 'qaytarish', 'almashtirish', 'bonus'));
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS document_number TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_ss_eksp ON sotuv_sessiyalar(user_id, ekspeditor_id)
    WHERE ekspeditor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ss_sklad ON sotuv_sessiyalar(user_id, sklad_id)
    WHERE sklad_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ss_doc_num ON sotuv_sessiyalar(user_id, document_number)
    WHERE document_number IS NOT NULL;

-- ═══ nakladnoy_registers — bulk nakladnoy ro'yxatlari ═══
CREATE TABLE IF NOT EXISTS nakladnoy_registrlari (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi TEXT NOT NULL,               -- "Agent Akbar 17.04.2026"
    sana DATE NOT NULL DEFAULT CURRENT_DATE,
    shogird_id BIGINT NULL REFERENCES shogirdlar(id) ON DELETE SET NULL,
    ekspeditor_id BIGINT NULL REFERENCES ekspeditorlar(id) ON DELETE SET NULL,
    sklad_id BIGINT NULL REFERENCES skladlar(id) ON DELETE SET NULL,
    sessiya_idlar BIGINT[] NOT NULL,   -- qaysi buyurtmalar qo'shilgan
    jami_summa NUMERIC(18,2) DEFAULT 0,
    tolangan NUMERIC(18,2) DEFAULT 0,
    izoh TEXT,
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nakl_uid_sana ON nakladnoy_registrlari(user_id, sana DESC);
ALTER TABLE nakladnoy_registrlari ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nakl_iso ON nakladnoy_registrlari;
CREATE POLICY nakl_iso ON nakladnoy_registrlari
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ document_number avtomatik yaratuvchi funktsiya ═══
CREATE OR REPLACE FUNCTION gen_document_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.document_number IS NULL THEN
        NEW.document_number := 'MUK' || LPAD(NEW.id::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sotuv_doc_number ON sotuv_sessiyalar;
CREATE TRIGGER trg_sotuv_doc_number
    BEFORE INSERT ON sotuv_sessiyalar
    FOR EACH ROW EXECUTE FUNCTION gen_document_number();

COMMENT ON TABLE ekspeditorlar IS
    'Yetkazib beruvchilar (drayverlar). SalesDoc /settings/expeditors analog.';
COMMENT ON TABLE skladlar IS
    'Skladlar (omborlar). SalesDoc /settings/warehouses analog.';
COMMENT ON TABLE nakladnoy_registrlari IS
    'Bulk nakladnoy ro''yxatlari — har agent/ekspeditor uchun alohida. Excel chiqarish uchun.';
