package uz.savdoai.config

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * SavdoAI — Server Config Manager
 *
 * Server konfiguratsiyasini yuklash, keshlash va qo'llash.
 * SD Agent PreferencesManager + ConfigResponse analogi.
 */
object ConfigManager {
    private const val TAG = "SavdoAI_Config"
    private const val PREFS_NAME = "savdoai_config"
    private const val KEY_CONFIG_JSON = "config_json"
    private const val KEY_LAST_SYNC = "config_last_sync"

    private var prefs: SharedPreferences? = null
    private var cachedConfig: JSONObject? = null

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val saved = prefs?.getString(KEY_CONFIG_JSON, null)
        if (saved != null) {
            try { cachedConfig = JSONObject(saved) } catch (_: Exception) {}
        }
    }

    /**
     * Serverdan config yuklash va keshlash.
     */
    suspend fun sync(serverUrl: String, token: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val url = URL("$serverUrl/config")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                setRequestProperty("Authorization", "Bearer $token")
                connectTimeout = 15000
                readTimeout = 15000
            }

            if (conn.responseCode == 200) {
                val json = conn.inputStream.bufferedReader().readText()
                cachedConfig = JSONObject(json)
                prefs?.edit()
                    ?.putString(KEY_CONFIG_JSON, json)
                    ?.putLong(KEY_LAST_SYNC, System.currentTimeMillis())
                    ?.apply()
                Log.d(TAG, "Config yangilandi")
                conn.disconnect()
                return@withContext true
            }
            conn.disconnect()
            false
        } catch (e: Exception) {
            Log.e(TAG, "Config sync xatosi: ${e.message}")
            false
        }
    }

    // ═══════════════════════════════════════════════════════
    //  CONFIG O'QISH METODLARI
    // ═══════════════════════════════════════════════════════

    fun getConfig(): JSONObject = cachedConfig ?: JSONObject()

    fun getBuyurtmaConfig(): JSONObject =
        getConfig().optJSONObject("buyurtma") ?: JSONObject()

    fun getKlientConfig(): JSONObject =
        getConfig().optJSONObject("klient") ?: JSONObject()

    fun getGpsConfig(): JSONObject =
        getConfig().optJSONObject("gps") ?: JSONObject()

    fun getPrinterConfig(): JSONObject =
        getConfig().optJSONObject("printer") ?: JSONObject()

    // ═══ Buyurtma sozlamalari ═══
    fun isCheckinMajburiy(): Boolean = getBuyurtmaConfig().optBoolean("checkin_majburiy", false)
    fun isFotoMajburiy(): Boolean = getBuyurtmaConfig().optBoolean("foto_majburiy", false)
    fun isGpsMajburiy(): Boolean = getBuyurtmaConfig().optBoolean("lokatsiyani_tekshirish", false)
    fun isNasiyagaRuxsat(): Boolean = getBuyurtmaConfig().optBoolean("nasiyaga_ruxsat", true)
    fun getMinSumma(): Double = getBuyurtmaConfig().optDouble("min_summa", 0.0)
    fun isQarzCheki(): Boolean = getBuyurtmaConfig().optBoolean("qarz_cheki", true)

    // ═══ GPS sozlamalari ═══
    fun isGpsYoqilgan(): Boolean = getGpsConfig().optBoolean("gps_yoqilgan", false)
    fun getTrackingInterval(): Long = getGpsConfig().optLong("tracking_interval_daqiqa", 15) * 60 * 1000
    fun getIshBoshlashi(): String = getGpsConfig().optString("ish_vaqti_boshlanishi", "09:00")
    fun getIshTugashi(): String = getGpsConfig().optString("ish_vaqti_tugashi", "18:00")

    // ═══ Printer sozlamalari ═══
    fun isPrinterYoqilgan(): Boolean = getPrinterConfig().optBoolean("printer_yoqilgan", true)
    fun getPrinterKengligi(): Int = getPrinterConfig().optInt("printer_kengligi", 80)

    // ═══ Klient form fieldlari ═══
    fun isKlientFieldMajburiy(field: String): Boolean =
        getKlientConfig().optBoolean("${field}_majburiy", false)

    fun isKlientFieldFaol(field: String): Boolean =
        getKlientConfig().optBoolean("${field}_faol", true)

    fun getLastSyncTime(): Long = prefs?.getLong(KEY_LAST_SYNC, 0) ?: 0
}
