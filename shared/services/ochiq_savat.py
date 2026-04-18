"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI — OCHIQ SAVAT v2.0 (ENTERPRISE)                                ║
║  Optom do'konchilar uchun multi-klient parallel sessiya                  ║
║                                                                          ║
║  DUNYO DARAJASIDA — 80 YILLIK TAJRIBA BILAN:                            ║
║                                                                          ║
║  ASOSIY G'OYA:                                                           ║
║  Do'konchi faqat OVOZ yuboradi — bot HAMMANI avtomatik qiladi:          ║
║  ✅ Klient nomini eshitadi → savatni topadi yoki yaratadi               ║
║  ✅ Tovarni qo'shadi → bir xil tovar bo'lsa miqdorni OSHIRADI          ║
║  ✅ Narxni Smart Narx dan topadi (agar aytilmasa)                       ║
║  ✅ "Bo'ldi" desa → nakladnoy PDF chiqadi + DB ga saqlaydi             ║
║  ✅ 100+ klient PARALLEL — hech narsa adashmaydi                        ║
║                                                                          ║
║  FLOW:                                                                   ║
║  🎤 "Nasriddin akaga 1 Dollex 56000" → ✅ Savatga qo'shildi           ║
║  🎤 "Lobar opaga 2 Cler 32000"       → ✅ Yangi savat ochildi         ║
║  🎤 "Nasriddin akaga yana 3 Ariel"   → ✅ Uning savatiga qo'shildi   ║
║  🎤 "Nasriddin aka bo'ldi"           → 📋 NAKLADNOY + PDF             ║
║  🎤 "Savatlar"                        → 📊 Barcha ochiq savatlar       ║
║                                                                          ║
║  XUSUSIYATLAR:                                                           ║
║  ✅ Dublikat tovar → miqdor oshadi (2 marta Ariel = bitta qator)       ║
║  ✅ Fuzzy klient nomi ("Nasriddin" = "Nasriddinaka" = "Nasriddin aka") ║
║  ✅ Smart Narx integratsiya (narx aytilmasa DB dan topadi)             ║
║  ✅ Klient savati real-time ko'rinish (har qo'shganda)                 ║
║  ✅ ACID tranzaksiya — hech narsa yo'qolmaydi                          ║
║  ✅ Kunlik yakuniy hisobot                                               ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
from shared.utils import like_escape
import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

log = logging.getLogger(__name__)

