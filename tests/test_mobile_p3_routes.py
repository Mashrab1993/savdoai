"""
Mobile P3 routes — auth/shape smoke tests.

DB-free: only verifies the router is wired and unauthenticated calls
return 401/403 rather than 5xx (route not found = 404 would be a regression).
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO = Path(__file__).parent.parent
sys.path.insert(0, str(REPO))


@pytest.fixture(scope="module")
def app():
    try:
        from services.api.main import app as a
        return a
    except Exception as e:
        pytest.skip(f"API app yuklanmadi: {e}")


@pytest.fixture(scope="module")
def client(app):
    try:
        from starlette.testclient import TestClient
        return TestClient(app, raise_server_exceptions=False)
    except ImportError:
        pytest.skip("starlette TestClient mavjud emas")


class TestMobileP3Routes:
    """Verify mobile P3 routes are registered and reject unauthenticated calls."""

    def test_visits_post_requires_auth(self, client):
        r = client.post("/api/v1/mobile/visits", json={"client_id": 1})
        # 401 (no token) or 422 (validation), but NEVER 404.
        assert r.status_code != 404, "visits endpoint not registered"
        assert r.status_code in (401, 403, 422)

    def test_visits_get_requires_auth(self, client):
        r = client.get("/api/v1/mobile/visits")
        assert r.status_code != 404
        assert r.status_code in (401, 403)

    def test_equipment_list_requires_auth(self, client):
        r = client.get("/api/v1/mobile/equipment")
        assert r.status_code != 404
        assert r.status_code in (401, 403)

    def test_equipment_create_requires_auth(self, client):
        r = client.post("/api/v1/mobile/equipment", json={"client_id": 1, "name": "Test"})
        assert r.status_code != 404
        assert r.status_code in (401, 403, 422)

    def test_equipment_patch_requires_auth(self, client):
        r = client.patch("/api/v1/mobile/equipment/1", json={"status": "ok", "name": "X"})
        assert r.status_code != 404
        assert r.status_code in (401, 403, 422)


class TestMobileP3Module:
    """Module-level smoke tests."""

    def test_module_imports(self):
        from services.api.routes import mobile_p3
        assert hasattr(mobile_p3, "router")

    def test_router_has_5_routes(self):
        from services.api.routes.mobile_p3 import router
        # POST/GET visits + GET/POST/PATCH equipment = 5
        assert len(router.routes) == 5

    def test_equipment_migration_sql_valid(self):
        from services.api.routes.mobile_p3 import EQUIPMENT_MIGRATION
        assert "CREATE TABLE IF NOT EXISTS equipment" in EQUIPMENT_MIGRATION
        assert "client_id" in EQUIPMENT_MIGRATION
        assert "user_id" in EQUIPMENT_MIGRATION
