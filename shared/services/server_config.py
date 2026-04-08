"""
╔══════════════════════════════════════════════════════════════════╗
║  SAVDOAI v25.4.0 — SERVER KONFIGURATSIYA TIZIMI                 ║
║                                                                  ║
║  SD Agent tahlilidan ilhomlangan:                                ║
║  • 23 ta server-controlled config moduli                        ║
║  • Har bir foydalanuvchi uchun alohida sozlamalar                ║
║  • Admin paneldan masofadan boshqarish                          ║
║  • Real-time config yangilash (WebSocket)                       ║
║                                                                  ║
║  Foydalanish:                                                    ║
║    config = await config_yukla(conn, uid)                       ║
║    if config.buyurtma.foto_majburiy: ...                        ║
║    if config.klient.manzil_majburiy: ...                        ║
╚══════════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
from dataclasses import dataclass, field, asdict
from decimal import Decimal
from typing import Optional, List, Any
from datetime import datetime

log = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════
#  KONFIGURATSIYA MODELLARI (SD Agent ConfigResponse analog)
# ════════════════════════════════════════════════════════════

@dataclass
class KlientConfig:
    """Klient formasi sozlamalari — qaysi fieldlar ko'rinadi/majburiy."""
    nom_majburiy: bool = True
    firma_nomi_faol: bool = True
    firma_nomi_majburiy: bool = False
    telefon_majburiy: bool = True
    manzil_faol: bool = True
    manzil_majburiy: bool = False
    orientir_faol: bool = True
    orientir_majburiy: bool = False
    lokatsiya_faol: bool = True
    lokatsiya_majburiy: bool = False
    kontakt_shaxs_faol: bool = True
    kontakt_shaxs_majburiy: bool = False
    inn_faol: bool = False
    inn_majburiy: bool = False
    bank_faol: bool = False
    bank_majburiy: bool = False
    mfo_faol: bool = False
    mfo_majburiy: bool = False
    hisob_raqam_faol: bool = False
    hisob_raqam_majburiy: bool = False
    shartnoma_faol: bool = False
    shartnoma_majburiy: bool = False
    kategoriya_faol: bool = True
    kategoriya_majburiy: bool = False
    foto_faol: bool = True
    foto_majburiy: bool = False
    izoh_faol: bool = True
    izoh_majburiy: bool = False
    tashrif_kunlari_faol: bool = False
    tashrif_kunlari_majburiy: bool = False


@dataclass
class BuyurtmaConfig:
    """Buyurtma yaratish sozlamalari — SD Agent OrderConfigResponse analog."""
    checkin_majburiy: bool = False
    foto_majburiy: bool = False
    qaytarish_foto_majburiy: bool = False
    qoldiq_kiritish_majburiy: bool = False
    sana_yuklash: bool = False
    min_summa: Decimal = Decimal("0")
    almashtirishga_ruxsat: bool = True
    qaytarishga_ruxsat: bool = True
    ketma_ketlik_majburiy: bool = False
    sync_keyin_izoh_tahrirlash: bool = False
    yaroqlilik_muddati_korsatish: bool = False
    bonussiz_tanlashga_ruxsat: bool = True
    lokatsiyani_tekshirish: bool = False
    nasiyaga_ruxsat: bool = True
    nasiya_max_kun: int = 30
    max_nasiya_summa: Decimal = Decimal("0")  # 0 = cheksiz
    qarz_cheki: bool = True  # qarzli klientga buyurtma berishda ogohlantirish
    zarar_cheki: bool = True  # tannarxdan past narxda sotishda ogohlantirish


@dataclass
class GpsConfig:
    """GPS va lokatsiya sozlamalari — Smartup GPS tracking analog."""
    gps_yoqilgan: bool = False
    tracking_interval_daqiqa: int = 15
    min_aniqlik_metr: int = 100
    min_masofa_metr: int = 50
    ish_vaqti_boshlanishi: str = "09:00"
    ish_vaqti_tugashi: str = "18:00"
    ish_kunlari: List[int] = field(default_factory=lambda: [1, 2, 3, 4, 5])  # Du-Ju
    batareya_holati_yuborish: bool = False
    fon_tracking: bool = False


@dataclass
class PrinterConfig:
    """Chop etish sozlamalari."""
    printer_yoqilgan: bool = True
    printer_kengligi: int = 80  # 80mm yoki 58mm
    logo_korsatish: bool = True
    qr_kod_korsatish: bool = True
    chegirma_korsatish: bool = True
    klient_balans_korsatish: bool = False
    tolov_turi_korsatish: bool = True
    shrift_hajmi: str = "normal"  # small, normal, large


