"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA v21.3 TURBO — DUAL-BRAIN AI ROUTER                       ║
║  Mixture of Experts (MoE) Architecture                                   ║
║                                                                           ║
║  🧠 BRAIN 1 — GEMINI 3.1 Flash-Lite (KO'Z VA QULOQ):                    ║
║     ✅ Voice/Audio → Matn (O'zbek STT)                                   ║
║     ✅ OCR (rasm, nakladnoy, chek o'qish)                                ║
║     ✅ Real-time O'zbek NLP (intent recognition)                         ║
║     ✅ 100% O'zbek tili tushunishi                                        ║
║                                                                           ║
║  🧠 BRAIN 2 — Claude Sonnet (MANTIQ DVIGATEL):                          ║
║     ✅ Murakkab biznes mantiq va tahlil                                   ║
║     ✅ Chuqur DB tahlili va hisobot yaratish                             ║
║     ✅ Excel/PDF arxitektura mantiq                                       ║
║     ✅ Tizim orkestratsiyasi va qaror tasdiqlash                         ║
║                                                                           ║
║  ⚡ ROUTING: Har so'rov avtomatik eng kuchli modelga yo'naltiriladi      ║
║  🛡️ FALLBACK: Timeout/xato → ikkinchi model fallback sifatida            ║
║  📊 METRICS: Har chaqiruv loglanadi (model, latency, token)              ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations

import asyncio
import base64
import io
import json
import logging
import os
import re
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional, Union

log = logging.getLogger(__name__)

__version__ = "21.3"


# ════════════════════════════════════════════════════════════════════
#  TASK TAXONOMY — Qaysi model qaysi vazifani bajaradi
# ════════════════════════════════════════════════════════════════════

class AIModel(str, Enum):
    GEMINI = "gemini"
    CLAUDE = "claude"


class TaskType(str, Enum):
    # ── GEMINI vazifalari (Ko'z va Quloq) ──
    VOICE_STT       = "voice_stt"         # Ovoz → matn
    IMAGE_OCR       = "image_ocr"         # Rasm → matn
    INVOICE_OCR     = "invoice_ocr"       # Nakladnoy/chek o'qish
    INTENT_PARSE    = "intent_parse"      # O'zbek matn → intent (kirim/chiqim/...)
    NLP_NORMALIZE   = "nlp_normalize"     # Matn tozalash, sheva normalizatsiya

    # ── CLAUDE vazifalari (Mantiq Dvigatel) ──
    BUSINESS_LOGIC  = "business_logic"    # Murakkab biznes tahlil
    REPORT_GEN      = "report_gen"        # Hisobot yaratish mantiq
    DATA_ANALYSIS   = "data_analysis"     # DB dan chuqur tahlil
    DECISION_VALID  = "decision_valid"    # Qaror tasdiqlash
    EXPORT_ARCH     = "export_arch"       # Excel/PDF tuzilma


# Routing jadvali — qaysi task qaysi modelga
_ROUTING_TABLE: dict[TaskType, AIModel] = {
    # Gemini — tezkor, O'zbek tili, multimodal
    TaskType.VOICE_STT:      AIModel.GEMINI,
    TaskType.IMAGE_OCR:      AIModel.GEMINI,
    TaskType.INVOICE_OCR:    AIModel.GEMINI,
    TaskType.INTENT_PARSE:   AIModel.GEMINI,
    TaskType.NLP_NORMALIZE:  AIModel.GEMINI,

    # Claude — mantiq, tahlil, murakkab qarorlar
    TaskType.BUSINESS_LOGIC: AIModel.CLAUDE,
    TaskType.REPORT_GEN:     AIModel.CLAUDE,
    TaskType.DATA_ANALYSIS:  AIModel.CLAUDE,
    TaskType.DECISION_VALID: AIModel.CLAUDE,
    TaskType.EXPORT_ARCH:    AIModel.CLAUDE,
}


# ════════════════════════════════════════════════════════════════════
#  REQUEST / RESPONSE MODELS
# ════════════════════════════════════════════════════════════════════

@dataclass
class AIRequest:
    """AI ga yuboriladigan so'rov"""
    task: TaskType
    content: str = ""                    # Matn content
    audio_bytes: Optional[bytes] = None  # Ovoz fayl (STT uchun)
    image_bytes: Optional[bytes] = None  # Rasm fayl (OCR uchun)
    mime_type: str = "audio/ogg"         # Audio/image format
    context: dict = field(default_factory=dict)  # Qo'shimcha kontekst
    user_id: int = 0                     # Foydalanuvchi ID
    timeout: float = 30.0               # Timeout (sekund)


@dataclass
class AIResponse:
    """AI dan qaytgan javob"""
    success: bool
    model: AIModel
    task: TaskType
    result: Any = None                   # Natija (dict, str, etc.)
    error: Optional[str] = None          # Xato xabari
    latency_ms: float = 0.0             # Javob vaqti (ms)
    tokens_used: int = 0                 # Token sarfi (taxminiy)
    fallback_used: bool = False          # Fallback model ishlatildimi


# ════════════════════════════════════════════════════════════════════
#  AI CLIENTS — Gemini va Claude async clientlar
# ════════════════════════════════════════════════════════════════════

class _GeminiClient:
    """Google Gemini 3.1 Flash-Lite — Ko'z va Quloq"""

    def __init__(self):
        self._client = None
        self._model = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")

    def init(self, api_key: str, model: str = "") -> None:
        if model:
            self._model = model
        try:
            from google import genai
            self._client = genai.Client(api_key=api_key)
            log.info("✅ Gemini BRAIN-1 tayyor (%s)", self._model)
        except Exception as e:
            log.error("❌ Gemini init xato: %s", e)

    @property
    def ready(self) -> bool:
        return self._client is not None

    def _call_sync(self, content_parts: list) -> str:
        """Sinxron Gemini chaqiruv (thread pool da ishlatiladi)"""
        from google.genai import types
        response = self._client.models.generate_content(
            model=self._model,
            contents=content_parts,
        )
        return (response.text or "").strip()

    async def call(self, content_parts: list, timeout: float = 30) -> str:
        """Async Gemini chaqiruv"""
        loop = asyncio.get_event_loop()
        return await asyncio.wait_for(
            loop.run_in_executor(None, lambda: self._call_sync(content_parts)),
            timeout=timeout,
        )


class _ClaudeClient:
    """Anthropic Claude Sonnet — Mantiq Dvigatel"""

    def __init__(self):
        self._client = None
        self._model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

    def init(self, api_key: str, model: str = "") -> None:
        if model:
            self._model = model
        try:
            import anthropic
            self._client = anthropic.Anthropic(api_key=api_key)
            log.info("✅ Claude BRAIN-2 tayyor (%s)", self._model)
        except Exception as e:
            log.error("❌ Claude init xato: %s", e)

    @property
    def ready(self) -> bool:
        return self._client is not None

    def _call_sync(self, system: str, user_msg: str,
                    max_tokens: int = 4096) -> str:
        """Sinxron Claude chaqiruv"""
        response = self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            temperature=0.0,
            system=system,
            messages=[{"role": "user", "content": user_msg}],
        )
        return response.content[0].text.strip()

    async def call(self, system: str, user_msg: str,
                    max_tokens: int = 4096, timeout: float = 30) -> str:
        """Async Claude chaqiruv"""
        loop = asyncio.get_event_loop()
        return await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: self._call_sync(system, user_msg, max_tokens)
            ),
            timeout=timeout,
        )

    def _call_sync_blocks(
        self,
        system: str,
        content: list[dict[str, Any]],
        max_tokens: int = 8192,
        temperature: float = 0.2,
    ) -> str:
        """Claude — multimodal (document / image + matn)"""
        response = self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=[{"role": "user", "content": content}],
        )
        return response.content[0].text.strip()

    async def call_blocks(
        self,
        system: str,
        content: list[dict[str, Any]],
        max_tokens: int = 8192,
        temperature: float = 0.2,
        timeout: float = 120.0,
    ) -> str:
        loop = asyncio.get_event_loop()
        return await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: self._call_sync_blocks(
                    system, content, max_tokens, temperature
                ),
            ),
            timeout=timeout,
        )


