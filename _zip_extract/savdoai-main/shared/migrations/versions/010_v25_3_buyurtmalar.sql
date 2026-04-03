-- ═══════════════════════════════════════════════════════════════
-- v25.3.2 — Buyurtmalar jadvali (Klient mini-do'kon)
-- Klientlar Telegram Mini App orqali buyurtma beradi
-- Idempotent — qayta ishga tushirish xavfsiz
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS buyurtmalar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    klient_ismi TEXT        DEFAULT '',
    telefon     TEXT        DEFAULT '',
    izoh        TEXT        DEFAULT '',
    holat       TEXT        DEFAULT 'yangi',
    yaratilgan  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyurtma_user
    ON buyurtmalar(user_id, yaratilgan DESC);

CREATE TABLE IF NOT EXISTS buyurtma_tovarlar (
    id           BIGSERIAL   PRIMARY KEY,
    buyurtma_id  BIGINT      NOT NULL REFERENCES buyurtmalar(id) ON DELETE CASCADE,
    tovar_id     BIGINT      REFERENCES tovarlar(id),
    nomi         TEXT        NOT NULL,
    miqdor       NUMERIC(12,3) NOT NULL DEFAULT 1,
    narx         NUMERIC(18,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_buyurtma_tovar
    ON buyurtma_tovarlar(buyurtma_id);

SELECT enable_rls('buyurtmalar');
