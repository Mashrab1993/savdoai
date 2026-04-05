"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — MATN XABAR HANDLER                               ║
║  Foydalanuvchi matn yuborganda — dispatch logika             ║
║                                                              ║
║  Tartib:                                                     ║
║  1. Tahrirlash rejimi                                        ║
║  2. Shogird xarajat                                          ║
║  3. Print/chek buyruqlari                                    ║
║  4. Ochiq savat buyruqlari                                   ║
║  5. Kontekst + tuzatish                                      ║
║  6. Hujjat savol-javob                                       ║
║  7. Suhbat aniqlash                                          ║
║  8. Hisobot                                                  ║
║  9. Klient qarz                                              ║
║  10. Smart buyruqlar                                         ║
║  11. Advanced features                                       ║
║  12. O\'zbek buyruq                                          ║
║  13. AI ga yuborish                                          ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import re as _re_savat

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode, ChatAction
from telegram.ext import ContextTypes

import services.bot.db as db
import services.bot.bot_services.analyst as ai_xizmat
from services.bot.bot_helpers import (
    _user_ol_kesh, faol_tekshir, tg, cfg,
)
import io
from telegram import InputFile
from shared.utils.fmt import pul

log = logging.getLogger("mm")


# Lazy imports — circular dependency oldini olish
def _get_qayta_ishlash():
    from services.bot.handlers.savdo import _qayta_ishlash
    return _qayta_ishlash

def _get_ovoz_buyruq_bajar():
    from services.bot.handlers.commands import _ovoz_buyruq_bajar
    return _ovoz_buyruq_bajar

def _get_savat_yop_va_nakladnoy():
    from services.bot.handlers.savdo import _savat_yop_va_nakladnoy
    return _savat_yop_va_nakladnoy

def _get_shogird_xarajat_qabul():
    from services.bot.handlers.shogird import _shogird_xarajat_qabul
    return _shogird_xarajat_qabul


def _nakladnoy_savol_javob(h: dict, savol: str) -> str | None:
    """Nakladnoy/Reestr ma'lumotidan savollarga javob berish."""
    s = savol.lower().strip()
    
    def sf(v):
        try: return float(str(v).replace(",","").replace(" ",""))
        except Exception: return 0
    
    naklarlar = h.get("nakladnoylar", [])
    if not naklarlar:
        return None
    
    # Klient ma'lumotlari yig'ish
    kl_data = {}
    for n in naklarlar:
        k = n.get("klient", "?")
        if k not in kl_data:
            kl_data[k] = {"jami": 0, "soni": 0, "balans": sf(n.get("balans", 0)), "tp": n.get("tp", "")}
        kl_data[k]["jami"] += n.get("jami", 0)
        kl_data[k]["soni"] += 1
    
    # Qarzli klientlar
    qarzli = [(k, d) for k, d in kl_data.items() if d["balans"] < 0]
    qarzli.sort(key=lambda x: x[1]["balans"])
    
    if any(w in s for w in ["qarz", "qarzdor", "долг", "nasiya", "qarzli", "qarzdorlik"]):
        if not qarzli:
            return "✅ Qarzli klient yo'q!"
        m = f"⚠️ *QARZLI KLIENTLAR ({len(qarzli)} ta)*\n━━━━━━━━━━━━━━━━━━━━━\n"
        jami_qarz = 0
        for i, (k, d) in enumerate(qarzli, 1):
            m += f"{i}. {k[:35]}: *{d['balans']:,.0f}*\n"
            jami_qarz += d["balans"]
        m += f"\n💰 *JAMI QARZ: {jami_qarz:,.0f}* so'm"
        if len(m) > 4000: m = m[:3950] + "\n_...qisqartirildi_"
        return m
    
    # Top klientlar
    if any(w in s for w in ["top klient", "eng katta", "katta klient", "top mijoz", "лучшие"]):
        top = sorted(kl_data.items(), key=lambda x: -x[1]["jami"])[:15]
        m = f"👑 *TOP {len(top)} KLIENTLAR*\n━━━━━━━━━━━━━━━━━━━━━\n"
        for i, (k, d) in enumerate(top, 1):
            q = "⚠️" if d["balans"] < 0 else ""
            m += f"{i}. {q}{k[:35]}: *{d['jami']:,.0f}*\n"
        return m
    
    # Top tovarlar
    if any(w in s for w in ["top tovar", "eng ko'p", "sotilgan", "tovar", "mahsulot", "товар"]):
        tv = h.get("tovarlar", {})
        if isinstance(tv, dict):
            top = sorted(tv.items(), key=lambda x: -x[1][1] if isinstance(x[1], list) else 0)[:15]
            m = f"🏆 *TOP {len(top)} TOVARLAR*\n━━━━━━━━━━━━━━━━━━━━━\n"
            for i, (nomi, vals) in enumerate(top, 1):
                if isinstance(vals, list) and len(vals) >= 2:
                    m += f"{i}. {nomi[:35]}: {vals[0]:,.0f} — *{vals[1]:,.0f}*\n"
            return m
        return None
    
    # TP reyting
    if any(w in s for w in ["tp", "reyting", "vakil", "sotuvchi", "представител", "agent"]):
        tp_data = {}
        for n in naklarlar:
            tp = n.get("tp", "?")
            if tp not in tp_data: tp_data[tp] = {"soni": 0, "jami": 0, "kl": set()}
            tp_data[tp]["soni"] += 1
            tp_data[tp]["jami"] += n.get("jami", 0)
            tp_data[tp]["kl"].add(n.get("klient", ""))
        medals = ["🥇", "🥈", "🥉"]
        m = "👤 *TP REYTING*\n━━━━━━━━━━━━━━━━━━━━━\n"
        for i, (tp, d) in enumerate(sorted(tp_data.items(), key=lambda x: -x[1]["jami"]), 1):
            medal = medals[i-1] if i <= 3 else f"{i}."
            m += f"{medal} {tp}\n   {len(d['kl'])} klient | *{d['jami']:,.0f}*\n"
        return m
    
    # Jami
    if any(w in s for w in ["jami", "umumiy", "total", "итого", "summa"]):
        m = f"📊 *UMUMIY*\n━━━━━━━━━━━━━━━━━━━━━\n"
        m += f"📋 Nakladnoylar: *{len(naklarlar)}*\n"
        m += f"👥 Klientlar: *{len(kl_data)}*\n"
        m += f"💰 Jami: *{h.get('jami_summa', 0):,.0f}* so'm\n"
        m += f"⚠️ Qarzli: *{len(qarzli)}* klient\n"
        return m
    
    # Klient qidirish (ism bo'yicha)
    for k, d in kl_data.items():
        if s.replace("?","").strip().lower() in k.lower():
            m = f"👤 *{k}*\n━━━━━━━━━━━━━━━━━━━━━\n"
            m += f"💰 Sotuv: *{d['jami']:,.0f}* so'm\n"
            m += f"📋 Nakladnoylar: {d['soni']}\n"
            m += f"👤 TP: {d['tp']}\n"
            if d['balans'] < 0:
                m += f"⚠️ Qarz: *{d['balans']:,.0f}* so'm\n"
            else:
                m += f"✅ Balans: {d['balans']:,.0f}\n"
            return m
    
    return None


