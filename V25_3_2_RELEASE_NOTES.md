# SavdoAI v25.3.2 — RELEASE NOTES

**Sana:** 2026-04-03
**Baho:** PRODUCTION READY ✅
**Testlar:** 1347 passed, 0 failed

---

## 🧠 YANGI TIZIMLAR (13 ta)

### 1. AI Business Advisor (`/tahlil`)
Raqobatchilarning hech birida yo'q. Sotuv ma'lumotlaridan aqlli xulosalar:
- Sotuv anomaliya aniqlash (keskin tushish/ko'tarilish)
- Klient yo'qotish ogohlantirish (2 hafta sotib olmagan)
- Tovar trend tahlili (eng o'sgan/tushgan)
- Zarar bilan sotuv aniqlash
- Kredit limit oshgan klientlar
- Eng yaxshi sotuv kuni aniqlash

### 2. Qarz Eslatma (`/eslatma`)
Khatabook modelidan ilhomlangan:
- 3 ta shablon (yumshoq/oddiy/urgent)
- Avtomatik Telegram xabar klientga
- Spam himoyasi (3 kun oraliq)
- Inline tugmalar (bitta/barchaga)

### 3. KPI Engine (`/kpi`)
SalesDoc modelidan:
- A/B/C/D agent reyting
- 8 ta badge (🌱⭐🔥💎🏆👥💰⚡)
- Leaderboard (top sotuvchilar)
- Trend tahlili (o'sish/tushish %)
- Kunlik grafik data

### 4. Loyalty Ball (`/loyalty`)
Starbucks modelidan:
- 1000 so'm = 1 ball
- VIP darajalar: Bronze→Silver→Gold→Platinum
- Avtomatik ball qo'shish har sotuvda
- Ball → chegirmaga sarflash
- Klient profili

### 5. To'lov Integratsiya (Click/Payme)
- Click.uz adapter + webhook
- Payme.uz adapter + webhook
- Factory pattern (kengaytirish oson)
- Real webhook endpointlar

### 6. Ombor Prognoz (`/buyurtma`)
Lightspeed modelidan:
- Kunlik sotuv tezligi hisoblash
- Tovar tugash prognozi (qolgan kunlar)
- Avtomatik buyurtma tavsiyasi
- Kam qoldiq xulosa

### 7. Multi-filial
SmartUp modelidan:
- Filial yaratish/boshqarish
- Filial tovar qoldiqlari
- Filiallar arasi transfer
- Birlashtirilgan hisobot

### 8. GPS Tracking
SalesDoc modelidan:
- Telegram location saqlash
- Kunlik marshrut hisoboti
- Masofa hisoblash (Haversine)
- Haftalik GPS xulosa

### 9. Supplier Auto-Order
- Kam qoldiqli tovarlar uchun buyurtma
- Yetkazib beruvchilar boshqaruvi
- Buyurtma Telegram xabar
- 2 haftalik zaxira hisoblash

### 10. Smart Notification
- 08:00 ertalabki xulosa (kecha natija + bugun vazifa)
- 20:00 kechki hisobot (bugun natija + foyda)
- Dushanba haftalik digest (top tovar/klient)
- Har 2 soat critical alert (tugagan tovar, limit oshgan)
- Aqlli logika — sotuv bo'lmasa yuborMAYDI

### 11. Smart Sale
- Pre-sale: kredit limit, loyalty chegirma, qoldiq, zarar tekshirish
- Post-sale: loyalty ball, kam qoldiq ogohlantirish
- Sotuv chekida ogohlar ko'rinadi

### 12. Freemium Model (`/tariflar`)
- Boshlang'ich: BEPUL (50 tovar, 100 sotuv/oy)
- O'rta: 49,000 so'm/oy (500 tovar, KPI, Loyalty)
- Biznes: 149,000 so'm/oy (Cheksiz, GPS, Webhook)
- 14 kun bepul sinov

### 13. Tojik Tili
- 30+ Tojik raqam so'zlari (як, ду, се... ҳазор)
- Tojik amal so'zlari (фурохт, додам, омад...)
- Tojik qarz so'zlari (қарз, насия)

---

## 🐛 BUG TUZATISHLAR (20+)
- D() funksiya birlashtirish
- API sotuv exact match (5 joyda)
- user_yoz UPSERT
- klient_tarix klient_id bo'yicha
- Export file auth token
- pul() duplikat
- Bot dual pool minimal

## 📁 YANGI FAYLLAR (30+)
14 servis modul | 8 API route | 3 bot handler | 5 migration | 2 test fayl | 1 KPI Dashboard

## 📊 STATISTIKA
- 137 Python fayl
- 42 DB jadval, 57 index
- 16 migratsiya
- 7 AI tool, 16 voice command
- 1347 pytest test
- ~5,500 qator yangi kod
