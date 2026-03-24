package uz.savdoai.print

import android.content.Context

object Prefs {
    private fun p(c: Context) = c.getSharedPreferences("savdoai_print", Context.MODE_PRIVATE)

    fun mac(c: Context): String? = p(c).getString("mac", null)
    fun saveMac(c: Context, m: String) = p(c).edit().putString("mac", m).apply()
    fun name(c: Context): String = p(c).getString("name", "Xprinter") ?: "Xprinter"
    fun saveName(c: Context, n: String) = p(c).edit().putString("name", n).apply()
    fun width(c: Context): Int = p(c).getInt("width", 80)
    fun saveWidth(c: Context, w: Int) = p(c).edit().putInt("width", w).apply()

    private const val API_DEFAULT = "https://savdoai-production.up.railway.app"
    /** Eski noto‘g‘ri default — /api/print 404. */
    private const val API_LEGACY_BAD = "https://savdoai-api-production.up.railway.app"

    /** Oxirgi slash va bo‘shliqlarni olib tashlaydi; bir xil bazaviy URL bilan solishtirish uchun. */
    fun normalizeApiBase(s: String): String = s.trim().trimEnd('/')

    /** FastAPI servisi (RUNBOOK), veb domen emas. */
    fun api(c: Context): String {
        val raw = p(c).getString("api", null) ?: return API_DEFAULT
        val normalized = normalizeApiBase(raw)
        val legacyNorm = normalizeApiBase(API_LEGACY_BAD)
        if (normalized.equals(legacyNorm, ignoreCase = true)) {
            p(c).edit().putString("api", API_DEFAULT).apply()
            return API_DEFAULT
        }
        return normalized
    }

    fun saveApi(c: Context, u: String) = p(c).edit().putString("api", normalizeApiBase(u)).apply()
    fun ready(c: Context): Boolean = mac(c) != null
}
