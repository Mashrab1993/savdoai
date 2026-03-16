-- Mashrab Moliya v21.3 Migration: Kassa + Vision + Faktura
-- Run: psql $DATABASE_URL < shared/migrations/versions/001_v21_3_kassa_vision_faktura.sql

CREATE TABLE IF NOT EXISTS kassa_operatsiyalar (
    id          SERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tur         VARCHAR(10) NOT NULL CHECK (tur IN ('kirim','chiqim')),
    summa       NUMERIC(18,2) NOT NULL CHECK (summa > 0),
    usul        VARCHAR(20) NOT NULL DEFAULT 'naqd' CHECK (usul IN ('naqd','karta','otkazma')),
    tavsif      TEXT,
    kategoriya  VARCHAR(100),
    yaratilgan  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kassa_user ON kassa_operatsiyalar(user_id);
CREATE INDEX IF NOT EXISTS idx_kassa_tur ON kassa_operatsiyalar(tur);
CREATE INDEX IF NOT EXISTS idx_kassa_usul ON kassa_operatsiyalar(usul);
CREATE INDEX IF NOT EXISTS idx_kassa_sana ON kassa_operatsiyalar(yaratilgan DESC);
ALTER TABLE kassa_operatsiyalar ENABLE ROW LEVEL SECURITY;
CREATE POLICY kassa_isolation ON kassa_operatsiyalar USING (user_id = current_uid());

CREATE TABLE IF NOT EXISTS vision_log (
    id          SERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tur         VARCHAR(30) DEFAULT 'rasm',
    natija      JSONB,
    ishonch     REAL DEFAULT 0.0,
    yaratilgan  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vision_user ON vision_log(user_id);
ALTER TABLE vision_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY vision_isolation ON vision_log USING (user_id = current_uid());

CREATE TABLE IF NOT EXISTS fakturalar (
    id              SERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raqam           VARCHAR(50) NOT NULL,
    klient_ismi     VARCHAR(200),
    jami_summa      NUMERIC(18,2) DEFAULT 0,
    tovarlar        JSONB DEFAULT '[]',
    bank_rekvizit   JSONB,
    holat           VARCHAR(20) DEFAULT 'yaratilgan',
    yaratilgan      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_faktura_user ON fakturalar(user_id);
ALTER TABLE fakturalar ENABLE ROW LEVEL SECURITY;
CREATE POLICY faktura_isolation ON fakturalar USING (user_id = current_uid());
