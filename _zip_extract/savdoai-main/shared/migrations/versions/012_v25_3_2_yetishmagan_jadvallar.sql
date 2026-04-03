-- ═══════════════════════════════════════════════════════════════
--  v25.3.2 — YETISHMAGAN JADVALLAR
--  fakturalar, nakladnoy_counter, buyurtmalar, buyurtma_tovarlar
-- ═══════════════════════════════════════════════════════════════

-- Fakturalar (hisob-faktura)
CREATE TABLE IF NOT EXISTS fakturalar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    raqam           TEXT            NOT NULL,
    klient_ismi     TEXT            NOT NULL,
    jami_summa      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    tovarlar        JSONB           DEFAULT '[]'::jsonb,
    bank_rekvizit   JSONB,
    holat           TEXT            NOT NULL DEFAULT 'yaratilgan'
                    CHECK(holat IN('yaratilgan','yuborilgan','tolangan','bekor')),
    izoh            TEXT,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_faktura_uid ON fakturalar(user_id);
CREATE INDEX IF NOT EXISTS idx_faktura_holat ON fakturalar(user_id, holat);
SELECT enable_rls('fakturalar');

-- Nakladnoy counter (ketma-ket raqam uchun)
CREATE TABLE IF NOT EXISTS nakladnoy_counter (
    user_id         BIGINT          PRIMARY KEY REFERENCES users(id),
    oxirgi_raqam    INT             NOT NULL DEFAULT 0,
    yangilangan     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Nakladnoylar (arxiv)
CREATE TABLE IF NOT EXISTS nakladnoylar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    sessiya_id      BIGINT,
    raqam           TEXT            NOT NULL,
    klient_ismi     TEXT,
    jami_summa      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    qarz            DECIMAL(18,2)   NOT NULL DEFAULT 0,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
SELECT enable_rls('nakladnoylar');

-- Buyurtmalar (mini-dokon)
CREATE TABLE IF NOT EXISTS buyurtmalar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    klient_ismi     TEXT            NOT NULL DEFAULT '',
    telefon         TEXT            DEFAULT '',
    izoh            TEXT            DEFAULT '',
    holat           TEXT            NOT NULL DEFAULT 'yangi'
                    CHECK(holat IN('yangi','qabul_qilindi','bajarildi','bekor')),
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buyurtma_uid ON buyurtmalar(user_id);
SELECT enable_rls('buyurtmalar');

-- Buyurtma tovarlar
CREATE TABLE IF NOT EXISTS buyurtma_tovarlar (
    id              BIGSERIAL       PRIMARY KEY,
    buyurtma_id     BIGINT          NOT NULL REFERENCES buyurtmalar(id) ON DELETE CASCADE,
    tovar_id        BIGINT          REFERENCES tovarlar(id),
    nomi            TEXT            NOT NULL,
    miqdor          DECIMAL(18,3)   NOT NULL DEFAULT 1,
    narx            DECIMAL(18,2)   NOT NULL DEFAULT 0,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buyurtma_tv ON buyurtma_tovarlar(buyurtma_id);
