"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI — EXTRA AI PROVIDERS (plug-and-play)                       ║
║                                                                      ║
║  Claude + Gemini allaqachon bor. Bu modul ularning ustiga            ║
║  quyidagilarni qo'shadi — har biri env key bor bo'lsa avtomatik     ║
║  yoqiladi, yo'q bo'lsa jim o'tkazib yuboriladi.                     ║
║                                                                      ║
║   • OpenAI GPT-5 Pro    — OPENAI_API_KEY                             ║
║   • OpenAI Whisper V3   — OPENAI_API_KEY (bitta kalit)              ║
║   • DeepSeek V3         — DEEPSEEK_API_KEY                           ║
║   • xAI Grok 4          — XAI_API_KEY                                ║
║                                                                      ║
║  Har bir provider oddiy (system, user) → str chat() metoduga ega.   ║
║  Ularni `second_opinion()` yoki `cheap_batch()` orqali chaqiring.    ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Optional

import httpx

log = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════════════
#  CONFIG — env'dan o'qiladi, keys keyinroq kelsa ham ishlaydi
# ════════════════════════════════════════════════════════════════════

OPENAI_KEY   = os.getenv("OPENAI_API_KEY", "").strip()
DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
XAI_KEY      = os.getenv("XAI_API_KEY", "").strip()
V0_KEY       = os.getenv("V0_API_KEY", "").strip()

OPENAI_MODEL   = os.getenv("OPENAI_MODEL",   "gpt-5.4")       # override qilsa bo'ladi
WHISPER_MODEL  = os.getenv("WHISPER_MODEL",  "whisper-1")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
XAI_MODEL      = os.getenv("XAI_MODEL",      "grok-4")
V0_MODEL       = os.getenv("V0_MODEL",       "v0-1.0-md")

HTTP_TIMEOUT = float(os.getenv("AI_EXTRAS_TIMEOUT", "60"))


# ════════════════════════════════════════════════════════════════════
#  BASE CLASS — har biri OpenAI-uyg'un chat completions protokoli
# ════════════════════════════════════════════════════════════════════

@dataclass
class ChatProvider:
    """OpenAI-uyg'un /v1/chat/completions endpoint bo'yicha sodda klient."""
    name: str
    base_url: str
    model: str
    api_key: str

    @property
    def ready(self) -> bool:
        return bool(self.api_key)

    async def chat(
        self,
        system: str,
        user: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> str:
        """Ikki rolli chat chaqiruvi. Javob matnini qaytaradi."""
        if not self.ready:
            raise RuntimeError(f"{self.name}: API key yo'q")

        body: dict = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
        }
        # GPT-5 oilasi max_completion_tokens ishlatadi va temperature'ni
        # qo'llab-quvvatlamaydi. Boshqa modellar eski max_tokens.
        if self.model.startswith("gpt-5") or self.model.startswith("o1") \
                or self.model.startswith("o3") or self.model.startswith("o4"):
            body["max_completion_tokens"] = max_tokens
        else:
            body["max_tokens"] = max_tokens
            body["temperature"] = temperature
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type":  "application/json",
        }

        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as cli:
            r = await cli.post(
                f"{self.base_url}/chat/completions",
                json=body,
                headers=headers,
            )
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]


# ════════════════════════════════════════════════════════════════════
#  PROVIDER INSTANCES — modul import bo'lganda yaratiladi
# ════════════════════════════════════════════════════════════════════

gpt5 = ChatProvider(
    name="GPT-5",
    base_url="https://api.openai.com/v1",
    model=OPENAI_MODEL,
    api_key=OPENAI_KEY,
)

deepseek = ChatProvider(
    name="DeepSeek V3",
    base_url="https://api.deepseek.com/v1",
    model=DEEPSEEK_MODEL,
    api_key=DEEPSEEK_KEY,
)

grok = ChatProvider(
    name="Grok 4",
    base_url="https://api.x.ai/v1",
    model=XAI_MODEL,
    api_key=XAI_KEY,
)

# v0.dev — OpenAI-uyg'un endpoint orqali ishlaydi (Vercel Platform API)
v0 = ChatProvider(
    name="v0.dev",
    base_url="https://api.v0.dev/v1",
    model=V0_MODEL,
    api_key=V0_KEY,
)

_PROVIDERS = [gpt5, deepseek, grok, v0]


def active_providers() -> list[str]:
    """Hozir yoqilgan providerlar ro'yxati."""
    return [p.name for p in _PROVIDERS if p.ready]


# ════════════════════════════════════════════════════════════════════
#  WHISPER — ovoz → matn (OpenAI audio.transcriptions)
# ════════════════════════════════════════════════════════════════════

