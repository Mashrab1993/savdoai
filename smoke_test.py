#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — PRODUCTION SMOKE TEST                        ║
║                                                                  ║
║  Deploy qilgandan KEYIN ishga tushiring:                        ║
║  python3 smoke_test.py https://your-api-url.com                 ║
║                                                                  ║
║  Bu skript real serverda barcha endpointlarni tekshiradi.       ║
╚══════════════════════════════════════════════════════════════════╝
"""
import sys
import json
import time
import urllib.request
import urllib.error

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://localhost:8000"
TOKEN = sys.argv[2] if len(sys.argv) > 2 else ""

OK = FAIL = 0

def test(name, url, method="GET", expected_status=None, check_json=None, auth=False):
    global OK, FAIL
    full_url = f"{BASE}{url}"
    headers = {"Content-Type": "application/json"}
    if auth and TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    
    try:
        req = urllib.request.Request(full_url, method=method, headers=headers)
        start = time.time()
        with urllib.request.urlopen(req, timeout=10) as resp:
            ms = round((time.time() - start) * 1000)
            status = resp.status
            body = resp.read().decode()
            try:
                data = json.loads(body)
            except Exception:
                data = None
            
            ok = True
            if expected_status and status != expected_status:
                ok = False
            if check_json and data:
                for key in check_json:
                    if key not in data:
                        ok = False
            
            if ok:
                OK += 1
                print(f"  ✅ {name} ({ms}ms)")
            else:
                FAIL += 1
                print(f"  ❌ {name}: status={status}")
    except urllib.error.HTTPError as e:
        if expected_status and e.code == expected_status:
            OK += 1
            print(f"  ✅ {name} (expected {e.code})")
        else:
            FAIL += 1
            print(f"  ❌ {name}: HTTP {e.code}")
    except Exception as e:
        FAIL += 1
        print(f"  ❌ {name}: {e}")


print(f"🔍 SavdoAI Smoke Test — {BASE}")
print("=" * 50)

# ═══ PUBLIC ENDPOINTS ═══
print("\n📋 PUBLIC ENDPOINTS:")
test("Health", "/healthz", check_json=["status"])
test("Version", "/version", check_json=["version"])
test("OpenAPI", "/openapi.json", check_json=["paths"])
test("Root page", "/")

# ═══ AUTH CHECK ═══
print("\n🔒 AUTH TEKSHIRISH:")
test("Tovarlar (no auth)", "/api/v1/tovarlar", expected_status=401)
test("KPI (no auth)", "/api/v1/kpi", expected_status=401)
test("Advisor (no auth)", "/api/v1/advisor", expected_status=401)

# ═══ WEBHOOK ═══
print("\n💳 WEBHOOK:")
test("Click webhook", "/webhook/click", method="POST")
test("Payme webhook", "/webhook/payme", method="POST")

# ═══ RESPONSE HEADERS ═══
print("\n📡 HEADERS:")
try:
    req = urllib.request.Request(f"{BASE}/version")
    with urllib.request.urlopen(req, timeout=5) as resp:
        headers = dict(resp.headers)
        has_version = "X-Version" in headers or "x-version" in headers
        has_time = "X-Response-Time" in headers or "x-response-time" in headers
        if has_version: OK += 1; print("  ✅ X-Version header")
        else: FAIL += 1; print("  ❌ X-Version header yo'q")
        if has_time: OK += 1; print("  ✅ X-Response-Time header")
        else: FAIL += 1; print("  ❌ X-Response-Time header yo'q")
except Exception:
    FAIL += 2; print("  ❌ Header tekshirishda xato")

# ═══ AUTH ENDPOINTS (agar token berilgan bo'lsa) ═══
if TOKEN:
    print("\n🔐 AUTHENTICATED ENDPOINTS:")
    test("Tovarlar", "/api/v1/tovarlar", auth=True)
    test("Klientlar", "/api/v1/klientlar", auth=True)
    test("Qarzlar", "/api/v1/qarzlar", auth=True)
    test("KPI", "/api/v1/kpi", auth=True)
    test("AI Advisor", "/api/v1/advisor", auth=True)
    test("Tarif", "/api/v1/tarif", auth=True)
    test("Segment", "/api/v1/segment", auth=True)
    test("Forecast", "/api/v1/forecast/demand", auth=True)
    test("CLV", "/api/v1/klient/clv", auth=True)
    test("Oylik", "/api/v1/hisobot/oylik", auth=True)
    test("Prognoz", "/api/v1/ombor/prognoz", auth=True)
    test("Notification", "/api/v1/notification/preview/ertalab", auth=True)
else:
    print("\n⚠️  Token berilmagan — auth endpointlar o'tkazildi")
    print("   Ishlatish: python3 smoke_test.py URL TOKEN")

# ═══ NATIJA ═══
print("\n" + "=" * 50)
jami = OK + FAIL
if FAIL == 0:
    print(f"🏆 BARCHA TESTLAR O'TDI: {OK}/{jami}")
    print("✅ Server PRODUCTION READY!")
else:
    print(f"⚠️  {OK}/{jami} o'tdi, {FAIL} ta xato")
    print("❌ Xatolarni tuzating!")

sys.exit(0 if FAIL == 0 else 1)