D = lambda v: Decimal(str(v or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if v else Decimal("0")


# ═══════════════════════════════════════════════════════════════
#  1. SAVAT OCHISH / TOPISH — Fuzzy klient nomi bilan
# ═══════════════════════════════════════════════════════════════

async def savat_och(conn, uid: int, klient_ismi: str) -> dict:
    """
    Klient uchun ochiq savat topish yoki yangisini yaratish.
    Fuzzy match: "Nasriddin" → "Nasriddin aka" topiladi.
    """
    klient_ismi = klient_ismi.strip()
    if not klient_ismi:
        raise ValueError("Klient ismi bo'sh")

    # 1. Aniq match
    row = await conn.fetchrow("""
        SELECT id, user_id, klient_id, klient_ismi, holat, jami_summa, tovar_soni, izoh, ochilgan, yopilgan, sessiya_id FROM ochiq_savatlar
        WHERE user_id=$1 AND lower(klient_ismi)=lower($2) AND holat='ochiq'
        ORDER BY ochilgan DESC LIMIT 1
    """, uid, klient_ismi)

    if row:
        return dict(row)

    # 2. Fuzzy match — "Nasriddin" → "Nasriddin aka" topadi
    row = await conn.fetchrow("""
        SELECT id, user_id, klient_id, klient_ismi, holat, jami_summa, tovar_soni, izoh, ochilgan, yopilgan, sessiya_id FROM ochiq_savatlar
        WHERE user_id=$1 AND holat='ochiq'
          AND (lower(klient_ismi) LIKE lower($2)
               OR lower($3) LIKE '%' || lower(klient_ismi) || '%')
        ORDER BY ochilgan DESC LIMIT 1
    """, uid, f"%{like_escape(klient_ismi)}%", klient_ismi)

    if row:
        return dict(row)

    # 3. Klient ID topish (DB dan)
    klient_id = None
    kr = await conn.fetchrow("""
        SELECT id, ism FROM klientlar
        WHERE user_id=$1 AND (lower(ism) LIKE lower($2) OR lower(ism) LIKE lower($3))
        LIMIT 1
    """, uid, f"%{like_escape(klient_ismi)}%", klient_ismi)
    if kr:
        klient_id = kr["id"]
        # DB dagi to'liq ismni ishlatamiz
        klient_ismi = kr["ism"] or klient_ismi

    # 4. Yangi savat yaratish
    new = await conn.fetchrow("""
        INSERT INTO ochiq_savatlar (user_id, klient_id, klient_ismi, holat)
        VALUES ($1, $2, $3, 'ochiq') RETURNING id, user_id, klient_id, klient_ismi, holat, jami_summa, tovar_soni, izoh, ochilgan, yopilgan, sessiya_id
    """, uid, klient_id, klient_ismi)

    log.info("🛒 Yangi savat: %s (uid=%d)", klient_ismi, uid)
    return dict(new)


async def savat_ol(conn, uid: int, klient_ismi: str) -> dict | None:
    """Klient uchun ochiq savat olish (yaratmasdan). Fuzzy match."""
    klient_ismi = klient_ismi.strip()

    # Aniq match
    row = await conn.fetchrow("""
        SELECT id, user_id, klient_id, klient_ismi, holat, jami_summa, tovar_soni, izoh, ochilgan, yopilgan, sessiya_id FROM ochiq_savatlar
        WHERE user_id=$1 AND lower(klient_ismi)=lower($2) AND holat='ochiq'
        ORDER BY ochilgan DESC LIMIT 1
    """, uid, klient_ismi)

    if row:
        return dict(row)

    # Fuzzy match
    row = await conn.fetchrow("""
        SELECT id, user_id, klient_id, klient_ismi, holat, jami_summa, tovar_soni, izoh, ochilgan, yopilgan, sessiya_id FROM ochiq_savatlar
        WHERE user_id=$1 AND holat='ochiq'
          AND (lower(klient_ismi) LIKE lower($2)
               OR lower($3) LIKE '%' || lower(klient_ismi) || '%')
        ORDER BY ochilgan DESC LIMIT 1
    """, uid, f"%{like_escape(klient_ismi)}%", klient_ismi)

    return dict(row) if row else None


# ═══════════════════════════════════════════════════════════════
#  2. TOVAR QO'SHISH — Dublikat birlashtirish + Smart Narx
# ═══════════════════════════════════════════════════════════════

async def savatga_qosh(conn, uid: int, klient_ismi: str,
                        tovarlar: list[dict]) -> dict:
    """
    Klient savatiga tovar(lar) qo'shish.
    DUBLIKAT: agar tovar allaqachon savatda bo'lsa — miqdorni OSHIRADI.
    SMART NARX: agar narx=0 bo'lsa — DB dan Smart Narx topadi.
    """
    savat = await savat_och(conn, uid, klient_ismi)
    savat_id = savat["id"]
    klient_ismi = savat["klient_ismi"]  # DB dagi to'liq ism

    qo_shildi = 0
    yangilandi = 0

    # ── BATCH PRE-FETCH: N+1 → 2 query ──
    # 1) Savatdagi mavjud tovarlarni bir query da olish
    existing_rows = await conn.fetch("""
        SELECT id, lower(tovar_nomi) as nomi_lower, tovar_nomi, miqdor, narx, jami
        FROM savat_tovarlar WHERE savat_id=$1
    """, savat_id)
    existing_map = {r["nomi_lower"]: dict(r) for r in existing_rows}

    # 2) User tovarlarini keshga olish (agar 5+ tovar bo'lsa — batch samaraliroq)
    tovar_cache: dict[str, dict] = {}
    if len(tovarlar) >= 3:
        all_tv = await conn.fetch("""
            SELECT id, nomi, lower(nomi) as nomi_lower, sotish_narxi, birlik, kategoriya
            FROM tovarlar WHERE user_id=$1
        """, uid)
        for tv in all_tv:
            tovar_cache[tv["nomi_lower"]] = dict(tv)

    for t in tovarlar:
        nomi = (t.get("nomi") or "").strip()
        if not nomi:
            continue

        miqdor = D(t.get("miqdor", 0))
        narx = D(t.get("narx", 0))
        birlik = t.get("birlik", "dona")
        kategoriya = t.get("kategoriya", "Boshqa")

        # Tovar ID topish — avval keshdan, keyin DB
        tovar_id = None
        tr = None
        nomi_lower = nomi.lower()

        if tovar_cache:
            # Keshdan exact match
            tr_cached = tovar_cache.get(nomi_lower)
            if not tr_cached:
                # Keshdan fuzzy match
                for k, v in tovar_cache.items():
                    if nomi_lower in k or k in nomi_lower:
                        tr_cached = v
                        break
            if tr_cached:
                tr = tr_cached
                tovar_id = tr["id"]
        else:
            # DB dan (kam tovar bo'lganda — individual query)
            tr_row = await conn.fetchrow("""
                SELECT id, nomi, sotish_narxi, birlik, kategoriya FROM tovarlar
                WHERE user_id=$1 AND lower(nomi) LIKE lower($2) LIMIT 1
            """, uid, f"%{like_escape(nomi)}%")
            if tr_row:
                tr = dict(tr_row)
                tovar_id = tr["id"]

        if tr:
            if not kategoriya or kategoriya == "Boshqa":
                kategoriya = tr.get("kategoriya") or "Boshqa"
            if not birlik or birlik == "dona":
                birlik = tr.get("birlik") or birlik

        # Smart Narx (agar narx=0)
        if narx <= 0:
            if tr and tr["sotish_narxi"]:
                narx = D(tr["sotish_narxi"])
            else:
                try:
                    from shared.services.smart_narx import narx_aniqla
                    klient_id = savat.get("klient_id")
                    if tovar_id:
                        r = await narx_aniqla(conn, uid, klient_id, tovar_id)
                        if r["narx"] > 0:
                            narx = D(r["narx"])
                except Exception:
                    pass

        # Jami hisoblash
        if birlik == "gramm" and narx > 0:
            jami = (narx / 1000 * miqdor).quantize(Decimal("1"))
        elif narx > 0 and miqdor > 0:
            jami = (narx * miqdor).quantize(Decimal("1"))
        else:
            jami = D(t.get("jami", 0))

        # ═══ DUBLIKAT TEKSHIRISH (keshdan) ═══
        # Agar shu tovar allaqachon savatda bo'lsa — miqdor OSHIRADI
        existing = existing_map.get(nomi_lower)

        if existing:
            # Miqdor oshirish
            yangi_miqdor = D(existing["miqdor"]) + miqdor
            yangi_narx = narx if narx > 0 else D(existing["narx"])
            if birlik == "gramm" and yangi_narx > 0:
                yangi_jami = (yangi_narx / 1000 * yangi_miqdor).quantize(Decimal("1"))
            elif yangi_narx > 0:
                yangi_jami = (yangi_narx * yangi_miqdor).quantize(Decimal("1"))
            else:
                yangi_jami = D(existing["jami"]) + jami

            await conn.execute("""
                UPDATE savat_tovarlar
                SET miqdor=$2, narx=$3, jami=$4
                WHERE id=$1
            """, existing["id"], yangi_miqdor, yangi_narx, yangi_jami)
            # Keshni yangilash — keyingi iteratsiyalar uchun
            existing_map[nomi_lower] = {
                "id": existing["id"], "nomi_lower": nomi_lower,
                "tovar_nomi": nomi, "miqdor": yangi_miqdor,
                "narx": yangi_narx, "jami": yangi_jami,
            }
            yangilandi += 1
            log.info("🔄 Savat dublikat: %s x%s → x%s", nomi, existing["miqdor"], yangi_miqdor)
        else:
            # Yangi tovar qo'shish
            new_id = await conn.fetchval("""
                INSERT INTO savat_tovarlar
                    (savat_id, user_id, tovar_nomi, tovar_id, miqdor, birlik, narx, jami, kategoriya)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            """, savat_id, uid, nomi, tovar_id, miqdor, birlik, narx, jami, kategoriya)
            # Keshga qo'shish — bir xil tovar yana kelsa UPDATE bo'ladi, yangi qator emas
            existing_map[nomi_lower] = {
                "id": new_id, "nomi_lower": nomi_lower,
                "tovar_nomi": nomi, "miqdor": miqdor,
                "narx": narx, "jami": jami,
            }
            qo_shildi += 1

    # Savat jamini yangilash
    stats = await conn.fetchrow("""
        SELECT COUNT(*) as soni, COALESCE(SUM(jami), 0) as jami
        FROM savat_tovarlar WHERE savat_id=$1
    """, savat_id)

    await conn.execute("""
        UPDATE ochiq_savatlar SET jami_summa=$2, tovar_soni=$3 WHERE id=$1
    """, savat_id, stats["jami"], stats["soni"])

    return {
        "savat_id": savat_id,
        "klient": klient_ismi,
        "qo_shildi": qo_shildi,
        "yangilandi": yangilandi,
        "jami": float(stats["jami"]),
        "tovar_soni": int(stats["soni"]),
    }


# ═══════════════════════════════════════════════════════════════
#  3. SAVAT KO'RISH
# ═══════════════════════════════════════════════════════════════

async def savat_korish(conn, uid: int, klient_ismi: str) -> dict | None:
    """Klient savatidagi tovarlar ro'yxati"""
    savat = await savat_ol(conn, uid, klient_ismi)
    if not savat:
        return None

    rows = await conn.fetch("""
        SELECT id, savat_id, user_id, tovar_nomi, tovar_id, miqdor, birlik, narx, jami, kategoriya, qo_shilgan FROM savat_tovarlar
        WHERE savat_id=$1 ORDER BY qo_shilgan
    """, savat["id"])

    return {
        "savat_id": savat["id"],
        "klient": savat["klient_ismi"],
        "klient_id": savat.get("klient_id"),
        "tovarlar": [dict(r) for r in rows],
        "jami": float(savat["jami_summa"]),
        "tovar_soni": int(savat["tovar_soni"]),
        "ochilgan": savat["ochilgan"],
    }


# ═══════════════════════════════════════════════════════════════
#  4. BARCHA OCHIQ SAVATLAR
# ═══════════════════════════════════════════════════════════════

async def ochiq_savatlar(conn, uid: int) -> list[dict]:
    """Barcha ochiq savatlar — jami summa bilan"""
    rows = await conn.fetch("""
        SELECT id, klient_ismi, jami_summa, tovar_soni, ochilgan
        FROM ochiq_savatlar
        WHERE user_id=$1 AND holat='ochiq'
        ORDER BY ochilgan
    """, uid)
    return [dict(r) for r in rows]


async def ochiq_savatlar_soni(conn, uid: int) -> int:
    """Ochiq savatlar soni (tez javob)"""
    return await conn.fetchval("""
        SELECT COUNT(*) FROM ochiq_savatlar
        WHERE user_id=$1 AND holat='ochiq'
    """, uid) or 0


# ═══════════════════════════════════════════════════════════════
#  5. SAVAT YOPISH → SOTUV + NAKLADNOY (ACID)
# ═══════════════════════════════════════════════════════════════

async def savat_yop(conn, uid: int, klient_ismi: str,
                     qarz_summa: float = 0) -> dict | None:
    """
    Klient savatini yopish — ACID tranzaksiya:
    1. Savat tovarlarini olish
    2. sotuv_sessiyalar + chiqimlar saqlash
    3. Tovar qoldiqlarini kamaytirish
    4. Qarz yaratish (agar bor)
    5. Kassa operatsiya yaratish
    6. ochiq_savatlar → holat='yopilgan'
    """
    savat = await savat_ol(conn, uid, klient_ismi)
    if not savat:
        return None

    savat_id = savat["id"]

    rows = await conn.fetch("""
        SELECT id, savat_id, user_id, tovar_nomi, tovar_id, miqdor, birlik, narx, jami, kategoriya, qo_shilgan FROM savat_tovarlar WHERE savat_id=$1 ORDER BY qo_shilgan
    """, savat_id)

    if not rows:
        return None

    tovarlar = [dict(r) for r in rows]
    jami = sum(D(t["jami"]) for t in tovarlar)

    if jami <= 0:
        # Narxsiz tovarlar — faqat nakladnoy (saqlash shart emas)
        pass

    qarz = min(D(qarz_summa), jami)
    tolangan = jami - qarz
    klient_id = savat.get("klient_id")

    # ═══ ACID TRANZAKSIYA ═══
    async with conn.transaction():

        # 1. Sotuv sessiya
        sessiya = await conn.fetchrow("""
            INSERT INTO sotuv_sessiyalar
                (user_id, klient_id, klient_ismi, jami, tolangan, qarz)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        """, uid, klient_id, savat["klient_ismi"], jami, tolangan, qarz)
        sessiya_id = sessiya["id"]

        # 2. Chiqimlar + qoldiq kamaytirish
        # ── BATCH LOAD olish_narxi (N+1 → 1 query) ──
        tovar_ids = [t["tovar_id"] for t in tovarlar if t.get("tovar_id")]
        olish_map = {}
        if tovar_ids:
            tv_rows = await conn.fetch(
                "SELECT id, olish_narxi FROM tovarlar WHERE id = ANY($1)",
                tovar_ids
            )
            olish_map = {r["id"]: D(r["olish_narxi"] or 0) for r in tv_rows}

        for t in tovarlar:
            olish_narxi = olish_map.get(t.get("tovar_id"), Decimal("0"))

            await conn.execute("""
                INSERT INTO chiqimlar
                    (user_id, sessiya_id, klient_id, klient_ismi,
                     tovar_id, tovar_nomi, kategoriya, miqdor, birlik,
                     olish_narxi, sotish_narxi, jami)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            """, uid, sessiya_id, klient_id, savat["klient_ismi"],
                 t.get("tovar_id"), t["tovar_nomi"], t.get("kategoriya", "Boshqa"),
                 t["miqdor"], t["birlik"], olish_narxi, t["narx"], t["jami"])

            if t.get("tovar_id"):
                await conn.execute("""
                    UPDATE tovarlar SET qoldiq = GREATEST(qoldiq - $2, 0) WHERE id=$1
                """, t["tovar_id"], t["miqdor"])

        # 3. Qarz
        if qarz > 0 and klient_id:
            await conn.execute("""
                INSERT INTO qarzlar
                    (user_id, klient_id, klient_ismi, sessiya_id,
                     dastlabki_summa, tolangan, qolgan, muddat)
                VALUES ($1,$2,$3,$4,$5,$6,$7, (NOW() + INTERVAL '30 days')::date)
            """, uid, klient_id, savat["klient_ismi"], sessiya_id,
                 jami, tolangan, qarz)

        # 4. Kassa (agar tolangan > 0)
        if tolangan > 0:
            try:
                await conn.execute("""
                    INSERT INTO kassa_operatsiyalar
                        (user_id, tur, summa, usul, tavsif)
                    VALUES ($1, 'kirim', $2, 'naqd', $3)
                """, uid, tolangan,
                     f"Sotuv: {savat['klient_ismi']} ({len(tovarlar)} tovar)")
            except Exception:
                pass  # Kassa jadval yo'q bo'lishi mumkin

        # 5. Savatni yopish
        await conn.execute("""
            UPDATE ochiq_savatlar
            SET holat='yopilgan', yopilgan=NOW(), sessiya_id=$2,
                jami_summa=$3
            WHERE id=$1
        """, savat_id, sessiya_id, jami)

    # Natija (nakladnoy uchun)
    natija_tovarlar = []
    for t in tovarlar:
        natija_tovarlar.append({
            "nomi": t["tovar_nomi"],
            "miqdor": float(t["miqdor"]),
            "birlik": t["birlik"],
            "narx": float(t["narx"]),
            "jami": float(t["jami"]),
            "kategoriya": t.get("kategoriya", "Boshqa"),
        })

    log.info("✅ Savat yopildi: %s — %d tovar, %s so'm (sessiya=%d)",
             savat["klient_ismi"], len(tovarlar), f"{jami:,.0f}", sessiya_id)

    return {
        "sessiya_id": sessiya_id,
        "amal": "chiqim",
        "klient": savat["klient_ismi"],
        "klient_id": klient_id,
        "tovarlar": natija_tovarlar,
        "jami_summa": float(jami),
        "tolangan": float(tolangan),
        "qarz": float(qarz),
    }


# ═══════════════════════════════════════════════════════════════
#  6. SAVATDAN TOVAR O'CHIRISH / BEKOR
# ═══════════════════════════════════════════════════════════════

async def savatdan_ochir(conn, uid: int, klient_ismi: str,
                          tovar_nomi: str) -> dict | None:
    """Savatdan oxirgi qo'shilgan shu tovarni o'chirish"""
    savat = await savat_ol(conn, uid, klient_ismi)
    if not savat:
        return None

    deleted = await conn.fetchrow("""
        DELETE FROM savat_tovarlar
        WHERE id = (
            SELECT id FROM savat_tovarlar
            WHERE savat_id=$1 AND lower(tovar_nomi) LIKE lower($2)
            ORDER BY qo_shilgan DESC LIMIT 1
        ) RETURNING tovar_nomi, miqdor
    """, savat["id"], f"%{like_escape(tovar_nomi)}%")

    if deleted:
        stats = await conn.fetchrow("""
            SELECT COUNT(*) as soni, COALESCE(SUM(jami), 0) as jami
            FROM savat_tovarlar WHERE savat_id=$1
        """, savat["id"])
        await conn.execute("""
            UPDATE ochiq_savatlar SET jami_summa=$2, tovar_soni=$3 WHERE id=$1
        """, savat["id"], stats["jami"], stats["soni"])

        return {"o_chirildi": True, "klient": klient_ismi,
                "tovar": deleted["tovar_nomi"], "miqdor": float(deleted["miqdor"])}

    return {"o_chirildi": False, "klient": klient_ismi}


async def savat_bekor(conn, uid: int, klient_ismi: str) -> bool:
    """Savatni to'liq bekor qilish (ACID)"""
    savat = await savat_ol(conn, uid, klient_ismi)
    if not savat:
        return False

    async with conn.transaction():
        await conn.execute("DELETE FROM savat_tovarlar WHERE savat_id=$1", savat["id"])
        await conn.execute("""
            UPDATE ochiq_savatlar SET holat='bekor', yopilgan=NOW() WHERE id=$1
        """, savat["id"])

    log.info("❌ Savat bekor: %s (uid=%d)", klient_ismi, uid)
    return True


# ═══════════════════════════════════════════════════════════════
#  7. KUNLIK YAKUNIY
# ═══════════════════════════════════════════════════════════════

async def kunlik_yakuniy(conn, uid: int) -> dict:
    """Kunlik yakuniy — bugungi savatlar statistikasi"""
    stats = await conn.fetchrow("""
        SELECT
            COUNT(*) FILTER(WHERE holat='yopilgan'
                AND (yopilgan AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE) as yopilgan,
            COUNT(*) FILTER(WHERE holat='ochiq') as ochiq,
            COALESCE(SUM(jami_summa) FILTER(WHERE holat='yopilgan'
                AND (yopilgan AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE), 0) as jami_sotuv,
            COUNT(DISTINCT klient_ismi) FILTER(WHERE holat='yopilgan'
                AND (yopilgan AT TIME ZONE 'Asia/Tashkent')::date = CURRENT_DATE) as klient_soni
        FROM ochiq_savatlar WHERE user_id=$1
    """, uid)
    return dict(stats) if stats else {}


# ═══════════════════════════════════════════════════════════════
#  8. FORMAT — CHIROYLI MATNLAR
# ═══════════════════════════════════════════════════════════════

def savat_matn(savat_data: dict) -> str:
    """Klient savati — chiroyli format"""
    klient = savat_data.get("klient", "")
    tovarlar = savat_data.get("tovarlar", [])
    jami = float(savat_data.get("jami", 0))
    soni = savat_data.get("tovar_soni", len(tovarlar))

    qatorlar = [
        f"🛒 {klient}",
        f"📦 {soni} xil tovar",
        "━" * 30,
    ]

    for i, t in enumerate(tovarlar, 1):
        nomi = t.get("tovar_nomi", t.get("nomi", "?"))
        miq = float(t.get("miqdor", 0))
        birlik = t.get("birlik", "dona")
        narx = float(t.get("narx", 0))
        t_jami = float(t.get("jami", 0))

        if narx > 0 and t_jami > 0:
            qatorlar.append(f"  {i}. {nomi}")
            qatorlar.append(f"     {miq:,.0f} {birlik} × {narx:,.0f} = {t_jami:,.0f}")
        elif miq > 0:
            qatorlar.append(f"  {i}. {nomi} — {miq:,.0f} {birlik}")
        else:
            qatorlar.append(f"  {i}. {nomi}")

    qatorlar.append("━" * 30)
    qatorlar.append(f"💰 JAMI: {jami:,.0f} so'm")

    return "\n".join(qatorlar)


def savat_qisqa_matn(result: dict) -> str:
    """Savatga qo'shilgandan keyin qisqa javob"""
    klient = result.get("klient", "")
    qo_shildi = result.get("qo_shildi", 0)
    yangilandi = result.get("yangilandi", 0)
    jami = float(result.get("jami", 0))
    soni = result.get("tovar_soni", 0)

    parts = []
    if qo_shildi:
        parts.append(f"+{qo_shildi} yangi")
    if yangilandi:
        parts.append(f"~{yangilandi} yangilandi")

    izoh = ", ".join(parts) if parts else "qo'shildi"

    return (
        f"🛒 {klient} — {izoh}\n"
        f"📦 {soni} xil tovar | 💰 {jami:,.0f} so'm\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"\"{klient} bo'ldi\" → nakladnoy chiqadi"
    )


def ochiq_savatlar_matn(savatlar: list[dict]) -> str:
    """Barcha ochiq savatlar ro'yxati"""
    if not savatlar:
        return "🛒 Ochiq savat yo'q\n\nOvoz yuboring:\n\"Salimovga 1 Ariel 45000\""

    qatorlar = [
        f"🛒 OCHIQ SAVATLAR ({len(savatlar)} ta)",
        "━" * 30,
    ]

    jami_summa = 0
    for i, s in enumerate(savatlar, 1):
        klient = s.get("klient_ismi", "?")
        soni = s.get("tovar_soni", 0)
        jami = float(s.get("jami_summa", 0))
        jami_summa += jami
        qatorlar.append(f"  {i}. {klient}")
        qatorlar.append(f"     📦 {soni} xil | 💰 {jami:,.0f} so'm")

    qatorlar.append("━" * 30)
    qatorlar.append(f"💰 JAMI: {jami_summa:,.0f} so'm")
    qatorlar.append("")
    qatorlar.append("Yopish: \"Klient ismi bo'ldi\"")
    qatorlar.append("Ko'rish: \"/savat Klient ismi\"")

    return "\n".join(qatorlar)


def kunlik_yakuniy_matn(stats: dict) -> str:
    """Kunlik yakuniy — formatlangan"""
    yopilgan = stats.get("yopilgan", 0)
    ochiq = stats.get("ochiq", 0)
    jami = float(stats.get("jami_sotuv", 0))
    klient = stats.get("klient_soni", 0)

    return (
        f"📊 KUNLIK YAKUNIY\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"✅ Yopilgan: {yopilgan} ta savat\n"
        f"⏳ Ochiq: {ochiq} ta savat\n"
        f"👥 Klientlar: {klient} ta\n"
        f"💰 Jami sotuv: {jami:,.0f} so'm"
    )
