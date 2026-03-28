# SavdoAI Telegram Bot — Buyruqlar Qo'llanmasi

## Asosiy buyruqlar

| Buyruq | Tavsif |
|--------|--------|
| `/start` | Ro'yxatdan o'tish / bosh menyu |
| `/yordam` | Barcha buyruqlar ro'yxati |
| `/hisobot` | Kunlik/haftalik/oylik hisobot |
| `/foyda` | Foyda tahlili |
| `/hafta` | Haftalik yakuniy |
| `/qarz` | Qarzlar ro'yxati |
| `/klient` | Klient izlash va hisob-kitob |
| `/tovar` | Tovar izlash |
| `/ombor` | Ombor qoldiqlari |
| `/top` | Eng ko'p sotilgan tovarlar |
| `/kassa` | Kassa balansi |
| `/balans` | Ledger balansi |
| `/jurnal` | Buxgalteriya jurnali |
| `/status` | Bot holati tekshirish |

## Ovoz bilan ishlash

**Ovoz yuboring — bot hamma ishni qiladi:**

- "Salimovga ellik dona ariel ketti narxi qirq besh ming" → Sotuv
- "Yuz kilogram un kirdi narxi o'ttiz besh ming" → Kirim
- "Salimov besh million to'ladi" → Qarz to'lash
- "Arielni qaytaraman besh dona" → Qaytarish

## Savat tizimi (optom)

Har bir klient uchun alohida savat:
- Ovoz yuborasiz → savatga qo'shiladi
- "Salimov bo'ldi" → savat yopiladi, nakladnoy chiqadi
- `/savatlar` — ochiq savatlar ro'yxati
- `/savat Salimov` — bitta savat ichini ko'rish

## Rasm yuborish

- Nakladnoy rasmini yuboring → AI o'qiydi, ma'lumot chiqaradi
- Chek rasmini yuboring → tovarlar ro'yxati
- Daftar rasmini yuboring → yozuvlarni o'qiydi

## Smart funksiyalar

| Buyruq | Tavsif |
|--------|--------|
| "Arielni qanchadan sotay?" | Narx tavsiyasi (o'rtacha, min, max) |
| `/narx_guruh VIP` | Narx guruhi yaratish |
| `/narx_qoy Ariel VIP 42000` | Guruhga narx qo'yish |
| `/klient_guruh Salimov VIP` | Klientni guruhga biriktirish |

## Shogird nazorati

| Buyruq | Tavsif |
|--------|--------|
| `/shogird_qosh 123456 Akbar` | Shogird qo'shish (Telegram UID) |
| `/shogirdlar` | Barcha shogirdlar |
| `/xarajatlar` | Xarajatlar hisoboti |

## Nakladnoy

| Buyruq | Tavsif |
|--------|--------|
| `/nakladnoy` | Oxirgi sotuvdan nakladnoy |
| "Salimov nakladnoy" | Klient savatidan nakladnoy |

## Admin buyruqlari

| Buyruq | Tavsif |
|--------|--------|
| `/faollashtir <user_id> [kunlar]` | Foydalanuvchini faollashtirish |
| `/statistika` | Tizim statistikasi |
| `/foydalanuvchilar` | Barcha foydalanuvchilar |
| `/parol <uid> <login> <parol>` | Web panel login berish |
| `/token` | Web panel uchun JWT token |
| `/ping` | Bot ishlayotganini tekshirish |

## Fayl yuborish

Bot quyidagi fayllarni qabul qiladi:
- PDF, Word (.docx), Excel (.xlsx)
- Rasmlar (JPG, PNG, WebP)
- EPUB, PPTX, FB2, HTML, TXT, CSV, JSON, Python

## Chek chiqarish

Har operatsiyadan keyin "chek chiqar" deb yozing — thermal printer uchun chek yaratiladi.

## Tillar

Bot **O'zbek** (barcha 8 ta sheva) va **Rus** tillarini tushunadi.
Sheva namunalari: Toshkent, Samarqand, Farg'ona, Xorazm, Qashqadaryo, Andijon, Buxoro, Qoraqalpog'iston.
