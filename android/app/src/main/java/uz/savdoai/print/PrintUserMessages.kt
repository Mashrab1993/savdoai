package uz.savdoai.print

/** Foydalanuvchi uchun qisqa o‘zbekcha xabarlar (UI / Toast). */
object PrintUserMessages {
    const val SESSION_MISSING = "Print sessiya topilmadi. Qayta urinib ko'ring."
    const val WRONG_API_HOST = "Server manzili noto'g'ri sozlangan."
    const val UNAUTHORIZED = "Token noto'g'ri yoki ruxsat yo'q."
    const val ALREADY_PRINTED = "Chek allaqachon chop etilgan."
    const val EXPIRED = "Muddati o'tgan. Yangi chek oling."
    const val EMPTY_RECEIPT = "Chek bo'sh yoki noto'g'ri format."
    const val NETWORK = "Internet bilan bog'lanib bo'lmadi."
    const val TIMEOUT = "Server javob bermadi (vaqt tugadi). Qayta urinib ko'ring."
    const val SSL = "Xavfsiz ulanish xatosi. Tarmoqni tekshiring."
    const val PRINTER_NOT_CONFIGURED = "Printer tanlanmagan. Avval Sozlash tugmasini bosing."
    const val BLUETOOTH_OFF = "Bluetooth o'chiq. Yoqib qayta urinib ko'ring."
    const val BLUETOOTH_MISSING = "Bluetooth mavjud emas."
    const val PRINTER_CONNECT_FAILED = "Printerga ulanib bo'lmadi. Yoqilganini tekshiring."
    const val MAC_INVALID = "Printer manzili (MAC) noto'g'ri."
    const val OFFLINE_USE_BIN = "Internet yo'q. .bin faylni oching yoki keyinroq qayta urining."
    const val INVALID_LINK = "Havola noto'g'ri."
    const val SERVER_ERROR = "Server javobi tushunarsiz. Keyinroq urinib ko'ring."
    const val ENCODING_ERROR = "Chekni o'qib bo'lmadi (format xatosi)."
    const val PRINT_OK = "Chop etildi!"
    const val DATA_MISSING = "Ma'lumot topilmadi."

    fun unknownServer(code: Int, summary: String): String {
        val head = if (code > 0) "Server xatosi ($code)" else "Server xatosi"
        return head + if (summary.isNotBlank()) ": $summary" else ""
    }
}
