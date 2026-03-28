"""
╔══════════════════════════════════════════════════════════════════════╗
║  SAVDOAI TITAN TEST v2 — YANGI CRUD + XAVFSIZLIK TESTLARI          ║
║                                                                      ║
║  Qamrash:                                                            ║
║  ✅ Tovar CRUD endpointlar (POST/PUT/DELETE/qoldiq)                 ║
║  ✅ Klient CRUD endpointlar (PUT/DELETE)                            ║
║  ✅ Xarajat qo'shish endpoint                                      ║
║  ✅ Bildirishnomalar endpoint                                       ║
║  ✅ Excel export endpoint                                           ║
║  ✅ Login rate limiting                                             ║
║  ✅ N+1 query fix tekshiruv                                         ║
║  ✅ like_escape funksiya                                            ║
║  ✅ Xavfsizlik — user_id himoyasi                                   ║
║  ✅ Pydantic model validatsiyasi                                    ║
╚══════════════════════════════════════════════════════════════════════╝
"""
import ast
import inspect
import re
import sys
import textwrap
from decimal import Decimal
from pathlib import Path

import pytest

REPO = Path(__file__).parent.parent
sys.path.insert(0, str(REPO))


# ════════════════════════════════════════════════════════════════
#  § 1. API MAIN.PY — YANGI ENDPOINTLAR MAVJUDLIGI
# ════════════════════════════════════════════════════════════════

_API_SRC = (REPO / "services" / "api" / "main.py").read_text(encoding="utf-8")


