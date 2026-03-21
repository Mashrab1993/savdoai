"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  MASHRAB MOLIYA v21.3 TURBO — TRANSACTION PIPELINE                       ║
║                                                                           ║
║  VOICE-FIRST ENTERPRISE SAFETY:                                          ║
║  AI → DRAFT → CONFIRM → POST → AUDIT                                    ║
║                                                                           ║
║  🛡️ AI HECH QACHON to'g'ridan-to'g'ri DB ga YOZMAYDI                    ║
║  🛡️ Har bir tranzaksiya draft → tasdiqlash → post → audit               ║
║  🛡️ Past ishonch → operator tasdiqlashi MAJBURIY                         ║
║  🛡️ Barcha pul/ombor o'zgarishlar audit_log ga yoziladi                 ║
║  🛡️ Qaytarish/tuzatish — tarix HECH QACHON o'chirilmaydi               ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
import time
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
from typing import Any, Optional

log = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════
#  TRANSACTION STATUS LIFECYCLE
# ════════════════════════════════════════════════════════════════════

class TxStatus(str, Enum):
    DRAFT     = "draft"       # AI yaratdi, operator ko'rmadi
    PENDING   = "pending"     # Operator ko'rdi, tasdiqlash kutilmoqda
    CONFIRMED = "confirmed"   # Operator tasdiqladi
    POSTED    = "posted"      # DB ga yozildi (ombor, qarz, kassa yangilandi)
    REJECTED  = "rejected"    # Operator rad etdi
    CORRECTED = "corrected"   # Keyinchalik tuzatildi (yangi versiya yaratildi)
    VOIDED    = "voided"      # Bekor qilindi (audit iz qoladi)


class TxType(str, Enum):
    SOTUV       = "sotuv"
    KIRIM       = "kirim"
    QAYTARISH   = "qaytarish"
    QARZ_TOLASH = "qarz_tolash"
    KASSA       = "kassa"
    NAKLADNOY   = "nakladnoy"


# ════════════════════════════════════════════════════════════════════
#  CONFIDENCE GATE — AI ishonch darajasi tekshiruvi
# ════════════════════════════════════════════════════════════════════

# Ishonch chegaralari
CONFIDENCE_AUTO_CONFIRM   = 0.92  # Bu darajadan yuqori = avtomatik tasdiqlash MUMKIN
CONFIDENCE_NEEDS_CONFIRM  = 0.70  # Bu orasida = operator tasdiqlashi KERAK
CONFIDENCE_REJECT         = 0.40  # Bu darajadan past = rad etish, qayta urinish

@dataclass
class ConfidenceReport:
    """AI natijasining ishonch tahlili"""
    overall: float = 0.0
    klient_match: float = 0.0    # Klient topildimi (0=yo'q, 1=aniq topildi)
    tovar_match: float = 0.0     # Tovarlar topildimi
    summa_consistent: float = 0.0 # Summalar mos keladi
    warnings: list = field(default_factory=list)

    @property
    def needs_confirmation(self) -> bool:
        return self.overall < CONFIDENCE_AUTO_CONFIRM

    @property
    def should_reject(self) -> bool:
        return self.overall < CONFIDENCE_REJECT

    @property
    def auto_confirmable(self) -> bool:
        """Faqat BARCHA shart bajarilsa avtomatik tasdiqlash"""
        return (
            self.overall >= CONFIDENCE_AUTO_CONFIRM
            and self.klient_match >= 0.9
            and self.tovar_match >= 0.9
            and self.summa_consistent >= 0.95
            and len(self.warnings) == 0
        )


