-- 035 — Mobile P3: equipment table
-- Adds the equipment table for mobile P3 (sovutkich/raf nazorati).
-- The visits feature reuses the existing checkin_out table with turi='checkin'.

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'ok',
    serial TEXT,
    comment TEXT,
    photo_path TEXT,
    last_check_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_user_client ON equipment(user_id, client_id);
