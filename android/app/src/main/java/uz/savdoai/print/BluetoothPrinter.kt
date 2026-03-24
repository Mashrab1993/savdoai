package uz.savdoai.print
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothSocket
import java.io.IOException
import java.util.UUID
object BluetoothPrinter {
    private val SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    sealed class Result { object OK : Result(); data class Err(val msg: String, val retry: Boolean = true) : Result() }
    fun btOn(): Boolean = BluetoothAdapter.getDefaultAdapter()?.isEnabled == true
    fun print(mac: String, data: ByteArray): Result {
        val a = BluetoothAdapter.getDefaultAdapter() ?: return Result.Err("Bluetooth yo'q", false)
        if (!a.isEnabled) return Result.Err("📵 Bluetooth yoqing!", true)
        val dev = try { a.getRemoteDevice(mac) } catch (e: Exception) { return Result.Err("MAC noto'g'ri", false) }
        // 1st try: standard SPP
        try {
            val s = dev.createRfcommSocketToServiceRecord(SPP); a.cancelDiscovery()
            s.connect(); s.outputStream.write(data); s.outputStream.flush(); Thread.sleep(200); s.close()
            return Result.OK
        } catch (e: IOException) {
            // 2nd try: fallback RFCOMM port 1
            try {
                val m = dev.javaClass.getMethod("createRfcommSocket", Int::class.java)
                val s2 = m.invoke(dev, 1) as BluetoothSocket
                s2.connect(); s2.outputStream.write(data); s2.outputStream.flush(); Thread.sleep(200); s2.close()
                return Result.OK
            } catch (e2: Exception) { return Result.Err("🔌 Printer topilmadi. Yoqilganini tekshiring.") }
        }
    }
}
