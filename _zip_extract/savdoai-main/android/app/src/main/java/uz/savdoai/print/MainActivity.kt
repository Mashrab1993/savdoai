package uz.savdoai.print
import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
class MainActivity : AppCompatActivity() {
    override fun onCreate(s: Bundle?) { super.onCreate(s)
        val l = LinearLayout(this).apply { orientation=LinearLayout.VERTICAL; setPadding(32,48,32,32) }
        l.addView(TextView(this).apply { text="🖨️ SavdoAI Print"; textSize=28f; setPadding(0,0,0,24) })
        val tv = TextView(this).apply { textSize=16f; setPadding(0,0,0,24) }; l.addView(tv)
        if (Prefs.ready(this)) {
            val bt = if (BluetoothPrinter.btOn(this)) "✅ Bluetooth yoqiq" else "📵 ${PrintUserMessages.BLUETOOTH_OFF}"
            tv.text = "$bt\n\n🖨️ ${Prefs.name(this)}\n📏 ${Prefs.width(this)}mm\n\nTelegram da \"🖨 CHEK CHIQARISH\" bosing!"
            if (Queue.has(this)) l.addView(Button(this).apply { text="🔄 QAYTA CHOP ETISH"; textSize=18f; minimumHeight=140
                setOnClickListener { PrintService.retry(this@MainActivity); Toast.makeText(this@MainActivity,"⏳ Qayta chop...",Toast.LENGTH_SHORT).show() } })
        } else tv.text = "⚠️ ${PrintUserMessages.PRINTER_NOT_CONFIGURED}\nPastdagi tugmani bosing."
        l.addView(Button(this).apply { text="⚙️ SOZLASH"; textSize=18f; minimumHeight=140
            setOnClickListener { startActivity(Intent(this@MainActivity, SetupActivity::class.java)) } })
        l.addView(TextView(this).apply { text="\nℹ️ Telegram da sotuv → \"CHEK CHIQARISH\" → chek chiqadi!"; textSize=13f })
        setContentView(l)
    }
}