@dataclass
class FotoConfig:
    """Foto hisobot sozlamalari."""
    foto_hisobot_yoqilgan: bool = False
    max_foto_soni: int = 5
    min_foto_sifati: int = 70  # JPEG quality %
    kategoriyalar: List[str] = field(default_factory=list)
    gps_majburiy: bool = False


@dataclass
class OmborConfig:
    """Ombor va qoldiq sozlamalari."""
    multi_ombor: bool = False
    ombor_royhati: List[dict] = field(default_factory=list)
    manfiy_qoldiqqa_ruxsat: bool = False
    qoldiq_ogohlantirish_chegarasi: int = 5
    barcode_scan_yoqilgan: bool = True
    tara_boshqaruvi: bool = False


@dataclass
class AksiyaConfig:
    """Aksiya va chegirma sozlamalari."""
    aksiya_yoqilgan: bool = False
    manual_chegirma_ruxsat: bool = True
    max_chegirma_foiz: Decimal = Decimal("50")
    server_hisoblash: bool = False  # True = serverda hisoblash
    bonus_tizimi: bool = False


@dataclass
class SyncConfig:
    """Sinxronizatsiya sozlamalari."""
    auto_sync_interval_daqiqa: int = 30
    sync_log_yoqilgan: bool = True
    sync_log_saqlash_kun: int = 30
    offline_queue_max: int = 100
    batch_size: int = 50


@dataclass
class NotifikatsiyaConfig:
    """Bildirishnoma sozlamalari."""
    kunlik_hisobot: bool = True
    kunlik_hisobot_vaqti: str = "20:00"
    qarz_eslatma: bool = True
    qarz_eslatma_kunlari: List[int] = field(default_factory=lambda: [1, 7, 14, 30])
    kam_qoldiq_ogohlantirish: bool = True
    yangi_buyurtma_bildirishnoma: bool = True


@dataclass
class UmumiyConfig:
    """Umumiy ilovа sozlamalari."""
    valyuta_belgisi: str = "so'm"
    raqam_aniqligi: int = 2  # decimal places
    vaqt_mintaqasi: str = "Asia/Tashkent"
    til: str = "uz"
    mavzu: str = "light"  # light/dark
    yandex_map_kalit: str = ""


@dataclass
class ServerConfig:
    """To'liq server konfiguratsiyasi — barcha modullar birlashgan."""
    klient: KlientConfig = field(default_factory=KlientConfig)
    buyurtma: BuyurtmaConfig = field(default_factory=BuyurtmaConfig)
    gps: GpsConfig = field(default_factory=GpsConfig)
    printer: PrinterConfig = field(default_factory=PrinterConfig)
    foto: FotoConfig = field(default_factory=FotoConfig)
    ombor: OmborConfig = field(default_factory=OmborConfig)
    aksiya: AksiyaConfig = field(default_factory=AksiyaConfig)
    sync: SyncConfig = field(default_factory=SyncConfig)
    notifikatsiya: NotifikatsiyaConfig = field(default_factory=NotifikatsiyaConfig)
    umumiy: UmumiyConfig = field(default_factory=UmumiyConfig)
    yangilangan: Optional[str] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        for k, v in d.items():
            if isinstance(v, dict):
                for k2, v2 in v.items():
                    if isinstance(v2, Decimal):
                        d[k][k2] = str(v2)
        return d


# ════════════════════════════════════════════════════════════
#  DB SCHEMA (PostgreSQL migration)
# ════════════════════════════════════════════════════════════

