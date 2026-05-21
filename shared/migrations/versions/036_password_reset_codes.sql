-- 036 — Password reset codes (telefon-asosli o'zini-o'zi parol tiklash)
-- Audit P1 (2026-05-20): admin'siz parol tiklash imkoni yo'q edi.
-- Endi user telefoniga 6-xonali kod yuboriladi (Telegram orqali) va
-- shu kodni kiritib yangi parol o'rnata oladi.
--
-- Jadval: password_reset_codes
--   * phone        — normallashtirilgan telefon (998...)
--   * user_id      — kim uchun (lookup tezligi uchun)
--   * code_hash    — kodning SHA-256 hashi (plain text saqlanmaydi)
--   * expires_at   — kod muddati (default 10 daqiqa)
--   * used         — bir martagina ishlatilishi uchun bayroq
--   * created_at   — yaratilgan vaqt (rate-limit oynasini hisoblash uchun)
--
-- RLS yo'q — global jadval (login oldi, JWT yo'q).

CREATE TABLE IF NOT EXISTS password_reset_codes (
    id          BIGSERIAL    PRIMARY KEY,
    phone       TEXT         NOT NULL,
    user_id     BIGINT       NOT NULL,
    code_hash   TEXT         NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ip_addr     TEXT
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_phone_created
    ON password_reset_codes(phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_lookup
    ON password_reset_codes(phone, used, expires_at);
