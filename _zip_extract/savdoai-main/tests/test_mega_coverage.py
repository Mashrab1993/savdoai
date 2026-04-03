"""
SAVDOAI v25.3.2 — MEGA COVERAGE TEST
TITAN + OCR + NLP + HISOB — barchasi pytest ichida
"""
import pytest, sys, re, glob, inspect
from decimal import Decimal
from pathlib import Path
REPO = Path(__file__).parent.parent
sys.path.insert(0, str(REPO))

# §1. NLP (28 test)
class TestNLP_Raqamlar:
    @pytest.mark.parametrize("txt,val", [
        ("bir",Decimal("1")),("ikki",Decimal("2")),("uch",Decimal("3")),
        ("besh",Decimal("5")),("o'n",Decimal("10")),("yuz",Decimal("100")),
        ("ming",Decimal("1000")),("o'ttiz besh",Decimal("35")),
        ("1 limon",Decimal("100000")),("3 limon",Decimal("300000")),
        ("yarim",Decimal("0.5")),("45000",Decimal("45000")),("0.5",Decimal("0.5")),
    ])
    def test_raqam(self, txt, val):
        from shared.utils.uzb_nlp import raqam_parse
        assert raqam_parse(txt) == val

class TestNLP_Sheva:
    def test_xorazm(self):
        from shared.utils.uzb_nlp import matn_normallashtir
        assert "qancha" in matn_normallashtir("kansha")
    def test_fargona(self):
        from shared.utils.uzb_nlp import matn_normallashtir
        assert "nima" in matn_normallashtir("nema")
    def test_qarz_nasiya(self):
        from shared.utils.uzb_nlp import qarz_bor_mi
        assert qarz_bor_mi("nasiyaga") is True
    def test_qarz_naqd(self):
        from shared.utils.uzb_nlp import qarz_bor_mi
        assert qarz_bor_mi("naqd oldi") is False

class TestNLP_Tojik:
    @pytest.mark.parametrize("inp,out", [
        ("yak","bir"),("sad","yuz"),("hazor","ming"),
        ("furoxt","sotdi"),("ovardam","keltirdim"),
        ("chor","to'rt"),("shash","olti"),("bist","yigirma"),
    ])
    def test_tojik(self, inp, out):
        from shared.utils.uzb_nlp import matn_normallashtir
        assert out in matn_normallashtir(inp)

# §2. HISOB (10 test)
class TestHisob:
    @pytest.mark.parametrize("m,n,b,ch,exp", [
        (10,50000,"dona",0,Decimal("500000")),
        (10,100000,"dona",10,Decimal("900000")),
        (5,20000,"dona",0,Decimal("100000")),
        (1,45000,"kg",0,Decimal("45000")),
        (10,100000,"dona",50,Decimal("500000")),
    ])
    def test_narx(self, m, n, b, ch, exp):
        from shared.utils.hisob import narx_hisob
        assert narx_hisob(m, n, b, ch) == exp
    def test_pul_500k(self):
        from shared.utils.hisob import pul
        assert "500,000" in pul(500000)
    def test_D_none(self):
        from shared.utils.hisob import D
        assert D(None) == Decimal("0")
    def test_D_str(self):
        from shared.utils.hisob import D
        assert D("45000") == Decimal("45000")

# §3. LOYALTY (10 test)
class TestLoyaltyMega:
    @pytest.mark.parametrize("s,b", [(0,0),(1000,1),(50000,50),(1000000,1000)])
    def test_ball(self, s, b):
        from shared.services.loyalty import ball_hisoblash
        assert ball_hisoblash(s) == b
    @pytest.mark.parametrize("b,n,ch", [(0,"Bronze",0),(100,"Silver",2),(500,"Gold",5),(2000,"Platinum",10)])
    def test_daraja(self, b, n, ch):
        from shared.services.loyalty import daraja_aniqla
        d = daraja_aniqla(b)
        assert d["nomi"] == n and d["chegirma_foiz"] == ch

