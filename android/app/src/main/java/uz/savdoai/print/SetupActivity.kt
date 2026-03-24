package uz.savdoai.print

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.content.pm.PackageManager
import android.os.*
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class SetupActivity : AppCompatActivity() {
    private lateinit var tv: TextView
    private lateinit var lv: ListView
    private lateinit var btnTest: Button
    private lateinit var btnSave: Button
    private lateinit var rg: RadioGroup
    private var selMac: String? = null
    private var selName: String? = null

    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        val l = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(32, 48, 32, 32) }
        l.addView(TextView(this).apply { text = "🖨️ Printer sozlash"; textSize = 24f; setPadding(0, 0, 0, 24) })
        tv = TextView(this).apply { textSize = 16f; setPadding(0, 0, 0, 16) }
        l.addView(tv)
        lv = ListView(this).apply {
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f)
        }
        l.addView(lv)
        rg = RadioGroup(this).apply {
            orientation = RadioGroup.HORIZONTAL
            setPadding(0, 16, 0, 16)
            addView(RadioButton(this@SetupActivity).apply { text = "📏 80mm"; id = 80; textSize = 16f; isChecked = true })
            addView(RadioButton(this@SetupActivity).apply { text = "📏 58mm"; id = 58; textSize = 16f })
        }
        l.addView(rg)
        btnTest = Button(this).apply {
            text = "🧪 Test chek (encoding)"
            textSize = 18f
            minimumHeight = 120
            isEnabled = false
            setOnClickListener { testPrint() }
        }
        l.addView(btnTest)
        btnSave = Button(this).apply {
            text = "✅ SAQLASH"
            textSize = 20f
            minimumHeight = 140
            isEnabled = false
            setOnClickListener { save() }
        }
        l.addView(btnSave)
        l.addView(
            TextView(this).apply {
                textSize = 11f
                setPadding(0, 16, 0, 0)
                setTextColor(0xFF666666.toInt())
                text = "API: ${Prefs.api(this@SetupActivity)}"
            }
        )
        setContentView(l)
        checkPerms()
    }

    private fun checkPerms() {
        val need = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= 31) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                need.add(Manifest.permission.BLUETOOTH_CONNECT)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                need.add(Manifest.permission.BLUETOOTH_SCAN)
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                need.add(Manifest.permission.ACCESS_FINE_LOCATION)
            }
        }
        if (need.isNotEmpty()) ActivityCompat.requestPermissions(this, need.toTypedArray(), 100) else scan()
    }

    override fun onRequestPermissionsResult(c: Int, p: Array<String>, r: IntArray) {
        super.onRequestPermissionsResult(c, p, r)
        if (r.all { it == PackageManager.PERMISSION_GRANTED }) scan() else tv.text = "⚠️ Ruxsat kerak!"
    }

    private fun scan() {
        val a = BluetoothAdapter.getDefaultAdapter()
        if (a == null) {
            tv.text = "❌ ${PrintUserMessages.BLUETOOTH_MISSING}"
            return
        }
        if (!a.isEnabled) {
            tv.text = "📵 ${PrintUserMessages.BLUETOOTH_OFF}"
            return
        }
        try {
            val bonded = a.bondedDevices?.toList() ?: emptyList()
            val names = bonded.map { "${it.name ?: "?"}\n${it.address}" }
            lv.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_single_choice, names)
            lv.choiceMode = ListView.CHOICE_MODE_SINGLE
            lv.setOnItemClickListener { _, _, pos, _ ->
                selMac = bonded[pos].address
                selName = bonded[pos].name
                btnTest.isEnabled = true
                btnSave.isEnabled = true
                tv.text = "✅ ${bonded[pos].name}"
            }
            tv.text = "${bonded.size} ta printer topildi:"
        } catch (e: SecurityException) {
            tv.text = "⚠️ Ruxsat kerak!"
        }
    }

    private fun testPrint() {
        val mac = selMac ?: return
        tv.text = "⏳ Test..."
        val w = rg.checkedRadioButtonId
        val b = EscPosEncoding.buildDiagnosticEscPos(w)
        PrintLog.i("Setup testPrint | widthMm=$w bytes=${b.size}")
        Thread {
            val r = BluetoothPrinter.print(mac, b)
            runOnUiThread {
                tv.text = when (r) {
                    is BluetoothPrinter.Result.OK -> "✅ Test o'tdi!"
                    is BluetoothPrinter.Result.Err -> "❌ ${r.msg}"
                }
            }
        }.start()
    }

    private fun save() {
        val mac = selMac ?: return
        Prefs.saveMac(this, mac)
        Prefs.saveName(this, selName ?: "Xprinter")
        Prefs.saveWidth(this, rg.checkedRadioButtonId)
        Toast.makeText(this, "✅ Printer saqlandi!", Toast.LENGTH_LONG).show()
        finish()
    }
}
