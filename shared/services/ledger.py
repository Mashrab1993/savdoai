"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — DOUBLE-ENTRY LEDGER (Ikki tomonlama hisob)    ║
║  SAP/Bank darajasidagi buxgalteriya tizimi                            ║
║                                                                        ║
║  HAR BIR OPERATSIYA = DEBIT + CREDIT (teng summa)                     ║
║                                                                        ║
║  Hisoblar:                                                             ║
║   AKTIV:   kassa_naqd, kassa_karta, kassa_otkazma, ombor, debitorlar  ║
║   PASSIV:  kreditorlar, daromad, xarajat                               ║
║                                                                        ║
║  Qoida: SUM(debit) = SUM(credit) DOIM. Aks holda — tizim rad etadi.  ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum

log = logging.getLogger(__name__)


class HisobTuri(str, Enum):
    """SAP-style hisob turlari"""
    KASSA_NAQD    = "kassa_naqd"       # Naqd pul
    KASSA_KARTA   = "kassa_karta"      # Bank kartasi
    KASSA_OTKAZMA = "kassa_otkazma"    # Bank o'tkazma
    OMBOR         = "ombor"            # Tovar ombori (qiymat)
    DEBITORLAR    = "debitorlar"       # Bizga qarzdorlar (klientlar)
    KREDITORLAR   = "kreditorlar"      # Biz qarzdormiz (yetkazuvchilar)
    DAROMAD       = "daromad"          # Sotuv daromadi
    XARAJAT       = "xarajat"         # Xarajatlar
    TANNARX       = "tannarx"         # Sotilgan tovar tannarxi
    SOLIQ         = "soliq"           # Soliq hisobi
    FOYDA         = "foyda"           # Taqsimlanmagan foyda


class JurnalTuri(str, Enum):
    """Jurnal yozuv turlari"""
    SOTUV           = "sotuv"
    SOTUV_NAQD      = "sotuv_naqd"
    SOTUV_QARZ      = "sotuv_qarz"
    KIRIM           = "kirim"
    QAYTARISH       = "qaytarish"
    QARZ_TOLASH     = "qarz_tolash"
    KASSA_KIRIM     = "kassa_kirim"
    KASSA_CHIQIM    = "kassa_chiqim"
    TUZATISH        = "tuzatish"
    BOSHQA          = "boshqa"


@dataclass
class JurnalQator:
    """Bitta jurnal qatori — debit YOKI credit"""
    hisob: HisobTuri
    debit: Decimal = Decimal("0")
    credit: Decimal = Decimal("0")
    tavsif: str = ""

    def __post_init__(self):
        if self.debit < 0 or self.credit < 0:
            raise ValueError("Debit/Credit manfiy bo'lmaydi")
        if self.debit > 0 and self.credit > 0:
            raise ValueError("Bir qatorda debit VA credit bo'lmaydi")


