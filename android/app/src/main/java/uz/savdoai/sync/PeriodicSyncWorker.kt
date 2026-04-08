package uz.savdoai.sync

import android.content.Context
import android.os.BatteryManager
import android.util.Log
import androidx.work.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import uz.savdoai.data.repository.SavdoAIRepository
import java.util.concurrent.TimeUnit

/**
 * SavdoAI — Periodic Sync Worker
 * Smartup SyncWorker (634 qator) analogi — WorkManager bilan fon sync.
 *
 * FLOW:
 * 1. Har 15 daqiqada avtomatik ishga tushadi (configurable)
 * 2. Offline queue dagi buyurtmalarni serverga yuboradi
 * 3. Tovar/klient ma'lumotlarini yangilaydi
 * 4. GPS tracks yuboradi
 * 5. Sync log serverga yozadi
 */
class PeriodicSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "SavdoAI_PeriodicSync"
        private const val WORK_NAME = "savdoai_periodic_sync"

        /**
         * Periodic sync ni ishga tushirish.
         * @param intervalMinutes sync intervali (default: 15 daqiqa)
         */
        fun schedule(context: Context, intervalMinutes: Long = 15) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<PeriodicSyncWorker>(
                intervalMinutes, TimeUnit.MINUTES
            ).setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 5, TimeUnit.MINUTES)
                .addTag("savdoai_sync")
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
            Log.d(TAG, "Periodic sync scheduled: every $intervalMinutes min")
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }

        /**
         * Bir martalik sync (manual trigger).
         */
        fun syncNow(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<PeriodicSyncWorker>()
                .setConstraints(constraints)
                .addTag("savdoai_sync_now")
                .build()

            WorkManager.getInstance(context).enqueue(request)
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        Log.d(TAG, "Periodic sync boshlandi...")

        try {
            val repo = SavdoAIRepository.getInstance(applicationContext)

            // 1. Offline queue yuborish
            val queueSent = repo.processSyncQueue()
            Log.d(TAG, "Queue yuborildi: $queueSent")

            // 2. Tovar/Klient yangilash
            repo.syncTovarlar()
            repo.syncKlientlar()

            // 3. Sync log serverga
            val duration = System.currentTimeMillis() - startTime
            val bm = applicationContext.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            val battery = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

            try {
                uz.savdoai.data.api.ApiClient.get().sendSyncLog(mapOf(
                    "sync_turi" to "auto",
                    "entity_soni" to queueSent,
                    "muvaffaqiyatli" to true,
                    "batareya_foiz" to battery,
                    "qurilma_info" to "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}",
                    "tarmoq_turi" to "connected",
                ))
            } catch (_: Exception) {}

            Log.d(TAG, "Periodic sync tugadi: ${duration}ms")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Periodic sync xato: ${e.message}")
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}
