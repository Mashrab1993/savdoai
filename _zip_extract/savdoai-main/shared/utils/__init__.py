from .hisob import (
    narx_hisob, qarz_hisob, jami_qarz_hisob,
    qaytarish_hisob, foyda_hisob, ai_hisob_tekshir,
    sotuv_validatsiya, kirim_validatsiya,
    qarz_to_lash_hisob, foiz_hisob, pul, pul_r, D
)
from .uzb_nlp import (
    raqam_parse, miqdor_olish, matn_normallashtir,
    qarz_bor_mi, prompt_boyitish,
    savdo_turi_olish, emotsional_gap_tekshir
)

from .hisob import kassa_tekshir, oylik_foyda_hisob


def like_escape(s: str) -> str:
    """LIKE query uchun maxsus belgilarni escape qilish.
    '%' va '_' PostgreSQL da maxsus — ular escape qilinmasa
    noto'g'ri natija beradi.

    Ishlatish:
        f"%{like_escape(nomi.strip())}%"
    """
    if not s:
        return ""
    return (s
            .replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_"))
