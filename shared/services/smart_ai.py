"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — SMART AI ASSISTANT                                ║
║  Foydalanuvchi bazasidan har qanday savolga javob            ║
║                                                              ║
║  "Salimovning qarzi qancha?" → bazadan tekshirib javob       ║
║  "Omborda Ariel bormi?" → tovarlar jadvalini tekshiradi      ║
║  "Bu hafta eng ko'p sotilgan?" → sotuv statistikasi          ║
║                                                              ║
║  Xavfsizlik: faqat SELECT, faqat user_id filtrlangan         ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
import os

log = logging.getLogger("savdoai.smart_ai")


async def biznes_snapshot(uid: int) -> str:
    """Foydalanuvchining barcha biznes ma'lumotlarini yig'ib matn qilish.
    AI shu matn asosida javob beradi — SQL injection xavfi 0.
    """
    from shared.database.pool import get_pool
    lines = []

    try:
        async with get_pool().acquire() as c:
            # 1. OMBOR — tovarlar
            tovarlar = await c.fetch(
                "SELECT nomi, qoldiq, sotish_narxi, olish_narxi, birlik, min_qoldiq, shtrix_kod "
                "FROM tovarlar WHERE user_id=$1 AND faol=TRUE "
                "ORDER BY qoldiq DESC LIMIT 100", uid)
            lines.append(f"═══ OMBOR ({len(tovarlar)} ta tovar) ═══")
            for t in tovarlar:
                narx = f"sotish={t['sotish_narxi']:,.0f}" if t['sotish_narxi'] else ""
                olish = f"olish={t['olish_narxi']:,.0f}" if t['olish_narxi'] else ""
                kam = " ⚠️KAM" if t['min_qoldiq'] and t['qoldiq'] < t['min_qoldiq'] else ""
                lines.append(f"  {t['nomi']}: qoldiq={t['qoldiq']} {t['birlik'] or ''} {narx} {olish}{kam}")
            lines.append("")

            # 2. KLIENTLAR
            klientlar = await c.fetch(
                "SELECT id, ism, telefon, manzil FROM klientlar "
                "WHERE user_id=$1 ORDER BY ism LIMIT 100", uid)
            lines.append(f"═══ KLIENTLAR ({len(klientlar)} ta) ═══")
            for k in klientlar:
                tel = f" tel={k['telefon']}" if k['telefon'] else ""
                lines.append(f"  {k['ism']}{tel}")
            lines.append("")

            # 3. QARZLAR (ochiq)
            qarzlar = await c.fetch(
                "SELECT klient_ismi, summa, tolangan, qolgan, muddat, sana "
                "FROM qarzlar WHERE user_id=$1 AND yopildi=FALSE "
                "ORDER BY qolgan DESC LIMIT 50", uid)
            jami_qarz = sum(q['qolgan'] for q in qarzlar)
            lines.append(f"═══ OCHIQ QARZLAR ({len(qarzlar)} ta, jami={jami_qarz:,.0f}) ═══")
            for q in qarzlar:
                muddat_str = f" muddat={q['muddat']}" if q['muddat'] else ""
                lines.append(f"  {q['klient_ismi']}: qarz={q['summa']:,.0f} tolagan={q['tolangan']:,.0f} qolgan={q['qolgan']:,.0f}{muddat_str}")
            lines.append("")

            # 4. BUGUNGI SOTUV
            from datetime import datetime, timedelta
            import pytz
            tz = pytz.timezone("Asia/Tashkent")
            bugun = datetime.now(tz).replace(hour=0, minute=0, second=0, microsecond=0)
            sotuvlar = await c.fetch(
                "SELECT ss.id, ss.klient_ismi, ss.jami, ss.qarz, ss.sana, "
                "ss.tolov_usuli, ss.izoh "
                "FROM sotuv_sessiyalar ss WHERE ss.user_id=$1 AND ss.sana>=$2 "
                "ORDER BY ss.sana DESC LIMIT 50", uid, bugun)
            jami_sotuv = sum(s['jami'] for s in sotuvlar)
            lines.append(f"═══ BUGUNGI SOTUV ({len(sotuvlar)} ta, jami={jami_sotuv:,.0f}) ═══")
            for s in sotuvlar:
                qarz_str = f" qarz={s['qarz']:,.0f}" if s['qarz'] else ""
                lines.append(f"  {s['klient_ismi'] or '?'}: {s['jami']:,.0f}{qarz_str} ({s['tolov_usuli'] or 'naqd'})")
            lines.append("")

            # 5. KECHAGI SOTUV
            kecha = bugun - timedelta(days=1)
            kecha_sotuvlar = await c.fetch(
                "SELECT ss.klient_ismi, ss.jami, ss.qarz "
                "FROM sotuv_sessiyalar ss WHERE ss.user_id=$1 AND ss.sana>=$2 AND ss.sana<$3 "
                "ORDER BY ss.jami DESC LIMIT 30", uid, kecha, bugun)
            kecha_jami = sum(s['jami'] for s in kecha_sotuvlar)
            lines.append(f"═══ KECHAGI SOTUV ({len(kecha_sotuvlar)} ta, jami={kecha_jami:,.0f}) ═══")
            for s in kecha_sotuvlar[:10]:
                lines.append(f"  {s['klient_ismi'] or '?'}: {s['jami']:,.0f}")
            lines.append("")

            # 6. SHU HAFTA SOTUV
            hafta_boshi = bugun - timedelta(days=bugun.weekday())
            hafta_sotuv = await c.fetchrow(
                "SELECT COUNT(*) as soni, COALESCE(SUM(jami),0) as jami, "
                "COALESCE(SUM(qarz),0) as qarz "
                "FROM sotuv_sessiyalar WHERE user_id=$1 AND sana>=$2", uid, hafta_boshi)
            lines.append("═══ SHU HAFTA ═══")
            lines.append(f"  Sotuv: {hafta_sotuv['soni']} ta, jami={float(hafta_sotuv['jami']):,.0f}, qarz={float(hafta_sotuv['qarz']):,.0f}")
            lines.append("")

            # 7. SHU OY SOTUV
            oy_boshi = bugun.replace(day=1)
            oy_sotuv = await c.fetchrow(
                "SELECT COUNT(*) as soni, COALESCE(SUM(jami),0) as jami, "
                "COALESCE(SUM(qarz),0) as qarz "
                "FROM sotuv_sessiyalar WHERE user_id=$1 AND sana>=$2", uid, oy_boshi)
            lines.append("═══ SHU OY ═══")
            lines.append(f"  Sotuv: {oy_sotuv['soni']} ta, jami={float(oy_sotuv['jami']):,.0f}, qarz={float(oy_sotuv['qarz']):,.0f}")
            lines.append("")

            # 8. TOP TOVARLAR (shu oy)
            top_tovarlar = await c.fetch(
                "SELECT ch.tovar_nomi, SUM(ch.miqdor) as jami_miqdor, "
                "SUM(ch.miqdor * ch.sotish_narxi) as jami_summa "
                "FROM chiqimlar ch JOIN sotuv_sessiyalar ss ON ss.id=ch.sessiya_id "
                "WHERE ch.user_id=$1 AND ss.sana>=$2 "
                "GROUP BY ch.tovar_nomi ORDER BY jami_summa DESC LIMIT 15", uid, oy_boshi)
            lines.append("═══ TOP TOVARLAR (shu oy) ═══")
            for t in top_tovarlar:
                lines.append(f"  {t['tovar_nomi']}: {float(t['jami_miqdor']):,.0f} dona, {float(t['jami_summa']):,.0f} so'm")
            lines.append("")

            # 9. TOP KLIENTLAR (shu oy)
            top_klientlar = await c.fetch(
                "SELECT klient_ismi, COUNT(*) as soni, SUM(jami) as jami "
                "FROM sotuv_sessiyalar WHERE user_id=$1 AND sana>=$2 AND klient_ismi IS NOT NULL "
                "GROUP BY klient_ismi ORDER BY jami DESC LIMIT 15", uid, oy_boshi)
            lines.append("═══ TOP KLIENTLAR (shu oy) ═══")
            for k in top_klientlar:
                lines.append(f"  {k['klient_ismi']}: {k['soni']} ta sotuv, {float(k['jami']):,.0f} so'm")
            lines.append("")

            # 10. FOYDA (shu oy)
            foyda = await c.fetchval(
                "SELECT COALESCE(SUM((ch.sotish_narxi - ch.olish_narxi) * ch.miqdor), 0) "
                "FROM chiqimlar ch JOIN sotuv_sessiyalar ss ON ss.id=ch.sessiya_id "
                "WHERE ch.user_id=$1 AND ss.sana>=$2", uid, oy_boshi) or 0
            lines.append(f"═══ FOYDA (shu oy): {float(foyda):,.0f} so'm ═══")

    except Exception as e:
        log.error("biznes_snapshot: %s", e, exc_info=True)
        lines.append(f"XATO: {e}")

    return "\n".join(lines)


