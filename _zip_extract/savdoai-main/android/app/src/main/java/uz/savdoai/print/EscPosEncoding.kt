package uz.savdoai.print

import java.nio.ByteBuffer
import java.nio.CharBuffer
import java.nio.charset.Charset
import java.nio.charset.CodingErrorAction

/**
 * ESC/POS: Epson-ga o‘xshash termal printerlar uchun CP866 (ESC t 17) + transliteratsiya.
 * UTF-8 to‘g‘ridan-to‘g‘ri ko‘p printerlarda mojibake beradi.
 */
object EscPosEncoding {
    private val cp866: Charset = Charset.forName("IBM866")

    private val INIT = byteArrayOf(0x1B, 0x40)
    /** Epson TM / ko‘p Xprinter: jadval 17 — PC866 (Cyrillic #2). */
    private val SELECT_CP866 = byteArrayOf(0x1B, 0x74, 0x11)
    private val FEED = byteArrayOf(0x1B, 0x64, 0x05)
    /** Eski test bilan mos qirqish. */
    private val CUT = byteArrayOf(0x1D, 0x56, 0x42, 0x03)

    private val uzLatinReplacements = listOf(
        "Oʻ" to "O'", "oʻ" to "o'",
        "Gʻ" to "G'", "gʻ" to "g'",
    )

    fun normalizeForThermal(s: String): String {
        var t = s.replace("\u2014", "-").replace("\u2013", "-")
            .replace("\u2018", "'").replace("\u2019", "'")
            .replace("\u02BC", "'").replace("\u02BB", "'")
            .replace("«", "\"").replace("»", "\"")
        for ((a, b) in uzLatinReplacements) t = t.replace(a, b)
        return t
    }

    private fun toCp866Bytes(text: String): ByteArray {
        val enc = cp866.newEncoder()
            .onMalformedInput(CodingErrorAction.REPLACE)
            .onUnmappableCharacter(CodingErrorAction.REPLACE)
        val cb = CharBuffer.wrap(text)
        val bb = ByteBuffer.allocate(text.length * 2)
        enc.encode(cb, bb, true)
        enc.flush(bb)
        bb.flip()
        val out = ByteArray(bb.remaining())
        bb.get(out)
        return out
    }

    fun buildDiagnosticEscPos(widthMm: Int): ByteArray {
        val sepLen = if (widthMm >= 80) 48 else 32
        val sep = "=".repeat(sepLen)
        val lines = listOf(
            sep,
            "TEST CHEK",
            "SavdoAI Printer OK",
            "Hasan aka — 49 500 so'm",
            "O'zbek lotin matni",
            "Ўзбек кирилл матни",
            "Привет мир",
            "ABC abc 123",
            "${widthMm}mm / ${if (widthMm >= 80) 58 else 80}mm",
            "punctuation: , . : ; - / ( ) % №",
            sep,
            "",
        )
        val body = StringBuilder()
        lines.forEach { body.append(normalizeForThermal(it)).append('\n') }
        val payload = toCp866Bytes(body.toString())
        return INIT + SELECT_CP866 + payload + FEED + CUT
    }
}