# §4. OCR (47 test)
class TestOCR_Patterns:
    PATTERNS = [
        ("Duxi Royal 2×50000","Duxi Royal",2,50000,100000),
        ("K Kitob ten 2×42000","K Kitob",2,42000,84000),
        ("250 Karbon 10×6500","Karbon",10,6500,65000),
        ("Duxi Dubai pras 5x45000","Dubai",5,45000,225000),
        ("L-188-1 mint pomade 24×7500","L-188",24,7500,180000),
        ("Mabon misha pom 36×7200","Mabon",36,7200,259200),
        ("П-10×1450000","П",10,1450000,14500000),
        ("и-10×220000","и",10,220000,2200000),
        ("K suno sab 8×7000","suno",8,7000,56000),
        ("75 Nivea shaiba 5×23000","Nivea",5,23000,115000),
        ("150 Bati disk 11×12000","Bati",11,12000,132000),
        ("Sladus Bisraro 2kg 10×78000 780000","Sladus",10,78000,780000),
        ("Dollux 2kg 30×68000 2040000","Dollux",30,68000,2040000),
        ("Ariel 3kg 5x45000","Ariel",5,45000,225000),
        ("Persil gel 2L 3X52000","Persil",3,52000,156000),
    ]
    @pytest.mark.parametrize("txt,nomi,miqdor,narx,jami", PATTERNS)
    def test_pattern(self, txt, nomi, miqdor, narx, jami):
        from shared.services.ocr_processor import qator_parse
        r = qator_parse(txt)
        assert r is not None
        assert nomi.lower() in r["nomi"].lower()
        assert r["miqdor"] == miqdor and r["narx"] == narx and r["jami"] == jami

class TestOCR_Skip:
    SKIPS = ["Итого 85","ВСЕГО","Наименование","Кол-во","Цена","Сумма",
             "Отпустил","Принял","Доставщик","Товар сдал","───","━━━","К оплате"]
    @pytest.mark.parametrize("txt", SKIPS)
    def test_skip(self, txt):
        from shared.services.ocr_processor import qator_parse
        assert qator_parse(txt) is None

class TestOCR_Full:
    def test_bobir_rahim_10_tovar(self):
        from shared.services.ocr_processor import ocr_matn_parse
        r = ocr_matn_parse("Получатель: bunyod\nДата: 26.03.2026\nSladus 10×78000 780000\nDollux 30×68000 2040000\nAkvarel 5×120800 604000\nOrzu 5×90600 453000\nBiscuite 10×54400 544000\nRombik 5×47100 235500\nShodlik 5×47100 235500\nJelwels1 5×80600 403000\nJelwels2 5×80600 403000\nKolumbo 5×80600 403000\nДолг: 10000000")
        assert r["tovarlar_soni"] == 10
        assert r["jami_summa"] == 6101000
        assert all(t["miqdor"]*t["narx"]==t["jami"] for t in r["tovarlar"])
    def test_empty(self):
        from shared.services.ocr_processor import ocr_matn_parse
        assert ocr_matn_parse("")["tovarlar_soni"] == 0
    def test_tg_limit(self):
        from shared.services.ocr_processor import ocr_natija_matn
        d = {"tovarlar":[{"nomi":f"T{i}","miqdor":1,"narx":1000,"jami":1000,"jami_tekshirildi":False} for i in range(200)],"tovarlar_soni":200,"jami_summa":200000,"xatolar":[],"meta":{}}
        assert len(ocr_natija_matn(d)) < 4096
    @pytest.mark.parametrize("sep", ["x","X","×","х"])
    def test_x_format(self, sep):
        from shared.services.ocr_processor import qator_parse
        assert qator_parse(f"Test 5{sep}10000") is not None

# §5. TITAN — import + funksiya (31 test)
class TestTitan_Import:
    MODS = ["shared.services.ai_advisor","shared.services.demand_forecast","shared.services.klient_clv",
            "shared.services.klient_segment","shared.services.kpi_engine","shared.services.loyalty",
            "shared.services.subscription","shared.services.tolov_integratsiya","shared.services.gps_tracking",
            "shared.services.supplier_order","shared.services.qarz_eslatma","shared.services.ombor_prognoz",
            "shared.services.smart_notification","shared.services.smart_sale","shared.services.oylik_hisobot",
            "shared.services.voice_commands","shared.services.nakladnoy_parser","shared.services.nakladnoy_import",
            "shared.services.reestr_parser","shared.services.tp_analyzer","shared.services.ocr_processor"]
    @pytest.mark.parametrize("mod", MODS)
    def test_import(self, mod):
        __import__(mod)

