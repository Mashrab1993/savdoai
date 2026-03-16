# Mashrab Moliya v21.5 — SAP-GRADE ENTERPRISE

**O'zbek bozori uchun AI-powered savdo boshqaruv tizimi.**
Bank/SAP darajasidagi buxgalteriya + ovoz bilan boshqarish.

**Bot:** @mashrab_ceo_bot  |  **Telegram + Web + API**

## Ko'rsatkichlar

| | Qiymat |
|---|---|
| Fayllar | 51 |
| Qatorlar | 15,500+ |
| Testlar | 260+ (static + runtime) |
| DB jadvallar | 19 (RLS + FK) |
| Bot komandalar | 22 |
| API endpointlar | 37+ |
| AI modellari | Gemini 3.1 + Claude (MoE) |

## SAP-Grade Modullar

- `ledger.py` — Double-Entry Buxgalteriya (DEBIT=CREDIT)
- `pipeline.py` — Draft→Confirm→Post→Audit
- `ai_router.py` — Dual-Brain MoE (Gemini+Claude)
- `uzb_nlp.py` — O'zbek NLP (8 sheva, 1084 qator)
- `hisob.py` — Decimal matematika (19 funksiya)
- `guards.py` — Duplicate + Stock + Debt + Price
- `voice_commands.py` — 40+ O'zbek ovoz buyruq
- `print_status.py` — Printer lifecycle
- `excel_import.py` — Reestr + Nakladnoy import
- `fuzzy_match.py` — Trigram + Kirill→Lotin
- `vision.py` — Rasm→matn (Gemini OCR)
- `invoice.py` — Faktura Word+PDF

## Ishga tushirish

- **Lokal (kompyuterda):** `docs/Lokal_ISHGA_TUSHIRISH.md`
- **Railway (production):** `docs/ISHGA_TUSHIRISH.md`

## Testlar

```bash
python3 -m pytest tests/ -v
```
