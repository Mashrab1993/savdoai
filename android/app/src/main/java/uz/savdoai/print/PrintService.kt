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
        private const val CH = "sp"; private const val NID = 42
        fun deepLink(c: Context, jid: String, tok: String, w: Int) {
            val i = Intent(c, PrintService::class.java).apply {
                action = "dl"; putExtra("j", jid); putExtra("t", tok); putExtra("w", w) }
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i) else c.startService(i)
        }
        fun direct(c: Context, b: ByteArray) {
            val i = Intent(c, PrintService::class.java).apply { action = "d"; putExtra("b", b) }
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i) else c.startService(i)
        }
        fun retry(c: Context) { Queue.last(c)?.let { direct(c, it.second) } }
    }
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    override fun onBind(i: Intent?): IBinder? = null
    override fun onCreate() { super.onCreate(); mkCh()
        startForeground(NID, notif("⏳ Tayyorlanmoqda...")) }
    override fun onStartCommand(i: Intent?, f: Int, id: Int): Int {
        when (i?.action) {
            "dl" -> scope.launch { dl(i.getStringExtra("j")!!, i.getStringExtra("t")!!, i.getIntExtra("w",80)) }
            "d" -> scope.launch { val b=i?.getByteArrayExtra("b"); if(b!=null&&b.isNotEmpty()) pr(b,null,null) else end(false,"Ma'lumot yo'q") }
            else -> stopSelf()
        }; return START_NOT_STICKY
    }
    private suspend fun dl(jid: String, tok: String, w: Int) {
        upd("📡 Chek yuklanmoqda...")
        when (val r = PrintApi.fetchEscPos(Prefs.api(this), jid, tok, w)) {
            is PrintApi.R.OK -> { Queue.save(this, jid, r.bytes, tok); pr(r.bytes, jid, tok) }
            is PrintApi.R.Err -> if (r.code == 0) {
                Queue.last(this)?.let { (id, bytes, savedTok) ->
                    upd("📵 Offline...")
                    pr(bytes, id, savedTok.ifBlank { tok })
                } ?: end(false, "Internet yo'q. .bin faylni bosing.")
            } else end(false, r.msg)
        }
    }
    private suspend fun pr(data: ByteArray, jid: String?, tok: String?) {
        val mac = Prefs.mac(this)
        if (mac == null) { end(false, "Printer sozlanmagan!")
            withContext(Dispatchers.Main) { startActivity(Intent(this@PrintService, SetupActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }; return }
        upd("🖨️ Printerga ulanmoqda...")
        val api = Prefs.api(this)
        when (val r = BluetoothPrinter.print(mac, data)) {
            is BluetoothPrinter.Result.OK -> {
                if (jid != null && tok != null) PrintApi.ack(api, jid, true, tok, "")
                end(true, "✅ Chop etildi!")
            }
            is BluetoothPrinter.Result.Err -> {
                if (jid != null && tok != null) PrintApi.ack(api, jid, false, tok, r.msg)
                Queue.save(this, jid ?: "r", data, tok ?: "")
                end(false, r.msg)
            }
        }
    }
    private suspend fun end(ok: Boolean, msg: String) {
        withContext(Dispatchers.Main) { Toast.makeText(this@PrintService, msg, Toast.LENGTH_LONG).show()
            if (ok) { (getSystemService(VIBRATOR_SERVICE) as? Vibrator)?.let {
                if (Build.VERSION.SDK_INT >= 26) it.vibrate(VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE))
                else @Suppress("DEPRECATION") it.vibrate(200) } } }
        upd(msg); delay(2500); stopSelf()
    }
    private fun mkCh() { if (Build.VERSION.SDK_INT >= 26) (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
        .createNotificationChannel(NotificationChannel(CH, "SavdoAI", NotificationManager.IMPORTANCE_LOW)) }
    private fun notif(t: String) = NotificationCompat.Builder(this, CH).setSmallIcon(android.R.drawable.ic_menu_send)
        .setContentTitle("SavdoAI Print").setContentText(t).setPriority(NotificationCompat.PRIORITY_LOW).build()
    private fun upd(t: String) = (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(NID, notif(t))
    override fun onDestroy() { scope.cancel(); super.onDestroy() }
}
