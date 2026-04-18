"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — TO'LOV INTEGRATSIYA INFRASTRUKTURA          ║
║  Click, Payme, Uzum Pay — O'zbekiston to'lov tizimlari         ║
║                                                                  ║
║  Arxitektura:                                                    ║
║  1. PaymentProvider abstract class                              ║
║  2. Click API adapter                                           ║
║  3. Payme API adapter                                           ║
║  4. To'lov holati tracking                                      ║
║  5. Webhook callback handling                                   ║
║                                                                  ║
║  FLOW:                                                           ║
║  Klient → Mini-do'kon → Buyurtma → To'lov link → Click/Payme  ║
║  → Callback → Buyurtma tasdiqlash → Do'konchiga TG xabar       ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import hashlib
import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum

log = logging.getLogger(__name__)


class TolovHolat(str, Enum):
    KUTILMOQDA = "kutilmoqda"      # Link yaratildi
    JARAYONDA  = "jarayonda"       # To'lov boshlanadi
    TOLANGAN   = "tolangan"        # Muvaffaqiyatli
    BEKOR      = "bekor"           # Bekor qilindi
    XATO       = "xato"            # Texnik xato
    QAYTARILDI = "qaytarildi"      # Refund


@dataclass
class TolovSorov:
    """To'lov so'rovi — provider ga yuborish uchun."""
    order_id: str                  # Ichki buyurtma ID
    summa: Decimal                 # So'mda
    tavsif: str = ""               # "Buyurtma #123 — Ariel, Tide"
    klient_ismi: str = ""
    klient_telefon: str = ""
    qaytish_url: str = ""          # To'lovdan keyin qaytish
    webhook_url: str = ""          # Callback URL


@dataclass
class TolovNatija:
    """To'lov natijasi — provider dan kelgan."""
    tranzaksiya_id: str
    holat: TolovHolat
    summa: Decimal
    vaqt: str = ""
    provider: str = ""
    xato_xabar: str = ""
    qoshimcha: dict = field(default_factory=dict)


class PaymentProvider(ABC):
    """Abstract to'lov provider — barcha providerlar shu interfeysni qo'llaydi."""

    @abstractmethod
    async def link_yaratish(self, sorov: TolovSorov) -> str:
        """To'lov linkini yaratish — klient shu linkka o'tadi."""
        ...

    @abstractmethod
    async def holat_tekshirish(self, tranzaksiya_id: str) -> TolovNatija:
        """To'lov holatini tekshirish."""
        ...

    @abstractmethod
    def webhook_tekshirish(self, data: dict, headers: dict) -> bool:
        """Webhook callbackni tekshirish (HMAC/signature)."""
        ...

    @abstractmethod
    def webhook_parse(self, data: dict) -> TolovNatija:
        """Webhook datadan TolovNatija olish."""
        ...


# ═══════════════════════════════════════════════════════════
#  CLICK ADAPTER
# ═══════════════════════════════════════════════════════════

class ClickProvider(PaymentProvider):
    """Click.uz to'lov integratsiya.

    Sozlash:
        CLICK_MERCHANT_ID — Click merchant ID
        CLICK_SERVICE_ID  — Click service ID
        CLICK_SECRET_KEY  — HMAC kaliti
    """

    def __init__(self):
        self.merchant_id = os.getenv("CLICK_MERCHANT_ID", "")
        self.service_id = os.getenv("CLICK_SERVICE_ID", "")
        self.secret_key = os.getenv("CLICK_SECRET_KEY", "")
        self.base_url = "https://my.click.uz/services/pay"

    async def link_yaratish(self, sorov: TolovSorov) -> str:
        """Click to'lov linki — klient shu URLga o'tadi."""
        params = {
            "merchant_id": self.merchant_id,
            "service_id": self.service_id,
            "amount": str(sorov.summa),
            "transaction_param": sorov.order_id,
            "return_url": sorov.qaytish_url or "",
        }
        query = "&".join(f"{k}={v}" for k, v in params.items() if v)
        return f"{self.base_url}?{query}"

    async def holat_tekshirish(self, tranzaksiya_id: str) -> TolovNatija:
        """Click API orqali to'lov holatini tekshirish."""
        # TODO: Click API chaqirish
        return TolovNatija(
            tranzaksiya_id=tranzaksiya_id,
            holat=TolovHolat.KUTILMOQDA,
            summa=Decimal("0"),
            provider="click",
        )

    def webhook_tekshirish(self, data: dict, headers: dict) -> bool:
        """Click webhook HMAC tekshirish."""
        if not self.secret_key:
            return False
        sign_string = (
            f"{data.get('click_trans_id', '')}"
            f"{data.get('service_id', '')}"
            f"{self.secret_key}"
            f"{data.get('merchant_trans_id', '')}"
            f"{data.get('amount', '')}"
            f"{data.get('action', '')}"
            f"{data.get('sign_time', '')}"
        )
        expected = hashlib.md5(sign_string.encode()).hexdigest()
        return data.get("sign_string", "") == expected

    def webhook_parse(self, data: dict) -> TolovNatija:
        """Click webhook datani parse qilish."""
        action = int(data.get("action", 0))
        error = int(data.get("error", 0))

        if action == 0:  # Prepare
            holat = TolovHolat.JARAYONDA
        elif action == 1 and error == 0:  # Complete
            holat = TolovHolat.TOLANGAN
        else:
            holat = TolovHolat.XATO

        return TolovNatija(
            tranzaksiya_id=str(data.get("click_trans_id", "")),
            holat=holat,
            summa=Decimal(str(data.get("amount", 0))),
            provider="click",
            qoshimcha=data,
        )


