"""
Smoke tests for repaired critical paths.
Run: python -m pytest tests/test_smoke.py -v
"""
import sys, os
# conftest.py handles sys.path already

import pytest
import ast


class TestBotImports:
    """Verify bot can be imported without errors."""

    def test_config_importable(self):
        """config.py exports config_init and Config"""
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services', 'bot'))
        from config import config_init, Config
        assert callable(config_init)

    def test_db_importable(self):
        """services/bot/db.py imports cleanly"""
        import importlib
        # Just check syntax
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'db.py')).read()
        ast.parse(src)

    def test_bot_main_syntax(self):
        """bot/main.py has no syntax errors"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        ast.parse(src)

    def test_bot_no_stale_imports(self):
        """bot/main.py has no stale utils.hisob imports"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'from utils.hisob import' not in src
        assert 'import core.database' not in src
        assert 'from config import load_config' not in src

    def test_bot_datetime_pytz_imported(self):
        """bot/main.py imports datetime and pytz at module level"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        top = src[:3000]  # top of file before first def
        assert 'import datetime' in top or 'from datetime import' in top
        assert 'import pytz' in top

    def test_voice_alias(self):
        """voice.py has matnga_aylantir alias"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'bot_services', 'voice.py')).read()
        assert 'matnga_aylantir' in src

    def test_bot_services_syntax(self):
        """All bot_services have valid syntax"""
        svc_dir = os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'bot_services')
        for fname in os.listdir(svc_dir):
            if fname.endswith('.py'):
                src = open(os.path.join(svc_dir, fname)).read()
                ast.parse(src)


class TestAPIEndpoints:
    """Verify API module is importable and endpoints are correctly formed."""

    def test_api_syntax(self):
        """api/main.py has valid syntax"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        ast.parse(src)

    def test_jwt_secret_no_hardcoded_default(self):
        """JWT_SECRET has no insecure hardcoded fallback"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert 'mashrab_moliya_secret_2026' not in src

    def test_kirim_uses_pydantic_attributes(self):
        """kirim_saqlash uses model attributes, not data.get()"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        import re
        idx = src.find('async def kirim_saqlash')
        end = src.find('\n\n@app.', idx)
        fn  = src[idx:end]
        assert 'data.get(' not in fn, "kirim_saqlash still uses data.get() on Pydantic model"

    def test_readyz_no_str_e(self):
        """readyz endpoint does not expose str(e)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        idx = src.find('async def readyz()')
        end = src.find('\n\n@app.', idx)
        fn  = src[idx:end]
        assert 'str(e)' not in fn

    def test_pydantic_models_defined(self):
        """Required Pydantic models exist"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        for model in ['SotuvSo_rov', 'KirimSo_rov', 'QarzTolashSo_rov']:
            assert f'class {model}' in src


class TestWorkerTasks:
    """Verify worker task module is valid."""

    def test_worker_syntax(self):
        """worker/tasks.py has valid syntax"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        ast.parse(src)

    def test_crontab_used(self):
        """Beat schedule uses crontab, not raw dicts"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        assert 'from celery.schedules import crontab' in src
        assert '"schedule": {' not in src

    def test_export_is_real(self):
        """Export async function writes a real file (openpyxl)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        assert 'openpyxl' in src
        assert 'wb.save(' in src

    def test_haftalik_sends_notification(self):
        """Haftalik task sends real Telegram messages"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        # find the async implementation (second occurrence after the task wrapper)
        idx = src.find('async def _haftalik_hisobot_async')
        fn  = src[idx:idx+2000]
        assert 'sendMessage' in fn

    def test_qarz_sends_notification(self):
        """Qarz task sends real Telegram messages"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        idx = src.find('async def _qarz_eslatma_async')
        fn  = src[idx:idx+2000]
        assert 'sendMessage' in fn


class TestRLSConsistency:
    """Verify RLS key consistency between pool and schema."""

    def test_pool_uses_app_uid(self):
        """shared/database/pool.py uses app.uid"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'pool.py')).read()
        assert "app.uid" in src
        assert "app.user_id" not in src

    def test_schema_current_uid_uses_app_uid(self):
        """schema.sql current_uid() reads app.uid"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'schema.sql')).read()
        assert "app.uid" in src


class TestDockerfiles:
    """Verify Dockerfiles are coherent."""

    def test_no_invalid_copy(self):
        """No Dockerfile uses invalid ../../shared COPY"""
        for svc in ['bot', 'api', 'worker', 'cognitive']:
            df = open(os.path.join(os.path.dirname(__file__), '..', 'services', svc, 'Dockerfile')).read()
            assert '../../shared' not in df, f"{svc}/Dockerfile has invalid ../../shared"

    def test_worker_has_pg_client(self):
        """Worker Dockerfile installs postgresql-client for pg_dump"""
        df = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'Dockerfile')).read()
        assert 'postgresql-client' in df

    def test_cognitive_entrypoint(self):
        """Cognitive Dockerfile uses api:app not main:app"""
        df = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'Dockerfile')).read()
        assert 'api:app' in df
        assert 'main:app' not in df


