-- ═══════════════════════════════════════════════════════════════
-- v25.3.2 — Barcode ustuni (tovarlar jadvali)
-- Tovarlarni shtrix-kod bilan qidirish uchun
-- Idempotent — qayta ishga tushirish xavfsiz
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS barcode TEXT;

CREATE INDEX IF NOT EXISTS idx_tovarlar_barcode
    ON tovarlar(user_id, barcode)
    WHERE barcode IS NOT NULL;
