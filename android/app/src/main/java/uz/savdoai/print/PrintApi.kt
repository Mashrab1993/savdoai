package uz.savdoai.print
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
object PrintApi {
    sealed class R { data class OK(val bytes: ByteArray) : R(); data class Err(val code: Int, val msg: String) : R() }
    fun fetchEscPos(base: String, jobId: String, token: String, width: Int): R {
        val w = if (width <= 58) 58 else 80
        return try {
            val tEnc = URLEncoder.encode(token, "UTF-8")
            val c = (URL("$base/api/print/escpos/$jobId?t=$tEnc&w=$w").openConnection() as HttpURLConnection).apply {
                connectTimeout = 8000; readTimeout = 8000 }
            when (val code = c.responseCode) {
                200 -> { val b = ByteArrayOutputStream(); c.inputStream.use { it.copyTo(b) }; c.disconnect()
                    if (b.size() == 0) R.Err(422, "Chek bo'sh") else R.OK(b.toByteArray()) }
                409 -> { c.disconnect(); R.Err(409, "Allaqachon chop etilgan") }
                410 -> { c.disconnect(); R.Err(410, "Muddati o'tgan. Yangi chek oling.") }
                401 -> { c.disconnect(); R.Err(401, "Token noto'g'ri") }
                else -> { c.disconnect(); R.Err(code, "Server xato: $code") }
            }
        } catch (e: Exception) { R.Err(0, "Internet yo'q") }
    }
    fun ack(base: String, jobId: String, ok: Boolean, token: String, reason: String = "") {
        try {
            val tEnc = URLEncoder.encode(token, "UTF-8")
            val rEnc = URLEncoder.encode(reason.take(200), "UTF-8")
            val u = if (ok) "$base/api/print/done/$jobId?t=$tEnc"
                else "$base/api/print/failed/$jobId?t=$tEnc&reason=$rEnc"
            (URL(u).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 8000
                responseCode
                disconnect()
            }
        } catch (_: Exception) {}
    }
}
