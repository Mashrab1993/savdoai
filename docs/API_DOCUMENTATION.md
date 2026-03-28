# SavdoAI API Documentation v25.3

**66 endpoint** | 14 Swagger tag guruhi | 24 Pydantic model | Swagger: `/docs`

## Autentifikatsiya

Barcha `/api/v1/*` endpointlar JWT token talab qiladi.

### Token olish usullari:

**1. Telegram bot orqali:**
```
Bot ga /token yozing → 24 soatlik JWT token olasiz
```

**2. Login + parol:**
```
POST /auth/login
{
  "login": "salimov",
  "parol": "1234"
}
→ {"token": "eyJ...", "user_id": 123456}
```

**3. Telefon + parol:**
```
POST /auth/login
{
  "telefon": "+998901234567",
  "parol": "1234"
}
```

### Token ishlatish:
```
Authorization: Bearer <token>
```

### Rate limiting:
- Umumiy: 100 so'rov/daqiqa (IP bo'yicha)
- Login: 5 urinish/daqiqa (brute-force himoya)

---

## Tovarlar

### Ro'yxat olish
```
GET /api/v1/tovarlar?limit=20&offset=0&kategoriya=Kiyim
```

### Bitta tovar
```
GET /api/v1/tovar/{id}
```

### Yangi tovar yaratish
```
POST /api/v1/tovar
{
  "nomi": "Ariel 3kg",
  "kategoriya": "Kimyoviy",
  "birlik": "dona",
  "olish_narxi": 35000,
  "sotish_narxi": 45000,
  "qoldiq": 100,
  "min_qoldiq": 10
}
→ {"id": 1, "nomi": "Ariel 3kg", "status": "yaratildi"}
```

### Tovar tahrirlash
```
PUT /api/v1/tovar/{id}
{
  "sotish_narxi": 48000,
  "qoldiq": 150
}
→ {"id": 1, "status": "yangilandi"}
```

### Tovar o'chirish
```
DELETE /api/v1/tovar/{id}
→ {"id": 1, "status": "ochirildi"}
```
*Agar sotuvda ishlatilgan bo'lsa — 409 xato qaytaradi.*

### Qoldiq yangilash (inventarizatsiya)
```
POST /api/v1/tovar/{id}/qoldiq
{
  "qoldiq": 75
}
→ {"id": 1, "nomi": "Ariel 3kg", "eski_qoldiq": 100, "yangi_qoldiq": 75}
```

### Tovar tarixi
```
GET /api/v1/tovar/{id}/tarix?limit=20
→ {
    "tovar": {nomi, kategoriya, birlik, olish_narxi, sotish_narxi, qoldiq},
    "sotuvlar": [{miqdor, sotish_narxi, jami, sana, klient_ismi}],
    "kirimlar": [{miqdor, narx, jami, manba, sana}],
    "statistika": {sotuv_soni, jami_sotilgan, jami_tushum}
  }
```

### Excel export
```
GET /api/v1/tovar/export/excel
→ {"filename": "tovarlar.xlsx", "content_base64": "UEsDB...", "tovar_soni": 150}
```
*Base64 ni decode qilib .xlsx fayl sifatida yuklab olish mumkin.*

---

## Klientlar

### Ro'yxat
```
GET /api/v1/klientlar?limit=20&offset=0&qidiruv=Salimov
```

### Yangi klient
```
POST /api/v1/klient
{
  "ism": "Salimov",
  "telefon": "+998901234567",
  "kredit_limit": 5000000
}
```

### Klient tahrirlash
```
PUT /api/v1/klient/{id}
{
  "telefon": "+998907654321",
  "kredit_limit": 10000000
}
```

### Klient o'chirish
```
DELETE /api/v1/klient/{id}
```
*Agar faol qarz bo'lsa — 409 xato qaytaradi.*

---

## Sotuv

```
POST /api/v1/sotuv
{
  "klient": "Salimov",
  "tovarlar": [
    {"nomi": "Ariel 3kg", "miqdor": 50, "birlik": "dona", "narx": 45000}
  ],
  "jami_summa": 2250000,
  "tolangan": 1750000,
  "qarz": 500000
}
```

---

## Qarz

### Faol qarzlar ro'yxati
```
GET /api/v1/qarzlar
```

### Qarz to'lash
```
POST /api/v1/qarz/tolash
{
  "klient_ismi": "Salimov",
  "summa": 500000
}
```

---

## Xarajatlar

### Bugungi / Oylik / Kutilmoqda
```
GET /api/v1/xarajatlar/bugungi
GET /api/v1/xarajatlar/oylik
GET /api/v1/xarajatlar/kutilmoqda
```

### Yangi xarajat qo'shish
```
POST /api/v1/xarajat
{
  "kategoriya_nomi": "⛽ Benzin",
  "summa": 80000,
  "izoh": "Yoqilg'i olish"
}
```

### Tasdiqlash / Bekor qilish
```
POST /api/v1/xarajat/{id}/tasdiqlash
POST /api/v1/xarajat/{id}/bekor
```

---

## Bildirishnomalar

```
GET /api/v1/bildirishnomalar
→ {
    "items": [
      {"tur": "qarz_muddati", "darajasi": "xavfli", "matn": "Salimov: 2 ta qarz muddati o'tgan"},
      {"tur": "kam_qoldiq", "darajasi": "ogohlantirish", "matn": "Ariel: qoldiq 3, minimum 10"}
    ],
    "jami": 2
  }
```

---

## Hisobotlar

