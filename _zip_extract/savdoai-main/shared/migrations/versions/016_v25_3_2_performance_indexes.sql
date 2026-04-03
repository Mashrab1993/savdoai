-- ═══════════════════════════════════════════════════════════════
--  v25.3.2 — PERFORMANCE OPTIMIZATION
--  Composite indexes for most-used queries
-- ═══════════════════════════════════════════════════════════════

-- Sotuv sessiya — kunlik hisobot (eng ko'p chaqiriladigan query)
CREATE INDEX IF NOT EXISTS idx_ss_uid_sana
    ON sotuv_sessiyalar(user_id, sana DESC);

-- Sotuv sessiya — klient bo'yicha tarix
CREATE INDEX IF NOT EXISTS idx_ss_uid_klient
    ON sotuv_sessiyalar(user_id, klient_id, sana DESC);

-- Chiqimlar — foyda hisoblash (sotuv * olish_narxi)
CREATE INDEX IF NOT EXISTS idx_ch_uid_sana
    ON chiqimlar(user_id, sana DESC);

-- Chiqimlar — tovar tarix
CREATE INDEX IF NOT EXISTS idx_ch_tovar_sana
    ON chiqimlar(tovar_id, sana DESC);

-- Qarzlar — faol qarzlar (eng ko'p tekshiriladigan)
CREATE INDEX IF NOT EXISTS idx_qarz_uid_faol
    ON qarzlar(user_id, yopildi, qolgan)
    WHERE yopildi = FALSE AND qolgan > 0;

-- Qarzlar — muddati o'tgan
CREATE INDEX IF NOT EXISTS idx_qarz_muddat
    ON qarzlar(user_id, muddat)
    WHERE yopildi = FALSE AND qolgan > 0 AND muddat IS NOT NULL;

-- Tovarlar — kam qoldiq (dashboard query)
CREATE INDEX IF NOT EXISTS idx_tovar_kam_qoldiq
    ON tovarlar(user_id, qoldiq, min_qoldiq)
    WHERE min_qoldiq > 0;

-- Tovarlar — nomi bo'yicha search (exact + LIKE)
CREATE INDEX IF NOT EXISTS idx_tovar_nomi_lower
    ON tovarlar(user_id, lower(nomi));

-- Klientlar — nomi bo'yicha search
CREATE INDEX IF NOT EXISTS idx_klient_nomi_lower
    ON klientlar(user_id, lower(ism));

-- Kirimlar — sana bo'yicha
CREATE INDEX IF NOT EXISTS idx_kirim_uid_sana
    ON kirimlar(user_id, sana DESC);

-- GPS log — agent tracking
CREATE INDEX IF NOT EXISTS idx_gps_uid_vaqt
    ON gps_log(user_id, vaqt DESC);

-- Loyalty — klient ball
CREATE INDEX IF NOT EXISTS idx_loyalty_uid_klient
    ON loyalty_ballar(user_id, klient_id);

-- Qarz eslatma — spam oldini olish
CREATE INDEX IF NOT EXISTS idx_eslatma_uid_klient
    ON qarz_eslatmalar(user_id, klient_id, yuborilgan DESC);