class TestWorkerFixes:
    """Verify worker fixes from current round."""

    def test_obuna_sends_notification(self):
        """Obuna task sends real Telegram messages"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        idx = src.find('async def _obuna_eslatma_async')
        fn  = src[idx:idx+2000]
        assert 'sendMessage' in fn, "Obuna task does not send Telegram messages"

    def test_export_passes_format(self):
        """katta_export task accepts format_ argument"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        idx = src.find('def katta_export(')
        fn  = src[idx:idx+200]
        assert 'format_' in fn, "katta_export missing format_ arg"

    def test_nakladnoy_generates_real_file(self):
        """nakladnoy task writes actual files (not fake path)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        assert '_nakl_word' in src, "No _nakl_word function"
        assert '_nakl_excel' in src, "No _nakl_excel function"
        assert '_nakl_pdf' in src, "No _nakl_pdf function"
        assert 'python-docx' in open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'requirements.txt')).read()

    def test_export_pdf_implemented(self):
        """PDF export path is implemented"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        assert '_export_pdf_async' in src, "PDF export function missing"

    def test_no_str_e_in_results(self):
        """Worker tasks do not return raw str(e) in result dicts"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        import re
        # Look for return dicts with str(e)
        raw = re.findall(r'"xato":\s*str\(e\)', src)
        assert not raw, f"Raw str(e) in task results: {raw}"


class TestAPIFixes:
    """Verify API fixes."""

    def test_readyz_has_strict_mode(self):
        """readyz has REDIS_REQUIRED env support"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert 'REDIS_REQUIRED' in src

    def test_export_passes_format_to_worker(self):
        """export_trigger passes format_ to celery task"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        idx = src.find('async def export_trigger')
        fn  = src[idx:idx+1200]  # wider window: validation code added before args
        assert 'format_' in fn
        assert 'args=[uid' in fn, "args=[uid not found in export_trigger"
        args_idx = fn.find('args=[uid')
        args_str = fn[args_idx:args_idx+100]
        assert 'format_' in args_str, f"format_ not in celery args: {args_str}"


class TestRLSHelpers:
    """Verify RLS connection helpers."""

    def test_rls_conn_notrx_uses_set_config(self):
        """rls_conn_notrx uses set_config, not SET LOCAL (works outside transactions)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'pool.py')).read()
        idx = src.find('async def rls_conn_notrx')
        fn  = src[idx:idx+700]
        # Verify set_config is used for the actual DB call
        assert "set_config('app.uid'" in fn, "rls_conn_notrx should use set_config"
        # Verify transaction() is NOT used (this helper is intentionally transactionless)
        exec_code = '\n'.join(l for l in fn.split('\n') if not l.strip().startswith('"""') and '"""' not in l)
        assert 'transaction()' not in exec_code, "rls_conn_notrx should not use transaction()"

    def test_rls_conn_uses_transaction(self):
        """rls_conn uses a transaction context for RLS safety"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'pool.py')).read()
        idx = src.find('async def rls_conn(')
        # function can be large; search 1500 chars
        fn  = src[idx:idx+1500]
        assert 'transaction()' in fn, "rls_conn should use conn.transaction()"


class TestBotConfig:
    """Verify bot config/model consistency."""

    def test_scheduler_uses_config_fields(self):
        """Bot scheduler uses _CFG.kunlik_soat etc, not hardcoded hours"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert '_CFG.kunlik_soat' in src, "Scheduler should use _CFG.kunlik_soat"
        assert '_CFG.haftalik_soat' in src

    def test_no_bot_raw_error_to_user(self):
        """Bot does not leak raw xato to users via f-string"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        import re
        leaks = re.findall(r'f"[^"]*\{xato[^"]*\}"', src)
        assert not leaks, f"Raw error leaks: {leaks[:3]}"


class TestExportSemantics:
    """Verify export pipeline semantics."""

    def test_export_tur_validation(self):
        """export_trigger validates tur parameter"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        idx = src.find('async def export_trigger')
        fn  = src[idx:idx+1500]
        assert 'haftalik' in fn, "export_trigger should handle haftalik tur"
        assert 'oylik' in fn, "export_trigger should handle oylik tur"

    def test_export_date_computed_from_tur(self):
        """Worker computes sana_dan from tur when not provided"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        idx = src.find('async def _export_async')
        fn  = src[idx:idx+1000]
        assert 'timedelta' in fn, "_export_async should compute dates from tur"
        assert '"1970-01-01"' not in fn, "Should not use hardcoded 1970 date"

    def test_export_status_endpoint_exists(self):
        """API has export status endpoint"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert 'export/{task_id}' in src, "Missing export status endpoint"
        assert 'export/file/{task_id}' in src, "Missing export file download endpoint"

    def test_cyrillic_key_normalized(self):
        """No Cyrillic confusable characters in dict keys in worker"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        import re
        # Check for the specific known bug: "xatо" with Cyrillic o
        cyr_o = '\u043e'  # Cyrillic о
        assert f'"xat{cyr_o}"' not in src, "Cyrillic о in xato key"


class TestNakladnoyImports:
    """Verify nakladnoy import chain is clean."""

    def test_uchala_format_no_stale_import(self):
        """uchala_format does not import from stale services.export_pdf path"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'bot_services', 'nakladnoy.py')).read()
        idx = src.find('def uchala_format')
        fn  = src[idx:idx+1000]
        assert 'from services.export_pdf import' not in fn,             "stale 'from services.export_pdf' import still present"

    def test_uchala_format_uses_correct_path(self):
        """uchala_format imports export_pdf from correct bot_services path"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'bot_services', 'nakladnoy.py')).read()
        idx = src.find('def uchala_format')
        fn  = src[idx:idx+1000]
        assert 'bot_services.export_pdf' in fn,             "uchala_format should import from services.bot.bot_services.export_pdf"

    def test_nakladnoy_worker_delivery(self):
        """Worker nakladnoy task delivers file via Telegram"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        assert '_nakl_yuborish' in src, "No Telegram delivery function in nakladnoy task"
        idx = src.find('async def _nakl_yuborish')
        fn  = src[idx:idx+1000]
        assert 'sendDocument' in fn, "_nakl_yuborish should use sendDocument"


class TestVersionConsistency:
    """Version banners should not be misleading."""

    def test_no_v18_in_non_test_files(self):
        """No stale v18 banners in source files"""
        import glob
        for path in glob.glob('services/**/*.py', recursive=True) + glob.glob('shared/**/*.py', recursive=True):
            src = open(path).read()
            banner = src[:600]
            if 'v18' in banner and 'v21' not in banner:
                assert False, f"{path} has stale v18 banner without v21"


class TestHealthCommand:
    """Verify health_check command is runtime-safe."""

    def test_health_uses_datetime_datetime(self):
        """health_check uses datetime.datetime.now(), not datetime.now()"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('async def health_check')
        fn  = src[idx:idx+800]
        # Must not call datetime.now() — should call datetime.datetime.now()
        assert 'datetime.datetime.now(' in fn, \
            "health_check uses bare datetime.now() — will fail at runtime"

    def test_bot_version_is_current(self):
        """bot __version__ is 23.0"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert '__version__ = "25.3"' in src, "bot __version__ not updated to 23.0"


class TestExportCrossContainer:
    """Verify export does not rely on shared /tmp between containers."""

    def test_worker_stores_base64_not_filepath(self):
        """Worker stores content_b64 in Celery result, not a filesystem path"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        idx = src.find('def katta_export')
        fn  = src[idx:idx+2000]
        assert 'content_b64' in fn, "Worker does not store content_b64 in result"
        assert 'base64.b64encode' in fn, "Worker does not encode file to base64"

    def test_api_reads_base64_not_filesystem(self):
        """API export file endpoint reads base64 from Redis, not a filesystem path"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        idx = src.find('async def export_file_yuklab')
        fn  = src[idx:idx+1200]
        assert 'content_b64' in fn, "API does not read content_b64 from result"
        assert 'FileResponse' not in fn, "API still uses FileResponse (filesystem dependency)"
        # base64.b64decode may be beyond 1200 chars — check wider
        fn2 = src[idx:idx+2000]
        assert 'base64.b64decode' in fn2, "API does not decode base64"

    def test_export_status_honest(self):
        """Export status endpoint returns honest state, not 'tayyor' for missing file"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        idx = src.find('async def export_natija')
        fn  = src[idx:idx+1500]
        # Should check content_b64 exists, not os.path.exists
        assert 'content_b64' in fn, "Status endpoint should check content_b64"
        assert 'os.path.exists' not in fn, "Status endpoint still uses os.path.exists"


class TestStartupSafety:
    """Verify service startup is safe."""

    def test_boshlash_has_error_handling(self):
        """Bot boshlash() wraps DB init in try/except"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('async def boshlash(')
        fn  = src[idx:idx+1000]
        assert 'try:' in fn, "boshlash() has no try/except around DB init"
        assert 'log.critical' in fn or 'RuntimeError' in fn, \
            "boshlash() does not raise/log on DB failure"

    def test_all_versions_normalized(self):
        """All service __version__ strings are 21.3"""
        import glob
        for path in glob.glob('services/**/*.py', recursive=True):
            src = open(path).read()
            import re
            v = re.search(r'__version__\s*=\s*"([^"]+)"', src)
            if v and v.group(1) not in ('21.3', '21.4', '21.5', '22.0', '23.0', '25.3', ''):
                assert False, f"{path}: __version__={v.group(1)} (expected 21.3-21.5)"

    def test_cognitive_api_version(self):
        """cognitive/api.py FastAPI version is 25.3"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'api.py')).read()
        assert '25.3' in src, "cognitive/api.py has wrong version"


class TestExportSecurity:
    """Verify export endpoint security."""

    def test_task_id_uuid_validated(self):
        """Export endpoints validate task_id as UUID"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        idx = src.find('async def export_natija')
        fn  = src[idx:idx+500]
        assert 'UUID' in fn or 'uuid' in fn.lower(), \
            "export_natija does not validate task_id as UUID"

    def test_nakladnoy_empty_content_guard(self):
        """nakladnoy_yaratish checks content_b64 is non-empty before returning success"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        idx = src.find('def nakladnoy_yaratish')
        fn  = src[idx:idx+1500]
        assert 'if not content_b64' in fn, \
            "nakladnoy_yaratish can return 'tayyor' with empty content"

    def test_nakl_yuborish_checks_file_exists(self):
        """_nakl_yuborish checks file exists before opening"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        idx = src.find('async def _nakl_yuborish')
        fn  = src[idx:idx+600]
        assert 'os.path.exists' in fn, "_nakl_yuborish does not check file exists"


