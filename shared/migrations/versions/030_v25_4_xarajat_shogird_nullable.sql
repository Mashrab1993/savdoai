-- v25.4.0 — XARAJATLAR.shogird_id NULLABLE
-- 2026-04-28
-- Shaxsiy va oilaviy xarajatlar uchun shogird_id NULL bo'lishi mumkin.
-- Eski schema NOT NULL bo'lgan, bu admin'ning o'z xarajatini yozishga to'sqinlik qilardi.

ALTER TABLE xarajatlar ALTER COLUMN shogird_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_xar_admin_only
    ON xarajatlar(admin_uid, sana DESC)
    WHERE shogird_id IS NULL;
