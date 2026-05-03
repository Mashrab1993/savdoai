-- v25.4.0 — CHECKIN_OUT (tashrif/check-in/out tarix)
-- 2026-05-03
--
-- BUG: GET /tashrif/tarix → 500 "relation checkin_out does not exist"
-- shared/services/guards_v2.py'da CHECK_IN_OUT_MIGRATION constant bor edi,
-- lekin u faqat POST /tashrif/migrate orqali bajarilardi (manual).
-- Production'ga hech qachon yuborilmagan → /tashrif/tarix yuqori xato.
--
-- Tuzatish: jadvalni avtomatik startupda yaratish.

CREATE TABLE IF NOT EXISTS checkin_out (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL,
    klient_id    INTEGER NOT NULL,
    turi         VARCHAR(10) NOT NULL,  -- checkin / checkout
    latitude     DOUBLE PRECISION,
    longitude    DOUBLE PRECISION,
    accuracy     REAL,
    vaqt         TIMESTAMPTZ DEFAULT NOW(),
    izoh         TEXT,
    foto_url     TEXT,
    CONSTRAINT checkin_out_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_checkin_user_klient
    ON checkin_out(user_id, klient_id, vaqt DESC);
