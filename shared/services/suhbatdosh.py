"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI — SUHBATDOSH (Conversational AI Layer) v1.0                     ║
║                                                                          ║
║  Bot xuddi ODAM bilan gaplashgandek javob beradi:                       ║
║  ✅ Iliq, samimiy o'zbek tili                                           ║
║  ✅ Kontekstga qarab turli javoblar (bir xil emas)                      ║
║  ✅ Vaqtga qarab salomlashish (ertalab/kechqurun)                       ║
║  ✅ Do'konchi ismini ishlatish                                           ║
║  ✅ Qisqa, aniq, foydali javoblar                                       ║
║  ✅ Xato bo'lganda yumshoq, tushuntiruvchi javob                        ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import random
from datetime import datetime
import pytz

TZ = pytz.timezone("Asia/Tashkent")


def _soat():
    return datetime.now(TZ).hour


def salom(ism: str = "") -> str:
    """Vaqtga qarab salomlashish."""
    h = _soat()
    ism_s = f", {ism}" if ism else ""
    if 5 <= h < 11:
        return random.choice([
            f"Xayrli tong{ism_s}! ☀️",
            f"Assalomu alaykum{ism_s}! Bugungi savdo qanday? 📊",
            f"Salom{ism_s}! Ertalabdan ishga tayyormisiz? 💪",
        ])
    elif 11 <= h < 17:
        return random.choice([
            f"Salom{ism_s}! 👋",
            f"Assalomu alaykum{ism_s}! Nima yordam bera olay?",
            f"Ha{ism_s}, tinglayapman! 🎧",
        ])
    elif 17 <= h < 22:
        return random.choice([
            f"Xayrli kech{ism_s}! 🌙",
            f"Salom{ism_s}! Bugun qanday o'tdi?",
            f"Assalomu alaykum{ism_s}! Kechki hisobot kerakmi? 📊",
        ])
    else:
        return random.choice([
            f"Salom{ism_s}! Kech bo'ldi-ku, hali ishlayapsizmi? 😊",
            f"Ha{ism_s}, tinglayapman!",
        ])


# ═══════════════════════════════════════════════════════════════
#  SOTUV JAVOBLARI
# ═══════════════════════════════════════════════════════════════

def sotuv_qabul(klient: str, tovar_soni: int, jami: float) -> str:
    """Sotuv qabul qilinganida — iliq javob."""
    return random.choice([
        f"✅ Yozdim! {klient}ga {tovar_soni} xil tovar, jami {_pul(jami)}.",
        f"✅ Tayyor! {klient} — {tovar_soni} ta tovar. Hammasi yozildi.",
        f"✅ {klient}ga {_pul(jami)} lik sotuv yozildi. Nakladnoy kerakmi?",
    ])


def sotuv_saqlandi(klient: str, jami: float, qarz: float = 0) -> str:
    """Sotuv saqlanganda."""
    if qarz > 0:
        return random.choice([
            f"✅ Saqlandi! {klient}ning yangi qarzi {_pul(qarz)}. Jami {_pul(jami)}.",
            f"✅ Yozib qo'ydim. {klient} — {_pul(jami)}, qarz {_pul(qarz)}.",
        ])
    return random.choice([
        f"✅ Saqlandi! {klient} to'liq to'ladi — {_pul(jami)}. 👍",
        f"✅ {klient} — {_pul(jami)}, hammasi to'langan. Raxmat! 🤝",
    ])


def kirim_qabul(tovar_soni: int, jami: float, manba: str = "") -> str:
    """Kirim qabul qilinganida."""
    manba_s = f" ({manba} dan)" if manba else ""
    return random.choice([
        f"📥 {tovar_soni} xil tovar kirdi{manba_s}. Jami {_pul(jami)}. Ombor yangilandi!",
        f"📥 Yozdim! {tovar_soni} ta tovar kirim{manba_s}. Qoldiq oshdi. ✅",
    ])


# ═══════════════════════════════════════════════════════════════
#  HISOBOT JAVOBLARI
# ═══════════════════════════════════════════════════════════════