# Global client instances
_gemini = _GeminiClient()
_claude = _ClaudeClient()


# ════════════════════════════════════════════════════════════════════
#  PROMPT TEMPLATES
# ════════════════════════════════════════════════════════════════════

_GEMINI_STT_PROMPT = (
    "Bu O'zbek tilida savdo haqida gapirilgan ovoz xabari. "
    "Faqat aytilganlarni so'zma-so'z aniq yoz. "
    "Raqamlar: 'o'ttiz besh' → 35, 'qirq besh ming' → 45000. "
    "Qo'shimcha izoh yozma. Faqat transkripsiya."
)

_GEMINI_OCR_PROMPT = (
    "Bu O'zbek biznesga tegishli rasm (nakladnoy, chek, kvitansiya). "
    "Rasmdan barcha ma'lumotlarni aniq o'qib, JSON formatda qaytar:\n"
    '{"tur":"nakladnoy|chek|boshqa","klient":"...","tovarlar":[{"nomi":"...","miqdor":0,"narx":0,"jami":0}],'
    '"jami_summa":0,"sana":"2026-01-01","ishonch":0.0}\n'
    "Faqat JSON qaytar."
)

_GEMINI_INTENT_PROMPT = (
    "Sen O'zbek tilida savdo AI yordamchisisisan. "
    "Quyidagi matndan amal turini va ma'lumotlarni ajrat.\n\n"
    "Amallar: kirim, chiqim, qaytarish, qarz_tolash, nakladnoy, hisobot, boshqa\n\n"
    "FAQAT JSON qaytar:\n"
    '{"amal":"...","klient":"...","tovarlar":[{"nomi":"...","miqdor":0,"birlik":"dona","narx":0,"jami":0}],'
    '"jami_summa":0,"qarz":0,"tolangan":0,"izoh":"..."}\n\n'
    "Matn: "
)