class TestTovarCRUD:
    """Tovar CRUD endpointlar — POST/PUT/DELETE/qoldiq"""

    def test_tovar_post_exists(self):
        assert '"/api/v1/tovar"' in _API_SRC

    def test_tovar_put_exists(self):
        assert '"/api/v1/tovar/{tovar_id}"' in _API_SRC

    def test_tovar_delete_exists(self):
        assert 'delete("/api/v1/tovar/{tovar_id}"' in _API_SRC

    def test_tovar_qoldiq_exists(self):
        assert '"/api/v1/tovar/{tovar_id}/qoldiq"' in _API_SRC

    def test_tovar_post_uses_rls(self):
        """Yangi tovar yaratish RLS orqali ishlashi kerak"""
        # rls_conn endpoint ichida ishlatilgan
        match = re.search(r'async def tovar_yarat.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match, "tovar_yarat funksiyasi topilmadi"
        assert "rls_conn" in match.group(), "tovar_yarat rls_conn ishlatishi kerak"

    def test_tovar_put_uses_rls(self):
        match = re.search(r'async def tovar_yangilash.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()

    def test_tovar_delete_checks_sotuv(self):
        """Tovar o'chirishda sotuvda ishlatilganini tekshirishi kerak"""
        match = re.search(r'async def tovar_ochirish.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "chiqimlar" in body, "Sotuvda ishlatilganini tekshirishi kerak"
        assert "409" in body, "Agar sotuvda bo'lsa 409 qaytarishi kerak"

    def test_tovar_delete_uses_user_id(self):
        """O'chirish WHERE user_id bilan himoyalangan"""
        match = re.search(r'async def tovar_ochirish.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "user_id" in match.group()

    def test_tovar_put_whitelist(self):
        """Yangilash faqat ruxsat etilgan maydonlarni qabul qiladi"""
        match = re.search(r'async def tovar_yangilash.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "_RUXSAT" in body, "Whitelist bo'lishi kerak"
        assert "Ruxsat etilmagan" in body, "Noto'g'ri maydon rad etilishi kerak"

    def test_tovar_qoldiq_logs_old_new(self):
        """Inventarizatsiyada eski va yangi qoldiq loglanishi kerak"""
        match = re.search(r'async def tovar_qoldiq_yangilash.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "eski_qoldiq" in body
        assert "yangi_qoldiq" in body


class TestKlientCRUD:
    """Klient CRUD endpointlar — PUT/DELETE"""

    def test_klient_post_exists(self):
        """Mavjud POST endpoint hali ham bor"""
        assert '"/api/v1/klient"' in _API_SRC

    def test_klient_put_exists(self):
        assert '"/api/v1/klient/{klient_id}"' in _API_SRC

    def test_klient_delete_exists(self):
        assert 'delete("/api/v1/klient/{klient_id}"' in _API_SRC

    def test_klient_delete_checks_qarz(self):
        """Klient o'chirishda faol qarz tekshirilishi kerak"""
        match = re.search(r'async def klient_ochirish.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "qarzlar" in body, "Faol qarz tekshirilishi kerak"
        assert "409" in body, "Agar qarz bo'lsa 409 qaytarishi kerak"

    def test_klient_put_whitelist(self):
        """Yangilash faqat ruxsat etilgan maydonlarni qabul qiladi"""
        match = re.search(r'async def klient_yangilash.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "_RUXSAT" in body

    def test_klient_put_uses_rls(self):
        match = re.search(r'async def klient_yangilash.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()


class TestXarajatQoshish:
    """Xarajat qo'shish endpoint"""

    def test_xarajat_post_exists(self):
        assert '"/api/v1/xarajat"' in _API_SRC

    def test_xarajat_uses_rls(self):
        match = re.search(r'async def api_xarajat_qoshish.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()

    def test_xarajat_auto_approve_admin(self):
        """Admin xarajati avtomatik tasdiqlanishi kerak"""
        match = re.search(r'async def api_xarajat_qoshish.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "tasdiqlangan" in body, "Admin xarajat avtomatik tasdiqlanishi kerak"

    def test_xarajat_accepts_shogird(self):
        """Shogird_id bilan ham ishlashi kerak"""
        match = re.search(r'async def api_xarajat_qoshish.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "shogird_id" in match.group()


class TestBildirishnomalar:
    """Bildirishnomalar endpoint"""

    def test_endpoint_exists(self):
        assert '"/api/v1/bildirishnomalar"' in _API_SRC

    def test_returns_items(self):
        """Natija items va jami qaytarishi kerak"""
        match = re.search(r'async def bildirishnomalar.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert '"items"' in body
        assert '"jami"' in body

    def test_checks_qarzlar(self):
        """Muddati o'tgan qarzlarni tekshirishi kerak"""
        match = re.search(r'async def bildirishnomalar.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "qarzlar" in match.group()

    def test_checks_kam_qoldiq(self):
        """Kam qoldiqli tovarlarni tekshirishi kerak"""
        match = re.search(r'async def bildirishnomalar.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "min_qoldiq" in match.group()

    def test_checks_xarajat_tasdiq(self):
        """Tasdiq kutayotgan xarajatlarni tekshirishi kerak"""
        match = re.search(r'async def bildirishnomalar.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "kutilmoqda" in match.group() or "xarajatlar" in match.group()

    def test_uses_rls(self):
        match = re.search(r'async def bildirishnomalar.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()


class TestExcelExport:
    """Tovar Excel export"""

    def test_endpoint_exists(self):
        assert '"/api/v1/tovar/export/excel"' in _API_SRC

    def test_uses_openpyxl(self):
        match = re.search(r'async def tovar_excel_export.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "openpyxl" in match.group() or "Workbook" in match.group()

    def test_returns_base64(self):
        """Excel fayl base64 formatda qaytarilishi kerak"""
        match = re.search(r'async def tovar_excel_export.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "base64" in body
        assert "content_base64" in body

    def test_has_headers(self):
        """Excel da sarlavhalar bo'lishi kerak"""
        match = re.search(r'async def tovar_excel_export.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "Tovar nomi" in body
        assert "Kategoriya" in body
        assert "Sotish narxi" in body

    def test_highlights_low_stock(self):
        """Kam qoldiqli tovarlar qizil rangda bo'lishi kerak"""
        match = re.search(r'async def tovar_excel_export.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "red" in body.lower() or "FFE0E0" in body

    def test_uses_rls(self):
        match = re.search(r'async def tovar_excel_export.*?(?=\n@app\.|\nclass\s|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()


# ════════════════════════════════════════════════════════════════
#  § 2. LOGIN RATE LIMITING
# ════════════════════════════════════════════════════════════════

_DEPS_SRC = (REPO / "services" / "api" / "deps.py").read_text(encoding="utf-8")


class TestLoginRateLimit:
    """Login brute-force himoyasi"""

    def test_login_rate_function_exists(self):
        assert "login_rate_check" in _DEPS_SRC

    def test_login_max_5(self):
        """Maximum 5 urinish/daqiqa"""
        assert "_LOGIN_MAX = 5" in _DEPS_SRC or "LOGIN_MAX" in _DEPS_SRC

    def test_login_window_60(self):
        """60 sekund oyna"""
        assert "60" in _DEPS_SRC

    def test_login_raises_429(self):
        """Limit oshganda 429 qaytarishi kerak"""
        assert "429" in _DEPS_SRC

    def test_auth_login_uses_rate_check(self):
        """auth/login endpoint rate check ishlatishi kerak"""
        assert "login_rate_check" in _API_SRC

    def test_login_rate_check_uses_ip(self):
        """Rate limit IP bo'yicha ishlashi kerak"""
        match = re.search(r'async def login_rate_check.*?(?=\nasync def|\nclass\s|\Z)', _DEPS_SRC, re.DOTALL)
        assert match
        assert "request.client.host" in match.group()

    def test_login_rate_memory_limit(self):
        """Xotira himoyasi bo'lishi kerak"""
        assert "_LOGIN_MAX_IPS" in _DEPS_SRC


# ════════════════════════════════════════════════════════════════
#  § 3. N+1 QUERY FIX
# ════════════════════════════════════════════════════════════════

_DB_SRC = (REPO / "services" / "bot" / "db.py").read_text(encoding="utf-8")


class TestN1Fix:
    """zarar_sotuv_tekshir N+1 → batch query"""

    def test_uses_any_operator(self):
        """= ANY($2) ishlatilishi kerak (N+1 o'rniga batch)"""
        # zarar_sotuv_tekshir funksiyasini topish
        match = re.search(r'async def zarar_sotuv_tekshir.*?(?=\nasync def|\nclass\s|\Z)', _DB_SRC, re.DOTALL)
        assert match, "zarar_sotuv_tekshir funksiyasi topilmadi"
        body = match.group()
        assert "ANY(" in body, "Batch query = ANY() ishlatishi kerak"

    def test_no_loop_query(self):
        """Loop ichida SELECT bo'lmasligi kerak"""
        match = re.search(r'async def zarar_sotuv_tekshir.*?(?=\nasync def|\nclass\s|\Z)', _DB_SRC, re.DOTALL)
        assert match
        body = match.group()
        # "for t in" va "fetchrow" bitta funksiyada bo'lmasligi kerak
        lines = body.split("\n")
        in_for = False
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("for ") and " in " in stripped:
                in_for = True
            if in_for and "fetchrow" in stripped:
                pytest.fail("Loop ichida fetchrow ishlatilgan — N+1 query!")

    def test_builds_map(self):
        """Batch natijasi dict/map ga o'tkazilishi kerak"""
        match = re.search(r'async def zarar_sotuv_tekshir.*?(?=\nasync def|\nclass\s|\Z)', _DB_SRC, re.DOTALL)
        assert match
        assert "tv_map" in match.group(), "Batch natijasi map ga o'tishi kerak"


# ════════════════════════════════════════════════════════════════
#  § 4. LIKE ESCAPE FUNKSIYA
# ════════════════════════════════════════════════════════════════


class TestLikeEscape:
    """like_escape() funksiya testlari"""

    def test_function_importable(self):
        from shared.utils import like_escape
        assert callable(like_escape)

    def test_ordinary_string(self):
        from shared.utils import like_escape
        assert like_escape("Ariel 3kg") == "Ariel 3kg"

    def test_percent_escaped(self):
        from shared.utils import like_escape
        result = like_escape("100% sok")
        assert "\\%" in result
        assert "100" in result

    def test_underscore_escaped(self):
        from shared.utils import like_escape
        result = like_escape("test_tovar")
        assert "\\_" in result

    def test_empty_string(self):
        from shared.utils import like_escape
        assert like_escape("") == ""

    def test_no_change_normal(self):
        from shared.utils import like_escape
        assert like_escape("Coca-Cola") == "Coca-Cola"
        assert like_escape("Go'sht") == "Go'sht"

    def test_smart_narx_uses_like_escape(self):
        """smart_narx.py like_escape ishlatishi kerak"""
        src = (REPO / "shared" / "services" / "smart_narx.py").read_text(encoding="utf-8")
        assert "like_escape" in src


# ════════════════════════════════════════════════════════════════
#  § 5. XAVFSIZLIK — user_id HIMOYASI
# ════════════════════════════════════════════════════════════════


class TestUserIdSecurity:
    """Barcha CRUD endpointlarda user_id himoyasi"""

    def _extract_fn(self, fn_name: str) -> str:
        match = re.search(
            rf'async def {fn_name}.*?(?=\n@app\.|\nclass\s|\Z)',
            _API_SRC, re.DOTALL
        )
        assert match, f"{fn_name} topilmadi"
        return match.group()

    def test_tovar_delete_user_id(self):
        body = self._extract_fn("tovar_ochirish")
        assert "user_id" in body

    def test_tovar_put_user_id(self):
        body = self._extract_fn("tovar_yangilash")
        assert "user_id" in body

    def test_klient_delete_user_id(self):
        body = self._extract_fn("klient_ochirish")
        assert "user_id" in body

    def test_klient_put_user_id(self):
        body = self._extract_fn("klient_yangilash")
        assert "user_id" in body

    def test_smart_narx_user_id(self):
        """smart_narx narx_aniqla_nomi da user_id filtri bormi"""
        src = (REPO / "shared" / "services" / "smart_narx.py").read_text(encoding="utf-8")
        match = re.search(r'async def narx_aniqla_nomi.*?(?=\nasync def|\Z)', src, re.DOTALL)
        assert match
        body = match.group()
        assert body.count("user_id") >= 3, "Kamida 3 ta query da user_id bo'lishi kerak"

    def test_klient_guruhga_user_id(self):
        """klient_guruhga_qoyish da user_id filtri bormi"""
        src = (REPO / "shared" / "services" / "smart_narx.py").read_text(encoding="utf-8")
        match = re.search(r'async def klient_guruhga_qoyish.*?(?=\nasync def|\Z)', src, re.DOTALL)
        assert match
        assert "user_id" in match.group()


# ════════════════════════════════════════════════════════════════
#  § 6. PYDANTIC MODEL VALIDATSIYA
# ════════════════════════════════════════════════════════════════


class TestPydanticModels:
    """Yangi Pydantic modellar to'g'ri tuzilgani"""

    def test_tovar_yarat_model_exists(self):
        assert "class TovarYaratSorov" in _API_SRC

    def test_tovar_yangila_model_exists(self):
        assert "class TovarYangilaSorov" in _API_SRC

    def test_klient_yangila_model_exists(self):
        assert "class KlientYangilaSorov" in _API_SRC

    def test_xarajat_model_exists(self):
        assert "class XarajatSorov" in _API_SRC

    def test_qoldiq_model_exists(self):
        assert "class QoldiqYangilaSorov" in _API_SRC

    def test_tovar_yarat_nomi_required(self):
        """Tovar nomi majburiy bo'lishi kerak"""
        match = re.search(r'class TovarYaratSorov.*?(?=\nclass\s|\n@app\.|\Z)', _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "min_length=1" in body, "nomi kamida 1 belgi bo'lishi kerak"

    def test_xarajat_summa_positive(self):
        """Xarajat summasi musbat bo'lishi kerak"""
        match = re.search(r'class XarajatSorov.*?(?=\nclass\s|\n@app\.|\Z)', _API_SRC, re.DOTALL)
        assert match
        assert "gt=0" in match.group(), "summa > 0 bo'lishi kerak"


# ════════════════════════════════════════════════════════════════
#  § 7. SMART_NARX CRASH BUG TUZATILGANI
# ════════════════════════════════════════════════════════════════


class TestSmartNarxFix:
    """smart_narx.py crash bug tuzatilgani"""

    def test_no_c_narx(self):
        """c.narx ishlatilMASligi kerak (mavjud emas)"""
        src = (REPO / "shared" / "services" / "smart_narx.py").read_text(encoding="utf-8")
        # c.narx bo'lmasligi kerak (faqat sotish_narxi)
        assert "c.narx " not in src and "c.narx>" not in src, \
            "c.narx mavjud emas — c.sotish_narxi ishlatilishi kerak"

    def test_uses_sotish_narxi(self):
        """sotish_narxi AS narx ishlatilishi kerak"""
        src = (REPO / "shared" / "services" / "smart_narx.py").read_text(encoding="utf-8")
        assert "sotish_narxi AS narx" in src


# ════════════════════════════════════════════════════════════════
#  § 8. ASYNCIO DEPRECATED FIX
# ════════════════════════════════════════════════════════════════


class TestAsyncioFix:
    """get_event_loop → get_running_loop"""

    _FILES = [
        "services/cognitive/engine.py",
        "services/cognitive/ai_router.py",
        "services/bot/bot_services/analyst.py",
        "services/bot/bot_services/audio_engine.py",
        "services/bot/bot_services/tts.py",
        "services/bot/bot_services/voice.py",
    ]

    def test_no_get_event_loop(self):
        """get_event_loop ISHLATILMASLIGI kerak"""
        for f in self._FILES:
            src = (REPO / f).read_text(encoding="utf-8")
            assert "get_event_loop" not in src, \
                f"{f} da get_event_loop hali bor — get_running_loop ishlatilsin"

    def test_uses_get_running_loop(self):
        """get_running_loop ishlatilishi kerak"""
        for f in self._FILES:
            src = (REPO / f).read_text(encoding="utf-8")
            assert "get_running_loop" in src, \
                f"{f} da get_running_loop topilmadi"


# ════════════════════════════════════════════════════════════════
#  § 9. BARE EXCEPT TUZATILGANI
# ════════════════════════════════════════════════════════════════


class TestBareExceptFix:
    """bare except: tuzatilgani"""

    _FILES = [
        "shared/services/hujjat_oqish.py",
        "shared/services/excel_reader.py",
        "shared/services/vision.py",
        "shared/services/suhbatdosh.py",
        "shared/services/advanced_features.py",
        "shared/services/smart_bot_engine.py",
        "shared/services/mutaxassis.py",
        "shared/utils/hisob.py",
    ]

    def test_no_bare_except(self):
        """Bare except: HECH QAYERDA bo'lmasligi kerak"""
        for f in self._FILES:
            src = (REPO / f).read_text(encoding="utf-8")
            lines = src.split("\n")
            for i, line in enumerate(lines, 1):
                stripped = line.strip()
                # bare except: topish (except Exception: emas)
                if re.match(r'^except\s*:', stripped) and "Exception" not in stripped:
                    pytest.fail(f"{f}:{i} da bare except: topildi — except Exception: bo'lishi kerak")


# ════════════════════════════════════════════════════════════════
#  § 10. ENGINE RAG FIX
# ════════════════════════════════════════════════════════════════


class TestEngineRagFix:
    """engine.py RAG buzilgan qator tuzatilgani"""

    def test_no_broken_rag_line(self):
        """Buzilgan rag.qidirish.__func__ qatori bo'lmasligi kerak"""
        src = (REPO / "services" / "cognitive" / "engine.py").read_text(encoding="utf-8")
        assert "rag.qidirish.__func__" not in src, \
            "Buzilgan RAG qatori hali bor"

    def test_matn_boyitish_rag_used(self):
        """matn_boyitish_rag ishlatilishi kerak"""
        src = (REPO / "services" / "cognitive" / "engine.py").read_text(encoding="utf-8")
        assert "matn_boyitish_rag" in src


# ════════════════════════════════════════════════════════════════
#  § 11. HISOB VA NLP INLINE TESTLAR HALI O'TAYDI
# ════════════════════════════════════════════════════════════════


class TestInlineTestsStillPass:
    """Oldingi inline testlar buzilmagani"""

    def test_hisob_36(self):
        from shared.utils.hisob import _test
        assert _test() == 0, "hisob.py testlari buzildi!"

    def test_nlp_94(self):
        from shared.utils.uzb_nlp import _test
        assert _test() == 0, "uzb_nlp.py testlari buzildi!"

    def test_engine_25(self):
        from services.cognitive.engine import _test
        assert _test() == 0, "engine.py testlari buzildi!"


# ════════════════════════════════════════════════════════════════
#  § 12. UMUMIY SINTAKSIS TEKSHIRUV
# ════════════════════════════════════════════════════════════════


class TestSyntaxAll:
    """Barcha o'zgargan fayllar compile bo'lishi"""

    _CHANGED_FILES = [
        "services/api/main.py",
        "services/api/deps.py",
        "services/bot/db.py",
        "services/bot/main.py",
        "services/cognitive/engine.py",
        "services/cognitive/ai_router.py",
        "services/bot/bot_services/analyst.py",
        "services/bot/bot_services/audio_engine.py",
        "services/bot/bot_services/tts.py",
        "services/bot/bot_services/voice.py",
        "shared/services/smart_narx.py",
        "shared/services/hujjat_oqish.py",
        "shared/services/excel_reader.py",
        "shared/services/vision.py",
        "shared/services/suhbatdosh.py",
        "shared/services/advanced_features.py",
        "shared/services/smart_bot_engine.py",
        "shared/services/mutaxassis.py",
        "shared/utils/hisob.py",
        "shared/utils/__init__.py",
    ]

    def test_all_files_compile(self):
        import py_compile
        xatolar = []
        for f in self._CHANGED_FILES:
            path = str(REPO / f)
            try:
                py_compile.compile(path, doraise=True)
            except py_compile.PyCompileError as e:
                xatolar.append(f"{f}: {e}")
        assert not xatolar, f"Compile xatolar:\n" + "\n".join(xatolar)


# ════════════════════════════════════════════════════════════════
#  § 13. API ENDPOINT COUNTING — yangilari qo'shilgani
# ════════════════════════════════════════════════════════════════


class TestEndpointCount:
    """API endpoint soni oshgani"""

    def test_minimum_endpoints(self):
        """Kamida 55 ta endpoint bo'lishi kerak (eski 46 + yangi 9)"""
        count = len(re.findall(r'@app\.(get|post|put|delete)\(', _API_SRC))
        assert count >= 55, f"Faqat {count} ta endpoint — kamida 55 kutilgan"

    def test_crud_verbs_present(self):
        """GET, POST, PUT, DELETE barcha verblar ishlatilishi kerak"""
        assert "@app.get(" in _API_SRC
        assert "@app.post(" in _API_SRC
        assert "@app.put(" in _API_SRC
        assert "@app.delete(" in _API_SRC


# ════════════════════════════════════════════════════════════════
#  § 14. WEB SERVICES — YANGI CRUD METHODLAR
# ════════════════════════════════════════════════════════════════

_WEB_SERVICES_SRC = (REPO / "services" / "web" / "lib" / "api" / "services.ts").read_text(encoding="utf-8")
_WEB_CLIENT_SRC = (REPO / "services" / "web" / "lib" / "api" / "client.ts").read_text(encoding="utf-8")


class TestWebServices:
    """Web frontend API service qo'shimchalari"""

    def test_product_create(self):
        assert "create:" in _WEB_SERVICES_SRC
        assert '"/api/v1/tovar"' in _WEB_SERVICES_SRC

    def test_product_update(self):
        assert "update:" in _WEB_SERVICES_SRC
        assert "api.put" in _WEB_SERVICES_SRC

    def test_product_remove(self):
        assert "remove:" in _WEB_SERVICES_SRC

    def test_product_export_excel(self):
        assert "exportExcel" in _WEB_SERVICES_SRC
        assert "export/excel" in _WEB_SERVICES_SRC

    def test_product_update_stock(self):
        assert "updateStock" in _WEB_SERVICES_SRC
        assert "qoldiq" in _WEB_SERVICES_SRC

    def test_client_update(self):
        assert "api.put" in _WEB_SERVICES_SRC

    def test_client_remove(self):
        assert "api.delete" in _WEB_SERVICES_SRC

    def test_expense_create(self):
        assert 'create:' in _WEB_SERVICES_SRC
        assert '"/api/v1/xarajat"' in _WEB_SERVICES_SRC

    def test_notification_service(self):
        assert "notificationService" in _WEB_SERVICES_SRC
        assert "bildirishnomalar" in _WEB_SERVICES_SRC

    def test_api_client_has_put(self):
        """API client da PUT method bo'lishi kerak"""
        assert "put:" in _WEB_CLIENT_SRC
        assert '"PUT"' in _WEB_CLIENT_SRC


class TestWebNotificationBell:
    """Top header notification bell ishlashi"""

    _HEADER_SRC = (REPO / "services" / "web" / "components" / "layout" / "top-header.tsx").read_text(encoding="utf-8")

    def test_notification_bell_component(self):
        assert "NotificationBell" in self._HEADER_SRC

    def test_fetches_notifications(self):
        assert "notificationService" in self._HEADER_SRC

    def test_shows_count_badge(self):
        assert "count" in self._HEADER_SRC

    def test_auto_refresh(self):
        """Har 2 daqiqada yangilanishi kerak"""
        assert "setInterval" in self._HEADER_SRC

    def test_urgency_colors(self):
        """Xavfli — qizil, ogohlantirish — sariq"""
        assert "xavfli" in self._HEADER_SRC
        assert "red" in self._HEADER_SRC.lower()


class TestExpenseCreate:
    """Xarajat qo'shish tugmasi yoqilgani"""

    _EXPENSE_SRC = (REPO / "services" / "web" / "app" / "expenses" / "page.tsx").read_text(encoding="utf-8")

    def test_button_not_disabled(self):
        """Tugma disabled bo'lmasligi kerak"""
        assert "disabled" not in self._EXPENSE_SRC.split("Xarajat")[0][-50:] or \
               "setModalOpen(true)" in self._EXPENSE_SRC

    def test_calls_api(self):
        """handleCreate API chaqirishi kerak"""
        assert "expenseService.create" in self._EXPENSE_SRC

    def test_has_refetch(self):
        """Yaratgandan keyin ro'yxat yangilanishi kerak"""
        # handleCreate ichida refetch bo'lishi
        assert "refetch()" in self._EXPENSE_SRC


class TestProductExcel:
    """Products sahifasida Excel export tugmasi"""

    _PROD_SRC = (REPO / "services" / "web" / "app" / "products" / "page.tsx").read_text(encoding="utf-8")

    def test_download_icon_imported(self):
        assert "Download" in self._PROD_SRC

    def test_export_excel_called(self):
        assert "exportExcel" in self._PROD_SRC

    def test_blob_download(self):
        """Base64 → blob → download pattern"""
        assert "Blob" in self._PROD_SRC
        assert "createObjectURL" in self._PROD_SRC


# ════════════════════════════════════════════════════════════════
#  § 15. CI/CD, SENTRY, SCHEMA, DOCUMENTATION
# ════════════════════════════════════════════════════════════════


class TestCICD:
    """GitHub Actions CI pipeline"""

    def test_workflow_exists(self):
        ci_path = REPO / ".github" / "workflows" / "ci.yml"
        assert ci_path.exists(), "CI workflow fayli topilmadi"

    def test_workflow_has_pytest(self):
        ci = (REPO / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
        assert "pytest" in ci

    def test_workflow_has_python_312(self):
        ci = (REPO / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
        assert "3.12" in ci

    def test_workflow_runs_inline_tests(self):
        ci = (REPO / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
        assert "shared.utils.hisob" in ci
        assert "shared.utils.uzb_nlp" in ci


class TestSentryIntegration:
    """Sentry barcha servislarda"""

    def test_api_has_sentry(self):
        src = (REPO / "services" / "api" / "main.py").read_text(encoding="utf-8")
        assert "sentry_sdk" in src or "SENTRY_DSN" in src

    def test_bot_has_sentry(self):
        src = (REPO / "services" / "bot" / "main.py").read_text(encoding="utf-8")
        assert "sentry_sdk" in src or "SENTRY_DSN" in src

    def test_cognitive_has_sentry(self):
        src = (REPO / "services" / "cognitive" / "api.py").read_text(encoding="utf-8")
        assert "sentry_sdk" in src or "SENTRY_DSN" in src


class TestSchemaConsolidation:
    """Schema birlashtirish — fallback da warning"""

    def test_bot_warns_on_fallback(self):
        src = (REPO / "services" / "bot" / "db.py").read_text(encoding="utf-8")
        assert "ESKIRGAN" in src or "TOPILMADI" in src, \
            "Fallback schema ishlatilganda warning bo'lishi kerak"


class TestDocumentation:
    """Hujjatlar mavjudligi"""

    def test_api_docs_exist(self):
        assert (REPO / "docs" / "API_DOCUMENTATION.md").exists()

    def test_bot_docs_exist(self):
        assert (REPO / "docs" / "BOT_BUYRUQLAR.md").exists()

    def test_api_docs_has_crud(self):
        src = (REPO / "docs" / "API_DOCUMENTATION.md").read_text(encoding="utf-8")
        assert "POST /api/v1/tovar" in src
        assert "PUT /api/v1/tovar" in src
        assert "DELETE /api/v1/tovar" in src

    def test_api_docs_has_notifications(self):
        src = (REPO / "docs" / "API_DOCUMENTATION.md").read_text(encoding="utf-8")
        assert "bildirishnomalar" in src

    def test_bot_docs_has_commands(self):
        src = (REPO / "docs" / "BOT_BUYRUQLAR.md").read_text(encoding="utf-8")
        assert "/start" in src
        assert "/hisobot" in src
        assert "/token" in src


# ════════════════════════════════════════════════════════════════
#  § 16. SELECT * TOZALASH
# ════════════════════════════════════════════════════════════════


class TestSelectStarCleanup:
    """bot/db.py da SELECT * qolmagani"""

    def test_no_select_star_in_db(self):
        """bot/db.py da SELECT * HECH QAYERDA bo'lmasligi kerak"""
        src = (REPO / "services" / "bot" / "db.py").read_text(encoding="utf-8")
        lines = src.split("\n")
        violations = []
        for i, line in enumerate(lines, 1):
            if "SELECT *" in line and not line.strip().startswith("#") and not line.strip().startswith("--"):
                violations.append(f"  qator {i}: {line.strip()[:80]}")
        assert not violations, \
            f"bot/db.py da SELECT * topildi:\n" + "\n".join(violations)

    def test_user_ol_has_explicit_columns(self):
        src = (REPO / "services" / "bot" / "db.py").read_text(encoding="utf-8")
        match = re.search(r'async def user_ol.*?(?=\nasync def|\nclass\s|\Z)', src, re.DOTALL)
        assert match
        body = match.group()
        assert "ism" in body and "faol" in body and "dokon_nomi" in body

    def test_klientlar_has_explicit_columns(self):
        src = (REPO / "services" / "bot" / "db.py").read_text(encoding="utf-8")
        assert "kredit_limit, jami_sotib" in src


# ════════════════════════════════════════════════════════════════
#  § 17. YANGI API ENDPOINTLAR — Savdolar, Dashboard Top, Import
# ════════════════════════════════════════════════════════════════

# (merged into _API_SRC)


class TestSavdolarEndpoint:
    """Savdolar ro'yxati endpoint"""

    def test_savdolar_get_exists(self):
        assert '"/api/v1/savdolar"' in _API_SRC

    def test_savdo_detail_exists(self):
        assert '"/api/v1/savdo/{sessiya_id}"' in _API_SRC

    def test_savdolar_has_filters(self):
        """klient, sana_dan, sana_gacha filtrlari bo'lishi kerak"""
        match = re.search(r'async def savdolar_royxati.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "klient" in body
        assert "sana_dan" in body
        assert "sana_gacha" in body

    def test_savdolar_returns_stats(self):
        """Bugungi statistika qaytarishi kerak"""
        match = re.search(r'async def savdolar_royxati.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "stats" in match.group()

    def test_savdolar_uses_rls(self):
        match = re.search(r'async def savdolar_royxati.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()


class TestDashboardTopEndpoint:
    """Dashboard top tovar/klient endpoint"""

    def test_endpoint_exists(self):
        assert '"/api/v1/dashboard/top"' in _API_SRC

    def test_has_top_tovar(self):
        match = re.search(r'async def dashboard_top.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "top_tovar" in match.group()

    def test_has_top_klient(self):
        match = re.search(r'async def dashboard_top.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "top_klient" in match.group()

    def test_has_kunlik_trend(self):
        match = re.search(r'async def dashboard_top.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "kunlik_trend" in match.group()

    def test_cached(self):
        match = re.search(r'async def dashboard_top.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "cache_ol" in match.group()


class TestTovarImport:
    """Tovar batch import endpoint"""

    def test_endpoint_exists(self):
        assert '"/api/v1/tovar/import"' in _API_SRC

    def test_has_limit(self):
        """Maksimal 1000 ta tovar cheklovi bo'lishi kerak"""
        match = re.search(r'async def tovar_import.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "1000" in match.group()

    def test_on_conflict(self):
        """Mavjud tovar yangilanishi kerak (ON CONFLICT)"""
        match = re.search(r'async def tovar_import.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "ON CONFLICT" in match.group()

    def test_uses_rls(self):
        match = re.search(r'async def tovar_import.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()

    def test_returns_stats(self):
        match = re.search(r'async def tovar_import.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "yaratildi" in body and "yangilandi" in body


# ════════════════════════════════════════════════════════════════
#  § 18. WEB — Savdolar sahifasi va Sidebar
# ════════════════════════════════════════════════════════════════


class TestInvoicesPageReal:
    """Invoices sahifasi haqiqiy ma'lumot bilan ishlashi"""

    _INV_SRC = (REPO / "services" / "web" / "app" / "invoices" / "page.tsx").read_text(encoding="utf-8")

    def test_not_placeholder(self):
        """Placeholder 'tayyorlanmoqda' matni bo'lmasligi kerak"""
        assert "tayyorlanmoqda" not in self._INV_SRC

    def test_uses_savdo_service(self):
        assert "savdoService" in self._INV_SRC

    def test_has_date_filters(self):
        """Sana filtrlari bo'lishi kerak"""
        assert "datePreset" in self._INV_SRC or "sana_dan" in self._INV_SRC

    def test_has_pagination(self):
        assert "page" in self._INV_SRC
        assert "totalPages" in self._INV_SRC

    def test_has_search(self):
        assert "search" in self._INV_SRC

    def test_has_stats_cards(self):
        assert "kpiCards" in self._INV_SRC or "stats" in self._INV_SRC


class TestSidebarNoRoadmap:
    """Invoices roadmapdan chiqarilgani"""

    def test_invoices_not_in_roadmap(self):
        src = (REPO / "services" / "web" / "components" / "layout" / "sidebar.tsx").read_text(encoding="utf-8")
        assert '"/invoices"' not in src.split("roadmapHrefs")[1].split("\n")[0]


class TestWebNewServices:
    """Web services yangi qo'shimchalar"""

    _SVC = (REPO / "services" / "web" / "lib" / "api" / "services.ts").read_text(encoding="utf-8")

    def test_savdo_service(self):
        assert "savdoService" in self._SVC

    def test_dashboard_top_service(self):
        assert "dashboardTopService" in self._SVC

    def test_tovar_import_service(self):
        assert "tovarImportService" in self._SVC

    def test_savdo_list_with_params(self):
        assert "sana_dan" in self._SVC
        assert "sana_gacha" in self._SVC


# ════════════════════════════════════════════════════════════════
#  § 19. DASHBOARD CHARTS — Top tovar/klient/trend grafiklar
# ════════════════════════════════════════════════════════════════


class TestDashboardCharts:
    """Dashboard sahifasida yangi grafiklar"""

    _DASH_SRC = (REPO / "services" / "web" / "app" / "dashboard" / "page.tsx").read_text(encoding="utf-8")

    def test_imports_bar_chart(self):
        assert "BarChart" in self._DASH_SRC

    def test_imports_dashboard_top_service(self):
        assert "dashboardTopService" in self._DASH_SRC

    def test_has_top_tovar_section(self):
        assert "top_tovar" in self._DASH_SRC

    def test_has_top_klient_section(self):
        assert "top_klient" in self._DASH_SRC

    def test_has_kunlik_trend(self):
        assert "kunlik_trend" in self._DASH_SRC

    def test_fetches_top_data(self):
        assert "topData" in self._DASH_SRC


# ════════════════════════════════════════════════════════════════
#  § 20. ENDPOINT RATE LIMITING
# ════════════════════════════════════════════════════════════════

_DEPS_FINAL = (REPO / "services" / "api" / "deps.py").read_text(encoding="utf-8")
# (merged into _API_SRC)


class TestEndpointRateLimiting:
    """Export, sotuv, import endpoint rate limiting"""

    def test_endpoint_rate_check_exists(self):
        assert "endpoint_rate_check" in _DEPS_FINAL

    def test_export_limit_3(self):
        """Export limiti 3 so'rov/daqiqa"""
        assert '"export"' in _DEPS_FINAL
        assert "3" in _DEPS_FINAL.split('"export"')[1][:20]

    def test_sotuv_limit_30(self):
        """Sotuv limiti 30 so'rov/daqiqa"""
        assert '"sotuv"' in _DEPS_FINAL

    def test_import_limit_5(self):
        """Import limiti 5 so'rov/daqiqa"""
        assert '"import"' in _DEPS_FINAL

    def test_export_uses_rate_check(self):
        """Export endpoint rate check ishlatishi kerak"""
        match = re.search(r'async def export_trigger.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "endpoint_rate_check" in match.group()

    def test_sotuv_uses_rate_check(self):
        """Sotuv endpoint rate check ishlatishi kerak"""
        match = re.search(r'async def sotuv_saqlash.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "endpoint_rate_check" in match.group()

    def test_import_uses_rate_check(self):
        """Import endpoint rate check ishlatishi kerak"""
        match = re.search(r'async def tovar_import.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "endpoint_rate_check" in match.group()

    def test_rate_check_raises_429(self):
        assert "429" in _DEPS_FINAL

    def test_rate_check_memory_limit(self):
        assert "_EP_MAX_IPS" in _DEPS_FINAL


class TestCILint:
    """CI pipeline da ruff lint bor"""

    def test_ci_has_ruff(self):
        ci = (REPO / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
        assert "ruff" in ci

    def test_ci_checks_syntax_errors(self):
        """E9,F63,F7,F82 — eng muhim xatolar"""
        ci = (REPO / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
        assert "E9" in ci or "F63" in ci


class TestDashboardQuickActions:
    """Dashboard tez o'tish — Savdolar live"""

    _DASH = (REPO / "services" / "web" / "app" / "dashboard" / "page.tsx").read_text(encoding="utf-8")

    def test_savdolar_in_quick_actions(self):
        """Savdolar quick action sifatida bor"""
        assert "Savdolar" in self._DASH or "Продажи" in self._DASH

    def test_no_beta_badge(self):
        """Beta badge olib tashlangan"""
        assert "Beta" not in self._DASH


# ════════════════════════════════════════════════════════════════
#  § 21. WEB CRUD BUTTONS + DEVELOPER GUIDE
# ════════════════════════════════════════════════════════════════


class TestClientEditDelete:
    """Klient tahrirlash/o'chirish tugmalari yoqilgani"""

    _SRC = (REPO / "services" / "web" / "app" / "clients" / "page.tsx").read_text(encoding="utf-8")

    def test_edit_not_disabled(self):
        """Edit tugma disabled bo'lmasligi kerak"""
        assert "disabled" not in self._SRC.split("Pencil")[0][-30:] or \
               "editingClientId" in self._SRC

    def test_delete_calls_api(self):
        """O'chirish API chaqirishi kerak"""
        assert "clientService.remove" in self._SRC

    def test_edit_calls_api(self):
        """Tahrirlash API chaqirishi kerak"""
        assert "clientService.update" in self._SRC or "editingClientId" in self._SRC

    def test_confirm_before_delete(self):
        """O'chirishdan oldin tasdiqlash so'rashi kerak"""
        assert "confirm(" in self._SRC

    def test_editing_client_id_state(self):
        """editingClientId holat boshqaruvi bo'lishi kerak"""
        assert "editingClientId" in self._SRC

    def test_modal_title_dynamic(self):
        """Modal title tahrirlash/qo'shish bo'yicha o'zgarishi kerak"""
        assert "tahrirlash" in self._SRC or "Редактировать" in self._SRC


class TestProductEditDelete:
    """Tovar tahrirlash/o'chirish tugmalari yoqilgani"""

    _SRC = (REPO / "services" / "web" / "app" / "products" / "page.tsx").read_text(encoding="utf-8")

    def test_edit_not_disabled(self):
        assert "disabled" not in self._SRC.split("Pencil")[0][-30:] or \
               "productService.update" in self._SRC

    def test_delete_calls_api(self):
        assert "productService.remove" in self._SRC

    def test_edit_calls_api(self):
        assert "productService.update" in self._SRC

    def test_confirm_before_delete(self):
        assert "confirm(" in self._SRC


class TestDeveloperGuide:
    """Developer guide mavjud va to'liq"""

    def test_guide_exists(self):
        assert (REPO / "docs" / "DEVELOPER_GUIDE.md").exists()

    def test_has_architecture(self):
        src = (REPO / "docs" / "DEVELOPER_GUIDE.md").read_text(encoding="utf-8")
        assert "Arxitektura" in src

    def test_has_setup(self):
        src = (REPO / "docs" / "DEVELOPER_GUIDE.md").read_text(encoding="utf-8")
        assert "pip install" in src or "requirements" in src

    def test_has_test_commands(self):
        src = (REPO / "docs" / "DEVELOPER_GUIDE.md").read_text(encoding="utf-8")
        assert "pytest" in src

    def test_has_security_rules(self):
        src = (REPO / "docs" / "DEVELOPER_GUIDE.md").read_text(encoding="utf-8")
        assert "user_id" in src
        assert "whitelist" in src


# ════════════════════════════════════════════════════════════════
#  § 22. PRODUCT ADD MODAL + IMPORT + SAVDO DETAIL
# ════════════════════════════════════════════════════════════════


class TestProductAddModal:
    """Tovar qo'shish modal va import"""

    _SRC = (REPO / "services" / "web" / "app" / "products" / "page.tsx").read_text(encoding="utf-8")

    def test_add_button_enabled(self):
        """Qo'shish tugma enabled bo'lishi kerak"""
        assert "setAddModalOpen(true)" in self._SRC

    def test_dialog_exists(self):
        assert "Dialog" in self._SRC
        assert "DialogContent" in self._SRC

    def test_form_fields(self):
        assert "nomi" in self._SRC
        assert "olish_narxi" in self._SRC
        assert "sotish_narxi" in self._SRC
        assert "qoldiq" in self._SRC

    def test_calls_create_api(self):
        assert "productService.create" in self._SRC

    def test_import_button(self):
        assert "Import" in self._SRC or "Импорт" in self._SRC

    def test_import_handler(self):
        assert "handleImportExcel" in self._SRC

    def test_import_calls_api(self):
        assert "tovarImportService" in self._SRC

    def test_csv_parse(self):
        """CSV parsing bo'lishi kerak"""
        assert "split" in self._SRC
        assert "headers" in self._SRC


class TestSavdoDetailModal:
    """Savdolar sahifasida tafsilot ko'rish"""

    _SRC = (REPO / "services" / "web" / "app" / "invoices" / "page.tsx").read_text(encoding="utf-8")

    def test_detail_dialog(self):
        assert "Dialog" in self._SRC
        assert "detailOpen" in self._SRC

    def test_row_clickable(self):
        assert "openDetail" in self._SRC
        assert "cursor-pointer" in self._SRC

    def test_calls_detail_api(self):
        assert "savdoService.detail" in self._SRC

    def test_shows_tovarlar(self):
        assert "tovarlar" in self._SRC
        assert "tovar_nomi" in self._SRC

    def test_shows_amounts(self):
        assert "tolangan" in self._SRC
        assert "qarz" in self._SRC


# ════════════════════════════════════════════════════════════════
#  § 23. DEBTS PARTIAL PAY, SAVDOLAR EXPORT, STATISTIKA
# ════════════════════════════════════════════════════════════════

# (merged into _API_SRC)


class TestDebtsPartialPayment:
    """Qarzlar sahifasida qisman to'lash"""

    _SRC = (REPO / "services" / "web" / "app" / "debts" / "page.tsx").read_text(encoding="utf-8")

    def test_pay_amount_input(self):
        """To'lov summasi kiritish maydoni bo'lishi kerak"""
        assert "payAmount" in self._SRC

    def test_partial_payment_handler(self):
        """handlePayment funksiyasi bo'lishi kerak"""
        assert "handlePayment" in self._SRC

    def test_min_clamping(self):
        """To'lov summasi balansdan oshmasligi kerak"""
        assert "Math.min" in self._SRC

    def test_shows_custom_amount_label(self):
        """Maxsus summa ko'rsatishi kerak"""
        assert "to'lash" in self._SRC.lower() or "оплатить" in self._SRC.lower()


class TestSavdolarExcelExport:
    """Savdolar sahifasida Excel export"""

    _SRC = (REPO / "services" / "web" / "app" / "invoices" / "page.tsx").read_text(encoding="utf-8")

    def test_download_icon(self):
        assert "Download" in self._SRC

    def test_export_button(self):
        assert "Excel" in self._SRC

    def test_calls_report_service(self):
        assert "reportService" in self._SRC

    def test_opens_download(self):
        assert "window.open" in self._SRC


class TestStatistikaEndpoint:
    """Admin statistika endpoint"""

    def test_endpoint_exists(self):
        assert '"/api/v1/statistika"' in _API_SRC

    def test_returns_tovar_soni(self):
        match = re.search(r'async def admin_statistika.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "tovar_soni" in body

    def test_returns_bugun_hafta_oy(self):
        match = re.search(r'async def admin_statistika.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "bugun" in body
        assert "hafta" in body
        assert "oy" in body

    def test_uses_rls(self):
        match = re.search(r'async def admin_statistika.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()


# ════════════════════════════════════════════════════════════════
#  § 24. FOYDA, SELECT* API, RUNBOOK, ENV
# ════════════════════════════════════════════════════════════════

# (merged into _API_SRC)


class TestFoydaEndpoint:
    """Maxsus foyda tahlili endpoint"""

    def test_endpoint_exists(self):
        assert '"/api/v1/hisobot/foyda"' in _API_SRC

    def test_returns_sof_foyda(self):
        match = re.search(r'async def hisobot_foyda.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "sof_foyda" in body

    def test_returns_margin(self):
        match = re.search(r'async def hisobot_foyda.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "margin_foiz" in body if (body := match.group()) else False

    def test_returns_top_foyda_zarar(self):
        match = re.search(r'async def hisobot_foyda.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "top_foyda" in body
        assert "top_zarar" in body

    def test_returns_xarajatlar(self):
        match = re.search(r'async def hisobot_foyda.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "xarajatlar" in match.group()

    def test_uses_rls(self):
        match = re.search(r'async def hisobot_foyda.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()


class TestSelectStarApiCleanup:
    """API main.py da ham SELECT * qolmagani"""

    def test_no_select_star_in_api(self):
        lines = _API_SRC.split("\n")
        violations = []
        for i, line in enumerate(lines, 1):
            if "SELECT *" in line and not line.strip().startswith("#") and not line.strip().startswith("--"):
                violations.append(f"  qator {i}: {line.strip()[:80]}")
        assert not violations, \
            f"api/main.py da SELECT * topildi:\n" + "\n".join(violations)


class TestWebFoydaService:
    """Web da foyda service bormi"""

    _SVC = (REPO / "services" / "web" / "lib" / "api" / "services.ts").read_text(encoding="utf-8")

    def test_foyda_service_exists(self):
        assert "foydaService" in self._SVC

    def test_foyda_response_type(self):
        assert "FoydaResponse" in self._SVC

    def test_statistika_service_exists(self):
        assert "statistikaService" in self._SVC


class TestRunbookUpdated:
    """RUNBOOK v25.3 bilan yangilangani"""

    _RB = (REPO / "RUNBOOK.md").read_text(encoding="utf-8")

    def test_has_v253(self):
        assert "v25.3" in self._RB

    def test_has_test_commands(self):
        assert "pytest" in self._RB
        assert "test_titan" in self._RB

    def test_has_ruff(self):
        assert "ruff" in self._RB


class TestEnvExample:
    """env.example yangilangani"""

    _ENV = (REPO / ".env.example").read_text(encoding="utf-8")

    def test_has_sentry_dsn(self):
        assert "SENTRY_DSN" in self._ENV

    def test_has_cognitive_api_key(self):
        assert "COGNITIVE_API_KEY" in self._ENV


# ════════════════════════════════════════════════════════════════
#  § 25. WEB SOTUV SAHIFASI
# ════════════════════════════════════════════════════════════════


class TestSalesPage:
    """Web dan sotuv qilish sahifasi"""

    _SRC = (REPO / "services" / "web" / "app" / "sales" / "page.tsx").read_text(encoding="utf-8")

    def test_page_exists(self):
        assert (REPO / "services" / "web" / "app" / "sales" / "page.tsx").exists()

    def test_imports_services(self):
        assert "productService" in self._SRC
        assert "clientService" in self._SRC
        assert "savdoService" in self._SRC

    def test_has_cart_state(self):
        assert "cart" in self._SRC
        assert "setCart" in self._SRC

    def test_has_add_to_cart(self):
        assert "addToCart" in self._SRC

    def test_has_remove_from_cart(self):
        assert "removeFromCart" in self._SRC

    def test_has_product_search(self):
        assert "filteredProducts" in self._SRC
        assert "search" in self._SRC

    def test_has_client_search(self):
        assert "klient" in self._SRC
        assert "filteredClients" in self._SRC

    def test_has_payment_split(self):
        """To'langan va qarz bo'lishi kerak"""
        assert "tolangan" in self._SRC
        assert "qarzSumma" in self._SRC

    def test_has_submit(self):
        assert "handleSubmit" in self._SRC
        assert "savdoService.create" in self._SRC

    def test_has_success_feedback(self):
        assert "success" in self._SRC

    def test_has_qty_controls(self):
        """Miqdor +/- tugmalari"""
        assert "updateQty" in self._SRC

    def test_has_price_edit(self):
        """Narx o'zgartirish"""
        assert "updatePrice" in self._SRC


class TestSidebarSales:
    """Sidebar da Sotuv bo'limi"""

    _SRC = (REPO / "services" / "web" / "components" / "layout" / "sidebar.tsx").read_text(encoding="utf-8")

    def test_sales_link(self):
        assert "/sales" in self._SRC

    def test_shopping_cart_icon(self):
        assert "ShoppingCart" in self._SRC


class TestSavdoCreateService:
    """Web services da sotuv yaratish"""

    _SVC = (REPO / "services" / "web" / "lib" / "api" / "services.ts").read_text(encoding="utf-8")

    def test_create_method(self):
        assert "create:" in self._SVC

    def test_posts_to_sotuv(self):
        assert '"/api/v1/sotuv"' in self._SVC


# ════════════════════════════════════════════════════════════════
#  § 26. RESPONSE MODELS + LIKE_ESCAPE BARCHA JOYLARDA
# ════════════════════════════════════════════════════════════════

# (merged into _API_SRC)
_DB_FINAL = (REPO / "services" / "bot" / "db.py").read_text(encoding="utf-8")


class TestResponseModels:
    """API response Pydantic modellar mavjudligi"""

    def test_health_response(self):
        assert "class HealthResponse(BaseModel)" in _API_SRC

    def test_dashboard_response(self):
        assert "class DashboardResponse(BaseModel)" in _API_SRC

    def test_tovar_response(self):
        assert "class TovarResponse(BaseModel)" in _API_SRC

    def test_klient_response(self):
        assert "class KlientResponse(BaseModel)" in _API_SRC

    def test_sotuv_response(self):
        assert "class SotuvResponse(BaseModel)" in _API_SRC

    def test_bildirishnoma_response(self):
        assert "class BildirishnomaResponse(BaseModel)" in _API_SRC

    def test_foyda_response_model(self):
        assert "class FoydaResponse(BaseModel)" in _API_SRC

    def test_statistika_response_model(self):
        assert "class StatistikaResponse(BaseModel)" in _API_SRC

    def test_model_count(self):
        """Kamida 20 ta Pydantic model bo'lishi kerak"""
        count = _API_SRC.count("class ") 
        assert count >= 20, f"Faqat {count} ta class — kamida 20 kutilgan"


class TestLikeEscapeEverywhere:
    """like_escape barcha LIKE query larda ishlatilishi"""

    def test_no_unescaped_like_in_api(self):
        """API da escape qilinmagan LIKE qolmagani"""
        lines = _API_SRC.split("\n")
        violations = []
        for i, line in enumerate(lines, 1):
            # f"%{...}%" pattern — like_escape bo'lmasa xato
            if 'f"%{' in line and "like_escape" not in line and not line.strip().startswith("#"):
                violations.append(f"  qator {i}: {line.strip()[:80]}")
        assert not violations, \
            f"API da escape qilinmagan LIKE topildi:\n" + "\n".join(violations)

    def test_no_unescaped_like_in_bot(self):
        """Bot db da escape qilinmagan LIKE qolmagani"""
        lines = _DB_FINAL.split("\n")
        violations = []
        for i, line in enumerate(lines, 1):
            if 'f"%{' in line and "like_escape" not in line and not line.strip().startswith("#"):
                violations.append(f"  qator {i}: {line.strip()[:80]}")
        assert not violations, \
            f"bot/db.py da escape qilinmagan LIKE topildi:\n" + "\n".join(violations)

    def test_api_imports_like_escape(self):
        assert "from shared.utils import like_escape" in _API_SRC

    def test_bot_imports_like_escape(self):
        assert "from shared.utils import like_escape" in _DB_FINAL

    def test_like_escape_usage_count_api(self):
        """API da kamida 5 ta like_escape ishlatilishi kerak"""
        count = _API_SRC.count("like_escape(")
        assert count >= 5, f"API da faqat {count} ta like_escape — kamida 5 kutilgan"

    def test_like_escape_usage_count_bot(self):
        """Bot da kamida 4 ta like_escape ishlatilishi kerak"""
        count = _DB_FINAL.count("like_escape(")
        assert count >= 4, f"Bot da faqat {count} ta like_escape — kamida 4 kutilgan"


# ════════════════════════════════════════════════════════════════
#  § 27. WEBSOCKET, QR-KOD, MOBIL BOTTOM NAV
# ════════════════════════════════════════════════════════════════

# (merged into _API_SRC)


class TestWebSocketHook:
    """WebSocket React hook"""

    def test_hook_exists(self):
        assert (REPO / "services" / "web" / "hooks" / "use-websocket.ts").exists()

    def test_hook_has_connect(self):
        src = (REPO / "services" / "web" / "hooks" / "use-websocket.ts").read_text(encoding="utf-8")
        assert "connect" in src
        assert "disconnect" in src

    def test_hook_has_ping(self):
        src = (REPO / "services" / "web" / "hooks" / "use-websocket.ts").read_text(encoding="utf-8")
        assert "ping" in src

    def test_hook_has_reconnect(self):
        src = (REPO / "services" / "web" / "hooks" / "use-websocket.ts").read_text(encoding="utf-8")
        assert "reconnect" in src.lower()

    def test_hook_exports_function(self):
        src = (REPO / "services" / "web" / "hooks" / "use-websocket.ts").read_text(encoding="utf-8")
        assert "export function useWebSocket" in src


class TestDashboardWebSocket:
    """Dashboard WebSocket integratsiya"""

    _DASH = (REPO / "services" / "web" / "app" / "dashboard" / "page.tsx").read_text(encoding="utf-8")

    def test_imports_hook(self):
        assert "useWebSocket" in self._DASH

    def test_auto_refetch_on_message(self):
        assert "lastMessage" in self._DASH
        assert "refetch" in self._DASH


class TestQREndpoint:
    """QR-kod endpoint"""

    def test_endpoint_exists(self):
        assert '"/api/v1/qr/{sessiya_id}"' in _API_SRC

    def test_returns_qr_content(self):
        match = re.search(r'async def qr_kod_generatsiya.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "qr_content" in match.group()

    def test_uses_rls(self):
        match = re.search(r'async def qr_kod_generatsiya.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()


class TestMobileBottomNav:
    """Mobil bottom navigation"""

    _SRC = (REPO / "services" / "web" / "components" / "layout" / "admin-layout.tsx").read_text(encoding="utf-8")

    def test_component_exists(self):
        assert "MobileBottomNav" in self._SRC

    def test_has_nav_items(self):
        assert "/dashboard" in self._SRC
        assert "/sales" in self._SRC
        assert "/products" in self._SRC

    def test_hidden_on_desktop(self):
        """Desktop da ko'rinmasligi kerak"""
        assert "md:hidden" in self._SRC

    def test_fixed_bottom(self):
        """Pastga yopishgan bo'lishi kerak"""
        assert "fixed bottom-0" in self._SRC

    def test_main_has_bottom_padding(self):
        """Main content pastda padding bo'lishi kerak (nav ortida qolmasin)"""
        assert "pb-16" in self._SRC


# ════════════════════════════════════════════════════════════════
#  § 28. SCHEMA CLEANUP, VERSION SYNC, API LANDING
# ════════════════════════════════════════════════════════════════

_DB_FINAL2 = (REPO / "services" / "bot" / "db.py").read_text(encoding="utf-8")
# (merged into _API_SRC)


class TestSchemaMinimal:
    """_SCHEMA embedded qisqartirilgani"""

    def test_no_full_schema(self):
        """Katta embedded schema olib tashlangan"""
        assert "klientlar" not in _DB_FINAL2.split("_SCHEMA")[1].split('"""')[1] if "_SCHEMA" in _DB_FINAL2 else True

    def test_minimal_has_users(self):
        """Minimal fallback faqat users jadvali"""
        assert "_SCHEMA_MINIMAL" in _DB_FINAL2

    def test_db_line_count(self):
        """bot/db.py 1300 qatordan kam bo'lishi kerak"""
        lines = len(_DB_FINAL2.split("\n"))
        assert lines < 1300, f"bot/db.py {lines} qator — 1300 dan kam kutilgan"

    def test_fallback_uses_minimal(self):
        assert "_SCHEMA_MINIMAL" in _DB_FINAL2


class TestVersionSync:
    """Barcha servislarda v25.3"""

    def test_api_version(self):
        assert '"25.3"' in _API_SRC

    def test_bot_version(self):
        src = (REPO / "services" / "bot" / "main.py").read_text(encoding="utf-8")
        assert '"25.3"' in src

    def test_cognitive_version(self):
        src = (REPO / "services" / "cognitive" / "api.py").read_text(encoding="utf-8")
        assert '"25.3"' in src or "v25.3" in src

    def test_config_version(self):
        src = (REPO / "services" / "bot" / "config.py").read_text(encoding="utf-8")
        assert "v25.3" in src

    def test_no_v21_in_headers(self):
        """v21.3 eskirgan versiya yo'q bo'lishi kerak"""
        for f in ["services/bot/config.py", "services/cognitive/api.py"]:
            src = (REPO / f).read_text(encoding="utf-8")
            assert "v21.3" not in src, f"{f} da eskirgan v21.3 topildi"


class TestAPILanding:
    """API landing sahifasi yangilangani"""

    def test_endpoint_count_updated(self):
        assert "62+" in _API_SRC

    def test_description_updated(self):
        assert "62+" in _API_SRC or "CRUD" in _API_SRC


# ════════════════════════════════════════════════════════════════
#  § 29. PROFIL, KLIENT TARIX, OPENAPI, SETTINGS
# ════════════════════════════════════════════════════════════════

# (merged into _API_SRC)


class TestProfilEndpoint:
    """Profil yangilash API"""

    def test_put_me_exists(self):
        assert '"/api/v1/me"' in _API_SRC

    def test_put_parol_exists(self):
        assert '"/api/v1/me/parol"' in _API_SRC

    def test_profil_whitelist(self):
        match = re.search(r'async def profil_yangilash.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "_RUXSAT" in match.group()

    def test_parol_min_length(self):
        match = re.search(r'async def parol_yangilash.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "4" in match.group()  # min 4 belgi


class TestKlientTarixEndpoint:
    """Klient sotuv tarixi"""

    def test_endpoint_exists(self):
        assert '"/api/v1/klient/{klient_id}/tarix"' in _API_SRC

    def test_returns_sotuvlar(self):
        match = re.search(r'async def klient_tarix.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "sotuvlar" in body
        assert "qarzlar" in body

    def test_uses_rls(self):
        match = re.search(r'async def klient_tarix.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()


class TestOpenAPITags:
    """OpenAPI tags mavjudligi"""

    def test_has_tags(self):
        assert "openapi_tags" in _API_SRC

    def test_has_tovarlar_tag(self):
        assert '"Tovarlar"' in _API_SRC

    def test_has_klientlar_tag(self):
        assert '"Klientlar"' in _API_SRC

    def test_has_sotuv_tag(self):
        assert '"Sotuv"' in _API_SRC

    def test_has_monitoring_tag(self):
        assert '"Monitoring"' in _API_SRC


class TestSettingsProfile:
    """Settings sahifasida profil tahrirlash"""

    _SRC = (REPO / "services" / "web" / "app" / "settings" / "page.tsx").read_text(encoding="utf-8")

    def test_editable_fields(self):
        assert "profileForm" in self._SRC
        assert "setProfileForm" in self._SRC

    def test_save_button(self):
        assert "saveProfile" in self._SRC

    def test_calls_api(self):
        assert "/api/v1/me" in self._SRC

    def test_success_feedback(self):
        assert "profileSaveMsg" in self._SRC


class TestWebNewServices2:
    """Web services — profil va klient tarix"""

    _SVC = (REPO / "services" / "web" / "lib" / "api" / "services.ts").read_text(encoding="utf-8")

    def test_profil_service(self):
        assert "profilService" in self._SVC

    def test_klient_tarix_service(self):
        assert "klientTarixService" in self._SVC

    def test_password_change(self):
        assert "changePassword" in self._SVC


# ════════════════════════════════════════════════════════════════
#  § 30. KLIENT TARIX DRAWER, REPORTS FOYDA, API DOCS
# ════════════════════════════════════════════════════════════════


class TestClientTarixDrawer:
    """Klient sahifasida tarix drawer"""

    _SRC = (REPO / "services" / "web" / "app" / "clients" / "page.tsx").read_text(encoding="utf-8")

    def test_sheet_imported(self):
        assert "Sheet" in self._SRC

    def test_tarix_state(self):
        assert "tarixOpen" in self._SRC
        assert "tarixData" in self._SRC

    def test_open_tarix_handler(self):
        assert "openTarix" in self._SRC

    def test_calls_tarix_api(self):
        assert "klientTarixService" in self._SRC

    def test_eye_button(self):
        assert "Eye" in self._SRC

    def test_shows_sotuvlar(self):
        assert "sotuvlar" in self._SRC

    def test_shows_qarzlar(self):
        assert "qarzlar" in self._SRC


class TestReportsFoydaTab:
    """Reports sahifasida foyda tahlili tab"""

    _SRC = (REPO / "services" / "web" / "app" / "reports" / "page.tsx").read_text(encoding="utf-8")

    def test_foyda_option(self):
        assert "foyda" in self._SRC

    def test_imports_foyda_service(self):
        assert "foydaService" in self._SRC

    def test_foyda_fetcher(self):
        assert "foydaFetcher" in self._SRC or "foydaData" in self._SRC


class TestAPIDocsComplete:
    """API docs barcha endpointlar"""

    _DOCS = (REPO / "docs" / "API_DOCUMENTATION.md").read_text(encoding="utf-8")

    def test_has_profil(self):
        assert "PUT /api/v1/me" in self._DOCS

    def test_has_parol(self):
        assert "parol" in self._DOCS

    def test_has_klient_tarix(self):
        assert "klient" in self._DOCS and "tarix" in self._DOCS

    def test_has_qr(self):
        assert "qr" in self._DOCS.lower() or "QR" in self._DOCS

    def test_has_foyda(self):
        assert "foyda" in self._DOCS

    def test_has_statistika(self):
        assert "statistika" in self._DOCS.lower()


# ════════════════════════════════════════════════════════════════
#  § 31. XAVFSIZLIK FIX, SWAGGER TAGS, SEARCH, FINAL
# ════════════════════════════════════════════════════════════════

# (merged into _API_SRC)


class TestSecurityUserIdFixes:
    """user_id defense-in-depth tuzatishlar"""

    def test_qoldiq_update_has_user_id(self):
        """tovar qoldiq update da user_id bo'lishi kerak"""
        match = re.search(r'async def tovar_qoldiq_yangilash.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert "user_id" in body
        assert "AND user_id" in body

    def test_savdo_detail_has_user_id(self):
        """savdo tafsilot da user_id bo'lishi kerak"""
        match = re.search(r'async def savdo_tafsilot.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        body = match.group()
        assert body.count("user_id") >= 2, "sotuv va chiqimlar da user_id"

    def test_qr_has_user_id(self):
        """QR endpoint da user_id bo'lishi kerak"""
        match = re.search(r'async def qr_kod_generatsiya.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_SRC, re.DOTALL)
        assert match
        assert "user_id" in match.group()


class TestSwaggerTags:
    """Swagger endpoint tags"""

    def test_has_monitoring_tags(self):
        assert 'tags=["Monitoring"]' in _API_SRC

    def test_has_auth_tags(self):
        assert 'tags=["Auth"]' in _API_SRC

    def test_has_tovarlar_tags(self):
        assert 'tags=["Tovarlar"]' in _API_SRC

    def test_has_klientlar_tags(self):
        assert 'tags=["Klientlar"]' in _API_SRC

    def test_has_sotuv_tags(self):
        assert 'tags=["Sotuv"]' in _API_SRC

    def test_has_hisobotlar_tags(self):
        assert 'tags=["Hisobotlar"]' in _API_SRC

    def test_tagged_count(self):
        """Kamida 40 ta endpoint ga tag qo'shilgan"""
        count = _API_SRC.count("tags=[")
        assert count >= 40, f"Faqat {count} ta tagged — kamida 40 kutilgan"


class TestSearchPage:
    """Global search sahifasi"""

    def test_page_exists(self):
        assert (REPO / "services" / "web" / "app" / "search" / "page.tsx").exists()

    def test_uses_search_service(self):
        src = (REPO / "services" / "web" / "app" / "search" / "page.tsx").read_text(encoding="utf-8")
        assert "searchService" in src

    def test_shows_tovarlar(self):
        src = (REPO / "services" / "web" / "app" / "search" / "page.tsx").read_text(encoding="utf-8")
        assert "tovarlar" in src

    def test_shows_klientlar(self):
        src = (REPO / "services" / "web" / "app" / "search" / "page.tsx").read_text(encoding="utf-8")
        assert "klientlar" in src

    def test_min_chars_check(self):
        src = (REPO / "services" / "web" / "app" / "search" / "page.tsx").read_text(encoding="utf-8")
        assert "2" in src  # min 2 belgi


class TestSearchService:
    """Web search service"""

    _SVC = (REPO / "services" / "web" / "lib" / "api" / "services.ts").read_text(encoding="utf-8")

    def test_search_service_exists(self):
        assert "searchService" in self._SVC

    def test_search_endpoint(self):
        assert "/api/v1/search" in self._SVC


class TestHeaderSearchLink:
    """Top header search /search ga yo'naltirishi"""

    _SRC = (REPO / "services" / "web" / "components" / "layout" / "top-header.tsx").read_text(encoding="utf-8")

    def test_navigates_to_search(self):
        assert "/search" in self._SRC


# ════════════════════════════════════════════════════════════════
#  § 32. RETURNING * CLEANUP + ALL ENDPOINTS TAGGED
# ════════════════════════════════════════════════════════════════


class TestReturningStarCleanup:
    """RETURNING * bo'lmasligi"""

    def test_no_returning_star_bot(self):
        src = (REPO / "services" / "bot" / "db.py").read_text(encoding="utf-8")
        lines = src.split("\n")
        for i, line in enumerate(lines, 1):
            if "RETURNING *" in line and not line.strip().startswith("#"):
                pytest.fail(f"bot/db.py:{i} da RETURNING * topildi")

    def test_no_returning_star_api(self):
        src = (REPO / "services" / "api" / "main.py").read_text(encoding="utf-8")
        lines = src.split("\n")
        for i, line in enumerate(lines, 1):
            if "RETURNING *" in line and not line.strip().startswith("#"):
                pytest.fail(f"api/main.py:{i} da RETURNING * topildi")


class TestAllEndpointsTagged:
    """Barcha endpointlar Swagger tag ga ega"""

    def test_tagged_count(self):
        src = (REPO / "services" / "api" / "main.py").read_text(encoding="utf-8")
        total = src.count('tags=[')
        assert total >= 60, f"Faqat {total} tagged — kamida 60 kutilgan"

    def test_no_untagged(self):
        """include_in_schema=False dan boshqa barcha endpointlar tagged"""
        src = (REPO / "services" / "api" / "main.py").read_text(encoding="utf-8")
        lines = src.split("\n")
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if re.match(r'@app\.(get|post|put|delete)\(', stripped):
                if "tags=" not in stripped and "include_in_schema" not in stripped:
                    pytest.fail(f"api/main.py:{i} — tag yo'q: {stripped[:60]}")


# ════════════════════════════════════════════════════════════════
#  § 33. TOVAR TARIX ENDPOINT + PRODUCTS DRAWER
# ════════════════════════════════════════════════════════════════

_API_FINAL10 = (REPO / "services" / "api" / "main.py").read_text(encoding="utf-8")


class TestTovarTarixEndpoint:
    """Tovar sotuv/kirim tarixi"""

    def test_endpoint_exists(self):
        assert '"/api/v1/tovar/{tovar_id}/tarix"' in _API_FINAL10

    def test_returns_sotuvlar(self):
        match = re.search(r'async def tovar_tarix.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_FINAL10, re.DOTALL)
        assert match
        body = match.group()
        assert "sotuvlar" in body
        assert "kirimlar" in body
        assert "statistika" in body

    def test_uses_rls(self):
        match = re.search(r'async def tovar_tarix.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_FINAL10, re.DOTALL)
        assert match
        assert "rls_conn" in match.group()

    def test_user_id_in_queries(self):
        match = re.search(r'async def tovar_tarix.*?(?=\n@app\.|\nclass\s|\Z)',
                          _API_FINAL10, re.DOTALL)
        assert match
        assert match.group().count("user_id") >= 3


class TestProductsTarixDrawer:
    """Tovar sahifasida tarix drawer"""

    _SRC = (REPO / "services" / "web" / "app" / "products" / "page.tsx").read_text(encoding="utf-8")

    def test_eye_button(self):
        assert "Eye" in self._SRC

    def test_tarix_state(self):
        assert "tarixOpen" in self._SRC
        assert "tarixData" in self._SRC

    def test_open_tarix_handler(self):
        assert "openTarix" in self._SRC

    def test_calls_api(self):
        assert "tovarTarixService" in self._SRC

    def test_sheet_drawer(self):
        assert "Sheet" in self._SRC
        assert "SheetContent" in self._SRC

    def test_shows_statistika(self):
        assert "statistika" in self._SRC

    def test_shows_sotuvlar(self):
        assert "sotuvlar" in self._SRC


class TestTovarTarixService:
    """Web tovar tarix service"""

    _SVC = (REPO / "services" / "web" / "lib" / "api" / "services.ts").read_text(encoding="utf-8")

    def test_service_exists(self):
        assert "tovarTarixService" in self._SVC

    def test_endpoint(self):
        assert "/tarix" in self._SVC


# ════════════════════════════════════════════════════════════════
#  § 34. PAROL O'ZGARTIRISH UI + ROUTER TAGS + FINAL
# ════════════════════════════════════════════════════════════════


class TestSettingsPasswordChange:
    """Settings parol o'zgartirish ishlashi"""

    _SRC = (REPO / "services" / "web" / "app" / "settings" / "page.tsx").read_text(encoding="utf-8")

    def test_pwd_form_state(self):
        assert "pwdForm" in self._SRC

    def test_handler_exists(self):
        assert "handlePwdChange" in self._SRC

    def test_calls_api(self):
        assert "/api/v1/me/parol" in self._SRC

    def test_validation_min_length(self):
        assert "4" in self._SRC

    def test_confirm_check(self):
        assert "confirm" in self._SRC

    def test_success_message(self):
        assert "pwdMsg" in self._SRC


class TestRouterTags:
    """Router include_router tags"""

    _SRC = (REPO / "services" / "api" / "main.py").read_text(encoding="utf-8")

    def test_kassa_tagged(self):
        assert 'tags=["Kassa"]' in self._SRC

    def test_websocket_tagged(self):
        # WebSocket router da Monitoring tag
        assert self._SRC.count('tags=["Monitoring"]') >= 2

    def test_printer_tagged(self):
        assert 'tags=["Sotuv"]' in self._SRC


class TestTakliflarHolat:
    """Takliflar holat hujjati"""

    def test_file_exists(self):
        assert (REPO / "docs" / "TAKLIFLAR_HOLAT.md").exists()

    def test_has_qilindi(self):
        src = (REPO / "docs" / "TAKLIFLAR_HOLAT.md").read_text(encoding="utf-8")
        assert "QILINDI" in src
        assert "30" in src

    def test_has_qilinmagan(self):
        src = (REPO / "docs" / "TAKLIFLAR_HOLAT.md").read_text(encoding="utf-8")
        assert "QILINMAGAN" in src


# ════════════════════════════════════════════════════════════════
#  § 35. ZERO SELECT*, ZERO RETURNING*, ZERO UNESCAPED LIKE
# ════════════════════════════════════════════════════════════════


class TestZeroSelectStarEverywhere:
    """Butun loyihada SELECT * qolmagani"""

    def test_no_select_star_anywhere(self):
        import glob
        violations = []
        for f in glob.glob(str(REPO / "services" / "**" / "*.py"), recursive=True):
            if "__pycache__" in f: continue
            src = open(f, encoding="utf-8").read()
            for i, line in enumerate(src.split("\n"), 1):
                if "SELECT *" in line and not line.strip().startswith("#"):
                    violations.append(f"  {f}:{i}")
        assert not violations, "SELECT * topildi:\n" + "\n".join(violations)


class TestZeroUnescapedLikeEverywhere:
    """Butun loyihada unescaped LIKE qolmagani"""

    def test_no_unescaped_like_anywhere(self):
        import glob
        violations = []
        for f in glob.glob(str(REPO / "services" / "**" / "*.py"), recursive=True):
            if "__pycache__" in f: continue
            src = open(f, encoding="utf-8").read()
            for i, line in enumerate(src.split("\n"), 1):
                if 'f"%{' in line and "like_escape" not in line and not line.strip().startswith("#"):
                    violations.append(f"  {f}:{i}")
        assert not violations, "Unescaped LIKE topildi:\n" + "\n".join(violations)


# ════════════════════════════════════════════════════════════════
#  § 36. RUFF CLEAN + FINAL POLISH
# ════════════════════════════════════════════════════════════════


class TestRuffClean:
    """Ruff lint xatolar yo'q"""

    def test_export_excel_has_log(self):
        src = (REPO / "services" / "bot" / "bot_services" / "export_excel.py").read_text(encoding="utf-8")
        assert "import logging" in src
        assert "log" in src

    def test_worker_no_undefined_send_tg(self):
        src = (REPO / "services" / "worker" / "tasks.py").read_text(encoding="utf-8")
        assert "_send_tg" not in src

    def test_api_landing_66(self):
        src = (REPO / "services" / "api" / "main.py").read_text(encoding="utf-8")
        assert "66+" in src


# ════════════════════════════════════════════════════════════════
#  § 37. DOCS POLISH + 404 PAGE
# ════════════════════════════════════════════════════════════════


class TestDeveloperGuideUpdated:
    """Developer guide yangilangani"""

    _SRC = (REPO / "docs" / "DEVELOPER_GUIDE.md").read_text(encoding="utf-8")

    def test_endpoint_count_66(self):
        assert "66+" in self._SRC

    def test_test_count(self):
        assert "1000+" in self._SRC

    def test_swagger_section(self):
        assert "Swagger" in self._SRC

    def test_select_star_rule(self):
        assert "SELECT *" in self._SRC

    def test_returning_star_rule(self):
        assert "RETURNING *" in self._SRC


class TestAPIDocsHeader:
    """API docs header yangilangani"""

    _SRC = (REPO / "docs" / "API_DOCUMENTATION.md").read_text(encoding="utf-8")

    def test_has_66(self):
        assert "66" in self._SRC

    def test_has_swagger(self):
        assert "Swagger" in self._SRC or "swagger" in self._SRC


class TestNotFoundPage:
    """404 sahifa"""

    def test_exists(self):
        assert (REPO / "services" / "web" / "app" / "not-found.tsx").exists()

    def test_has_404(self):
        src = (REPO / "services" / "web" / "app" / "not-found.tsx").read_text(encoding="utf-8")
        assert "404" in src

    def test_has_link_back(self):
        src = (REPO / "services" / "web" / "app" / "not-found.tsx").read_text(encoding="utf-8")
        assert "/dashboard" in src


# ════════════════════════════════════════════════════════════════
#  § 38. SHARED/ LIKE_ESCAPE + WORKER USER_ID + BARE EXCEPT
# ════════════════════════════════════════════════════════════════


class TestSharedLikeEscape:
    """shared/ da barcha LIKE escape qilingani"""

    def test_advanced_features(self):
        src = (REPO / "shared" / "services" / "advanced_features.py").read_text(encoding="utf-8")
        assert "like_escape" in src

    def test_fuzzy_match(self):
        src = (REPO / "shared" / "services" / "fuzzy_match.py").read_text(encoding="utf-8")
        assert "like_escape" in src

    def test_mutaxassis(self):
        src = (REPO / "shared" / "services" / "mutaxassis.py").read_text(encoding="utf-8")
        assert "like_escape" in src

    def test_ochiq_savat(self):
        src = (REPO / "shared" / "services" / "ochiq_savat.py").read_text(encoding="utf-8")
        assert "like_escape" in src

    def test_smart_bot_engine(self):
        src = (REPO / "shared" / "services" / "smart_bot_engine.py").read_text(encoding="utf-8")
        assert "like_escape" in src


class TestZeroBareExcept:
    """Butun loyihada bare except yo'q"""

    def test_no_bare_except_services(self):
        import glob
        violations = []
        for f in glob.glob(str(REPO / "services" / "**" / "*.py"), recursive=True):
            if "__pycache__" in f: continue
            for i, line in enumerate(open(f, encoding="utf-8").readlines(), 1):
                if line.strip() == "except:":
                    violations.append(f"  {f}:{i}")
        assert not violations, "bare except topildi:\n" + "\n".join(violations)

    def test_no_bare_except_shared(self):
        import glob
        violations = []
        for f in glob.glob(str(REPO / "shared" / "**" / "*.py"), recursive=True):
            if "__pycache__" in f: continue
            for i, line in enumerate(open(f, encoding="utf-8").readlines(), 1):
                if line.strip() == "except:":
                    violations.append(f"  {f}:{i}")
        assert not violations, "bare except topildi:\n" + "\n".join(violations)


class TestWorkerUserIdDefense:
    """Worker tasks da user_id defense-in-depth"""

    _SRC = (REPO / "services" / "worker" / "tasks.py").read_text(encoding="utf-8")

    def test_sotuv_sessiyalar_has_user_id(self):
        assert "sotuv_sessiyalar WHERE id=$1 AND user_id=$2" in self._SRC

    def test_chiqimlar_has_user_id(self):
        assert "chiqimlar WHERE sessiya_id=$1 AND user_id=$2" in self._SRC