async def smart_javob(uid: int, savol: str) -> str:
    """Foydalanuvchi savoliga bazadan ma'lumot olib AI orqali javob berish."""

    snapshot = await biznes_snapshot(uid)

    system = """Sen SavdoAI — savdogar uchun aqlli yordamchi. Senda foydalanuvchining HAQIQIY biznes ma'lumotlari bor (ombor, klientlar, qarzlar, sotuvlar).

QOIDALAR:
1. Faqat berilgan ma'lumotlar asosida javob ber — o'ylab topma
2. Raqamlarni 1,000,000 formatda yoz
3. Qisqa va aniq javob ber
4. Jadval formatda ber (| ustun | ustun |)
5. Agar ma'lumot topilmasa — "ma'lumot topilmadi" de
6. O'zbek tilida javob ber
7. Foydalanuvchiga maslahat ham ber (agar kerak bo'lsa)
8. "⚠️KAM" belgisi — tovar tugayapti, buyurtma berish kerak

TUSHUNISH:
- qoldiq = omborda qancha bor
- qolgan = qarz qoldig'i
- jami = savdo summasi
- foyda = sotish_narx - olish_narx
- muddat = qarz to'lash muddati"""

    messages = [
        {"role": "user", "content": f"Mening biznes ma'lumotlarim:\n\n{snapshot}"},
        {"role": "assistant", "content": "Barcha ma'lumotlarni ko'ryapman. Savol bering."},
        {"role": "user", "content": savol}
    ]

    # Gemini (tez)
    answer = await _ask_gemini(system, messages)
    if not answer:
        answer = await _ask_claude(system, messages)
    if not answer:
        answer = "❌ AI javob bera olmadi."
    return answer


async def _ask_gemini(system: str, messages: list) -> str | None:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        contents = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            contents.append(genai.types.Content(role=role, parts=[genai.types.Part(text=m["content"])]))
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=contents,
            config=genai.types.GenerateContentConfig(
                system_instruction=system, temperature=0.1, max_output_tokens=2048),
        )
        return response.text if response.text else None
    except Exception as e:
        log.warning("Smart AI Gemini: %s", e)
        return None


async def _ask_claude(system: str, messages: list) -> str | None:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=api_key)
        response = await client.messages.create(
            model="claude-sonnet-4-20250514", max_tokens=2048,
            system=system, messages=messages)
        return response.content[0].text if response.content else None
    except Exception as e:
        log.warning("Smart AI Claude: %s", e)
        return None