def hisobot_kirish(davr: str, sotuv_jami: float, foyda: float) -> str:
    """Hisobot boshlanishida — qisqa xulosa."""
    dn = {"kunlik": "Bugun", "haftalik": "Bu hafta", "oylik": "Bu oy"}.get(davr, "")
    if foyda > 0:
        return f"📊 {dn} yaxshi o'tdi! Sotuv {_pul(sotuv_jami)}, foyda {_pul(foyda)}. Batafsil:"
    elif foyda < 0:
        return f"📊 {dn} biroz og'ir bo'ldi. Sotuv {_pul(sotuv_jami)}, zarar {_pul(abs(foyda))}. Ko'raylik:"
    elif sotuv_jami == 0:
        return f"📊 {dn} hali sotuv yo'q. Ishni boshlaymizmi? 💪"
    return f"📊 {dn} sotuv {_pul(sotuv_jami)}. Mana batafsil:"


def hisobot_tavsiya(d: dict) -> str:
    """Hisobot oxirida — aqlli tavsiya."""
    tavsiyalar = []
    
    if d.get("qarz_nisbati", 0) > 50:
        tavsiyalar.append("⚠️ Qarz ko'payib ketyapti — to'lov undiruvga e'tibor bering.")
    
    if d.get("sotuv_ozgarish") and d["sotuv_ozgarish"] < -20:
        tavsiyalar.append("📉 Sotuv tushyapti — narx yoki assortimentni ko'rib chiqing.")
    elif d.get("sotuv_ozgarish") and d["sotuv_ozgarish"] > 30:
        tavsiyalar.append("📈 Zo'r natija! Shu tempni ushlab turing! 🔥")

    if d.get("top5_tovar") and len(d["top5_tovar"]) > 0:
        top = d["top5_tovar"][0]["nomi"]
        tavsiyalar.append(f"🏆 {top} eng yaxshi tovaringiz — doim omborda bo'lsin!")

    if not tavsiyalar:
        return ""
    
    return "\n\n💡 " + " ".join(tavsiyalar)


# ═══════════════════════════════════════════════════════════════
#  XATO JAVOBLARI — yumshoq, tushuntiruvchi
# ═══════════════════════════════════════════════════════════════

def tushunilmadi() -> str:
    """Ovoz tushunilmaganda."""
    return random.choice([
        "🤔 Kechirasiz, tushunolmadim. Yana bir bor aytib ko'ring — telefonni og'izga yaqinroq tutsa yaxshi bo'ladi.",
        "🤔 Aniq eshitmadim. Iltimos, qayta yuboring — sekinroq va aniqroq gapirsangiz tushunaman.",
        "🤔 Tushunolmadim. Masalan: \"Salimovga 5 Ariel 45 mingdan\" deb ayting.",
    ])


def ai_ishlamayapti() -> str:
    """AI vaqtincha ishlamayotganda."""
    return random.choice([
        "⏳ Hozir biroz band, 10 sekund kuting — qayta urinaman.",
        "⏳ Tizim yuklanmoqda, ozgina sabr qiling.",
    ])


def klient_topilmadi(ism: str) -> str:
    """Klient topilmaganda."""
    return f"🤔 '{ism}' ismli klientni topolmadim. Ismni to'liqroq aytib ko'ring yoki yangi klient yarating."


def tovar_topilmadi(nomi: str) -> str:
    """Tovar topilmaganda."""
    return f"📦 '{nomi}' tovarini topolmadim. Narxini ham aytsangiz, o'zim qo'shib qo'yaman."


# ═══════════════════════════════════════════════════════════════
#  QARZ JAVOBLARI
# ═══════════════════════════════════════════════════════════════

def qarz_bor(klient: str, jami: float) -> str:
    if jami > 1_000_000:
        return f"⚠️ {klient}da {_pul(jami)} qarz bor — katta summa! To'lovni so'rang."
    elif jami > 0:
        return f"💳 {klient}da {_pul(jami)} qarz bor."
    return f"✅ {klient}da qarz yo'q — hammasi to'langan! 👍"


def qarz_tolandi(klient: str, summa: float) -> str:
    return random.choice([
        f"✅ {klient} {_pul(summa)} to'ladi. Raxmat! 🤝",
        f"✅ {_pul(summa)} qabul qilindi. {klient}ning qarzi kamaydi.",
    ])


# ═══════════════════════════════════════════════════════════════
#  UMUMIY JAVOBLAR
# ═══════════════════════════════════════════════════════════════