@dataclass
class JurnalYozuv:
    """Bitta jurnal yozuvi — to'liq operatsiya"""
    id: str = ""
    tur: JurnalTuri = JurnalTuri.BOSHQA
    user_id: int = 0
    sana: str = ""
    tavsif: str = ""
    qatorlar: list[JurnalQator] = field(default_factory=list)
    manba_id: int = 0         # Sotuv/kirim/qaytarish sessiya ID
    manba_jadval: str = ""    # sotuv_sessiyalar, kirimlar, ...
    idempotency_key: str = "" # Takroriy operatsiya himoyasi

    def __post_init__(self):
        if not self.id:
            self.id = f"JE-{uuid.uuid4().hex[:12]}"
        if not self.sana:
            self.sana = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    @property
    def jami_debit(self) -> Decimal:
        return sum(q.debit for q in self.qatorlar)

    @property
    def jami_credit(self) -> Decimal:
        return sum(q.credit for q in self.qatorlar)

    @property
    def balanslangan(self) -> bool:
        """Debit = Credit tekshirish — BANK QOIDASI"""
        return self.jami_debit == self.jami_credit

    def validate(self) -> tuple[bool, str]:
        """To'liq validatsiya"""
        if not self.qatorlar:
            return False, "Jurnal yozuvi bo'sh"
        if not self.balanslangan:
            return False, f"Balans xato: debit={self.jami_debit} != credit={self.jami_credit}"
        if self.jami_debit == 0:
            return False, "Nol summa operatsiya"
        return True, ""

    def to_dict(self) -> dict:
        return {
            "id": self.id, "tur": self.tur.value, "user_id": self.user_id,
            "sana": self.sana, "tavsif": self.tavsif,
            "jami_debit": str(self.jami_debit), "jami_credit": str(self.jami_credit),
            "balanslangan": self.balanslangan,
            "manba_id": self.manba_id, "manba_jadval": self.manba_jadval,
            "qatorlar": [
                {"hisob": q.hisob.value, "debit": str(q.debit),
                 "credit": str(q.credit), "tavsif": q.tavsif}
                for q in self.qatorlar
            ],
        }


# ════════════════════════════════════════════════════════════════════
#  JURNAL YARATUVCHI FUNKSIYALAR — har operatsiya uchun
# ════════════════════════════════════════════════════════════════════

def sotuv_jurnali(user_id: int, klient: str, jami: Decimal,
                   naqd: Decimal = Decimal("0"), qarz: Decimal = Decimal("0"),
                   tannarx: Decimal = Decimal("0"),
                   sess_id: int = 0, usul: str = "naqd") -> JurnalYozuv:
    """
    SOTUV operatsiyasi uchun jurnal yozuvi.

    Naqd sotuv:
      DEBIT  kassa_naqd    (pul kirdi)
      CREDIT daromad        (daromad oshdi)

    Qarz sotuv:
      DEBIT  debitorlar     (klient bizga qarzdor)
      CREDIT daromad        (daromad oshdi)

    Aralash:
      DEBIT  kassa_naqd     (naqd qismi)
      DEBIT  debitorlar     (qarz qismi)
      CREDIT daromad        (jami sotuv)

    Tannarx:
      DEBIT  tannarx        (xarajat — sotilgan tovar qiymati)
      CREDIT ombor          (ombor kamaydi)
    """
    je = JurnalYozuv(tur=JurnalTuri.SOTUV, user_id=user_id,
                      tavsif=f"Sotuv: {klient}, jami={jami}",
                      manba_id=sess_id, manba_jadval="sotuv_sessiyalar")

    # Usul bo'yicha kassa hisobi
    kassa_hisob = {"naqd": HisobTuri.KASSA_NAQD, "karta": HisobTuri.KASSA_KARTA,
                    "otkazma": HisobTuri.KASSA_OTKAZMA}.get(usul, HisobTuri.KASSA_NAQD)

    if naqd > 0:
        je.qatorlar.append(JurnalQator(hisob=kassa_hisob, debit=naqd,
                                        tavsif=f"Naqd to'lov: {klient}"))
    if qarz > 0:
        je.qatorlar.append(JurnalQator(hisob=HisobTuri.DEBITORLAR, debit=qarz,
                                        tavsif=f"Qarz: {klient}"))

    je.qatorlar.append(JurnalQator(hisob=HisobTuri.DAROMAD, credit=jami,
                                    tavsif=f"Sotuv daromadi: {klient}"))

    # Tannarx (agar ma'lum)
    if tannarx > 0:
        je.qatorlar.append(JurnalQator(hisob=HisobTuri.TANNARX, debit=tannarx,
                                        tavsif="Sotilgan tovar tannarxi"))
        je.qatorlar.append(JurnalQator(hisob=HisobTuri.OMBOR, credit=tannarx,
                                        tavsif="Ombor kamayishi"))

    return je