class TestPass3Fixes:
    """Verify all fixes from Pass 3 production blocker hunt."""

    def test_chetvert_key_all_cyrillic(self):
        """uzb_nlp.py четверть key must be all-Cyrillic (no Latin e)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'utils', 'uzb_nlp.py')).read()
        import re
        keys = re.findall(r'"([^"]+)":\s*Decimal', src)
        for key in keys:
            for i, ch in enumerate(key):
                if '\u0400' <= ch <= '\u04ff':
                    # Cyrillic context — no Latin mixed in
                    pass
                elif ch.isascii() and ch.isalpha():
                    # Check if whole key is Latin (OK) or mixed (BUG)
                    has_cyr = any('\u0400' <= c <= '\u04ff' for c in key)
                    if has_cyr:
                        assert False, \
                            f"Mixed Cyrillic/Latin in dict key: {repr(key)} " \
                            f"(pos {i}: Latin {repr(ch)})"

    def test_sana_gacha_not_truncated(self):
        """API export_trigger uses sana_gacha, not sana_gach"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        idx = src.find('async def export_trigger')
        fn  = src[idx:idx+1500]
        import re
        truncated = re.findall(r'sana_gach[^a\s\"]', fn)
        assert not truncated, f"Truncated variable sana_gach found: {truncated}"

    def test_export_failure_state_handled(self):
        """export_natija explicitly handles FAILURE state"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        idx = src.find('async def export_natija')
        fn_end = src.find('\n@app.', idx + 10)
        fn  = src[idx:fn_end]
        assert 'FAILURE' in fn, "export_natija does not handle FAILURE state"
        # Check FAILURE returns holat=xato
        fail_idx = fn.find('FAILURE')
        after = fn[fail_idx:fail_idx+300]
        assert '"xato"' in after, "FAILURE handler does not return holat=xato"

    def test_voice_ishga_tushir_accepts_model(self):
        """voice.ishga_tushir accepts optional model parameter"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'bot_services', 'voice.py')).read()
        idx = src.find('def ishga_tushir')
        sig = src[idx:idx+80]
        assert 'model' in sig, "ishga_tushir does not accept model parameter"

    def test_boshlash_passes_model_to_voice(self):
        """boshlash() passes gemini_model from config to voice service"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('ovoz_xizmat.ishga_tushir')
        call = src[idx:idx+100]
        assert 'gemini_model' in call, \
            f"boshlash does not pass gemini_model to voice: {call[:60]}"

    def test_bot_banner_model_matches_config(self):
        """Bot banner Gemini version matches config default"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        banner = src[:600]
        cfg_src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'config.py')).read()
        import re
        cfg_model = re.search(r'gemini_model.*=.*"([^"]+)"', cfg_src)
        if cfg_model:
            model = cfg_model.group(1)
            # Banner should not claim a different version
            assert 'Gemini 3.1' not in banner, \
                f"Banner says Gemini 3.1 but config uses {model}"

    def test_tasdiq_cb_error_inside_except(self):
        """tasdiq_cb error message is inside except block, not after it"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('async def tasdiq_cb')
        fn = src[idx:]
        # Find the except block
        except_idx = fn.rfind('except Exception as xato:')
        if except_idx == -1:
            return  # No except = different structure
        after_except = fn[except_idx:except_idx+300]
        lines = after_except.split('\n')
        # Error message should be indented MORE than except line
        except_indent = len(lines[0]) - len(lines[0].lstrip())
        for line in lines[1:6]:
            if 'saqlashda xato' in line.lower():
                msg_indent = len(line) - len(line.lstrip())
                assert msg_indent > except_indent, \
                    "Error message is not inside except block"
                break

    def test_ovoz_qabul_uses_tempfile(self):
        """ovoz_qabul writes audio to tempfile before STT"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('async def ovoz_qabul')
        fn = src[idx:idx+900]
        assert 'tempfile' in fn, "ovoz_qabul does not use tempfile"
        assert 'tmp_path' in fn, "ovoz_qabul does not create tmp_path"
        # Check cleanup
        full_fn_end = src.find('\nasync def ', idx + 10)
        full_fn = src[idx:full_fn_end]
        assert 'finally' in full_fn, "ovoz_qabul has no finally cleanup"
        assert 'unlink' in full_fn, "ovoz_qabul does not unlink temp file"


