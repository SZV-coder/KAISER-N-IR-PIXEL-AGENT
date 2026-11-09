package com.kaisernoir.agent

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class Verdict(
    val verdict: String,
    val why: String,
    val dissent: String,
    val confidence: String,
    val nextMove: String,
    val split: Boolean,
    val onDevice: Boolean = false,
    val liveAi: Boolean = false,
)

/** Calls the twin-mind API: POST /api/decide. */
object TwinMindClient {
    /** Tries the cloud API first; if it can't be reached, the twins debate on the phone itself. */
    suspend fun decide(question: String, options: List<String>, stakes: String): Verdict =
        try {
            decideRemote(question, options, stakes)
        } catch (e: Exception) {
            OnDeviceTwins.decide(question, options, stakes).copy(onDevice = true)
        }

    private suspend fun decideRemote(question: String, options: List<String>, stakes: String): Verdict =
        withContext(Dispatchers.IO) {
            val body = JSONObject()
                .put("question", question)
                .put("options", JSONArray(options))
                .put("stakes", stakes)
                .toString()

            val conn = URL("${BuildConfig.API_BASE_URL}/api/decide").openConnection() as HttpURLConnection
            try {
                conn.requestMethod = "POST"
                conn.connectTimeout = 5_000
                conn.readTimeout = 30_000
                conn.doOutput = true
                conn.setRequestProperty("content-type", "application/json")
                conn.outputStream.use { it.write(body.toByteArray()) }

                val stream = if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream
                val json = JSONObject(stream.bufferedReader().use { it.readText() })
                if (json.has("error")) error(json.getString("error"))
                Verdict(
                    verdict = json.optString("verdict"),
                    why = json.optString("why"),
                    dissent = json.optString("dissent"),
                    confidence = json.optString("confidence"),
                    nextMove = json.optString("nextMove"),
                    split = json.optBoolean("split"),
                    liveAi = json.optString("brain") == "ai",
                )
            } finally {
                conn.disconnect()
            }
        }
}