def kirim_jurnali(user_id: int, yetkazuvchi: str, jami: Decimal,
                   tovarlar_soni: int = 0) -> JurnalYozuv:
    """
    KIRIM: Tovar keldi
      DEBIT  ombor           (ombor qiymati oshdi)
      CREDIT kreditorlar     (yetkazuvchiga qarzmiz) YOKI kassa (naqd to'ladik)
    """
    je = JurnalYozuv(tur=JurnalTuri.KIRIM, user_id=user_id,
                      tavsif=f"Kirim: {yetkazuvchi}, {tovarlar_soni} ta, jami={jami}")
    je.qatorlar.append(JurnalQator(hisob=HisobTuri.OMBOR, debit=jami,
                                    tavsif=f"Tovar kirim: {yetkazuvchi}"))
    je.qatorlar.append(JurnalQator(hisob=HisobTuri.KREDITORLAR, credit=jami,
                                    tavsif=f"Yetkazuvchi: {yetkazuvchi}"))
    return je


def qaytarish_jurnali(user_id: int, klient: str, summa: Decimal) -> JurnalYozuv:
    """
    QAYTARISH: Tovar qaytarildi
      DEBIT  daromad     (daromad kamaydi — teskari)
      CREDIT debitorlar  (klient qarzi kamaydi) YOKI kassa (pul qaytardik)
    """
    je = JurnalYozuv(tur=JurnalTuri.QAYTARISH, user_id=user_id,
                      tavsif=f"Qaytarish: {klient}, summa={summa}")
    je.qatorlar.append(JurnalQator(hisob=HisobTuri.DAROMAD, debit=summa,
                                    tavsif=f"Qaytarish: {klient}"))
    je.qatorlar.append(JurnalQator(hisob=HisobTuri.DEBITORLAR, credit=summa,
                                    tavsif=f"Qarz kamaytirish: {klient}"))
    return je


def qarz_tolash_jurnali(user_id: int, klient: str, summa: Decimal,
                          usul: str = "naqd") -> JurnalYozuv:
    """
    QARZ TO'LASH: Klient pul to'ladi
      DEBIT  kassa_naqd   (pul kirdi)
      CREDIT debitorlar    (klient qarzi kamaydi)
    """
    kassa = {"naqd": HisobTuri.KASSA_NAQD, "karta": HisobTuri.KASSA_KARTA,
              "otkazma": HisobTuri.KASSA_OTKAZMA}.get(usul, HisobTuri.KASSA_NAQD)

    je = JurnalYozuv(tur=JurnalTuri.QARZ_TOLASH, user_id=user_id,
                      tavsif=f"Qarz to'lash: {klient}, summa={summa}")
    je.qatorlar.append(JurnalQator(hisob=kassa, debit=summa,
                                    tavsif=f"To'lov qabul: {klient}"))
    je.qatorlar.append(JurnalQator(hisob=HisobTuri.DEBITORLAR, credit=summa,
                                    tavsif=f"Debitor kamaytirish: {klient}"))
    return je


def xarajat_jurnali(user_id: int, tavsif: str, summa: Decimal,
                      usul: str = "naqd") -> JurnalYozuv:
    """
    XARAJAT: Pul chiqimi
      DEBIT  xarajat     (xarajat oshdi)
      CREDIT kassa_naqd  (kassa kamaydi)
    """
    kassa = {"naqd": HisobTuri.KASSA_NAQD, "karta": HisobTuri.KASSA_KARTA,
              "otkazma": HisobTuri.KASSA_OTKAZMA}.get(usul, HisobTuri.KASSA_NAQD)

    je = JurnalYozuv(tur=JurnalTuri.KASSA_CHIQIM, user_id=user_id,
                      tavsif=f"Xarajat: {tavsif}, summa={summa}")
    je.qatorlar.append(JurnalQator(hisob=HisobTuri.XARAJAT, debit=summa, tavsif=tavsif))
    je.qatorlar.append(JurnalQator(hisob=kassa, credit=summa, tavsif=f"Chiqim: {tavsif}"))
    return je


