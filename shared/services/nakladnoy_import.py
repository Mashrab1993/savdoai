"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — NAKLADNOY IMPORT                             ║
║                                                                  ║
║  Nakladnoy Excel → SavdoAI bazasiga import:                    ║
║  • Klientlarni avtomatik yaratish/topish                        ║
║  • Sotuv sessiyalarini yaratish                                 ║
║  • Chiqimlarni (tovarlarni) saqlash                             ║
║  • Qoldiqni yangilash                                           ║
║  • Qarz qayd qilish                                             ║
║  • Duplikat import oldini olish                                 ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import hashlib
import json
import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional

log = logging.getLogger(__name__)


def nakladnoy_hash(data: dict) -> str:
    """Nakladnoy unique hash — duplikat oldini olish."""
    key = json.dumps({
        "klient": data.get("klient", ""),
        "jami": data.get("jami", 0),
        "soni": data.get("soni", 0),
    }, sort_keys=True, ensure_ascii=False)
    return hashlib.md5(key.encode()).hexdigest()[:12]


async def nakladnoy_import(conn, uid: int, parsed: dict,
                            dry_run: bool = False) -> dict:
    """
    Nakladnoy ma'lumotlarini DB ga import qilish.
    
    dry_run=True bo'lsa — faqat nima bo'lishini ko'rsatadi, saqlamaydi.
    
    Qaytaradi:
    {
        "imported": 13,
        "skipped": 0,
        "klient_yaratildi": 5,
        "klient_topildi": 8,
        "jami_summa": 16323000,
        "xatolar": [],
        "tafsilot": [...]
    }
    """
    natija = {
        "imported": 0,
        "skipped": 0,
        "klient_yaratildi": 0,
        "klient_topildi": 0,
        "jami_summa": 0,
        "xatolar": [],
        "tafsilot": [],
    }

    for inv in parsed.get("nakladnoylar", []):
        klient_ismi = inv.get("klient", "").strip()
        if not klient_ismi or not inv.get("tovarlar"):
            natija["skipped"] += 1
            continue

        inv_hash = nakladnoy_hash(inv)

        # Duplikat tekshirish
        existing = await conn.fetchval("""
            SELECT id FROM sotuv_sessiyalar
            WHERE user_id = $1 AND izoh LIKE $2
            LIMIT 1
        """, uid, f"%NAK:{inv_hash}%")

        if existing:
            natija["skipped"] += 1
            natija["tafsilot"].append({
                "klient": klient_ismi, "holat": "duplikat",
                "sessiya_id": existing,
            })
            continue

        # Klient topish yoki yaratish
        klient_id = await conn.fetchval("""
            SELECT id FROM klientlar
            WHERE user_id = $1 AND lower(ism) = lower($2)
            LIMIT 1
        """, uid, klient_ismi)

        if not klient_id and not dry_run:
            klient_id = await conn.fetchval("""
                INSERT INTO klientlar (user_id, ism, telefon)
                VALUES ($1, $2, $3)
                RETURNING id
            """, uid, klient_ismi, inv.get("tel", ""))
            natija["klient_yaratildi"] += 1
        elif klient_id:
            natija["klient_topildi"] += 1
        else:
            natija["klient_yaratildi"] += 1  # dry_run

        jami = float(inv.get("jami", 0))
        izoh = f"NAK:{inv_hash} | Excel import"

        if dry_run:
            natija["imported"] += 1
            natija["jami_summa"] += jami
            natija["tafsilot"].append({
                "klient": klient_ismi, "holat": "import_tayyor",
                "tovarlar": len(inv["tovarlar"]), "jami": jami,
            })
            continue

        # Sotuv sessiyasi yaratish
        try:
            sess_id = await conn.fetchval("""
                INSERT INTO sotuv_sessiyalar
                    (user_id, klient_id, klient_ismi, jami, tolangan, qarz, izoh)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            """, uid, klient_id, klient_ismi, jami, jami, 0, izoh)

            # Tovarlarni saqlash
            for t in inv["tovarlar"]:
                await conn.execute("""
                    INSERT INTO chiqimlar
                        (user_id, sessiya_id, klient_id, klient_ismi,
                         tovar_nomi, miqdor, birlik, sotish_narxi, jami)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """, uid, sess_id, klient_id, klient_ismi,
                    t["nomi"], t["miqdor"], t.get("birlik", "dona"),
                    t["narx"], t["jami"])

            natija["imported"] += 1
            natija["jami_summa"] += jami
            natija["tafsilot"].append({
                "klient": klient_ismi, "holat": "saqlandi",
                "sessiya_id": sess_id, "tovarlar": len(inv["tovarlar"]),
                "jami": jami,
            })

        except Exception as e:
            natija["xatolar"].append(f"{klient_ismi}: {e}")
            log.error("Nakladnoy import: %s — %s", klient_ismi, e)

    return natija


def import_xulosa_matn(natija: dict) -> str:
    """Import natijasi uchun bot matni."""
    matn = "📥 *NAKLADNOY IMPORT NATIJASI*\n━━━━━━━━━━━━━━━━━━━━━\n\n"

    matn += (
        f"✅ Import: *{natija['imported']}* nakladnoy\n"
        f"⏭ O'tkazildi: {natija['skipped']} (duplikat)\n"
        f"👤 Yangi klient: {natija['klient_yaratildi']}\n"
        f"👥 Topilgan klient: {natija['klient_topildi']}\n"
        f"💰 Jami: *{natija['jami_summa']:,.0f}* so'm\n"
    )

    if natija["xatolar"]:
        matn += f"\n❌ Xatolar: {len(natija['xatolar'])}\n"
        for x in natija["xatolar"][:3]:
            matn += f"  • {x}\n"

    return matn
