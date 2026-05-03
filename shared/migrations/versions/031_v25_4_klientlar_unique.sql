-- v25.4.0 — KLIENTLAR (user_id, lower(ism)) UNIQUE INDEX
-- 2026-05-03
--
-- BUG: services/api/main.py:1237 sotuv_saqlash() endpointi:
--     INSERT INTO klientlar ... ON CONFLICT (user_id, lower(ism)) DO UPDATE ...
-- Production DB'da `klientlar(user_id, lower(ism))` UNIQUE constraint YO'Q edi —
-- Migration 016 faqat oddiy INDEX yaratgan. Natijada har bir POST /api/v1/sotuv
-- so'rovi 500 "Ichki server xatosi" qaytaryapti edi (oxirgi muvaffaqiyatli sotuv 11-aprel).
--
-- Tuzatish: avval mavjud dublikat klientlarni birlashtirish (eski id'ga merge),
-- keyin UNIQUE INDEX yaratish.

-- 1. Dublikat klientlar uchun referencelarni eski id'ga ko'chirish.
--    Har bir (user_id, lower(ism)) guruhda eng kichik id'li yozuv canonical bo'ladi.
--    Tobye'ga (FK) borgan jadvallar — qo'lda sanab chiqildi (schema.sql + migrations 003,013,022,023,024,025,026):
--    sotuv_sessiyalar, chiqimlar, qarzlar, klient_narxlar, loyalty_ballar,
--    qarz_eslatmalar, tolov_tranzaksiyalar, ochiq_savatlar, cognitive_tasks
--    (vazifalar, qaytarish_zayavkalar, store_check, feedback, planning ON DELETE SET NULL — xavfsiz).

DO $migrate_klientlar$
DECLARE
    canon_map RECORD;
    fk_table TEXT;
    fk_tables TEXT[] := ARRAY[
        'sotuv_sessiyalar', 'chiqimlar', 'qarzlar', 'klient_narxlar',
        'loyalty_ballar', 'qarz_eslatmalar', 'tolov_tranzaksiyalar',
        'ochiq_savatlar', 'cognitive_tasks', 'vazifalar',
        'qaytarish_zayavkalar', 'store_check_klient', 'feedback_klient',
        'klient_planning'
    ];
    rec_count INT;
BEGIN
    -- Dublikatlar mavjudligini aniqlash
    SELECT COUNT(*) INTO rec_count
    FROM (
        SELECT user_id, lower(ism)
        FROM klientlar
        GROUP BY user_id, lower(ism)
        HAVING COUNT(*) > 1
    ) AS dups;

    IF rec_count = 0 THEN
        RAISE NOTICE 'Dublikat klientlar yo''q — to''g''ridan-to''g''ri UNIQUE INDEX yaratamiz';
        RETURN;
    END IF;

    RAISE NOTICE 'Dublikat klient guruhlari topildi: %', rec_count;

    -- Har bir dublikat guruhga canonical id biriktirish
    CREATE TEMP TABLE _kl_remap ON COMMIT DROP AS
    SELECT
        k.id AS old_id,
        first_value(k.id) OVER (PARTITION BY k.user_id, lower(k.ism) ORDER BY k.id) AS new_id
    FROM klientlar k
    WHERE EXISTS (
        SELECT 1 FROM klientlar k2
        WHERE k2.user_id = k.user_id AND lower(k2.ism) = lower(k.ism) AND k2.id <> k.id
    );

    DELETE FROM _kl_remap WHERE old_id = new_id;

    GET DIAGNOSTICS rec_count = ROW_COUNT;
    RAISE NOTICE 'Birlashtiriladigan eski klient yozuvlari: %', rec_count;

    -- Har bir FK jadvalda referenceni yangilash
    FOREACH fk_table IN ARRAY fk_tables
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = fk_table AND column_name = 'klient_id'
        ) THEN
            EXECUTE format(
                'UPDATE %I t SET klient_id = m.new_id FROM _kl_remap m WHERE t.klient_id = m.old_id',
                fk_table
            );
            GET DIAGNOSTICS rec_count = ROW_COUNT;
            IF rec_count > 0 THEN
                RAISE NOTICE '  %: % ta yozuv yangilandi', fk_table, rec_count;
            END IF;
        END IF;
    END LOOP;

    -- Eski klient yozuvlarini o'chirish
    DELETE FROM klientlar WHERE id IN (SELECT old_id FROM _kl_remap);
    GET DIAGNOSTICS rec_count = ROW_COUNT;
    RAISE NOTICE 'Eski klient yozuvlari o''chirildi: %', rec_count;
END
$migrate_klientlar$;

-- 2. UNIQUE INDEX yaratish — endi bu xavfsiz
CREATE UNIQUE INDEX IF NOT EXISTS idx_kl_uid_ism_unique
    ON klientlar(user_id, lower(ism));

-- 3. Eski non-unique indexni olib tashlash (migration 016'dan)
DROP INDEX IF EXISTS idx_klient_nomi_lower;
