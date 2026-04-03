def test_printer_router_imports():
    from services.api.routes import printer

    assert printer.router.prefix == "/api/print"
