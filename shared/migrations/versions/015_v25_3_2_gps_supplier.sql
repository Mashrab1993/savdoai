-- ═══════════════════════════════════════════════════════════════
--  v25.3.2 — GPS TRACKING + SUPPLIER AUTO-ORDER
-- ═══════════════════════════════════════════════════════════════

-- GPS log (agent joylashuvi)
CREATE TABLE IF NOT EXISTS gps_log (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    accuracy        REAL,
    turi            TEXT            DEFAULT 'location'
                    CHECK(turi IN('location','visit','checkin','checkout')),
    izoh            TEXT            DEFAULT '',
    vaqt            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gps_uid_vaqt ON gps_log(user_id, vaqt DESC);
SELECT enable_rls('gps_log');

-- Yetkazib beruvchilar
CREATE TABLE IF NOT EXISTS yetkazib_beruvchilar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    nomi            TEXT            NOT NULL,
    telefon         TEXT            DEFAULT '',
    telegram_id     BIGINT,
    kategoriyalar   TEXT[]          DEFAULT '{}',
    faol            BOOLEAN         NOT NULL DEFAULT TRUE,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, lower(nomi))
);
SELECT enable_rls('yetkazib_beruvchilar');

-- Supplier buyurtmalar
CREATE TABLE IF NOT EXISTS supplier_buyurtmalar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    supplier_id     BIGINT          NOT NULL REFERENCES yetkazib_beruvchilar(id),
    holat           TEXT            NOT NULL DEFAULT 'tayyorlanmoqda'
                    CHECK(holat IN('tayyorlanmoqda','yuborildi','tasdiqlandi','yetkazildi','bekor')),
    jami_summa      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    tovarlar        JSONB           DEFAULT '[]'::jsonb,
    izoh            TEXT            DEFAULT '',
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
SELECT enable_rls('supplier_buyurtmalar');
