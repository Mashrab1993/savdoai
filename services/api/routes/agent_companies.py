"""
SAVDOAI — Agent Multi-Company API
2026-05-23

SalesDoc/Smartup tipida — 1 agent ko'p firma'da ishlay oladi.

ARXITEKTURA:
- agent_memberships (M:N agent ↔ company)
- JWT'da active_company_id (qaysi firma uchun ishlayotgani)
- Har data query active_company_id orqali filter qilinadi

ENDPOINTS:
- POST /api/v1/team/add_agent_to_company  (owner agent qo'shadi)
- DELETE /api/v1/team/remove_agent         (owner agent o'chiradi)
- GET  /api/v1/agent/my_companies          (agent ulangan firma'lar)
- POST /api/v1/agent/switch_company        (agent firma o'tkazadi)
- GET  /api/v1/team/agents                 (owner agent'larini ko'radi)
- PATCH /api/v1/team/agent/{id}/permissions (owner ruxsat o'zgartirish)
"""
from __future__ import annotations
import hashlib
import json
import logging
import os
import re
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field

from services.api.deps import get_uid

log = logging.getLogger(__name__)

agent_router = APIRouter()


# ════════════════════════════════════════════════════════════
#  HELPERS
# ════════════════════════════════════════════════════════════

def _parol_hash(parol: str) -> str:
    salt = os.urandom(16).hex()
    h = hashlib.pbkdf2_hmac("sha256", parol.encode(), salt.encode(), 100_000).hex()
    return f"{salt}:{h}"


def _telefon_tozala(tel: str) -> str:
    t = tel.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if t.startswith("+"):
        t = t[1:]
    if len(t) == 9 and t[0] in "3456789":
        t = "998" + t
    return t


async def _ensure_owner_or_admin(conn, uid: int, company_id: int) -> dict:
    """User shu firma'da owner/admin ekanligini tekshirish."""
    membership = await conn.fetchrow(
        """
        SELECT role, faol FROM agent_memberships
        WHERE agent_id = $1 AND company_id = $2 AND faol = TRUE
        LIMIT 1
        """,
        uid, company_id,
    )
    if not membership or membership["role"] not in ("owner", "admin"):
        raise HTTPException(403, "Bu firma uchun owner/admin huquqi kerak")
    return dict(membership)