CONFIG_MIGRATION_SQL = """
-- Server konfiguratsiya jadvali
CREATE TABLE IF NOT EXISTS server_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    modul VARCHAR(50) NOT NULL,  -- klient, buyurtma, gps, printer, foto, ombor, aksiya, sync, notifikatsiya, umumiy
    sozlamalar JSONB NOT NULL DEFAULT '{}',
    yangilangan TIMESTAMPTZ DEFAULT NOW(),
    yaratilgan TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, modul)
);

CREATE INDEX IF NOT EXISTS idx_server_config_user ON server_config(user_id);
CREATE INDEX IF NOT EXISTS idx_server_config_modul ON server_config(user_id, modul);

-- Config o'zgarish tarixi
CREATE TABLE IF NOT EXISTS config_tarix (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    modul VARCHAR(50) NOT NULL,
    eski_qiymat JSONB,
    yangi_qiymat JSONB NOT NULL,
    ozgartiruvchi VARCHAR(100) DEFAULT 'system',
    vaqt TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_tarix_user ON config_tarix(user_id, vaqt DESC);

-- Sync log jadvali (Smartup AutoSyncLogTable analog — 19 field)
CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    sync_turi VARCHAR(20) NOT NULL DEFAULT 'manual',  -- manual/auto/webhook
    boshlangan TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tugagan TIMESTAMPTZ,
    yuborilgan_bayt BIGINT DEFAULT 0,
    qabul_qilingan_bayt BIGINT DEFAULT 0,
    entity_soni INTEGER DEFAULT 0,
    status_kod INTEGER DEFAULT 200,
    tarmoq_turi VARCHAR(20),  -- wifi/mobile/offline
    batareya_foiz INTEGER,
    xato_xabar TEXT,
    stacktrace TEXT,
    vaqt_mintaqasi VARCHAR(50),
    sync_davomiyligi_ms INTEGER,
    server_javob_vaqti_ms INTEGER,
    muvaffaqiyatli BOOLEAN DEFAULT TRUE,
    ip_manzil VARCHAR(45),
    qurilma_info TEXT,
    CONSTRAINT sync_log_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sync_log_user_vaqt ON sync_log(user_id, boshlangan DESC);
"""


# ════════════════════════════════════════════════════════════
#  CONFIG CRUD OPERATSIYALARI
# ════════════════════════════════════════════════════════════

_MODUL_MAP = {
    "klient": KlientConfig,
    "buyurtma": BuyurtmaConfig,
    "gps": GpsConfig,
    "printer": PrinterConfig,
    "foto": FotoConfig,
    "ombor": OmborConfig,
    "aksiya": AksiyaConfig,
    "sync": SyncConfig,
    "notifikatsiya": NotifikatsiyaConfig,
    "umumiy": UmumiyConfig,
}


def _json_to_dataclass(modul: str, data: dict) -> Any:
    """JSON dict ni mos dataclass ga aylantirish."""
    cls = _MODUL_MAP.get(modul)
    if not cls:
        return data
    fields = {f.name for f in cls.__dataclass_fields__.values()}
    filtered = {k: v for k, v in data.items() if k in fields}
    # Decimal konvertatsiya
    for k, v in filtered.items():
        if isinstance(v, str):
            try:
                filtered[k] = Decimal(v)
            except Exception:
                pass
    return cls(**filtered)


async def config_yukla(conn, uid: int) -> ServerConfig:
    """Foydalanuvchi uchun to'liq konfiguratsiyani yuklash.

    Agar konfiguratsiya bazada yo'q bo'lsa, default qiymatlar qaytariladi.
    SD Agent'dagi config/?u=agent endpointining analogi.

    Args:
        conn: asyncpg connection (RLS context o'rnatilgan)
        uid: foydalanuvchi ID

    Returns:
        ServerConfig dataclass — barcha modullar bilan
    """
    rows = await conn.fetch(
        "SELECT modul, sozlamalar, yangilangan "
        "FROM server_config WHERE user_id = $1",
        uid,
    )

    config = ServerConfig()
    max_yangilangan = None

    for row in rows:
        modul = row["modul"]
        data = json.loads(row["sozlamalar"]) if isinstance(row["sozlamalar"], str) else row["sozlamalar"]

        dc = _json_to_dataclass(modul, data)
        if hasattr(config, modul):
            setattr(config, modul, dc)

        ts = row["yangilangan"]
        if ts and (max_yangilangan is None or ts > max_yangilangan):
            max_yangilangan = ts

    config.yangilangan = max_yangilangan.isoformat() if max_yangilangan else None
    return config


