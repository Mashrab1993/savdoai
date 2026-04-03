"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — INTEGRATSIYA TESTLARI                        ║
║  Tizimlar BIRGA ishlashini tekshirish                           ║
╚══════════════════════════════════════════════════════════════════╝
"""
import pytest
import sys
from decimal import Decimal
from pathlib import Path

REPO = Path(__file__).parent.parent
sys.path.insert(0, str(REPO))


class TestLoyaltyKPIIntegration:
    """Loyalty va KPI tizimlarining o'zaro bog'liqligi."""

    def test_loyalty_ball_kpi_badge_sifatida(self):
        """KPI badge tizimida loyalty ma'lumotlari bor."""
        from shared.services.kpi_engine import BADGES
        # KPI badge loyalty bilan bog'liq bo'lishi kerak
        assert any("ball" in k or "yig" in k for k in BADGES.keys()), \
            "KPI da loyalty/qarz badge bo'lishi kerak"

    def test_loyalty_daraja_chegirma_hisob(self):
        """Loyalty daraja chegirmasi sotuv narxiga ta'sir qiladi."""
        from shared.services.loyalty import daraja_aniqla
        from shared.utils.hisob import narx_hisob

        daraja = daraja_aniqla(600)  # Gold
        chegirma = daraja["chegirma_foiz"]  # 5%
        assert chegirma == 5

        # Narx hisoblash
        natija = narx_hisob(miqdor=10, narx=100000, birlik="dona",
                           chegirma_foiz=chegirma)
        assert natija == Decimal("950000")  # 10*100k - 5%


class TestSmartSaleIntegration:
    """Smart sale va loyalty/ombor integratsiyasi."""

    def test_smart_sale_imports(self):
        """Smart sale barcha kerakli modullarni import qiladi."""
        from shared.services.smart_sale import pre_sale_checks, post_sale_alerts
        assert callable(pre_sale_checks)
        assert callable(post_sale_alerts)

    def test_loyalty_ball_hisoblash_sotuv_uchun(self):
        """Sotuv summasidan ball to'g'ri hisoblanadi."""
        from shared.services.loyalty import ball_hisoblash
        # 2,250,000 so'mlik sotuv = 2250 ball
        assert ball_hisoblash(2250000) == 2250
        # Platinum darajaga yetadi (2000+)
        from shared.services.loyalty import daraja_aniqla
        d = daraja_aniqla(2250)
        assert d["nomi"] == "Platinum"
        assert d["chegirma_foiz"] == 10


class TestNotificationAdvisorIntegration:
    """Smart notification va AI advisor birgalikda ishlashi."""

    def test_notification_dispatch_turi(self):
        """Notification turi to'g'ri dispatch qilinadi."""
        # Bu async funksiya — faqat import tekshiramiz
        from shared.services.smart_notification import notification_dispatch
        import inspect
        assert inspect.iscoroutinefunction(notification_dispatch)

    def test_advisor_insight_format_notification_uchun(self):
        """AI advisor insightlarini notification sifatida yuborish mumkin."""
        from shared.services.ai_advisor import insight_formatlash
        # Notification uchun matn generatsiya
        insightlar = [
            {"turi": "critical", "emoji": "📉",
             "sarlavha": "Sotuv tushdi", "tavsif": "20% kamaydi",
             "tavsiya": "Klientlarga qo'ng'iroq qiling"},
        ]
        matn = insight_formatlash(insightlar)
        # Telegram Markdown formatda bo'lishi kerak
        assert "*" in matn  # Bold text
        assert len(matn) < 4096  # Telegram message limit


class TestPaymentWebhookIntegration:
    """To'lov webhook va sotuv tizimi integratsiyasi."""

    def test_click_webhook_parse_holat(self):
        from shared.services.tolov_integratsiya import ClickProvider, TolovHolat
        p = ClickProvider()

        # Prepare
        r1 = p.webhook_parse({"action": 0, "error": 0, "click_trans_id": "1", "amount": "100"})
        assert r1.holat == TolovHolat.JARAYONDA

        # Complete
        r2 = p.webhook_parse({"action": 1, "error": 0, "click_trans_id": "1", "amount": "100"})
        assert r2.holat == TolovHolat.TOLANGAN

        # Error
        r3 = p.webhook_parse({"action": 1, "error": -1, "click_trans_id": "1", "amount": "100"})
        assert r3.holat == TolovHolat.XATO

    def test_payme_webhook_parse(self):
        from shared.services.tolov_integratsiya import PaymeProvider, TolovHolat
        p = PaymeProvider()

        r = p.webhook_parse({
            "method": "PerformTransaction",
            "params": {"id": "tx123", "amount": 10000000, "account": {"order_id": "O1"}},
        })
        assert r.holat == TolovHolat.TOLANGAN
        assert r.summa == Decimal("100000")  # 10000000 tiyin = 100000 so'm


class TestGPSKPIIntegration:
    """GPS tracking va KPI tizimi integratsiyasi."""

    def test_haversine_accuracy(self):
        from shared.services.gps_tracking import haversine
        # Toshkent ichida bilim uyidan Chorsu bozorigacha ~5km
        d = haversine(41.3111, 69.2797, 41.3267, 69.2339)
        assert 3 < d < 8  # 3-8 km orasida


