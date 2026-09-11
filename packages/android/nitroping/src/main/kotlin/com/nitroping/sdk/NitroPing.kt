package com.nitroping.sdk

import android.os.Build
import android.content.SharedPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.UUID

enum class FeedbackType { COMPLAINT, BUG, SUGGESTION, FEATURE_REQUEST }

data class Feedback(
    val type: FeedbackType,
    val title: String,
    val body: String,
    val priority: String? = null,
    val email: String? = null,
    val appVersion: String? = null,
    val metadata: Map<String, String> = emptyMap(),
)

data class FeedbackResponse(val id: String, val status: String, val title: String, val createdAt: String)

class NitroPingClient(
    private val projectKey: String,
    private val apiBaseUrl: String = "https://nitroping.dev/api/v1",
    private val storage: SharedPreferences? = null,
) {
    suspend fun submit(feedback: Feedback): FeedbackResponse = withContext(Dispatchers.IO) {
        val idempotencyKey = UUID.randomUUID().toString()
        val body = feedbackJson(feedback)
        try {
            send(body, idempotencyKey)
        } catch (error: NitroPingHttpException) {
            if (error.statusCode < 500) throw error
            enqueue(body, idempotencyKey)
            throw NitroPingQueuedException
        } catch (_: Exception) {
            enqueue(body, idempotencyKey)
            throw NitroPingQueuedException
        }
    }

    suspend fun flushPending() = withContext(Dispatchers.IO) {
        val remaining = queue().toMutableList()
        val delivered = mutableListOf<PendingSubmission>()
        for (item in remaining) {
            try { send(item.body, item.idempotencyKey); delivered += item }
            catch (_: Exception) { }
        }
        if (delivered.isNotEmpty()) saveQueue(remaining.filterNot { it in delivered })
    }

    fun pendingCount(): Int = queue().size

    private fun send(body: String, idempotencyKey: String): FeedbackResponse {
        val connection = URL("$apiBaseUrl/projects/$projectKey/feedback").openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("X-NitroPing-Project-Key", projectKey)
            connection.setRequestProperty("Idempotency-Key", idempotencyKey)
            connection.outputStream.use { it.write(body.toByteArray()) }
            val responseBody = (if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream)?.bufferedReader()?.use { it.readText() } ?: ""
            if (connection.responseCode !in 200..299) throw NitroPingHttpException(connection.responseCode, responseBody)
            return parseResponse(responseBody)
        } finally { connection.disconnect() }
    }

    private fun feedbackJson(feedback: Feedback): String {
        val type = feedback.type.name.lowercase(Locale.ROOT)
        val metadata = feedback.metadata.entries.joinToString(",") { "${quote(it.key)}:${quote(it.value)}" }
        return """{"type":${quote(type)},"title":${quote(feedback.title)},"body":${quote(feedback.body)},"priority":${feedback.priority?.let(::quote) ?: "null"},"email":${feedback.email?.let(::quote) ?: "null"},"platform":"android","appVersion":${feedback.appVersion?.let(::quote) ?: "null"},"osVersion":${quote(Build.VERSION.RELEASE)},"locale":${quote(Locale.getDefault().toLanguageTag())},"metadata":{$metadata}}"""
    }

    private data class PendingSubmission(val body: String, val idempotencyKey: String)
    private fun queue(): List<PendingSubmission> = storage?.getStringSet("nitroping.pending", emptySet()).orEmpty().mapNotNull {
        val separator = it.indexOf('|')
        if (separator <= 0) null else PendingSubmission(it.substring(separator + 1), it.substring(0, separator))
    }
    private fun enqueue(body: String, idempotencyKey: String) {
        val items = queue().toMutableList(); items += PendingSubmission(body, idempotencyKey); saveQueue(items)
    }
    private fun saveQueue(items: List<PendingSubmission>) {
        storage?.edit()?.putStringSet("nitroping.pending", items.map { "${it.idempotencyKey}|${it.body}" }.toSet())?.apply()
    }

    private fun quote(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""
    private fun parseResponse(value: String): FeedbackResponse {
        fun field(name: String) = Regex("\\\"$name\\\":\\\"([^\\\"]*)\\\"").find(value)?.groupValues?.get(1) ?: ""
        return FeedbackResponse(field("id"), field("status"), field("title"), field("createdAt"))
    }
}

class NitroPingHttpException(val statusCode: Int, message: String) : Exception(message)
object NitroPingQueuedException : Exception("Feedback was saved locally and will be retried when connectivity returns")
