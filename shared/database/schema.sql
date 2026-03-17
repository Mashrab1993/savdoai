-- ═══════════════════════════════════════════════════════════════════
--  MASHRAB MOLIYA v18 — MULTI-TENANT SCHEMA
--  PostgreSQL RLS · 20,000+ user · Kafolatlangan izolyatsiya
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- RLS kontekst funksiyasi
CREATE OR REPLACE FUNCTION current_uid() RETURNS BIGINT AS $$
    SELECT NULLIF(current_setting('app.uid', true), '')::BIGINT;
$$ LANGUAGE SQL STABLE;

-- Makro: RLS policy yaratish
CREATE OR REPLACE FUNCTION enable_rls(tbl TEXT) RETURNS void AS $$
BEGIN
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_iso ON %I', tbl, tbl);
    EXECUTE format(
        'CREATE POLICY %I_iso ON %I USING (user_id = current_uid())',
        tbl, tbl
    );
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────
-- 1. USERS (RLS yo'q — global jadval)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT          PRIMARY KEY,
    ism             TEXT            NOT NULL DEFAULT '',
    username        TEXT,
    telefon         TEXT,
    inn             TEXT,
    manzil          TEXT,
    dokon_nomi      TEXT            NOT NULL DEFAULT 'Mening Do''konim',
    segment         TEXT            NOT NULL DEFAULT 'universal'
                    CHECK(segment IN('optom','chakana','oshxona','xozmak','universal')),
    faol            BOOLEAN         NOT NULL DEFAULT FALSE,
    obuna_tugash    DATE,
    til             TEXT            NOT NULL DEFAULT 'uz',
    plan            TEXT            NOT NULL DEFAULT 'free'
                    CHECK(plan IN('free','pro','enterprise')),
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    yangilangan     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_faol ON users(faol) WHERE faol=TRUE;

-- ────────────────────────────────────────────────────────────────────
-- 2. API SESSIONS
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_sessions (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,
    qurilma     TEXT,
    ip          INET,
    yaratilgan  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tugaydi     TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    aktiv       BOOLEAN     NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_sess_token ON api_sessions(token_hash) WHERE aktiv;
CREATE INDEX IF NOT EXISTS idx_sess_user  ON api_sessions(user_id)    WHERE aktiv;

-- ────────────────────────────────────────────────────────────────────
-- 3–11. RLS JADVALLAR
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS klientlar (
    id              BIGSERIAL   PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users(id),
    ism             TEXT        NOT NULL,
    telefon         TEXT,
    manzil          TEXT,
    inn             TEXT,
    eslatma         TEXT,
    kredit_limit    DECIMAL(18,2) NOT NULL DEFAULT 0,
    jami_sotib      DECIMAL(18,2) NOT NULL DEFAULT 0,
    yaratilgan      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kl_uid_ism ON klientlar(user_id, lower(ism));
CREATE INDEX IF NOT EXISTS idx_kl_uid_tel ON klientlar(user_id, telefon) WHERE telefon IS NOT NULL;
SELECT enable_rls('klientlar');

CREATE TABLE IF NOT EXISTS tovarlar (
    id               BIGSERIAL   PRIMARY KEY,
    user_id          BIGINT      NOT NULL REFERENCES users(id),
    nomi             TEXT        NOT NULL,
    kategoriya       TEXT        NOT NULL DEFAULT 'Boshqa',
    birlik           TEXT        NOT NULL DEFAULT 'dona',
    olish_narxi      DECIMAL(18,2) NOT NULL DEFAULT 0,
    sotish_narxi     DECIMAL(18,2) NOT NULL DEFAULT 0,
    min_sotish_narxi DECIMAL(18,2) NOT NULL DEFAULT 0,
    qoldiq           DECIMAL(18,3) NOT NULL DEFAULT 0,
    min_qoldiq       DECIMAL(18,3) NOT NULL DEFAULT 0,
    yaratilgan       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tv_uid_nom ON tovarlar(user_id, lower(nomi));
CREATE INDEX IF NOT EXISTS idx_tv_uid_qoldiq ON tovarlar(user_id, qoldiq);
SELECT enable_rls('tovarlar');

CREATE TABLE IF NOT EXISTS kirimlar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    tovar_id    BIGINT      REFERENCES tovarlar(id),
    tovar_nomi  TEXT        NOT NULL,
    kategoriya  TEXT        NOT NULL DEFAULT 'Boshqa',
    miqdor      DECIMAL(18,3) NOT NULL,
    birlik      TEXT        NOT NULL DEFAULT 'dona',
    narx        DECIMAL(18,2) NOT NULL DEFAULT 0,
    jami        DECIMAL(18,2) NOT NULL DEFAULT 0,
    manba       TEXT,
    izoh        TEXT,
    sana        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kr_uid_sana ON kirimlar(user_id, sana DESC);
SELECT enable_rls('kirimlar');

CREATE TABLE IF NOT EXISTS sotuv_sessiyalar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    klient_id   BIGINT      REFERENCES klientlar(id),
    klient_ismi TEXT,
    jami        DECIMAL(18,2) NOT NULL DEFAULT 0,
    tolangan    DECIMAL(18,2) NOT NULL DEFAULT 0,
    qarz        DECIMAL(18,2) NOT NULL DEFAULT 0,
    izoh        TEXT,
    sana        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ss_uid_sana   ON sotuv_sessiyalar(user_id, sana DESC);
CREATE INDEX IF NOT EXISTS idx_ss_uid_klient ON sotuv_sessiyalar(user_id, klient_id) WHERE klient_id IS NOT NULL;
SELECT enable_rls('sotuv_sessiyalar');

CREATE TABLE IF NOT EXISTS chiqimlar (
    id               BIGSERIAL   PRIMARY KEY,
    user_id          BIGINT      NOT NULL REFERENCES users(id),
    sessiya_id       BIGINT      NOT NULL REFERENCES sotuv_sessiyalar(id),
    klient_id        BIGINT      REFERENCES klientlar(id),
    klient_ismi      TEXT,
    tovar_id         BIGINT      REFERENCES tovarlar(id),
    tovar_nomi       TEXT        NOT NULL,
    kategoriya       TEXT        NOT NULL DEFAULT 'Boshqa',
    miqdor           DECIMAL(18,3) NOT NULL,
    qaytarilgan      DECIMAL(18,3) NOT NULL DEFAULT 0,
    birlik           TEXT        NOT NULL DEFAULT 'dona',
    olish_narxi      DECIMAL(18,2) NOT NULL DEFAULT 0,
    sotish_narxi     DECIMAL(18,2) NOT NULL DEFAULT 0,
    chegirma_foiz    DECIMAL(5,2)  NOT NULL DEFAULT 0,
    jami             DECIMAL(18,2) NOT NULL DEFAULT 0,
    sana             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ch_uid_sana  ON chiqimlar(user_id, sana DESC);
CREATE INDEX IF NOT EXISTS idx_ch_sessiya   ON chiqimlar(sessiya_id);
SELECT enable_rls('chiqimlar');

CREATE TABLE IF NOT EXISTS qaytarishlar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    chiqim_id   BIGINT      REFERENCES chiqimlar(id),
    sessiya_id  BIGINT,
    klient_ismi TEXT,
    tovar_nomi  TEXT,
    miqdor      DECIMAL(18,3),
    birlik      TEXT,
    narx        DECIMAL(18,2),
    jami        DECIMAL(18,2),
    sabab       TEXT,
    sana        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qy_uid_sana ON qaytarishlar(user_id, sana DESC);
SELECT enable_rls('qaytarishlar');

CREATE TABLE IF NOT EXISTS qarzlar (
    id               BIGSERIAL   PRIMARY KEY,
    user_id          BIGINT      NOT NULL REFERENCES users(id),
    klient_id        BIGINT      REFERENCES klientlar(id),
    klient_ismi      TEXT        NOT NULL,
    sessiya_id       BIGINT,
    dastlabki_summa  DECIMAL(18,2) NOT NULL,
    tolangan         DECIMAL(18,2) NOT NULL DEFAULT 0,
    qolgan           DECIMAL(18,2) NOT NULL,
    muddat           DATE,
    izoh             TEXT,
    yopildi          BOOLEAN     NOT NULL DEFAULT FALSE,
    yaratilgan       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    yangilangan      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qrz_uid_aktiv ON qarzlar(user_id, yopildi) WHERE NOT yopildi;
CREATE INDEX IF NOT EXISTS idx_qrz_klient    ON qarzlar(user_id, klient_ismi) WHERE NOT yopildi;
SELECT enable_rls('qarzlar');

CREATE TABLE IF NOT EXISTS menyu (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    nomi        TEXT        NOT NULL,
    kategoriya  TEXT        NOT NULL DEFAULT 'Boshqa',
    narx        DECIMAL(18,2) NOT NULL DEFAULT 0,
    mavjud      BOOLEAN     NOT NULL DEFAULT TRUE,
    yaratilgan  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SELECT enable_rls('menyu');

CREATE TABLE IF NOT EXISTS nakladnoy_counter (
    user_id     BIGINT PRIMARY KEY REFERENCES users(id),
    raqam       INTEGER NOT NULL DEFAULT 0,
    yil         INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER
);
SELECT enable_rls('nakladnoy_counter');

-- ────────────────────────────────────────────────────────────────────
-- 12. AUDIT LOG
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL,
    amal        TEXT        NOT NULL,
    jadval      TEXT,
    yozuv_id    BIGINT,
    eski        JSONB,
    yangi       JSONB,
    ip          INET,
    manba       TEXT        NOT NULL DEFAULT 'bot',
    sana        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_uid_sana ON audit_log(user_id, sana DESC);

-- ────────────────────────────────────────────────────────────────────
-- 13. COGNITIVE TASKS (Worker queue)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cognitive_tasks (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     BIGINT      NOT NULL,
    task_type   TEXT        NOT NULL,
    payload     JSONB       NOT NULL DEFAULT '{}',
    result      JSONB,
    holat       TEXT        NOT NULL DEFAULT 'kutish'
                CHECK(holat IN('kutish','bajarilmoqda','tayyor','xato')),
    xato_msg    TEXT,
    yaratilgan  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tugadi      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ctask_uid_holat ON cognitive_tasks(user_id, holat);
CREATE INDEX IF NOT EXISTS idx_ctask_holat ON cognitive_tasks(holat) WHERE holat='kutish';

-- ────────────────────────────────────────────────────────────────────
-- TEKSHIRISH
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW rls_holati AS
SELECT
    t.tablename,
    t.rowsecurity                                     AS rls_yoqilgan,
    COUNT(p.policyname) FILTER (WHERE p.policyname LIKE '%iso%') AS policy_soni
FROM pg_tables  t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname
                       AND p.tablename  = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
      'klientlar','tovarlar','kirimlar','sotuv_sessiyalar',
      'chiqimlar','qaytarishlar','qarzlar','menyu','nakladnoy_counter'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- ────────────────────────────────────────────────────────────────────
-- QO'SHIMCHA INDEKSLAR (20,000+ foydalanuvchi uchun)
-- ────────────────────────────────────────────────────────────────────
-- Sotuv tahlili uchun
-- Index: sotuv_sessiyalar sana bo'yicha (oddiy index — asyncpg compatible)
CREATE INDEX IF NOT EXISTS idx_ss_uid_sana ON sotuv_sessiyalar(user_id, sana DESC);

-- Qarz muddati uchun
CREATE INDEX IF NOT EXISTS idx_qrz_muddat
    ON qarzlar(user_id, muddat)
    WHERE yopildi=FALSE AND muddat IS NOT NULL;

-- Tovar kategoriya uchun
CREATE INDEX IF NOT EXISTS idx_tv_uid_kat
    ON tovarlar(user_id, kategoriya);

-- Audit log user+sana
CREATE INDEX IF NOT EXISTS idx_audit_uid_sana_btr
    ON audit_log(user_id, sana DESC);

-- Cognitive tasks queue (worker uchun)
CREATE INDEX IF NOT EXISTS idx_ctask_kutish
    ON cognitive_tasks(holat, yaratilgan)
    WHERE holat = 'kutish';

-- ────────────────────────────────────────────────────────────────────
-- TRIGGER: yangilangan ustunni avtomatik yangilash
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_yangilangan()
RETURNS TRIGGER AS $$
BEGIN
    NEW.yangilangan = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['users','qarzlar']
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%I_upd ON %I;
             CREATE TRIGGER trg_%I_upd
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_yangilangan()',
            tbl, tbl, tbl, tbl
        );
    END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- NAKLADNOY COUNTER: yil boshida reset
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION nakladnoy_raqami_ol(p_user_id BIGINT)
RETURNS TEXT AS $$
DECLARE
    joriy_yil INT := EXTRACT(YEAR FROM NOW())::INT;
    raqam     INT;
BEGIN
    INSERT INTO nakladnoy_counter(user_id, raqam, yil)
    VALUES (p_user_id, 1, joriy_yil)
    ON CONFLICT(user_id) DO UPDATE
        SET raqam = CASE
                WHEN nakladnoy_counter.yil < joriy_yil THEN 1
                ELSE nakladnoy_counter.raqam + 1
            END,
            yil = joriy_yil
    RETURNING raqam INTO raqam;

    RETURN TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(raqam::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────
-- MATERIALIZED VIEW — Kunlik xulosa (har 15 daqiqada refresh)
-- Hisobot endpointlari buni ishlatadi — asosiy jadvallarni yuklamaslik uchun
-- ────────────────────────────────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kunlik_xulosa AS
SELECT
    ss.user_id,
    (ss.sana AT TIME ZONE 'Asia/Tashkent')::DATE AS sana,
    COUNT(ss.id)                                  AS sotuv_soni,
    COALESCE(SUM(ss.jami),0)                      AS sotuv_jami,
    COALESCE(SUM(ss.qarz),0)                      AS yangi_qarz,
    COALESCE(SUM(ss.tolangan),0)                  AS tolangan,
    COUNT(DISTINCT ss.klient_id)
        FILTER (WHERE ss.klient_id IS NOT NULL)   AS faol_klientlar
FROM sotuv_sessiyalar ss
GROUP BY ss.user_id,
         (ss.sana AT TIME ZONE 'Asia/Tashkent')::DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kunlik_uid_sana
    ON mv_kunlik_xulosa(user_id, sana);

-- Refresh funksiyasi (Worker dan chaqiriladi)
CREATE OR REPLACE FUNCTION mv_refresh()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kunlik_xulosa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════
-- v21.3 YANGI JADVALLAR: KASSA + VISION LOG + FAKTURA
-- ════════════════════════════════════════════════════════════════════

-- KASSA OPERATSIYALARI (naqd/karta/otkazma)
CREATE TABLE IF NOT EXISTS kassa_operatsiyalar (
    id          SERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tur         VARCHAR(10) NOT NULL CHECK (tur IN ('kirim','chiqim')),
    summa       NUMERIC(18,2) NOT NULL CHECK (summa > 0),
    usul        VARCHAR(20) NOT NULL DEFAULT 'naqd'
                CHECK (usul IN ('naqd','karta','otkazma')),
    tavsif      TEXT,
    kategoriya  VARCHAR(100),
    yaratilgan  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kassa_user   ON kassa_operatsiyalar(user_id);
CREATE INDEX IF NOT EXISTS idx_kassa_tur    ON kassa_operatsiyalar(tur);
CREATE INDEX IF NOT EXISTS idx_kassa_usul   ON kassa_operatsiyalar(usul);
CREATE INDEX IF NOT EXISTS idx_kassa_sana   ON kassa_operatsiyalar(yaratilgan DESC);

ALTER TABLE kassa_operatsiyalar ENABLE ROW LEVEL SECURITY;
CREATE POLICY kassa_isolation ON kassa_operatsiyalar
    USING (user_id = current_uid());

-- VISION AI LOG (rasm tahlil tarixi)
CREATE TABLE IF NOT EXISTS vision_log (
    id          SERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tur         VARCHAR(30) DEFAULT 'rasm',
    natija      JSONB,
    ishonch     REAL DEFAULT 0.0,
    yaratilgan  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vision_user ON vision_log(user_id);
ALTER TABLE vision_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY vision_isolation ON vision_log
    USING (user_id = current_uid());

-- FAKTURALAR
CREATE TABLE IF NOT EXISTS fakturalar (
    id              SERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raqam           VARCHAR(50) NOT NULL,
    klient_ismi     VARCHAR(200),
    jami_summa      NUMERIC(18,2) DEFAULT 0,
    tovarlar        JSONB DEFAULT '[]',
    bank_rekvizit   JSONB,
    holat           VARCHAR(20) DEFAULT 'yaratilgan',
    yaratilgan      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_faktura_user ON fakturalar(user_id);
ALTER TABLE fakturalar ENABLE ROW LEVEL SECURITY;
CREATE POLICY faktura_isolation ON fakturalar
    USING (user_id = current_uid());

-- ════════════════════════════════════════════════════════════════
--  v21.5 SAP-GRADE: DOUBLE-ENTRY LEDGER + IDEMPOTENCY
-- ════════════════════════════════════════════════════════════════

-- Jurnal yozuvlar (sarlavha)
CREATE TABLE IF NOT EXISTS jurnal_yozuvlar (
    id              BIGSERIAL   PRIMARY KEY,
    jurnal_id       TEXT        NOT NULL UNIQUE,
    user_id         BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tur             TEXT        NOT NULL,
    sana            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tavsif          TEXT,
    jami_debit      NUMERIC(18,2) NOT NULL DEFAULT 0,
    jami_credit     NUMERIC(18,2) NOT NULL DEFAULT 0,
    manba_id        BIGINT      DEFAULT 0,
    manba_jadval    TEXT,
    idempotency_key TEXT        UNIQUE,
    yaratilgan      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT jurnal_balans CHECK (jami_debit = jami_credit)
);
CREATE INDEX IF NOT EXISTS idx_jurnal_user ON jurnal_yozuvlar(user_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_tur ON jurnal_yozuvlar(tur);
CREATE INDEX IF NOT EXISTS idx_jurnal_sana ON jurnal_yozuvlar(sana DESC);
CREATE INDEX IF NOT EXISTS idx_jurnal_idemp ON jurnal_yozuvlar(idempotency_key) WHERE idempotency_key IS NOT NULL;
ALTER TABLE jurnal_yozuvlar ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY jurnal_isolation ON jurnal_yozuvlar USING (user_id = current_uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Jurnal qatorlar (debit/credit)
CREATE TABLE IF NOT EXISTS jurnal_qatorlar (
    id          BIGSERIAL   PRIMARY KEY,
    jurnal_id   BIGINT      NOT NULL REFERENCES jurnal_yozuvlar(id) ON DELETE CASCADE,
    hisob       TEXT        NOT NULL,
    debit       NUMERIC(18,2) NOT NULL DEFAULT 0,
    credit      NUMERIC(18,2) NOT NULL DEFAULT 0,
    tavsif      TEXT,
    CONSTRAINT qator_bir_tomon CHECK (NOT (debit > 0 AND credit > 0))
);
CREATE INDEX IF NOT EXISTS idx_jq_jurnal ON jurnal_qatorlar(jurnal_id);
CREATE INDEX IF NOT EXISTS idx_jq_hisob ON jurnal_qatorlar(hisob);

-- Hujjat versiyalar (document versioning)
CREATE TABLE IF NOT EXISTS hujjat_versiyalar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hujjat_turi TEXT        NOT NULL,
    hujjat_id   BIGINT      NOT NULL,
    versiya     INTEGER     NOT NULL DEFAULT 1,
    old_data    JSONB,
    new_data    JSONB,
    sabab       TEXT,
    yaratilgan  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hv_user ON hujjat_versiyalar(user_id);
CREATE INDEX IF NOT EXISTS idx_hv_hujjat ON hujjat_versiyalar(hujjat_turi, hujjat_id);
ALTER TABLE hujjat_versiyalar ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY hujjat_isolation ON hujjat_versiyalar USING (user_id = current_uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
