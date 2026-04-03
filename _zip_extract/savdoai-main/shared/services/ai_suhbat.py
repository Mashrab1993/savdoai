"""
╔══════════════════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA — AI SUHBATDOSH v2.0                                     ║
║                                                                          ║
║  Bot INSON kabi gaplashadi:                                              ║
║  ✅ Har qanday savolga javob                                            ║
║  ✅ Biznes maslahat beradi                                               ║
║  ✅ Klient/tovar tahlil qiladi                                          ║
║  ✅ Real DB ma'lumotlar bilan                                            ║
║  ✅ O'zbek tilida, samimiy, foydali                                     ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging, os, json
from datetime import datetime
import pytz

log = logging.getLogger(__name__)
TZ = pytz.timezone("Asia/Tashkent")

# ═══ SINGLETON CLIENT — har safar yangi yaratmaslik ═══
_suhbat_client = None

def _get_suhbat_client():
    global _suhbat_client
    if _suhbat_client is None:
        import anthropic
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            return None
        _suhbat_client = anthropic.AsyncAnthropic(api_key=api_key)
    return _suhbat_client

_TIZIM_PROMPT = """Sen MASHRAB MOLIYA savdo botining AI yordamchisisan.
Sening isming Mashrab Moliya. Sen O'zbekistondagi ulgurji/chakana savdo sohasida mutaxassissan.

QOIDALAR:
1. FAQAT O'ZBEK TILIDA gapir — samimiy, do'stona, professional
2. Qisqa va aniq javob ber — 2-5 jumla yetarli
3. Agar DB ma'lumoti berilsa — RAQAMLAR bilan javob ber
4. Biznes maslahat ber — real tajriba asosida
5. Klient haqida so'ralsa — xavf darajasi, tavsiya ber
6. Tovar haqida so'ralsa — narx, trend, tavsiya ber
7. Umumiy savol bo'lsa — foydali javob ber
8. Emoji ishlat lekin ortiqcha emas
9. "Tushunmadim" DEMA — har doim foydali javob ber
10. Do'konchi ism bilan murojaat qil (agar bilsang)

SAVDO BILIMLAR:
- Nasiya (qarz) — 30 kundan oshsa xavfli
- Markup 20-35% — normal
- Qaytarish 5% dan ko'p — muammo
- Kam qoldiq — buyurtma qilish kerak
- VIP klient — har doim yaxshi xizmat
- Yangi klient — kichik summa bilan boshlash

Sen do'konchining YORDAMCHISI va MASLAHATCHISISSAN."""


async def ai_suhbat(matn: str, uid: int, ism: str = "", db_kontekst: str = "") -> str:
    """Claude Sonnet bilan INSON kabi suhbat."""
    client = _get_suhbat_client()
    if not client:
        return _oddiy_javob(matn, ism)
    
    try:
        
        # Vaqtga qarab kontekst
        soat = datetime.now(TZ).hour
        vaqt = "ertalab" if 5 <= soat < 11 else "kunduzi" if 11 <= soat < 17 else "kechqurun" if 17 <= soat < 22 else "kechasi"
        
        if db_kontekst:
            biznes_blok = f"BIZNES MALUMOTLAR:{chr(10)}{db_kontekst}"
        else:
            biznes_blok = "DB malumoti hozir yo'q."
        ism_yoki = ism or "noma'lum"
        user_msg = f"""Hozir {vaqt} ({soat}:00).
Do'konchi ismi: {ism_yoki}

{biznes_blok}

DO'KONCHI XABARI: {matn}

Qisqa, samimiy, foydali javob ber (2-5 jumla):"""
        
        response = await client.messages.create(
            model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
            max_tokens=500,
            system=_TIZIM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
        )
        
        javob = response.content[0].text.strip()
        if javob:
            return javob
            
    except Exception as e:
        log.warning("AI suhbat: %s", e)
    
    return _oddiy_javob(matn, ism)


