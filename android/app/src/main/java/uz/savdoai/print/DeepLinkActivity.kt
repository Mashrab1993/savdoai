package uz.savdoai.print

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

/**
 * UNIVERSAL ENTRY POINT — 3 xil trigger qabul qiladi:
 * 1. HTTPS App Link: https://print.savdoai.uz/p/{job_id}?t={token}&w=80
 * 2. Custom URI: savdoai://print/{job_id}?t={token}&w=80
 * 3. .bin fayl: content:// URI
 *
 * Barchasi → PrintService → Bluetooth → CHEK CHIQADI
 */
class DeepLinkActivity : AppCompatActivity() {
    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        val uri = intent?.data
        if (uri == null) {
            Toast.makeText(this, "Ma'lumot topilmadi", Toast.LENGTH_SHORT).show()
            finish(); return
        }

        when (uri.scheme) {
            // ── PRIMARY: HTTPS App Link ──
            "https", "http" -> {
                val path = uri.path ?: ""
                val jobId = path.removePrefix("/p/").takeIf { it.isNotBlank() && it.length >= 6 }
                val token = uri.getQueryParameter("t")
                val width = uri.getQueryParameter("w")?.toIntOrNull() ?: Prefs.width(this)

                if (jobId == null || token.isNullOrBlank()) {
                    Toast.makeText(this, "Noto'g'ri link", Toast.LENGTH_SHORT).show()
                    finish(); return
                }
                launchPrint(jobId, token, width)
            }

            // ── FALLBACK: Custom URI ──
            "savdoai" -> {
                val jobId = uri.pathSegments?.firstOrNull()
                val token = uri.getQueryParameter("t")
                val width = uri.getQueryParameter("w")?.toIntOrNull() ?: Prefs.width(this)

                if (jobId.isNullOrBlank() || token.isNullOrBlank()) {
                    Toast.makeText(this, "Noto'g'ri link", Toast.LENGTH_SHORT).show()
                    finish(); return
                }
                launchPrint(jobId, token, width)
            }

            // ── .bin FAYL ──
            "content", "file" -> {
                if (!Prefs.ready(this)) {
                    startActivity(Intent(this, SetupActivity::class.java))
                    finish(); return
                }
                try {
                    val bytes = contentResolver.openInputStream(uri)?.readBytes()
                    if (bytes != null && bytes.isNotEmpty()) {
                        PrintService.direct(this, bytes)
                    } else {
                        Toast.makeText(this, "Fayl bo'sh", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(this, "Xato: ${e.message}", Toast.LENGTH_SHORT).show()
                }
                finish()
            }

            else -> {
                Toast.makeText(this, "Noma'lum format", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    private fun launchPrint(jobId: String, token: String, width: Int) {
        if (!Prefs.ready(this)) {
            Toast.makeText(this, "Avval printerni sozlang!", Toast.LENGTH_LONG).show()
            startActivity(Intent(this, SetupActivity::class.java))
            finish(); return
        }
        PrintService.deepLink(this, jobId, token, width)
        finish()
    }
}