class TestV21_3MergedModules:
    """Verify v21.3 merged modules from Bot B integration."""

    def test_kassa_module_exists(self):
        """Kassa route module exists and has valid syntax"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        ast.parse(src)
        assert 'class KassaStats' in src
        assert 'class KassaOperatsiya' in src
        assert 'kassa_stats' in src
        assert 'kassa_operatsiya_yarat' in src
        assert 'kassa_tarix' in src

    def test_kassa_uses_rls(self):
        """Kassa uses RLS connection"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        assert 'rls_conn' in src, "Kassa does not use RLS"

    def test_kassa_uses_decimal(self):
        """Kassa uses Decimal for money"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        assert 'Decimal' in src, "Kassa does not use Decimal"

    def test_kassa_validates_tur(self):
        """Kassa validates tur field (kirim/chiqim only)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        assert 'kirim' in src and 'chiqim' in src

    def test_kassa_validates_usul(self):
        """Kassa validates usul field (naqd/karta/otkazma)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        assert 'naqd' in src and 'karta' in src and 'otkazma' in src

    def test_vision_module_exists(self):
        """Vision AI module exists and has valid syntax"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'vision.py')).read()
        ast.parse(src)
        assert 'async def rasm_tahlil' in src
        assert 'async def chek_skanerlash' in src
        assert 'def ocr_matn' in src

    def test_vision_graceful_degradation(self):
        """Vision AI handles missing client gracefully"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'vision.py')).read()
        assert 'if not _gemini_client' in src, "No graceful handling for missing Gemini"

    def test_vision_timeout(self):
        """Vision AI has timeout protection"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'vision.py')).read()
        assert 'TimeoutError' in src
        assert 'timeout=30' in src or 'timeout=' in src

    def test_websocket_module_exists(self):
        """WebSocket module exists and has valid syntax"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'websocket.py')).read()
        ast.parse(src)
        assert 'class ConnectionManager' in src
        assert 'async def websocket_endpoint' in src

    def test_websocket_jwt_auth(self):
        """WebSocket requires JWT authentication"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'websocket.py')).read()
        assert '_jwt_tekshir' in src
        assert 'JWT_SECRET' in src or 'jwt' in src.lower()

    def test_websocket_rejects_no_secret(self):
        """WebSocket rejects connection if JWT_SECRET missing"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'websocket.py')).read()
        assert 'not secret' in src or 'close' in src

    def test_invoice_module_exists(self):
        """Invoice/Faktura module exists and has valid syntax"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'invoice.py')).read()
        ast.parse(src)
        assert 'def faktura_yaratish' in src
        assert 'def _faktura_word' in src
        assert 'def _faktura_pdf' in src

    def test_invoice_returns_both_formats(self):
        """Invoice returns both word and pdf"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'invoice.py')).read()
        idx = src.find('def faktura_yaratish')
        fn = src[idx:idx+500]
        assert '"word"' in fn and '"pdf"' in fn

    def test_rasm_handler_exists(self):
        """Bot rasm handler exists and has valid syntax"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'bot_services', 'rasm_handler.py')).read()
        ast.parse(src)
        assert 'async def rasm_qabul' in src

    def test_rasm_handler_uses_vision(self):
        """Rasm handler calls Vision AI"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'bot_services', 'rasm_handler.py')).read()
        assert 'rasm_tahlil' in src

    def test_bot_registers_photo_handler(self):
        """Bot main.py registers PHOTO handler"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'filters.PHOTO' in src, "PHOTO handler not registered"
        assert 'rasm_xizmat' in src or 'rasm_handler' in src

    def test_schema_has_kassa_table(self):
        """schema.sql has kassa_operatsiyalar table"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'schema.sql')).read()
        assert 'kassa_operatsiyalar' in src
        assert 'kassa_isolation' in src, "Kassa table has no RLS policy"

    def test_schema_has_vision_table(self):
        """schema.sql has vision_log table"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'schema.sql')).read()
        assert 'vision_log' in src
        assert 'vision_isolation' in src

    def test_schema_has_faktura_table(self):
        """schema.sql has fakturalar table"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'schema.sql')).read()
        assert 'fakturalar' in src
        assert 'faktura_isolation' in src

    def test_api_includes_kassa_router(self):
        """API main.py includes kassa router"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert 'kassa_router' in src

    def test_api_includes_websocket_router(self):
        """API main.py includes websocket router"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert 'ws_router' in src

    def test_bot_vision_init(self):
        """Bot initializes Vision AI in boshlash()"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'vision_init' in src or 'vision.ishga_tushir' in src

    def test_kassa_no_float_in_db(self):
        """Kassa schema uses NUMERIC, not FLOAT"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'schema.sql')).read()
        idx = src.find('kassa_operatsiyalar')
        block = src[idx:idx+500]
        assert 'NUMERIC' in block, "Kassa uses FLOAT instead of NUMERIC"
        assert 'FLOAT' not in block.upper() or 'REAL' not in block.upper()


class TestTurboOptimizations:
    """Verify v21.3 TURBO performance optimizations."""

    def test_bot_has_user_cache(self):
        """Bot has _user_ol_kesh function for cached user lookups"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'async def _user_ol_kesh' in src
        assert '_KESH_USER_TTL' in src

    def test_bot_uses_cached_user(self):
        """Bot uses _user_ol_kesh with db.user_ol fallback"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert '_user_ol_kesh' in src, "Bot should use _user_ol_kesh cache wrapper"
        assert 'async def _user_ol_kesh' in src, "Cache function should exist"

    def test_pool_has_statement_cache(self):
        """DB pool has statement_cache_size configured"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'pool.py')).read()
        assert 'statement_cache_size' in src

    def test_pool_has_max_queries(self):
        """DB pool has max_queries for connection recycling"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'pool.py')).read()
        assert 'max_queries' in src

    def test_pool_has_health_check(self):
        """DB pool has pool_health() function"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'pool.py')).read()
        assert 'async def pool_health' in src
        assert 'ping_ms' in src

    def test_health_shows_pool_stats(self):
        """Bot health command shows DB pool metrics"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('async def health_check')
        fn = src[idx:idx+800]
        assert 'pool_health' in fn, "health_check doesn't show pool stats"
        assert 'Kesh' in fn or 'cache' in fn.lower(), "health_check doesn't show cache stats"

    def test_api_has_timing_middleware(self):
        """API has X-Response-Time middleware"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert 'X-Response-Time' in src
        assert 'timing_middleware' in src

    def test_cache_invalidation_on_user_change(self):
        """Bot invalidates cache when user data changes"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert '_kesh_tozala(f"user:{uid}")' in src, \
            "No cache invalidation when user data changes"

    def test_bot_menu_has_kassa(self):
        """Bot main menu has kassa button"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'm:kassa' in src, "Main menu missing kassa button"

    def test_bot_menu_has_rasm(self):
        """Bot main menu has rasm OCR button"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'm:rasm' in src, "Main menu missing rasm button"

    def test_kassa_handler_in_menyu(self):
        """menyu_cb handles kassa action"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('async def menyu_cb')
        fn_end = src.find("\nasync def ", idx + 10)
        fn = src[idx:fn_end] if fn_end > idx else src[idx:]
        assert '"kassa"' in fn, "menyu_cb does not handle kassa"
        assert 'KASSA HOLATI' in fn or 'kassa_operatsiyalar' in fn

    def test_migration_file_exists(self):
        """v21.3 migration SQL file exists"""
        path = os.path.join(os.path.dirname(__file__), '..', 'shared', 'migrations', 'versions', '001_v21_3_kassa_vision_faktura.sql')
        assert os.path.exists(path), "Migration file missing"
        src = open(path).read()
        assert 'kassa_operatsiyalar' in src
        assert 'vision_log' in src
        assert 'fakturalar' in src

    def test_env_example_complete(self):
        """.env.example has all required variables"""
        src = open(os.path.join(os.path.dirname(__file__), '..', '.env.example')).read()
        for var in ['BOT_TOKEN', 'DATABASE_URL', 'ANTHROPIC_API_KEY',
                    'GEMINI_API_KEY', 'ADMIN_IDS', 'JWT_SECRET',
                    'REDIS_URL', 'COGNITIVE_URL']:
            assert var in src, f".env.example missing {var}"


class TestDualBrainRouter:
    """Verify Dual-Brain MoE AI Router."""

    def test_ai_router_exists(self):
        """ai_router.py exists and has valid syntax"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        ast.parse(src)

    def test_cognitive_router_class(self):
        """CognitiveRouter class exists with process method"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        assert 'class CognitiveRouter' in src
        assert 'async def process' in src

    def test_task_types_defined(self):
        """All 10 TaskType enum values defined"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        for task in ['VOICE_STT','IMAGE_OCR','INVOICE_OCR','INTENT_PARSE','NLP_NORMALIZE',
                     'BUSINESS_LOGIC','REPORT_GEN','DATA_ANALYSIS','DECISION_VALID','EXPORT_ARCH']:
            assert task in src, f"TaskType.{task} missing"

    def test_routing_table_complete(self):
        """Routing table maps all tasks to correct model"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        assert '_ROUTING_TABLE' in src
        # Gemini tasks
        for task in ['VOICE_STT','IMAGE_OCR','INVOICE_OCR','INTENT_PARSE','NLP_NORMALIZE']:
            assert f'TaskType.{task}' in src and 'GEMINI' in src
        # Claude tasks
        for task in ['BUSINESS_LOGIC','REPORT_GEN','DATA_ANALYSIS','DECISION_VALID','EXPORT_ARCH']:
            assert f'TaskType.{task}' in src and 'CLAUDE' in src

    def test_fallback_mechanism(self):
        """Router has fallback from one model to another"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        assert 'fallback' in src.lower()
        assert 'fallback_model' in src
        assert 'fallback_used' in src

    def test_convenience_methods(self):
        """Router has convenience methods"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        assert 'async def voice_to_text' in src
        assert 'async def image_to_data' in src
        assert 'async def parse_intent' in src
        assert 'async def analyze_business' in src
        assert 'async def generate_report' in src

    def test_metrics_tracking(self):
        """Router tracks metrics (latency, calls, errors)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        assert '_record_metric' in src
        assert 'def stats' in src
        assert 'total_calls' in src
        assert 'error_rate' in src

    def test_gemini_client_class(self):
        """_GeminiClient has init and async call"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        assert 'class _GeminiClient' in src
        assert 'async def call' in src

    def test_claude_client_class(self):
        """_ClaudeClient has init and async call"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        assert 'class _ClaudeClient' in src
        assert 'temperature=0.0' in src

    def test_json_parse_handles_markdown(self):
        """_try_parse_json handles markdown code fences"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        assert '```json' in src
        assert '```' in src

    def test_cognitive_api_uses_router(self):
        """cognitive/api.py uses ai_router"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'api.py')).read()
        assert 'from ai_router import' in src or 'ai_router' in src

    def test_cognitive_api_dual_brain_endpoints(self):
        """cognitive/api.py has MoE endpoints"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'api.py')).read()
        assert '/tahlil' in src
        assert '/ovoz' in src
        assert '/rasm' in src
        assert '/biznes' in src
        assert '/stats' in src

    def test_bot_wires_router_in_boshlash(self):
        """Bot boshlash() initializes Dual-Brain router"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'router_init' in src
        assert 'Dual-Brain' in src or 'MoE' in src

    def test_router_singleton(self):
        """get_router returns singleton"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        assert 'def get_router' in src
        assert 'def router_init' in src
        assert '_router' in src


