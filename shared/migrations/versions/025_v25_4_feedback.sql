-- v25.4.0 — FEEDBACK (shikoyat/fikr) MODULI
-- 2026-04-17
-- Klient feedback qoldiradi → admin ko'radi, javob beradi.

CREATE TABLE IF NOT EXISTS feedback (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- admin
    klient_id BIGINT NULL REFERENCES klientlar(id) ON DELETE SET NULL,
    shogird_id BIGINT NULL,                 -- agar shogird yozgan bo'lsa
    matn TEXT NOT NULL,
    turi TEXT DEFAULT 'fikr',                -- fikr / shikoyat / taklif / maqtov
    baho SMALLINT NULL CHECK (baho BETWEEN 1 AND 5),
    javob_berildi BOOLEAN DEFAULT FALSE,
    admin_javobi TEXT DEFAULT '',
    javob_vaqti TIMESTAMP NULL,
    manba TEXT DEFAULT 'telegram',           -- telegram / ovoz / web
    yaratilgan TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_uid_javob ON feedback(user_id, javob_berildi, yaratilgan DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_klient ON feedback(user_id, klient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_turi ON feedback(user_id, turi);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feedback_iso ON feedback;
CREATE POLICY feedback_iso ON feedback
    FOR ALL USING (user_id = current_setting('app.uid')::bigint);

COMMENT ON TABLE feedback IS
    'SalesDoc /report/feedbackReport asosida: klient/shogird fikrlari, shikoyatlari, taklif va maqtovlar.';
