package uz.savdoai.print

import android.util.Log

/**
 * Bitta tag, DEBUG/RELEASE bo‘yicha maskalangan loglar.
 */
object PrintLog {
    const val TAG = "SavdoAIPrint"

    @Volatile
    private var debuggable: Boolean = false

    /** [SavdoAIApp.onCreate] dan chaqiriladi — BuildConfig talab qilinmaydi. */
    fun setDebuggable(v: Boolean) {
        debuggable = v
    }

    fun isDebug(): Boolean = debuggable

    fun maskToken(token: String): String =
        if (isDebug()) token else if (token.length <= 4) "****" else "****${token.takeLast(4)}"

    /** URL ichidagi `t=`, `token=` query qiymatlarini maskalaydi. */
    fun maskRequestUrl(url: String): String {
        if (isDebug()) return url
        return url.replace(Regex("([?&])(t|token)=([^&]*)")) { m ->
            val sep = m.groupValues[1]
            val name = m.groupValues[2]
            "$sep$name=****"
        }
    }

    fun d(msg: String) {
        if (isDebug()) Log.d(TAG, msg)
    }

    fun i(msg: String) {
        Log.i(TAG, msg)
    }

    fun w(msg: String, t: Throwable? = null) {
        if (t != null) Log.w(TAG, msg, t) else Log.w(TAG, msg)
    }

    fun e(msg: String, t: Throwable? = null) {
        if (t != null) Log.e(TAG, msg, t) else Log.e(TAG, msg)
    }

    /** Release’da response body uchun: HTML yoki uzun JSON chiqmasin. */
    fun safeBodySummary(body: String, maxLen: Int = 200): String {
        val t = body.trim()
        if (isDebug()) return t.take(800)
        if (t.isEmpty()) return ""
        val lower = t.lowercase()
        if (lower.contains("<!doctype") || lower.contains("<html")) return "<html…>"
        return t.take(maxLen).replace("\n", " ") + if (t.length > maxLen) "…" else ""
    }
}