_CLAUDE_SYSTEM = (
    "Sen Mashrab Moliya — O'zbekiston savdo tizimining AI mantiq dvigatelisan.\n"
    "Vazifang: murakkab biznes tahlil, hisobot yaratish, va qaror tasdiqlash.\n"
    "QOIDALAR:\n"
    "1. Faqat JSON qaytar (boshqa hech narsa yozma)\n"
    "2. Barcha hisob-kitob Decimal aniqlikda bo'lsin\n"
    "3. temperature=0.0 — gallyusinatsiya nol\n"
    "4. O'zbek va Rus tilini tushun"
)


# ════════════════════════════════════════════════════════════════════
#  COGNITIVE ROUTER — ASOSIY MoE ROUTING CLASS
# ════════════════════════════════════════════════════════════════════

class CognitiveRouter:
    """
    Mixture of Experts (MoE) AI Router.

    Har so'rovni avtomatik eng to'g'ri modelga yo'naltiradi:
    - Gemini: ovoz, rasm, O'zbek NLP (tezkor)
    - Claude: mantiq, tahlil, hisobot (chuqur)

    Fallback: bir model ishlamasa, ikkinchisi to'ldiradi.

    Ishlatish:
        router = CognitiveRouter()
        router.init(gemini_key="...", claude_key="...")
        response = await router.process(AIRequest(
            task=TaskType.VOICE_STT,
            audio_bytes=audio_data,
        ))
    """

    def __init__(self):
        self._metrics: dict[str, list] = {}  # model → [latency_ms, ...]
        self._call_count = 0
        self._error_count = 0

    def init(self, gemini_key: str = "", claude_key: str = "",
             gemini_model: str = "", claude_model: str = "") -> None:
        """Ikki miyani ishga tushirish"""
        if gemini_key:
            _gemini.init(gemini_key, gemini_model)
        if claude_key:
            _claude.init(claude_key, claude_model)
        log.info("🧠 CognitiveRouter tayyor | Gemini=%s Claude=%s",
                 _gemini.ready, _claude.ready)

    async def process(self, req: AIRequest) -> AIResponse:
        """
        Asosiy routing funksiyasi.
        1. Task → Model mapping
        2. Model chaqiruv (async)
        3. Fallback (agar xato)
        4. Natijani parse qilish
        5. Metrics yozish
        """
        self._call_count += 1
        target_model = _ROUTING_TABLE.get(req.task, AIModel.CLAUDE)
        start = time.monotonic()

        try:
            result = await self._dispatch(req, target_model)
            latency = round((time.monotonic() - start) * 1000, 1)

            # Parse JSON if applicable
            parsed = self._try_parse_json(result)

            self._record_metric(target_model, latency)
            log.info("✅ AI [%s] %s → %dms (%d chars)",
                     target_model.value, req.task.value, latency, len(result))

            return AIResponse(
                success=True,
                model=target_model,
                task=req.task,
                result=parsed if parsed else result,
                latency_ms=latency,
                tokens_used=len(result) // 4,  # Taxminiy
            )

        except (asyncio.TimeoutError, Exception) as primary_err:
            log.warning("⚠️ AI [%s] %s xato: %s — fallback urinish",
                        target_model.value, req.task.value, primary_err)

            # ── FALLBACK: ikkinchi model ──
            fallback_model = (
                AIModel.CLAUDE if target_model == AIModel.GEMINI
                else AIModel.GEMINI
            )
            try:
                result = await self._dispatch(req, fallback_model)
                latency = round((time.monotonic() - start) * 1000, 1)
                parsed = self._try_parse_json(result)
                self._record_metric(fallback_model, latency)
                log.info("✅ AI FALLBACK [%s] %s → %dms",
                         fallback_model.value, req.task.value, latency)

                return AIResponse(
                    success=True,
                    model=fallback_model,
                    task=req.task,
                    result=parsed if parsed else result,
                    latency_ms=latency,
                    fallback_used=True,
                )
            except Exception as fallback_err:
                self._error_count += 1
                latency = round((time.monotonic() - start) * 1000, 1)
                log.error("❌ AI ikki model ham ishlamadi: primary=%s fallback=%s",
                          primary_err, fallback_err)
                return AIResponse(
                    success=False,
                    model=target_model,
                    task=req.task,
                    error="AI vaqtincha ishlamayapti. Keyinroq urinib ko'ring.",
                    latency_ms=latency,
                )

    # ── CONVENIENCE METHODS ──────────────────────────────────────

    async def voice_to_text(self, audio_bytes: bytes,
                             mime: str = "audio/ogg") -> Optional[str]:
        """Ovoz → Matn (Gemini STT)"""
        resp = await self.process(AIRequest(
            task=TaskType.VOICE_STT,
            audio_bytes=audio_bytes,
            mime_type=mime,
        ))
        return resp.result if resp.success else None

    async def image_to_data(self, image_bytes: bytes,
                             mime: str = "image/jpeg") -> Optional[dict]:
        """Rasm → Structured data (Gemini OCR)"""
        resp = await self.process(AIRequest(
            task=TaskType.IMAGE_OCR,
            image_bytes=image_bytes,
            mime_type=mime,
        ))
        return resp.result if resp.success and isinstance(resp.result, dict) else None

    async def parse_intent(self, text: str) -> Optional[dict]:
        """O'zbek matn → biznes intent (Gemini NLP)"""
        resp = await self.process(AIRequest(
            task=TaskType.INTENT_PARSE,
            content=text,
        ))
        return resp.result if resp.success and isinstance(resp.result, dict) else None

    async def analyze_business(self, query: str,
                                context: dict = None) -> Optional[dict]:
        """Murakkab biznes tahlil (Claude)"""
        resp = await self.process(AIRequest(
            task=TaskType.BUSINESS_LOGIC,
            content=query,
            context=context or {},
        ))
        return resp.result if resp.success else None

    async def generate_report(self, data: dict) -> Optional[dict]:
        """Hisobot tuzilmasi yaratish (Claude)"""
        resp = await self.process(AIRequest(
            task=TaskType.REPORT_GEN,
            content=json.dumps(data, ensure_ascii=False, default=str),
        ))
        return resp.result if resp.success and isinstance(resp.result, dict) else None

    # ── INTERNAL DISPATCH ────────────────────────────────────────

    async def _dispatch(self, req: AIRequest, model: AIModel) -> str:
        """Model ga so'rov yuborish"""
        if model == AIModel.GEMINI:
            return await self._gemini_dispatch(req)
        else:
            return await self._claude_dispatch(req)

    async def _gemini_dispatch(self, req: AIRequest) -> str:
        """Gemini ga so'rov — multimodal (ovoz, rasm, matn)"""
        if not _gemini.ready:
            raise RuntimeError("Gemini ishga tushirilmagan")

        from google.genai import types
        parts = []

        if req.task == TaskType.VOICE_STT and req.audio_bytes:
            parts.append(types.Part.from_bytes(
                data=req.audio_bytes, mime_type=req.mime_type
            ))
            parts.append(_GEMINI_STT_PROMPT)

        elif req.task in (TaskType.IMAGE_OCR, TaskType.INVOICE_OCR) and req.image_bytes:
            parts.append(types.Part.from_bytes(
                data=req.image_bytes, mime_type=req.mime_type
            ))
            parts.append(_GEMINI_OCR_PROMPT)

        elif req.task == TaskType.INTENT_PARSE:
            parts.append(_GEMINI_INTENT_PROMPT + req.content)

        elif req.task == TaskType.NLP_NORMALIZE:
            parts.append(
                "Quyidagi O'zbek matnini to'g'ri grammatika bilan qayta yoz. "
                "Faqat tozalangan matnni qaytar:\n" + req.content
            )
        else:
            # Fallback: matnni oddiy yuborish
            parts.append(req.content or "Salom")

        return await _gemini.call(parts, timeout=req.timeout)

    async def _claude_dispatch(self, req: AIRequest) -> str:
        """Claude ga so'rov — mantiq va tahlil"""
        if not _claude.ready:
            raise RuntimeError("Claude ishga tushirilmagan")

        system = _CLAUDE_SYSTEM

        if req.task == TaskType.BUSINESS_LOGIC:
            user_msg = (
                f"Biznes tahlil kerak:\n{req.content}\n\n"
                f"Kontekst: {json.dumps(req.context, ensure_ascii=False, default=str)}\n\n"
                "FAQAT JSON qaytar."
            )
        elif req.task == TaskType.REPORT_GEN:
            user_msg = (
                f"Quyidagi ma'lumotlardan hisobot tuzilmasini yarat:\n{req.content}\n\n"
                "JSON formatda qaytar: {\"sarlavha\":\"...\",\"bo'limlar\":[...],\"xulosa\":\"...\"}"
            )
        elif req.task == TaskType.DATA_ANALYSIS:
            user_msg = f"DB dan olingan ma'lumotlarni tahlil qil:\n{req.content}"
        elif req.task == TaskType.DECISION_VALID:
            user_msg = (
                f"Quyidagi qarorni tekshir va tasdiqlash/rad etish sababini ko'rsat:\n"
                f"{req.content}\n\nJSON: {{\"tasdiqlangan\":true/false,\"sabab\":\"...\"}}"
            )
        elif req.task == TaskType.EXPORT_ARCH:
            user_msg = (
                f"Excel/PDF hisobot tuzilmasini yarat:\n{req.content}\n\n"
                "JSON: {\"ustunlar\":[...],\"qatorlar\":[...],\"jami\":{...},\"format_notes\":\"...\"}"
            )
        elif req.task == TaskType.INTENT_PARSE:
            # Claude fallback for intent parsing
            user_msg = (
                "O'zbek tilidagi savdo xabardan ma'lumot ajrat:\n"
                f"\"{req.content}\"\n\n"
                "JSON: {\"amal\":\"kirim|chiqim|qaytarish|qarz_tolash|nakladnoy|hisobot|boshqa\","
                "\"klient\":\"...\",\"tovarlar\":[{\"nomi\":\"...\",\"miqdor\":0,\"narx\":0,\"jami\":0}],"
                "\"jami_summa\":0,\"qarz\":0,\"tolangan\":0}"
            )
        else:
            user_msg = req.content or "Tahlil kerak"

        max_tokens = 4096 if req.task in (
            TaskType.REPORT_GEN, TaskType.DATA_ANALYSIS, TaskType.EXPORT_ARCH
        ) else 2048

        return await _claude.call(system, user_msg, max_tokens, req.timeout)

    # ── UTILITIES ────────────────────────────────────────────────

    @staticmethod
    def _try_parse_json(text: str) -> Optional[dict]:
        """JSON ajratish (markdown fence bilan ham ishlaydi)"""
        if not text:
            return None
        t = text.strip()
        # Remove markdown fences
        if "```json" in t:
            t = t.split("```json")[1].split("```")[0].strip()
        elif "```" in t:
            t = t.split("```")[1].split("```")[0].strip()
        try:
            return json.loads(t)
        except (json.JSONDecodeError, IndexError):
            return None

    def _record_metric(self, model: AIModel, latency_ms: float) -> None:
        """Metrik yozish"""
        key = model.value
        if key not in self._metrics:
            self._metrics[key] = []
        self._metrics[key].append(latency_ms)
        # Oxirgi 1000 ta saqlash
        if len(self._metrics[key]) > 1000:
            self._metrics[key] = self._metrics[key][-500:]

    @property
    def stats(self) -> dict:
        """Router statistikasi"""
        result = {
            "total_calls": self._call_count,
            "total_errors": self._error_count,
            "error_rate": (
                round(self._error_count / max(self._call_count, 1) * 100, 1)
            ),
        }
        for model_name, latencies in self._metrics.items():
            if latencies:
                result[f"{model_name}_avg_ms"] = round(
                    sum(latencies) / len(latencies), 1
                )
                result[f"{model_name}_p95_ms"] = round(
                    sorted(latencies)[int(len(latencies) * 0.95)], 1
                )
                result[f"{model_name}_calls"] = len(latencies)
        return result