# ═══════════════════════════════════════════════════════════
#  PAYME ADAPTER
# ═══════════════════════════════════════════════════════════

class PaymeProvider(PaymentProvider):
    """Payme.uz to'lov integratsiya.

    Sozlash:
        PAYME_MERCHANT_ID — Payme merchant ID
        PAYME_SECRET_KEY  — Payme kaliti
    """

    def __init__(self):
        self.merchant_id = os.getenv("PAYME_MERCHANT_ID", "")
        self.secret_key = os.getenv("PAYME_SECRET_KEY", "")
        self.base_url = "https://checkout.paycom.uz"

    async def link_yaratish(self, sorov: TolovSorov) -> str:
        """Payme to'lov linki."""
        import base64
        # Payme tiyinda ishlaydi (1 so'm = 100 tiyin)
        summa_tiyin = int(sorov.summa * 100)
        params = f"m={self.merchant_id};ac.order_id={sorov.order_id};a={summa_tiyin}"
        encoded = base64.b64encode(params.encode()).decode()
        return f"{self.base_url}/{encoded}"

    async def holat_tekshirish(self, tranzaksiya_id: str) -> TolovNatija:
        """Payme API orqali tekshirish."""
        return TolovNatija(
            tranzaksiya_id=tranzaksiya_id,
            holat=TolovHolat.KUTILMOQDA,
            summa=Decimal("0"),
            provider="payme",
        )

    def webhook_tekshirish(self, data: dict, headers: dict) -> bool:
        """Payme Basic Auth tekshirish."""
        import base64
        auth = headers.get("Authorization", "")
        if not auth.startswith("Basic "):
            return False
        try:
            decoded = base64.b64decode(auth[6:]).decode()
            login, password = decoded.split(":", 1)
            return login == "Paycom" and password == self.secret_key
        except Exception:
            return False

    def webhook_parse(self, data: dict) -> TolovNatija:
        """Payme JSON-RPC natijani parse qilish."""
        method = data.get("method", "")
        params = data.get("params", {})
        account = params.get("account", {})

        if method == "PerformTransaction":
            holat = TolovHolat.TOLANGAN
        elif method == "CancelTransaction":
            holat = TolovHolat.QAYTARILDI
        elif method == "CreateTransaction":
            holat = TolovHolat.JARAYONDA
        else:
            holat = TolovHolat.KUTILMOQDA

        summa = Decimal(str(params.get("amount", 0))) / Decimal("100")
        return TolovNatija(
            tranzaksiya_id=str(params.get("id", "")),
            holat=holat,
            summa=summa,
            provider="payme",
            qoshimcha={"account": account, "method": method},
        )


# ═══════════════════════════════════════════════════════════
#  FACTORY — Provider olish
# ═══════════════════════════════════════════════════════════

_PROVIDERS: dict[str, type[PaymentProvider]] = {
    "click": ClickProvider,
    "payme": PaymeProvider,
}


def get_provider(nomi: str) -> PaymentProvider | None:
    """To'lov providerini olish."""
    cls = _PROVIDERS.get(nomi.lower())
    if cls:
        return cls()
    return None


def mavjud_providerlar() -> list[str]:
    """Sozlangan (env bor) providerlar ro'yxati."""
    natija = []
    if os.getenv("CLICK_MERCHANT_ID"):
        natija.append("click")
    if os.getenv("PAYME_MERCHANT_ID"):
        natija.append("payme")
    return natija