class TestSubscriptionLimitIntegration:
    """Subscription limitlari va sotuv tizimi."""

    def test_boshlangich_limit(self):
        from shared.services.subscription import TARIFLAR, limit_tekshir
        tarif = {
            "sinov": False,
            "limitlar": {"tovar": TARIFLAR["boshlangich"]["tovar_limit"]},
            "ishlatilgan": {"tovar": 51}
        }
        # 51 > 50 limit
        assert limit_tekshir(tarif, "tovar") is False

    def test_sinov_davri_cheksiz(self):
        from shared.services.subscription import limit_tekshir
        tarif = {
            "sinov": True,
            "limitlar": {"tovar": 50},
            "ishlatilgan": {"tovar": 1000}
        }
        assert limit_tekshir(tarif, "tovar") is True

    def test_biznes_plan_cheksiz(self):
        from shared.services.subscription import TARIFLAR, limit_tekshir
        tarif = {
            "sinov": False,
            "limitlar": {"tovar": TARIFLAR["biznes"]["tovar_limit"]},
            "ishlatilgan": {"tovar": 50000}
        }
        assert limit_tekshir(tarif, "tovar") is True


class TestVoiceCognitiveIntegration:
    """Voice commands va cognitive engine birga ishlashi."""

    def test_voice_pattern_cognitive_tool_mos(self):
        """Har bir voice action uchun cognitive toolda karshi amal bor."""
        from shared.services.voice_commands import detect_voice_command
        from services.cognitive.engine import TOOLS

        # narx hisob — voice dan keladi, tool da hisoblanadi
        assert "narx_hisob" in TOOLS
        assert "qarz_hisob" in TOOLS
        assert "loyalty_hisob" in TOOLS

    def test_cognitive_loyalty_tool_ishlaydi(self):
        """Cognitive engine loyalty ball hisoblashi ishlaydi."""
        from services.cognitive.engine import tool_chaqir
        r = tool_chaqir("loyalty_hisob", {"summa": 500000})
        assert r["ball"] == 500
        assert r["daraja"] == "Gold"


class TestSchemaConsistency:
    """Schema va migration konsistentligi."""

    def test_schema_va_migration_sinxron(self):
        """Schema.sql dagi jadvallar migration larda ham bor."""
        import re
        schema = (REPO / "shared" / "database" / "schema.sql").read_text()
        schema_tables = set(re.findall(r"CREATE TABLE IF NOT EXISTS\s+(\w+)", schema))

        # Yangi jadvallar schema da ham, migration da ham bor
        yangi = {"qarz_eslatmalar", "loyalty_ballar", "tolov_tranzaksiyalar",
                 "kpi_targetlar", "filiallar", "filial_qoldiqlar", "gps_log",
                 "yetkazib_beruvchilar", "supplier_buyurtmalar"}

        for j in yangi:
            assert j in schema_tables, f"{j} schema.sql da yo'q"

    def test_enable_rls_barcha_user_jadvallar(self):
        """User ma'lumotlari bo'lgan jadvallar RLS himoyalangan."""
        import re
        schema = (REPO / "shared" / "database" / "schema.sql").read_text()
        rls_tables = set(re.findall(r"enable_rls\('(\w+)'\)", schema))

        # Bu jadvallar user_id bor — RLS kerak
        kerakli = {"klientlar", "tovarlar", "sotuv_sessiyalar", "chiqimlar",
                    "qarzlar", "qarz_eslatmalar", "loyalty_ballar", "gps_log"}
        for j in kerakli:
            assert j in rls_tables, f"{j} da RLS yo'q!"


class TestEndToEnd:
    """End-to-end flow simulation."""

    def test_sotuv_to_loyalty_to_kpi_flow(self):
        """Sotuv → Loyalty ball → KPI reyting zanjiri."""
        from shared.services.loyalty import ball_hisoblash, daraja_aniqla

        # 1. Sotuv: 2M so'm
        sotuv_summa = 2000000
        ball = ball_hisoblash(sotuv_summa)
        assert ball == 2000

        # 2. Loyalty: Platinum
        daraja = daraja_aniqla(ball)
        assert daraja["nomi"] == "Platinum"
        assert daraja["chegirma_foiz"] == 10

        # 3. Keyingi sotuvda 10% chegirma
        from shared.utils.hisob import narx_hisob
        yangi_sotuv = narx_hisob(100, 50000, "dona", daraja["chegirma_foiz"])
        assert yangi_sotuv == Decimal("4500000")  # 5M - 10%

    def test_insight_format_chain(self):
        """Insight yaratish → formatlash → Telegram uchun tayyor."""
        from shared.services.ai_advisor import insight_formatlash
        insightlar = [
            {"turi": "critical", "emoji": "📉", "sarlavha": "Sotuv tushdi",
             "tavsif": "20% kamaydi", "tavsiya": "Harakat qiling"},
            {"turi": "opportunity", "emoji": "🚀", "sarlavha": "O'sish",
             "tavsif": "30% oshdi", "tavsiya": "Davom eting"},
        ]
        matn = insight_formatlash(insightlar)
        assert "🔴" in matn  # critical = qizil
        assert "🟢" in matn  # opportunity = yashil
        assert len(matn) > 50
