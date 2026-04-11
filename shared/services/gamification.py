"""
╔══════════════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — GAMIFICATION ENGINE (O'YIN MEXANIKASI)               ║
║                                                                          ║
║  Salesforce Trailhead / SAP Leaderboard analog:                          ║
║  Sotuvchilarni MOTIVATSIYA qilish — raqobat + mukofot                   ║
║                                                                          ║
║  TIZIM:                                                                  ║
║  ┌─────────────────────────────────────────────────────┐                ║
║  │  🏆 LEADERBOARD  │  🎖️ BADGES    │  🎯 CHALLENGES  │                ║
║  │  Haftalik reyting │  Yutuqlar      │  Kunlik vazifalar│                ║
║  │  Oylik reyting    │  Daraja tizimi │  Sprint maqsad   │                ║
║  │  Yillik champion  │  Streak bonus  │  Team challenge  │                ║
║  └─────────────────────────────────────────────────────┘                ║
║                                                                          ║
║  NATIJA (sanoat tajribasi):                                              ║
║  • Sotuv +23% (gamification qo'shilgandan keyin)                       ║
║  • Agent retention +40%                                                  ║
║  • Daily active users +65%                                               ║
╚══════════════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import List

log = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════
#  BADGE TIZIMI
# ════════════════════════════════════════════════════════════

BADGES = [
    # Sotuv badges
    {"id": "ilk_sotuv", "emoji": "🌟", "nomi": "Ilk sotuv", "shart": "birinchi_sotuv", "tavsif": "Birinchi sotuvni amalga oshirdi"},
    {"id": "10_sotuv", "emoji": "⭐", "nomi": "10 ta sotuv", "shart": "sotuv_soni>=10", "tavsif": "10 ta sotuv qildi"},
    {"id": "100_sotuv", "emoji": "🔥", "nomi": "100 ta sotuv", "shart": "sotuv_soni>=100", "tavsif": "100 ta sotuv qildi"},
    {"id": "1000_sotuv", "emoji": "💎", "nomi": "1000 sotuv", "shart": "sotuv_soni>=1000", "tavsif": "Mingta sotuv qildi!"},
    {"id": "million", "emoji": "🏆", "nomi": "Millioner", "shart": "jami_summa>=1000000", "tavsif": "1 million so'mlik sotuv"},
    {"id": "10_million", "emoji": "👑", "nomi": "10 Millioner", "shart": "jami_summa>=10000000", "tavsif": "10 million so'mlik sotuv"},

    # Klient badges
    {"id": "10_klient", "emoji": "👥", "nomi": "10 klient", "shart": "klient_soni>=10", "tavsif": "10 ta klient qo'shdi"},
    {"id": "50_klient", "emoji": "🌐", "nomi": "50 klient", "shart": "klient_soni>=50", "tavsif": "50 ta klient bilan ishlaydi"},

    # Streak badges
    {"id": "streak_7", "emoji": "🔥", "nomi": "7 kun streak", "shart": "streak>=7", "tavsif": "7 kun ketma-ket sotuv qildi"},
    {"id": "streak_30", "emoji": "⚡", "nomi": "30 kun streak", "shart": "streak>=30", "tavsif": "30 kun ketma-ket sotuv qildi"},

    # Maxsus
    {"id": "qarz_yiguvchi", "emoji": "💰", "nomi": "Qarz yig'uvchi", "shart": "qarz_yigildi>=10", "tavsif": "10+ marta qarz yig'di"},
    {"id": "erta_qush", "emoji": "🌅", "nomi": "Erta qush", "shart": "erta_sotuv>=20", "tavsif": "20+ marta soat 9 gacha sotuv qildi"},
    {"id": "kech_sher", "emoji": "🌙", "nomi": "Kech sher", "shart": "kech_sotuv>=10", "tavsif": "10+ marta soat 20 dan keyin sotuv"},
]

DARAJALAR = [
    {"daraja": 1, "nomi": "Yangi sotuvchi", "emoji": "🌱", "min_xp": 0},
    {"daraja": 2, "nomi": "Tajribali", "emoji": "⭐", "min_xp": 100},
    {"daraja": 3, "nomi": "Professional", "emoji": "🔥", "min_xp": 500},
    {"daraja": 4, "nomi": "Ekspert", "emoji": "💎", "min_xp": 2000},
    {"daraja": 5, "nomi": "Master", "emoji": "🏆", "min_xp": 5000},
    {"daraja": 6, "nomi": "Legend", "emoji": "👑", "min_xp": 15000},
]

GAMIFICATION_MIGRATION = """
CREATE TABLE IF NOT EXISTS gamification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    daraja INTEGER DEFAULT 1,
    streak_kun INTEGER DEFAULT 0,
    oxirgi_sotuv_sana DATE,
    eng_uzun_streak INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    yangilangan TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS leaderboard_tarix (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    davr VARCHAR(10) NOT NULL,  -- hafta/oy
    davr_boshi DATE NOT NULL,
    sotuv_soni INTEGER DEFAULT 0,
    sotuv_summa NUMERIC(18,2) DEFAULT 0,
    klient_soni INTEGER DEFAULT 0,
    xp_yigildi INTEGER DEFAULT 0,
    reyting INTEGER DEFAULT 0,
    yaratilgan TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leaderboard ON leaderboard_tarix(davr, davr_boshi DESC, sotuv_summa DESC);
"""


async def gamification_yangilash(conn, uid: int) -> dict:
    """Foydalanuvchining gamification statistikasini yangilash."""

    # Umumiy statistika
    stats = await conn.fetchrow("""
        SELECT
            COUNT(*) AS sotuv_soni,
            COALESCE(SUM(jami), 0) AS jami_summa,
            (SELECT COUNT(DISTINCT klient_id) FROM sotuv_sessiyalar WHERE user_id=$1) AS klient_soni,
            (SELECT COUNT(*) FROM sotuv_sessiyalar WHERE user_id=$1
             AND EXTRACT(HOUR FROM sana) < 9) AS erta_sotuv,
            (SELECT COUNT(*) FROM sotuv_sessiyalar WHERE user_id=$1
             AND EXTRACT(HOUR FROM sana) >= 20) AS kech_sotuv
        FROM sotuv_sessiyalar WHERE user_id=$1
    """, uid)

    # Streak hisoblash
    streak_rows = await conn.fetch("""
        SELECT DISTINCT sana::date AS kun FROM sotuv_sessiyalar
        WHERE user_id=$1 AND sana >= NOW() - INTERVAL '60 days'
        ORDER BY kun DESC
    """, uid)

    streak = 0
    bugun = date.today()
    for i, row in enumerate(streak_rows):
        kutilgan = bugun - timedelta(days=i)
        if row["kun"] == kutilgan:
            streak += 1
        else:
            break

    # XP hisoblash (sotuv=10, klient=50, streak=5/kun)
    xp = (int(stats["sotuv_soni"]) * 10 +
          int(stats["klient_soni"]) * 50 +
          streak * 5)

    # Daraja
    daraja = 1
    for d in DARAJALAR:
        if xp >= d["min_xp"]:
            daraja = d["daraja"]

    # Badges
    earned_badges = []
    for b in BADGES:
        shart = b["shart"]
        earned = False
        if "sotuv_soni>=" in shart:
            val = int(shart.split(">=")[1])
            earned = int(stats["sotuv_soni"]) >= val
        elif "jami_summa>=" in shart:
            val = int(shart.split(">=")[1])
            earned = float(stats["jami_summa"]) >= val
        elif "klient_soni>=" in shart:
            val = int(shart.split(">=")[1])
            earned = int(stats["klient_soni"]) >= val
        elif "streak>=" in shart:
            val = int(shart.split(">=")[1])
            earned = streak >= val
        elif "erta_sotuv>=" in shart:
            val = int(shart.split(">=")[1])
            earned = int(stats.get("erta_sotuv", 0)) >= val
        elif "kech_sotuv>=" in shart:
            val = int(shart.split(">=")[1])
            earned = int(stats.get("kech_sotuv", 0)) >= val
        elif shart == "birinchi_sotuv":
            earned = int(stats["sotuv_soni"]) > 0

        if earned:
            earned_badges.append(b["id"])

    # DB yangilash
    await conn.execute("""
        INSERT INTO gamification (user_id, xp, daraja, streak_kun, oxirgi_sotuv_sana, eng_uzun_streak, badges)
        VALUES ($1, $2, $3, $4, CURRENT_DATE, GREATEST($4, 0), $5)
        ON CONFLICT (user_id) DO UPDATE SET
            xp=$2, daraja=$3, streak_kun=$4,
            oxirgi_sotuv_sana=CURRENT_DATE,
            eng_uzun_streak=GREATEST(gamification.eng_uzun_streak, $4),
            badges=$5, yangilangan=NOW()
    """, uid, xp, daraja, streak, earned_badges)

    daraja_info = next((d for d in DARAJALAR if d["daraja"] == daraja), DARAJALAR[0])
    keyingi = next((d for d in DARAJALAR if d["daraja"] == daraja + 1), None)

    return {
        "xp": xp,
        "daraja": daraja,
        "daraja_nomi": daraja_info["nomi"],
        "daraja_emoji": daraja_info["emoji"],
        "keyingi_daraja": keyingi["nomi"] if keyingi else "MAX",
        "keyingi_xp": keyingi["min_xp"] - xp if keyingi else 0,
        "streak": streak,
        "badges": [b for b in BADGES if b["id"] in earned_badges],
        "badges_soni": len(earned_badges),
        "jami_badges": len(BADGES),
    }


async def leaderboard(conn, davr: str = "hafta", limit: int = 20) -> List[dict]:
    """Global leaderboard — barcha foydalanuvchilar reytingi."""
    if davr == "hafta":
        interval = "7 days"
    elif davr == "oy":
        interval = "30 days"
    else:
        interval = "7 days"

    rows = await conn.fetch(f"""
        SELECT
            u.id AS user_id,
            COALESCE(u.ism, u.username, 'User#' || u.id) AS nom,
            COUNT(s.id) AS sotuv_soni,
            COALESCE(SUM(s.jami), 0) AS jami_summa,
            COUNT(DISTINCT s.klient_id) AS klient_soni,
            COALESCE(g.daraja, 1) AS daraja,
            COALESCE(g.streak_kun, 0) AS streak
        FROM users u
        LEFT JOIN sotuv_sessiyalar s ON s.user_id=u.id AND s.sana >= NOW() - INTERVAL '{interval}'
        LEFT JOIN gamification g ON g.user_id=u.id
        GROUP BY u.id, u.ism, u.username, g.daraja, g.streak_kun
        HAVING COUNT(s.id) > 0
        ORDER BY COALESCE(SUM(s.jami), 0) DESC
        LIMIT $1
    """, limit)

    daraja_map = {d["daraja"]: d for d in DARAJALAR}
    return [{
        "reyting": i + 1,
        "user_id": r["user_id"],
        "nom": r["nom"],
        "sotuv_soni": r["sotuv_soni"],
        "jami_summa": str(r["jami_summa"]),
        "klient_soni": r["klient_soni"],
        "daraja": r["daraja"],
        "daraja_emoji": daraja_map.get(r["daraja"], {}).get("emoji", "🌱"),
        "streak": r["streak"],
        "medal": "🥇" if i == 0 else "🥈" if i == 1 else "🥉" if i == 2 else "",
    } for i, r in enumerate(rows)]
