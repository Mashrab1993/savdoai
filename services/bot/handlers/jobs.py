"""
Avtomatik joblar — kunlik hisobot, haftalik trend, qarz eslatma, obuna.
Bot scheduler (job_queue) orqali ishlatiladi.
"""
from __future__ import annotations
import logging

from telegram.constants import ParseMode
from telegram.ext import ContextTypes

import services.bot.db as db
from shared.utils.fmt import pul

log = logging.getLogger("savdoai.bot.jobs")


async def avto_kunlik_hisobot(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Har kuni kechqurun — kunlik PRO hisobot"""
    log.info("⏰ Avtomatik kunlik hisobot PRO...")
    try:
        from shared.services.smart_bot_engine import kunlik_yakuniy_pro, kunlik_yakuniy_pro_matn
        users = await db.faol_users()
        yuborildi = 0
        for user in users:
            try:
                async with db._P().acquire() as c:
                    d = await kunlik_yakuniy_pro(c, user["id"])
                if d["sotuv_soni"] == 0:
                    continue
                try:
                    from shared.services.suhbatdosh import kechki_xayrlashish, hisobot_tavsiya
                    _kech = kechki_xayrlashish()
                    _tavs = hisobot_tavsiya(d) if isinstance(d, dict) else ""
                    _msg = kunlik_yakuniy_pro_matn(d) + _tavs + "\n\n" + _kech
                except Exception:
                    _msg = kunlik_yakuniy_pro_matn(d)
                await ctx.bot.send_message(
                    user["id"], _msg,
                    parse_mode=ParseMode.MARKDOWN)
                yuborildi += 1
            except Exception as e:
                log.warning("Avtohisobot %s: %s", user["id"], e)
        log.info("✅ Kunlik hisobot PRO: %d foydalanuvchiga", yuborildi)
    except Exception as e:
        log.error("avto_kunlik_hisobot: %s", e, exc_info=True)


async def avto_haftalik_hisobot(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Har dushanba haftalik hisobot + trend"""
    log.info("⏰ Haftalik hisobot + trend...")
    try:
        from shared.services.smart_bot_engine import haftalik_trend, haftalik_trend_matn
        from shared.services.hisobot_engine import haftalik, hisobot_matn
        users = await db.faol_users()
        yuborildi = 0
        for user in users:
            try:
                async with db._P().acquire() as c:
                    h_data = await haftalik(c, user["id"])
                    t_data = await haftalik_trend(c, user["id"])
                if h_data["sotuv_soni"] == 0:
                    continue
                matn = hisobot_matn(h_data) + "\n\n" + haftalik_trend_matn(t_data)
                await ctx.bot.send_message(user["id"], matn, parse_mode=ParseMode.MARKDOWN)
                yuborildi += 1
            except Exception as e:
                log.warning("Haftalik %s: %s", user["id"], e)
        log.info("✅ Haftalik hisobot: %d foydalanuvchiga", yuborildi)
    except Exception as e:
        log.error("avto_haftalik_hisobot: %s", e, exc_info=True)


async def avto_qarz_eslatma(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Har kuni qarz eslatmasi — muddati o'tgan + yaqinlashayotgan"""
    log.info("⏰ Qarz eslatmalari PRO...")
    try:
        from shared.services.smart_bot_engine import qarz_eslatma_royxat
        users = await db.faol_users()
        for user in users:
            try:
                async with db._P().acquire() as c:
                    klientlar = await qarz_eslatma_royxat(c, user["id"])
                if not klientlar:
                    continue
                muddati_otgan = [k for k in klientlar if k["muddati_otgan"]]
                yaqin = [k for k in klientlar if k["yaqinlashmoqda"]]
                jami = sum(k["jami_qarz"] for k in klientlar)
                matn = f"💰 *QARZ ESLATMASI*\n\nJami qarz: *{pul(jami)}*\n"
                matn += f"Klientlar: {len(klientlar)} ta\n"
                if muddati_otgan:
                    matn += f"\n🔴 *MUDDATI O'TGAN ({len(muddati_otgan)} ta):*\n"
                    for k in muddati_otgan[:5]:
                        matn += f"  • {k['ism']} — {pul(k['jami_qarz'])} (muddat: {k['muddat']})\n"
                if yaqin:
                    matn += f"\n🟡 *3 kun ichida ({len(yaqin)} ta):*\n"
                    for k in yaqin[:5]:
                        matn += f"  • {k['ism']} — {pul(k['jami_qarz'])} (muddat: {k['muddat']})\n"
                await ctx.bot.send_message(user["id"], matn, parse_mode=ParseMode.MARKDOWN)
            except Exception as e:
                log.warning("Qarz eslatma %s: %s", user["id"], e)
    except Exception as e:
        log.error("avto_qarz_eslatma: %s", e, exc_info=True)


async def obuna_eslatma(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Obuna muddati tugayotganlarga eslatma"""
    try:
        for kun in [3, 1]:
            users = await db.obuna_tugayotganlar(kun)
            for user in users:
                try:
                    await ctx.bot.send_message(
                        user["id"],
                        f"⚠️ *Obuna {kun} kunda tugaydi!*\n"
                        "Uzaytirib olish uchun admin bilan bog'laning.",
                        parse_mode=ParseMode.MARKDOWN)
                except Exception as _e:
                    log.debug("obuna eslatma: %s", _e)
    except Exception as e:
        log.error("obuna_eslatma: %s", e, exc_info=True)


# ═══ ERTALAB HISOBOT — HAR KUNI 09:00 TOSHKENT ═══

async def avto_ertalab_hisobot(ctx: ContextTypes.DEFAULT_TYPE) -> None:
    """Har kuni 09:00 Toshkent — ertalab kunlik xulosa + PDF.

    Tarkib:
    - Kechagi sotuv/kirim/foyda
    - Muddati o'tgan qarzlar
    - Kam qoldiq tovarlar
    - Motivatsion xabar
    - PDF hisobot (professional)
    """
    log.info("☀️ Ertalab hisobot boshlandi...")
    try:
        users = await db.faol_users()
        yuborildi = 0

        for user in users:
            uid = user["id"]
            try:
                # Kechagi statistika
                d = await db.kunlik_hisobot(uid)

                # Kecha hech narsa bo'lmagan — o'tkazish
                sotuv_soni = d.get("sotuv_soni", d.get("ch_n", 0)) if isinstance(d, dict) else 0
                kirim_soni = d.get("kirim_soni", d.get("kr_n", 0)) if isinstance(d, dict) else 0
                if sotuv_soni == 0 and kirim_soni == 0:
                    continue

                # Muddati o'tgan qarzlar
                qarzlar = await _muddati_otgan_qarzlar(uid)

                # Kam qoldiq
                kam = await _kam_qoldiq_tovarlar(uid)

                # Tug'ilgan kunlar
                tugilgan = await _bugungi_tugilgan_kun(uid)

                # Matn yaratish
                ism = user.get("ism", "")
                matn = _ertalab_matn(d, qarzlar, kam, ism, tugilgan)

                await ctx.bot.send_message(uid, matn, parse_mode=ParseMode.MARKDOWN)

                # PDF hisobot yuborish
                try:
                    from shared.services.auto_report_pdf import kunlik_pdf
                    import io as _io
                    from telegram import InputFile
                    import datetime as _dt

                    pdf_bytes = kunlik_pdf(d, qarzlar, kam, ism, tugilgan)
                    if pdf_bytes:
                        sana = _dt.datetime.now().strftime("%d_%m_%Y")
                        await ctx.bot.send_document(
                            uid,
                            document=InputFile(
                                _io.BytesIO(pdf_bytes),
                                filename=f"SavdoAI_Hisobot_{sana}.pdf"
                            ),
                            caption=f"📊 Kunlik hisobot — {_dt.datetime.now().strftime('%d.%m.%Y')}"
                        )
                except Exception as pdf_e:
                    log.debug("Ertalab PDF: %s", pdf_e)

                yuborildi += 1

            except Exception as e:
                log.debug("ertalab hisobot uid=%s: %s", uid, e)

        log.info("☀️ Ertalab hisobot: %d ta yuborildi", yuborildi)

    except Exception as e:
        log.error("avto_ertalab_hisobot: %s", e, exc_info=True)


async def _muddati_otgan_qarzlar(uid: int) -> list[dict]:
    """Muddati o'tgan qarz klientlar."""
    try:
        async with db._P().acquire() as c:
            rows = await c.fetch(
                "SELECT k.ism AS klient_ismi, q.summa - q.tolangan AS qoldiq "
                "FROM qarzlar q JOIN klientlar k ON k.id = q.klient_id "
                "WHERE q.user_id=$1 AND q.summa > q.tolangan "
                "AND q.muddat < CURRENT_DATE "
                "ORDER BY (q.summa - q.tolangan) DESC LIMIT 10",
                uid,
            )
            return [dict(r) for r in rows]
    except Exception as e:
        log.debug("muddati_otgan: %s", e)
        return []


async def _kam_qoldiq_tovarlar(uid: int) -> list[dict]:
    """min_qoldiq dan kam tovarlar."""
    try:
        async with db._P().acquire() as c:
            rows = await c.fetch(
                "SELECT nomi, qoldiq, min_qoldiq, birlik "
                "FROM tovarlar "
                "WHERE user_id=$1 AND qoldiq < min_qoldiq AND min_qoldiq > 0 "
                "ORDER BY qoldiq ASC LIMIT 10",
                uid,
            )
            return [dict(r) for r in rows]
    except Exception as e:
        log.debug("kam_qoldiq: %s", e)
        return []


async def _bugungi_tugilgan_kun(uid: int) -> list[dict]:
    """Bugun tug'ilgan kun bo'lgan klientlar."""
    try:
        from datetime import date
        today = date.today()
        async with db._P().acquire() as c:
            rows = await c.fetch(
                "SELECT ism, telefon FROM klientlar "
                "WHERE user_id=$1 AND tugilgan_kun IS NOT NULL "
                "AND EXTRACT(MONTH FROM tugilgan_kun) = $2 "
                "AND EXTRACT(DAY FROM tugilgan_kun) = $3",
                uid, today.month, today.day,
            )
            return [dict(r) for r in rows]
    except Exception as e:
        log.debug("tugilgan: %s", e)
        return []


def _ertalab_matn(d: dict, qarzlar: list, kam_qoldiq: list,
                   ism: str, tugilgan: list | None = None) -> str:
    """Ertalab xulosa matni."""
    parts = []
    parts.append(f"☀️ *Xayrli tong{', ' + ism if ism else ''}!*\n")

    # Kechagi natija
    parts.append("📊 *Kechagi natija:*")
    sotuv_soni = d.get("sotuv_soni", 0) if isinstance(d, dict) else 0
    if sotuv_soni > 0:
        parts.append(f"  💰 Sotuv: {sotuv_soni} ta — {pul(d.get('jami_sotuv', 0))} so'm")
    kirim_soni = d.get("kirim_soni", 0) if isinstance(d, dict) else 0
    if kirim_soni > 0:
        parts.append(f"  📦 Kirim: {kirim_soni} ta — {pul(d.get('jami_kirim', 0))} so'm")
    foyda = d.get("foyda", 0) if isinstance(d, dict) else 0
    if foyda:
        parts.append(f"  📈 Foyda: {pul(foyda)} so'm")
    parts.append("")

    # Muddati o'tgan qarzlar
    if qarzlar:
        jami_qarz = sum(q.get("qoldiq", 0) for q in qarzlar)
        parts.append(f"⚠️ *Muddati o'tgan qarzlar: {len(qarzlar)} ta*")
        parts.append(f"  💸 Jami: {pul(jami_qarz)} so'm")
        for q in qarzlar[:3]:
            parts.append(f"  • {q.get('klient_ismi', '?')} — {pul(q.get('qoldiq', 0))}")
        if len(qarzlar) > 3:
            parts.append(f"  ... va {len(qarzlar) - 3} ta boshqa")
        parts.append("")

    # Kam qoldiq
    if kam_qoldiq:
        parts.append(f"📦 *Kam qoldiq: {len(kam_qoldiq)} ta tovar*")
        for t in kam_qoldiq[:5]:
            parts.append(
                f"  • {t['nomi']}: {t['qoldiq']}/{t['min_qoldiq']} "
                f"{t.get('birlik', '')}"
            )
        parts.append("")

    parts.append("🚀 Bugun ham omad tilayman!")

    # Tug'ilgan kunlar
    if tugilgan:
        parts.insert(-1, "")
        parts.insert(-1, f"🎂 *Bugun tug'ilgan kun: {len(tugilgan)} ta klient*")
        for t in tugilgan[:5]:
            parts.insert(-1, f"  • {t['ism']} — {t.get('telefon', '')}")
        parts.insert(-1, "  💡 Tabriklab, chegirma taklif qiling!")

    return "\n".join(parts)
