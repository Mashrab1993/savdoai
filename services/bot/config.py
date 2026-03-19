"""
╔══════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA — KONFIGURATSIYA  v21.3                 ║
╚══════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import os, sys, logging
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()
log = logging.getLogger(__name__)


@dataclass(frozen=True)
class Config:
    # ── Asosiy ────────────────────────────────────────────
    bot_token:     str
    database_url:  str
    anthropic_key: str
    gemini_key:    str
    admin_ids:     frozenset[int] = field(default_factory=frozenset)

    # ── AI modellari ──────────────────────────────────────
    claude_model:  str = "claude-sonnet-4-6"
    gemini_model:  str = "gemini-3.1-flash-lite"

    # ── Railway / Webhook ─────────────────────────────────────────────
    # Bot long-polling rejimida ishlaydi (DROP_PENDING env bilan boshqarish).
    # Webhook uchun qo'shimcha kod kerak (hozircha ISHLATILMAYDI).
    webhook_url:   str = ""    # UNUSED: bot polling uses run_polling()
    webhook_port:  int = 8443  # UNUSED
    port:          int = 8080  # UNUSED: Railway $PORT bilan boshqaradi

    # ── DB pool ───────────────────────────────────────────
    db_min:        int = 2
    db_max:        int = 20
    db_timeout:    int = 60   # UNUSED: asyncpg uses default timeouts

    # ── AI ─────────────────────────────────────────────────────────────
    ai_retries:    int = 3   # UNUSED: bot_services/analyst reads AI_RETRIES env
    ai_timeout:    int = 30  # UNUSED: bot_services/analyst reads AI_TIMEOUT env

    # ── Avtomatik hisobot (soat, O'zbekiston vaqti) ───────
    kunlik_soat:   int = 22
    haftalik_soat: int = 8
    qarz_soat:     int = 10
    obuna_soat:    int = 9

    # ── Boshqa ────────────────────────────────────────────
    timezone:      str = "Asia/Tashkent"
    max_retries:   int = 3    # UNUSED: retry logic uses task-specific values

    def is_admin(self, uid: int) -> bool:
        return uid in self.admin_ids


_cfg: Config | None = None


def cfg() -> Config:
    global _cfg
    if _cfg is None:
        raise RuntimeError("Config ishga tushirilmagan! config_init() ni chaqiring.")
    return _cfg


def config_init() -> Config:
    global _cfg

    bot_token    = os.getenv("BOT_TOKEN", "")
    database_url = os.getenv("DATABASE_URL", "")
    anthropic_key= os.getenv("ANTHROPIC_API_KEY", "")
    gemini_key   = os.getenv("GEMINI_API_KEY", "")
    admin_raw    = os.getenv("ADMIN_IDS", "")

    # Validatsiya
    xatolar = []
    if not bot_token:     xatolar.append("BOT_TOKEN")
    if not database_url:  xatolar.append("DATABASE_URL")
    if not anthropic_key: xatolar.append("ANTHROPIC_API_KEY")
    if not gemini_key:    xatolar.append("GEMINI_API_KEY")

    if xatolar:
        log.critical("❌ Muhim o'zgaruvchilar yo'q: %s", ", ".join(xatolar))
        sys.exit(1)

    admin_ids: frozenset[int] = frozenset(
        int(x.strip()) for x in admin_raw.split(",") if x.strip().isdigit()
    )

    _cfg = Config(
        bot_token     = bot_token,
        database_url  = database_url,
        anthropic_key = anthropic_key,
        gemini_key    = gemini_key,
        admin_ids     = admin_ids,
        webhook_url   = os.getenv("WEBHOOK_URL", ""),
        webhook_port  = int(os.getenv("WEBHOOK_PORT", "8443")),
        port          = int(os.getenv("PORT", "8080")),
        db_min        = int(os.getenv("DB_MIN", "2")),
        db_max        = int(os.getenv("DB_MAX", "20")),
        db_timeout    = int(os.getenv("DB_TIMEOUT", "60")),
        ai_retries    = int(os.getenv("AI_RETRIES", "3")),
        ai_timeout    = int(os.getenv("AI_TIMEOUT", "30")),
        kunlik_soat   = int(os.getenv("KUNLIK_SOAT",  "22")),
        haftalik_soat = int(os.getenv("HAFTALIK_SOAT","8")),
        qarz_soat     = int(os.getenv("QARZ_SOAT",    "10")),
        obuna_soat    = int(os.getenv("OBUNA_SOAT",   "9")),
    )

    log.info("✅ Config yuklandi | Admin: %s ta | Model: %s",
             len(admin_ids), _cfg.claude_model)
    return _cfg