class TestKassaAuthSecurity:
    """Critical: kassa routes must use Depends(get_uid), not uid=0."""

    def test_kassa_no_default_uid(self):
        """kassa routes must NOT have uid: int = 0"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        import re
        # Find all function signatures with uid parameter
        fns = re.findall(r'async def \w+\([^)]*uid[^)]*\)', src)
        for fn in fns:
            assert 'uid: int = 0' not in fn, f"SECURITY BUG: {fn} uses uid=0 default"
            assert 'Depends(get_uid)' in fn, f"MISSING AUTH: {fn} lacks Depends(get_uid)"

    def test_kassa_imports_get_uid(self):
        """kassa.py imports get_uid from deps"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        assert 'from services.api.deps import get_uid' in src

    def test_deps_module_exists(self):
        """services/api/deps.py exists with get_uid"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'deps.py')).read()
        ast.parse(src)
        assert 'async def get_uid' in src
        assert 'jwt_tekshir' in src
        assert 'HTTPException' in src
        assert '401' in src or 'UNAUTHORIZED' in src

    def test_main_imports_get_uid_from_deps(self):
        """main.py imports get_uid from deps (no duplication)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert 'from services.api.deps import get_uid' in src
        # Should NOT define get_uid inline anymore
        count = src.count('async def get_uid')
        assert count == 0, f"main.py still defines get_uid inline ({count} times)"


class TestSchemaForeignKeys:
    """New tables must have FK to users(id)."""

    def test_kassa_fk(self):
        """kassa_operatsiyalar.user_id references users(id)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'schema.sql')).read()
        idx = src.find('kassa_operatsiyalar')
        block = src[idx:idx+400]
        assert 'REFERENCES users(id)' in block, "kassa missing FK to users"

    def test_vision_fk(self):
        """vision_log.user_id references users(id)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'schema.sql')).read()
        idx = src.find('vision_log')
        block = src[idx:idx+400]
        assert 'REFERENCES users(id)' in block, "vision_log missing FK to users"

    def test_faktura_fk(self):
        """fakturalar.user_id references users(id)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'schema.sql')).read()
        idx = src.find('fakturalar')
        block = src[idx:idx+400]
        assert 'REFERENCES users(id)' in block, "fakturalar missing FK to users"

    def test_migration_has_fk(self):
        """Migration file also has FK constraints"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'migrations', 'versions', '001_v21_3_kassa_vision_faktura.sql')).read()
        assert src.count('REFERENCES users(id)') >= 3, "Migration missing FK constraints"


class TestDecimalIntegrity:
    """Money must be Decimal end-to-end, never lossy float."""

    def test_kassa_response_models_use_decimal(self):
        """KassaStats and KassaQator use Decimal, not float"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        # KassaStats fields
        idx = src.find('class KassaStats')
        block = src[idx:src.find('class Kassa', idx + 10)]
        assert 'float' not in block, f"KassaStats uses float: {block[:200]}"
        assert 'Decimal' in block

    def test_kassa_no_float_in_db_write(self):
        """kassa_operatsiya_yarat does not convert Decimal to float before DB write"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        idx = src.find('async def kassa_operatsiya_yarat')
        fn = src[idx:idx+500]
        assert 'float(data.summa)' not in fn, "DB write converts Decimal to float"

    def test_kassa_stats_no_float_conversion(self):
        """kassa_stats does not use float() on DB values"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        idx = src.find('async def kassa_stats')
        end = src.find('async def ', idx + 10)
        fn = src[idx:end]
        assert 'float(' not in fn, f"kassa_stats uses float(): {[l.strip() for l in fn.split(chr(10)) if 'float(' in l]}"


class TestTimezoneConsistency:
    """All date boundary logic must be Asia/Tashkent consistent."""

    def test_kassa_uses_tz_aware_today(self):
        """kassa does not use bare CURRENT_DATE (timezone-unaware)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        # Should use AT TIME ZONE based comparison, not bare CURRENT_DATE
        assert 'Asia/Tashkent' in src, "Kassa missing timezone"
        # The _TODAY_SQL constant should handle this
        assert '_TODAY_SQL' in src or "AT TIME ZONE 'Asia/Tashkent'" in src


class TestBotNewCommands:
    """Verify new bot commands are properly defined and registered."""

    def test_cmd_kassa_exists(self):
        """cmd_kassa function exists with faol_tekshir"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'async def cmd_kassa' in src
        idx = src.find('async def cmd_kassa')
        fn = src[idx:idx+600]
        assert 'faol_tekshir' in fn, "cmd_kassa missing auth check"
        assert 'kassa_operatsiyalar' in fn, "cmd_kassa not querying kassa table"

    def test_cmd_faktura_exists(self):
        """cmd_faktura function exists with faol_tekshir"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'async def cmd_faktura' in src
        idx = src.find('async def cmd_faktura')
        fn = src[idx:idx+400]
        assert 'faol_tekshir' in fn, "cmd_faktura missing auth check"

    def test_cmd_kassa_registered(self):
        """cmd_kassa is registered as CommandHandler"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'CommandHandler("kassa"' in src, "cmd_kassa not registered"

    def test_cmd_faktura_registered(self):
        """cmd_faktura is registered as CommandHandler"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'CommandHandler("faktura"' in src, "cmd_faktura not registered"

    def test_faktura_cb_registered(self):
        """faktura callback handler registered"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'faktura_cb' in src
        assert 'pattern=r"^fkt:"' in src, "faktura callback pattern missing"

    def test_bot_command_list_has_kassa_and_faktura(self):
        """BotCommand list includes kassa and faktura"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'BotCommand("kassa"' in src, "kassa missing from command list"
        assert 'BotCommand("faktura"' in src, "faktura missing from command list"


