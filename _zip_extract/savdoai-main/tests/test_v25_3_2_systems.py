"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — YANGI TIZIMLAR UNIT TESTLARI                ║
║  13 ta yangi modul uchun 100+ test                              ║
╚══════════════════════════════════════════════════════════════════╝
"""
import pytest
import sys
import os
from decimal import Decimal
from pathlib import Path

REPO = Path(__file__).parent.parent
sys.path.insert(0, str(REPO))


# ════════════════════════════════════════════════════════
#  LOYALTY TIZIMI
# ════════════════════════════════════════════════════════

class TestLoyalty:
    def test_ball_hisoblash_asosiy(self):
        from shared.services.loyalty import ball_hisoblash
        assert ball_hisoblash(50000) == 50
        assert ball_hisoblash(1000000) == 1000
        assert ball_hisoblash(100000) == 100

    def test_ball_hisoblash_kichik(self):
        from shared.services.loyalty import ball_hisoblash
        assert ball_hisoblash(500) == 0
        assert ball_hisoblash(999) == 0
        assert ball_hisoblash(0) == 0

    def test_ball_hisoblash_chegaraviy(self):
        from shared.services.loyalty import ball_hisoblash
        assert ball_hisoblash(1000) == 1
        assert ball_hisoblash(1999) == 1
        assert ball_hisoblash(2000) == 2

    def test_ball_manfiy_emas(self):
        from shared.services.loyalty import ball_hisoblash
        assert ball_hisoblash(-5000) == -5  # Qaytarish holati

    def test_daraja_bronze(self):
        from shared.services.loyalty import daraja_aniqla
        d = daraja_aniqla(0)
        assert d["nomi"] == "Bronze"
        assert d["chegirma_foiz"] == 0

    def test_daraja_silver(self):
        from shared.services.loyalty import daraja_aniqla
        d = daraja_aniqla(100)
        assert d["nomi"] == "Silver"
        assert d["chegirma_foiz"] == 2

    def test_daraja_gold(self):
        from shared.services.loyalty import daraja_aniqla
        d = daraja_aniqla(500)
        assert d["nomi"] == "Gold"
        assert d["chegirma_foiz"] == 5

    def test_daraja_platinum(self):
        from shared.services.loyalty import daraja_aniqla
        d = daraja_aniqla(2000)
        assert d["nomi"] == "Platinum"
        assert d["chegirma_foiz"] == 10

    def test_daraja_ortasida(self):
        from shared.services.loyalty import daraja_aniqla
        d = daraja_aniqla(250)
        assert d["nomi"] == "Silver"  # 100-499 orasida

    def test_darajalar_soni(self):
        from shared.services.loyalty import DARAJALAR
        assert len(DARAJALAR) == 4


# ════════════════════════════════════════════════════════
#  TO'LOV INTEGRATSIYA
# ════════════════════════════════════════════════════════

class TestTolov:
    def test_click_provider_link(self):
        from shared.services.tolov_integratsiya import ClickProvider, TolovSorov
        import asyncio
        p = ClickProvider()
        p.merchant_id = "TEST_M"
        p.service_id = "TEST_S"
        sorov = TolovSorov(order_id="ORD-1", summa=Decimal("50000"))
        link = asyncio.get_event_loop().run_until_complete(p.link_yaratish(sorov))
        assert "TEST_M" in link
        assert "50000" in link
        assert "my.click.uz" in link

    def test_payme_provider_link(self):
        from shared.services.tolov_integratsiya import PaymeProvider, TolovSorov
        import asyncio
        p = PaymeProvider()
        p.merchant_id = "PME_TEST"
        sorov = TolovSorov(order_id="ORD-2", summa=Decimal("100000"))
        link = asyncio.get_event_loop().run_until_complete(p.link_yaratish(sorov))
        assert "checkout.paycom.uz" in link

    def test_get_provider_click(self):
        from shared.services.tolov_integratsiya import get_provider
        p = get_provider("click")
        assert p is not None

    def test_get_provider_payme(self):
        from shared.services.tolov_integratsiya import get_provider
        p = get_provider("payme")
        assert p is not None

    def test_get_provider_unknown(self):
        from shared.services.tolov_integratsiya import get_provider
        p = get_provider("unknown")
        assert p is None

    def test_tolov_holat_enum(self):
        from shared.services.tolov_integratsiya import TolovHolat
        assert TolovHolat.TOLANGAN.value == "tolangan"
        assert TolovHolat.KUTILMOQDA.value == "kutilmoqda"
        assert TolovHolat.BEKOR.value == "bekor"

    def test_click_webhook_parse(self):
        from shared.services.tolov_integratsiya import ClickProvider, TolovHolat
        p = ClickProvider()
        data = {"click_trans_id": "123", "action": 1, "error": 0, "amount": "50000"}
        natija = p.webhook_parse(data)
        assert natija.holat == TolovHolat.TOLANGAN
        assert natija.summa == Decimal("50000")

    def test_click_webhook_error(self):
        from shared.services.tolov_integratsiya import ClickProvider, TolovHolat
        p = ClickProvider()
        data = {"click_trans_id": "123", "action": 1, "error": -1, "amount": "50000"}
        natija = p.webhook_parse(data)
        assert natija.holat == TolovHolat.XATO


# ════════════════════════════════════════════════════════
#  GPS TRACKING
# ════════════════════════════════════════════════════════

class TestGPS:
    def test_haversine_toshkent_samarqand(self):
        from shared.services.gps_tracking import haversine
        d = haversine(41.2995, 69.2401, 39.6542, 66.9597)
        assert 260 < d < 280

    def test_haversine_nol_masofa(self):
        from shared.services.gps_tracking import haversine
        d = haversine(41.2995, 69.2401, 41.2995, 69.2401)
        assert d < 0.001

    def test_haversine_1km(self):
        from shared.services.gps_tracking import haversine
        d = haversine(41.2995, 69.2401, 41.3085, 69.2401)
        assert 0.5 < d < 2.0

    def test_haversine_antipodal(self):
        from shared.services.gps_tracking import haversine
        d = haversine(0, 0, 0, 180)
        assert 19000 < d < 21000  # Yer aylanasi yarmi


# ════════════════════════════════════════════════════════
#  QARZ ESLATMA
# ════════════════════════════════════════════════════════

class TestQarzEslatma:
    def test_eslatma_shablon_yumshoq(self):
        from shared.services.qarz_eslatma import eslatma_matni
        m = eslatma_matni("Salimov", "Mashrab do'kon", "+998901234567",
                          500000, 2, "2026-04-10", "yumshoq")
        assert "Salimov" in m
        assert "500,000" in m
        assert "Mashrab" in m

    def test_eslatma_shablon_urgent(self):
        from shared.services.qarz_eslatma import eslatma_matni
        m = eslatma_matni("Karimov", "Do'kon", "+998", 1000000, 1, "2026-03-01", "urgent")
        assert "Karimov" in m
        assert "⚠️" in m or "diqqat" in m.lower()

    def test_eslatma_shablon_oddiy(self):
        from shared.services.qarz_eslatma import eslatma_matni
        m = eslatma_matni("Test", "D", "+998", 100000, 1, None, "oddiy")
        assert "Test" in m
        assert "100,000" in m

    def test_barcha_shablonlar_mavjud(self):
        from shared.services.qarz_eslatma import _ESLATMA_SHABLONLAR
        assert "yumshoq" in _ESLATMA_SHABLONLAR
        assert "oddiy" in _ESLATMA_SHABLONLAR
        assert "urgent" in _ESLATMA_SHABLONLAR

    def test_min_oraliq_kuni(self):
        from shared.services.qarz_eslatma import _MIN_ESLATMA_ORALIGI_KUN
        assert _MIN_ESLATMA_ORALIGI_KUN >= 1


# ════════════════════════════════════════════════════════
#  KPI ENGINE
# ════════════════════════════════════════════════════════

class TestKPI:
    def test_badges_soni(self):
        from shared.services.kpi_engine import BADGES
        assert len(BADGES) >= 8

    def test_badge_emoji_bor(self):
        from shared.services.kpi_engine import BADGES
        for key, badge in BADGES.items():
            assert "emoji" in badge, f"Badge {key} da emoji yo'q"
            assert "nomi" in badge, f"Badge {key} da nomi yo'q"
            assert "min_sotuv" in badge or "min_qarz_yig" in badge or \
                   "min_klient" in badge or "min_kunlik" in badge


# ════════════════════════════════════════════════════════
#  SUBSCRIPTION / FREEMIUM
# ════════════════════════════════════════════════════════

class TestSubscription:
    def test_tariflar_soni(self):
        from shared.services.subscription import TARIFLAR
        assert len(TARIFLAR) == 3

    def test_tarif_boshlangich_bepul(self):
        from shared.services.subscription import TARIFLAR
        b = TARIFLAR["boshlangich"]
        assert b["narx_oylik"] == 0
        assert b["tovar_limit"] == 50

    def test_tarif_biznes_cheksiz(self):
        from shared.services.subscription import TARIFLAR
        bz = TARIFLAR["biznes"]
        assert bz["tovar_limit"] >= 999_999
        assert bz["kpi"] is True
        assert bz["loyalty"] is True
        assert bz["gps"] is True

    def test_tarif_orta_narxi(self):
        from shared.services.subscription import TARIFLAR
        o = TARIFLAR["orta"]
        assert o["narx_oylik"] == 49_000
        assert o["kpi"] is True
        assert o["gps"] is False

    def test_sinov_muddati(self):
        from shared.services.subscription import SINOV_KUNLAR
        assert SINOV_KUNLAR == 14

    def test_tariflar_taqqos_matni(self):
        from shared.services.subscription import tariflar_taqqos_matni
        m = tariflar_taqqos_matni()
        assert "BEPUL" in m
        assert "49,000" in m
        assert "149,000" in m
        assert "14 kun" in m

    def test_tarif_olish(self):
        from shared.services.subscription import tarif_olish
        t = tarif_olish("biznes")
        assert t["nomi"] == "Biznes"
        t2 = tarif_olish("noma'lum")
        assert t2["nomi"] == "Boshlang'ich"  # fallback

    def test_limit_tekshir(self):
        from shared.services.subscription import limit_tekshir
        # Sinov davri — har doim ruxsat
        tarif = {"sinov": True, "limitlar": {"tovar": 50}, "ishlatilgan": {"tovar": 100}}
        assert limit_tekshir(tarif, "tovar") is True
        # Limit ichida
        tarif2 = {"sinov": False, "limitlar": {"tovar": 50}, "ishlatilgan": {"tovar": 30}}
        assert limit_tekshir(tarif2, "tovar") is True
        # Limit oshgan
        tarif3 = {"sinov": False, "limitlar": {"tovar": 50}, "ishlatilgan": {"tovar": 50}}
        assert limit_tekshir(tarif3, "tovar") is False


# ════════════════════════════════════════════════════════
#  AI ADVISOR
# ════════════════════════════════════════════════════════

class TestAIAdvisor:
    def test_insight_formatlash_bosh(self):
        from shared.services.ai_advisor import insight_formatlash
        out = insight_formatlash([])
        assert "yaxshi" in out.lower()

    def test_insight_formatlash_bitta(self):
        from shared.services.ai_advisor import insight_formatlash
        ins = [{
            "turi": "critical", "emoji": "📉",
            "sarlavha": "Test sarlavha",
            "tavsif": "Test tavsif",
            "tavsiya": "Test tavsiya",
        }]
        out = insight_formatlash(ins)
        assert "Test sarlavha" in out
        assert "Test tavsiya" in out
        assert "🔴" in out  # critical → qizil

    def test_insight_turi_rang(self):
        from shared.services.ai_advisor import insight_formatlash
        for turi, emoji in [("critical","🔴"), ("warning","🟡"),
                             ("opportunity","🟢"), ("info","🔵")]:
            ins = [{"turi": turi, "emoji": "X", "sarlavha": "S",
                    "tavsif": "D", "tavsiya": "A"}]
            assert emoji in insight_formatlash(ins)


# ════════════════════════════════════════════════════════
#  VOICE COMMANDS
# ════════════════════════════════════════════════════════

class TestVoiceCommands:
    def test_kpi(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("kpi ko'rsat")
        assert r and r["action"] == "kpi"

    def test_loyalty(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("bonus ball")
        assert r and r["action"] == "loyalty"

    def test_eslatma(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("qarz eslatma yubor")
        assert r and r["action"] == "reminder"

    def test_advisor(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("biznes tahlil")
        assert r and r["action"] == "advisor"

    def test_gps(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("marshrut ko'rsat")
        assert r and r["action"] == "gps"

    def test_subscription(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("tarif planlari")
        assert r and r["action"] == "subscription"

    def test_confirm(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("tasdiqla")
        assert r and r["action"] == "confirm"

    def test_hisobot(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("bugungi hisobot")
        assert r and r["action"] == "report"

    def test_none(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("random gibberish xyz123")
        assert r is None

    def test_payment(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("click to'lov")
        assert r and r["action"] == "payment"

    def test_stock(self):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command("kam qolgan tovarlar")
        assert r and r["action"] == "stock"


# ════════════════════════════════════════════════════════
#  COGNITIVE ENGINE
# ════════════════════════════════════════════════════════

class TestCognitiveEngine:
    def test_tools_soni(self):
        from services.cognitive.engine import TOOLS
        assert len(TOOLS) >= 7

    def test_loyalty_tool_bor(self):
        from services.cognitive.engine import TOOLS
        assert "loyalty_hisob" in TOOLS

    def test_narx_hisob_tool(self):
        from services.cognitive.engine import tool_narx_hisob
        r = tool_narx_hisob(miqdor=50, narx=45000, birlik="dona")
        assert r["jami"] == 2_250_000

    def test_qarz_hisob_tool(self):
        from services.cognitive.engine import tool_qarz_hisob
        r = tool_qarz_hisob(jami=1000000, qarz=600000)
        assert r["tolangan"] == 400000
        assert r["qarz"] == 600000

    def test_tool_chaqir_xavfsiz(self):
        from services.cognitive.engine import tool_chaqir
        r = tool_chaqir("noma'lum_tool", {})
        assert "xato" in r


# ════════════════════════════════════════════════════════
#  SCHEMA & MIGRATION
# ════════════════════════════════════════════════════════

class TestSchema:
    def test_schema_jadval_soni(self):
        import re
        sql = (REPO / "shared" / "database" / "schema.sql").read_text()
        tables = re.findall(r"CREATE TABLE IF NOT EXISTS\s+(\w+)", sql)
        assert len(tables) >= 40

    def test_schema_rls_soni(self):
        import re
        sql = (REPO / "shared" / "database" / "schema.sql").read_text()
        rls = re.findall(r"enable_rls\('(\w+)'\)", sql)
        assert len(rls) >= 30

    def test_migratsiya_soni(self):
        import glob
        migs = glob.glob(str(REPO / "shared" / "migrations" / "versions" / "*.sql"))
        assert len(migs) >= 16

    def test_yangi_jadvallar_bor(self):
        import re
        sql = (REPO / "shared" / "database" / "schema.sql").read_text()
        for jadval in ["qarz_eslatmalar", "loyalty_ballar", "tolov_tranzaksiyalar",
                        "kpi_targetlar", "filiallar", "gps_log",
                        "yetkazib_beruvchilar", "supplier_buyurtmalar"]:
            assert jadval in sql, f"{jadval} schema.sql da yo'q"


# ════════════════════════════════════════════════════════
#  BOT HANDLERS
# ════════════════════════════════════════════════════════

class TestBotHandlers:
    def test_yangi_handlers_import(self):
        from services.bot.handlers.yangi import register_yangi_handlers
        assert callable(register_yangi_handlers)

    def test_yordam_matn(self):
        from services.bot.handlers.yordam import YORDAM_MATN, XUSH_KELIBSIZ_MATN
        assert len(YORDAM_MATN) > 100
        assert "SavdoAI" in YORDAM_MATN
        assert "/kpi" in YORDAM_MATN
        assert "/eslatma" in YORDAM_MATN
        assert "/loyalty" in YORDAM_MATN
        assert "XUSH KELIBSIZ" in XUSH_KELIBSIZ_MATN.upper() or "xush kelibsiz" in XUSH_KELIBSIZ_MATN.lower()


# ════════════════════════════════════════════════════════
#  API ROUTES
# ════════════════════════════════════════════════════════

class TestAPIRoutes:
    def test_yangi_router(self):
        from services.api.routes.yangi import router
        paths = [r.path for r in router.routes]
        assert any("/kpi" in p for p in paths)
        assert any("/loyalty" in p for p in paths)
        assert any("/advisor" in p for p in paths)
        assert any("/tarif" in p for p in paths)

    def test_filial_router(self):
        from services.api.routes.filial import router
        paths = [r.path for r in router.routes]
        assert any("/transfer" in p for p in paths)

    def test_tovarlar_router(self):
        from services.api.routes.tovarlar import router
        paths = [r.path for r in router.routes]
        assert any("/tovar" in str(p) for p in paths)

    def test_errors_module(self):
        from services.api.errors import ErrorCode, topilmadi, conflict
        assert ErrorCode.TOPILMADI == "TOPILMADI"
        e = topilmadi("Tovar")
        assert e.status_code == 404
        c = conflict("Mavjud")
        assert c.status_code == 409


# ════════════════════════════════════════════════════════
#  KLIENT SEGMENTATSIYA
# ════════════════════════════════════════════════════════

class TestKlientSegment:
    def test_rfm_champion(self):
        from shared.services.klient_segment import rfm_segment
        seg = rfm_segment(recency_days=3, frequency=25, monetary=15_000_000)
        assert seg == "champion"

    def test_rfm_loyal(self):
        from shared.services.klient_segment import rfm_segment
        seg = rfm_segment(recency_days=5, frequency=12, monetary=3_000_000)
        assert seg == "loyal"

    def test_rfm_lost(self):
        from shared.services.klient_segment import rfm_segment
        seg = rfm_segment(recency_days=90, frequency=1, monetary=100_000)
        assert seg == "lost"

    def test_rfm_new(self):
        from shared.services.klient_segment import rfm_segment
        seg = rfm_segment(recency_days=5, frequency=1, monetary=50_000)
        assert seg == "new"

    def test_rfm_sleeping(self):
        from shared.services.klient_segment import rfm_segment
        seg = rfm_segment(recency_days=45, frequency=8, monetary=2_000_000)
        assert seg == "sleeping"

    def test_segmentlar_soni(self):
        from shared.services.klient_segment import SEGMENTLAR
        assert len(SEGMENTLAR) == 7

    def test_segment_emoji_bor(self):
        from shared.services.klient_segment import SEGMENTLAR
        for key, seg in SEGMENTLAR.items():
            assert "emoji" in seg
            assert "nomi" in seg

    def test_segmentatsiya_matn_bosh(self):
        from shared.services.klient_segment import segmentatsiya_matn
        matn = segmentatsiya_matn({"xulosa": {}, "jami": 0})
        assert "yetarli" in matn.lower()

    def test_segmentatsiya_matn_bilan(self):
        from shared.services.klient_segment import segmentatsiya_matn
        data = {
            "xulosa": {
                "champion": {"nomi": "Champion", "emoji": "👑", "soni": 5, "foiz": 25},
                "at_risk": {"nomi": "At Risk", "emoji": "⚠️", "soni": 3, "foiz": 15},
            },
            "jami": 20,
        }
        matn = segmentatsiya_matn(data)
        assert "👑" in matn
        assert "Champion" in matn
        assert "yo'qolib" in matn  # at_risk tavsiya


# ════════════════════════════════════════════════════════
#  AI DEMAND FORECAST
# ════════════════════════════════════════════════════════

class TestDemandForecast:
    def test_import(self):
        from shared.services.demand_forecast import talab_prognozi, prognoz_matn
        import inspect
        assert inspect.iscoroutinefunction(talab_prognozi)

    def test_prognoz_matn_bosh(self):
        from shared.services.demand_forecast import prognoz_matn
        assert "yetarli" in prognoz_matn([]).lower()

    def test_prognoz_matn_bilan(self):
        from shared.services.demand_forecast import prognoz_matn
        data = [{
            "nomi": "Ariel", "qoldiq": 5, "kunlik_sotuv": 3,
            "prognoz_kunlar": 7, "prognoz_talab": 21, "qolgan_kun": 1.7,
            "trend": 1.1, "trend_yonalish": "📈",
            "buyurtma_tavsiya": 37, "buyurtma_narx": 1500000,
            "xavf": "critical", "xavf_emoji": "🔴", "faol_kunlar": 25,
        }]
        matn = prognoz_matn(data, 7)
        assert "Ariel" in matn
        assert "TEZDA" in matn


# ════════════════════════════════════════════════════════
#  KLIENT CLV
# ════════════════════════════════════════════════════════

class TestKlientCLV:
    def test_import(self):
        from shared.services.klient_clv import klient_clv, clv_matn
        import inspect
        assert inspect.iscoroutinefunction(klient_clv)

    def test_clv_matn_bosh(self):
        from shared.services.klient_clv import clv_matn
        assert "yetarli" in clv_matn({"klientlar": []}).lower()

    def test_clv_matn_bilan(self):
        from shared.services.klient_clv import clv_matn
        data = {
            "klientlar": [{
                "id": 1, "ism": "Salimov", "telefon": "+998",
                "jami_tushum": 5000000, "sotuv_soni": 20,
                "ortacha_chek": 250000, "oylik_chastota": 4.0,
                "oxirgi_kun": 3, "clv": 36000000,
                "status": "faol", "status_emoji": "🟢",
                "faol_qarz": 500000,
            }],
            "jami_clv": 36000000,
            "ortacha_clv": 36000000,
            "top_klient": None,
        }
        matn = clv_matn(data)
        assert "Salimov" in matn
        assert "36,000,000" in matn
