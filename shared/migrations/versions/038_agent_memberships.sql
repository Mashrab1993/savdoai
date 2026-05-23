-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  038 — AGENT MULTI-COMPANY MEMBERSHIPS                          ║
-- ║  2026-05-23                                                      ║
-- ║                                                                  ║
-- ║  SalesDoc/Smartup tipida — 1 agent bir nechta firma'da ishlay    ║
-- ║  oladi (Shokolad + Kosmetika + Parfumeriya).                     ║
-- ║                                                                  ║
-- ║  Asosiy g'oya:                                                   ║
-- ║  - Agent (user) → ko'p firma (M:N relationship)                  ║
-- ║  - JWT'ga active_company_id qo'shiladi                          ║
-- ║  - Har query active_company_id orqali filter qilinadi            ║
-- ║  - Data isolation: tovar/klient/sotuv/foto — alohida-alohida    ║
-- ║                                                                  ║
-- ║  Hozirgi user'lar:                                               ║
-- ║  - owner (parent_id IS NULL) — firma egasi                       ║
-- ║  - sub-user (parent_id IS NOT NULL) — bitta firma'ga ulangan    ║
-- ║                                                                  ║
-- ║  Yangi yo'l:                                                     ║
-- ║  - agent_memberships orqali ko'p firma'ga ulanish                ║
-- ║  - Backfill: mavjud sub-user'lar avtomatik membership oladi      ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ═══ 1. JADVAL — agent_memberships ═══
CREATE TABLE IF NOT EXISTS agent_memberships (
    id            BIGSERIAL    PRIMARY KEY,
    agent_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role          TEXT         NOT NULL DEFAULT 'agent'
                  CHECK(role IN('owner','admin','sotuvchi','agent','merchant','supervisor')),
    permissions   JSONB        NOT NULL DEFAULT '{}'::jsonb,
    faol          BOOLEAN      NOT NULL DEFAULT TRUE,
    qo_shgan_id   BIGINT       REFERENCES users(id), -- kim qo'shdi
    qo_shilgan    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    oxirgi_ulansh TIMESTAMPTZ,
    yangilangan   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Bitta agent bitta firma'ga 1 marta
    CONSTRAINT uq_agent_company UNIQUE(agent_id, company_id),

    -- Company_id owner bo'lishi kerak (sub-user emas) — agent owner'ga bog'lanadi
    -- Bu CHECK'ni hozir qo'shmaymiz chunki backfill paytida tekshirilmaydi
    -- O'rniga application layer'da tekshiramiz
    CONSTRAINT chk_no_self_membership CHECK(agent_id != company_id)
);

-- ═══ 2. INDEKSLAR ═══

CREATE INDEX IF NOT EXISTS idx_am_agent_faol
    ON agent_memberships(agent_id) WHERE faol = TRUE;

CREATE INDEX IF NOT EXISTS idx_am_company_faol
    ON agent_memberships(company_id) WHERE faol = TRUE;

CREATE INDEX IF NOT EXISTS idx_am_role
    ON agent_memberships(role) WHERE faol = TRUE;

-- ═══ 3. AUTO-UPDATE TRIGGER ═══

CREATE OR REPLACE FUNCTION update_agent_membership_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.yangilangan = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_am_updated ON agent_memberships;
CREATE TRIGGER trg_am_updated
    BEFORE UPDATE ON agent_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_membership_timestamp();

-- ═══ 4. BACKFILL — Mavjud sub-user'lar uchun membership yaratish ═══
-- Hozirgi sub-user'lar parent_id orqali bitta firma'ga bog'langan.
-- Ularni agent_memberships'ga ham qo'shamiz (backward compatibility).

INSERT INTO agent_memberships (agent_id, company_id, role, qo_shgan_id, qo_shilgan)
SELECT
    id AS agent_id,
    parent_id AS company_id,
    COALESCE(role, 'sotuvchi') AS role,
    parent_id AS qo_shgan_id,  -- owner o'zi qo'shgan deb hisoblaymiz
    COALESCE(yaratilgan, NOW()) AS qo_shilgan
