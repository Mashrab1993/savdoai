package uz.savdoai.print

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.*
import android.widget.Toast
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

class PrintService : Service() {
    companion object {
        private const val CH = "sp"
        private const val NID = 42
        fun deepLink(c: Context, jid: String, tok: String, w: Int) {
            val i = Intent(c, PrintService::class.java).apply {
                action = "dl"; putExtra("j", jid); putExtra("t", tok); putExtra("w", w)
            }
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i) else c.startService(i)
        }

        fun direct(c: Context, b: ByteArray) {
            val i = Intent(c, PrintService::class.java).apply { action = "d"; putExtra("b", b) }
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i) else c.startService(i)
        }

        fun retry(c: Context) {
            Queue.last(c)?.let { direct(c, it.second) }
        }
    }

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    override fun onBind(i: Intent?): IBinder? = null
    override fun onCreate() {
        super.onCreate()
        mkCh()
        startForeground(NID, notif("⏳ Tayyorlanmoqda..."))
    }

    override fun onStartCommand(i: Intent?, f: Int, id: Int): Int {
        when (i?.action) {
            "dl" -> scope.launch {
                dl(i.getStringExtra("j")!!, i.getStringExtra("t")!!, i.getIntExtra("w", 80))
            }
            "d" -> scope.launch {
                val b = i.getByteArrayExtra("b")
                if (b != null && b.isNotEmpty()) pr(b, null, null) else end(false, PrintUserMessages.DATA_MISSING)
            }
            else -> stopSelf()
        }
        return START_NOT_STICKY
    }

    private suspend fun dl(jid: String, tok: String, w: Int) {
        val apiBaseUrl = Prefs.api(this)
        PrintLog.i(
            "PrintService dl | apiBaseUrl=$apiBaseUrl jobId=$jid width=$w token=${PrintLog.maskToken(tok)} " +
                "btOn=${BluetoothPrinter.btOn()}"
        )
        upd("📡 Chek yuklanmoqda...")
        when (val r = PrintApi.fetchEscPos(apiBaseUrl, jid, tok, w)) {
            is PrintApi.FetchOutcome.Ok -> {
                Queue.save(this, jid, r.bytes, tok)
                pr(r.bytes, jid, tok)
            }
            is PrintApi.FetchOutcome.Err -> {
                if (r.kind == PrintApi.ErrKind.NETWORK || r.kind == PrintApi.ErrKind.TIMEOUT) {
                    Queue.last(this)?.let { (id, bytes, savedTok) ->
                        upd("📵 Offline...")
                        pr(bytes, id, savedTok.ifBlank { tok })
                    } ?: end(false, PrintUserMessages.OFFLINE_USE_BIN)
                } else {
                    end(false, userMessageFor(r.kind, r.logDetail))
                }
            }
        }
    }

    private fun userMessageFor(kind: PrintApi.ErrKind, detail: String): String = when (kind) {
        PrintApi.ErrKind.SESSION_MISSING -> PrintUserMessages.SESSION_MISSING
        PrintApi.ErrKind.WRONG_HOST_OR_GATEWAY -> PrintUserMessages.WRONG_API_HOST
        PrintApi.ErrKind.UNAUTHORIZED -> PrintUserMessages.UNAUTHORIZED
        PrintApi.ErrKind.ALREADY_PRINTED -> PrintUserMessages.ALREADY_PRINTED
        PrintApi.ErrKind.EXPIRED -> PrintUserMessages.EXPIRED
        PrintApi.ErrKind.EMPTY_PAYLOAD -> PrintUserMessages.EMPTY_RECEIPT
        PrintApi.ErrKind.NETWORK -> PrintUserMessages.NETWORK
        PrintApi.ErrKind.TIMEOUT -> PrintUserMessages.TIMEOUT
        PrintApi.ErrKind.SSL -> PrintUserMessages.SSL
        PrintApi.ErrKind.UNKNOWN_SERVER -> {
            val d = detail.trim()
            if (d.startsWith("http ")) {
                val parts = d.split(" ", limit = 3)
                val code = parts.getOrNull(1)?.toIntOrNull() ?: 0
                val rest = parts.getOrNull(2)?.trim().orEmpty()
                PrintUserMessages.unknownServer(code, rest)
            } else {
                PrintUserMessages.SERVER_ERROR
            }
        }
    }

    private suspend fun pr(data: ByteArray, jid: String?, tok: String?) {
        val mac = Prefs.mac(this)
        if (mac == null) {
            end(false, PrintUserMessages.PRINTER_NOT_CONFIGURED)
            withContext(Dispatchers.Main) {
                startActivity(
                    Intent(this@PrintService, SetupActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            }
            return
        }
        if (!BluetoothPrinter.btOn()) {
            end(false, PrintUserMessages.BLUETOOTH_OFF)
            return
        }
        upd("🖨️ Printerga ulanmoqda...")
        val api = Prefs.api(this)
        when (val r = BluetoothPrinter.print(mac, data)) {
            is BluetoothPrinter.Result.OK -> {
                if (jid != null && tok != null) PrintApi.ack(api, jid, true, tok, "")
                PrintLog.i("print complete | jobId=${jid ?: "-"} ok=true")
                end(true, "✅ ${PrintUserMessages.PRINT_OK}")
            }
            is BluetoothPrinter.Result.Err -> {
                if (jid != null && tok != null) PrintApi.ack(api, jid, false, tok, r.msg)
                Queue.save(this, jid ?: "r", data, tok ?: "")
                PrintLog.w("print failed | jobId=${jid ?: "-"} msg=${r.msg}")
                end(false, r.msg)
            }
        }
    }

    private suspend fun end(ok: Boolean, msg: String) {
        withContext(Dispatchers.Main) {
            Toast.makeText(this@PrintService, msg, Toast.LENGTH_LONG).show()
            if (ok) {
                (getSystemService(VIBRATOR_SERVICE) as? Vibrator)?.let {
                    if (Build.VERSION.SDK_INT >= 26) {
                        it.vibrate(VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        it.vibrate(200)
                    }
                }
            }
        }
        upd(msg)
        delay(2500)
        stopSelf()
    }

    private fun mkCh() {
        if (Build.VERSION.SDK_INT >= 26) {
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(NotificationChannel(CH, "SavdoAI", NotificationManager.IMPORTANCE_LOW))
        }
    }

    private fun notif(t: String) = NotificationCompat.Builder(this, CH).setSmallIcon(android.R.drawable.ic_menu_send)
        .setContentTitle("SavdoAI Print").setContentText(t).setPriority(NotificationCompat.PRIORITY_LOW).build()

    private fun upd(t: String) = (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(NID, notif(t))
    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
}