# ════════════════════════════════════════════════════════════════════
#  JURNAL SAQLASH — DB ga yozish
# ════════════════════════════════════════════════════════════════════

async def jurnal_saqlash(conn, je: JurnalYozuv) -> bool:
    """
    Jurnal yozuvini DB ga saqlash.
    QOIDA: Faqat balanslangan yozuv saqlanadi (debit = credit).
    """
    ok, xato = je.validate()
    if not ok:
        log.error("Jurnal validatsiya xato: %s — %s", je.id, xato)
        return False

    try:
        # Idempotency tekshiruvi
        if je.idempotency_key:
            existing = await conn.fetchval(
                "SELECT id FROM jurnal_yozuvlar WHERE idempotency_key=$1",
                je.idempotency_key)
            if existing:
                log.warning("Jurnal idempotency: %s allaqachon mavjud", je.idempotency_key)
                return True  # Takroriy — OK, lekin qayta yozilmaydi

        # Jurnal sarlavha
        je_db_id = await conn.fetchval("""
            INSERT INTO jurnal_yozuvlar
                (jurnal_id, user_id, tur, sana, tavsif, jami_debit, jami_credit,
                 manba_id, manba_jadval, idempotency_key)
            VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9)
            RETURNING id
        """, je.id, je.user_id, je.tur.value, je.tavsif,
            je.jami_debit, je.jami_credit,
            je.manba_id, je.manba_jadval,
            je.idempotency_key or None)

        # Jurnal qatorlari
        for q in je.qatorlar:
            await conn.execute("""
                INSERT INTO jurnal_qatorlar
                    (jurnal_id, hisob, debit, credit, tavsif)
                VALUES ($1, $2, $3, $4, $5)
            """, je_db_id, q.hisob.value, q.debit, q.credit, q.tavsif)

        log.info("✅ Jurnal saqlandi: %s (%s) debit=%s credit=%s",
                 je.id, je.tur.value, je.jami_debit, je.jami_credit)
        return True

    except Exception as e:
        log.error("Jurnal saqlash xato: %s — %s", je.id, e)
        return False


# ════════════════════════════════════════════════════════════════════
#  BALANS TEKSHIRISH — reconciliation
# ════════════════════════════════════════════════════════════════════

async def balans_tekshir(conn, user_id: int) -> dict:
    """
    BANK QOIDASI: SUM(debit) = SUM(credit) bo'lishi KERAK.
    Agar teng bo'lmasa — tizimda xato bor.
    """
    row = await conn.fetchrow("""
        SELECT
            COALESCE(SUM(jami_debit), 0) AS total_debit,
            COALESCE(SUM(jami_credit), 0) AS total_credit
        FROM jurnal_yozuvlar
        WHERE user_id = $1
    """, user_id)

    total_d = Decimal(str(row["total_debit"]))
    total_c = Decimal(str(row["total_credit"]))
    farq = total_d - total_c

    return {
        "balanslangan": farq == 0,
        "total_debit": str(total_d),
        "total_credit": str(total_c),
        "farq": str(farq),
        "xulosa": "✅ Balans to'g'ri" if farq == 0 else f"❌ Farq: {farq}",
    }


async def hisob_balans(conn, user_id: int, hisob: HisobTuri) -> Decimal:
    """Bitta hisob balansi"""
    row = await conn.fetchrow("""
        SELECT
            COALESCE(SUM(debit), 0) AS d,
            COALESCE(SUM(credit), 0) AS c
        FROM jurnal_qatorlar jq
        JOIN jurnal_yozuvlar jy ON jq.jurnal_id = jy.id
        WHERE jy.user_id = $1 AND jq.hisob = $2
    """, user_id, hisob.value)

    return Decimal(str(row["d"])) - Decimal(str(row["c"]))
