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
    fun api(c: Context): String = p(c).getString("api", "https://savdoai-api-production.up.railway.app") ?: ""
    fun saveApi(c: Context, u: String) = p(c).edit().putString("api", u).apply()
    fun ready(c: Context): Boolean = mac(c) != null
}
