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
    login           TEXT,
    parol_hash      TEXT,
    inn             TEXT,
    manzil          TEXT,
    dokon_nomi      TEXT            NOT NULL DEFAULT 'Mening Do''konim',
    segment         TEXT            NOT NULL DEFAULT 'universal'
                    CHECK(segment IN('optom','chakana','oshxona','xozmak','kiyim','gosht','meva','qurilish','avto','dorixona','texnika','mebel','mato','gul','kosmetika','universal')),
    faol            BOOLEAN         NOT NULL DEFAULT FALSE,
    obuna_tugash    DATE,
    til             TEXT            NOT NULL DEFAULT 'uz',
    plan            TEXT            NOT NULL DEFAULT 'free'
                    CHECK(plan IN('free','pro','enterprise')),
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    yangilangan     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_faol ON users(faol) WHERE faol=TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login ON users(lower(login)) WHERE login IS NOT NULL AND login != '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telefon_unique ON users(telefon) WHERE telefon IS NOT NULL AND telefon != '';

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
CREATE UNIQUE INDEX IF NOT EXISTS idx_kl_uid_ism ON klientlar(user_id, lower(ism));
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

-- v25.5 Order status workflow (SalesDoc: new / shipped / delivered / cancelled)
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS holat TEXT NOT NULL DEFAULT 'yangi'
    CHECK(holat IN ('yangi','tasdiqlangan','otgruzka','yetkazildi','bekor'));
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS holat_yangilangan TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS otgruzka_vaqti TIMESTAMPTZ;
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS yetkazildi_vaqti TIMESTAMPTZ;
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS bekor_vaqti TIMESTAMPTZ;
ALTER TABLE sotuv_sessiyalar ADD COLUMN IF NOT EXISTS bekor_sabab TEXT;
CREATE INDEX IF NOT EXISTS idx_ss_holat ON sotuv_sessiyalar(user_id, holat);

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
CREATE INDEX IF NOT EXISTS idx_ch_tovar_id  ON chiqimlar(tovar_id) WHERE tovar_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ch_tovar_nom ON chiqimlar(user_id, tovar_nomi);
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
SELECT enable_rls('audit_log');

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
SELECT enable_rls('kassa_operatsiyalar');

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
SELECT enable_rls('fakturalar');

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
SELECT enable_rls('jurnal_yozuvlar');

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
-- ═══════════════════════════════════════════════════════════
--  SavdoAI v24.0 — SMART NARX TIZIMI
--  3 qatlam: Shaxsiy narx → Guruh narx → Oxirgi narx
-- ═══════════════════════════════════════════════════════════

-- 1. Narx guruhlari (Ulgurji, Chakana, VIP)
CREATE TABLE IF NOT EXISTS narx_guruhlari (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    nomi        TEXT        NOT NULL,
    izoh        TEXT,
    yaratilgan  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, nomi)
);
SELECT enable_rls('narx_guruhlari');

-- 2. Guruh narxlari (har guruh uchun har tovarning narxi)
CREATE TABLE IF NOT EXISTS guruh_narxlar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    guruh_id    BIGINT      NOT NULL REFERENCES narx_guruhlari(id) ON DELETE CASCADE,
    tovar_id    BIGINT      NOT NULL REFERENCES tovarlar(id) ON DELETE CASCADE,
    narx        DECIMAL(18,2) NOT NULL,
    yangilangan TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(guruh_id, tovar_id)
);
SELECT enable_rls('guruh_narxlar');

-- 3. Klient shaxsiy narxlari (eng yuqori prioritet)
CREATE TABLE IF NOT EXISTS klient_narxlar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    klient_id   BIGINT      NOT NULL REFERENCES klientlar(id) ON DELETE CASCADE,
    tovar_id    BIGINT      NOT NULL REFERENCES tovarlar(id) ON DELETE CASCADE,
    narx        DECIMAL(18,2) NOT NULL,
    yangilangan TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(klient_id, tovar_id)
);
SELECT enable_rls('klient_narxlar');