def evaluate_confidence(ai_result: dict, db_context: dict = None) -> ConfidenceReport:
    """
    AI natijasini baholash — ishonch darajasini hisoblash.
    
    Tekshiradi:
    1. Klient topildimi (DB da bormi)
    2. Tovarlar topildimi (DB da bormi) 
    3. Summalar mos keladi (miqdor × narx = jami)
    4. Noodatiy narx (o'rtachadan juda farq qilsa)
    """
    report = ConfidenceReport()
    
    klient = ai_result.get("klient", "")
    tovarlar = ai_result.get("tovarlar", [])
    jami = Decimal(str(ai_result.get("jami_summa", 0)))
    
    # 1. Klient ishonch
    if klient and len(klient) >= 2:
        if db_context and db_context.get("klient_topildi"):
            report.klient_match = 1.0
        else:
            report.klient_match = 0.7  # Klient bor, lekin DB da tekshirilmagan
    else:
        report.klient_match = 0.3
        report.warnings.append("Klient ismi aniqlanmadi yoki juda qisqa")
    
    # 2. Tovar ishonch
    if tovarlar:
        tovar_scores = []
        for t in tovarlar:
            nomi = t.get("nomi", "")
            miqdor = Decimal(str(t.get("miqdor", 0)))
            narx = Decimal(str(t.get("narx", 0)))
            
            score = 0.5  # default
            if nomi and len(nomi) >= 2:
                score += 0.2
            if miqdor > 0:
                score += 0.15
            if narx > 0:
                score += 0.15
            
            # Noodatiy narx tekshiruvi
            if narx > 100_000_000:  # 100M dan yuqori = shubhali
                report.warnings.append(f"Noodatiy yuqori narx: {nomi} = {narx}")
                score -= 0.3
            
            tovar_scores.append(min(score, 1.0))
        
        report.tovar_match = sum(tovar_scores) / len(tovar_scores) if tovar_scores else 0
    else:
        report.tovar_match = 0.0
        report.warnings.append("Tovarlar ro'yxati bo'sh")
    
    # 3. Summa mosligi
    if tovarlar and jami > 0:
        hisoblangan = sum(
            Decimal(str(t.get("jami", 0))) or 
            Decimal(str(t.get("miqdor", 0))) * Decimal(str(t.get("narx", 0)))
            for t in tovarlar
        )
        if hisoblangan > 0:
            farq = abs(jami - hisoblangan) / max(hisoblangan, Decimal("1"))
            report.summa_consistent = max(0, 1.0 - float(farq))
            if float(farq) > 0.05:
                report.warnings.append(
                    f"Summa farqi: AI={jami}, hisob={hisoblangan} (farq={float(farq)*100:.1f}%)"
                )
        else:
            report.summa_consistent = 0.5
    else:
        report.summa_consistent = 0.5
    
    # Overall
    report.overall = (
        report.klient_match * 0.25 +
        report.tovar_match * 0.35 +
        report.summa_consistent * 0.30 +
        (0.1 if not report.warnings else 0.0)
    )
    
    return report


# ════════════════════════════════════════════════════════════════════
#  AUDIT TRAIL — O'zgarmas iz
# ════════════════════════════════════════════════════════════════════

async def audit_yoz(conn, user_id: int, amal: str, 
                     entity_type: str, entity_id: int = 0,
                     old_data: dict = None, new_data: dict = None,
                     izoh: str = "") -> None:
    """
    Audit log yozish — HECH QACHON o'chirilmaydi.
    
    Barcha pul, ombor, qarz o'zgarishlar shu yerga yoziladi.
    """
    try:
        await conn.execute("""
            INSERT INTO audit_log 
                (user_id, amal, jadval, yozuv_id, eski, yangi, manba)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """,
            user_id, amal, entity_type, entity_id,
            json.dumps(old_data, ensure_ascii=False, default=str) if old_data else None,
            json.dumps(new_data, ensure_ascii=False, default=str) if new_data else None,
            izoh or "bot",
        )
    except Exception as e:
        # Audit HECH QACHON asosiy operatsiyani to'xtatmasligi kerak
        log.error("Audit log yozishda xato: %s", e)


# ════════════════════════════════════════════════════════════════════
#  DETERMINISTIC BUSINESS RULES — AI EMAS, PYTHON HISOBLAYDI
# ════════════════════════════════════════════════════════════════════

def hisob_tekshir_va_tuzat(ai_data: dict) -> tuple[dict, list[str]]:
    """
    AI natijasini DETERMINISTIC tekshirish va tuzatish.
    
    AI HECH QACHON hisob-kitob qilmaydi — PYTHON qiladi.
    
    Qaytaradi: (tuzatilgan_data, warnings_list)
    """
    warnings = []
    data = dict(ai_data)
    tovarlar = data.get("tovarlar", [])
    
    jami_hisob = Decimal("0")
    for t in tovarlar:
        miqdor = Decimal(str(t.get("miqdor", 0)))
        narx = Decimal(str(t.get("narx", 0)))
        birlik = t.get("birlik", "dona")
        
        # Gramm → kg konversiya (narx kg uchun berilgan)
        if birlik == "gramm" and narx > 0:
            jami = narx / Decimal("1000") * miqdor
        else:
            jami = miqdor * narx
        
        # AI ning jami sini tekshirish
        ai_jami = Decimal(str(t.get("jami", 0)))
        if ai_jami > 0 and abs(ai_jami - jami) > Decimal("1"):
            warnings.append(
                f"⚠️ {t.get('nomi','?')}: AI jami={ai_jami}, Python hisob={jami}"
            )
        
        t["jami"] = str(jami)  # PYTHON hisob ustunlik qiladi
        jami_hisob += jami
    
    # Jami summa tekshirish
    ai_jami_summa = Decimal(str(data.get("jami_summa", 0)))
    if ai_jami_summa > 0 and abs(ai_jami_summa - jami_hisob) > Decimal("1"):
        warnings.append(
            f"⚠️ Jami summa: AI={ai_jami_summa}, Python hisob={jami_hisob}"
        )
    data["jami_summa"] = str(jami_hisob)
    
    # Qarz/tolangan tekshirish
    qarz = Decimal(str(data.get("qarz", 0)))
    tolangan = Decimal(str(data.get("tolangan", 0)))
    
    if qarz > 0 and tolangan <= 0:
        tolangan = jami_hisob - qarz
        if tolangan < 0:
            warnings.append("⚠️ Qarz jami summadan katta — to'langan = 0")
            tolangan = Decimal("0")
        data["tolangan"] = str(tolangan)
    elif qarz <= 0 and tolangan <= 0:
        data["tolangan"] = str(jami_hisob)
    
    return data, warnings


