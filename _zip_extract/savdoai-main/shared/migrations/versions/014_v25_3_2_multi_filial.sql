-- ═══════════════════════════════════════════════════════════════
--  v25.3.2 — MULTI-FILIAL INFRASTRUKTURA
--  Bir nechta do'kon/ombor boshqarish
-- ═══════════════════════════════════════════════════════════════

-- Filiallar jadvali
CREATE TABLE IF NOT EXISTS filiallar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    nomi            TEXT            NOT NULL,
    manzil          TEXT            DEFAULT '',
    telefon         TEXT            DEFAULT '',
    turi            TEXT            NOT NULL DEFAULT 'dokon'
                    CHECK(turi IN('dokon','ombor','sklad','filial')),
    faol            BOOLEAN         NOT NULL DEFAULT TRUE,
    asosiy          BOOLEAN         NOT NULL DEFAULT FALSE,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, lower(nomi))
);
SELECT enable_rls('filiallar');

-- Filial tovar qoldiqlari (har filialda alohida)
CREATE TABLE IF NOT EXISTS filial_qoldiqlar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    filial_id       BIGINT          NOT NULL REFERENCES filiallar(id),
    tovar_id        BIGINT          NOT NULL REFERENCES tovarlar(id),
    qoldiq          DECIMAL(18,4)   NOT NULL DEFAULT 0,
    min_qoldiq      DECIMAL(18,4)   NOT NULL DEFAULT 0,
    yangilangan     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE(filial_id, tovar_id)
);
CREATE INDEX IF NOT EXISTS idx_fq_filial ON filial_qoldiqlar(filial_id);
CREATE INDEX IF NOT EXISTS idx_fq_tovar ON filial_qoldiqlar(tovar_id);
SELECT enable_rls('filial_qoldiqlar');

-- Filiallar arasi transfer
CREATE TABLE IF NOT EXISTS filial_transferlar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    dan_filial_id   BIGINT          NOT NULL REFERENCES filiallar(id),
    ga_filial_id    BIGINT          NOT NULL REFERENCES filiallar(id),
    tovar_id        BIGINT          NOT NULL REFERENCES tovarlar(id),
    tovar_nomi      TEXT            NOT NULL DEFAULT '',
    miqdor          DECIMAL(18,4)   NOT NULL,
    holat           TEXT            NOT NULL DEFAULT 'kutilmoqda'
                    CHECK(holat IN('kutilmoqda','tasdiqlangan','bekor')),
    izoh            TEXT            DEFAULT '',
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
SELECT enable_rls('filial_transferlar');
