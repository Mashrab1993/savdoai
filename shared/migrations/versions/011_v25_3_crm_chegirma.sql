-- ═══════════════════════════════════════════════════════════════
-- v25.3.3 — Klient CRM + Avtomatik chegirma + Prognoz
-- Idempotent — qayta ishga tushirish xavfsiz
-- ═══════════════════════════════════════════════════════════════

-- 1. Klient CRM kengaytirish
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS tugilgan_kun DATE;
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS izoh TEXT DEFAULT '';
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS kategoriya TEXT DEFAULT 'oddiy';
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS oxirgi_sotuv TIMESTAMPTZ;
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS jami_xaridlar NUMERIC(18,2) DEFAULT 0;
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS xarid_soni INTEGER DEFAULT 0;

-- 2. Chegirma tizimi
CREATE TABLE IF NOT EXISTS chegirma_qoidalar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    nomi        TEXT        NOT NULL,
    turi        TEXT        NOT NULL DEFAULT 'foiz',
    qiymat      NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_xarid   NUMERIC(18,2) DEFAULT 0,
    min_soni    INTEGER     DEFAULT 0,
    kategoriya  TEXT        DEFAULT '',
    faol        BOOLEAN     DEFAULT TRUE,
    yaratilgan  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chegirma_user
    ON chegirma_qoidalar(user_id, faol) WHERE faol = TRUE;
SELECT enable_rls('chegirma_qoidalar');

-- 3. Raqobatchi narx monitoring
CREATE TABLE IF NOT EXISTS raqobat_narxlar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    tovar_id    BIGINT      REFERENCES tovarlar(id),
    raqobatchi  TEXT        NOT NULL,
    narx        NUMERIC(18,2) NOT NULL,
    sana        DATE        DEFAULT CURRENT_DATE,
    izoh        TEXT        DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_raqobat_user
    ON raqobat_narxlar(user_id, tovar_id, sana DESC);
SELECT enable_rls('raqobat_narxlar');
