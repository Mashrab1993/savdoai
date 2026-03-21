-- ════════════════════════════════════════════════════════════════
--  Migration: v21.5 SAP-GRADE
--  Jurnal (Double-Entry Ledger) + Hujjat Versiyalar
-- ════════════════════════════════════════════════════════════════

-- Jurnal yozuvlar (sarlavha)
CREATE TABLE IF NOT EXISTS jurnal_yozuvlar (
    id              BIGSERIAL   PRIMARY KEY,
    jurnal_id       TEXT        NOT NULL UNIQUE,
    user_id         BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tur             TEXT        NOT NULL,
    sana            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tavsif          TEXT,
    jami_debit      NUMERIC(18,2) NOT NULL DEFAULT 0,
    jami_credit     NUMERIC(18,2) NOT NULL DEFAULT 0,
    manba_id        BIGINT      DEFAULT 0,
    manba_jadval    TEXT,
    idempotency_key TEXT        UNIQUE,
    yaratilgan      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT jurnal_balans CHECK (jami_debit = jami_credit)
);
CREATE INDEX IF NOT EXISTS idx_jurnal_user ON jurnal_yozuvlar(user_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_tur ON jurnal_yozuvlar(tur);
CREATE INDEX IF NOT EXISTS idx_jurnal_sana ON jurnal_yozuvlar(sana DESC);
CREATE INDEX IF NOT EXISTS idx_jurnal_idemp ON jurnal_yozuvlar(idempotency_key) WHERE idempotency_key IS NOT NULL;
ALTER TABLE jurnal_yozuvlar ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY jurnal_isolation ON jurnal_yozuvlar USING (user_id = current_uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Jurnal qatorlar (debit/credit)
CREATE TABLE IF NOT EXISTS jurnal_qatorlar (
    id          BIGSERIAL   PRIMARY KEY,
    jurnal_id   BIGINT      NOT NULL REFERENCES jurnal_yozuvlar(id) ON DELETE CASCADE,
    hisob       TEXT        NOT NULL,
    debit       NUMERIC(18,2) NOT NULL DEFAULT 0,
    credit      NUMERIC(18,2) NOT NULL DEFAULT 0,
    tavsif      TEXT,
    CONSTRAINT qator_bir_tomon CHECK (NOT (debit > 0 AND credit > 0))
);
CREATE INDEX IF NOT EXISTS idx_jq_jurnal ON jurnal_qatorlar(jurnal_id);
CREATE INDEX IF NOT EXISTS idx_jq_hisob ON jurnal_qatorlar(hisob);

-- Hujjat versiyalar (document versioning)
CREATE TABLE IF NOT EXISTS hujjat_versiyalar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hujjat_turi TEXT        NOT NULL,
    hujjat_id   BIGINT      NOT NULL,
    versiya     INTEGER     NOT NULL DEFAULT 1,
    old_data    JSONB,
    new_data    JSONB,
    sabab       TEXT,
    yaratilgan  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hv_user ON hujjat_versiyalar(user_id);
CREATE INDEX IF NOT EXISTS idx_hv_hujjat ON hujjat_versiyalar(hujjat_turi, hujjat_id);
ALTER TABLE hujjat_versiyalar ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY hujjat_isolation ON hujjat_versiyalar USING (user_id = current_uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
