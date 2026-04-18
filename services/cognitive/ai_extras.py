"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI — EXTRA AI PROVIDERS (plug-and-play)                       ║
║                                                                      ║
║  Claude + Gemini allaqachon bor. Bu modul ularning ustiga            ║
║  quyidagilarni qo'shadi — har biri env key bor bo'lsa avtomatik     ║
║  yoqiladi, yo'q bo'lsa jim o'tkazib yuboriladi.                     ║
║                                                                      ║
║   • Claude Opus 4.7     — ANTHROPIC_API_KEY (audit / second_opinion)║
║   • DeepSeek V3         — DEEPSEEK_API_KEY                           ║
║   • xAI Grok 4          — XAI_API_KEY                                ║
║                                                                      ║
║  Eslatma: OpenAI GPT-5.4 olib tashlandi — Claude Opus 4.7 (2026-04) ║
║  benchmark va matematik vazifalarda undan kuchli, yagona kalit       ║
║  (ANTHROPIC_API_KEY) bilan ishlaydi.                                 ║
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

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
DEEPSEEK_KEY  = os.getenv("DEEPSEEK_API_KEY", "").strip()
XAI_KEY       = os.getenv("XAI_API_KEY", "").strip()
V0_KEY        = os.getenv("V0_API_KEY", "").strip()

# Claude Opus 4.7 (2026-04-16 chiqdi) — eng kuchli umumiy model.
# 1M context, SWE-bench 87.6%, matematik audit uchun GPT-5.4 dan kuchli.
CLAUDE_OPUS_MODEL = os.getenv("CLAUDE_OPUS_MODEL", "claude-opus-4-7")
DEEPSEEK_MODEL    = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
XAI_MODEL         = os.getenv("XAI_MODEL",      "grok-4")
V0_MODEL          = os.getenv("V0_MODEL",       "v0-1.0-md")

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

# Claude Opus 4.7 — Anthropic /v1/messages endpoint (OpenAI uyg'un emas).
# Maxsus klient pastda — _ClaudeOpusClient.
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

# v0.dev — OpenAI emas, o'zining REST API'siga ega. Ushbu ChatProvider
# faqat ready flag uchun — haqiqiy ishni generate_ui() pastda qiladi.
v0 = ChatProvider(
    name="v0.dev",
    base_url="https://api.v0.dev/v1",
    model=V0_MODEL,
    api_key=V0_KEY,
)


