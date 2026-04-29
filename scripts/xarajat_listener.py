"""Real-time Telethon listener for RASXODLAR group.

Listens for:
- New expense messages (text + photos) → AI parses → inserts to DB
- Question messages → AI generates SQL-like answer from DB → replies

Runs continuously. Use as systemd service.
"""
import asyncio
import json
import logging
import os
import re
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

import asyncpg
from telethon import TelegramClient, events
from google import genai

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# Config
API_ID = 35573767
API_HASH = "***REDACTED-OLD-APIHASH***"
SESSION = "/root/savdoai/scripts/savdoai_user_session"
GROUP_ID = 4667855704
ADMIN_UID = 7888864785

DB_URL = "postgresql://postgres:***REDACTED-OLD-PASSWORD***@caboose.proxy.rlwy.net:34205/railway"
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
GEMINI_MODEL = os.environ.get("GEMINI_LISTENER_MODEL", "gemini-2.5-pro")

# AI prompts
EXPENSE_TEXT_PROMPT = """Bu xabar xarajat (rasxod) yozuvimi yoki savol/oddiy gap?

JSON qaytaring:
{
  "type": "expense" | "question" | "other",
  "amount": <son so'mda yoki null>,
  "category": "benzin"|"gaz"|"oylik"|"abed"|"transport"|"tamir"|"aloqa"|"qarz"|"mahsulot"|"boshqa",
  "description": "<10-50 belgi qisqa tavsif>",
  "person_mentioned": "<agar xabar boshqa shaxsga tegishli bo'lsa nomi yoki null>"
}

Qoidalar:
- "100k" → 100000, "1.5 mln" → 1500000, "20 ming" → 20000
- "Akbar 80k benzin oldi" → expense, amount=80000, category=benzin
- "salom", "rahmat" → other
- "bu oy qancha xarajat?", "Akbar qancha?", "benzin necha?" → question

Faqat JSON.

Xabar: """

EXPENSE_RECEIPT_PROMPT = """Bu rasm chek (kassa cheki, internet to'lovi)mi?

JSON qaytaring:
{
  "is_receipt": true/false,
  "total_amount": <son so'mda yoki null>,
  "merchant": "<do'kon nomi yoki null>",
  "category": "benzin"|"abed"|"gaz"|"transport"|"mahsulot"|"tamir"|"boshqa",
  "items_summary": "<chekdagi asosiy mahsulotlar 50 belgida>"
}

Faqat JSON."""

QUESTION_PROMPT = """User savol berdi xarajatlar haqida. PostgreSQL DB'da quyidagi schema bor:
- shogirdlar(id, telegram_uid, ism)
- xarajatlar(id, shogird_id, kategoriya_nomi, summa, izoh, sana)

Savolni o'qib, JSON qaytaring:
{
  "intent": "monthly_total" | "category_total" | "person_total" | "recent" | "other",
  "month": "YYYY-MM yoki null",
  "category": "benzin/gaz/.../null",
  "person_name": "ism yoki null",
  "days_ago": "30 yoki null",
  "explanation": "savolingni qanday tushundim qisqacha"
}

Bugungi sana: {today}

Savol: """


