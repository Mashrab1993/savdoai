-- v25.4.0 — ENTERPRISE/EXTRAS jadvallari (auto-create on startup)
-- 2026-05-03
--
-- BUG: 30+ jadval kod ichida XX_MIGRATION_SQL constant'lar sifatida bor edi,
-- lekin faqat /enterprise/migrate, /aksiya/migrate va h.k. endpointlar
-- orqali manual ravishda yaratilardi. Production'ga hech qachon yuborilmagan.
-- Natijada 30+ endpoint 500 "relation does not exist" qaytaryapti edi.
--
-- Tuzatish: barcha enterprise tables'ni avtomatik startupda yaratish.
-- Telegram user_id'lar uchun BIGINT (INT4 overflow oldini olish).

-- ═══ 1. TOPSHIRIQLAR (Task Management) ═══
CREATE TABLE IF NOT EXISTS topshiriqlar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    agent_id BIGINT,
    klient_id BIGINT,
    sarlavha VARCHAR(300) NOT NULL,
    tavsif TEXT,
    turi VARCHAR(30) DEFAULT 'umumiy',
    muhimlik VARCHAR(10) DEFAULT 'oddiy',
    holat VARCHAR(20) DEFAULT 'yangi',
    muddat DATE,
    bajarilgan_vaqt TIMESTAMPTZ,
    natija TEXT,
    foto_url TEXT,
    yaratilgan TIMESTAMPTZ DEFAULT NOW(),
    yaratuvchi VARCHAR(50) DEFAULT 'admin'
);
CREATE INDEX IF NOT EXISTS idx_topshiriq_user ON topshiriqlar(user_id, holat);

-- ═══ 2. FOTOLAR ═══
CREATE TABLE IF NOT EXISTS fotolar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    turi VARCHAR(30) NOT NULL,
    bog_id BIGINT,
    fayl_nomi VARCHAR(300),
    fayl_url TEXT NOT NULL,
    fayl_hajmi BIGINT DEFAULT 0,
    kenglik INTEGER,
    balandlik INTEGER,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    izoh TEXT,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_foto_user ON fotolar(user_id, turi, bog_id);

-- ═══ 3. USKUNALAR (Equipment tracking) ═══
CREATE TABLE IF NOT EXISTS uskunalar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    klient_id BIGINT NOT NULL,
    nomi VARCHAR(200) NOT NULL,
    turi VARCHAR(50),
    seriya_raqami VARCHAR(100),
    inventar_raqami VARCHAR(100),
    holat VARCHAR(20) DEFAULT 'faol',
    olingan_sana DATE,
    qaytarilgan_sana DATE,
    foto_url TEXT,
    izoh TEXT,
    oxirgi_tekshirish TIMESTAMPTZ,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_uskuna_klient ON uskunalar(user_id, klient_id);

-- ═══ 4. FILIALLAR ═══
CREATE TABLE IF NOT EXISTS filiallar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    nomi VARCHAR(200) NOT NULL,
    manzil TEXT,
    telefon VARCHAR(20),
    turi VARCHAR(20) DEFAULT 'dokon',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    bosh_filial BOOLEAN DEFAULT FALSE,
    faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_filial_user ON filiallar(user_id);

CREATE TABLE IF NOT EXISTS filial_qoldiq (
    id BIGSERIAL PRIMARY KEY,
    filial_id BIGINT NOT NULL REFERENCES filiallar(id),
    tovar_id BIGINT NOT NULL,
    qoldiq NUMERIC(12,2) DEFAULT 0,
    min_qoldiq NUMERIC(12,2) DEFAULT 0,
    UNIQUE(filial_id, tovar_id)
);

-- ═══ 5. KUNLIK KASSA ═══
CREATE TABLE IF NOT EXISTS kunlik_kassa (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    sana DATE NOT NULL DEFAULT CURRENT_DATE,
    boshlangich_qoldiq NUMERIC(18,2) DEFAULT 0,
    naqd_kirim NUMERIC(18,2) DEFAULT 0,
    karta_kirim NUMERIC(18,2) DEFAULT 0,
    qarz_yigildi NUMERIC(18,2) DEFAULT 0,
    xarajat NUMERIC(18,2) DEFAULT 0,
    inkassa NUMERIC(18,2) DEFAULT 0,
    yakuniy_qoldiq NUMERIC(18,2) DEFAULT 0,
    yopilgan BOOLEAN DEFAULT FALSE,
    izoh TEXT,
    UNIQUE(user_id, sana)
);
CREATE INDEX IF NOT EXISTS idx_kassa_user ON kunlik_kassa(user_id, sana DESC);

-- ═══ 6. SERVER CONFIG ═══
CREATE TABLE IF NOT EXISTS server_config (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    modul VARCHAR(60) NOT NULL,
    kalit VARCHAR(120) NOT NULL,
    qiymat JSONB,
    yangilangan TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, modul, kalit)
);
CREATE INDEX IF NOT EXISTS idx_cfg_user ON server_config(user_id, modul);