async def whisper_transcribe(
    audio_bytes: bytes,
    filename: str = "voice.ogg",
    language: Optional[str] = None,
) -> Optional[str]:
    """
    Whisper V3 orqali ovozni matn qilish (Gemini fallback sifatida).

    DIQQAT: Whisper-1 rasmiy ro'yxatida o'zbek tili (uz) YO'Q. Agar
    o'zbek ovoz bo'lsa, language parametrini bermang — auto-detect
    ishlaydi (Whisper ovozni qo'shni turkiy til sifatida transkriptsiya
    qiladi, sifat past bo'lishi mumkin). Shuning uchun asosiy STT
    Gemini 2.5 Pro — Whisper faqat zaxira sifatida.
    """
    if not OPENAI_KEY:
        return None

    headers = {"Authorization": f"Bearer {OPENAI_KEY}"}
    files = {"file": (filename, audio_bytes, "audio/ogg")}
    data = {
        "model": WHISPER_MODEL,
        "response_format": "text",
    }
    if language:
        data["language"] = language

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as cli:
            r = await cli.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers=headers,
                files=files,
                data=data,
            )
            r.raise_for_status()
            return r.text.strip()
    except Exception as e:
        log.warning("whisper transcribe: %s", e)
        return None


# ════════════════════════════════════════════════════════════════════
#  HIGH-LEVEL HELPERS — asosiy kod ushbularni chaqiradi
# ════════════════════════════════════════════════════════════════════

async def second_opinion(
    question: str,
    claude_answer: str,
    *,
    context: str = "",
) -> Optional[dict]:
    """
    GPT-5'dan Claude javobini tekshirishni so'raydi.

    Returns:
        {
            "agree": bool,
            "confidence": float,      # 0..1
            "reasoning": str,
            "correction": str | None,  # agar agree=False bo'lsa
        }
    """
    if not gpt5.ready:
        return None

    system = (
        "Siz SavdoAI biznes tizimining ikkinchi fikr auditchisi (independent "
        "reviewer). Vazifangiz — Claude tomonidan berilgan javobni "
        "xolisona tekshirish. Agar xato bo'lsa — aniq ayting. Faqat JSON "
        "formatda javob bering, boshqa matn qo'shmang."
    )
    user = (
        f"SAVOL:\n{question}\n\n"
        f"CLAUDE JAVOBI:\n{claude_answer}\n\n"
        + (f"QO'SHIMCHA KONTEKST:\n{context}\n\n" if context else "")
        + 'JSON sxema: {"agree": bool, "confidence": 0..1 float, '
          '"reasoning": "2-3 gapda sabab", "correction": "agar xato — to\'g\'risi"}'
    )
    try:
        raw = await gpt5.chat(system, user, temperature=0.1, json_mode=True)
        import json
        return json.loads(raw)
    except Exception as e:
        log.warning("second_opinion: %s", e)
        return None


async def cheap_batch(
    system: str,
    user: str,
    *,
    temperature: float = 0.2,
) -> Optional[str]:
    """
    DeepSeek V3 — arzon va tez. Ko'p miqdordagi so'rovlar uchun:
    fuzzy tovar nomi to'g'rilash, spam filter, oddiy intent parse.
    Agar DeepSeek yo'q bo'lsa → None (qayerdan chaqirilsa Gemini fallback qilsin).
    """
    if not deepseek.ready:
        return None
    try:
        return await deepseek.chat(
            system, user, temperature=temperature, max_tokens=512,
        )
    except Exception as e:
        log.warning("deepseek batch: %s", e)
        return None


async def generate_ui(prompt: str, *, max_tokens: int = 4000) -> Optional[str]:
    """
    v0.dev API — matn → React + Tailwind + shadcn/ui komponent.

    Bizning web stek allaqachon Next.js + shadcn/ui + Tailwind bo'lgani
    uchun v0 qaytargan kod 1:1 mos keladi — komponentni
    services/web/components/ga joylashtirish kifoya.
    """
    if not v0.ready:
        return None

    system = (
        "You are v0 by Vercel. Generate a single React component using "
        "TypeScript, Tailwind CSS and shadcn/ui. Use lucide-react icons. "
        "Include framer-motion animations where appropriate. Return ONLY "
        "the code inside a ```tsx code block — no explanation."
    )
    try:
        return await v0.chat(
            system, prompt,
            temperature=0.4,
            max_tokens=max_tokens,
        )
    except Exception as e:
        log.warning("v0 generate_ui: %s", e)
        return None


async def market_intel(query: str) -> Optional[str]:
    """
    Grok 4 — real-time bozor ma'lumoti (narxlar, yangiliklar, raqobatchi).
    Grok X/Twitter real-time index'ga ulangan, shuning uchun "hozirgi" holat
    uchun eng foydali.
    """
    if not grok.ready:
        return None
    system = (
        "Siz O'zbekiston FMCG va agro bozori bo'yicha real-time analitik. "
        "Savolga qisqa (max 6 qator) javob bering — raqamlar va manbalar bilan."
    )
    try:
        return await grok.chat(system, query, temperature=0.4, max_tokens=1024)
    except Exception as e:
        log.warning("grok intel: %s", e)
        return None


# Modul yuklanishda holatni logga yoz
log.info(
    "🧠 ai_extras: aktiv providerlar = %s",
    active_providers() or "yo'q (keys kutilmoqda)",
)