async def config_saqlash(conn, uid: int, modul: str, sozlamalar: dict,
                          ozgartiruvchi: str = "admin") -> dict:
    """Muayyan modul konfiguratsiyasini saqlash.

    Args:
        conn: asyncpg connection
        uid: foydalanuvchi ID
        modul: config modul nomi (klient, buyurtma, gps, ...)
        sozlamalar: yangi sozlamalar dict
        ozgartiruvchi: kim o'zgartirdi

    Returns:
        {"muvaffaqiyat": True, "modul": modul}
    """
    if modul not in _MODUL_MAP:
        raise ValueError(f"Noto'g'ri modul: {modul}. Mumkin: {list(_MODUL_MAP.keys())}")

    # Validatsiya — faqat mavjud fieldlarni qabul qilish
    cls = _MODUL_MAP[modul]
    fields = {f.name for f in cls.__dataclass_fields__.values()}
    valid_data = {k: v for k, v in sozlamalar.items() if k in fields}

    # Eski qiymatni olish (tarix uchun)
    eski = await conn.fetchval(
        "SELECT sozlamalar FROM server_config WHERE user_id=$1 AND modul=$2",
        uid, modul,
    )

    # Upsert
    json_str = json.dumps(valid_data, default=str, ensure_ascii=False)
    await conn.execute("""
        INSERT INTO server_config (user_id, modul, sozlamalar, yangilangan)
        VALUES ($1, $2, $3::jsonb, NOW())
        ON CONFLICT (user_id, modul)
        DO UPDATE SET sozlamalar = $3::jsonb, yangilangan = NOW()
    """, uid, modul, json_str)

    # Tarixga yozish
    await conn.execute("""
        INSERT INTO config_tarix (user_id, modul, eski_qiymat, yangi_qiymat, ozgartiruvchi)
        VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)
    """, uid, modul,
        json.dumps(json.loads(eski) if eski else {}, default=str),
        json_str, ozgartiruvchi)

    log.info("Config saqlandi: user=%s modul=%s by=%s", uid, modul, ozgartiruvchi)
    return {"muvaffaqiyat": True, "modul": modul}


async def config_modullari(conn, uid: int) -> List[dict]:
    """Barcha mavjud config modullarini ro'yxatini olish."""
    rows = await conn.fetch(
        "SELECT modul, yangilangan FROM server_config WHERE user_id=$1 ORDER BY modul",
        uid,
    )
    natija = []
    for modul_nomi, cls in _MODUL_MAP.items():
        existing = next((r for r in rows if r["modul"] == modul_nomi), None)
        natija.append({
            "modul": modul_nomi,
            "mavjud": existing is not None,
            "yangilangan": existing["yangilangan"].isoformat() if existing else None,
            "fieldlar_soni": len(cls.__dataclass_fields__),
        })
    return natija


async def config_tarix(conn, uid: int, modul: Optional[str] = None,
                        limit: int = 20) -> List[dict]:
    """Config o'zgarishlar tarixini olish."""
    if modul:
        rows = await conn.fetch(
            "SELECT * FROM config_tarix WHERE user_id=$1 AND modul=$2 "
            "ORDER BY vaqt DESC LIMIT $3",
            uid, modul, limit,
        )
    else:
        rows = await conn.fetch(
            "SELECT * FROM config_tarix WHERE user_id=$1 "
            "ORDER BY vaqt DESC LIMIT $2",
            uid, limit,
        )
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════
#  SYNC LOG OPERATSIYALARI (Smartup AutoSyncLogTable analog)
# ════════════════════════════════════════════════════════════

async def sync_log_yoz(conn, uid: int, **kwargs) -> int:
    """Sync logini yozish. Smartup'ning 19 fieldli AutoSyncLogTable analogi.

    Returns:
        Yaratilgan log ID
    """
    return await conn.fetchval("""
        INSERT INTO sync_log (
            user_id, sync_turi, boshlangan, tugagan,
            yuborilgan_bayt, qabul_qilingan_bayt, entity_soni,
            status_kod, tarmoq_turi, batareya_foiz,
            xato_xabar, stacktrace, vaqt_mintaqasi,
            sync_davomiyligi_ms, server_javob_vaqti_ms,
            muvaffaqiyatli, ip_manzil, qurilma_info
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING id
    """,
        uid,
        kwargs.get("sync_turi", "manual"),
        kwargs.get("boshlangan", datetime.utcnow()),
        kwargs.get("tugagan"),
        kwargs.get("yuborilgan_bayt", 0),
        kwargs.get("qabul_qilingan_bayt", 0),
        kwargs.get("entity_soni", 0),
        kwargs.get("status_kod", 200),
        kwargs.get("tarmoq_turi"),
        kwargs.get("batareya_foiz"),
        kwargs.get("xato_xabar"),
        kwargs.get("stacktrace"),
        kwargs.get("vaqt_mintaqasi", "Asia/Tashkent"),
        kwargs.get("sync_davomiyligi_ms"),
        kwargs.get("server_javob_vaqti_ms"),
        kwargs.get("muvaffaqiyatli", True),
        kwargs.get("ip_manzil"),
        kwargs.get("qurilma_info"),
    )


async def sync_loglar(conn, uid: int, limit: int = 50) -> List[dict]:
    """So'nggi sync loglarini olish."""
    rows = await conn.fetch(
        "SELECT * FROM sync_log WHERE user_id=$1 ORDER BY boshlangan DESC LIMIT $2",
        uid, limit,
    )
    return [dict(r) for r in rows]


