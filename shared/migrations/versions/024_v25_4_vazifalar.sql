-- v25.4.0 — VAZIFALAR MODULI (SalesDoc /agents/taskNew asosida)
-- 2026-04-17
-- Admin shogirdlarga vazifa beradi. Shogird bajaradi. Admin real-time ko'radi.

CREATE TABLE IF NOT EXISTS vazifalar (
    id BIGSERIAL PRIMARY KEY,
    admin_uid BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shogird_id BIGINT NULL REFERENCES shogirdlar(id) ON DELETE CASCADE,
    klient_id BIGINT NULL REFERENCES klientlar(id) ON DELETE SET NULL,  -- ixtiyoriy: bu klient uchun
    matn TEXT NOT NULL,
    ustuvorlik SMALLINT DEFAULT 2,              -- 1=yuqori, 2=normal, 3=past
    deadline DATE NULL,
    bajarildi BOOLEAN DEFAULT FALSE,
    bajarilgan_vaqt TIMESTAMP NULL,
    bajaruvchi_izoh TEXT DEFAULT '',
    admin_izoh TEXT DEFAULT '',                  -- admin vazifa berishda izoh
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vazifalar_admin_bajarildi
    ON vazifalar(admin_uid, bajarildi, yaratilgan DESC);
CREATE INDEX IF NOT EXISTS idx_vazifalar_shogird_bajarildi
    ON vazifalar(shogird_id, bajarildi) WHERE shogird_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vazifalar_deadline
    ON vazifalar(admin_uid, deadline) WHERE NOT bajarildi;

ALTER TABLE vazifalar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vazifalar_iso ON vazifalar;
CREATE POLICY vazifalar_iso ON vazifalar
    FOR ALL USING (admin_uid = current_setting('app.uid')::bigint);

COMMENT ON TABLE vazifalar IS
    'SalesDoc /agents/taskNew asosida: admin shogirdga vazifa berish, deadline, bajarildi.';
