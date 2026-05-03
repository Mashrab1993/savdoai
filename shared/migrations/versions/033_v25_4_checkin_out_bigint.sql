-- v25.4.0 — CHECKIN_OUT user_id/klient_id INT → BIGINT
-- 2026-05-03
--
-- BUG: 032_v25_4_checkin_out.sql jadvalni INTEGER (INT4) bilan yaratdi,
-- lekin Telegram user_id'lar 2.1B'dan katta (7888864785) — overflow.
-- /tashrif/tarix → asyncpg.DataError: value out of int32 range
--
-- Tuzatish: BIGINT ga o'zgartirish.

ALTER TABLE checkin_out ALTER COLUMN user_id TYPE BIGINT;
ALTER TABLE checkin_out ALTER COLUMN klient_id TYPE BIGINT;

-- Sequence ham BIGINT bo'lishi uchun id ham migrate
ALTER TABLE checkin_out ALTER COLUMN id TYPE BIGINT;