# ════════════════════════════════════════════════════════════
#  CONFIG FIELDLARINI TEKSHIRISH (klient formasi validatsiyasi)
# ════════════════════════════════════════════════════════════

async def klient_field_tekshir(conn, uid: int, klient_data: dict) -> dict:
    """Klient ma'lumotlarini server config asosida validatsiya qilish.

    SD Agent'dagi ClientRequiredFieldsResponse analogi.

    Returns:
        {"valid": True/False, "xatolar": [...]}
    """
    config = await config_yukla(conn, uid)
    kc = config.klient
    xatolar = []

    field_map = {
        "nom": (kc.nom_majburiy, "nom"),
        "firma_nomi": (kc.firma_nomi_majburiy, "firma_nomi"),
        "telefon": (kc.telefon_majburiy, "telefon"),
        "manzil": (kc.manzil_majburiy, "manzil"),
        "orientir": (kc.orientir_majburiy, "orientir"),
        "kontakt_shaxs": (kc.kontakt_shaxs_majburiy, "kontakt_shaxs"),
        "inn": (kc.inn_majburiy, "inn"),
        "bank": (kc.bank_majburiy, "bank"),
        "mfo": (kc.mfo_majburiy, "mfo"),
        "hisob_raqam": (kc.hisob_raqam_majburiy, "hisob_raqam"),
        "shartnoma": (kc.shartnoma_majburiy, "shartnoma"),
        "kategoriya": (kc.kategoriya_majburiy, "kategoriya"),
    }

    for field_name, (majburiy, key) in field_map.items():
        if majburiy and not klient_data.get(key, "").strip():
            xatolar.append(f"{field_name} majburiy")

    return {"valid": len(xatolar) == 0, "xatolar": xatolar}


async def buyurtma_tekshir(conn, uid: int, buyurtma_data: dict) -> dict:
    """Buyurtma ma'lumotlarini server config asosida validatsiya qilish.

    SD Agent'dagi OrderConfigResponse analogi — 16 ta flag tekshiruvi.

    Returns:
        {"valid": True/False, "xatolar": [...], "ogohlantirishlar": [...]}
    """
    config = await config_yukla(conn, uid)
    bc = config.buyurtma
    xatolar = []
    ogohlantirishlar = []

    # Min summa tekshiruvi
    jami = Decimal(str(buyurtma_data.get("jami_summa", 0)))
    if bc.min_summa > 0 and jami < bc.min_summa:
        xatolar.append(f"Minimal buyurtma summasi: {bc.min_summa} {config.umumiy.valyuta_belgisi}")

    # Foto majburiy
    if bc.foto_majburiy and not buyurtma_data.get("foto_id"):
        xatolar.append("Buyurtma uchun foto majburiy")

    # GPS tekshiruvi
    if bc.lokatsiyani_tekshirish and not buyurtma_data.get("latitude"):
        xatolar.append("GPS lokatsiya majburiy")

    # Check-in tekshiruvi
    if bc.checkin_majburiy and not buyurtma_data.get("checkin_vaqti"):
        xatolar.append("Avval check-in qiling")

    # Qarz cheki
    if bc.qarz_cheki and buyurtma_data.get("klient_qarz", 0) > 0:
        ogohlantirishlar.append(
            f"Klientning {buyurtma_data['klient_qarz']} {config.umumiy.valyuta_belgisi} qarzi bor"
        )

    # Zarar cheki
    if bc.zarar_cheki and buyurtma_data.get("zarar_bor"):
        ogohlantirishlar.append("Ba'zi tovarlar tannarxdan past narxda sotilmoqda")

    # Nasiya tekshiruvi
    if buyurtma_data.get("nasiya") and not bc.nasiyaga_ruxsat:
        xatolar.append("Nasiyaga buyurtma berish ruxsat etilmagan")

    if buyurtma_data.get("nasiya") and bc.max_nasiya_summa > 0:
        nasiya_summa = Decimal(str(buyurtma_data.get("nasiya_summa", 0)))
        if nasiya_summa > bc.max_nasiya_summa:
            xatolar.append(f"Nasiya limiti: {bc.max_nasiya_summa} {config.umumiy.valyuta_belgisi}")

    # Max chegirma
    chegirma_foiz = Decimal(str(buyurtma_data.get("chegirma_foiz", 0)))
    if chegirma_foiz > config.aksiya.max_chegirma_foiz:
        xatolar.append(f"Maksimal chegirma: {config.aksiya.max_chegirma_foiz}%")

    return {
        "valid": len(xatolar) == 0,
        "xatolar": xatolar,
        "ogohlantirishlar": ogohlantirishlar,
    }
