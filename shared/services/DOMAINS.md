# SavdoAI — `shared/services/` Domain Map

Ushbu papka 79 ta servis fayldan iborat. Navigatsiyani osonlashtirish uchun
ular quyidagi **5 ta domain**ga taqsimlangan. **Fayllar hali ko'chirilmagan** —
bu hujjat faqat mantiqiy xaritani ko'rsatadi (FAZA 2 ish: fayllarni
subdirectory'larga ko'chirish kelajakda).

Yangi modul qo'shganda — quyidagi jadvaldan mos domain'ni tanlang va
fayl nomini shu bo'lim'ga qo'shing.

---

## 🧠 AI domain — AI, NLP, vision, tavsiyalar
Vazifa: Claude/Gemini chaqiruvlari, matn tahlil, rasm tanish, tavsiya
berish, smart funksiyalar.

| Fayl | Vazifa |
|---|---|
| `ai_advisor.py` | Biznes tavsiyalari (Claude) |
| `ai_narx_tavsiya.py` | Narx tavsiya AI |
| `ai_suhbat.py` | AI suhbatdosh (Claude dialog) |
| `chek_oqish.py` | Chek rasm → matn (Gemini Vision) |
| `excel_analyzer.py` | Excel fayl AI tahlil |
| `excel_chat.py` | Excel chat AI (natural language query) |
| `fuzzy_match.py` | Tovar nomi fuzzy mos kelishi |
| `hujjat_oqish.py` | Hujjat/nakladnoy rasm OCR |
| `mutaxassis.py` | Mutaxassis rejim — Claude deep analysis |
| `ocr_processor.py` | Umumiy OCR interfeys |
| `print_intent.py` | Print intent aniqlash |
| `rasm_tur_aniqlash.py` | Rasm turi (chek/tovar/hujjat) |
| `smart_ai.py` | Smart AI interfeys |
| `smart_bot_engine.py` | Smart bot main engine |
| `smart_notification.py` | Smart xabar generator |
| `smart_sale.py` | Smart sotuv tavsiyasi |
| `suhbatdosh.py` | User bilan suhbat AI |
| `vision.py` | Gemini Vision mikroskop |
| `voice_commands.py` | Ovozli komanda aniqlash |
| `voice_correction.py` | Ovoz matn tuzatish |
| `voice_order_parser.py` | Ovoz → zakaz parser |

---

## 💼 Commerce domain — savdo, nakladnoy, klient, aksiya
Vazifa: sotuv jarayoni, hujjatlar, klient ma'lumoti, narx-chegirma mantiq.

| Fayl | Vazifa |
|---|---|
| `aksiya.py` | Aksiya/promo boshqaruv |
| `chegirma.py` | Chegirma hisob-kitob |
| `invoice.py` | Invoice (shartnoma) |
| `klient_360.py` | Klient 360 profil |
| `klient_clv.py` | Klient lifetime value |
| `klient_crm.py` | CRM ma'lumotlari |
| `klient_segment.py` | Klient segmentatsiya |
| `loyalty.py` | Loyalty dastur |
| `nakladnoy_import.py` | Nakladnoy import (Excel) |
| `nakladnoy_parser.py` | Nakladnoy matn parser |
| `ochiq_savat.py` | Ochiq savat (cart) |
| `reestr_parser.py` | Reestr fayl parser |
| `seed_catalog.py` | Katalog seed/import |
| `smart_narx.py` | Aqlli narx hisoblash |
| `supplier_order.py` | Yetkazib beruvchi zakaz |
| `shogird_xarajat.py` | Shogird xarajat (operatsion) |
| `van_selling.py` | Van selling (ekspeditor) |
| `excel_import.py` | Excel import interfeys |
| `excel_reader.py` | Excel fayl o'qish |
| `gamification.py` | Gamifikatsiya |
| `churn_prediction.py` | Klient ketishi bashorat |

---

## 📊 Reporting domain — hisobot, export, moliya
Vazifa: raqamli hisobotlar, PDF/Excel generatsiya, moliyaviy tahlil.

