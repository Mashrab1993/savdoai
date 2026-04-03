-- ═══════════════════════════════════════════════════════════════
--  v25.3.2 — YANGI KUCHLI JADVALLAR
--  Qarz eslatma, Loyalty, To'lov tracking
-- ═══════════════════════════════════════════════════════════════

-- Qarz eslatma tarixi (spam oldini olish)
CREATE TABLE IF NOT EXISTS qarz_eslatmalar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    klient_id       BIGINT          REFERENCES klientlar(id),
    klient_ismi     TEXT            NOT NULL DEFAULT '',
    summa           DECIMAL(18,2)   NOT NULL DEFAULT 0,
    usul            TEXT            NOT NULL DEFAULT 'telegram'
                    CHECK(usul IN('telegram','sms','qolda')),
    yuborilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eslatma_uid_klient
    ON qarz_eslatmalar(user_id, klient_id);
SELECT enable_rls('qarz_eslatmalar');

-- Loyalty ball tarixi
CREATE TABLE IF NOT EXISTS loyalty_ballar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    klient_id       BIGINT          NOT NULL REFERENCES klientlar(id),
    ball            INT             NOT NULL DEFAULT 0,
    tur             TEXT            NOT NULL DEFAULT 'yigish'
                    CHECK(tur IN('yigish','sarflash','bonus','referral')),
    sessiya_id      BIGINT,
    izoh            TEXT            DEFAULT '',
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_uid_klient
    ON loyalty_ballar(user_id, klient_id);
SELECT enable_rls('loyalty_ballar');

-- To'lov tracking (Click/Payme tranzaksiyalar)
CREATE TABLE IF NOT EXISTS tolov_tranzaksiyalar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    order_id        TEXT            NOT NULL,
    provider        TEXT            NOT NULL DEFAULT 'click'
                    CHECK(provider IN('click','payme','uzum','naqd','karta')),
    tranzaksiya_id  TEXT,
    summa           DECIMAL(18,2)   NOT NULL DEFAULT 0,
    holat           TEXT            NOT NULL DEFAULT 'kutilmoqda'
                    CHECK(holat IN('kutilmoqda','jarayonda','tolangan','bekor','xato','qaytarildi')),
    klient_ismi     TEXT,
    klient_id       BIGINT,
    meta            JSONB           DEFAULT '{}'::jsonb,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    yangilangan     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tolov_uid ON tolov_tranzaksiyalar(user_id);
CREATE INDEX IF NOT EXISTS idx_tolov_order ON tolov_tranzaksiyalar(order_id);
SELECT enable_rls('tolov_tranzaksiyalar');

-- KPI targetlar (agent uchun maqsadlar)
CREATE TABLE IF NOT EXISTS kpi_targetlar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    davr            TEXT            NOT NULL DEFAULT 'oylik'
                    CHECK(davr IN('kunlik','haftalik','oylik')),
    sotuv_soni      INT             DEFAULT 0,
    sotuv_summa     DECIMAL(18,2)   DEFAULT 0,
    yangi_klient    INT             DEFAULT 0,
    qarz_yigish     DECIMAL(18,2)   DEFAULT 0,
    boshlanish      DATE            NOT NULL DEFAULT CURRENT_DATE,
    tugash          DATE,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
SELECT enable_rls('kpi_targetlar');