class XarajatListener:
    def __init__(self):
        self.tg_client = TelegramClient(SESSION, API_ID, API_HASH)
        self.gm = genai.Client(api_key=GEMINI_API_KEY)
        self.db_pool: asyncpg.Pool = None
        self.shogird_cache: dict[int, int] = {}  # telegram_uid -> shogird_id
        # slug -> {"id": int, "nomi": "🔥 Gaz"}
        # Avval int edi (faqat id), lekin kategoriya_nomi ham emoji+to'liq nom kerak edi.
        self.cat_cache: dict[str, dict] = {}

    async def setup(self):
        self.db_pool = await asyncpg.create_pool(DB_URL, min_size=1, max_size=3)
        # Load caches
        async with self.db_pool.acquire() as conn:
            for r in await conn.fetch("SELECT id, telegram_uid FROM shogirdlar WHERE admin_uid=$1", ADMIN_UID):
                self.shogird_cache[r["telegram_uid"]] = r["id"]
            for r in await conn.fetch("SELECT id, nomi FROM xarajat_kategoriyalar WHERE admin_uid=$1", ADMIN_UID):
                # Map slug from emoji-prefixed name
                slug = r["nomi"].split(" ", 1)[-1].lower()
                self.cat_cache[slug] = {"id": r["id"], "nomi": r["nomi"]}
        log.info(f"Cache: {len(self.shogird_cache)} shogird, {len(self.cat_cache)} kategoriya")

    async def ensure_shogird(self, telegram_uid: int, name: str) -> int:
        if telegram_uid in self.shogird_cache:
            return self.shogird_cache[telegram_uid]
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO shogirdlar (admin_uid, telegram_uid, ism, lavozim, kunlik_limit, oylik_limit)
                   VALUES ($1, $2, $3, 'haydovchi', 500000, 10000000)
                   ON CONFLICT (admin_uid, telegram_uid) DO UPDATE SET faol=TRUE
                   RETURNING id""",
                ADMIN_UID, telegram_uid, name,
            )
            self.shogird_cache[telegram_uid] = row["id"]
            return row["id"]

    def call_gemini(self, prompt, image_path=None):
        contents = [prompt]
        if image_path:
            uploaded = self.gm.files.upload(file=image_path)
            contents.append(uploaded)
        resp = self.gm.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config={"response_mime_type": "application/json", "max_output_tokens": 4000},
        )
        return json.loads(resp.text)

    async def handle_message(self, event):
        msg = event.message
        if not msg.sender_id:
            return

        sender = await msg.get_sender()
        sender_name = (sender.first_name if sender else "") + " " + (getattr(sender, "last_name", None) or "")
        sender_name = sender_name.strip() or f"User {msg.sender_id}"

        is_voice = bool(getattr(msg, "voice", None))
        log.info(f"NEW MSG from {sender_name}: text={msg.text!r}, photo={bool(msg.photo)}, voice={is_voice}")

        # Voice: transcribe + parse + save (ovoz fayli ham saqlanadi — dalil sifatida)
        if is_voice:
            try:
                voices_dir = "/root/savdoai/scripts/xarajat_data/voices"
                os.makedirs(voices_dir, exist_ok=True)
                voice_path = f"{voices_dir}/{msg.id}.oga"
                if not os.path.exists(voice_path):
                    await msg.download_media(file=voice_path)

                # Transkripsiya — Gemini'ga ovoz fayli yuboriladi
                uploaded = self.gm.files.upload(file=voice_path)
                tr_resp = self.gm.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=[
                        "Transcribe this voice message exactly as spoken (Uzbek/Russian). "
                        "Return only the transcribed text.",
                        uploaded,
                    ],
                )
                transcript = (tr_resp.text or "").strip()
                if not transcript:
                    log.warning("  voice: transkripsiya bo'sh")
                    return

                log.info(f"  voice transcript: {transcript[:80]!r}")

                # Endi transkripsiyani xarajat sifatida tahlil qilamiz
                result = self.call_gemini(EXPENSE_TEXT_PROMPT + transcript)
                if result.get("type") == "expense" and result.get("amount"):
                    desc_short = result.get("description", "") or transcript[:200]
                    await self._save_expense(
                        sender_id=msg.sender_id,
                        sender_name=sender_name,
                        amount=result["amount"],
                        category=result.get("category", "boshqa"),
                        description=f"[OVOZ] {desc_short[:200]} | TR: {transcript[:200]}",
                        sana=msg.date,
                        ovoz_file_id=voice_path,
                    )
                    log.info(f"  Saved voice expense: {result['amount']:,.0f} so'm ({result.get('category')}) — {voice_path}")
                else:
                    # Xarajat emas (savol/oddiy gap) — ovoz faylini o'chirmaymiz, AI nostandart
                    # tushunmagan bo'lishi mumkin. /tmp emas, doimiy katalogda turadi.
                    log.info(f"  voice: xarajat emas (type={result.get('type')}), fayl saqlandi: {voice_path}")
            except Exception as e:
                log.error(f"  voice fail: {e}", exc_info=True)
            return

        # Photo: receipt OCR
        if msg.photo:
            try:
                # Rasmni doimiy katalogga saqlaymiz — DB rasm yo'lini eslab qoladi.
                # /tmp emas, chunki /tmp restartda tozalanadi. xarajat_data/photos
                # allaqachon mavjud (eski importdan qolgan).
                photos_dir = "/root/savdoai/scripts/xarajat_data/photos"
                os.makedirs(photos_dir, exist_ok=True)
                photo_path = f"{photos_dir}/{msg.id}.jpg"
                if not os.path.exists(photo_path):
                    await msg.download_media(file=photo_path)
                result = self.call_gemini(EXPENSE_RECEIPT_PROMPT + (msg.text or ""),
                                          image_path=photo_path)
                # Rasmni o'chirmaymiz — DB'da yo'l saqlanadi
                if result.get("is_receipt") and result.get("total_amount"):
                    await self._save_expense(
                        sender_id=msg.sender_id,
                        sender_name=sender_name,
                        amount=result["total_amount"],
                        category=result.get("category", "boshqa"),
                        description=f"[CHEK] {result.get('merchant') or ''}: {result.get('items_summary', '')[:100]}",
                        sana=msg.date,
                        rasm_file_id=photo_path,
                    )
                    log.info(f"  Saved receipt: {result['total_amount']:,.0f} so'm ({result.get('category')}) — {photo_path}")
                else:
                    # Chek emasligi tasdiqlangan bo'lsa rasmni o'chirib yuborish (disk ortiqchaligi)
                    try:
                        os.unlink(photo_path)
                    except Exception:
                        pass
            except Exception as e:
                log.error(f"  receipt fail: {e}")
            return

        # Text: parse
        if not msg.text:
            return
        try:
            result = self.call_gemini(EXPENSE_TEXT_PROMPT + msg.text)
            if result.get("type") == "expense" and result.get("amount"):
                await self._save_expense(
                    sender_id=msg.sender_id,
                    sender_name=sender_name,
                    amount=result["amount"],
                    category=result.get("category", "boshqa"),
                    description=result.get("description", msg.text[:100]),
                    sana=msg.date,
                )
                log.info(f"  Saved text expense: {result['amount']:,.0f} so'm ({result.get('category')})")
            elif result.get("type") == "question":
                answer = await self.answer_question(msg.text)
                if answer:
                    await self.tg_client.send_message(event.chat_id, answer, reply_to=msg.id)
                    log.info(f"  Answered question")
        except Exception as e:
            log.error(f"  text fail: {e}")

    async def _save_expense(self, sender_id, sender_name, amount, category, description, sana,
                             rasm_file_id=None, ovoz_file_id=None):
        shogird_id = await self.ensure_shogird(sender_id, sender_name)
        cat = self.cat_cache.get(category) or self.cat_cache.get("boshqa") or {"id": None, "nomi": "📦 Boshqa"}
        kat_id = cat["id"]
        kat_nomi = cat["nomi"]
        async with self.db_pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO xarajatlar (admin_uid, shogird_id, kategoriya_id, kategoriya_nomi,
                                            summa, izoh, sana, rasm_file_id, ovoz_file_id,
                                            tasdiqlangan, tasdiq_vaqti)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW())""",
                ADMIN_UID, shogird_id, kat_id, kat_nomi,
                Decimal(str(amount)), description[:500], sana, rasm_file_id, ovoz_file_id,
            )

    async def answer_question(self, text: str) -> str:
        try:
            today = datetime.now().date().isoformat()
            intent = self.call_gemini(QUESTION_PROMPT.replace("{today}", today) + text)
        except Exception as e:
            log.error(f"  intent fail: {e}")
            return ""

        async with self.db_pool.acquire() as conn:
            if intent.get("intent") == "monthly_total":
                mo = intent.get("month") or datetime.now().strftime("%Y-%m")
                row = await conn.fetchrow(
                    """SELECT COUNT(*) AS cnt, COALESCE(SUM(summa), 0) AS total
                       FROM xarajatlar WHERE admin_uid=$1
                       AND TO_CHAR(sana, 'YYYY-MM') = $2""",
                    ADMIN_UID, mo,
                )
                return f"📊 {mo} oyi:\n• Yozuvlar: {row['cnt']}\n• Jami: {row['total']:,.0f} so'm"

            elif intent.get("intent") == "category_total":
                cat = intent.get("category") or "boshqa"
                row = await conn.fetchrow(
                    """SELECT COUNT(*) AS cnt, COALESCE(SUM(summa), 0) AS total
                       FROM xarajatlar WHERE admin_uid=$1
                       AND kategoriya_nomi ILIKE $2""",
                    ADMIN_UID, f"%{cat}%",
                )
                return f"📂 {cat}:\n• Yozuvlar: {row['cnt']}\n• Jami: {row['total']:,.0f} so'm"

            elif intent.get("intent") == "person_total":
                name = intent.get("person_name") or ""
                row = await conn.fetchrow(
                    """SELECT s.ism, COUNT(x.*) AS cnt, COALESCE(SUM(x.summa), 0) AS total
                       FROM shogirdlar s LEFT JOIN xarajatlar x ON x.shogird_id=s.id
                       WHERE s.admin_uid=$1 AND s.ism ILIKE $2
                       GROUP BY s.ism LIMIT 1""",
                    ADMIN_UID, f"%{name}%",
                )
                if row:
                    return f"👤 {row['ism']}:\n• Yozuvlar: {row['cnt']}\n• Jami: {row['total']:,.0f} so'm"
                return f"❌ {name} topilmadi"

            elif intent.get("intent") == "recent":
                days = intent.get("days_ago") or 30
                row = await conn.fetchrow(
                    """SELECT COUNT(*) AS cnt, COALESCE(SUM(summa), 0) AS total
                       FROM xarajatlar WHERE admin_uid=$1
                       AND sana > NOW() - INTERVAL '$2 days'""".replace("$2", str(int(days))),
                    ADMIN_UID,
                )
                return f"📅 So'nggi {days} kun:\n• Yozuvlar: {row['cnt']}\n• Jami: {row['total']:,.0f} so'm"

            else:
                # Generic stats
                row = await conn.fetchrow(
                    """SELECT COUNT(*) AS cnt, COALESCE(SUM(summa), 0) AS total
                       FROM xarajatlar WHERE admin_uid=$1""",
                    ADMIN_UID,
                )
                return f"📊 Jami DB'da:\n• Yozuvlar: {row['cnt']}\n• Jami: {row['total']:,.0f} so'm\n\n(Aniqroq savol bering: 'bu oy qancha?', 'Akbar qancha?', 'benzin 30 kun?')"

    async def run(self):
        await self.setup()
        await self.tg_client.start()
        chat = await self.tg_client.get_entity(GROUP_ID)
        log.info(f"Listening: {chat.title} (id={chat.id})")

        @self.tg_client.on(events.NewMessage(chats=chat))
        async def handler(event):
            await self.handle_message(event)

        await self.tg_client.run_until_disconnected()


if __name__ == "__main__":
    asyncio.run(XarajatListener().run())
