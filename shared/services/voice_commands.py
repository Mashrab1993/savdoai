"""
╔══════════════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA v21.4 — O'ZBEK OVOZ BUYRUQLARI                     ║
║                                                                      ║
║  Operator ovoz/matn orqali bot ni TO'LIQ boshqaradi:               ║
║  ✅ "tasdiqla" → savdo tasdiqlash                                   ║
║  ✅ "bekor qil" → bekor qilish                                     ║
║  ✅ "chek chiqar" → mini printer chek                               ║
║  ✅ "tuzat" → draft tuzatish                                        ║
║  ✅ "qayta hisobla" → qayta hisob                                   ║
║  ✅ "bugungi hisobot" → kunlik hisobot                              ║
║  ✅ "kassa holati" → kassa                                           ║
║  ✅ "qarz qancha" → qarzlar                                         ║
║  ✅ "kam qolganlar" → kam qoldiq                                    ║
║  ✅ va boshqa 40+ O'zbek buyruq                                     ║
║                                                                      ║
║  Gemini 3.1 Flash-Lite → matn → shu modul intent aniqlaydi         ║
╚══════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import re
from typing import Optional


# ════════════════════════════════════════════════════════════════════
#  O'ZBEK BUYRUQ PATTERNS — regex bilan
# ════════════════════════════════════════════════════════════════════

# Har pattern: (regex, action, sub_action)
# action: nima qilish kerak
# sub_action: qo'shimcha ma'lumot

_PATTERNS: list[tuple[str, str, str]] = [
    # ═══ TASDIQLASH / BEKOR ═══
    (r"\b(tasdiqla|tasdiqlash|tasdiqliman|ha saqlash|saqlash|ha davom|davom et)\b", "confirm", ""),
    (r"\b(bekor|bekor qil|bekor qilish|yoq|ortga|orqaga|kerak emas)\b", "cancel", ""),
    (r"\b(tuzat|tuzatish|o'zgartir|o'zgartirish|tahrir|tahrirla)\b", "correct", ""),
    (r"\b(qayta hisobla|qayta hisob|qaytadan hisobla)\b", "recalculate", ""),

    # ═══ CHEK / PRINT ═══
    (r"\b(chek chiqar|chek qil|chekni chiqar|receipt|printer|print qil|chop et|chop qil)\b", "print", "receipt"),
    (r"\b(qayta chop|qayta print|reprint|yana chop)\b", "print", "reprint"),
    (r"\b(chek ko'rsat|preview|oldindan ko'r|oldindan ko'rsat)\b", "print", "preview"),
    (r"\b(pdf chiqar|pdf qil|pdf bersin|pdf)\b", "export", "pdf"),
    (r"\b(excel chiqar|excel qil|excel bersin|excel)\b", "export", "excel"),

    # ═══ HISOBOT ═══
    (r"\b(bugungi hisobot|kunlik hisobot|bugungi savdo|bugun nima bo'ldi)\b", "report", "daily"),
    (r"\b(haftalik hisobot|haftalik savdo|hafta hisobot|shu hafta)\b", "report", "weekly"),
    (r"\b(oylik hisobot|oylik savdo|oy hisobot|shu oy)\b", "report", "monthly"),
    (r"\b(foyda|foyda hisobot|foyda qancha|sof foyda|rentabellik)\b", "report", "profit"),
    (r"\b(top klientlar|eng yaxshi klientlar|eng ko'p sotib olgan)\b", "report", "top_clients"),
    (r"\b(ombor holati|ombor|omborxona|tovarlar holati)\b", "report", "stock"),
    (r"\b(kam qolgan|kam qoldiq|ogohlantirish|kam tovarlar)\b", "report", "low_stock"),

    # ═══ KASSA ═══
    (r"\b(kassa holati|kassa|kassada qancha|naqd qancha|pul qancha)\b", "kassa", "status"),
    (r"\b(kassaga.*kirim|naqd kirim|karta kirim|pul kirdi)\b", "kassa", "income"),
    (r"\b(kassadan.*chiqim|naqd chiqim|xarajat|karta chiqim|pul chiqdi)\b", "kassa", "expense"),

    # ═══ BALANS / BUXGALTERIYA ═══
    (r"\b(balans tekshir|balans|buxgalteriya|debit kredit|jurnal|reconciliation)\b", "balans", ""),

    # ═══ QARZ ═══
    (r"\b(qarzlar|qarz ro'yxati|kimda qarz|qarzdorlar|qarz qancha)\b", "debt", "list"),
    (r"\b(.*qarz to'la|.*to'lov qil|.*pul to'la)\b", "debt", "payment"),

    # ═══ KLIENT ═══
    (r"\b(klientlar|mijozlar|xaridorlar ro'yxati)\b", "client", "list"),
    (r"\b(klient.*qidir|mijoz.*qidir|.*topish)\b", "client", "search"),

    # ═══ TOVAR ═══
    (r"\b(tovarlar|mahsulotlar|tovar ro'yxati)\b", "product", "list"),
    (r"\b(.*qoldi[gq].*qancha|.*nechta qoldi|.*bormi)\b", "product", "stock_check"),

    # ═══ NAKLADNOY / FAKTURA ═══
    (r"\b(nakladnoy yoz|nakladnoy chiqar|nakladnoy qil)\b", "document", "nakladnoy"),
    (r"\b(faktura chiqar|faktura yoz|faktura qil|hisob faktura)\b", "document", "invoice"),

    # ═══ YORDAM ═══
    (r"\b(yordam|qanday ishlatish|help|nima qila olasan|imkoniyatlar)\b", "help", ""),
    (r"\b(yangiliklar|yangilik|nima o'zgardi|update)\b", "news", ""),

    # ═══ LEDGER / BUXGALTERIYA ═══
    (r"\b(balans tekshir|balans holati|debit credit|buxgalteriya holati|reconciliation)\b", "ledger", "balance"),
    (r"\b(jurnal ko'rsat|jurnal ochib|oxirgi jurnallar|ledger)\b", "ledger", "journal"),

    # ═══ START / MENYU ═══
    (r"\b(menyu|asosiy menyu|bosh sahifa|menu)\b", "menu", ""),
    (r"\b(salom|assalomu alaykum|vaalaykum|xayrli kun)\b", "greet", ""),
]


def detect_voice_command(text: str) -> Optional[dict]:
    """
    O'zbek ovoz/matn buyrug'ini aniqlash.
    
    Qaytaradi: {"action": "...", "sub": "...", "original": "..."} yoki None
    
    Faqat ANIQ buyruqlar uchun ishlaydi.
    Savdo/kirim/chiqim/qaytarish kabi murakkab buyruqlar AI ga ketadi.
    """
    if not text:
        return None
    
    t = text.lower().strip()
    
    # Juda qisqa buyruqlar (< 3 belgi) — skip
    if len(t) < 2:
        return None
    
    for pattern, action, sub in _PATTERNS:
        if re.search(pattern, t, re.IGNORECASE):
            return {
                "action": action,
                "sub": sub,
                "original": text,
            }
    
    return None


def is_quick_command(text: str) -> bool:
    """Bu tez buyruqmi (AI ga yuborish shart emas)?"""
    cmd = detect_voice_command(text)
    if not cmd:
        return False
    # Faqat report, kassa, help, menu, confirm/cancel, print — tez buyruqlar
    return cmd["action"] in (
        "confirm", "cancel", "correct", "recalculate",
        "print", "export",
        "report", "kassa", "debt", "client", "product",
        "document", "help", "news", "menu", "greet", "balans",
    )
