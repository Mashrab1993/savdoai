package uz.savdoai.print

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

/**
 * UNIVERSAL ENTRY POINT — HTTPS App Link, savdoai://print/..., .bin fayl.
 * savdoai://print/{job_id}?t=...&w=58|80
 */
class DeepLinkActivity : AppCompatActivity() {
    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        val uri = intent?.data
        if (uri == null) {
            Toast.makeText(this, PrintUserMessages.DATA_MISSING, Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        PrintLog.i("DeepLink onCreate | deepLinkUri=$uri")
        when (uri.scheme) {
            "https", "http" -> handleHttps(uri)
            "savdoai" -> handleSavdoai(uri)
            "content", "file" -> handleFile(uri)
            else -> {
                Toast.makeText(this, PrintUserMessages.INVALID_LINK, Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    private fun handleHttps(uri: Uri) {
        val path = uri.path ?: ""
        val jobId = path.removePrefix("/p/").takeIf { it.isNotBlank() && it.length >= 6 }
        val token = uri.getQueryParameter("t")
        val width = parseWidth(uri.getQueryParameter("w"), Prefs.width(this))
        if (jobId == null || token.isNullOrBlank()) {
            Toast.makeText(this, PrintUserMessages.INVALID_LINK, Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        logParsed(uri, jobId, token, width)
        launchPrint(jobId, token, width)
    }

    private fun handleSavdoai(uri: Uri) {
        val jobId = uri.pathSegments?.firstOrNull()?.takeIf { it.isNotBlank() }
        val token = uri.getQueryParameter("t")
        val width = parseWidth(uri.getQueryParameter("w"), Prefs.width(this))
        if (jobId.isNullOrBlank() || token.isNullOrBlank()) {
            Toast.makeText(this, PrintUserMessages.INVALID_LINK, Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        logParsed(uri, jobId, token, width)
        launchPrint(jobId, token, width)
    }

    private fun logParsed(uri: Uri, jobId: String, token: String, width: Int) {
        PrintLog.i(
            "DeepLink parsed | deepLinkUri=$uri jobId=$jobId width=$width " +
                "token=${PrintLog.maskToken(token)} apiBaseUrl=${Prefs.api(this)} " +
                "btOn=${BluetoothPrinter.btOn()}"
        )
    }

    /**
     * `w` yo‘q yoki 58/80 emas (yoki raqam emas) — [defaultWidth] (odatda prefs: 58 yoki 80).
     * Telegram/landing noto‘g‘ri `w` yuborsa ham chop oqimi to‘xtamasin.
     */
    private fun parseWidth(raw: String?, defaultWidth: Int): Int {
        if (raw.isNullOrBlank()) return defaultWidth
        val w = raw.toIntOrNull()
        if (w == null) {
            PrintLog.d("DeepLink parseWidth | non-numeric w, fallback defaultWidth=$defaultWidth")
            return defaultWidth
        }
        return when (w) {
            58, 80 -> w
            else -> {
                PrintLog.d("DeepLink parseWidth | w=$w not 58/80, fallback defaultWidth=$defaultWidth")
                defaultWidth
            }
        }
    }

    private fun handleFile(uri: Uri) {
        if (!Prefs.ready(this)) {
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
            return
        }
        try {
            val bytes = contentResolver.openInputStream(uri)?.readBytes()
            if (bytes != null && bytes.isNotEmpty()) {
                PrintService.direct(this, bytes)
            } else {
                Toast.makeText(this, PrintUserMessages.EMPTY_RECEIPT, Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            PrintLog.e("DeepLink file read", e)
            Toast.makeText(this, PrintUserMessages.ENCODING_ERROR, Toast.LENGTH_SHORT).show()
        }
        finish()
    }

    private fun launchPrint(jobId: String, token: String, width: Int) {
        if (!Prefs.ready(this)) {
            Toast.makeText(this, PrintUserMessages.PRINTER_NOT_CONFIGURED, Toast.LENGTH_LONG).show()
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
            return
        }
        PrintService.deepLink(this, jobId, token, width)
        finish()
    }
}
