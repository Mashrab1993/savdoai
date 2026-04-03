-- ═══════════════════════════════════════════════════════════════
-- v25.3.1 — RLS HIMOYA QO'SHISH (mavjud jadvallar)
--
-- 11 ta jadval user_id bor lekin RLS yo'q edi.
-- Bu migratsiya ularni himoyalaydi.
-- Idempotent — qayta ishga tushirish xavfsiz.
-- ═══════════════════════════════════════════════════════════════

-- Kassa operatsiyalari — moliyaviy tranzaksiyalar
SELECT enable_rls('kassa_operatsiyalar');

-- Jurnal yozuvlar — double-entry ledger
SELECT enable_rls('jurnal_yozuvlar');

-- Fakturalar — hisob-fakturalar
SELECT enable_rls('fakturalar');

-- Narx guruhlari va narxlar
SELECT enable_rls('narx_guruhlari');
SELECT enable_rls('guruh_narxlar');
SELECT enable_rls('klient_narxlar');

-- Shogirdlar — xarajat nazorati
SELECT enable_rls('shogirdlar');

-- Audit log — tekshiruv izi
SELECT enable_rls('audit_log');

-- Qo'shimcha jadvallar
SELECT enable_rls('vision_log');
SELECT enable_rls('cognitive_tasks');
SELECT enable_rls('hujjat_versiyalar');
SELECT enable_rls('xarajatlar');
