-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SAVDOAI v25.4.0 — BARCHA YANGI JADVALLAR                      ║
-- ║                                                                  ║
-- ║  Ishga tushirish:                                                ║
-- ║  psql $DATABASE_URL -f migration_v25_4_0.sql                    ║
-- ║  yoki API: POST /api/config/migrate                             ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════
-- 1. SERVER KONFIGURATSIYA
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS server_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    modul VARCHAR(50) NOT NULL,
    sozlamalar JSONB NOT NULL DEFAULT '{}',
    yangilangan TIMESTAMPTZ DEFAULT NOW(),
    yaratilgan TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, modul)
);
CREATE INDEX IF NOT EXISTS idx_server_config_user ON server_config(user_id);
CREATE INDEX IF NOT EXISTS idx_server_config_modul ON server_config(user_id, modul);

-- Config o'zgarish tarixi
CREATE TABLE IF NOT EXISTS config_tarix (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    modul VARCHAR(50) NOT NULL,
    eski_qiymat JSONB,
    yangi_qiymat JSONB NOT NULL,
    ozgartiruvchi VARCHAR(100) DEFAULT 'system',
    vaqt TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_config_tarix_user ON config_tarix(user_id, vaqt DESC);

-- ═══════════════════════════════════════════════════════
-- 2. SYNC LOG (Smartup AutoSyncLogTable — 19 field)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    sync_turi VARCHAR(20) NOT NULL DEFAULT 'manual',
    boshlangan TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tugagan TIMESTAMPTZ,
    yuborilgan_bayt BIGINT DEFAULT 0,
    qabul_qilingan_bayt BIGINT DEFAULT 0,
    entity_soni INTEGER DEFAULT 0,
    status_kod INTEGER DEFAULT 200,
    tarmoq_turi VARCHAR(20),
    batareya_foiz INTEGER,
    xato_xabar TEXT,
    stacktrace TEXT,
    vaqt_mintaqasi VARCHAR(50),
    sync_davomiyligi_ms INTEGER,
    server_javob_vaqti_ms INTEGER,
    muvaffaqiyatli BOOLEAN DEFAULT TRUE,
    ip_manzil VARCHAR(45),
    qurilma_info TEXT,
    CONSTRAINT sync_log_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_sync_log_user_vaqt ON sync_log(user_id, boshlangan DESC);

-- ═══════════════════════════════════════════════════════
-- 3. AKSIYALAR
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aksiyalar (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nomi VARCHAR(200) NOT NULL,
    turi VARCHAR(30) NOT NULL,
    faol BOOLEAN DEFAULT TRUE,
    boshlanish_sanasi DATE,
    tugash_sanasi DATE,
    min_summa NUMERIC(18,2) DEFAULT 0,
    min_miqdor INTEGER DEFAULT 0,
    max_qollash_soni INTEGER DEFAULT 0,
    chegirma_foiz NUMERIC(5,2) DEFAULT 0,
    chegirma_summa NUMERIC(18,2) DEFAULT 0,
    maxsus_narx NUMERIC(18,2) DEFAULT 0,
    bonus_ball_koeffitsient NUMERIC(5,2) DEFAULT 0,
    hadya_shart_miqdor INTEGER DEFAULT 0,
    hadya_bepul_miqdor INTEGER DEFAULT 0,
    barcha_tovarlar BOOLEAN DEFAULT TRUE,
    barcha_klientlar BOOLEAN DEFAULT TRUE,
    prioritet INTEGER DEFAULT 0,
    yaratilgan TIMESTAMPTZ DEFAULT NOW(),
    yangilangan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aksiyalar_user ON aksiyalar(user_id);
CREATE INDEX IF NOT EXISTS idx_aksiyalar_faol ON aksiyalar(user_id, faol) WHERE faol = TRUE;

CREATE TABLE IF NOT EXISTS aksiya_tovarlar (
    id SERIAL PRIMARY KEY,
    aksiya_id INTEGER NOT NULL REFERENCES aksiyalar(id) ON DELETE CASCADE,
    tovar_id INTEGER NOT NULL,
    UNIQUE(aksiya_id, tovar_id)
);

CREATE TABLE IF NOT EXISTS aksiya_klientlar (
    id SERIAL PRIMARY KEY,
    aksiya_id INTEGER NOT NULL REFERENCES aksiyalar(id) ON DELETE CASCADE,
    klient_id INTEGER NOT NULL,
    UNIQUE(aksiya_id, klient_id)
);

CREATE TABLE IF NOT EXISTS aksiya_kategoriyalar (
    id SERIAL PRIMARY KEY,
    aksiya_id INTEGER NOT NULL REFERENCES aksiyalar(id) ON DELETE CASCADE,
    kategoriya_nomi VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS aksiya_tarix (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    aksiya_id INTEGER NOT NULL,
    buyurtma_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL,
    asl_summa NUMERIC(18,2),
    chegirma_summa NUMERIC(18,2),
    yangi_summa NUMERIC(18,2),
    qollangan_vaqt TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aksiya_tarix_user ON aksiya_tarix(user_id, qollangan_vaqt DESC);

-- ═══════════════════════════════════════════════════════
-- 4. CHECK-IN / CHECK-OUT
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS checkin_out (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL,
    turi VARCHAR(10) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy REAL,
    vaqt TIMESTAMPTZ DEFAULT NOW(),
    izoh TEXT,
    foto_url TEXT,
    CONSTRAINT checkin_out_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_checkin_user_klient ON checkin_out(user_id, klient_id, vaqt DESC);

-- ═══════════════════════════════════════════════════════
-- 5. GPS TRACKS
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gps_tracks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy REAL,
    provider VARCHAR(20),
    battery_level INTEGER,
    track_date DATE,
    track_time TIME,
    timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gps_user_date ON gps_tracks(user_id, track_date DESC);

-- ═══════════════════════════════════════════════════════
-- 6. SOTUV TAGLAR
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sotuv_taglar (
    id SERIAL PRIMARY KEY,
    sotuv_id INTEGER NOT NULL,
    tag VARCHAR(100) NOT NULL,
    user_id INTEGER NOT NULL,
    yaratilgan TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sotuv_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_sotuv_taglar ON sotuv_taglar(user_id, sotuv_id);

-- ═══════════════════════════════════════════════════════
-- 7. SOTUVLAR JADVALIGA YANGI USTUNLAR
-- ═══════════════════════════════════════════════════════

DO $$ BEGIN
    ALTER TABLE sotuvlar ADD COLUMN IF NOT EXISTS nasiya BOOLEAN DEFAULT FALSE;
    ALTER TABLE sotuvlar ADD COLUMN IF NOT EXISTS nasiya_muddati TIMESTAMPTZ;
    ALTER TABLE sotuvlar ADD COLUMN IF NOT EXISTS bekor_vaqti TIMESTAMPTZ;
    ALTER TABLE sotuvlar ADD COLUMN IF NOT EXISTS checkin_id INTEGER;
    ALTER TABLE sotuvlar ADD COLUMN IF NOT EXISTS aksiya_chegirma NUMERIC(18,2) DEFAULT 0;
    ALTER TABLE sotuvlar ADD COLUMN IF NOT EXISTS bonus_ball NUMERIC(10,2) DEFAULT 0;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════
-- MIGRATION TUGADI
-- ═══════════════════════════════════════════════════════

DO $$ BEGIN
    RAISE NOTICE 'SavdoAI v25.4.0 migration muvaffaqiyatli tugadi!';
    RAISE NOTICE 'Yangi jadvallar: server_config, config_tarix, sync_log, aksiyalar, aksiya_tovarlar, aksiya_klientlar, aksiya_kategoriyalar, aksiya_tarix, checkin_out, gps_tracks, sotuv_taglar';
END $$;

-- ═══════════════════════════════════════════════════════════
--  SD AGENT GAPS — YANGI JADVALLAR
-- ═══════════════════════════════════════════════════════════

-- Dona + Blok
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS blok_hajmi INTEGER DEFAULT 1;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS blok_narx NUMERIC(18,2) DEFAULT 0;

-- Tara (Idish)
CREATE TABLE IF NOT EXISTS tara_turlari (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    nomi VARCHAR(200) NOT NULL, faol BOOLEAN DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS tara_harakatlar (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL, tara_turi_id INTEGER NOT NULL,
    turi VARCHAR(20) NOT NULL, miqdor INTEGER DEFAULT 0,
    izoh TEXT, sana TIMESTAMPTZ DEFAULT NOW(),
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION
);

-- Oddment
CREATE TABLE IF NOT EXISTS oddment (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    klient_id INTEGER NOT NULL, sana TIMESTAMPTZ DEFAULT NOW(), jami_tovar INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS oddment_tovarlar (
    id SERIAL PRIMARY KEY, oddment_id INTEGER NOT NULL,
    tovar_id INTEGER NOT NULL, tovar_nomi VARCHAR(200),
    db_qoldiq NUMERIC(12,2) DEFAULT 0, fizik_qoldiq NUMERIC(12,2) DEFAULT 0,
    farq NUMERIC(12,2) DEFAULT 0
);

-- Almashtirish
CREATE TABLE IF NOT EXISTS almashtirishlar (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, klient_id INTEGER NOT NULL,
    sababi TEXT, eski_tovar_id INTEGER, yangi_tovar_id INTEGER,
    eski_miqdor NUMERIC(12,2), yangi_miqdor NUMERIC(12,2),
    foto_url TEXT, holat VARCHAR(20) DEFAULT 'yangi', sana TIMESTAMPTZ DEFAULT NOW()
);

-- Klient kategoriya ruxsat
CREATE TABLE IF NOT EXISTS klient_kategoriya_ruxsat (
    id SERIAL PRIMARY KEY, klient_id INTEGER NOT NULL,
    kategoriya VARCHAR(100) NOT NULL, UNIQUE(klient_id, kategoriya)
);

-- Juft/Toq hafta + QR
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS hafta_turi VARCHAR(10) DEFAULT 'har';
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS qr_kod VARCHAR(100) UNIQUE;

-- Bilimlar bazasi
CREATE TABLE IF NOT EXISTS bilimlar_bazasi (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    sarlavha VARCHAR(300) NOT NULL, matn TEXT, kategoriya VARCHAR(100),
    turi VARCHAR(20) DEFAULT 'maqola', fayl_url TEXT, video_url TEXT,
    tartib INTEGER DEFAULT 0, faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);

-- Chegirma tekshirish
CREATE TABLE IF NOT EXISTS chegirma_tekshirish (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
    klient_id INTEGER, soralgan_chegirma NUMERIC(5,2),
    tasdiqlangan_chegirma NUMERIC(5,2), holat VARCHAR(20) DEFAULT 'kutilmoqda',
    sana TIMESTAMPTZ DEFAULT NOW()
);

-- Tashrif turi
ALTER TABLE checkin_out ADD COLUMN IF NOT EXISTS tashrif_turi VARCHAR(30) DEFAULT 'other';