# ════════════════════════════════════════════════════════════════════
#  TRANSACTION PIPELINE — VOICE → DRAFT → CONFIRM → POST → AUDIT
# ════════════════════════════════════════════════════════════════════

@dataclass
class TransactionDraft:
    """Savdo draft — AI yaratdi, operator tasdiqlashi kerak"""
    tx_type: TxType
    status: TxStatus = TxStatus.DRAFT
    ai_raw: dict = field(default_factory=dict)       # AI ning xom natijasi
    corrected: dict = field(default_factory=dict)     # Python tuzatgandan keyin
    confidence: Optional[ConfidenceReport] = None     # Ishonch baholash
    warnings: list = field(default_factory=list)      # Ogohlantirishlar
    user_id: int = 0
    created_at: float = field(default_factory=time.time)
    
    def to_preview(self) -> str:
        """Operator uchun oldindan ko'rinish"""
        d = self.corrected or self.ai_raw
        amal = d.get("amal", self.tx_type.value)
        klient = d.get("klient", "")
        tovarlar = d.get("tovarlar", [])
        jami = d.get("jami_summa", 0)
        qarz = d.get("qarz", 0)
        
        lines = []
        
        # Confidence badge
        if self.confidence:
            if self.confidence.auto_confirmable:
                lines.append("🟢 Yuqori ishonch")
            elif self.confidence.needs_confirmation:
                lines.append("🟡 Tasdiqlash kerak")
            else:
                lines.append("🔴 Past ishonch — diqqat!")
        
        # Amal
        AMAL_EMOJI = {
            "kirim": "📥 KIRIM", "chiqim": "📤 SOTUV", "sotuv": "📤 SOTUV",
            "qaytarish": "↩️ QAYTARISH", "qarz_tolash": "💰 QARZ TO'LASH",
            "nakladnoy": "📋 NAKLADNOY",
        }
        lines.append(f"*{AMAL_EMOJI.get(amal, amal)}*")
        
        if klient:
            lines.append(f"👤 {klient}")
        
        if tovarlar:
            lines.append("")
            for i, t in enumerate(tovarlar[:10], 1):
                nomi = t.get("nomi", "?")
                miq = t.get("miqdor", 0)
                bir = t.get("birlik", "dona")
                narx = t.get("narx", 0)
                j = t.get("jami", 0)
                lines.append(f"{i}. {nomi} × {miq} {bir}")
                if narx:
                    try: lines.append(f"   💵 {float(str(narx)):,.0f} → {float(str(j)):,.0f}")
                    except Exception: lines.append(f"   💵 {narx} → {j}")
            if len(tovarlar) > 10:
                lines.append(f"   ...va yana {len(tovarlar)-10} ta")
        
        if jami:
            lines.append(f"\n💰 *Jami: {Decimal(str(jami)):,} so'm*")
        if qarz and Decimal(str(qarz)) > 0:
            try: lines.append(f"⚠️ *Qarz: {float(str(qarz)):,.0f} so'm*")
            except Exception: lines.append(f"⚠️ *Qarz: {qarz} so'm*")
        
        # Warnings
        if self.warnings:
            lines.append("\n⚠️ *Ogohlantirishlar:*")
            for w in self.warnings[:5]:
                lines.append(f"  {w}")
        
        return "\n".join(lines)


def create_draft(ai_result: dict, tx_type: TxType, 
                  user_id: int, db_context: dict = None) -> TransactionDraft:
    """
    AI natijasidan DRAFT yaratish.
    
    1. AI natijasini deterministic tekshirish
    2. Ishonch baholash
    3. Draft qaytarish (HALI DB GA YOZILMAGAN!)
    """
    # 1. Python hisob-kitob (AI emas!)
    corrected, warnings = hisob_tekshir_va_tuzat(ai_result)
    
    # 2. Ishonch baholash
    confidence = evaluate_confidence(ai_result, db_context)
    
    # 3. Draft yaratish
    draft = TransactionDraft(
        tx_type=tx_type,
        status=TxStatus.PENDING,
        ai_raw=ai_result,
        corrected=corrected,
        confidence=confidence,
        warnings=warnings + confidence.warnings,
        user_id=user_id,
    )
    
    return draft