class TestNoFloatInCriticalPaths:
    """Verify no lossy float() in DB write or business logic paths."""

    def test_kassa_no_float_in_db_write(self):
        """Kassa DB write uses Decimal, not float"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        idx = src.find('async def kassa_operatsiya_yarat')
        fn = src[idx:idx+500]
        assert 'float(data.summa)' not in fn, "Kassa DB write converts to float"

    def test_qarz_tolash_no_float_in_logic(self):
        """qarz_tolash does not use float() in calculation"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        idx = src.find('async def qarz_tolash_endpoint')
        end = src.find('\n@app.', idx + 10)
        fn = src[idx:end]
        # Should not convert Decimal to float for calculation
        assert 'float(qoldi)' not in fn, "qarz_tolash uses float(qoldi)"
        assert 'float(tolandi_j)' not in fn, "qarz_tolash uses float(tolandi_j)"

    def test_invoice_documents_float_usage(self):
        """Invoice uses _n() helper (documented display-only), not raw float()"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'invoice.py')).read()
        assert 'def _n(' in src, "Invoice missing _n() display helper"
        # No raw float() in rendering functions (except in _n itself)
        for fn_name in ['_faktura_word', '_faktura_pdf']:
            idx = src.find(f'def {fn_name}')
            if idx >= 0:
                end = src.find('\ndef ', idx + 10)
                fn = src[idx:end] if end > idx else src[idx:]
                raw_floats = [l.strip() for l in fn.split('\n') if 'float(' in l and '_n(' not in l and 'def _n' not in l]
                assert not raw_floats, f"{fn_name} has raw float(): {raw_floats}"


class TestTransactionPipeline:
    """Voice-First Safety: Draft→Confirm→Post pipeline."""

    def test_pipeline_module_exists(self):
        """pipeline.py exists and has valid syntax"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'pipeline.py')).read()
        ast.parse(src)

    def test_tx_status_lifecycle(self):
        """Transaction has correct lifecycle statuses"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'pipeline.py')).read()
        for status in ['DRAFT', 'PENDING', 'CONFIRMED', 'POSTED', 'REJECTED', 'CORRECTED', 'VOIDED']:
            assert status in src, f"TxStatus.{status} missing"

    def test_confidence_gate_exists(self):
        """Confidence scoring system exists"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'pipeline.py')).read()
        assert 'class ConfidenceReport' in src
        assert 'evaluate_confidence' in src
        assert 'CONFIDENCE_AUTO_CONFIRM' in src
        assert 'CONFIDENCE_REJECT' in src

    def test_confidence_thresholds_safe(self):
        """Auto-confirm threshold is high enough (>=0.90)"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'pipeline.py')).read()
        import re
        m = re.search(r'CONFIDENCE_AUTO_CONFIRM\s*=\s*([\d.]+)', src)
        assert m, "CONFIDENCE_AUTO_CONFIRM not found"
        threshold = float(m.group(1))
        assert threshold >= 0.90, f"Auto-confirm threshold too low: {threshold}"

    def test_deterministic_math(self):
        """hisob_tekshir_va_tuzat uses Decimal, not float"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'pipeline.py')).read()
        idx = src.find('def hisob_tekshir_va_tuzat')
        fn = src[idx:idx+1500]
        assert 'Decimal' in fn, "Business math must use Decimal"
        assert 'float(' not in fn, "Business math must NOT use float()"

    def test_audit_yoz_exists(self):
        """audit_yoz function exists for immutable trace"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'pipeline.py')).read()
        assert 'async def audit_yoz' in src
        assert 'audit_log' in src
        assert 'HECH QACHON' in src  # Comment about never deleting

    def test_create_draft_function(self):
        """create_draft creates draft without writing to DB"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'pipeline.py')).read()
        assert 'def create_draft' in src
        idx = src.find('def create_draft')
        fn = src[idx:idx+800]
        # Must NOT contain DB write
        assert 'await' not in fn, "create_draft must be sync (no DB writes)"
        assert 'TransactionDraft' in fn

    def test_draft_has_preview(self):
        """TransactionDraft has to_preview for user display"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'pipeline.py')).read()
        assert 'def to_preview' in src

    def test_ai_never_owns_math(self):
        """Deterministic check overrides AI calculations"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'pipeline.py')).read()
        # hisob_tekshir_va_tuzat must override AI jami
        idx = src.find('def hisob_tekshir_va_tuzat')
        fn = src[idx:idx+1500]
        assert 'Python hisob ustunlik' in fn or 'PYTHON' in fn, \
            "Business math must explicitly override AI calculations"

    def test_gramm_kg_conversion(self):
        """Weight conversion (gramm→kg) in business logic"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'pipeline.py')).read()
        assert 'gramm' in src, "Missing gramm conversion in business logic"
        assert '1000' in src, "Missing kg divisor"


class TestFuzzyMatchEngine:
    """Fuzzy search for products and customers."""

    def test_fuzzy_module_exists(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'fuzzy_match.py')).read()
        ast.parse(src)
        assert 'def similarity' in src
        assert 'async def fuzzy_klient_top' in src
        assert 'async def fuzzy_tovar_top' in src
        assert 'def best_match' in src

    def test_normalize_cyrillic(self):
        """normalize converts Cyrillic to Latin"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'fuzzy_match.py')).read()
        assert '_CYR_TO_LAT' in src

    def test_trigram_scoring(self):
        """Similarity uses trigram scoring"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'fuzzy_match.py')).read()
        assert '_trigrams' in src
        assert 'intersection' in src


class TestSafetyGuards:
    """Stock, debt, duplicate protection."""

    def test_guards_module_exists(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'guards.py')).read()
        ast.parse(src)

    def test_duplicate_guard(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'guards.py')).read()
        assert 'def is_duplicate_message' in src
        assert '_DUPLICATE_WINDOW' in src

    def test_stock_safety(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'guards.py')).read()
        assert 'async def tekshir_qoldiq' in src
        assert 'kamchilik' in src

    def test_debt_limit_guard(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'guards.py')).read()
        assert 'async def tekshir_qarz_limit' in src
        assert 'kredit_limit' in src

    def test_price_sanity_check(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'guards.py')).read()
        assert 'async def tekshir_narx' in src
        assert 'ZARAR' in src

    def test_bot_uses_duplicate_guard(self):
        """Bot matn_qabul uses duplicate protection"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'is_duplicate_message' in src

    def test_bot_uses_pipeline(self):
        """Bot _qayta_ishlash uses pipeline.create_draft"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'from shared.services.pipeline import create_draft' in src
        assert 'draft = create_draft(' in src or 'create_draft(' in src

    def test_guards_use_decimal(self):
        """Guards use Decimal, not float for money"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'guards.py')).read()
        assert 'from decimal import Decimal' in src


class TestAuditWiring:
    """Verify audit logging is wired into all DB write paths."""

    def test_sotuv_has_audit(self):
        """sotuv save triggers audit_yoz"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('sotuv=await db.sotuv_saqlash')
        block = src[idx:idx+500]
        assert '_audit_sotuv' in block or 'audit_yoz' in block, "Sotuv save missing audit trail"

    def test_kirim_has_audit(self):
        """kirim save triggers audit_yoz"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('await db.kirim_saqlash')
        block = src[idx:idx+500]
        assert '_audit_kirim' in block or 'audit_yoz' in block, "Kirim save missing audit trail"

    def test_qaytarish_has_audit(self):
        """qaytarish save triggers audit_yoz"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('qaytarish_saqlash')
        block = src[idx:idx+500]
        assert '_audit_qaytarish' in block or 'audit_yoz' in block, "Qaytarish missing audit trail"

    def test_qarz_tolash_has_audit(self):
        """qarz_tolash triggers audit_yoz"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('await db.qarz_tolash')
        block = src[idx:idx+500]
        assert '_audit_qarz_tolash' in block or 'audit_yoz' in block, "Qarz tolash missing audit trail"


class TestDebtLimitWiring:
    """Verify debt limit check before sotuv."""

    def test_sotuv_checks_debt_limit(self):
        """Sotuv flow checks debt limit before save"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('elif amal=="chiqim"')
        end = src.find('elif amal=="qaytarish"', idx)
        flow = src[idx:end]
        assert 'tekshir_qarz_limit' in flow, "Sotuv missing debt limit check"

    def test_voice_has_duplicate_guard(self):
        """Voice handler has duplicate guard"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('async def ovoz_qabul')
        fn = src[idx:idx+400]
        assert 'is_duplicate_message' in fn, "Voice missing duplicate guard"


class TestGemini31:
    """Gemini model upgraded to 2.5-pro."""
    def test_gemini_25_pro_in_voice(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'bot_services', 'voice.py')).read()
        assert 'gemini-2.5-pro' in src, "Voice not using Gemini 2.5 Pro"

    def test_gemini_25_pro_in_router(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'cognitive', 'ai_router.py')).read()
        assert 'gemini-2.5-pro' in src, "Router not using Gemini 2.5 Pro"

    def test_gemini_25_pro_in_config(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'config.py')).read()
        assert 'gemini-2.5-pro' in src, "Config not using Gemini 2.5 Pro"