# ════════════════════════════════════════════════════════════════════
#  GLOBAL SINGLETON
# ════════════════════════════════════════════════════════════════════

_router: Optional[CognitiveRouter] = None


def get_router() -> CognitiveRouter:
    """Global router instance olish"""
    global _router
    if _router is None:
        _router = CognitiveRouter()
    return _router


def router_init(gemini_key: str = "", claude_key: str = "",
                gemini_model: str = "", claude_model: str = "") -> CognitiveRouter:
    """Router ishga tushirish"""
    r = get_router()
    r.init(gemini_key, claude_key, gemini_model, claude_model)
    return r


# ════════════════════════════════════════════════════════════════════
#  UNIVERSAL CHAT & FAYL TAHLILI (Telegram message_handler)
# ════════════════════════════════════════════════════════════════════

UNIVERSAL_CHAT_SYSTEM = (
    "Siz Mashrab Moliya botisiz. O'zbek tilida javob bering. "
    "Biznes, savdo, moliya va har qanday mavzuda yordam bering."
)

_FILE_ANALYSIS_PROMPT = (
    "Bu faylni to'liq tahlil qiling, asosiy raqamlar, trendlar va "
    "muhim ma'lumotlarni o'zbek tilida ayting"
)


def _excel_fallback_text(data: bytes) -> str:
    try:
        from shared.services.excel_reader import excel_toliq_oqi

        h = excel_toliq_oqi(data)
        if h.get("xato"):
            return ""
        return (h.get("umumiy_matn") or "")[:120000]
    except Exception:
        return ""


