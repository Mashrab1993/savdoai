-- ═══════════════════════════════════════════════════════════
--  SavdoAI v24.0 — SMART NARX TIZIMI
--  3 qatlam: Shaxsiy narx → Guruh narx → Oxirgi narx
-- ═══════════════════════════════════════════════════════════

-- 1. Narx guruhlari (Ulgurji, Chakana, VIP)
CREATE TABLE IF NOT EXISTS narx_guruhlari (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    nomi        TEXT        NOT NULL,
    izoh        TEXT,
    yaratilgan  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, nomi)
);

-- 2. Guruh narxlari (har guruh uchun har tovarning narxi)
CREATE TABLE IF NOT EXISTS guruh_narxlar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    guruh_id    BIGINT      NOT NULL REFERENCES narx_guruhlari(id) ON DELETE CASCADE,
    tovar_id    BIGINT      NOT NULL REFERENCES tovarlar(id) ON DELETE CASCADE,
    narx        DECIMAL(18,2) NOT NULL,
    yangilangan TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(guruh_id, tovar_id)
);

-- 3. Klient shaxsiy narxlari (eng yuqori prioritet)
CREATE TABLE IF NOT EXISTS klient_narxlar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    klient_id   BIGINT      NOT NULL REFERENCES klientlar(id) ON DELETE CASCADE,
    tovar_id    BIGINT      NOT NULL REFERENCES tovarlar(id) ON DELETE CASCADE,
    narx        DECIMAL(18,2) NOT NULL,
    yangilangan TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(klient_id, tovar_id)
);

-- 4. Klientlar jadvaliga guruh qo'shish
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS narx_guruh_id BIGINT REFERENCES narx_guruhlari(id);

-- 5. RLS
ALTER TABLE narx_guruhlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE guruh_narxlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE klient_narxlar ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY rls_narx_guruhlari ON narx_guruhlari USING (user_id = current_setting('app.user_id')::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY rls_guruh_narxlar ON guruh_narxlar USING (user_id = current_setting('app.user_id')::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY rls_klient_narxlar ON klient_narxlar USING (user_id = current_setting('app.user_id')::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Indexlar
CREATE INDEX IF NOT EXISTS idx_guruh_narx_tovar ON guruh_narxlar(guruh_id, tovar_id);
CREATE INDEX IF NOT EXISTS idx_klient_narx_tovar ON klient_narxlar(klient_id, tovar_id);
CREATE INDEX IF NOT EXISTS idx_klient_guruh ON klientlar(narx_guruh_id) WHERE narx_guruh_id IS NOT NULL;
