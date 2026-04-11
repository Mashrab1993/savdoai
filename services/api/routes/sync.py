"""
Delta sync endpoint — foydalanuvchi offline'dan qaytganda faqat
o'zgargan ma'lumotlarni oladi, butun ro'yxatni emas.

GET /api/v1/sync/delta?since=2026-04-11T12:00:00Z
  → {
      "now":      "2026-04-11T13:05:12Z",
      "tovarlar": [...yangilangan/yaratilgan tovarlar],
      "klientlar":[...],
      "sotuvlar": [...],
      "kirimlar": [...]
    }
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query

from shared.database.pool import rls_conn
from services.api.deps import get_uid

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/sync", tags=["Sync"])


def _parse_since(raw: Optional[str]) -> datetime:
    """Parse ISO8601; default to 24h ago if missing/invalid."""
    if raw:
        try:
            if raw.endswith("Z"):
                raw = raw[:-1] + "+00:00"
            return datetime.fromisoformat(raw)
        except ValueError:
            pass
    return datetime.now(timezone.utc) - timedelta(hours=24)


def _row_to_dict(row) -> dict:
    out = {}
    for k, v in dict(row).items():
        if isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, Decimal):
            out[k] = float(v)
        else:
            out[k] = v
    return out


@router.get("/delta")
async def sync_delta(
    since: Optional[str] = Query(None, description="ISO8601 timestamp"),
    limit: int = Query(1000, ge=1, le=5000),
    uid: int = Depends(get_uid),
):
    """
    Delta sync — faqat `since` dan keyin o'zgargan ma'lumotlar.

    Client ishlatishi:
      1. Oxirgi muvaffaqiyatli sync vaqtini localStorage'da saqlaydi.
      2. Keyingi sync'da `?since=<oxirgi>` yuboradi.
      3. Backend `now` qaytaradi — client uni yangi oxirgi vaqt sifatida
         saqlaydi.
    """
    since_dt = _parse_since(since)
    now = datetime.now(timezone.utc)

    async with rls_conn(uid) as c:
        tovarlar = await c.fetch(
            """
            SELECT id, nomi, kategoriya, birlik, olish_narxi, sotish_narxi,
                   qoldiq, brend, shtrix_kod, ikpu_kod, rasm_url, faol,
                   COALESCE(yangilangan, yaratilgan) AS yangilangan
            FROM tovarlar
            WHERE user_id = $1
              AND COALESCE(yangilangan, yaratilgan) > $2
            ORDER BY COALESCE(yangilangan, yaratilgan) DESC
            LIMIT $3
            """,
            uid, since_dt, limit,
        )

        klientlar = await c.fetch(
            """
            SELECT id, ism, telefon, manzil, kredit_limit, jami_sotib,
                   COALESCE(kategoriya, 'oddiy') AS kategoriya,
                   COALESCE(jami_xaridlar, 0) AS jami_xaridlar,
                   COALESCE(xarid_soni, 0) AS xarid_soni,
                   oxirgi_sotuv, yaratilgan
            FROM klientlar
            WHERE user_id = $1
              AND GREATEST(yaratilgan, COALESCE(oxirgi_sotuv, yaratilgan)) > $2
            ORDER BY yaratilgan DESC
            LIMIT $3
            """,
            uid, since_dt, limit,
        )

        sotuvlar = await c.fetch(
            """
            SELECT id, klient_id, klient_ismi, jami, tolangan, qarz,
                   holat, sana, holat_yangilangan
            FROM sotuv_sessiyalar
            WHERE user_id = $1
              AND GREATEST(sana, COALESCE(holat_yangilangan, sana)) > $2
            ORDER BY sana DESC
            LIMIT $3
            """,
            uid, since_dt, limit,
        )

        kirimlar = await c.fetch(
            """
            SELECT id, tovar_id, tovar_nomi, miqdor, narx, jami, manba, sana
            FROM kirimlar
            WHERE user_id = $1 AND sana > $2
            ORDER BY sana DESC
            LIMIT $3
            """,
            uid, since_dt, limit,
        )

    return {
        "since":     since_dt.isoformat(),
        "now":       now.isoformat(),
        "tovarlar":  [_row_to_dict(r) for r in tovarlar],
        "klientlar": [_row_to_dict(r) for r in klientlar],
        "sotuvlar":  [_row_to_dict(r) for r in sotuvlar],
        "kirimlar":  [_row_to_dict(r) for r in kirimlar],
        "counts": {
            "tovarlar":  len(tovarlar),
            "klientlar": len(klientlar),
            "sotuvlar":  len(sotuvlar),
            "kirimlar":  len(kirimlar),
        },
    }
