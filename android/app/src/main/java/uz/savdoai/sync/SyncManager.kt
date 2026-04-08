package uz.savdoai.sync

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.util.Log
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.*

/**
 * SavdoAI — Sync Manager
 *
 * Smartup SyncWorker + AutoSyncLogTable dan o'rganilgan:
 * • Structured sync logging (19 field)
 * • Batch entity sync
 * • Network type detection
 * • Battery level tracking
 * • Retry mechanism
 */
object SyncManager {
    private const val TAG = "SavdoAI_Sync"
    private const val MAX_RETRY = 3

    data class SyncResult(
        val muvaffaqiyatli: Boolean,
        val entitySoni: Int = 0,
        val yuborilganBayt: Long = 0,
        val qabulQilinganBayt: Long = 0,
        val xatoXabar: String? = null,
        val davomiyligiMs: Long = 0,
    )

    /**
     * To'liq sinxronizatsiya — barcha entitylarni serverga yuborish/olish.
     */
    suspend fun fullSync(
        context: Context,
        serverUrl: String,
        token: String,
    ): SyncResult = withContext(Dispatchers.IO) {
        val boshlangan = System.currentTimeMillis()
        var entitySoni = 0
        var yuborilgan = 0L
        var qabulQilingan = 0L

        try {
            // 1. Config sync
            uz.savdoai.config.ConfigManager.sync(serverUrl, token)
            entitySoni++

            // 2. Tovarlar sync
            val tovarlarRes = syncEntity(serverUrl, token, "/api/tovarlar/v2/filtr", "{}")
            entitySoni++
            qabulQilingan += tovarlarRes.length

            // 3. Klientlar sync
            val klientlarRes = syncEntity(serverUrl, token, "/api/klientlar", null)
            entitySoni++
            qabulQilingan += klientlarRes.length

            // 4. Sotuvlar sync (yuborish)
            // TODO: lokal DB dan sync qilinmagan sotuvlarni yuborish

            val davomiyligi = System.currentTimeMillis() - boshlangan

            // Sync log yozish
            logSync(context, serverUrl, token, SyncResult(
                muvaffaqiyatli = true,
                entitySoni = entitySoni,
                yuborilganBayt = yuborilgan,
                qabulQilinganBayt = qabulQilingan,
                davomiyligiMs = davomiyligi,
            ))

            Log.d(TAG, "Sync muvaffaqiyatli: $entitySoni entity, ${davomiyligi}ms")
            SyncResult(true, entitySoni, yuborilgan, qabulQilingan, davomiyligiMs = davomiyligi)
        } catch (e: Exception) {
            val davomiyligi = System.currentTimeMillis() - boshlangan
            Log.e(TAG, "Sync xatosi: ${e.message}")

            logSync(context, serverUrl, token, SyncResult(
                muvaffaqiyatli = false,
                xatoXabar = e.message,
                davomiyligiMs = davomiyligi,
            ))

            SyncResult(false, xatoXabar = e.message, davomiyligiMs = davomiyligi)
        }
    }

    private suspend fun syncEntity(
        serverUrl: String, token: String,
        endpoint: String, body: String?,
    ): String = withContext(Dispatchers.IO) {
        val url = URL("$serverUrl$endpoint")
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = if (body != null) "POST" else "GET"
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Content-Type", "application/json")
            connectTimeout = 30000
            readTimeout = 30000
            if (body != null) {
                doOutput = true
                outputStream.write(body.toByteArray())
            }
        }

        val response = if (conn.responseCode == 200) {
            conn.inputStream.bufferedReader().readText()
        } else {
            throw Exception("HTTP ${conn.responseCode}")
        }
        conn.disconnect()
        response
    }

    /**
     * Sync logini serverga yuborish — Smartup AutoSyncLogTable analogi.
     */
    private suspend fun logSync(
        context: Context,
        serverUrl: String,
        token: String,
        result: SyncResult,
    ) = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("sync_turi", "auto")
                put("entity_soni", result.entitySoni)
                put("yuborilgan_bayt", result.yuborilganBayt)
                put("qabul_qilingan_bayt", result.qabulQilinganBayt)
                put("status_kod", if (result.muvaffaqiyatli) 200 else 500)
                put("tarmoq_turi", getNetworkType(context))
                put("batareya_foiz", getBatteryLevel(context))
                put("xato_xabar", result.xatoXabar ?: "")
                put("muvaffaqiyatli", result.muvaffaqiyatli)
                put("qurilma_info", "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
            }

            val url = URL("$serverUrl/api/config/sync-log")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Content-Type", "application/json")
                connectTimeout = 10000
                doOutput = true
            }
            conn.outputStream.write(json.toString().toByteArray())
            conn.responseCode // trigger
            conn.disconnect()
        } catch (e: Exception) {
            Log.e(TAG, "Sync log yozish xatosi: ${e.message}")
        }
    }

    private fun getNetworkType(context: Context): String {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val nc = cm.getNetworkCapabilities(cm.activeNetwork) ?: return "offline"
        return when {
            nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "mobile"
            else -> "other"
        }
    }

    private fun getBatteryLevel(context: Context): Int {
        val bm = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }
}