| Fayl | Vazifa |
|---|---|
| `auto_report_pdf.py` | Avtomatik PDF hisobot |
| `financial_statements.py` | Moliyaviy hisobotlar (Balance, P&L) |
| `hisobot_engine.py` | Asosiy hisobot engine |
| `kpi_engine.py` | KPI hisoblash engine |
| `moliyaviy_prognoz.py` | Moliyaviy prognoz |
| `oylik_hisobot.py` | Oylik hisobot mantiq |
| `qarz_eslatma.py` | Qarz eslatma (auto notify) |
| `universal_export.py` | Universal export (Excel/PDF/CSV) |
| `abc_xyz_matritsa.py` | ABC/XYZ tahlil |
| `daily_planner.py` | Kunlik rejalashtirish |
| `demand_forecast.py` | Talab prognozi |
| `ombor_alert.py` | Ombor ogohlantirishlari |
| `ombor_prognoz.py` | Ombor prognoz |
| `raqobat_monitoring.py` | Raqobatchi narx monitoring |
| `tp_analyzer.py` | TP tahlil (transportation?) |

---

## 🛠️ Ops domain — print, webhook, GPS, print session, offline
Vazifa: infrastruktura, tashqi integratsiya, print tizimi, GPS, fayl.

| Fayl | Vazifa |
|---|---|
| `bot_print_handler.py` | Bot print handler |
| `escpos_xprinter.py` | ESC/POS printer integratsiya |
| `gps_tracking.py` | GPS kuzatuv |
| `print_session.py` | Print sessiya (HMAC token) |
| `print_status.py` | Print status tracking |
| `thermal_receipt.py` | Termal chek printer |
| `tolov_integratsiya.py` | To'lov tizimi integratsiya |
| `webhook_platform.py` | Webhook yuborish |
| `ovoz_arxiv.py` | Ovoz xabar arxivi |
| `route_optimizer.py` | Yo'l optimallashtirish |
| `server_config.py` | Server konfiguratsiya |
| `live_feed.py` | Real-time event stream |

---

## 🛡️ Audit domain — xavfsizlik, ledger, obuna
Vazifa: audit log, xavfsizlik qoidalari, SAP-grade buxgalteriya, obuna.

| Fayl | Vazifa |
|---|---|
| `guards.py` | Xavfsizlik qoidalari (eski) |
| `guards_v2.py` | Xavfsizlik v2 |
| `ledger.py` | SAP-grade double-entry ledger |
| `subscription.py` | Obuna boshqaruv |
| `pipeline.py` | Transaction pipeline (draft→confirm→post→audit) |
| `pipeline_ext.py` | Pipeline kengaytmalari |
| `sd_agent_gaps.py` | SalesDoc agent taqqos |
| `enterprise_modules.py` | Enterprise fichalar |
| `advanced_features.py` | Qo'shimcha fichalar |

---

## 📋 Qo'llanma: yangi modul qo'shishda

1. Yangi fayl nomi aniqlang — snake_case, qisqa, aniq (masalan `sms_yuborish.py`)
2. Shu fayl qaysi domain'ga mos kelishini tanlang:
   - AI tahlil → `AI domain`
   - Savdo/klient/nakladnoy → `Commerce domain`
   - Hisobot/KPI/export → `Reporting domain`
   - Printer/GPS/webhook → `Ops domain`
   - Audit/xavfsizlik/obuna → `Audit domain`
3. Faylni hozirgi `shared/services/` ga saqlang (hali subdirectory yo'q)
4. Ushbu hujjat jadvaliga yangi qator qo'shing
5. Tegishli handler'dan import qiling

## 📅 FAZA 2 kelajak ishi

Bu hujjat mantiqiy xaritani ko'rsatadi, lekin fayllar hali fizik
ko'chirilmagan. To'liq FAZA 2 ishi:

1. Har domain uchun alohida subdirectory yaratish (`shared/services/ai/`, ...)
2. Fayllarni ko'chirish
3. Barcha import'larni yangilash (bot/, api/, worker/ — ~50+ fayl)
4. Test suite ishlashini kafolatlash
5. Git history saqlash (git mv bilan)

Vaqt: ~40-60 soat. Risk: o'rta (import path o'zgarishi).
Hozirgi 79 fayl ishlashda davom etadi — bu refactoring sekin va
bosqichma-bosqich bo'ladi.