FROM users
WHERE parent_id IS NOT NULL
  AND faol = TRUE
ON CONFLICT (agent_id, company_id) DO NOTHING;

-- ═══ 5. OWNER'LAR HAM AGENT_MEMBERSHIPS'GA QO'SHISH ═══
-- Owner ham o'z firma'siga ulangan deb hisoblanadi (1-membership).
-- Bu kelajakda: owner boshqa firma'ga ham ulansa, qo'shimcha membership olishi mumkin.

INSERT INTO agent_memberships (agent_id, company_id, role, qo_shgan_id, qo_shilgan)
SELECT
    id AS agent_id,
    id AS company_id,  -- owner o'z firma'siga
    'owner' AS role,
    id AS qo_shgan_id,
    COALESCE(yaratilgan, NOW()) AS qo_shilgan
FROM users
WHERE (parent_id IS NULL OR role = 'owner')
  AND faol = TRUE
  AND id != 0  -- system user emas
ON CONFLICT (agent_id, company_id) DO NOTHING;

-- ═══ 6. VIEW — Agent'ning faol firma'lari ═══

CREATE OR REPLACE VIEW v_agent_companies AS
SELECT
    am.id AS membership_id,
    am.agent_id,
    am.company_id,
    am.role,
    am.permissions,
    am.faol,
    am.oxirgi_ulansh,
    -- Company ma'lumotlari
    c.dokon_nomi,
    c.company_kod,
    c.tarif,
    c.sinov_tugash,
    c.segment,
    -- Agent ma'lumotlari
    a.ism AS agent_ism,
    a.telefon AS agent_telefon
FROM agent_memberships am
JOIN users c ON c.id = am.company_id  -- company (owner)
JOIN users a ON a.id = am.agent_id    -- agent
WHERE am.faol = TRUE
  AND c.faol = TRUE
  AND a.faol = TRUE
  AND (c.parent_id IS NULL OR c.role = 'owner');  -- faqat owner'lar firma sifatida

-- ═══ 7. AUDIT LOG (kelajak uchun) ═══

CREATE TABLE IF NOT EXISTS agent_company_audit (
    id            BIGSERIAL    PRIMARY KEY,
    agent_id      BIGINT       NOT NULL,
    company_id    BIGINT       NOT NULL,
    amal          TEXT         NOT NULL CHECK(amal IN ('qo_shildi','o_chirildi','rol_o_zgardi','faollashti','faolsizlanti','login')),
    eski_qiymat   JSONB,
    yangi_qiymat  JSONB,
    qilgan_id     BIGINT,       -- kim qildi
    ip            TEXT,
    yaratilgan    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aca_agent ON agent_company_audit(agent_id, yaratilgan);
CREATE INDEX IF NOT EXISTS idx_aca_company ON agent_company_audit(company_id, yaratilgan);

-- ═══ 8. COMMENTS ═══

COMMENT ON TABLE agent_memberships IS 'Agent multi-company: 1 agent → ko''p firma (SalesDoc tipida)';
COMMENT ON COLUMN agent_memberships.agent_id IS 'Agent/sotuvchi user_id';
COMMENT ON COLUMN agent_memberships.company_id IS 'Firma owner user_id';
COMMENT ON COLUMN agent_memberships.role IS 'Bu firma ichida agent roli: agent/sotuvchi/admin/supervisor/merchant';
COMMENT ON COLUMN agent_memberships.permissions IS 'JSONB ruxsatlar: {"sotuv": true, "kirim": false, "narx_o_zgartirish": false}';
COMMENT ON VIEW v_agent_companies IS 'Agent uchun faol firma''larning to''liq ko''rinishi (JOIN bilan)';
COMMENT ON TABLE agent_company_audit IS 'Agent firma o''zgarishlari audit log';
