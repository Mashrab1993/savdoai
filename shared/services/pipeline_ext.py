"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — PIPELINE KENGAYTMALARI                       ║
║                                                                  ║
║  Mavjud pipeline.py ga integratsiya qilinadigan funksiyalar:     ║
║  • Aksiya qo'llash (CONFIRMED bosqichida)                       ║
║  • Config validatsiya (DRAFT bosqichida)                        ║
║  • Qoldiq qaytarish (VOIDED bosqichida)                         ║
║  • Sync log yozish                                               ║
║                                                                  ║
║  INTEGRATSIYA:                                                   ║
║  pipeline.py da CONFIRMED holatda:                               ║
║    from shared.services.pipeline_ext import aksiya_qolla         ║
║    draft.aksiya_natija = await aksiya_qolla(conn, uid, draft)    ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from decimal import Decimal
from typing import Optional, List

log = logging.getLogger(__name__)


async def aksiya_qolla(conn, uid: int, draft: dict) -> dict:
    """Buyurtma tasdiqlanganda aksiyalarni hisoblash va qo'llash.

    pipeline.py da CONFIRMED bosqichida chaqiriladi.
    Qaytgan natijani draft ga qo'shib, UI da ko'rsatish mumkin.

    Args:
        conn: DB connection
        uid: foydalanuvchi ID
        draft: {klient_id, tovarlar: [{tovar_id, miqdor, narx, summa}], jami_summa}

    Returns:
        {aksiyalar: [...], jami_chegirma, yangi_summa, bonus_ball}
    """
    from shared.services.aksiya import aksiyalar_hisoblash

    klient_id = draft.get("klient_id", 0)
    tovarlar = draft.get("tovarlar", [])
    jami = Decimal(str(draft.get("jami_summa", 0)))

    if not tovarlar or jami <= 0:
        return {"aksiyalar": [], "jami_chegirma": "0", "yangi_summa": str(jami), "bonus_ball": "0"}

    natijalar = await aksiyalar_hisoblash(conn, uid, klient_id, tovarlar, jami)

    jami_chegirma = sum(Decimal(n.get("chegirma_summa", "0")) for n in natijalar)
    jami_bonus = sum(Decimal(n.get("bonus_ball", "0")) for n in natijalar)
    yangi_summa = jami - jami_chegirma

    return {
        "aksiyalar": natijalar,
        "jami_chegirma": str(jami_chegirma),
        "yangi_summa": str(yangi_summa),
        "bonus_ball": str(jami_bonus),
    }


async def config_tekshir(conn, uid: int, draft: dict) -> dict:
    """DRAFT bosqichida server config asosida validatsiya.

    pipeline.py da DRAFT yaratilganda chaqiriladi.

    Args:
        conn: DB connection
        uid: foydalanuvchi ID
        draft: buyurtma draft ma'lumotlari

    Returns:
        {ruxsat: True/False, xatolar: [...], ogohlantirishlar: [...]}
    """
    from shared.services.server_config import buyurtma_tekshir

    natija = await buyurtma_tekshir(conn, uid, draft)
    return {
        "ruxsat": natija["valid"],
        "xatolar": natija["xatolar"],
        "ogohlantirishlar": natija.get("ogohlantirishlar", []),
    }


async def bekor_qil(conn, uid: int, sotuv_id: int) -> dict:
    """VOIDED bosqichida ombor qoldiqni qaytarish.

    pipeline.py da VOIDED holatda chaqiriladi.

    Args:
        conn: DB connection
        uid: foydalanuvchi ID
        sotuv_id: sotuv ID

    Returns:
        {qaytarilgan: soni, tovarlar: [...]}
    """
    from shared.services.guards_v2 import qoldiq_qaytarish
    return await qoldiq_qaytarish(conn, uid, sotuv_id)


async def sync_natija_yoz(conn, uid: int, amal: str, natija: dict) -> None:
    """Har bir pipeline bosqichida sync log yozish.

    Args:
        conn: DB connection
        uid: foydalanuvchi ID
        amal: pipeline bosqichi nomi
        natija: bosqich natijasi
    """
    from shared.services.server_config import sync_log_yoz
    import json
    from datetime import datetime

    await sync_log_yoz(
        conn, uid,
        sync_turi="pipeline",
        boshlangan=datetime.utcnow(),
        tugagan=datetime.utcnow(),
        entity_soni=1,
        muvaffaqiyatli=natija.get("ruxsat", True),
        xato_xabar=json.dumps(natija.get("xatolar", []), ensure_ascii=False)[:500] if natija.get("xatolar") else None,
    )