async def _nakladnoy_ai_savol(h: dict, savol: str) -> str | None:
    """Nakladnoy/Reestr ma'lumotidan AI (Claude) bilan har qanday savolga javob."""
    import os
    
    _key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not _key:
        return None
    
    def sf(v):
        try: return float(str(v).replace(",","").replace(" ",""))
        except Exception: return 0
    
    naklarlar = h.get("nakladnoylar", [])
    if not naklarlar:
        return None
    
    # Ma'lumot xulosa tayyorlash (AI uchun kontekst)
    kl_data = {}
    for n in naklarlar:
        k = n.get("klient", "?")
        if k not in kl_data:
            kl_data[k] = {"jami": 0, "soni": 0, "balans": sf(n.get("balans", 0)), "tp": n.get("tp", "")}
        kl_data[k]["jami"] += n.get("jami", 0)
        kl_data[k]["soni"] += 1
    
    # TP ma'lumotlari
    tp_data = {}
    for n in naklarlar:
        tp = n.get("tp", "?")
        if tp not in tp_data: tp_data[tp] = {"soni": 0, "jami": 0, "kl": 0}
        tp_data[tp]["soni"] += 1
        tp_data[tp]["jami"] += n.get("jami", 0)
    for tp in tp_data:
        tp_data[tp]["kl"] = len([k for k,d in kl_data.items() if d["tp"]==tp])
    
    # Qarzli
    qarzli = [(k, d) for k, d in kl_data.items() if d["balans"] < 0]
    qarzli.sort(key=lambda x: x[1]["balans"])
    
    # Tovarlar
    tv = h.get("tovarlar", {})
    top_tovar = ""
    if isinstance(tv, dict):
        for nomi, vals in sorted(tv.items(), key=lambda x: -x[1][1] if isinstance(x[1], list) else 0)[:20]:
            if isinstance(vals, list) and len(vals) >= 2:
                top_tovar += f"  {nomi}: {vals[0]:.0f} dona, {vals[1]:,.0f} so'm\n"
    
    # AI uchun kontekst
    kontekst = f"""NAKLADNOY MA'LUMOTLARI:
Firma: {h.get('firma', '?')}
Sana: {h.get('sana', '?')}
Hududlar: {h.get('hududlar', '')}
Jami nakladnoylar: {len(naklarlar)}
Jami summa: {h.get('jami_summa', 0):,.0f} so'm
Tovar xillari: {h.get('tovar_xillari', 0)}

TP REYTING:
"""
    for tp, d in sorted(tp_data.items(), key=lambda x: -x[1]["jami"]):
        kontekst += f"  {tp}: {d['soni']} nak, {d['kl']} klient, {d['jami']:,.0f} so'm\n"
    
    kontekst += f"\nTOP 20 TOVARLAR:\n{top_tovar}"
    
    kontekst += f"\nTOP 20 KLIENTLAR:\n"
    for k, d in sorted(kl_data.items(), key=lambda x: -x[1]["jami"])[:20]:
        q = f" (QARZ: {d['balans']:,.0f})" if d["balans"] < 0 else ""
        kontekst += f"  {k}: {d['jami']:,.0f} so'm, TP: {d['tp']}{q}\n"
    
    kontekst += f"\nQARZLI KLIENTLAR ({len(qarzli)} ta):\n"
    for k, d in qarzli[:15]:
        kontekst += f"  {k}: {d['balans']:,.0f} so'm\n"
    jami_qarz = sum(d["balans"] for _, d in qarzli)
    kontekst += f"JAMI QARZ: {jami_qarz:,.0f} so'm\n"
    
    kontekst += f"\nBARCHA KLIENTLAR ({len(kl_data)} ta):\n"
    for k, d in sorted(kl_data.items(), key=lambda x: x[0]):
        q = f" QARZ:{d['balans']:,.0f}" if d["balans"] < 0 else ""
        kontekst += f"  {k}: {d['jami']:,.0f}, TP:{d['tp']}{q}\n"
    
    # Kontekstni qisqartirish (token tejash)
    if len(kontekst) > 25000:
        kontekst = kontekst[:25000] + "\n...(qisqartirildi)"
    
    prompt = f"""Sen SavdoAI — O'zbek savdogarlari uchun AI yordamchi.
Foydalanuvchi nakladnoy Excel faylini yukladi. Quyida ma'lumotlar. 
Foydalanuvchining SAVOLIGA to'liq, aniq, foydali javob ber.

{kontekst}

QOIDALAR:
1. O'ZBEK tilida javob ber
2. Raqamlarni 1,234,567 formatda yoz
3. Jadval va emoji ishlat — lekin ortiqcha emas
4. Aniq, foydali javob ber — umumiy gap emas
5. Agar savol aniq klientga tegishli — shu klient haqida to'liq ma'lumot ber
6. Agar savol tahlil so'rasa — professional AUDITOR darajasida tahlil qil
7. Har doim KONKRET raqamlar bilan javob ber
8. Telegram Markdown format: *qalin*, _kursiv_
9. Maxsus belgilar (., -, (, )) ni escape qilma

SAVOL: {savol}"""

    try:
        from shared.services.ai_suhbat import _get_suhbat_client
        client = _get_suhbat_client()
        if not client:
            return None
        
        resp = await client.messages.create(
            model=os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-6"),
            max_tokens=3000,
            messages=[{"role": "user", "content": prompt}],
        )
        javob = (resp.content[0].text or "").strip()
        if javob and len(javob) > 20:
            return javob
    except Exception as e:
        log.warning("Nakladnoy AI: %s", e)
    
    return None