def raxmat() -> str:
    return random.choice([
        "Marhamat! Yana yordam kerak bo'lsa, aytavering. 😊",
        "Xizmat ko'rsatganimdan xursandman! 👍",
        "Marhamat! Omad! 🤝",
    ])


def hech_narsa_yoq() -> str:
    return random.choice([
        "Hali hech narsa yo'q. Birinchi ovoz yuborib boshlang! 🎤",
        "Bo'sh — hali sotuv kirmagan. Ovoz yoki matn yuborib boshlang.",
    ])


def kutib_turing() -> str:
    return random.choice([
        "⏳ Biroz kuting, ishlamoqda...",
        "⏳ Tahlil qilmoqda...",
        "⏳ Yozmoqda...",
    ])


# ═══════════════════════════════════════════════════════════════
#  KUNLIK SUHBAT — vaqtga qarab turli javoblar
# ═══════════════════════════════════════════════════════════════

def kechki_xayrlashish() -> str:
    """Kunlik yakuniy oxirida."""
    return random.choice([
        "Bugungi ish tugadi. Dam oling, ertaga davom etamiz! 🌙",
        "Yaxshi kun bo'ldi! Ertaga yanada yaxshiroq bo'ladi. 💪",
        "Hisobot tayyor. Oilangiz bilan yaxshi dam oling! 😊",
    ])


def dushanba_motivatsiya() -> str:
    """Dushanba kuni — yangi hafta."""
    return random.choice([
        "Yangi hafta — yangi imkoniyatlar! Boshlaylikmi? 🚀",
        "Dushanba! Bu hafta o'tganidan yaxshiroq bo'ladi. 💪",
    ])


# ═══════════════════════════════════════════════════════════════
#  OVOZLI SO'ROVLARNI ANIQLASH — bot bilan suhbat
# ═══════════════════════════════════════════════════════════════

SUHBAT_SOZLAR = {
    "salom": ["salom", "assalomu alaykum", "здравствуй", "привет", "hey", "hi"],
    "raxmat": ["raxmat", "rahmat", "спасибо", "tashakkur", "sag bo'l"],
    "yordam": ["yordam", "help", "qanday", "nima qila olasan", "nimalar bilasan"],
    "kim_san": ["kim san", "sen kim", "ты кто", "nima ish qilasan"],
}

def suhbat_turini_aniqla(matn: str) -> str | None:
    """Foydalanuvchi suhbat qilmoqchi — bot javob bersin."""
    m = matn.lower().strip()
    for tur, sozlar in SUHBAT_SOZLAR.items():
        for s in sozlar:
            if s in m:
                return tur
    return None


def suhbat_javob(tur: str, ism: str = "") -> str:
    """Suhbat turiga qarab javob."""
    if tur == "salom":
        return salom(ism)
    elif tur == "raxmat":
        return raxmat()
    elif tur == "yordam":
        return (
            "Men sizning savdo yordamchingizman! 🤝 Mana nima qila olaman:\n\n"
            "🎤 Ovoz yuborib sotuv yozing\n"
            "📸 Nakladnoy rasmini yuboring\n"
            "💬 \"Bugungi sotuv qancha?\" — hisobot\n"
            "💬 \"Salimovning qarzi?\" — qarz tarixi\n"
            "💬 \"Arielni qanchadan sotay?\" — narx tavsiya\n"
            "💬 \"ABC tahlil\" — tovar reytingi\n"
            "💬 \"Klient reyting\" — A/B/C reyting\n"
            "💬 \"Salimov odatiy\" — shablon buyurtma\n\n"
            "Ovoz yuborsangiz yetarli — qolganini o'zim qilaman! 😊"
        )
    elif tur == "kim_san":
        return (
            "Men SavdoAI — sizning 24/7 ishlaydigan shaxsiy buxgalteringizman! 🤖\n\n"
            "Ovoz yuborsangiz — yozaman\n"
            "Rasm yuborsangiz — o'qiyman\n"
            "Savol bersangiz — javob beraman\n\n"
            "Pul hisoblashda XATO QILMAYMAN! 💯"
        )
    return ""


def _pul(v) -> str:
    try:
        from decimal import Decimal
        return f"{Decimal(str(v or 0)):,.0f}"
    except:
        return "0"
