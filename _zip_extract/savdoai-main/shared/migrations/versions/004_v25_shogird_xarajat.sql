-- ═══════════════════════════════════════════════════════════
--  SavdoAI v25.0 — SHOGIRD XARAJAT NAZORATI
--  Admin shogirdlarini qo'shadi, shogirdlar xarajat tashlaydi
--  Admin hammani real-time ko'radi
-- ═══════════════════════════════════════════════════════════

-- 1. Shogirdlar jadvali
CREATE TABLE IF NOT EXISTS shogirdlar (
    id              BIGSERIAL   PRIMARY KEY,
    admin_uid       BIGINT      NOT NULL REFERENCES users(id),
    telegram_uid    BIGINT      NOT NULL,
    ism             TEXT        NOT NULL,
    telefon         TEXT,
    lavozim         TEXT        DEFAULT 'haydovchi',
    kunlik_limit    DECIMAL(18,2) NOT NULL DEFAULT 500000,
    oylik_limit     DECIMAL(18,2) NOT NULL DEFAULT 10000000,
    faol            BOOLEAN     NOT NULL DEFAULT TRUE,
    yaratilgan      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(admin_uid, telegram_uid)
);

-- 2. Xarajat kategoriyalari
CREATE TABLE IF NOT EXISTS xarajat_kategoriyalar (
    id          BIGSERIAL   PRIMARY KEY,
    admin_uid   BIGINT      NOT NULL REFERENCES users(id),
    nomi        TEXT        NOT NULL,
    emoji       TEXT        DEFAULT '💰',
    faol        BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE(admin_uid, nomi)
);

-- 3. Xarajatlar jadvali (asosiy)
CREATE TABLE IF NOT EXISTS xarajatlar (
    id              BIGSERIAL   PRIMARY KEY,
    admin_uid       BIGINT      NOT NULL REFERENCES users(id),
    shogird_id      BIGINT      NOT NULL REFERENCES shogirdlar(id),
    kategoriya_id   BIGINT      REFERENCES xarajat_kategoriyalar(id),
    kategoriya_nomi TEXT        NOT NULL DEFAULT 'boshqa',
    summa           DECIMAL(18,2) NOT NULL,
    izoh            TEXT,
    rasm_file_id    TEXT,
    tasdiqlangan    BOOLEAN     NOT NULL DEFAULT FALSE,
    tasdiq_vaqti    TIMESTAMPTZ,
    bekor_qilingan  BOOLEAN     NOT NULL DEFAULT FALSE,
    sana            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Default kategoriyalar qo'shish funksiyasi
DO $$ BEGIN
    -- Bu funksiya yangi admin registratsiya qilganda chaqiriladi
    -- Hozircha manual qo'shiladi
END $$;

-- 5. RLS
ALTER TABLE shogirdlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE xarajat_kategoriyalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE xarajatlar ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY rls_shogirdlar ON shogirdlar USING (admin_uid = current_setting('app.user_id')::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY rls_xarajat_kat ON xarajat_kategoriyalar USING (admin_uid = current_setting('app.user_id')::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY rls_xarajatlar ON xarajatlar USING (admin_uid = current_setting('app.user_id')::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Indexlar
CREATE INDEX IF NOT EXISTS idx_xar_shogird ON xarajatlar(shogird_id, sana DESC);
CREATE INDEX IF NOT EXISTS idx_xar_admin ON xarajatlar(admin_uid, sana DESC);
CREATE INDEX IF NOT EXISTS idx_xar_kat ON xarajatlar(kategoriya_nomi, sana DESC);
CREATE INDEX IF NOT EXISTS idx_shogird_admin ON shogirdlar(admin_uid, faol);
CREATE INDEX IF NOT EXISTS idx_shogird_tg ON shogirdlar(telegram_uid);
