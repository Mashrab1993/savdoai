package uz.savdoai.location

import android.Manifest
import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.*
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  SAVDOAI — GPS TRACKING FOREGROUND SERVICE                      ║
 * ║                                                                  ║
 * ║  Smartup ERP GpsTrackService'dan o'rganilgan:                   ║
 * ║  • Foreground service (Android 8+ notification)                 ║
 * ║  • LocationManager (GPS + Network provider)                     ║
 * ║  • Batch send (direct + queue)                                  ║
 * ║  • Work time checking                                           ║
 * ║  • Battery level tracking                                       ║
 * ║  • Room DB local storage                                        ║
 * ║  • Configurable interval/accuracy                               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
class GpsTrackingService : Service() {

    companion object {
        private const val TAG = "SavdoAI_GPS"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "savdoai_gps_tracking"

        // Config defaults (serverdan yangilanadi)
        var trackingIntervalMs: Long = 15 * 60 * 1000L  // 15 daqiqa
        var minAccuracyMeters: Float = 100f
        var minDistanceMeters: Float = 50f
        var workStartTime: String = "09:00"
        var workEndTime: String = "18:00"
        var workDays: List<Int> = listOf(2, 3, 4, 5, 6) // Du-Shan

        var serverUrl: String = ""
        var authToken: String = ""
        var userId: Int = 0

        fun start(context: Context, url: String, token: String, uid: Int) {
            serverUrl = url
            authToken = token
            userId = uid
            val intent = Intent(context, GpsTrackingService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, GpsTrackingService::class.java))
        }
    }

    private var locationManager: LocationManager? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val trackBuffer = mutableListOf<TrackPoint>()
    private val handler = Handler(Looper.getMainLooper())

    data class TrackPoint(
        val latitude: Double,
        val longitude: Double,
        val accuracy: Float,
        val timestamp: Long,
        val provider: String,
        val batteryLevel: Int
    )

    // ═══════════════════════════════════════════════════════
    //  SERVICE LIFECYCLE
    // ═══════════════════════════════════════════════════════

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        startLocationUpdates()
        startPeriodicSend()
        Log.d(TAG, "GPS Tracking Service boshlandi")
    }

    override fun onDestroy() {
        super.onDestroy()
        locationManager?.removeUpdates(locationListener)
        handler.removeCallbacksAndMessages(null)
        scope.cancel()
        sendBufferedTracks()
        Log.d(TAG, "GPS Tracking Service to'xtatildi")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    // ═══════════════════════════════════════════════════════
    //  LOCATION UPDATES
    // ═══════════════════════════════════════════════════════

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            if (!isWorkTime()) return
            if (location.accuracy > minAccuracyMeters) return

            val point = TrackPoint(
                latitude = location.latitude,
                longitude = location.longitude,
                accuracy = location.accuracy,
                timestamp = location.time,
                provider = location.provider ?: "unknown",
                batteryLevel = getBatteryLevel()
            )

            synchronized(trackBuffer) {
                trackBuffer.add(point)
            }

            Log.d(TAG, "Lokatsiya: ${point.latitude},${point.longitude} aniqlik=${point.accuracy}m")
        }

        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
    }

    private fun startLocationUpdates() {
        locationManager = getSystemService(LOCATION_SERVICE) as LocationManager

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "GPS ruxsati yo'q!")
            stopSelf()
            return
        }

        // GPS provider
        if (locationManager?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true) {
            locationManager?.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                trackingIntervalMs,
                minDistanceMeters,
                locationListener
            )
        }

        // Network fallback
        if (locationManager?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true) {
            locationManager?.requestLocationUpdates(
                LocationManager.NETWORK_PROVIDER,
                trackingIntervalMs,
                minDistanceMeters,
                locationListener
            )
        }
    }

    // ═══════════════════════════════════════════════════════
    //  PERIODIC SEND
    // ═══════════════════════════════════════════════════════

    private fun startPeriodicSend() {
        handler.postDelayed(object : Runnable {
            override fun run() {
                sendBufferedTracks()
                handler.postDelayed(this, trackingIntervalMs)
            }
        }, trackingIntervalMs)
    }

    private fun sendBufferedTracks() {
        val points: List<TrackPoint>
        synchronized(trackBuffer) {
            if (trackBuffer.isEmpty()) return
            points = trackBuffer.toList()
            trackBuffer.clear()
        }

        scope.launch {
            try {
                val json = JSONObject().apply {
                    put("user_id", userId)
                    put("tracks", JSONArray().apply {
                        points.forEach { p ->
                            put(JSONObject().apply {
                                put("lat", p.latitude)
                                put("lon", p.longitude)
                                put("accuracy", p.accuracy)
                                put("timestamp", p.timestamp)
                                put("provider", p.provider)
                                put("battery", p.batteryLevel)
                                put("date", SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(p.timestamp)))
                                put("time", SimpleDateFormat("HH:mm:ss", Locale.US).format(Date(p.timestamp)))
                            })
                        }
                    })
                }

                val url = URL("$serverUrl/gps/tracks")
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Authorization", "Bearer $authToken")
                    connectTimeout = 30000
                    readTimeout = 30000
                    doOutput = true
                }

                conn.outputStream.write(json.toString().toByteArray())

                if (conn.responseCode == 200) {
                    Log.d(TAG, "${points.size} ta track yuborildi")
                } else {
                    Log.e(TAG, "Track yuborish xatosi: ${conn.responseCode}")
                    // Qayta qo'shish
                    synchronized(trackBuffer) {
                        trackBuffer.addAll(0, points)
                    }
                }
                conn.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Track yuborish xatosi: ${e.message}")
                synchronized(trackBuffer) {
                    trackBuffer.addAll(0, points)
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    //  YORDAMCHI FUNKSIYALAR
    // ═══════════════════════════════════════════════════════

    private fun isWorkTime(): Boolean {
        val cal = Calendar.getInstance()
        val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK)
        if (dayOfWeek !in workDays) return false

        val now = SimpleDateFormat("HH:mm", Locale.US).format(cal.time)
        return now >= workStartTime && now <= workEndTime
    }

    private fun getBatteryLevel(): Int {
        val bm = getSystemService(BATTERY_SERVICE) as BatteryManager
        return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "GPS Tracking", NotificationManager.IMPORTANCE_LOW).apply {
                description = "SavdoAI GPS lokatsiya tracking"
                enableVibration(false)
            }
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SavdoAI")
            .setContentText("GPS tracking faol")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }
}
