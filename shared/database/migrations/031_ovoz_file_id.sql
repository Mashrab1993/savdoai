-- 031: xarajatlar jadvaliga ovoz_file_id qo'shish
--
-- Sabab: Foydalanuvchi (admin) talab qildi — RASXODLAR guruhiga shogird ovozli
-- xabar tashlasa, ovoz fayli ham doimiy saqlanishi kerak. AI transkripsiyasi
-- yoki tahlilida xato bo'lsa, original ovozni eshitib tekshirib bo'lsin.
--
-- Tegishli kod: scripts/xarajat_listener.py (handle_message, _save_expense)
-- Saqlash joyi: /root/savdoai/scripts/xarajat_data/voices/{msg.id}.oga
ALTER TABLE xarajatlar ADD COLUMN IF NOT EXISTS ovoz_file_id TEXT;