async def matn_qabul(update:Update, ctx:ContextTypes.DEFAULT_TYPE):
    uid=update.effective_user.id
    from services.bot.main import _flood_ok
    if not _flood_ok(uid): return
    if not await faol_tekshir(update): return
    matn=(update.message.text or "").strip()
    if not matn or matn.startswith("/"): return
    # Duplicate guard
    from shared.services.guards import is_duplicate_message
    if is_duplicate_message(uid, matn): return

    # ═══ EXCEL CHAT — AI savol-javob rejimi ═══
    try:
        from services.bot.handlers.excel_chat import excel_savol_javob, excel_chat_active
        if excel_chat_active(ctx):
            handled = await excel_savol_javob(update, ctx)
            if handled:
                return
    except Exception as _ec_e:
        log.debug("Excel chat matn hook: %s", _ec_e)

    # ═══ TAHRIRLASH REJIMI (BIRINCHI tekshiriladi!) ═══
    tahr_rejim = ctx.user_data.get("_tahr_rejim")
    if tahr_rejim and ctx.user_data.get("kutilayotgan"):
      try:
        natija = ctx.user_data["kutilayotgan"]
        tovarlar = natija.get("tovarlar", [])
        xabar = ""
        
        if tahr_rejim == "klient":
            eski = natija.get("klient", "yo'q")
            natija["klient"] = matn.strip()
            xabar = f"✅ Klient: {eski} → {matn.strip()}"
        
        elif tahr_rejim == "narx":
            qismlar = matn.strip().split()
            if len(qismlar) >= 2 and qismlar[0].lower() == "hammasi":
                narx = float(qismlar[1].replace(",","").replace(".",""))
                for t in tovarlar:
                    t["narx"] = narx
                    t["jami"] = narx * float(t.get("miqdor", 0))
                xabar = f"✅ Barcha narxlar: {narx:,.0f} so'm"
            elif len(qismlar) >= 2:
                try:
                    idx = int(qismlar[0]) - 1
                    narx = float(qismlar[1].replace(",","").replace(".",""))
                    if 0 <= idx < len(tovarlar):
                        tovarlar[idx]["narx"] = narx
                        tovarlar[idx]["jami"] = narx * float(tovarlar[idx].get("miqdor", 0))
                        xabar = f"✅ {tovarlar[idx]['nomi']} narxi: {narx:,.0f} so'm"
                    else:
                        xabar = f"❌ Tovar #{qismlar[0]} topilmadi (1-{len(tovarlar)})"
                except ValueError:
                    xabar = "❌ Noto'g'ri format. Masalan: 1 45000 yoki hammasi 50000"
            else:
                try:
                    narx = float(matn.replace(",","").replace(".","").replace(" ",""))
                    for t in tovarlar:
                        t["narx"] = narx
                        t["jami"] = narx * float(t.get("miqdor", 0))
                    xabar = f"✅ Barcha narxlar: {narx:,.0f} so'm"
                except ValueError:
                    xabar = "❌ Raqam kiriting. Masalan: 45000 yoki 1 45000"
        
        elif tahr_rejim == "miqdor":
            qismlar = matn.strip().split()
            if len(qismlar) >= 2 and qismlar[0].lower() == "hammasi":
                miqdor = float(qismlar[1].replace(",",""))
                for t in tovarlar:
                    t["miqdor"] = miqdor
                    t["jami"] = float(t.get("narx", 0)) * miqdor
                xabar = f"✅ Barcha miqdorlar: {miqdor:,.0f}"
            elif len(qismlar) >= 2:
                try:
                    idx = int(qismlar[0]) - 1
                    miqdor = float(qismlar[1].replace(",",""))
                    if 0 <= idx < len(tovarlar):
                        tovarlar[idx]["miqdor"] = miqdor
                        tovarlar[idx]["jami"] = float(tovarlar[idx].get("narx", 0)) * miqdor
                        xabar = f"✅ {tovarlar[idx]['nomi']} miqdori: {miqdor:,.0f}"
                    else:
                        xabar = f"❌ Tovar #{qismlar[0]} topilmadi (1-{len(tovarlar)})"
                except ValueError:
                    xabar = "❌ Noto'g'ri format. Masalan: 1 100 yoki hammasi 50"
            else:
                xabar = "❌ Masalan: 1 100 yoki hammasi 50"
        
        elif tahr_rejim == "qarz":
            matn_t = matn.strip().lower().replace(",","").replace(".","").replace(" ","")
            jami = float(natija.get("jami_summa", 0))
            if matn_t == "hammasi":
                natija["qarz"] = jami
                natija["tolangan"] = 0
                xabar = f"✅ To'liq qarzga: {jami:,.0f} so'm"
            else:
                try:
                    qarz_y = float(matn_t)
                    if qarz_y > jami:
                        qarz_y = jami
                    natija["qarz"] = qarz_y
                    natija["tolangan"] = max(jami - qarz_y, 0)
                    xabar = f"✅ Qarz: {qarz_y:,.0f} | To'langan: {jami - qarz_y:,.0f}"
                except ValueError:
                    xabar = "❌ Raqam kiriting. Masalan: 500000 yoki hammasi"
        
        # Jami summani qayta hisoblash
        if tovarlar:
            natija["jami_summa"] = sum(float(t.get("jami", 0)) for t in tovarlar)
            if tahr_rejim != "qarz":
                qarz = float(natija.get("qarz", 0))
                natija["tolangan"] = max(natija["jami_summa"] - qarz, 0)
        
        ctx.user_data["kutilayotgan"] = natija
        ctx.user_data.pop("_tahr_rejim", None)
        
        # Yangilangan preview (MARKDOWN o'chirildi — xavfsiz)
        try:
            oldindan = ai_xizmat.oldindan_korinish(natija)
        except Exception as _e:
            log.debug("Xato: %s", _e)
            oldindan = f"Klient: {natija.get('klient','')}\nJami: {float(natija.get('jami_summa',0) or 0):,.0f}"
        markup=tg(
            [("✅ Saqlash","t:ha"),("❌ Bekor","t:yoq")],
            [("✏️ Klient","t:tahr:klient"),("✏️ Narx","t:tahr:narx")],
            [("✏️ Miqdor","t:tahr:miqdor"),("✏️ Qarz","t:tahr:qarz")],
        )
        await update.message.reply_text(
            f"{xabar}\n\n{'─'*26}\n\n{oldindan}",
            reply_markup=markup
        )
        return
      except Exception as _tahr_e:
        log.error("Tahrirlash xato: %s", _tahr_e, exc_info=True)
        ctx.user_data.pop("_tahr_rejim", None)
        await update.message.reply_text("❌ Tahrirlash xatosi. Qaytadan yuboring.")
        return

    # ═══ SHOGIRD XARAJAT TEKSHIRUVI ═══
    if not cfg().is_admin(uid):
        try:
            from shared.services.shogird_xarajat import shogird_topish_tg
            from shared.database.pool import get_pool
            pool = get_pool()
            async with pool.acquire() as raw_conn:
                shogird = await shogird_topish_tg(raw_conn, uid)
            if shogird:
                handled = await _get_shogird_xarajat_qabul()(update, ctx, matn, shogird)
                if handled:
                    return
        except Exception as _se:
            log.debug("Shogird tekshiruv: %s", _se)

    # ═══ PRINTER / CHEK (matn: "printer chek", "qayta chek", ...) ═══
    try:
        from shared.services.print_intent import detect_print_intent
        from shared.services.bot_print_handler import handle_print_intent_message

        _pk = detect_print_intent(matn)
        if _pk:
            if await handle_print_intent_message(update, ctx, _pk, db):
                return
    except Exception as _pi:
        log.debug("Print intent: %s", _pi)

    # ═══ OCHIQ SAVAT BUYRUQLARI ═══

    # 1. "Klient bo'ldi / tugadi" → savat yopish
    import re as _re_savat
    _boldi_pattern = _re_savat.match(
        r"^(.+?)\s+(boldi|bo'ldi|tugadi|yopish|tamom|yop|nakladnoy|chek)\s*$",
        matn, _re_savat.IGNORECASE
    )
    if _boldi_pattern:
        _savat_klient = _boldi_pattern.group(1).strip()
        try:
            from shared.services.ochiq_savat import savat_ol
            async with db._P().acquire() as _sc:
                _savat = await savat_ol(_sc, uid, _savat_klient)
            if _savat:
                await _get_savat_yop_va_nakladnoy()(update, uid, _savat_klient, ctx)
                return
        except Exception as _se:
            log.debug("Savat boldi: %s", _se)

    # 2. "Klient savat / savati" → ko'rish
    _savat_kor = _re_savat.match(
        r"^(.+?)\s+(savat|savati|yuklari)\s*$",
        matn, _re_savat.IGNORECASE
    )
    if _savat_kor:
        _sk_klient = _savat_kor.group(1).strip()
        try:
            from shared.services.ochiq_savat import savat_korish, savat_matn
            async with db._P().acquire() as _sc2:
                _sk_data = await savat_korish(_sc2, uid, _sk_klient)
            if _sk_data:
                await update.message.reply_text(savat_matn(_sk_data))
                return
        except Exception as _se2:
            log.debug("Savat korish: %s", _se2)

    # 3. "savatlar" → ochiq savatlar
    if matn.lower().strip() in ("savatlar", "savatlarim", "ochiq savatlar"):
        try:
            from shared.services.ochiq_savat import ochiq_savatlar, ochiq_savatlar_matn
            async with db._P().acquire() as _sc3:
                _svtlr = await ochiq_savatlar(_sc3, uid)
            await update.message.reply_text(ochiq_savatlar_matn(_svtlr))
            return
        except Exception as _se3:
            log.debug("Savatlar: %s", _se3)

    # 4. "kunlik yakuniy" → statistika
    if matn.lower().strip() in ("kunlik yakuniy", "yakuniy", "bugungi yakuniy"):
        try:
            from shared.services.ochiq_savat import kunlik_yakuniy, kunlik_yakuniy_matn
            async with db._P().acquire() as _sc4:
                _yk = await kunlik_yakuniy(_sc4, uid)
            await update.message.reply_text(kunlik_yakuniy_matn(_yk))
            return
        except Exception as _se4:
            log.debug("Yakuniy: %s", _se4)

    # ═══ 4.1 KONTEKSTLI SAVAT — "yana 20 Tide qo'sh" ═══
    if ctx.user_data.get("kutilayotgan") or ctx.user_data.get("_oxirgi_klient"):
        try:
            from shared.services.advanced_features import kontekst_bormi, kontekst_tozala
            if kontekst_bormi(matn):
                _toza = kontekst_tozala(matn)
                _oxirgi = ctx.user_data.get("kutilayotgan") or {}
                _klient = _oxirgi.get("klient") or ctx.user_data.get("_oxirgi_klient", "")
                if _klient and _toza:
                    # Kontekstni Claude ga yuborish — klient qo'shilgan
                    matn = f"{_klient}ga {_toza}"
                    log.info("Kontekst: '%s' → '%s'", update.message.text, matn)
        except Exception as _ke:
            log.debug("Kontekst: %s", _ke)

    # ═══ 4.2 TUZATISH — "50 emas 30", "narxini 45000 qil" ═══
    if ctx.user_data.get("kutilayotgan"):
        try:
            from shared.services.advanced_features import tuzatish_bormi, tuzatish_ajrat
            if tuzatish_bormi(matn):
                _tuz = tuzatish_ajrat(matn)
                if _tuz:
                    _draft = ctx.user_data["kutilayotgan"]
                    _tovarlar = _draft.get("tovarlar", [])
                    _ozgardi = False
                    
                    if _tuz.get("tur") == "miqdor" and _tovarlar:
                        # Oxirgi tovar miqdorini o'zgartirish
                        if _tuz.get("eski"):
                            # "50 emas 30" — 50 ni 30 ga
                            for _tv in _tovarlar:
                                if int(_tv.get("miqdor",0)) == _tuz["eski"]:
                                    _tv["miqdor"] = _tuz["yangi"]
                                    _tv["jami"] = _tuz["yangi"] * float(_tv.get("narx",0))
                                    _ozgardi = True; break
                        else:
                            # "miqdorni 30 ga" — oxirgi tovar
                            _tovarlar[-1]["miqdor"] = _tuz["yangi"]
                            _tovarlar[-1]["jami"] = _tuz["yangi"] * float(_tovarlar[-1].get("narx",0))
                            _ozgardi = True
                    
                    elif _tuz.get("tur") == "narx" and _tovarlar:
                        _tovarlar[-1]["narx"] = _tuz["yangi"]
                        _tovarlar[-1]["jami"] = float(_tovarlar[-1].get("miqdor",0)) * _tuz["yangi"]
                        _ozgardi = True
                    
                    if _ozgardi:
                        _draft["jami_summa"] = sum(float(t.get("jami",0)) for t in _tovarlar)
                        _preview = "✏️ *TUZATILDI:*\n\n"
                        for _i, _tv in enumerate(_tovarlar, 1):
                            _preview += f"  {_i}. {_tv.get('nomi','?')} — {_tv.get('miqdor',0)} × {pul(_tv.get('narx',0))} = {pul(_tv.get('jami',0))}\n"
                        _preview += f"\n💰 Jami: *{pul(_draft['jami_summa'])}*"
                        await update.message.reply_text(
                            _preview, parse_mode=ParseMode.MARKDOWN,
                            reply_markup=InlineKeyboardMarkup([
                                [InlineKeyboardButton("✅ Tasdiqlash", callback_data="t:ha")],
                                [InlineKeyboardButton("❌ Bekor", callback_data="t:yoq")],
                            ]))
                        return
        except Exception as _te:
            log.debug("Tuzatish: %s", _te)

    # ═══ 4.3 HUJJAT SAVOL-JAVOB ═══
    if ctx.user_data.get("hujjat"):
        _h = ctx.user_data["hujjat"]
        
        # ═══ NAKLADNOY / REESTR — savol-javob (v25.3.2) ═══
        if _h.get("tur") in ("nakladnoy", "reestr"):
            log.info("📋 Nakladnoy/Reestr savol: '%s'", matn[:50])
            
            # 1. Tezkor javob (kalit so'z bo'yicha — bepul, tez)
            try:
                _javob = _nakladnoy_savol_javob(_h, matn)
                if _javob:
                    try:
                        await update.message.reply_text(_javob, parse_mode=ParseMode.MARKDOWN)
                    except Exception:
                        await update.message.reply_text(_javob.replace("*","").replace("_",""))
                    return
            except Exception as _nse:
                log.warning("Nakladnoy tezkor savol xato: %s", _nse)
            
            # 2. AI javob — har qanday savol (Claude bilan)
            try:
                await update.message.chat.send_action(ChatAction.TYPING)
                _ai_javob = await _nakladnoy_ai_savol(_h, matn)
                if _ai_javob:
                    # Telegram 4096 limit
                    if len(_ai_javob) > 4000:
                        qismlar = []
                        joriy = ""
                        for qator in _ai_javob.split("\n"):
                            if len(joriy) + len(qator) > 3900:
                                qismlar.append(joriy)
                                joriy = qator + "\n"
                            else:
                                joriy += qator + "\n"
                        if joriy.strip(): qismlar.append(joriy)
                        for q in qismlar:
                            try:
                                await update.message.reply_text(q.strip(), parse_mode=ParseMode.MARKDOWN)
                            except Exception:
                                await update.message.reply_text(q.strip().replace("*","").replace("_",""))
                    else:
                        try:
                            await update.message.reply_text(_ai_javob, parse_mode=ParseMode.MARKDOWN)
                        except Exception:
                            await update.message.reply_text(_ai_javob.replace("*","").replace("_",""))
                    return
            except Exception as _ai_e:
                log.warning("Nakladnoy AI savol xato: %s", _ai_e)
        
        # EXCEL PRO — HAR QANDAY savol AI ga yuboriladi, HECH QACHON o'tkazib yuborilmaydi
        if _h.get("tur") == "xlsx_pro":
            log.info("📊 Excel savol: '%s'", matn[:50])
            try:
                from shared.services.excel_reader import excel_ai_savol, _oddiy_izlash
                _javob = await excel_ai_savol(_h, matn, cfg().gemini_key)
            except Exception as _ee:
                log.error("📊 Excel AI xato: %s", _ee)
                try:
                    from shared.services.excel_reader import _oddiy_izlash
                    _javob = _oddiy_izlash(_h, matn)
                except Exception as _e:
                    log.debug("Xato: %s", _e)
                    _javob = f"❌ Excel tahlilida xato. Qayta urinib ko'ring."
            try:
                await update.message.reply_text(_javob, parse_mode=ParseMode.MARKDOWN)
            except Exception:
                await update.message.reply_text(_javob.replace("*","").replace("_",""))
            return  # DOIM return — hech qachon o'tkazib yuborma
        
        # Boshqa hujjatlar (PDF, Word, EPUB...)
        try:
            from shared.services.hujjat_oqish import (
                hujjat_sorov_bormi, hujjatdan_izlash, ai_savol_kerakmi, ai_hujjat_savol
            )
            if hujjat_sorov_bormi(matn) or ai_savol_kerakmi(matn):
                # Avval oddiy izlash
                _javob = hujjatdan_izlash(_h, matn)
                
                # Topilmadi yoki AI kerak → Gemini bilan tahlil
                if ("topilmadi" in _javob.lower() or ai_savol_kerakmi(matn)):
                    try:
                        _ai_javob = await ai_hujjat_savol(_h, matn, cfg().gemini_key)
                        if _ai_javob and "topilmadi" not in _ai_javob.lower():
                            _javob = _ai_javob
                    except Exception as _e:
                        log.debug("Xato: %s", _e)
                        pass
                
                await update.message.reply_text(_javob, parse_mode=ParseMode.MARKDOWN)
                return
        except Exception as _he:
            log.debug("Hujjat savol: %s", _he)

    # ═══ 4.5 SUHBAT ANIQLASH — FAQAT salom, raxmat, yordam ═══
    # Savdo/biznes savollarni USHLAB QOLMASIN!
    try:
        _m_lower = matn.lower().strip()
        _biznes_sozlar = ("savdo", "sotuv", "sotdim", "qarz", "narx", "foyda", 
                          "tovar", "klient", "hisobot", "excel", "ariel", "tide",
                          "qancha", "nechta", "yaxshi", "yomon", "maslahat",
                          "tahlil", "ombor", "kirim", "chiqim")
        _biznes_msg = any(s in _m_lower for s in _biznes_sozlar)
        
        if not _biznes_msg:
            from shared.services.suhbatdosh import suhbat_turini_aniqla, suhbat_javob
            _suhbat = suhbat_turini_aniqla(matn)
            if _suhbat:
                _user = await _user_ol_kesh(uid)
                _ism = (_user.get("ism") or "").split()[0] if _user and _user.get("ism") else ""
                _javob = suhbat_javob(_suhbat, _ism)
                if _javob:
                    await update.message.reply_text(_javob)
                    return
    except Exception as _sh_e:
        log.debug("Suhbat: %s", _sh_e)

    # ═══ 5. OVOZLI HISOBOT — Claude ni chaqirmasdan tezkor javob ═══
    _hisobot_sozlar = (
        "bugungi sotuv", "bugungi hisobot", "kunlik hisobot",
        "haftalik hisobot", "oylik hisobot", "qarzlar hisoboti",
        "qancha sotdim", "qancha sotuv", "bugungi savdo",
        "haftalik savdo", "foyda qancha", "qarz qancha",
        "hisobot ber", "hisobot ko'rsat", "hisobot",
        "сегодня продажа", "отчет", "за неделю", "долги",
        "sotuv qancha", "bugun qancha",
        "hisobot excel", "excel hisobot", "oylik excel",
        "haftalik excel", "kunlik excel",
        # YANGI — ko'proq trigger
        "bugun savdo", "savdo qanday", "savdo yaxshi",
        "bugun nechta", "bugun qancha", "bugun foyda",
        "kechagi savdo", "kechagi sotuv",
        "sotuv yaxshi", "sotuv qanday",
    )
    _ml = matn.lower().strip()
    _hisobot_match = any(s in _ml for s in _hisobot_sozlar)
    _excel_so_rov = "excel" in _ml or "xlsx" in _ml
    if _hisobot_match:
        try:
            from shared.services.hisobot_engine import (
                kunlik, haftalik, oylik, qarz_hisobot,
                hisobot_matn, qarz_hisobot_matn, hisobot_turini_aniqla
            )
            from shared.database.pool import get_pool
            tur = hisobot_turini_aniqla(matn)
            async with db._P().acquire() as _hc:
                if tur == "qarz":
                    _hd = await qarz_hisobot(_hc, uid)
                    _hbody = qarz_hisobot_matn(_hd)
                elif tur == "oylik":
                    _hd = await oylik(_hc, uid)
                    _hbody = hisobot_matn(_hd)
                elif tur == "haftalik":
                    _hd = await haftalik(_hc, uid)
                    _hbody = hisobot_matn(_hd)
                else:
                    _hd = await kunlik(_hc, uid)
                    _hbody = hisobot_matn(_hd)

            # Suhbat uslubi — iliq kirish va tavsiya
            if tur != "qarz" and isinstance(_hd, dict):
                try:
                    from shared.services.suhbatdosh import hisobot_kirish, hisobot_tavsiya
                    _intro = hisobot_kirish(tur, _hd.get("sotuv_jami", 0), _hd.get("foyda", 0))
                    _tavs = hisobot_tavsiya(_hd)
                    _hbody = _intro + "\n\n" + _hbody + _tavs
                except Exception as _e:
                    log.debug("Xato: %s", _e)
                    pass

            # Excel so'ralgan bo'lsa → fayl yuborish
            if _excel_so_rov and tur != "qarz":
                try:
                    import services.bot.bot_services.export_excel as _exl
                    _user = await _user_ol_kesh(uid)
                    _dokon = (_user.get("dokon_nomi") or "Mashrab Moliya") if _user else "Mashrab Moliya"
                    _excel_bytes = _exl.hisobot_excel(_hd, _dokon)
                    _sana_s = _hd.get("sana", "").replace(".", "").replace(" ", "_")[:15]
                    _nom = f"hisobot_{tur}_{_sana_s}.xlsx"
                    await update.message.reply_text(_hbody, parse_mode=ParseMode.MARKDOWN)
                    await update.message.reply_document(
                        document=InputFile(io.BytesIO(_excel_bytes), filename=_nom),
                        caption=f"📊 {tur.capitalize()} hisobot Excel")
                    return
                except Exception as _ex_e:
                    log.warning("Hisobot Excel: %s", _ex_e)

            # Tugma bilan javob
            _h_markup = tg(
                [("📊 Excel", f"hisob_excel:{tur}")],
            ) if tur != "qarz" else None
            await update.message.reply_text(
                _hbody, parse_mode=ParseMode.MARKDOWN,
                reply_markup=_h_markup)

            # ═══ OVOZLI XULOSA (TTS) ═══
            if tur != "qarz" and isinstance(_hd, dict):
                try:
                    from services.bot.bot_services.tts import tts_tayyor, matn_ovozga, hisobot_xulosa
                    if tts_tayyor():
                        xulosa = hisobot_xulosa(_hd)
                        ogg = await matn_ovozga(xulosa)
                        if ogg:
                            await update.message.reply_voice(
                                voice=io.BytesIO(ogg),
                                caption="🔊 Ovozli xulosa")
                except Exception as _tts_e:
                    log.debug("TTS hisobot: %s", _tts_e)

            return
        except Exception as _he:
            log.warning("PRE-AI hisobot xato (davom etadi): %s", _he)

    # ═══ 6. KLIENT QARZ SO'ROVI — "Salimovning qarzi qancha?" ═══
    try:
        from shared.services.hisobot_engine import (
            klient_qarz_sorovi, klient_nomini_ajrat,
            klient_qarz_tarix, klient_qarz_tarix_matn
        )
        if klient_qarz_sorovi(matn):
            kl_ism = klient_nomini_ajrat(matn)
            if kl_ism:
                from shared.database.pool import get_pool
                async with db._P().acquire() as _kc:
                    _kd = await klient_qarz_tarix(_kc, uid, kl_ism)
                if _kd:
                    _kbody = klient_qarz_tarix_matn(_kd)
                    kid = _kd["klient"]["id"]
                    await update.message.reply_text(
                        _kbody, parse_mode=ParseMode.MARKDOWN,
                        reply_markup=tg(
                            [(f"📄 {kl_ism} PDF hisobi", f"eks:pdf:klient:{kid}")],
                            [(f"📊 Excel hisobi", f"eks:xls:klient:{kid}")],
                        )
                    )
                    return
                else:
                    await update.message.reply_text(
                        f"❌ '{kl_ism}' ismli klient topilmadi.\n"
                        "Klient ismini to'liqroq ayting.")
                    return
    except Exception as _ke:
        log.debug("Klient qarz shortcut: %s", _ke)

    # ═══ 7. SMART BUYRUQLAR — narx, reyting, trend, inventarizatsiya ═══
    try:
        from shared.services.smart_bot_engine import (
            smart_buyruq_aniqla, narx_tavsiya, narx_tavsiya_matn,
            narx_tovar_ajrat, klient_reyting, klient_reyting_matn,
            haftalik_trend, haftalik_trend_matn,
        )
        _smart_cmd = smart_buyruq_aniqla(matn)
        if _smart_cmd:
            from shared.database.pool import get_pool
            async with db._P().acquire() as _sc:
                if _smart_cmd == "narx_tavsiya":
                    _tv_nom = narx_tovar_ajrat(matn)
                    if _tv_nom:
                        _nd = await narx_tavsiya(_sc, uid, _tv_nom)
                        await update.message.reply_text(
                            narx_tavsiya_matn(_nd), parse_mode=ParseMode.MARKDOWN)
                        return
                elif _smart_cmd == "klient_reyting":
                    _rd = await klient_reyting(_sc, uid)
                    await update.message.reply_text(
                        klient_reyting_matn(_rd), parse_mode=ParseMode.MARKDOWN)
                    return
                elif _smart_cmd == "haftalik_trend":
                    _td = await haftalik_trend(_sc, uid)
                    await update.message.reply_text(
                        haftalik_trend_matn(_td), parse_mode=ParseMode.MARKDOWN)
                    return
                elif _smart_cmd == "inventarizatsiya":
                    # Inventarizatsiya — AI ga yuborib, tovarlar ro'yxati olish
                    from shared.services.smart_bot_engine import inventarizatsiya, inventarizatsiya_matn
                    # Matndan tovarlarni ajratish: "Ariel 45, Tide 23"
                    import re as _re
                    _inv_pairs = _re.findall(r'([A-Za-zА-Яа-яЎўҚқҒғҲҳ\'\-]+)\s+(\d+)', matn)
                    if _inv_pairs:
                        _inv_list = [{"nomi": n.strip(), "qoldiq": int(q)} for n, q in _inv_pairs]
                        _inv_r = await inventarizatsiya(_sc, uid, _inv_list)
                        await update.message.reply_text(
                            inventarizatsiya_matn(_inv_r), parse_mode=ParseMode.MARKDOWN)
                        return
                    else:
                        await update.message.reply_text(
                            "📋 *INVENTARIZATSIYA*\n\n"
                            "Tovar va qoldiqni ayting:\n"
                            "_\"Ariel 45, Tide 23, Fairy 12\"_\n\n"
                            "Yoki ovoz yuboring.",
                            parse_mode=ParseMode.MARKDOWN)
                        return
    except Exception as _se:
        log.debug("Smart buyruq: %s", _se)

    # ═══ 8. ADVANCED FEATURES — ABC, savol, shablon, qoldiq, zarar ═══
    try:
        # ── EKSPERT TAHLIL — "Ariel haqida", "Salimov tahlil" ──
        from shared.services.mutaxassis import (
            ekspert_sorov_bormi, ekspert_nom_ajrat,
            tovar_ekspert_tahlil, tovar_ekspert_matn,
            klient_ekspert_tahlil, klient_ekspert_matn,
        )
        if ekspert_sorov_bormi(matn):
            _nom = ekspert_nom_ajrat(matn)
            if _nom:
                log.info("🔬 Ekspert: '%s' izlash (uid=%d)", _nom, uid)
                
                # db.tovar_topish ISHLAYDI (sotuv saqlashda ishlatiladi)
                _tovar_row = await db.tovar_topish(uid, _nom)
                if _tovar_row:
                    log.info("🔬 Tovar topildi: %s (id=%s)", _tovar_row.get("nomi"), _tovar_row.get("id"))
                    async with db._P().acquire() as _ec:
                        _tv = await tovar_ekspert_tahlil(_ec, uid, _nom, tovar_row=_tovar_row)
                        try:
                            await update.message.reply_text(
                                tovar_ekspert_matn(_tv), parse_mode=ParseMode.MARKDOWN)
                        except Exception as _e:
                            log.debug("Xato: %s", _e)
                            await update.message.reply_text(
                                tovar_ekspert_matn(_tv).replace("*","").replace("_",""))
                    return
                
                # db.klient_topish ISHLAYDI
                _klient_row = await db.klient_topish(uid, _nom)
                if _klient_row:
                    log.info("🔬 Klient topildi: %s (id=%s)", _klient_row.get("ism"), _klient_row.get("id"))
                    async with db._P().acquire() as _ec:
                        _kl = await klient_ekspert_tahlil(_ec, uid, _nom, klient_row=_klient_row)
                        try:
                            await update.message.reply_text(
                                klient_ekspert_matn(_kl), parse_mode=ParseMode.MARKDOWN)
                        except Exception as _e:
                            log.debug("Xato: %s", _e)
                            await update.message.reply_text(
                                klient_ekspert_matn(_kl).replace("*","").replace("_",""))
                    return
                
                log.warning("🔬 Ekspert: '%s' topilmadi (uid=%d)", _nom, uid)
                await update.message.reply_text(f"🤔 '{_nom}' ni tovar yoki klient sifatida topolmadim.")
                return
    except Exception as _exp_e:
        log.debug("Ekspert: %s", _exp_e)

    try:
        from shared.services.advanced_features import (
            advanced_buyruq_aniqla, tabiiy_savol_javob,
            shablon_bormi, shablon_klient_ajrat, shablon_olish, shablon_matn,
            qoldiq_tuzatish_bormi, qoldiq_tuzatish_ajrat, qoldiq_tuzatish, qoldiq_tuzatish_matn,
            tovar_abc, tovar_abc_matn,
            tezkor_tugmalar, guruhli_bormi, guruhli_ajrat,
        )
        _adv_cmd = advanced_buyruq_aniqla(matn)
        if _adv_cmd:
            from shared.database.pool import get_pool
            async with db._P().acquire() as _ac:
                if _adv_cmd == "tabiiy_savol":
                    _javob = await tabiiy_savol_javob(_ac, uid, matn)
                    if _javob:
                        await update.message.reply_text(_javob, parse_mode=ParseMode.MARKDOWN)
                        return

                elif _adv_cmd == "abc_tahlil":
                    _abc = await tovar_abc(_ac, uid)
                    await update.message.reply_text(
                        tovar_abc_matn(_abc), parse_mode=ParseMode.MARKDOWN)
                    return

                elif _adv_cmd == "shablon":
                    _kl = shablon_klient_ajrat(matn)
                    if _kl:
                        _sh = await shablon_olish(_ac, uid, _kl)
                        if _sh:
                            # Shablonni savatga qo'yish uchun kutilayotgan ga saqlash
                            ctx.user_data["kutilayotgan"] = {
                                "amal": "chiqim", "klient": _kl,
                                "tovarlar": [
                                    {"nomi": t["nomi"], "miqdor": t["miqdor"],
                                     "birlik": t["birlik"], "narx": t["narx"],
                                     "jami": t["miqdor"] * t["narx"],
                                     "kategoriya": "Boshqa"}
                                    for t in _sh["tovarlar"]
                                ],
                                "jami_summa": sum(t["miqdor"] * t["narx"] for t in _sh["tovarlar"]),
                                "izoh": "shablon buyurtma",
                            }
                            await update.message.reply_text(
                                shablon_matn(_sh) + "\n\n⬇️ Tasdiqlaysizmi?",
                                parse_mode=ParseMode.MARKDOWN,
                                reply_markup=InlineKeyboardMarkup([
                                    [InlineKeyboardButton("✅ Tasdiqlash", callback_data="t:ha")],
                                    [InlineKeyboardButton("❌ Bekor", callback_data="t:yoq")],
                                ]))
                            return
                        else:
                            await update.message.reply_text(f"ℹ️ {_kl} uchun oldingi buyurtma topilmadi.")
                            return

                elif _adv_cmd == "qoldiq_tuzatish":
                    _qt = qoldiq_tuzatish_ajrat(matn)
                    if _qt:
                        _qr = await qoldiq_tuzatish(_ac, uid, _qt["nomi"], _qt["miqdor"], _qt["sabab"])
                        await update.message.reply_text(
                            qoldiq_tuzatish_matn(_qr), parse_mode=ParseMode.MARKDOWN)
                        return

                elif _adv_cmd == "guruhli":
                    from shared.services.advanced_features import guruhli_ajrat
                    _g = guruhli_ajrat(matn)
                    if _g and _g.get("soni") and _g.get("tovar_matn"):
                        await update.message.reply_text(
                            f"👥 *GURUHLI SOTUV*\n\n"
                            f"Klientlar soni: *{_g['soni']}*\n"
                            f"Tovarlar: _{_g['tovar_matn']}_\n\n"
                            "Klientlar ismlarini ayting yoki yozing:\n"
                            "_\"Salimov, Karimov, Toshmatov\"_",
                            parse_mode=ParseMode.MARKDOWN)
                        ctx.user_data["_guruhli"] = _g
                        return
    except Exception as _adv_e:
        log.debug("Advanced feature: %s", _adv_e)

    # ═══ O'ZBEK BUYRUQ TEKSHIRUVI (AI ga yubormasdan) ═══
    from shared.services.voice_commands import detect_voice_command, is_quick_command
    cmd = detect_voice_command(matn)
    if cmd and is_quick_command(matn):
        await _get_ovoz_buyruq_bajar()(update, ctx, cmd)
        return

    # Agar buyruq emas — AI ga yuborish
    from telegram.constants import ChatAction as _CA
    await update.message.chat.send_action(_CA.TYPING)
    await _get_qayta_ishlash()(update,ctx,matn)