# ── Claude Opus 4.7 client (Anthropic Messages API) ─────────────────
class _ClaudeOpusClient:
    """
    Anthropic Messages API klient (Opus 4.7 uchun).
    OpenAI'dan farqli — boshqa endpoint, boshqa header'lar, system alohida maydon.
    """

    BASE = "https://api.anthropic.com/v1/messages"
    name = "Claude Opus 4.7"

    @property
    def ready(self) -> bool:
        return bool(ANTHROPIC_KEY)

    @property
    def model(self) -> str:
        return CLAUDE_OPUS_MODEL

    async def chat(
        self,
        system: str,
        user: str,
        *,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> str:
        """Opus 4.7 chaqiruv. JSON mode uchun system'ga qo'shimcha ko'rsatma yoziladi."""
        if not self.ready:
            raise RuntimeError("Claude Opus: ANTHROPIC_API_KEY yo'q")

        if json_mode:
            system = (
                system
                + "\n\nMUHIM: Faqat valid JSON qaytar. ```json fence'siz, izohsiz. "
                "Qo'shimcha matn yozma — javob to'g'ridan-to'g'ri JSON parser'ga uzatiladi."
            )

        body = {
            "model": CLAUDE_OPUS_MODEL,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
        headers = {
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as cli:
            r = await cli.post(self.BASE, json=body, headers=headers)
            r.raise_for_status()
            data = r.json()
            # Anthropic javob: {content: [{type: "text", text: "..."}, ...]}
            for block in data.get("content", []):
                if block.get("type") == "text":
                    return block.get("text", "").strip()
            return ""


claude_opus = _ClaudeOpusClient()

# Eski kod yo'lidagi alias'lar — second_opinion va boshqa eski chaqiruvchilar
# uchun (ularni hech narsa o'zgartirmasdan ishlashi). Yangi kod — claude_opus.
gpt5 = claude_opus  # noqa: legacy alias — endi Opus 4.7'ni nazarda tutadi

_PROVIDERS = [claude_opus, deepseek, grok, v0]


# ── v0.dev dedicated client (chat-based, not chat/completions) ─────
class _V0Client:
    """
    v0.dev Platform API uses POST /v1/chats with {message, system}.
    Response: {id, messages: [{role, content}, ...]} where the last
    assistant message contains the generated tsx inside a code block.
    """

    BASE = "https://api.v0.dev/v1"

    @property
    def ready(self) -> bool:
        return bool(V0_KEY)

    async def generate(
        self,
        prompt: str,
        *,
        system: str = "",
        project_id: str | None = None,
        model: str = "",
    ) -> dict | None:
        if not V0_KEY:
            return None
        body: dict = {"message": prompt}
        if system:
            body["system"] = system
        if project_id:
            body["projectId"] = project_id
        if model:
            body["modelConfiguration"] = {"modelId": model}

        headers = {
            "Authorization": f"Bearer {V0_KEY}",
            "Content-Type":  "application/json",
        }
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as cli:
            r = await cli.post(f"{self.BASE}/chats", json=body, headers=headers)
            if r.status_code >= 400:
                log.warning("v0 chat create: %s %s", r.status_code, r.text[:200])
                return None
            return r.json()


_v0_client = _V0Client()


def _extract_tsx(raw_content: str) -> str:
    """Pull the tsx code block out of an assistant message body."""
    import re
    m = re.search(r"```(?:tsx|typescript|jsx|javascript)?\n(.*?)```",
                  raw_content, re.DOTALL)
    return m.group(1).strip() if m else raw_content.strip()


def active_providers() -> list[str]:
    """Hozir yoqilgan providerlar ro'yxati."""
    return [p.name for p in _PROVIDERS if p.ready]


# ════════════════════════════════════════════════════════════════════
#  HIGH-LEVEL HELPERS — asosiy kod ushbularni chaqiradi
# ════════════════════════════════════════════════════════════════════

async def opus_pro_audit(
    system: str,
    user: str,
    *,
    max_tokens: int = 4096,
) -> str | None:
    """
    Claude Opus 4.7 orqali chuqur audit / matematik tekshiruv.

    Avval gpt-5.4-pro Responses API ishlatardik — endi Opus 4.7
    benchmark va matematik vazifalarda undan kuchli, narx bir xil.

    Returns plain text content, or None on error.
    """
    if not claude_opus.ready:
        return None
    try:
        return await claude_opus.chat(system, user, max_tokens=max_tokens)
    except Exception as e:
        log.warning("opus_pro_audit: %s", e)
        return None


# Eski nom — chaqiruvchi kodlar yangilash kerak emas (alias)
gpt5_pro_responses = opus_pro_audit


async def second_opinion(
    question: str,
    primary_answer: str,
    *,
    context: str = "",
) -> dict | None:
    """
    Claude Opus 4.7 dan birinchi modelning javobini tekshirishni so'raydi.

    Avval GPT-5'dan so'rardik — endi Opus 4.7 (Anthropic'ning eng kuchli
    GA modeli, 2026-04-16 chiqdi). Asosiy router Sonnet 4.6 ishlatadi —
    Opus 4.7 esa "katta birodar" sifatida ikkinchi fikr beradi.

    Returns:
        {
            "agree": bool,
            "confidence": float,      # 0..1
            "reasoning": str,
            "correction": str | None,  # agar agree=False bo'lsa
        }
    """
    if not claude_opus.ready:
        return None

    system = (
        "Siz SavdoAI biznes tizimining mustaqil ikkinchi fikr auditchisisiz "
        "(independent reviewer). Sizning vazifangiz — birlamchi modelning "
        "javobini xolis tekshirish. Agar xato bo'lsa — aniq ayting va "
        "to'g'risini ko'rsating. Faqat JSON formatda javob bering."
    )
    user = (
        f"SAVOL:\n{question}\n\n"
        f"BIRLAMCHI JAVOB:\n{primary_answer}\n\n"
        + (f"QO'SHIMCHA KONTEKST:\n{context}\n\n" if context else "")
        + 'JSON sxema: {"agree": bool, "confidence": 0..1 float, '
          '"reasoning": "2-3 gapda sabab", "correction": "agar xato — to\'g\'risi"}'
    )
    try:
        raw = await claude_opus.chat(system, user, json_mode=True, max_tokens=2048)
        import json
        # Opus ba'zan JSON'ni ```json fence ichida qaytarishi mumkin — tozalaymiz
        s = raw.strip()
        if s.startswith("```"):
            s = s.split("```", 2)[1]
            if s.startswith("json"):
                s = s[4:]
            s = s.rsplit("```", 1)[0].strip()
        return json.loads(s)
    except Exception as e:
        log.warning("second_opinion (Opus 4.7): %s", e)
        return None


async def cheap_batch(
    system: str,
    user: str,
    *,
    temperature: float = 0.2,
) -> str | None:
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


async def generate_ui(prompt: str) -> str | None:
    """
    v0.dev Platform API — matn → React + Tailwind + shadcn/ui komponent.

    Bizning web stek Next.js + shadcn/ui + Tailwind + framer-motion
    bo'lgani uchun v0 qaytargan tsx kod 1:1 mos keladi — komponentni
    services/web/components/'ga joylashtirish kifoya.

    Returns:
        tsx code only (code block stripped), or None on error.
    """
    if not _v0_client.ready:
        return None

    system = (
        "You are v0 by Vercel. Generate a single React component using "
        "TypeScript, Tailwind CSS v4, shadcn/ui (import from @/components/ui/*), "
        "lucide-react icons, and framer-motion animations where appropriate. "
        "The target project already has these installed. Return ONLY the "
        "component inside a ```tsx code block. No prose, no imports for "
        "packages that aren't already in the project."
    )
    try:
        result = await _v0_client.generate(prompt, system=system)
        if not result:
            return None
        # The assistant reply is the last message with role='assistant'
        messages = result.get("messages") or []
        for m in reversed(messages):
            if m.get("role") == "assistant":
                return _extract_tsx(m.get("content") or "")
        return None
    except Exception as e:
        log.warning("v0 generate_ui: %s", e)
        return None


async def market_intel(query: str) -> str | None:
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
