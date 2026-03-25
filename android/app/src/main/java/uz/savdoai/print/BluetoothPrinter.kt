package uz.savdoai.print

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import java.io.IOException
import java.util.UUID

object BluetoothPrinter {
    private val SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    sealed class Result {
        object OK : Result()
        data class Err(val msg: String, val retry: Boolean = true) : Result()
    }

    /** Android 12+ uchun BluetoothManager, eski versiyalar uchun getDefaultAdapter. */
    private fun getAdapter(ctx: Context? = null): BluetoothAdapter? {
        if (android.os.Build.VERSION.SDK_INT >= 31 && ctx != null) {
            val mgr = ctx.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
            return mgr?.adapter
        }
        @Suppress("DEPRECATION")
        return BluetoothAdapter.getDefaultAdapter()
    }

    fun btOn(ctx: Context? = null): Boolean = getAdapter(ctx)?.isEnabled == true

    fun print(mac: String, data: ByteArray, ctx: Context? = null): Result {
        val a = getAdapter(ctx)
            ?: return Result.Err(PrintUserMessages.BLUETOOTH_MISSING, false)
        if (!a.isEnabled) return Result.Err(PrintUserMessages.BLUETOOTH_OFF, true)
        val dev = try {
            a.getRemoteDevice(mac)
        } catch (e: Exception) {
            return Result.Err(PrintUserMessages.MAC_INVALID, false)
        }
        try {
            val s = dev.createRfcommSocketToServiceRecord(SPP)
            a.cancelDiscovery()
            s.connect()
            s.outputStream.write(data)
            s.outputStream.flush()
            Thread.sleep(200)
            s.close()
            return Result.OK
        } catch (e: IOException) {
            try {
                val m = dev.javaClass.getMethod("createRfcommSocket", Int::class.java)
                val s2 = m.invoke(dev, 1) as BluetoothSocket
                s2.connect()
                s2.outputStream.write(data)
                s2.outputStream.flush()
                Thread.sleep(200)
                s2.close()
                return Result.OK
            } catch (e2: Exception) {
                return Result.Err(PrintUserMessages.PRINTER_CONNECT_FAILED, true)
            }
        }
    }
}
