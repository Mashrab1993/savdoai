"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.3.2 — TP SAMARADORLIK TAHLILI                      ║
║                                                                  ║
║  Reestr va Nakladnoy fayllaridan TP reyting:                    ║
║  • Qancha klientga yetkazdi                                    ║
║  • Qancha summa sotuv                                          ║
║  • O'rtacha chek                                                ║
║  • Qarzli klientlar soni va summasi                             ║
║  • Hudud bo'yicha sotuv                                         ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from collections import defaultdict
log = logging.getLogger(__name__)


def tp_tahlil_reestr(parsed: dict) -> dict:
    """Reestr ma'lumotlaridan TP tahlili."""
    tp_map = defaultdict(lambda: {
        "klient_soni": 0, "jami_summa": 0.0,
        "qarzli_soni": 0, "qarz_summa": 0.0,
        "hududlar": set(), "max_chek": 0.0,
    })

    for k in parsed.get("klientlar", []):
        tp = k.get("tp", "Nomalum")
        if not tp: tp = "Nomalum"
        t = tp_map[tp]
        t["klient_soni"] += 1
        t["jami_summa"] += k["summa"]
        t["max_chek"] = max(t["max_chek"], k["summa"])
        
        balans = k.get("balans", 0)
        if isinstance(balans, (int, float)) and balans < 0:
            t["qarzli_soni"] += 1
            t["qarz_summa"] += abs(balans)

    return dict(tp_map)


def tp_tahlil_nakladnoy(parsed: dict) -> dict:
    """Nakladnoy ma'lumotlaridan TP tahlili."""
    tp_map = defaultdict(lambda: {
        "klient_soni": 0, "jami_summa": 0.0,
        "nakladnoy_soni": 0, "tovar_pozitsiya": 0,
        "hududlar": set(),
    })

    for inv in parsed.get("nakladnoylar", []):
        tp = inv.get("tp", "Nomalum")
        if not tp: tp = "Nomalum"
        t = tp_map[tp]
        t["klient_soni"] += 1
        t["nakladnoy_soni"] += 1
        t["jami_summa"] += inv["jami"]
        t["tovar_pozitsiya"] += inv["soni"]
        if inv.get("hudud"):
            t["hududlar"].add(inv["hudud"])

    return dict(tp_map)


def tp_reyting_matn(tp_data: dict, manba: str = "reestr") -> str:
    """Bot uchun TP reyting matni."""
    if not tp_data:
        return "👤 TP ma'lumoti topilmadi."

    m = "👥 *TP SAMARADORLIK REYTINGI*\n━━━━━━━━━━━━━━━━━━━━━\n\n"

    # Sort by jami_summa
    sorted_tp = sorted(tp_data.items(), key=lambda x: -x[1]["jami_summa"])

    for rank, (tp, d) in enumerate(sorted_tp, 1):
        medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else f"{rank}."
        ortacha = d["jami_summa"] / max(d["klient_soni"], 1)

        m += f"{medal} *{tp}*\n"
        m += f"  👥 {d['klient_soni']} klient"
        m += f" | 💰 {d['jami_summa']:,.0f}\n"
        m += f"  📊 O'rtacha: {ortacha:,.0f} so'm/klient\n"

        if d.get("qarzli_soni", 0) > 0:
            m += f"  ⚠️ Qarzli: {d['qarzli_soni']} ta ({d['qarz_summa']:,.0f})\n"
        if d.get("nakladnoy_soni", 0) > 0:
            m += f"  📋 {d['nakladnoy_soni']} nakladnoy, {d.get('tovar_pozitsiya',0)} pozitsiya\n"

        m += "\n"

    # Jami
    jami = sum(d["jami_summa"] for d in tp_data.values())
    jami_k = sum(d["klient_soni"] for d in tp_data.values())
    m += f"📊 *JAMI: {len(tp_data)} TP | {jami_k:,} klient | {jami:,.0f} so'm*"

    if len(m) > 4000:
        m = m[:3950] + "\n_...qisqartirildi_"
    return m