async def claude_universal_chat(user_text: str) -> str:
    """Claude Sonnet — bepul matn suhbat (system prompt: UNIVERSAL_CHAT_SYSTEM)."""
    if not _claude.ready:
        raise RuntimeError("Claude ishga tushirilmagan")
    t = (user_text or "").strip()
    if not t:
        raise ValueError("Matn bo'sh")
    return await _claude.call_blocks(
        UNIVERSAL_CHAT_SYSTEM,
        [{"type": "text", "text": t}],
        max_tokens=4096,
        temperature=0.3,
        timeout=90.0,
    )


async def claude_analyze_file_bytes(
    data: bytes,
    mime_type: str,
    filename: str = "fayl",
) -> str:
    """
    PDF / rasm — base64 document yoki image bloklari.
    Excel — avval document (base64); xato bo'lsa Excel dan matn fallback.
    """
    if not _claude.ready:
        raise RuntimeError("Claude ishga tushirilmagan")
    if not data:
        raise ValueError("Fayl bo'sh")

    mime = (mime_type or "application/octet-stream").lower().split(";")[0].strip()
    b64 = base64.standard_b64encode(data).decode("ascii")
    prompt = _FILE_ANALYSIS_PROMPT
    system = UNIVERSAL_CHAT_SYSTEM

    if mime == "application/pdf":
        content: list[dict[str, Any]] = [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": b64,
                },
            },
            {"type": "text", "text": prompt},
        ]
        return await _claude.call_blocks(
            system, content, max_tokens=8192, temperature=0.2, timeout=120.0
        )

    if mime.startswith("image/"):
        content = [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": mime,
                    "data": b64,
                },
            },
            {"type": "text", "text": prompt},
        ]
        return await _claude.call_blocks(
            system, content, max_tokens=8192, temperature=0.2, timeout=120.0
        )

    fn_low = (filename or "").lower()
    is_xlsx = fn_low.endswith(".xlsx") or mime == (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    is_xls = fn_low.endswith(".xls") and not fn_low.endswith(".xlsx")
    is_sheet = is_xlsx or is_xls or mime in (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    )

    if is_sheet:
        doc_mime = (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            if is_xlsx
            else "application/vnd.ms-excel"
        )
        try:
            content = [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": doc_mime,
                        "data": b64,
                    },
                },
                {"type": "text", "text": prompt},
            ]
            return await _claude.call_blocks(
                system, content, max_tokens=8192, temperature=0.2, timeout=120.0
            )
        except Exception as e:
            log.warning("Claude Excel document xato, matn fallback: %s", e)
            txt = _excel_fallback_text(data)
            if not txt.strip():
                raise RuntimeError(
                    "Excel faylni Claude yoki lokal o'quvchi bilan ishlatib bo'lmadi"
                ) from e
            user_msg = (
                f"Fayl nomi: {filename}\n\n"
                f"Quyidagi jadval mazmuni:\n\n{txt}\n\n{prompt}"
            )
            return await _claude.call_blocks(
                system,
                [{"type": "text", "text": user_msg}],
                max_tokens=8192,
                temperature=0.2,
                timeout=120.0,
            )

    raise ValueError(f"Qo'llab-quvvatlanmaydigan MIME: {mime}")