-- 4. Klientlar jadvaliga guruh qo'shish
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS narx_guruh_id BIGINT REFERENCES narx_guruhlari(id);

-- 5. RLS
ALTER TABLE narx_guruhlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE guruh_narxlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE klient_narxlar ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY rls_narx_guruhlari ON narx_guruhlari USING (user_id = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY rls_guruh_narxlar ON guruh_narxlar USING (user_id = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY rls_klient_narxlar ON klient_narxlar USING (user_id = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Indexlar
CREATE INDEX IF NOT EXISTS idx_guruh_narx_tovar ON guruh_narxlar(guruh_id, tovar_id);
CREATE INDEX IF NOT EXISTS idx_klient_narx_tovar ON klient_narxlar(klient_id, tovar_id);
CREATE INDEX IF NOT EXISTS idx_klient_guruh ON klientlar(narx_guruh_id) WHERE narx_guruh_id IS NOT NULL;
-- ═══════════════════════════════════════════════════════════
--  SavdoAI v25.0 — SHOGIRD XARAJAT NAZORATI
--  Admin shogirdlarini qo'shadi, shogirdlar xarajat tashlaydi
--  Admin hammani real-time ko'radi
-- ═══════════════════════════════════════════════════════════

-- 1. Shogirdlar jadvali
CREATE TABLE IF NOT EXISTS shogirdlar (
    id              BIGSERIAL   PRIMARY KEY,
    admin_uid       BIGINT      NOT NULL REFERENCES users(id),
    telegram_uid    BIGINT      NOT NULL,
    ism             TEXT        NOT NULL,
    telefon         TEXT,
    lavozim         TEXT        DEFAULT 'haydovchi',
    kunlik_limit    DECIMAL(18,2) NOT NULL DEFAULT 500000,
    oylik_limit     DECIMAL(18,2) NOT NULL DEFAULT 10000000,
    faol            BOOLEAN     NOT NULL DEFAULT TRUE,
    yaratilgan      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(admin_uid, telegram_uid)
);
-- shogirdlar: admin_uid ishlatadi, user_id emas
ALTER TABLE shogirdlar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shogirdlar_iso ON shogirdlar;
CREATE POLICY shogirdlar_iso ON shogirdlar
    USING (admin_uid = current_uid());

-- 2. Xarajat kategoriyalari
CREATE TABLE IF NOT EXISTS xarajat_kategoriyalar (
    id          BIGSERIAL   PRIMARY KEY,
    admin_uid   BIGINT      NOT NULL REFERENCES users(id),
    nomi        TEXT        NOT NULL,
    emoji       TEXT        DEFAULT '💰',
    faol        BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE(admin_uid, nomi)
);
-- xarajat_kategoriyalar: admin_uid ishlatadi
ALTER TABLE xarajat_kategoriyalar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS xarajat_kat_iso ON xarajat_kategoriyalar;
CREATE POLICY xarajat_kat_iso ON xarajat_kategoriyalar
    USING (admin_uid = current_uid());

-- 3. Xarajatlar jadvali (asosiy)
CREATE TABLE IF NOT EXISTS xarajatlar (
    id              BIGSERIAL   PRIMARY KEY,
    admin_uid       BIGINT      NOT NULL REFERENCES users(id),
    shogird_id      BIGINT      NOT NULL REFERENCES shogirdlar(id),
    kategoriya_id   BIGINT      REFERENCES xarajat_kategoriyalar(id),
    kategoriya_nomi TEXT        NOT NULL DEFAULT 'boshqa',
    summa           DECIMAL(18,2) NOT NULL,
    izoh            TEXT,
    rasm_file_id    TEXT,
    tasdiqlangan    BOOLEAN     NOT NULL DEFAULT FALSE,
    tasdiq_vaqti    TIMESTAMPTZ,
    bekor_qilingan  BOOLEAN     NOT NULL DEFAULT FALSE,
    sana            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Default kategoriyalar qo'shish funksiyasi
DO $$ BEGIN
    -- Bu funksiya yangi admin registratsiya qilganda chaqiriladi
    -- Hozircha manual qo'shiladi
END $$;

-- 5. RLS
ALTER TABLE shogirdlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE xarajat_kategoriyalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE xarajatlar ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY rls_shogirdlar ON shogirdlar USING (admin_uid = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY rls_xarajat_kat ON xarajat_kategoriyalar USING (admin_uid = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY rls_xarajatlar ON xarajatlar USING (admin_uid = current_setting('app.uid', true)::BIGINT);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Indexlar
CREATE INDEX IF NOT EXISTS idx_xar_shogird ON xarajatlar(shogird_id, sana DESC);
CREATE INDEX IF NOT EXISTS idx_xar_admin ON xarajatlar(admin_uid, sana DESC);
CREATE INDEX IF NOT EXISTS idx_xar_kat ON xarajatlar(kategoriya_nomi, sana DESC);
CREATE INDEX IF NOT EXISTS idx_shogird_admin ON shogirdlar(admin_uid, faol);
CREATE INDEX IF NOT EXISTS idx_shogird_tg ON shogirdlar(telegram_uid);

-- v25.0 fix: to_liq_ism alias uchun
ALTER TABLE users ADD COLUMN IF NOT EXISTS to_liq_ism TEXT DEFAULT '';
DO $$ BEGIN
  UPDATE users SET to_liq_ism = ism WHERE to_liq_ism = '' AND ism != '';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════
--  OCHIQ SAVAT (Multi-Klient Sessiya) v25.4
--  Optom do'konchilar uchun — 100 ta klient parallel
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ochiq_savatlar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    klient_id   BIGINT      REFERENCES klientlar(id),
    klient_ismi TEXT        NOT NULL,
    holat       TEXT        NOT NULL DEFAULT 'ochiq',  -- ochiq, yopilgan, bekor
    jami_summa  DECIMAL(18,2) NOT NULL DEFAULT 0,
    tovar_soni  INT         NOT NULL DEFAULT 0,
    izoh        TEXT,
    ochilgan    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    yopilgan    TIMESTAMPTZ,
    sessiya_id  BIGINT      REFERENCES sotuv_sessiyalar(id)  -- yopilganda ulash
);
CREATE INDEX IF NOT EXISTS idx_savat_uid_holat ON ochiq_savatlar(user_id, holat);
CREATE INDEX IF NOT EXISTS idx_savat_uid_klient ON ochiq_savatlar(user_id, klient_ismi);
SELECT enable_rls('ochiq_savatlar');

CREATE TABLE IF NOT EXISTS savat_tovarlar (
    id          BIGSERIAL   PRIMARY KEY,
    savat_id    BIGINT      NOT NULL REFERENCES ochiq_savatlar(id) ON DELETE CASCADE,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    tovar_nomi  TEXT        NOT NULL,
    tovar_id    BIGINT      REFERENCES tovarlar(id),
    miqdor      DECIMAL(18,3) NOT NULL DEFAULT 0,
    birlik      TEXT        NOT NULL DEFAULT 'dona',
    narx        DECIMAL(18,2) NOT NULL DEFAULT 0,
    jami        DECIMAL(18,2) NOT NULL DEFAULT 0,
    kategoriya  TEXT        NOT NULL DEFAULT 'Boshqa',
    qo_shilgan  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_st_savat ON savat_tovarlar(savat_id);
CREATE INDEX IF NOT EXISTS idx_st_uid ON savat_tovarlar(user_id);
SELECT enable_rls('savat_tovarlar');

-- v25.3.1 qo'shimcha RLS
SELECT enable_rls('vision_log');
SELECT enable_rls('cognitive_tasks');
SELECT enable_rls('hujjat_versiyalar');
-- xarajatlar: admin_uid ishlatadi, user_id emas
ALTER TABLE xarajatlar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS xarajatlar_iso ON xarajatlar;
CREATE POLICY xarajatlar_iso ON xarajatlar
    USING (admin_uid = current_uid());

-- ────────────────────────────────────────────────────────────────────
-- v25.3.2 YETISHMAGAN JADVALLAR
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fakturalar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    raqam           TEXT            NOT NULL,
    klient_ismi     TEXT            NOT NULL,
    jami_summa      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    tovarlar        JSONB           DEFAULT '[]'::jsonb,
    bank_rekvizit   JSONB,
    holat           TEXT            NOT NULL DEFAULT 'yaratilgan'
                    CHECK(holat IN('yaratilgan','yuborilgan','tolangan','bekor')),
    izoh            TEXT,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_faktura_uid ON fakturalar(user_id);
SELECT enable_rls('fakturalar');

CREATE TABLE IF NOT EXISTS nakladnoy_counter (
    user_id         BIGINT          PRIMARY KEY REFERENCES users(id),
    oxirgi_raqam    INT             NOT NULL DEFAULT 0,
    yangilangan     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nakladnoylar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    sessiya_id      BIGINT,
    raqam           TEXT            NOT NULL,
    klient_ismi     TEXT,
    jami_summa      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    qarz            DECIMAL(18,2)   NOT NULL DEFAULT 0,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
SELECT enable_rls('nakladnoylar');

CREATE TABLE IF NOT EXISTS buyurtmalar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    klient_ismi     TEXT            NOT NULL DEFAULT '',
    telefon         TEXT            DEFAULT '',
    izoh            TEXT            DEFAULT '',
    holat           TEXT            NOT NULL DEFAULT 'yangi'
                    CHECK(holat IN('yangi','qabul_qilindi','bajarildi','bekor')),
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
SELECT enable_rls('buyurtmalar');

CREATE TABLE IF NOT EXISTS buyurtma_tovarlar (
    id              BIGSERIAL       PRIMARY KEY,
    buyurtma_id     BIGINT          NOT NULL REFERENCES buyurtmalar(id) ON DELETE CASCADE,
    tovar_id        BIGINT          REFERENCES tovarlar(id),
    nomi            TEXT            NOT NULL,
    miqdor          DECIMAL(18,3)   NOT NULL DEFAULT 1,
    narx            DECIMAL(18,2)   NOT NULL DEFAULT 0,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
--  v25.3.2 YANGI JADVALLAR
-- ═══════════════════════════════════════════════════════════════

-- Qarz eslatma tarixi
CREATE TABLE IF NOT EXISTS qarz_eslatmalar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    klient_id       BIGINT          REFERENCES klientlar(id),
    klient_ismi     TEXT            NOT NULL DEFAULT '',
    summa           DECIMAL(18,2)   NOT NULL DEFAULT 0,
    usul            TEXT            NOT NULL DEFAULT 'telegram'
                    CHECK(usul IN('telegram','sms','qolda')),
    yuborilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eslatma_uid_klient
    ON qarz_eslatmalar(user_id, klient_id);
SELECT enable_rls('qarz_eslatmalar');

-- Loyalty ball tarixi
CREATE TABLE IF NOT EXISTS loyalty_ballar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    klient_id       BIGINT          NOT NULL REFERENCES klientlar(id),
    ball            INT             NOT NULL DEFAULT 0,
    tur             TEXT            NOT NULL DEFAULT 'yigish'
                    CHECK(tur IN('yigish','sarflash','bonus','referral')),
    sessiya_id      BIGINT,
    izoh            TEXT            DEFAULT '',
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_uid_klient
    ON loyalty_ballar(user_id, klient_id);
SELECT enable_rls('loyalty_ballar');

-- To'lov tracking
CREATE TABLE IF NOT EXISTS tolov_tranzaksiyalar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    order_id        TEXT            NOT NULL,
    provider        TEXT            NOT NULL DEFAULT 'click'
                    CHECK(provider IN('click','payme','uzum','naqd','karta')),
    tranzaksiya_id  TEXT,
    summa           DECIMAL(18,2)   NOT NULL DEFAULT 0,
    holat           TEXT            NOT NULL DEFAULT 'kutilmoqda'
                    CHECK(holat IN('kutilmoqda','jarayonda','tolangan','bekor','xato','qaytarildi')),
    klient_ismi     TEXT,
    klient_id       BIGINT,
    meta            JSONB           DEFAULT '{}'::jsonb,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    yangilangan     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tolov_uid ON tolov_tranzaksiyalar(user_id);
SELECT enable_rls('tolov_tranzaksiyalar');

-- KPI targetlar
CREATE TABLE IF NOT EXISTS kpi_targetlar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    davr            TEXT            NOT NULL DEFAULT 'oylik'
                    CHECK(davr IN('kunlik','haftalik','oylik')),
    sotuv_soni      INT             DEFAULT 0,
    sotuv_summa     DECIMAL(18,2)   DEFAULT 0,
    yangi_klient    INT             DEFAULT 0,
    qarz_yigish     DECIMAL(18,2)   DEFAULT 0,
    boshlanish      DATE            NOT NULL DEFAULT CURRENT_DATE,
    tugash          DATE,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
SELECT enable_rls('kpi_targetlar');

-- Multi-filial
CREATE TABLE IF NOT EXISTS filiallar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    nomi            TEXT            NOT NULL,
    manzil          TEXT            DEFAULT '',
    telefon         TEXT            DEFAULT '',
    turi            TEXT            NOT NULL DEFAULT 'dokon'
                    CHECK(turi IN('dokon','ombor','sklad','filial')),
    faol            BOOLEAN         NOT NULL DEFAULT TRUE,
    asosiy          BOOLEAN         NOT NULL DEFAULT FALSE,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_filiallar_nomi ON filiallar(user_id, lower(nomi));
SELECT enable_rls('filiallar');

CREATE TABLE IF NOT EXISTS filial_qoldiqlar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    filial_id       BIGINT          NOT NULL REFERENCES filiallar(id),
    tovar_id        BIGINT          NOT NULL REFERENCES tovarlar(id),
    qoldiq          DECIMAL(18,4)   NOT NULL DEFAULT 0,
    min_qoldiq      DECIMAL(18,4)   NOT NULL DEFAULT 0,
    yangilangan     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE(filial_id, tovar_id)
);
SELECT enable_rls('filial_qoldiqlar');

CREATE TABLE IF NOT EXISTS filial_transferlar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    dan_filial_id   BIGINT          NOT NULL REFERENCES filiallar(id),
    ga_filial_id    BIGINT          NOT NULL REFERENCES filiallar(id),
    tovar_id        BIGINT          NOT NULL REFERENCES tovarlar(id),
    tovar_nomi      TEXT            NOT NULL DEFAULT '',
    miqdor          DECIMAL(18,4)   NOT NULL,
    holat           TEXT            NOT NULL DEFAULT 'kutilmoqda'
                    CHECK(holat IN('kutilmoqda','tasdiqlangan','bekor')),
    izoh            TEXT            DEFAULT '',
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
SELECT enable_rls('filial_transferlar');

-- Supplier auto-order
CREATE TABLE IF NOT EXISTS yetkazib_beruvchilar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    nomi            TEXT            NOT NULL,
    telefon         TEXT            DEFAULT '',
    telegram_id     BIGINT,
    kategoriyalar   TEXT[]          DEFAULT '{}',
    faol            BOOLEAN         NOT NULL DEFAULT TRUE,
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_yetkazib_nomi ON yetkazib_beruvchilar(user_id, lower(nomi));
SELECT enable_rls('yetkazib_beruvchilar');

CREATE TABLE IF NOT EXISTS supplier_buyurtmalar (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    supplier_id     BIGINT          NOT NULL REFERENCES yetkazib_beruvchilar(id),
    holat           TEXT            NOT NULL DEFAULT 'tayyorlanmoqda'
                    CHECK(holat IN('tayyorlanmoqda','yuborildi','tasdiqlandi','yetkazildi','bekor')),
    jami_summa      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    tovarlar        JSONB           DEFAULT '[]'::jsonb,
    izoh            TEXT            DEFAULT '',
    yaratilgan      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
SELECT enable_rls('supplier_buyurtmalar');

-- GPS tracking (agent joylashuvi)
CREATE TABLE IF NOT EXISTS gps_log (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id),
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    accuracy        REAL,
    turi            TEXT            DEFAULT 'location'
                    CHECK(turi IN('location','visit','checkin','checkout')),
    izoh            TEXT            DEFAULT '',
    vaqt            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gps_uid_vaqt ON gps_log(user_id, vaqt DESC);
SELECT enable_rls('gps_log');

-- ═══════════════════════════════════════════════════════════════
--  v25.4.0 MIGRATION: SalesDoc-compatible tovar maydonlari
-- ═══════════════════════════════════════════════════════════════

-- Tovarlar jadvaliga SalesDoc maydonlarini qo'shish
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS brend         TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS podkategoriya TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS guruh         TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS ishlab_chiqaruvchi TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS segment       TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS shtrix_kod    TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS artikul       TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS sap_kod       TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS kod           TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS ikpu_kod      TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS ikpu_paket_kod TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS ikpu_birlik_kod TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS gtin          TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS hajm          DECIMAL(18,3) DEFAULT 1;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS ogirlik       DECIMAL(18,3) DEFAULT 1;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS blokda_soni   INT DEFAULT 1;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS korobkada_soni INT DEFAULT 1;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS saralash      INT DEFAULT 500;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS yaroqlilik_muddati INT DEFAULT 0;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS tavsif        TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS rasm_url      TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS faol          BOOLEAN DEFAULT TRUE;
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS savdo_yonalishi TEXT DEFAULT '';
ALTER TABLE tovarlar ADD COLUMN IF NOT EXISTS yangilangan   TIMESTAMPTZ DEFAULT NOW();

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_tv_brend ON tovarlar(user_id, brend) WHERE brend != '';
CREATE INDEX IF NOT EXISTS idx_tv_kat ON tovarlar(user_id, kategoriya);
CREATE INDEX IF NOT EXISTS idx_tv_shtrix ON tovarlar(user_id, shtrix_kod) WHERE shtrix_kod != '';
CREATE INDEX IF NOT EXISTS idx_tv_ikpu ON tovarlar(user_id, ikpu_kod) WHERE ikpu_kod != '';
CREATE INDEX IF NOT EXISTS idx_tv_faol ON tovarlar(user_id, faol);

-- ═══════════════════════════════════════════════════════════════
--  v25.5 MIGRATION: Klient CRM (SalesDoc-level)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS kategoriya    TEXT DEFAULT 'oddiy';
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS jami_xaridlar DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS xarid_soni    INT NOT NULL DEFAULT 0;
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS oxirgi_sotuv  TIMESTAMPTZ;
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS tugilgan_kun  DATE;
ALTER TABLE klientlar ADD COLUMN IF NOT EXISTS izoh          TEXT;
CREATE INDEX IF NOT EXISTS idx_kl_kategoriya ON klientlar(user_id, kategoriya);
CREATE INDEX IF NOT EXISTS idx_kl_oxirgi ON klientlar(user_id, oxirgi_sotuv DESC) WHERE oxirgi_sotuv IS NOT NULL;

-- Avtomatik chegirma qoidalari (VIP/Gold/Silver)
CREATE TABLE IF NOT EXISTS chegirma_qoidalar (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id),
    nomi        TEXT        NOT NULL,
    turi        TEXT        NOT NULL DEFAULT 'foiz' CHECK(turi IN ('foiz','summa')),
    qiymat      DECIMAL(18,2) NOT NULL DEFAULT 0,
    min_xarid   DECIMAL(18,2) NOT NULL DEFAULT 0,
    min_soni    INT           NOT NULL DEFAULT 0,
    kategoriya  TEXT          DEFAULT '',
    faol        BOOLEAN       NOT NULL DEFAULT TRUE,
    yaratilgan  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cheg_uid ON chegirma_qoidalar(user_id, faol);
SELECT enable_rls('chegirma_qoidalar');

