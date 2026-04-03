package uz.savdoai.print

import java.io.ByteArrayOutputStream
import java.net.ConnectException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URL
import java.net.UnknownHostException
import java.net.URLEncoder
import javax.net.ssl.SSLException

object PrintApi {

    sealed class FetchOutcome {
        data class Ok(val bytes: ByteArray) : FetchOutcome()
        data class Err(val kind: ErrKind, val logDetail: String = "") : FetchOutcome()
    }

    enum class ErrKind {
        SESSION_MISSING,
        WRONG_HOST_OR_GATEWAY,
        UNAUTHORIZED,
        ALREADY_PRINTED,
        EXPIRED,
        EMPTY_PAYLOAD,
        NETWORK,
        TIMEOUT,
        SSL,
        UNKNOWN_SERVER,
    }

    fun buildEscPosUrl(base: String, jobId: String, token: String, width: Int): String {
        val w = if (width <= 58) 58 else 80
        val apiBaseUrl = base.trimEnd('/')
        val tEnc = URLEncoder.encode(token, "UTF-8")
        return "$apiBaseUrl/api/print/escpos/$jobId?t=$tEnc&w=$w"
    }

    private fun readErrBody(c: HttpURLConnection): String =
        try {
            c.errorStream?.bufferedReader()?.use { it.readText() }?.trim().orEmpty()
        } catch (_: Exception) {
            ""
        }

    private fun readOkBody(c: HttpURLConnection): ByteArray {
        val b = ByteArrayOutputStream()
        c.inputStream.use { it.copyTo(b) }
        return b.toByteArray()
    }

    /** Backend: GET /api/print/escpos/{job_id}?t=&w= */
    fun fetchEscPos(base: String, jobId: String, token: String, width: Int): FetchOutcome {
        val w = if (width <= 58) 58 else 80
        val requestUrl = try {
            buildEscPosUrl(base, jobId, token, width)
        } catch (e: Exception) {
            PrintLog.e("fetchEscPos bad URL", e)
            return FetchOutcome.Err(ErrKind.WRONG_HOST_OR_GATEWAY, e.message ?: "")
        }
        PrintLog.i(
            "fetchEscPos | apiBaseUrl=${base.trimEnd('/')} jobId=$jobId width=$w " +
                "token=${PrintLog.maskToken(token)} requestUrl=${PrintLog.maskRequestUrl(requestUrl)}"
        )
        return try {
            val c = (URL(requestUrl).openConnection() as HttpURLConnection).apply {
                connectTimeout = 12_000
                readTimeout = 12_000
            }
            try {
                val code = c.responseCode
                when {
                    code in 200..299 -> {
                        val okBody = try {
                            readOkBody(c)
                        } catch (e: Exception) {
                            PrintLog.e("fetchEscPos read body", e)
                            return FetchOutcome.Err(ErrKind.NETWORK, e.message ?: "")
                        }
                        val summary = if (okBody.isEmpty()) "empty" else "bytes=${okBody.size}"
                        PrintLog.i("fetchEscPos response | responseCode=$code summary=$summary")
                        if (okBody.isEmpty()) {
                            FetchOutcome.Err(ErrKind.EMPTY_PAYLOAD, "empty body")
                        } else {
                            FetchOutcome.Ok(okBody)
                        }
                    }
                    else -> {
                        val errBody = readErrBody(c)
                        val summary = PrintLog.safeBodySummary(errBody)
                        PrintLog.i("fetchEscPos response | responseCode=$code summary=$summary")
                        when (code) {
                            401, 403 -> FetchOutcome.Err(ErrKind.UNAUTHORIZED, summary)
                            404 -> FetchOutcome.Err(classify404(errBody), summary)
                            409 -> FetchOutcome.Err(ErrKind.ALREADY_PRINTED, summary)
                            410 -> FetchOutcome.Err(ErrKind.EXPIRED, summary)
                            else -> FetchOutcome.Err(ErrKind.UNKNOWN_SERVER, "http $code $summary")
                        }
                    }
                }
            } finally {
                c.disconnect()
            }
        } catch (e: IllegalArgumentException) {
            PrintLog.e("fetchEscPos bad URL | url=${PrintLog.maskRequestUrl(requestUrl)}", e)
            FetchOutcome.Err(ErrKind.WRONG_HOST_OR_GATEWAY, e.message ?: "")
        } catch (e: SocketTimeoutException) {
            PrintLog.e("fetchEscPos timeout | url=${PrintLog.maskRequestUrl(requestUrl)}", e)
            FetchOutcome.Err(ErrKind.TIMEOUT, e.message ?: "")
        } catch (e: UnknownHostException) {
            PrintLog.e("fetchEscPos unknown host | url=${PrintLog.maskRequestUrl(requestUrl)}", e)
            FetchOutcome.Err(ErrKind.NETWORK, e.message ?: "")
        } catch (e: ConnectException) {
            PrintLog.e("fetchEscPos connect | url=${PrintLog.maskRequestUrl(requestUrl)}", e)
            FetchOutcome.Err(ErrKind.NETWORK, e.message ?: "")
        } catch (e: SSLException) {
            PrintLog.e("fetchEscPos ssl", e)
            FetchOutcome.Err(ErrKind.SSL, e.message ?: "")
        } catch (e: Exception) {
            PrintLog.e("fetchEscPos exception | url=${PrintLog.maskRequestUrl(requestUrl)}", e)
            FetchOutcome.Err(ErrKind.NETWORK, e.message ?: "")
        }
    }

    private fun classify404(body: String): ErrKind {
        val b = body.trim()
        val lower = b.lowercase()
        if (lower.contains("<!doctype") || lower.contains("<html")) return ErrKind.WRONG_HOST_OR_GATEWAY
        if (lower.contains("nginx") && lower.contains("404")) return ErrKind.WRONG_HOST_OR_GATEWAY
        if (b.isEmpty()) return ErrKind.WRONG_HOST_OR_GATEWAY
        if (lower.contains("topilmadi")) return ErrKind.SESSION_MISSING
        if (lower.contains("\"detail\"") && lower.contains("not found")) return ErrKind.SESSION_MISSING
        if (lower.contains("session") && lower.contains("not")) return ErrKind.SESSION_MISSING
        if (lower.contains("print") && lower.contains("not found")) return ErrKind.SESSION_MISSING
        if (lower.contains("job") && (lower.contains("not found") || lower.contains("unknown"))) {
            return ErrKind.SESSION_MISSING
        }
        return ErrKind.SESSION_MISSING
    }

    /** Backend: POST /api/print/done/{job_id} | POST /api/print/failed/{job_id} */
    fun ack(base: String, jobId: String, ok: Boolean, token: String, reason: String = "") {
        try {
            val apiBaseUrl = base.trimEnd('/')
            val tEnc = URLEncoder.encode(token, "UTF-8")
            val rEnc = URLEncoder.encode(reason.take(200), "UTF-8")
            val u = if (ok) "$apiBaseUrl/api/print/done/$jobId?t=$tEnc"
            else "$apiBaseUrl/api/print/failed/$jobId?t=$tEnc&reason=$rEnc"
            PrintLog.i("ack | ok=$ok requestUrl=${PrintLog.maskRequestUrl(u)}")
            val c = (URL(u).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 8000
            }
            try {
                val code = c.responseCode
                val err = if (code in 200..299) "" else readErrBody(c)
                PrintLog.i("ack response | responseCode=$code summary=${PrintLog.safeBodySummary(err)}")
            } finally {
                c.disconnect()
            }
        } catch (e: Exception) {
            PrintLog.e("ack exception", e)
        }
    }
}