async def db_kontekst_olish(uid: int) -> str:
    """Foydalanuvchi DB dan qisqa biznes kontekst."""
    try:
        import services.bot.db as db
        async with db._P().acquire() as conn:
            # Bugungi sotuv
            bugun = await conn.fetchrow("""
                SELECT COUNT(*) as soni, COALESCE(SUM(jami), 0) as jami
                FROM sotuv_sessiyalar WHERE user_id=$1 AND sana::date = CURRENT_DATE
            """, uid)
            
            # Jami qarz
            qarz = await conn.fetchval("""
                SELECT COALESCE(SUM(qolgan), 0) FROM qarzlar
                WHERE user_id=$1 AND yopildi=FALSE
            """, uid)
            
            # Top 5 klient (sotuv bo'yicha)
            top_kl = await conn.fetch("""
                SELECT k.ism, COALESCE(k.jami_sotib, 0) as jami
                FROM klientlar k WHERE k.user_id=$1
                ORDER BY k.jami_sotib DESC NULLS LAST LIMIT 5
            """, uid)
            
            # Top 5 tovar (qoldiq bo'yicha)
            top_tv = await conn.fetch("""
                SELECT nomi, qoldiq, olish_narxi
                FROM tovarlar WHERE user_id=$1 AND qoldiq > 0
                ORDER BY qoldiq DESC LIMIT 5
            """, uid)
            
            # Kam qoldiq
            kam = await conn.fetch("""
                SELECT nomi, qoldiq, min_qoldiq
                FROM tovarlar WHERE user_id=$1 
                AND qoldiq <= COALESCE(min_qoldiq, 5) AND qoldiq >= 0
                LIMIT 5
            """, uid)
            
            parts = []
            if bugun:
                parts.append(f"Bugungi sotuv: {int(bugun['soni'])} ta, {int(bugun['jami']):,} so'm")
            if qarz:
                parts.append(f"Jami ochiq qarz: {int(qarz):,} so'm")
            if top_kl:
                kl_list = ", ".join(f"{r['ism']}({int(r['jami']):,})" for r in top_kl)
                parts.append(f"Top klientlar: {kl_list}")
            if top_tv:
                tv_list = ", ".join(f"{r['nomi']}({int(r['qoldiq'] or 0)}ta)" for r in top_tv)
                parts.append(f"Ombordagi tovarlar: {tv_list}")
            if kam:
                kam_list = ", ".join(f"{r['nomi']}({int(r['qoldiq'] or 0)}ta!)" for r in kam)
                parts.append(f"⚠️ KAM QOLDIQ: {kam_list}")
            
            return "\n".join(parts) if parts else ""
    except Exception as e:
        log.debug("DB kontekst: %s", e)
        return ""


def savdo_sorovmi(matn: str) -> bool:
    """Bu savdo buyrug'imi yoki suhbatmi?"""
    m = matn.lower().strip()
    
    # Savdo buyruq belgilari — raqam + tovar nomi
    import re
    # "5 ta Ariel 45000" — raqam + so'z + raqam = savdo
    if re.search(r'\d+\s+(?:ta|dona|shtuk|karobka)?\s*[A-Za-z]', m):
        # Raqam + tovar = savdo buyruq
        raqamlar = len(re.findall(r'\d{3,}', m))  # 3+ raqamli sonlar (narx)
        if raqamlar >= 1:
            return True
    
    # Kirim/chiqim/qaytarish/tolash — bu savdo
    savdo_sozlar = ("kirim", "kirdi", "keldi", "sotuv", "sotdim", "qaytarish", 
                     "qaytardi", "toladi", "to'ladi", "tolash", "nasiya", "qarzga")
    if any(s in m for s in savdo_sozlar):
        return True
    
    return False


def _oddiy_javob(matn: str, ism: str = "") -> str:
    """AI ishlamasa — oddiy javob."""
    import random
    ism_s = f" {ism}" if ism else ""
    
    javoblar = [
        f"Ha{ism_s}, tinglayapman! Nima yordam beray?",
        f"Salom{ism_s}! Savol bering — javob beraman.",
        f"Ha{ism_s}, aytinglar! 😊",
    ]
    return random.choice(javoblar)
