"""RAG — Qdrant vector DB (ixtiyoriy, yo'q bo'lsa ham bot ishlaydi)"""
try:
    from .vector_db import (
        sheva_qidirish, matn_boyitish_rag, so_z_standartlashtir,
        stopwords_tozala, typo_tuzat, rag_init, rag_ol
    )
except (ImportError, ModuleNotFoundError):
    # Qdrant optional — graceful degradation
    sheva_qidirish = matn_boyitish_rag = so_z_standartlashtir = None
    stopwords_tozala = typo_tuzat = rag_init = rag_ol = None
