-- ════════════════════════════════════════════════════════════
--  v25.3 LOGIN/PAROL — Web panel uchun login tizimi
--  Admin do'konchilariga login+parol beradi
--  Do'konchi login+parol YOKI telefon+parol bilan kiradi
-- ════════════════════════════════════════════════════════════

-- 1. Login ustuni (unique, ixtiyoriy)
ALTER TABLE users ADD COLUMN IF NOT EXISTS login TEXT;

-- 2. Parol hash (PBKDF2-SHA256, salt bilan)
ALTER TABLE users ADD COLUMN IF NOT EXISTS parol_hash TEXT;

-- 3. Unique index — bir xil login ikki kishi da bo'lmasligi uchun
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login
    ON users(lower(login)) WHERE login IS NOT NULL AND login != '';

-- 4. Telefon unique index (telefon bilan kirish uchun)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telefon_unique
    ON users(telefon) WHERE telefon IS NOT NULL AND telefon != '';
