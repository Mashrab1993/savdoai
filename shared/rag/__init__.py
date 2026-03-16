"""
RAG / sheva va vector DB — Qdrant ixtiyoriy.
qdrant-client o'rnatilmagan bo'lsa graceful degradation.
"""
from __future__ import annotations

try:
    from .vector_db import (
        sheva_qidirish,
        matn_boyitish_rag,
        so_z_standartlashtir,
        stopwords_tozala,
        typo_tuzat,
        rag_init,
        rag_ol,
    )
except ImportError:
    # Qdrant yoki boshqa dependency yo'q — graceful degradation
    def _stub(*args, **kwargs):
        return None

    def _stub_str(s: str, *a, **kw):
        return s if isinstance(s, str) else ""

    async def _rag_qidirish_stub(*args, **kwargs):
        return []

    class _RAGStub:
        async def qidirish(self, *a, **kw):
            return []

    def _rag_ol_stub():
        return _RAGStub()

    sheva_qidirish = matn_boyitish_rag = so_z_standartlashtir = _stub
    stopwords_tozala = typo_tuzat = _stub_str
    rag_init = _stub
    rag_ol = _rag_ol_stub
