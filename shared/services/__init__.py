"""
SavdoAI — shared/services/

79 ta servis fayl 5 mantiqiy domain'ga taqsimlangan. To'liq ro'yxat —
`DOMAINS.md`. Yangi modul qo'shganda shu hujjatni yangilang.

## Domainlar

- 🧠 **AI** — Claude/Gemini chaqiruvlari, vision, voice, smart funksiyalar
  (ai_advisor, ai_suhbat, smart_bot_engine, vision, voice_order_parser, ...)
- 💼 **Commerce** — savdo, nakladnoy, klient, aksiya, chegirma
  (aksiya, invoice, klient_360, ochiq_savat, nakladnoy_parser, ...)
- 📊 **Reporting** — hisobot, export, KPI, moliyaviy prognoz
  (hisobot_engine, financial_statements, auto_report_pdf, kpi_engine, ...)
- 🛠️ **Ops** — print, GPS, webhook, tolov, ovoz arxiv
  (print_session, webhook_platform, gps_tracking, bot_print_handler, ...)
- 🛡️ **Audit** — ledger, guards, pipeline, obuna
  (ledger, guards, pipeline, subscription, enterprise_modules, ...)

## FAZA 2 (kelajak)

Fayllarni subdirectory'larga ko'chirish (`shared/services/ai/`, ...).
Hozircha hamma narsa flat struktura — hujjat orqali navigatsiya.
"""
# v25.4.0 shared services — Opus 4.7 + domain map
