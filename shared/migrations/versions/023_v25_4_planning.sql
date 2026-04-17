-- v25.4.0 — PLANNING MODULI (SalesDoc /planning asosida)
-- 2026-04-17
-- Admin har oy boshida shogirdlarga plan qo'yadi. Bot kundalik progress kuzatadi.

-- ═══ oylik_plan — admin har oy uchun plan ═══
CREATE TABLE IF NOT EXISTS oylik_plan (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shogird_id BIGINT NULL,                     -- NULL = umumiy admin plan, >0 = aniq shogird
    yil INT NOT NULL,
    oy INT NOT NULL CHECK (oy BETWEEN 1 AND 12),
    sotuv_plan NUMERIC(18, 2) DEFAULT 0,       -- sotuv miqdori (so'm)
    yangi_klient_plan INT DEFAULT 0,            -- yangi klient soni
    tashrif_plan INT DEFAULT 0,                 -- storecheck tashrif soni
    izoh TEXT DEFAULT '',
    yaratilgan TIMESTAMP DEFAULT NOW(),
    yangilangan TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, shogird_id, yil, oy)
);
CREATE INDEX IF NOT EXISTS idx_oylik_plan_uid ON oylik_plan(user_id, yil, oy);
CREATE INDEX IF NOT EXISTS idx_oylik_plan_shogird ON oylik_plan(user_id, shogird_id, yil, oy);
ALTER TABLE oylik_plan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS oylik_plan_iso ON oylik_plan;
CREATE POLICY oylik_plan_iso ON oylik_plan
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

-- ═══ outlet_plan — klient (do'kon) darajasida plan ═══
-- Masalan: "Akmal do'koni — bu oy 5 mln plan"
CREATE TABLE IF NOT EXISTS outlet_plan (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    klient_id BIGINT NOT NULL REFERENCES klientlar(id) ON DELETE CASCADE,
    yil INT NOT NULL,
    oy INT NOT NULL CHECK (oy BETWEEN 1 AND 12),
    sotuv_plan NUMERIC(18, 2) DEFAULT 0,
    tashrif_plan INT DEFAULT 4,                 -- haftalik 1 = oylik 4
    izoh TEXT DEFAULT '',
    yaratilgan TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, klient_id, yil, oy)
);
CREATE INDEX IF NOT EXISTS idx_outlet_plan_klient ON outlet_plan(user_id, klient_id, yil, oy);
ALTER TABLE outlet_plan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outlet_plan_iso ON outlet_plan;
CREATE POLICY outlet_plan_iso ON outlet_plan
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

COMMENT ON TABLE oylik_plan IS
    'SalesDoc /planning: admin shogird/umumiy oylik plan (sotuv, yangi klient, tashrif).';
COMMENT ON TABLE outlet_plan IS
    'SalesDoc /planning/outlet: klient (do''kon) darajasida oylik plan.';
