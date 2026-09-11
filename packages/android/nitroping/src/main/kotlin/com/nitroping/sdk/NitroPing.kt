package com.nitroping.sdk

import android.os.Build
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
) {
    suspend fun submit(feedback: Feedback): FeedbackResponse = withContext(Dispatchers.IO) {
        val connection = URL("$apiBaseUrl/projects/$projectKey/feedback").openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.doOutput = true
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("X-NitroPing-Project-Key", projectKey)
        connection.setRequestProperty("Idempotency-Key", UUID.randomUUID().toString())
        val type = feedback.type.name.lowercase(Locale.ROOT).replace("feature_request", "feature_request")
        val body = """{"type":"$type","title":${quote(feedback.title)},"body":${quote(feedback.body)},"priority":${feedback.priority?.let(::quote) ?: "null"},"email":${feedback.email?.let(::quote) ?: "null"},"platform":"android","appVersion":${feedback.appVersion?.let(::quote) ?: "null"},"osVersion":${quote(Build.VERSION.RELEASE)},"locale":${quote(Locale.getDefault().toLanguageTag())},"metadata":{}}"""
        connection.outputStream.use { it.write(body.toByteArray()) }
        val response = connection.inputStream.bufferedReader().use { it.readText() }
        if (connection.responseCode !in 200..299) error("NitroPing request failed: ${connection.responseCode}")
        parseResponse(response)
    }

    private fun quote(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""
    private fun parseResponse(value: String): FeedbackResponse {
        fun field(name: String) = Regex("\\\"$name\\\":\\\"([^\\\"]*)\\\"").find(value)?.groupValues?.get(1) ?: ""
        return FeedbackResponse(field("id"), field("status"), field("title"), field("createdAt"))
    }
}