CREATE TABLE IF NOT EXISTS config_tarix (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    modul VARCHAR(60),
    kalit VARCHAR(120),
    eski_qiymat JSONB,
    yangi_qiymat JSONB,
    o_zgartirgan_uid BIGINT,
    sana TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    modul VARCHAR(60),
    holat VARCHAR(20),
    izoh TEXT,
    sana TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 7. AKSIYALAR ═══
CREATE TABLE IF NOT EXISTS aksiyalar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    nomi VARCHAR(200) NOT NULL,
    tavsif TEXT,
    turi VARCHAR(30) DEFAULT 'chegirma',
    qiymat NUMERIC(12,2) DEFAULT 0,
    boshlanish_sana DATE,
    tugash_sana DATE,
    faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aksiya_user ON aksiyalar(user_id, faol);

CREATE TABLE IF NOT EXISTS aksiya_tovarlar (
    id BIGSERIAL PRIMARY KEY,
    aksiya_id BIGINT NOT NULL REFERENCES aksiyalar(id) ON DELETE CASCADE,
    tovar_id BIGINT NOT NULL,
    UNIQUE(aksiya_id, tovar_id)
);

-- ═══ 8. GAMIFICATION ═══
CREATE TABLE IF NOT EXISTS gamification (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    agent_id BIGINT,
    ball BIGINT DEFAULT 0,
    daraja VARCHAR(30) DEFAULT 'yangi',
    medallar JSONB DEFAULT '[]'::jsonb,
    yangilangan TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, agent_id)
);

CREATE TABLE IF NOT EXISTS leaderboard_tarix (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    agent_id BIGINT,
    ball BIGINT,
    sana DATE DEFAULT CURRENT_DATE
);

-- ═══ 9. VAN-SELLING ═══
CREATE TABLE IF NOT EXISTS van_marshrut (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    agent_id BIGINT,
    nomi VARCHAR(200),
    sana DATE DEFAULT CURRENT_DATE,
    holat VARCHAR(20) DEFAULT 'rejada',
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS van_yuklash (
    id BIGSERIAL PRIMARY KEY,
    marshrut_id BIGINT REFERENCES van_marshrut(id) ON DELETE CASCADE,
    tovar_id BIGINT,
    miqdor NUMERIC(12,2) DEFAULT 0
);

-- ═══ 10. WEBHOOKS ═══
CREATE TABLE IF NOT EXISTS webhooklar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    url TEXT NOT NULL,
    hodisalar JSONB DEFAULT '[]'::jsonb,
    faol BOOLEAN DEFAULT TRUE,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 11. KALENDAR / TASHRIF JADVALI ═══
CREATE TABLE IF NOT EXISTS tashrif_jadvali (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    agent_id BIGINT,
    klient_id BIGINT,
    sana DATE NOT NULL,
    vaqt TIME,
    holat VARCHAR(20) DEFAULT 'rejada',
    izoh TEXT,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tj_user_sana ON tashrif_jadvali(user_id, sana);

-- ═══ 12. BILDIRISHNOMALAR ═══
CREATE TABLE IF NOT EXISTS bildirishnomalar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    sarlavha VARCHAR(300),
    matn TEXT,
    turi VARCHAR(30) DEFAULT 'info',
    o_qildi BOOLEAN DEFAULT FALSE,
    sana TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bildirish_user ON bildirishnomalar(user_id, o_qildi);

-- ═══ 13. BILIMLAR BAZASI ═══
CREATE TABLE IF NOT EXISTS bilimlar_bazasi (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    sarlavha VARCHAR(300),
    matn TEXT,
    teglar JSONB DEFAULT '[]'::jsonb,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 14. KLASSIFIKATORLAR ═══
CREATE TABLE IF NOT EXISTS klassifikatorlar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    turi VARCHAR(60),
    nomi VARCHAR(200) NOT NULL,
    kod VARCHAR(60),
    saralash INTEGER DEFAULT 500,
    faol BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_klassif_user_turi ON klassifikatorlar(user_id, turi);

-- ═══ 15. NARX TURLARI ═══
CREATE TABLE IF NOT EXISTS narx_turlari (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    nomi VARCHAR(120) NOT NULL,
    kod VARCHAR(60),
    asosiy BOOLEAN DEFAULT FALSE,
    izoh TEXT,
    yaratilgan TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, nomi)
);

-- ═══ 16. TARIFLAR ═══
CREATE TABLE IF NOT EXISTS tariflar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    nomi VARCHAR(120) NOT NULL,
    narxi NUMERIC(12,2) DEFAULT 0,
    izoh TEXT,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 17. TARA TURLARI (qaytarilanadigan idishlar) ═══
CREATE TABLE IF NOT EXISTS tara_turlari (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    nomi VARCHAR(120) NOT NULL,
    kod VARCHAR(60),
    narxi NUMERIC(12,2) DEFAULT 0,
    izoh TEXT
);

CREATE TABLE IF NOT EXISTS tara_harakatlar (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    klient_id BIGINT,
    tara_turi_id BIGINT,
    harakat VARCHAR(20),
    miqdor NUMERIC(12,2) DEFAULT 0,
    sana TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 18. GPS TRACKS ═══
CREATE TABLE IF NOT EXISTS gps_tracks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    agent_id BIGINT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy REAL,
    vaqt TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gps_user_vaqt ON gps_tracks(user_id, vaqt DESC);
