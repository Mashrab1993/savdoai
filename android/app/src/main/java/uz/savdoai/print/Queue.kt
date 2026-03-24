package uz.savdoai.print
import android.content.Context
import android.util.Base64
/** Oxirgi chop uchun zaxira (offline / qayta urinish). Token — serverga ack uchun. */
object Queue {
    private fun p(c: Context) = c.getSharedPreferences("savdoai_queue", Context.MODE_PRIVATE)
    fun save(c: Context, id: String, data: ByteArray, token: String = "") =
        p(c).edit()
            .putString("id", id)
            .putString("data", Base64.encodeToString(data, Base64.NO_WRAP))
            .putString("tok", token)
            .apply()
    fun last(c: Context): Triple<String, ByteArray, String>? {
        val id = p(c).getString("id", null) ?: return null
        val b = p(c).getString("data", null) ?: return null
        val tok = p(c).getString("tok", "") ?: ""
        return try { Triple(id, Base64.decode(b, Base64.NO_WRAP), tok) } catch (_: Exception) { null }
    }
    fun has(c: Context): Boolean = p(c).contains("id")
    fun clear(c: Context) = p(c).edit().clear().apply()
}
