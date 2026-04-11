package uz.savdoai.data.api

import org.json.JSONObject
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import okhttp3.OkHttpClient
import okhttp3.Interceptor
import java.util.concurrent.TimeUnit

/**
 * SavdoAI — Retrofit API Interface
 * SD Agent ApiInterface (75+ endpoint) analogi
 */

// ═══════════════════════════════════════════════════════
//  DATA MODELS (API responses)
// ═══════════════════════════════════════════════════════

// NOTE: Backend column names — brend/sotish_narxi/olish_narxi/rasm_url/saralash
data class TovarResponse(val id: Int, val nomi: String, val shtrix_kod: String?,
    val kategoriya: String?, val brend: String?, val birlik: String?,
    val sotish_narxi: Double?, val olish_narxi: Double?, val qoldiq: Double?,
    val rasm_url: String?, val saralash: Int?) {
    // Back-compat aliases for old references
    val brand: String? get() = brend
    val sotuv_narx: Double? get() = sotish_narxi
    val tan_narx: Double? get() = olish_narxi
    val foto_url: String? get() = rasm_url
    val sort_index: Int? get() = saralash
}

// Backend column is `ism` not `nom`; klientlar has no lat/lng; qarz via join
data class KlientResponse(val id: Int, val ism: String, val telefon: String?,
    val manzil: String?, val kategoriya: String?,
    val jami_sotib: Double?, val aktiv_qarz: Double?) {
    val nom: String get() = ism
    val qarz: Double? get() = aktiv_qarz
}

data class ConfigResponse(val klient: Map<String, Any>?, val buyurtma: Map<String, Any>?,
    val gps: Map<String, Any>?, val printer: Map<String, Any>?,
    val aksiya: Map<String, Any>?, val ombor: Map<String, Any>?,
    val sync: Map<String, Any>?, val umumiy: Map<String, Any>?)

// Backend SotuvSo_rov: klient (string name), tovarlar list, jami_summa,
// tolangan, qarz, izoh. klient_id resolved server-side by name upsert.
data class SotuvCreateRequest(
    val klient: String? = null,
    val tovarlar: List<TovarItem>,
    val jami_summa: Double = 0.0,
    val tolangan: Double = 0.0,
    val qarz: Double = 0.0,
    val izoh: String? = null
)

// Backend chiqimlar expects: nomi, miqdor, birlik, narx, kategoriya
data class TovarItem(
    val nomi: String,
    val miqdor: Double,
    val birlik: String = "dona",
    val narx: Double,
    val kategoriya: String = "Boshqa"
)

data class CheckinRequest(val klient_id: Int, val latitude: Double? = null,
    val longitude: Double? = null, val accuracy: Float? = null)

data class GpsTracksRequest(val user_id: Int, val tracks: List<GpsTrack>)
data class GpsTrack(val lat: Double, val lon: Double, val accuracy: Float,
    val timestamp: Long, val provider: String, val battery: Int)

data class ApiResult<T>(val muvaffaqiyat: Boolean = true, val data: T? = null,
    val xato: String? = null)

data class PaginatedResponse<T>(val tovarlar: List<T>?, val jami: Int?, val sahifa: Int?)

// ═══════════════════════════════════════════════════════
//  API INTERFACE
// ═══════════════════════════════════════════════════════

interface SavdoAIApi {

    // Config — backend /config (no /api prefix)
    @GET("/config")
    suspend fun getConfig(): Response<ConfigResponse>

    // Tovarlar — backend uses /api/v1/tovarlar for main CRUD;
    // /tovarlar/v2/* for advanced filters
    @POST("/tovarlar/v2/filtr")
    suspend fun getTovarlar(@Body filtr: Map<String, Any> = emptyMap()): Response<PaginatedResponse<TovarResponse>>

    @GET("/tovarlar/v2/kategoriyalar")
    suspend fun getKategoriyalar(): Response<List<Map<String, Any>>>

    // Klientlar
    @GET("/api/v1/klientlar")
    suspend fun getKlientlar(): Response<Map<String, Any>>

    // Sotuv
    @POST("/api/v1/sotuv")
    suspend fun createSotuv(@Body data: SotuvCreateRequest): Response<Map<String, Any>>

    // Tashrif — backend /tashrif (no /api prefix)
    @POST("/tashrif/checkin")
    suspend fun checkin(@Body data: CheckinRequest): Response<Map<String, Any>>

    @POST("/tashrif/checkout")
    suspend fun checkout(@Body data: CheckinRequest): Response<Map<String, Any>>

    // GPS — backend /gps/tracks
    @POST("/gps/tracks")
    suspend fun sendGpsTracks(@Body data: GpsTracksRequest): Response<Map<String, Any>>

    // Sync log — backend /config/sync-log
    @POST("/config/sync-log")
    suspend fun sendSyncLog(@Body data: Map<String, Any>): Response<Map<String, Any>>

    // Marshrut — backend /marshrut
    @POST("/marshrut/optimallashtir")
    suspend fun optimizeRoute(@Body data: Map<String, Any>): Response<Map<String, Any>>

    // Gamification — backend /gamification
    @GET("/gamification/me")
    suspend fun getMyGameStats(): Response<Map<String, Any>>

    @GET("/gamification/leaderboard")
    suspend fun getLeaderboard(@Query("davr") davr: String = "hafta"): Response<List<Map<String, Any>>>

    // Live dashboard — renamed from /live (which is k8s probe) to /live-dashboard
    @GET("/live-dashboard")
    suspend fun getLiveDashboard(): Response<Map<String, Any>>

    // Daily plan
    @GET("/reja/bugun")
    suspend fun getDailyPlan(): Response<Map<String, Any>>

    // Dashboard
    @GET("/api/v1/dashboard")
    suspend fun getDashboard(): Response<Map<String, Any>>

    // RFM report
    @GET("/api/v1/reports/rfm")
    suspend fun getRfmReport(): Response<Map<String, Any>>

    // Ombor prognoz
    @GET("/api/v1/ombor/prognoz")
    suspend fun getOmborPrognoz(@Query("kunlar") kunlar: Int = 30): Response<Map<String, Any>>

    // Kirim
    @POST("/api/v1/kirim")
    suspend fun createKirim(@Body data: Map<String, Any>): Response<Map<String, Any>>

    // Qarz to'lash
    @POST("/api/v1/qarz/tolash")
    suspend fun payDebt(@Body data: Map<String, Any>): Response<Map<String, Any>>
}

// ═══════════════════════════════════════════════════════
//  API CLIENT FACTORY
// ═══════════════════════════════════════════════════════

object ApiClient {
    private var api: SavdoAIApi? = null
    private var baseUrl: String = ""
    private var token: String = ""

    fun init(url: String, authToken: String) {
        baseUrl = url.trimEnd('/')
        token = authToken

        val authInterceptor = Interceptor { chain ->
            val request = chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Content-Type", "application/json")
                .build()
            chain.proceed(request)
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        api = retrofit.create(SavdoAIApi::class.java)
    }

    fun get(): SavdoAIApi = api ?: throw IllegalStateException("ApiClient.init() chaqirilmagan!")

    fun updateToken(newToken: String) { token = newToken; init(baseUrl, newToken) }
}