class TestTitan_Cognitive:
    def test_tools(self):
        from services.cognitive.engine import TOOLS
        assert len(TOOLS) >= 7
    def test_narx(self):
        from services.cognitive.engine import tool_chaqir
        assert tool_chaqir("narx_hisob",{"miqdor":50,"narx":45000})["jami"] == 2250000
    def test_loyalty(self):
        from services.cognitive.engine import tool_chaqir
        r = tool_chaqir("loyalty_hisob",{"summa":500000})
        assert r["ball"]==500 and r["daraja"]=="Gold"

class TestTitan_Voice:
    CMDS = [("kpi","kpi"),("bonus ball","loyalty"),("prognoz","forecast"),("klient qiymati","clv"),
            ("tahlil","advisor"),("marshrut","gps"),("tarif","subscription"),("bugungi hisobot","report"),
            ("kam qolgan","stock"),("qarz eslatma","reminder"),("click to'lov","payment"),("saqlash","confirm")]
    @pytest.mark.parametrize("txt,exp", CMDS)
    def test_voice(self, txt, exp):
        from shared.services.voice_commands import detect_voice_command
        r = detect_voice_command(txt)
        assert r and r["action"]==exp

class TestTitan_GPS:
    def test_dist(self):
        from shared.services.gps_tracking import haversine
        assert 260 < haversine(41.3,69.2,39.65,66.96) < 280
    def test_zero(self):
        from shared.services.gps_tracking import haversine
        assert haversine(41.3,69.2,41.3,69.2) < 0.01

class TestTitan_Sub:
    def test_3(self):
        from shared.services.subscription import TARIFLAR
        assert len(TARIFLAR)==3
    def test_free(self):
        from shared.services.subscription import TARIFLAR
        assert TARIFLAR["boshlangich"]["narx_oylik"]==0
    def test_limit(self):
        from shared.services.subscription import limit_tekshir
        assert limit_tekshir({"sinov":True,"limitlar":{"tovar":50},"ishlatilgan":{"tovar":999}},"tovar")
        assert not limit_tekshir({"sinov":False,"limitlar":{"tovar":50},"ishlatilgan":{"tovar":50}},"tovar")

class TestTitan_Segment:
    def test_ch(self):
        from shared.services.klient_segment import rfm_segment
        assert rfm_segment(3,25,15e6)=="champion"
    def test_lost(self):
        from shared.services.klient_segment import rfm_segment
        assert rfm_segment(90,1,1e5)=="lost"
    def test_7(self):
        from shared.services.klient_segment import SEGMENTLAR
        assert len(SEGMENTLAR)==7

class TestTitan_Schema:
    def test_tables(self):
        sql = (REPO/"shared"/"database"/"schema.sql").read_text()
        assert len(re.findall(r"CREATE TABLE",sql)) >= 42
    def test_idx(self):
        sql = (REPO/"shared"/"database"/"schema.sql").read_text()
        assert len(re.findall(r"CREATE.*INDEX",sql)) >= 57
    def test_mig(self):
        assert len(glob.glob(str(REPO/"shared"/"migrations"/"versions"/"*.sql"))) >= 16

class TestTitan_API:
    def test_routes(self):
        from services.api.routes.yangi import router
        paths = [r.path for r in router.routes]
        for p in ["/kpi","/loyalty","/advisor","/tarif","/segment","/forecast","/clv"]:
            assert any(p in str(pp) for pp in paths)
    def test_bot(self):
        from services.bot.handlers.yangi import register_yangi_handlers
        assert callable(register_yangi_handlers)
    def test_yordam(self):
        from services.bot.handlers.yordam import YORDAM_MATN
        for c in ["/kpi","/tahlil","/prognoz","/clv"]:
            assert c in YORDAM_MATN
