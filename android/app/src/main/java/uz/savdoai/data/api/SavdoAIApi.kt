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

data class TovarResponse(val id: Int, val nomi: String, val shtrix_kod: String?,
    val kategoriya: String?, val brand: String?, val birlik: String?,
    val sotuv_narx: Double?, val tan_narx: Double?, val qoldiq: Double?,
    val foto_url: String?, val sort_index: Int?)

data class KlientResponse(val id: Int, val nom: String, val telefon: String?,
    val manzil: String?, val kategoriya: String?, val latitude: Double?,
    val longitude: Double?, val qarz: Double?)

data class ConfigResponse(val klient: Map<String, Any>?, val buyurtma: Map<String, Any>?,
    val gps: Map<String, Any>?, val printer: Map<String, Any>?,
    val aksiya: Map<String, Any>?, val ombor: Map<String, Any>?,
    val sync: Map<String, Any>?, val umumiy: Map<String, Any>?)

data class SotuvCreateRequest(val klient_id: Int, val tovarlar: List<TovarItem>,
    val tolangan: Double = 0.0, val izoh: String? = null,
    val latitude: Double? = null, val longitude: Double? = null)

data class TovarItem(val tovar_id: Int, val nomi: String, val miqdor: Double,
    val narx: Double, val summa: Double)

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

    // Config
    @GET("/api/config")
    suspend fun getConfig(): Response<ConfigResponse>

    // Tovarlar
    @POST("/api/tovarlar/v2/filtr")
    suspend fun getTovarlar(@Body filtr: Map<String, Any> = emptyMap()): Response<PaginatedResponse<TovarResponse>>

    @GET("/api/tovarlar/v2/kategoriyalar")
    suspend fun getKategoriyalar(): Response<List<Map<String, Any>>>

    // Klientlar
    @GET("/api/v1/klientlar")
    suspend fun getKlientlar(): Response<List<KlientResponse>>

    // Sotuv
    @POST("/api/v1/sotuv")
    suspend fun createSotuv(@Body data: SotuvCreateRequest): Response<Map<String, Any>>

    // Tashrif
    @POST("/api/tashrif/checkin")
    suspend fun checkin(@Body data: CheckinRequest): Response<Map<String, Any>>

    @POST("/api/tashrif/checkout")
    suspend fun checkout(@Body data: CheckinRequest): Response<Map<String, Any>>

    // GPS
    @POST("/api/gps/tracks")
    suspend fun sendGpsTracks(@Body data: GpsTracksRequest): Response<Map<String, Any>>

    // Sync log
    @POST("/api/config/sync-log")
    suspend fun sendSyncLog(@Body data: Map<String, Any>): Response<Map<String, Any>>

    // Marshrut
    @POST("/api/marshrut/optimallashtir")
    suspend fun optimizeRoute(@Body data: Map<String, Any>): Response<Map<String, Any>>

    // Gamification
    @GET("/api/gamification/me")
    suspend fun getMyGameStats(): Response<Map<String, Any>>

    // Live
    @GET("/api/live")
    suspend fun getLiveDashboard(): Response<Map<String, Any>>

    // Daily plan
    @GET("/api/reja/bugun")
    suspend fun getDailyPlan(): Response<Map<String, Any>>
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