async def _audit_log(
    conn,
    agent_id: int,
    company_id: int,
    amal: str,
    eski: dict | None = None,
    yangi: dict | None = None,
    qilgan_id: int | None = None,
    ip: str | None = None,
) -> None:
    """Audit log yozish."""
    try:
        await conn.execute(
            """
            INSERT INTO agent_company_audit
                (agent_id, company_id, amal, eski_qiymat, yangi_qiymat, qilgan_id, ip)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            agent_id, company_id, amal,
            json.dumps(eski) if eski else None,
            json.dumps(yangi) if yangi else None,
            qilgan_id, ip,
        )
    except Exception as e:
        log.warning("Audit log yozilmadi: %s", e)


# ════════════════════════════════════════════════════════════
#  SCHEMAS
# ════════════════════════════════════════════════════════════

class AddAgentSorov(BaseModel):
    """Owner agent'ni firma'ga qo'shadi."""
    agent_telefon: str | None = Field(default=None, min_length=9, max_length=20)
    agent_email: str | None = Field(default=None, max_length=200)
    agent_id_existing: int | None = Field(default=None, description="Mavjud user'ni qo'shish")
    # Agar yangi user yaratish kerak bo'lsa:
    ism: str | None = Field(default=None, min_length=2, max_length=100)
    login: str | None = Field(default=None, min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_\.\-]+$")
    parol: str | None = Field(default=None, min_length=4, max_length=100)
    # Membership:
    role: str = Field(default="agent", pattern="^(admin|sotuvchi|agent|merchant|supervisor)$")
    permissions: dict[str, Any] = Field(default_factory=dict)


class RemoveAgentSorov(BaseModel):
    agent_id: int
    company_id: int | None = Field(default=None, description="Ko'rsatilmasa active_company")


class SwitchCompanySorov(BaseModel):
    company_id: int


class UpdatePermissionsSorov(BaseModel):
    agent_id: int
    role: str | None = Field(default=None, pattern="^(admin|sotuvchi|agent|merchant|supervisor)$")
    permissions: dict[str, Any] | None = None
    faol: bool | None = None


# ════════════════════════════════════════════════════════════
#  ENDPOINTS
# ════════════════════════════════════════════════════════════

@agent_router.post("/api/v1/team/add_agent_to_company", tags=["Team"])
async def add_agent_to_company(
    data: AddAgentSorov,
    request: Request,
    uid: int = Depends(get_uid),
):
    """
    Owner agent'ni o'z firma'siga qo'shadi.

    3 yo'l:
    1) Mavjud telefon orqali (agent boshqa firma'da bor) — agent_telefon
    2) Mavjud user_id orqali — agent_id_existing
    3) Yangi user yaratish — ism + login + parol bilan

    Bu firma uchun JWT user'i owner/admin bo'lishi kerak.
    """
    from shared.database.pool import get_pool
    from services.api.deps import get_user_context

    owner_id = uid
    ctx = await get_user_context(owner_id)

    # Owner firma'sini topish (active_company yoki primary)
    company_id = ctx.get("tenant_id", owner_id)

    pool = get_pool()
    async with pool.acquire() as c:
        # Owner huquqini tekshirish
        await _ensure_owner_or_admin(c, owner_id, company_id)

        # Agent topish yoki yaratish
        agent_id: int

        if data.agent_id_existing:
            # Existing user'ni qo'shish
            existing = await c.fetchval(
                "SELECT id FROM users WHERE id = $1 AND faol = TRUE",
                data.agent_id_existing,
            )
            if not existing:
                raise HTTPException(404, "Bunday user topilmadi")
            agent_id = data.agent_id_existing

        elif data.agent_telefon:
            # Telefon orqali topish (mavjud agent boshqa firma'dan)
            tel = _telefon_tozala(data.agent_telefon)
            agent_id = await c.fetchval(
                """
                SELECT id FROM users
                WHERE regexp_replace(COALESCE(telefon,''), '[^0-9+]', '', 'g') = $1
                  AND faol = TRUE LIMIT 1
                """,
                tel,
            )
            if not agent_id:
                # Yo'q bo'lsa yangi yaratamiz (ism + parol kerak)
                if not data.ism or not data.parol:
                    raise HTTPException(
                        400,
                        "Bu telefon mavjud emas — yangi yaratish uchun ism va parol kerak"
                    )
                # Login avtomatik
                login_full = f"{ctx.get('company_kod', 'firma')}-{data.login or 'agent'}"
                agent_id = await c.fetchval(
                    """
                    INSERT INTO users (
                        ism, to_liq_ism, telefon, dokon_nomi, segment,
                        login, parol_hash, role, parent_id, company_kod,
                        tarif, faol, yaratilgan
                    )
                    SELECT $1, $1, $2, dokon_nomi, segment,
                           $3, $4, $5, $6, company_kod,
                           tarif, TRUE, NOW()
                    FROM users WHERE id = $7
                    RETURNING id
                    """,
                    data.ism.strip(), tel, login_full, _parol_hash(data.parol),
                    data.role, company_id, company_id,
                )

        elif data.ism and data.login and data.parol:
            # Yangi user yaratish (telefonsiz — login bilan)
            login_full = f"{ctx.get('company_kod', 'firma')}-{data.login}"
            tel_placeholder = f"_login_{data.login}_{company_id}"  # bo'sh telefon
            agent_id = await c.fetchval(
                """
                INSERT INTO users (
                    ism, to_liq_ism, telefon, dokon_nomi, segment,
                    login, parol_hash, role, parent_id, company_kod,
                    tarif, faol, yaratilgan
                )
                SELECT $1, $1, $2, dokon_nomi, segment,
                       $3, $4, $5, $6, company_kod,
                       tarif, TRUE, NOW()
                FROM users WHERE id = $7
                RETURNING id
                """,
                data.ism.strip(), tel_placeholder, login_full, _parol_hash(data.parol),
                data.role, company_id, company_id,
            )
        else:
            raise HTTPException(
                400,
                "agent_id_existing, agent_telefon, yoki (ism+login+parol) kerak"
            )

        # Membership yaratish (yoki faollashtirish)
        existing_membership = await c.fetchrow(
            """
            SELECT id, faol, role FROM agent_memberships
            WHERE agent_id = $1 AND company_id = $2
            """,
            agent_id, company_id,
        )

        if existing_membership:
            if existing_membership["faol"]:
                raise HTTPException(
                    409,
                    "Bu agent allaqachon ushbu firma'da ishlaydi"
                )
            # Faolsizlangan — qayta faollashtirish
            await c.execute(
                """
                UPDATE agent_memberships
                SET faol = TRUE, role = $1, permissions = $2,
                    qo_shgan_id = $3, yangilangan = NOW()
                WHERE id = $4
                """,
                data.role, json.dumps(data.permissions or {}), owner_id,
                existing_membership["id"],
            )
            await _audit_log(c, agent_id, company_id, "faollashti",
                            eski={"faol": False}, yangi={"faol": True, "role": data.role},
                            qilgan_id=owner_id)
        else:
            # Yangi membership
            await c.execute(
                """
                INSERT INTO agent_memberships
                    (agent_id, company_id, role, permissions, qo_shgan_id)
                VALUES ($1, $2, $3, $4, $5)
                """,
                agent_id, company_id, data.role,
                json.dumps(data.permissions or {}), owner_id,
            )
            await _audit_log(c, agent_id, company_id, "qo_shildi",
                            yangi={"role": data.role, "permissions": data.permissions or {}},
                            qilgan_id=owner_id)

        # Agent va firma ma'lumotlarini qaytarish
        result = await c.fetchrow(
            """
            SELECT
                am.agent_id, am.company_id, am.role, am.permissions, am.faol,
                a.ism AS agent_ism, a.telefon AS agent_telefon, a.login AS agent_login,
                c.dokon_nomi, c.company_kod
            FROM agent_memberships am
            JOIN users a ON a.id = am.agent_id
            JOIN users c ON c.id = am.company_id
            WHERE am.agent_id = $1 AND am.company_id = $2
            """,
            agent_id, company_id,
        )

    log.info(
        "✅ Agent qo'shildi: agent=%d company=%d role=%s by_owner=%d",
        agent_id, company_id, data.role, owner_id,
    )

    return {
        "agent_id": result["agent_id"],
        "company_id": result["company_id"],
        "role": result["role"],
        "permissions": json.loads(result["permissions"]) if isinstance(result["permissions"], str) else result["permissions"],
        "agent": {
            "ism": result["agent_ism"],
            "telefon": result["agent_telefon"],
            "login": result["agent_login"],
        },
        "company": {
            "dokon_nomi": result["dokon_nomi"],
            "company_kod": result["company_kod"],
        },
        "message": f"{result['agent_ism']} endi {result['dokon_nomi']}'da {data.role} sifatida ishlaydi",
    }


@agent_router.delete("/api/v1/team/remove_agent_from_company", tags=["Team"])
async def remove_agent_from_company(
    data: RemoveAgentSorov,
    uid: int = Depends(get_uid),
):
    """Owner agent'ni firma'dan o'chiradi (soft delete — faol=FALSE)."""
    from shared.database.pool import get_pool
    from services.api.deps import get_user_context

    owner_id = uid
    ctx = await get_user_context(owner_id)
    company_id = data.company_id or ctx.get("tenant_id", owner_id)

    pool = get_pool()
    async with pool.acquire() as c:
        await _ensure_owner_or_admin(c, owner_id, company_id)

        # Self-removal'ni rad etish
        if data.agent_id == owner_id:
            raise HTTPException(400, "O'zingizni firma'dan o'chira olmaysiz")

        membership = await c.fetchrow(
            """
            SELECT id, role, faol FROM agent_memberships
            WHERE agent_id = $1 AND company_id = $2
            """,
            data.agent_id, company_id,
        )
        if not membership:
            raise HTTPException(404, "Bu agent firma'da yo'q")

        if not membership["faol"]:
            return {"message": "Allaqachon o'chirilgan"}

        # Owner o'chirilmasligi kerak
        if membership["role"] == "owner":
            raise HTTPException(400, "Owner'ni o'chira olmaysiz")

        await c.execute(
            "UPDATE agent_memberships SET faol = FALSE, yangilangan = NOW() WHERE id = $1",
            membership["id"],
        )

        await _audit_log(c, data.agent_id, company_id, "o_chirildi",
                        eski={"faol": True, "role": membership["role"]},
                        qilgan_id=owner_id)

    log.info("🗑 Agent o'chirildi: agent=%d company=%d by=%d", data.agent_id, company_id, owner_id)
    return {"message": "Agent firma'dan o'chirildi"}


@agent_router.get("/api/v1/agent/my_companies", tags=["Agent"])
async def my_companies(uid: int = Depends(get_uid)):
    """Agent o'zining barcha faol firma'larini ko'rish."""
    from shared.database.pool import get_pool

    async with get_pool().acquire() as c:
        # Agent uchun firma'lar (va owner o'zi firma sifatida)
        rows = await c.fetch(
            """
            SELECT
                vac.company_id,
                vac.dokon_nomi,
                vac.company_kod,
                vac.role,
                vac.permissions,
                vac.tarif,
                vac.sinov_tugash,
                vac.oxirgi_ulansh,
                -- Statistika
                (SELECT COUNT(*) FROM tovarlar WHERE user_id = vac.company_id) AS tovar_soni,
                (SELECT COUNT(*) FROM klientlar WHERE user_id = vac.company_id) AS klient_soni
            FROM v_agent_companies vac
            WHERE vac.agent_id = $1
            ORDER BY vac.oxirgi_ulansh DESC NULLS LAST, vac.dokon_nomi
            """,
            uid,
        )

    return [
        {
            "company_id": r["company_id"],
            "dokon_nomi": r["dokon_nomi"],
            "company_kod": r["company_kod"],
            "role": r["role"],
            "permissions": json.loads(r["permissions"]) if isinstance(r["permissions"], str) else r["permissions"],
            "tarif": r["tarif"],
            "sinov_tugash": r["sinov_tugash"].isoformat() if r["sinov_tugash"] else None,
            "oxirgi_ulansh": r["oxirgi_ulansh"].isoformat() if r["oxirgi_ulansh"] else None,
            "tovar_soni": r["tovar_soni"],
            "klient_soni": r["klient_soni"],
        }
        for r in rows
    ]


@agent_router.post("/api/v1/agent/switch_company", tags=["Agent"])
async def switch_company(
    data: SwitchCompanySorov,
    uid: int = Depends(get_uid),
):
    """
    Agent firma'ga o'tkazadi — yangi JWT active_company_id bilan.

    Returns: yangi JWT token + active_company info.
    """
    from services.api.main import jwt_yarat
    from shared.database.pool import get_pool

    async with get_pool().acquire() as c:
        # Agent shu firma'ga ulanganmi tekshirish
        membership = await c.fetchrow(
            """
            SELECT am.role, am.permissions, am.faol,
                   c.dokon_nomi, c.company_kod, c.faol AS company_faol
            FROM agent_memberships am
            JOIN users c ON c.id = am.company_id
            WHERE am.agent_id = $1 AND am.company_id = $2
            LIMIT 1
            """,
            uid, data.company_id,
        )

        if not membership:
            raise HTTPException(403, "Bu firma'ga ulanmagansiz")
        if not membership["faol"]:
            raise HTTPException(403, "Membership faol emas")
        if not membership["company_faol"]:
            raise HTTPException(410, "Firma faol emas")

        # oxirgi_ulansh yangilash
        await c.execute(
            "UPDATE agent_memberships SET oxirgi_ulansh = NOW() WHERE agent_id = $1 AND company_id = $2",
            uid, data.company_id,
        )

        # Audit
        await _audit_log(c, uid, data.company_id, "login", qilgan_id=uid)

    # Yangi JWT — active_company_id qo'shamiz
    # jwt_yarat() ni extra payload bilan chaqirish — kelajakda main.py'da kengaytiriladi
    # Hozircha standart JWT, frontend localStorage'da active_company_id saqlaydi
    token = jwt_yarat(uid)

    return {
        "token": token,
        "user_id": uid,
        "active_company_id": data.company_id,
        "company_kod": membership["company_kod"],
        "dokon_nomi": membership["dokon_nomi"],
        "role": membership["role"],
        "permissions": json.loads(membership["permissions"]) if isinstance(membership["permissions"], str) else membership["permissions"],
    }


@agent_router.get("/api/v1/team/agents", tags=["Team"])
async def list_team_agents(uid: int = Depends(get_uid)):
    """Owner o'z firma'sidagi barcha agent'larni ko'rish."""
    from shared.database.pool import get_pool
    from services.api.deps import get_user_context

    owner_id = uid
    ctx = await get_user_context(owner_id)
    company_id = ctx.get("tenant_id", owner_id)

    async with get_pool().acquire() as c:
        await _ensure_owner_or_admin(c, owner_id, company_id)

        rows = await c.fetch(
            """
            SELECT
                am.agent_id,
                am.role,
                am.permissions,
                am.faol,
                am.qo_shilgan,
                am.oxirgi_ulansh,
                a.ism, a.telefon, a.login,
                -- Boshqa firma'larda ulanmaganligi
                (SELECT COUNT(*) FROM agent_memberships
                 WHERE agent_id = am.agent_id AND faol = TRUE AND company_id != am.company_id) AS boshqa_firma_soni
            FROM agent_memberships am
            JOIN users a ON a.id = am.agent_id
            WHERE am.company_id = $1
              AND am.role != 'owner'  -- owner'lar bu listga kirmaydi
            ORDER BY am.faol DESC, am.qo_shilgan DESC
            """,
            company_id,
        )

    return [
        {
            "agent_id": r["agent_id"],
            "ism": r["ism"],
            "telefon": r["telefon"],
            "login": r["login"],
            "role": r["role"],
            "permissions": json.loads(r["permissions"]) if isinstance(r["permissions"], str) else r["permissions"],
            "faol": r["faol"],
            "qo_shilgan": r["qo_shilgan"].isoformat() if r["qo_shilgan"] else None,
            "oxirgi_ulansh": r["oxirgi_ulansh"].isoformat() if r["oxirgi_ulansh"] else None,
            "boshqa_firma_soni": r["boshqa_firma_soni"],
        }
        for r in rows
    ]


@agent_router.patch("/api/v1/team/agent/permissions", tags=["Team"])
async def update_agent_permissions(
    data: UpdatePermissionsSorov,
    uid: int = Depends(get_uid),
):
    """Owner agent role/permissions o'zgartiradi."""
    from shared.database.pool import get_pool
    from services.api.deps import get_user_context

    owner_id = uid
    ctx = await get_user_context(owner_id)
    company_id = ctx.get("tenant_id", owner_id)

    async with get_pool().acquire() as c:
        await _ensure_owner_or_admin(c, owner_id, company_id)

        membership = await c.fetchrow(
            "SELECT id, role, permissions, faol FROM agent_memberships WHERE agent_id = $1 AND company_id = $2",
            data.agent_id, company_id,
        )
        if not membership:
            raise HTTPException(404, "Agent firma'da yo'q")

        # Owner'ni o'zgartirib bo'lmaydi
        if membership["role"] == "owner":
            raise HTTPException(400, "Owner role'ini o'zgartirib bo'lmaydi")

        updates: list[str] = []
        params: list = []
        i = 1
        eski_state = {}
        yangi_state = {}

        if data.role and data.role != membership["role"]:
            updates.append(f"role = ${i}")
            params.append(data.role)
            eski_state["role"] = membership["role"]
            yangi_state["role"] = data.role
            i += 1

        if data.permissions is not None:
            updates.append(f"permissions = ${i}::jsonb")
            params.append(json.dumps(data.permissions))
            eski_state["permissions"] = membership["permissions"]
            yangi_state["permissions"] = data.permissions
            i += 1

        if data.faol is not None and data.faol != membership["faol"]:
            updates.append(f"faol = ${i}")
            params.append(data.faol)
            eski_state["faol"] = membership["faol"]
            yangi_state["faol"] = data.faol
            i += 1

        if not updates:
            return {"message": "O'zgartirish yo'q"}

        params.append(membership["id"])
        await c.execute(
            f"UPDATE agent_memberships SET {', '.join(updates)}, yangilangan = NOW() WHERE id = ${i}",
            *params,
        )

        amal = "rol_o_zgardi" if "role" in yangi_state else ("faollashti" if yangi_state.get("faol") else "faolsizlanti" if yangi_state.get("faol") is False else "rol_o_zgardi")
        await _audit_log(c, data.agent_id, company_id, amal,
                        eski=eski_state, yangi=yangi_state, qilgan_id=owner_id)

    log.info("✏️ Agent %d o'zgartirildi: company=%d updates=%s", data.agent_id, company_id, yangi_state)
    return {"message": "O'zgartirildi", "eski": eski_state, "yangi": yangi_state}


@agent_router.get("/api/v1/agent/active_company", tags=["Agent"])
async def get_active_company(
    request: Request,
    uid: int = Depends(get_uid),
):
    """Hozirgi tanlangan firma ma'lumotlari (header yoki cookie'dan)."""
    from shared.database.pool import get_pool

    # Frontend'dan X-Active-Company yoki cookie'dan keladi
    active_id_str = (
        request.headers.get("x-active-company")
        or request.cookies.get("active_company_id")
    )
    active_id = int(active_id_str) if active_id_str and active_id_str.isdigit() else None

    if not active_id:
        # Default: agent uchun birinchi firma yoki owner uchun o'zining firma
        async with get_pool().acquire() as c:
            r = await c.fetchrow(
                """
                SELECT company_id FROM v_agent_companies
                WHERE agent_id = $1
                ORDER BY (role = 'owner') DESC, oxirgi_ulansh DESC NULLS LAST
                LIMIT 1
                """,
                uid,
            )
            if r:
                active_id = r["company_id"]

    if not active_id:
        raise HTTPException(404, "Faol firma topilmadi — owner sizni qo'shishi kerak")

    async with get_pool().acquire() as c:
        info = await c.fetchrow(
            """
            SELECT
                vac.company_id,
                vac.dokon_nomi,
                vac.company_kod,
                vac.role,
                vac.permissions,
                vac.tarif,
                vac.sinov_tugash
            FROM v_agent_companies vac
            WHERE vac.agent_id = $1 AND vac.company_id = $2
            LIMIT 1
            """,
            uid, active_id,
        )

    if not info:
        raise HTTPException(403, "Bu firma'ga ruxsatingiz yo'q")

    return {
        "company_id": info["company_id"],
        "dokon_nomi": info["dokon_nomi"],
        "company_kod": info["company_kod"],
        "role": info["role"],
        "permissions": json.loads(info["permissions"]) if isinstance(info["permissions"], str) else info["permissions"],
        "tarif": info["tarif"],
        "sinov_tugash": info["sinov_tugash"].isoformat() if info["sinov_tugash"] else None,
    }