```
GET /api/v1/hisobot/kunlik
GET /api/v1/hisobot/haftalik
GET /api/v1/hisobot/oylik
```

### Foyda tahlili
```
GET /api/v1/hisobot/foyda?kunlar=30
→ {
    "brutto_sotuv": 72000000,
    "tannarx": 54000000,
    "sof_foyda": 18000000,
    "xarajatlar": 3500000,
    "toza_foyda": 14500000,
    "margin_foiz": 25.0,
    "top_foyda": [{nomi, foyda, miqdor}],
    "top_zarar": [{nomi, zarar, miqdor}]
  }
```

### Export (Excel/PDF)
```
POST /api/v1/export
{"tur": "kunlik", "format": "excel"}
→ {"task_id": "abc-123"}

GET /api/v1/export/{task_id}
→ {"status": "done"}

GET /api/v1/export/file/{task_id}
→ fayl yuklab olish
```

---

## Kassa

```
GET  /api/v1/kassa/stats
GET  /api/v1/kassa/tarix
POST /api/v1/kassa/operatsiya
     {"tur": "kirim", "summa": 500000, "usul": "naqd", "tavsif": "Kunlik tushum"}
DELETE /api/v1/kassa/operatsiya/{id}
```

---

## Narx tizimi

```
GET  /api/v1/narx/guruhlar
POST /api/v1/narx/guruh           {"nomi": "VIP", "izoh": "Doimiy mijozlar"}
POST /api/v1/narx/qoyish          {"guruh_id": 1, "tovar_id": 5, "narx": 42000}
POST /api/v1/narx/klient_guruh    {"klient_id": 3, "guruh_id": 1}
```

---

## Ledger (SAP-grade buxgalteriya)

```
GET /api/v1/ledger/balans
GET /api/v1/ledger/jurnal?limit=50
GET /api/v1/ledger/jurnal/{id}
GET /api/v1/ledger/hisob/{hisob_nomi}
```

---

## Monitoring

```
GET /health       ← DB ping, pool stats
GET /healthz      ← Lightweight (no DB)
GET /live         ← Process uptime
GET /readyz       ← Full readiness
GET /metrics      ← Request stats
GET /version      ← Versiya
```

---

## Savdolar (sotuv sessiyalari)

### Ro'yxat (filtrlar bilan)
```
GET /api/v1/savdolar?limit=20&offset=0&klient=Salimov&sana_dan=2025-03-01&sana_gacha=2025-03-28
→ {
    "total": 150,
    "items": [{id, klient_ismi, jami, tolangan, qarz, sana, tovar_soni}],
    "stats": {bugun_tushum, bugun_tolangan, bugun_qarz, bugun_soni}
  }
```

### Bitta sotuv tafsiloti
```
GET /api/v1/savdo/{id}
→ {id, klient_ismi, jami, tolangan, qarz, sana,
   "tovarlar": [{tovar_nomi, miqdor, birlik, sotish_narxi, jami}]}
```

---

## Dashboard Top (grafiklar uchun)

```
GET /api/v1/dashboard/top?kunlar=30
→ {
    "top_tovar":  [{nomi, jami, miqdor, foyda}],
    "top_klient": [{ism, jami, soni, qarz}],
    "kunlik_trend": [{kun, sotuv, qarz}]
  }
```
*Cached — tez qaytadi.*

---

## Tovar Import

### Batch import (Excel dan JSON)
```
POST /api/v1/tovar/import
{
  "tovarlar": [
    {"nomi": "Ariel 3kg", "kategoriya": "Kimyoviy", "sotish_narxi": 45000, "qoldiq": 100},
    {"nomi": "Persil 2kg", "sotish_narxi": 38000}
  ]
}
→ {"yaratildi": 1, "yangilandi": 1, "xatolar": [], "jami": 2}
```
*Maksimal 1000 ta tovar. Mavjud tovar nomini yuborsangiz — yangilaydi (ON CONFLICT).*

---

## Statistika (Admin)

```
GET /api/v1/statistika
→ {
    "tovar_soni": 150,
    "klient_soni": 45,
    "faol_qarz": 12500000,
    "kam_qoldiq_soni": 8,
    "muddat_otgan_qarz": 3,
    "bugun": {"soni": 12, "jami": 3500000},
    "hafta": {"soni": 67, "jami": 18000000},
    "oy":    {"soni": 245, "jami": 72000000}
  }
```

---

## Profil

### Ma'lumot yangilash
```
PUT /api/v1/me
{
  "ism": "Salimov",
  "dokon_nomi": "Salimov Market",
  "telefon": "+998901234567",
  "manzil": "Toshkent, Chilonzor",
  "inn": "123456789"
}
→ {"status": "yangilandi", "maydonlar": ["ism", "dokon_nomi"]}
```

### Parol o'zgartirish
```
PUT /api/v1/me/parol
{
  "eski_parol": "1234",
  "yangi_parol": "5678"
}
→ {"status": "yangilandi"}
```

---

## Klient tarixi

```
GET /api/v1/klient/{id}/tarix?limit=20
→ {
    "klient": {ism, telefon, kredit_limit, jami_sotib},
    "sotuvlar": [{id, jami, tolangan, qarz, sana, tovar_soni}],
    "qarzlar": [{id, dastlabki_summa, tolangan, qolgan, muddat, yopildi}]
  }
```

---

## QR-kod

```
GET /api/v1/qr/{sessiya_id}
→ {
    "sessiya_id": 123,
    "klient": "Salimov",
    "jami": 2500000,
    "qr_content": "https://example.com/p/123",
    "qr_hash": "a1b2c3d4"
  }
```
