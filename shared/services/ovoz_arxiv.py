"""
╔══════════════════════════════════════════════════════════════╗
║  SAVDOAI — OVOZ ARXIV                                       ║
║                                                              ║
║  Har ovozli xabar arxivga yoziladi (debug/audit uchun):     ║
║  - file_id (Telegram)                                        ║
║  - transkripsiya                                             ║
║  - operatsiya turi (zakaz/kirim/klient/narx/xarajat)        ║
║  - parse natija                                              ║
║  - muvaffaqiyat holati                                       ║
╚══════════════════════════════════════════════════════════════╝
"""
from __future__ import annotations
import json
import logging
from typing import Optional

log = logging.getLogger(__name__)


async def saqlash(
    conn,
    user_id: int,
    file_id: str,
    transkripsiya: str,
    operatsiya: str,
    parse_natija: dict | None = None,
    muvaffaqiyat: bool = False,
    xato: str | None = None,
) -> int | None:
    """See module docstring."""
    if not conn or not user_id or not file_id:
        return None
    """
    Ovozli xabarni arxivga saqlash.

    Args:
        conn: asyncpg connection (RLS context bilan)
        user_id: foydalanuvchi ID
        file_id: Telegram voice file_id
        transkripsiya: Gemini STT natijasi
        operatsiya: zakaz/kirim/klient/narx/xarajat
        parse_natija: parser natijasi (JSON)
        muvaffaqiyat: muvaffaqiyatli yakunlanganmi
        xato: agar xato bo'lsa

    Returns:
        Arxiv ID yoki None (xato holatida)
    """
    try:
        parse_json = json.dumps(parse_natija, ensure_ascii=False, default=str) if parse_natija else None
        arxiv_id = await conn.fetchval("""
            INSERT INTO ovoz_arxiv
                (user_id, ovoz_file_id, transkripsiya, operatsiya,
                 parse_natija, muvaffaqiyat, xato)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
            RETURNING id
        """, user_id, file_id, transkripsiya[:2000], operatsiya,
            parse_json, muvaffaqiyat, (xato or "")[:500])
        return arxiv_id
    except Exception as e:
        log.warning("ovoz_arxiv saqlash xato: %s", e)
        return None


async def yangilash(
    conn,
    arxiv_id: int,
    muvaffaqiyat: bool,
    xato: str | None = None,
) -> None:
    """Arxiv yozuvini yangilash (tasdiqlash yoki bekor qilingandan keyin)."""
    if not conn or not arxiv_id:
        return
    try:
        await conn.execute("""
            UPDATE ovoz_arxiv
            SET muvaffaqiyat = $1, xato = $2
            WHERE id = $3
        """, muvaffaqiyat, (xato or "")[:500], arxiv_id)
    except Exception as e:
        log.warning("ovoz_arxiv yangilash xato: %s", e)
