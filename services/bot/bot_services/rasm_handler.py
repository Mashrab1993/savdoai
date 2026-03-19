"""
MASHRAB MOLIYA v21.3 — Rasm handler (Vision AI)
Bot da rasm yuborilganda — Vision AI bilan tahlil qiladi.
"""
from __future__ import annotations
import logging
import tempfile
import os

log = logging.getLogger(__name__)


async def rasm_qabul(update, ctx) -> None:
    """
    Rasm xabar handler.
    Foydalanuvchi rasm yuborsa — Vision AI bilan tahlil qilinadi.
    """
    if not update.message or not update.message.photo:
        return

    uid = update.effective_user.id
    holat = await update.message.reply_text("⏳")

    try:
        # Eng katta rasm (oxirgi element)
        photo = update.message.photo[-1]
        fayl = await ctx.bot.get_file(photo.file_id)
        rasm_bytes = bytes(await fayl.download_as_bytearray())

        # Vision AI
        try:
            from shared.services.vision import rasm_tahlil, ishga_tushir
            natija = await rasm_tahlil(rasm_bytes, "image/jpeg")
        except ImportError:
            await holat.edit_text("⚠️ Vision AI moduli mavjud emas.")
            return

        ishonch = natija.get("ishonch", 0)
        tur = natija.get("tur", "noaniq")

        if tur == "xato" or ishonch < 0.3:
            await holat.edit_text(
                "❌ Rasm tushunilmadi.\n\n"
                "Tavsiyalar:\n"
                "• Rasmni aniqroq oling\n"
                "• Yorug'lik yetarli bo'lsin\n"
                "• To'g'ri burchakda suring"
            )
            return

        # Natijani formatlash
        matn = f"📸 *RASM TAHLILI* (ishonch: {ishonch:.0%})\n\n"
        matn += f"📋 Tur: *{tur}*\n"

        if natija.get("klient"):
            matn += f"👤 Klient: *{natija['klient']}*\n"
        if natija.get("sana"):
            matn += f"📅 Sana: {natija['sana']}\n"

        tovarlar = natija.get("tovarlar", [])
        if tovarlar:
            matn += f"\n📦 *Tovarlar ({len(tovarlar)} ta):*\n"
            for i, t in enumerate(tovarlar[:10], 1):
                nomi = t.get("nomi", "?")
                miq = t.get("miqdor", 0)
                narx = t.get("narx", 0)
                jami = t.get("jami", 0)
                matn += f"  {i}. {nomi}"
                if miq: matn += f" — {miq}"
                if jami: matn += f" | {jami:,.0f}"
                matn += "\n"
            if len(tovarlar) > 10:
                matn += f"  ...va yana {len(tovarlar) - 10} ta\n"

        jami = natija.get("jami_summa", 0)
        if jami:
            matn += f"\n💰 *Jami: {float(jami):,.0f} so'm*"

        if natija.get("izoh"):
            matn += f"\n\n📝 {natija['izoh']}"

        from telegram.constants import ParseMode
        await holat.edit_text(matn, parse_mode=ParseMode.MARKDOWN)

    except Exception as xato:
        log.error("rasm_qabul: %s", xato, exc_info=True)
        await holat.edit_text("❌ Rasm tahlilida xato yuz berdi")
