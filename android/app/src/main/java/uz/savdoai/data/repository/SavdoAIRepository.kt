package uz.savdoai.data.repository

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.Flow
import org.json.JSONObject
import uz.savdoai.data.*
import uz.savdoai.data.api.ApiClient
import uz.savdoai.data.api.SotuvCreateRequest
import uz.savdoai.data.api.TovarItem

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SAVDOAI — REPOSITORY + OFFLINE MANAGER                         ║
 * ║                                                                  ║
 * ║  SD Agent RealmController + SyncActivity analogi                 ║
 * ║  Smartup SyncWorker analogi                                      ║
 * ║                                                                  ║
 * ║  STRATEGIYA:                                                     ║
 * ║  1. Tovar/Klient → Server dan yuklab lokal DB ga saqlash        ║
 * ║  2. Buyurtma → Lokal yaratish, keyinroq sync                    ║
 * ║  3. Offline queue → Internet bo'lganda avtomatik yuborish        ║
 * ║  4. Conflict resolution → Server wins (last-write-wins)         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
class SavdoAIRepository(private val context: Context) {

    companion object {
        private const val TAG = "SavdoAI_Repo"

        @Volatile private var INSTANCE: SavdoAIRepository? = null
        fun getInstance(context: Context): SavdoAIRepository {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SavdoAIRepository(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    private val db = SavdoAIDatabase.getInstance(context)
    private val tovarDao = db.tovarDao()
    private val klientDao = db.klientDao()
    private val buyurtmaDao = db.buyurtmaDao()
    private val syncQueueDao = db.syncQueueDao()
    private val checkinDao = db.checkinDao()
    private val gpsDao = db.gpsTrackDao()

    // ═══════════════════════════════════════════════════
    //  TOVARLAR
    // ═══════════════════════════════════════════════════

    fun getTovarlar(): Flow<List<TovarEntity>> = tovarDao.getAll()
    fun searchTovarlar(q: String): Flow<List<TovarEntity>> = tovarDao.search(q)
    fun kamQoldiq(): Flow<List<TovarEntity>> = tovarDao.kamQoldiq()
    suspend fun findByBarcode(code: String): TovarEntity? = tovarDao.findByBarcode(code)
    suspend fun kategoriyalar(): List<String> = tovarDao.kategoriyalar()

    suspend fun syncTovarlar(): Result<Int> = runCatching {
        val response = ApiClient.get().getTovarlar()
        if (response.isSuccessful) {
            val items = response.body()?.tovarlar?.map { r ->
                TovarEntity(id = r.id, nomi = r.nomi, shtrix_kod = r.shtrix_kod,
                    kategoriya = r.kategoriya, brand = r.brand, birlik = r.birlik ?: "dona",
                    sotuv_narx = r.sotuv_narx ?: 0.0, tan_narx = r.tan_narx ?: 0.0,
                    qoldiq = r.qoldiq ?: 0.0, foto_url = r.foto_url, sort_index = r.sort_index ?: 0)
            } ?: emptyList()
            tovarDao.insertAll(items)
            Log.d(TAG, "Tovarlar synced: ${items.size}")
            items.size
        } else throw Exception("HTTP ${response.code()}")
    }

    // ═══════════════════════════════════════════════════
    //  KLIENTLAR
    // ═══════════════════════════════════════════════════

    fun getKlientlar(): Flow<List<KlientEntity>> = klientDao.getAll()
    fun searchKlientlar(q: String): Flow<List<KlientEntity>> = klientDao.search(q)
    fun qarzdorlar(): Flow<List<KlientEntity>> = klientDao.qarzdorlar()
    suspend fun getKlientById(id: Int): KlientEntity? = klientDao.getById(id)

    suspend fun syncKlientlar(): Result<Int> = runCatching {
        val response = ApiClient.get().getKlientlar()
        if (response.isSuccessful) {
            val items = response.body()?.map { r ->
                KlientEntity(id = r.id, nom = r.nom, telefon = r.telefon,
                    manzil = r.manzil, kategoriya = r.kategoriya,
                    latitude = r.latitude, longitude = r.longitude, qarz = r.qarz ?: 0.0)
            } ?: emptyList()
            klientDao.insertAll(items)
            Log.d(TAG, "Klientlar synced: ${items.size}")
            items.size
        } else throw Exception("HTTP ${response.code()}")
    }

    // ═══════════════════════════════════════════════════
    //  BUYURTMALAR (OFFLINE-FIRST)
    // ═══════════════════════════════════════════════════

    fun getBuyurtmalar(): Flow<List<BuyurtmaEntity>> = buyurtmaDao.getAll()

    /**
     * Buyurtma yaratish — lokal DB ga yozib, sync queue ga qo'shish.
     * Internet bo'lmasa ham ishlaydi!
     */
    suspend fun buyurtmaYaratish(
        klientId: Int,
        klientNomi: String,
        tovarlar: List<BuyurtmaTovarEntity>,
        tolangan: Double = 0.0,
        nasiya: Boolean = false,
        izoh: String? = null,
        lat: Double? = null,
        lon: Double? = null,
    ): Long {
        val jami = tovarlar.sumOf { it.summa }
        val qarz = jami - tolangan

        // 1. Buyurtma yaratish
        val buyurtma = BuyurtmaEntity(
            klient_id = klientId, klient_nomi = klientNomi,
            jami_summa = jami, tolangan = tolangan, qarz = qarz,
            nasiya = nasiya, izoh = izoh, latitude = lat, longitude = lon,
            holat = "confirmed"
        )
        val buyurtmaId = buyurtmaDao.insert(buyurtma).toInt()

        // 2. Tovarlar qo'shish
        for (t in tovarlar) {
            buyurtmaDao.insertTovar(t.copy(buyurtma_id = buyurtmaId))
            // Lokal qoldiqni kamaytirish
            tovarDao.qoldiqKamaytir(t.tovar_id, t.miqdor)
        }

        // 3. Sync queue ga qo'shish
        val data = JSONObject().apply {
            put("buyurtma_id", buyurtmaId)
            put("klient_id", klientId)
            put("jami_summa", jami)
            put("tolangan", tolangan)
            put("izoh", izoh ?: "")
            put("tovarlar", tovarlar.map {
                mapOf("tovar_id" to it.tovar_id, "nomi" to it.tovar_nomi,
                    "miqdor" to it.miqdor, "narx" to it.narx, "summa" to it.summa)
            }.toString())
        }
        syncQueueDao.insert(SyncQueueEntity(turi = "buyurtma", data_json = data.toString()))

        Log.d(TAG, "Buyurtma yaratildi: id=$buyurtmaId klient=$klientNomi jami=$jami")
        return buyurtmaId.toLong()
    }

    /**
     * Buyurtma bekor qilish — qoldiqni qaytarish (SD Agent noSaveOrder).
     */
    suspend fun buyurtmaBekor(buyurtmaId: Int) {
        val tovarlar = buyurtmaDao.getTovarlar(buyurtmaId)
        for (t in tovarlar) {
            tovarDao.qoldiqQaytarish(t.tovar_id, t.miqdor)
        }
        buyurtmaDao.updateHolat(buyurtmaId, "bekor")
        Log.d(TAG, "Buyurtma bekor qilindi: id=$buyurtmaId, ${tovarlar.size} tovar qoldiq qaytarildi")
    }

    // ═══════════════════════════════════════════════════
    //  CHECK-IN/OUT
    // ═══════════════════════════════════════════════════

    suspend fun checkin(klientId: Int, lat: Double?, lon: Double?, acc: Float?): Long {
        val entity = CheckinEntity(klient_id = klientId, turi = "checkin",
            latitude = lat, longitude = lon, accuracy = acc)
        val id = checkinDao.insert(entity)

        // Sync queue ga qo'shish
        syncQueueDao.insert(SyncQueueEntity(turi = "checkin",
            data_json = """{"klient_id":$klientId,"latitude":$lat,"longitude":$lon}"""))

        return id
    }

    suspend fun checkout(klientId: Int, lat: Double?, lon: Double?): Long {
        val entity = CheckinEntity(klient_id = klientId, turi = "checkout",
            latitude = lat, longitude = lon)
        return checkinDao.insert(entity)
    }

    // ═══════════════════════════════════════════════════
    //  OFFLINE SYNC QUEUE
    // ═══════════════════════════════════════════════════

    fun pendingCount(): Flow<Int> = syncQueueDao.pendingCount()

    /**
     * Queue dagi barcha kutilayotgan elementlarni serverga yuborish.
     */
    suspend fun processSyncQueue(): Int {
        val pending = syncQueueDao.getPending()
        var sent = 0

        for (item in pending) {
            try {
                syncQueueDao.updateStatus(item.id, "yuborilmoqda")

                val success = when (item.turi) {
                    "buyurtma" -> sendBuyurtma(item)
                    "checkin" -> sendCheckin(item)
                    else -> false
                }

                if (success) {
                    syncQueueDao.updateStatus(item.id, "yuborildi")
                    sent++
                } else {
                    syncQueueDao.updateStatus(item.id, "xato", xato = "Server rad etdi")
                }
            } catch (e: Exception) {
                val holat = if (item.urinish_soni >= item.max_urinish - 1) "xato" else "kutilmoqda"
                syncQueueDao.updateStatus(item.id, holat, xato = e.message)
                Log.e(TAG, "Sync queue xato: ${item.turi} - ${e.message}")
            }
        }

        if (sent > 0) syncQueueDao.clearCompleted()
        return sent
    }

    private suspend fun sendBuyurtma(item: SyncQueueEntity): Boolean {
        val json = JSONObject(item.data_json)
        val klientId = json.getInt("klient_id")
        // Simplified — in production, parse tovarlar from JSON
        val response = ApiClient.get().createSotuv(SotuvCreateRequest(
            klient_id = klientId,
            tovarlar = emptyList(), // TODO: parse from JSON
            tolangan = json.optDouble("tolangan", 0.0),
            izoh = json.optString("izoh")
        ))
        return response.isSuccessful
    }

    private suspend fun sendCheckin(item: SyncQueueEntity): Boolean {
        val json = JSONObject(item.data_json)
        val response = ApiClient.get().checkin(uz.savdoai.data.api.CheckinRequest(
            klient_id = json.getInt("klient_id"),
            latitude = json.optDouble("latitude"),
            longitude = json.optDouble("longitude")
        ))
        return response.isSuccessful
    }

    // ═══════════════════════════════════════════════════
    //  TO'LIQ SYNC
    // ═══════════════════════════════════════════════════

    /**
     * To'liq sinxronizatsiya — SD Agent SyncActivity analogi.
     * 1. Config yuklab olish
     * 2. Tovarlar sync
     * 3. Klientlar sync
     * 4. Offline queue ni yuborish
     * 5. GPS tracks yuborish
     */
    suspend fun fullSync(): Result<Map<String, Int>> = runCatching {
        val results = mutableMapOf<String, Int>()

        // 1. Config
        uz.savdoai.config.ConfigManager.sync(
            ApiClient.get().toString(), "" // Already configured
        )

        // 2. Tovarlar
        syncTovarlar().onSuccess { results["tovarlar"] = it }

        // 3. Klientlar
        syncKlientlar().onSuccess { results["klientlar"] = it }

        // 4. Offline queue
        results["queue"] = processSyncQueue()

        // 5. GPS
        val gpsTracks = gpsDao.getUnsynced()
        if (gpsTracks.isNotEmpty()) {
            val tracks = gpsTracks.map { t ->
                uz.savdoai.data.api.GpsTrack(
                    lat = t.latitude, lon = t.longitude, accuracy = t.accuracy,
                    timestamp = t.timestamp, provider = t.provider, battery = t.battery_level
                )
            }
            try {
                ApiClient.get().sendGpsTracks(
                    uz.savdoai.data.api.GpsTracksRequest(user_id = 0, tracks = tracks)
                )
                gpsDao.markSynced(gpsTracks.map { it.id })
                results["gps"] = gpsTracks.size
            } catch (e: Exception) {
                Log.e(TAG, "GPS sync xato: ${e.message}")
            }
        }

        Log.d(TAG, "Full sync natija: $results")
        results
    }
}