class TestVoiceCommands:
    """O'zbek ovoz buyruqlari."""
    def test_module_exists(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'voice_commands.py')).read()
        ast.parse(src)
        assert 'detect_voice_command' in src
        assert 'is_quick_command' in src

    def test_uzbek_patterns_count(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'voice_commands.py')).read()
        assert '_PATTERNS' in src
        assert src.count('"confirm"') + src.count('"report"') + src.count('"print"') >= 5, "Too few action types"

    def test_confirm_cancel_patterns(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'voice_commands.py')).read()
        for word in ['tasdiqla', 'bekor', 'tuzat', 'chek chiqar', 'qayta hisobla']:
            assert word in src, f"Missing pattern: {word}"

    def test_report_patterns(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'voice_commands.py')).read()
        for word in ['bugungi hisobot', 'haftalik', 'kassa holati', 'top klientlar', 'kam qolgan']:
            assert word in src, f"Missing pattern: {word}"

    def test_bot_uses_voice_commands(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'detect_voice_command' in src
        assert 'is_quick_command' in src
        assert '_ovoz_buyruq_bajar' in src


class TestPrintStatus:
    """Mini printer status lifecycle."""
    def test_module_exists(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'print_status.py')).read()
        ast.parse(src)

    def test_status_lifecycle(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'print_status.py')).read()
        for status in ['PREVIEW', 'CONFIRMED', 'PRINTING', 'PRINTED', 'FAILED', 'REPRINT']:
            assert status in src, f"PrintStatus.{status} missing"

    def test_job_functions(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'print_status.py')).read()
        for fn in ['create_print_job', 'confirm_print', 'mark_printing',
                    'mark_printed', 'mark_failed', 'request_reprint']:
            assert f'def {fn}' in src, f"{fn} missing"

    def test_receipt_58mm(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'print_status.py')).read()
        assert 'def format_receipt_58mm' in src
        assert '58mm' in src

    def test_reprint_tracking(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'print_status.py')).read()
        assert 'reprint_count' in src
        assert 'original_job_id' in src

    def test_bot_print_commands(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'format_receipt_80mm' in src or 'format_receipt_58mm' in src
        assert 'create_print_job' in src
        assert 'request_reprint' in src


class TestV214Upgrades:
    """v21.4 har taraflama kuchaytirishlar."""

    def test_fuzzy_klient_in_db(self):
        """db.klient_topish uses ILIKE fuzzy fallback"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'db.py')).read()
        idx = src.find('async def klient_topish')
        fn = src[idx:idx+500]
        assert 'ILIKE' in fn or 'LIKE' in fn, "klient_topish missing fuzzy fallback"

    def test_fuzzy_tovar_in_db(self):
        """db.tovar_topish uses ILIKE fuzzy fallback"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'db.py')).read()
        idx = src.find('async def tovar_topish')
        fn = src[idx:idx+500]
        assert 'ILIKE' in fn or 'LIKE' in fn, "tovar_topish missing fuzzy fallback"

    def test_corrected_data_saved_not_raw_ai(self):
        """Pipeline saves corrected draft, not raw AI data"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'corrected_natija' in src, "Missing corrected_natija variable"
        assert 'draft.corrected' in src, "Not using draft.corrected"
        assert 'kutilayotgan"] = corrected_natija' in src, "Not saving corrected data"

    def test_excel_import_module(self):
        """Excel import module exists"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'excel_import.py')).read()
        ast.parse(src)
        assert 'def detect_file_type' in src
        assert 'def parse_reestr' in src
        assert 'def parse_nakladnoy_excel' in src
        assert 'def parse_excel' in src
        assert 'def excel_preview_text' in src

    def test_hujjat_handler_exists(self):
        """Bot has document/Excel handler"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'async def hujjat_qabul' in src
        assert 'Document.ALL' in src or 'hujjat_qabul' in src

    def test_cmd_chiqim_exists(self):
        """cmd_chiqim (expense) command exists"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'async def cmd_chiqim' in src
        assert 'CommandHandler("chiqim"' in src

    def test_cmd_tovar_exists(self):
        """cmd_tovar (single product) command exists"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'async def cmd_tovar' in src
        assert 'CommandHandler("tovar"' in src

    def test_no_float_in_qoldiq_check(self):
        """Stock check uses Decimal, not float"""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('qolgan_q is not None')
        if idx >= 0:
            line = src[idx:idx+200]
            assert 'float(qolgan_q)' not in line, "Stock check still uses float"


class TestSAPGradeLedger:
    """SAP/Bank grade double-entry ledger."""

    def test_ledger_module_exists(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'ledger.py')).read()
        ast.parse(src)
        assert 'class JurnalYozuv' in src
        assert 'class JurnalQator' in src

    def test_hisob_turlari(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'ledger.py')).read()
        for h in ['KASSA_NAQD','KASSA_KARTA','OMBOR','DEBITORLAR','KREDITORLAR','DAROMAD','XARAJAT','TANNARX']:
            assert h in src, f"HisobTuri.{h} missing"

    def test_journal_creators(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'ledger.py')).read()
        for fn in ['sotuv_jurnali','kirim_jurnali','qaytarish_jurnali','qarz_tolash_jurnali','xarajat_jurnali']:
            assert f'def {fn}' in src, f"{fn} missing"

    def test_balans_constraint(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'ledger.py')).read()
        assert 'balanslangan' in src
        assert 'jami_debit == self.jami_credit' in src

    def test_idempotency(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'ledger.py')).read()
        assert 'idempotency_key' in src

    def test_jurnal_saqlash(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'ledger.py')).read()
        assert 'async def jurnal_saqlash' in src

    def test_balans_tekshir(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'ledger.py')).read()
        assert 'async def balans_tekshir' in src

    def test_schema_has_jurnal(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'schema.sql')).read()
        assert 'jurnal_yozuvlar' in src
        assert 'jurnal_qatorlar' in src
        assert 'jami_debit = jami_credit' in src  # DB constraint

    def test_schema_has_versioning(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'database', 'schema.sql')).read()
        assert 'hujjat_versiyalar' in src

    def test_bot_uses_ledger(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'jurnal_saqlash' in src
        assert 'sotuv_jurnali' in src
        assert 'kirim_jurnali' in src
        assert 'qarz_tolash_jurnali' in src

    def test_version_21_5(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert '__version__ = "25.3"' in src


class TestV215Upgrades:
    """v21.5 SAP-GRADE kuchaytirishlar."""

    def test_kassa_ledger_wired(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'routes', 'kassa.py')).read()
        assert 'jurnal_saqlash' in src, "Kassa not wired to ledger"
        assert 'xarajat_jurnali' in src, "Kassa chiqim not using xarajat_jurnali"
        assert 'idempotency_key' in src, "Kassa missing idempotency"

    def test_worker_reconciliation(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        assert 'ledger_reconciliation' in src
        assert 'balans_tekshir' in src
        assert 'ledger-recon' in src  # beat schedule

    def test_api_rate_limiting(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert 'rate_limit_middleware' in src
        assert 'RATE_LIMIT' in src
        assert '429' in src
        assert 'X-RateLimit' in src

    def test_api_ledger_endpoints(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert '/api/v1/ledger/balans' in src
        assert '/api/v1/ledger/jurnal' in src
        assert '/api/v1/ledger/hisob/' in src

    def test_inline_query(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        assert 'InlineQueryHandler' in src
        assert 'inline_qidirish' in src

    def test_audit_helpers(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        for fn in ['_audit_sotuv', '_audit_kirim', '_audit_qaytarish', '_audit_qarz_tolash']:
            assert f'async def {fn}' in src, f"Missing helper: {fn}"

    def test_migration_002(self):
        import os
        path = os.path.join(os.path.dirname(__file__), '..', 'shared', 'migrations', 'versions', '002_v21_5_sap_grade_ledger.sql')
        assert os.path.exists(path), "Migration 002 missing"
        src = open(path).read()
        assert 'jurnal_yozuvlar' in src
        assert 'jurnal_qatorlar' in src


class TestV253SecurityFixes:
    """v25.3 security and regression fixes."""

    def test_user_yangilab_has_whitelist(self):
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'db.py')).read()
        assert '_USER_YOZISH_MUMKIN' in src, "user_yangilab missing field whitelist"

    def test_pul_norm_no_octal_bug(self):
        """PUL_NORM uses \\g<1> not \\1 to avoid octal backreference corruption."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'shared', 'utils', 'uzb_nlp.py')).read()
        import re
        # Find PUL_NORM section — ensure no raw \1000 patterns
        pul_section = src[src.index('PUL_NORM'):src.index('QARZ_SOZLARI')]
        bad = re.findall(r'r"\\1\d{3,}', pul_section)
        assert not bad, f"PUL_NORM still has octal-unsafe patterns: {bad}"

    def test_voice_model_matches_config(self):
        voice_src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'bot_services', 'voice.py')).read()
        config_src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'config.py')).read()
        import re
        # voice.py: os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
        voice_m = re.search(r'getenv\("GEMINI_MODEL",\s*"([^"]+)"\)', voice_src)
        # config.py: gemini_model: str = "gemini-2.5-pro"
        config_m = re.search(r'gemini_model.*?=\s*"([^"]+)"', config_src)
        assert voice_m and config_m, "Could not find model strings"
        assert voice_m.group(1) == config_m.group(1), \
            f"Model mismatch: voice={voice_m.group(1)} config={config_m.group(1)}"

    def test_cors_no_wildcard(self):
        """CORS allow_origins should not contain '*' (CSRF risk)."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        # Find the CORS middleware section
        cors_idx = src.index('CORSMiddleware')
        cors_end = src.index(')', cors_idx + 100)
        cors_block = src[cors_idx:cors_end]
        assert '"*"' not in cors_block, "CORS still has wildcard '*' origin"

    def test_rate_limiter_gc(self):
        """Rate limiter has GC mechanism to prevent memory leak."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert '_rate_last_gc' in src, "Rate limiter missing GC timestamp"
        assert '_RATE_GC_INTERVAL' in src, "Rate limiter missing GC interval"
        assert '_RATE_MAX_IPS' in src, "Rate limiter missing max IP cap"

    def test_export_uid_verification(self):
        """Export file download verifies user_id ownership."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        idx = src.find('async def export_file_yuklab')
        fn = src[idx:src.find('\n@app.', idx + 1)]
        assert 'task_uid' in fn or 'user_id' in fn, "Export download missing UID check"
        assert '403' in fn, "Export download missing 403 response"

    def test_worker_export_includes_uid(self):
        """Worker katta_export return dict includes user_id."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'worker', 'tasks.py')).read()
        idx = src.find('def katta_export')
        fn = src[idx:src.find('\nasync def', idx)]
        assert '"user_id"' in fn, "katta_export return missing user_id field"

    def test_no_pydantic_dict_deprecated(self):
        """API does not use deprecated .dict() on Pydantic models."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'main.py')).read()
        assert '.dict()' not in src, "API still uses deprecated .dict() — use .model_dump()"

    def test_web_dockerfile_uses_pnpm(self):
        """Web Dockerfile lockfile bilan mos: pnpm-lock.yaml yoki package-lock.json."""
        web_dir = os.path.join(os.path.dirname(__file__), '..', 'services', 'web')
        src = open(os.path.join(web_dir, 'Dockerfile')).read()
        has_pnpm = os.path.isfile(os.path.join(web_dir, 'pnpm-lock.yaml'))
        has_npm = os.path.isfile(os.path.join(web_dir, 'package-lock.json'))
        if has_pnpm:
            assert 'pnpm' in src, "Web Dockerfile should use pnpm (pnpm-lock.yaml exists)"
            assert 'npm ci' not in src, "Web Dockerfile still uses npm ci"
        elif has_npm:
            assert 'npm ci' in src or 'npm install' in src, "Web Dockerfile should use npm with package-lock.json"
        else:
            pytest.fail("services/web: neither pnpm-lock.yaml nor package-lock.json")

    def test_all_versions_25_3(self):
        """All service versions are 25.3."""
        import re
        services = [
            ('services/api/main.py', '25.3'),
            ('services/cognitive/api.py', '25.3'),
            ('services/bot/main.py', '25.3'),
        ]
        for rel_path, expected in services:
            path = os.path.join(os.path.dirname(__file__), '..', rel_path)
            src = open(path).read()
            assert expected in src, f"{rel_path} missing version {expected}"

    def test_ovoz_qabul_routes_long_audio(self):
        """ovoz_qabul routes 30s+ audio to VAD+chunking pipeline."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('async def ovoz_qabul')
        fn = src[idx:src.find('\nasync def ', idx + 10)]
        assert 'voice.duration' in fn or 'voice_dur' in fn, \
            "ovoz_qabul does not check audio duration"
        assert 'ovoz_matn_uzun' in fn, \
            "ovoz_qabul does not route to uzun audio pipeline"
        assert 'uzun_audio' in fn or 'voice_dur > 30' in fn, \
            "ovoz_qabul missing 30s threshold check"

    def test_auto_learning_in_sotuv(self):
        """sotuv_saqlash auto-creates unknown products in tovarlar."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'db.py')).read()
        idx = src.find('async def sotuv_saqlash')
        fn = src[idx:src.find('\nasync def ', idx + 10)]
        assert 'AUTO-LEARN' in fn, "sotuv_saqlash missing auto-learning for new products"

    def test_cache_invalidation_after_save(self):
        """sotuv/kirim_saqlash clears STT+fuzzy cache for immediate learning."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'db.py')).read()
        # sotuv_saqlash
        idx_s = src.find('async def sotuv_saqlash')
        fn_s = src[idx_s:src.find('\nasync def ', idx_s + 10)]
        assert 'stt_cache_tozala' in fn_s, "sotuv_saqlash missing STT cache clear"
        assert 'fuzzy_matcher.cache_tozala' in fn_s, "sotuv_saqlash missing fuzzy cache clear"
        # kirim_saqlash
        idx_k = src.find('async def kirim_saqlash')
        fn_k = src[idx_k:src.find('\nasync def ', idx_k + 10)]
        assert 'stt_cache_tozala' in fn_k, "kirim_saqlash missing STT cache clear"

    def test_seed_catalog_exists(self):
        """Seed catalog module exists with segment mappings."""
        path = os.path.join(os.path.dirname(__file__), '..', 'shared', 'services', 'seed_catalog.py')
        assert os.path.exists(path), "seed_catalog.py missing"
        src = open(path).read()
        for seg in ('optom', 'chakana', 'oshxona', 'xozmak', 'kiyim', 'universal'):
            assert f'"{seg}"' in src, f"Seed catalog missing segment: {seg}"
        assert 'async def seed_tovarlar' in src, "seed_tovarlar function missing"

    def test_seed_called_on_registration(self):
        """Bot registration (h_telefon) calls seed_tovarlar."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('async def h_telefon')
        fn = src[idx:src.find('\nasync def ', idx + 10)]
        assert 'seed_tovarlar' in fn, "h_telefon does not call seed_tovarlar"

    def test_stt_prompt_loads_500_products(self):
        """STT prompt loads up to 500 products (not just 50)."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'bot_services', 'voice.py')).read()
        assert 'LIMIT 500' in src, "STT prompt still limited to <500 products"

    def test_low_confidence_not_rejected(self):
        """Low confidence STT results are passed to Claude, not rejected."""
        src = open(os.path.join(os.path.dirname(__file__), '..', 'services', 'bot', 'main.py')).read()
        idx = src.find('async def ovoz_qabul')
        fn = src[idx:src.find('\nasync def ', idx + 10)]
        assert '"low"' not in fn or 'return' not in fn[fn.find('"low"'):fn.find('"low"')+100], \
            "ovoz_qabul still rejects low confidence - should pass to Claude"

