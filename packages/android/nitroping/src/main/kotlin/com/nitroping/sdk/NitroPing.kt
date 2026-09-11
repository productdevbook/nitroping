package com.nitroping.sdk

import android.os.Build
import android.content.SharedPreferences
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.UUID
import org.json.JSONObject

enum class FeedbackType { COMPLAINT, BUG, SUGGESTION, FEATURE_REQUEST }

data class Feedback(
    val type: FeedbackType,
    val title: String,
    val body: String,
    val priority: String? = null,
    val categoryId: String? = null,
    val email: String? = null,
    val appVersion: String? = null,
    val metadata: Map<String, Any> = emptyMap(),
)

data class FeedbackResponse(val id: String, val status: String, val title: String, val createdAt: String)
data class NitroPingAttachment(val bytes: ByteArray, val contentType: String)
data class NitroPingCategory(val id: String, val name: String, val slug: String)
data class NitroPingCustomField(val id: String, val label: String, val type: String, val required: Boolean = false, val options: List<String> = emptyList())
data class NitroPingPublicTheme(val mode: String?, val buttonLabel: String?, val fields: List<String>, val customFields: List<NitroPingCustomField>, val colors: Map<String, String>)
data class NitroPingPublicConfig(val theme: NitroPingPublicTheme, val categories: List<NitroPingCategory>)
data class FollowUpComment(val id: String, val body: String, val createdAt: String)
data class FollowUpSnapshot(val feedbackId: String, val status: String, val title: String, val body: String, val comments: List<FollowUpComment>)
data class NitroPingDeleteResponse(val deleted: Boolean, val feedbackId: String)

class NitroPingClient(
    private val projectKey: String,
    private val apiBaseUrl: String = "https://nitroping.dev/api/v1",
    private val storage: SharedPreferences? = null,
) {
    suspend fun submit(feedback: Feedback): FeedbackResponse = submit(feedback, emptyList())

    suspend fun submit(feedback: Feedback, attachments: List<NitroPingAttachment>): FeedbackResponse = withContext(Dispatchers.IO) {
        val idempotencyKey = UUID.randomUUID().toString()
        val body = feedbackJson(feedback)
        try {
            val response = send(body, idempotencyKey)
            attachments.forEach { uploadAttachment(response.id, it) }
            response
        } catch (error: NitroPingHttpException) {
            if (error.statusCode < 500) throw error
            enqueue(body, idempotencyKey, attachments)
            throw NitroPingQueuedException
        } catch (_: Exception) {
            enqueue(body, idempotencyKey, attachments)
            throw NitroPingQueuedException
        }
    }

    suspend fun flushPending() = withContext(Dispatchers.IO) {
        val remaining = queue().toMutableList()
        val delivered = mutableListOf<PendingSubmission>()
        for (item in remaining) {
            try {
                val response = send(item.body, item.idempotencyKey)
                item.attachments.forEach { attachment -> uploadAttachment(response.id, NitroPingAttachment(Base64.decode(attachment.bytesBase64, Base64.DEFAULT), attachment.contentType)) }
                delivered += item
            }
            catch (_: Exception) { }
        }
        if (delivered.isNotEmpty()) saveQueue(remaining.filterNot { it in delivered })
    }

    fun pendingCount(): Int = queue().size

    suspend fun fetchPublicConfig(): NitroPingPublicConfig = withContext(Dispatchers.IO) {
        val root = JSONObject(requestRaw("GET", "/projects/$projectKey/public/config", null))
        val themeJson = root.optJSONObject("theme") ?: JSONObject()
        val colorsJson = themeJson.optJSONObject("colors") ?: JSONObject()
        val colors = buildMap { colorsJson.keys().forEach { key -> put(key, colorsJson.optString(key)) } }
        val fieldsJson = themeJson.optJSONArray("fields") ?: org.json.JSONArray()
        val fields = buildList { for (index in 0 until fieldsJson.length()) add(fieldsJson.optString(index)) }
        val customFieldsJson = themeJson.optJSONArray("customFields") ?: org.json.JSONArray()
        val customFields = buildList {
            for (index in 0 until customFieldsJson.length()) {
                val field = customFieldsJson.optJSONObject(index) ?: continue
                val optionsJson = field.optJSONArray("options") ?: org.json.JSONArray()
                add(NitroPingCustomField(field.optString("id"), field.optString("label"), field.optString("type"), field.optBoolean("required", false), buildList { for (optionIndex in 0 until optionsJson.length()) add(optionsJson.optString(optionIndex)) }))
            }
        }
        val categoriesJson = root.optJSONArray("categories") ?: org.json.JSONArray()
        val categories = buildList {
            for (index in 0 until categoriesJson.length()) {
                val category = categoriesJson.getJSONObject(index)
                add(NitroPingCategory(category.optString("id"), category.optString("name"), category.optString("slug")))
            }
        }
        NitroPingPublicConfig(NitroPingPublicTheme(themeJson.optString("mode").ifEmpty { null }, themeJson.optString("buttonLabel").ifEmpty { null }, fields, customFields, colors), categories)
    }

    suspend fun uploadAttachment(feedbackId: String, attachment: NitroPingAttachment): String = withContext(Dispatchers.IO) {
        if (attachment.bytes.isEmpty() || attachment.bytes.size > 10 * 1024 * 1024) throw NitroPingHttpException(413, "Attachments cannot exceed 10 MB")
        val initiated = JSONObject(requestRaw("POST", "/projects/$projectKey/uploads/initiate", "{\"feedbackId\":${quote(feedbackId)},\"contentType\":${quote(attachment.contentType)},\"size\":${attachment.bytes.size}}"))
        uploadRaw(initiated.getString("uploadUrl"), attachment.bytes, attachment.contentType)
        initiated.getString("attachmentId")
    }

    suspend fun requestFollowUp(feedbackId: String, email: String): Boolean = withContext(Dispatchers.IO) {
        requestRaw("POST", "/projects/$projectKey/follow-up/request", "{\"feedbackId\":${quote(feedbackId)},\"email\":${quote(email)}}")
        true
    }

    suspend fun fetchFollowUp(token: String): FollowUpSnapshot = withContext(Dispatchers.IO) {
        val root = JSONObject(requestRaw("GET", "/follow-up/$token", null))
        val feedback = root.getJSONObject("feedback")
        val commentsJson = root.optJSONArray("comments") ?: org.json.JSONArray()
        val comments = buildList {
            for (index in 0 until commentsJson.length()) {
                val comment = commentsJson.getJSONObject(index)
                add(FollowUpComment(comment.optString("id"), comment.optString("body"), comment.optString("createdAt")))
            }
        }
        FollowUpSnapshot(feedback.optString("id"), feedback.optString("status"), feedback.optString("title"), feedback.optString("body"), comments)
    }

    suspend fun deleteFollowUp(token: String): NitroPingDeleteResponse = withContext(Dispatchers.IO) {
        val root = JSONObject(requestRaw("DELETE", "/follow-up/$token", null))
        NitroPingDeleteResponse(root.optBoolean("deleted"), root.optString("feedbackId"))
    }

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

    private fun requestRaw(method: String, path: String, body: String?): String {
        val connection = URL("$apiBaseUrl$path").openConnection() as HttpURLConnection
        try {
            connection.requestMethod = method
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("X-NitroPing-Project-Key", projectKey)
            if (body != null) { connection.doOutput = true; connection.outputStream.use { it.write(body.toByteArray()) } }
            val responseBody = (if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream)?.bufferedReader()?.use { it.readText() } ?: ""
            if (connection.responseCode !in 200..299) throw NitroPingHttpException(connection.responseCode, responseBody)
            return responseBody
        } finally { connection.disconnect() }
    }

    private fun uploadRaw(path: String, bytes: ByteArray, contentType: String) {
        val origin = URL(apiBaseUrl).let { "${it.protocol}://${it.authority}" }
        val connection = URL(if (path.startsWith("http")) path else "$origin$path").openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "PUT"; connection.doOutput = true
            connection.setRequestProperty("Content-Type", contentType); connection.setRequestProperty("X-NitroPing-Project-Key", projectKey)
            connection.outputStream.use { it.write(bytes) }
            if (connection.responseCode !in 200..299) throw NitroPingHttpException(connection.responseCode, "Attachment upload failed")
        } finally { connection.disconnect() }
    }

    private fun feedbackJson(feedback: Feedback): String {
        val type = feedback.type.name.lowercase(Locale.ROOT)
        val metadata = feedback.metadata.entries.joinToString(",") { "${quote(it.key)}:${jsonValue(it.value)}" }
        return """{"type":${quote(type)},"title":${quote(feedback.title)},"body":${quote(feedback.body)},"priority":${feedback.priority?.let(::quote) ?: "null"},"categoryId":${feedback.categoryId?.let(::quote) ?: "null"},"email":${feedback.email?.let(::quote) ?: "null"},"platform":"android","appVersion":${feedback.appVersion?.let(::quote) ?: "null"},"osVersion":${quote(Build.VERSION.RELEASE)},"locale":${quote(Locale.getDefault().toLanguageTag())},"metadata":{$metadata}}"""
    }

    private data class PendingAttachment(val bytesBase64: String, val contentType: String)
    private data class PendingSubmission(val body: String, val idempotencyKey: String, val attachments: List<PendingAttachment> = emptyList())
    private fun queue(): List<PendingSubmission> = storage?.getStringSet("nitroping.pending", emptySet()).orEmpty().mapNotNull {
        if (it.startsWith("{")) {
            runCatching {
                val root = JSONObject(it)
                val attachments = root.optJSONArray("attachments") ?: org.json.JSONArray()
                PendingSubmission(root.getString("body"), root.getString("idempotencyKey"), buildList {
                    for (index in 0 until attachments.length()) {
                        val attachment = attachments.getJSONObject(index)
                        add(PendingAttachment(attachment.getString("bytes"), attachment.getString("contentType")))
                    }
                })
            }.getOrNull()
        } else {
            val separator = it.indexOf('|')
            if (separator <= 0) null else PendingSubmission(it.substring(separator + 1), it.substring(0, separator))
        }
    }
    private fun enqueue(body: String, idempotencyKey: String, attachments: List<NitroPingAttachment> = emptyList()) {
        val pendingAttachments = attachments.map { PendingAttachment(Base64.encodeToString(it.bytes, Base64.NO_WRAP), it.contentType) }
        val items = queue().toMutableList(); items += PendingSubmission(body, idempotencyKey, pendingAttachments); saveQueue(items)
    }
    private fun saveQueue(items: List<PendingSubmission>) {
        storage?.edit()?.putStringSet("nitroping.pending", items.map { item ->
            JSONObject().put("idempotencyKey", item.idempotencyKey).put("body", item.body).put("attachments", org.json.JSONArray().also { array -> item.attachments.forEach { array.put(JSONObject().put("bytes", it.bytesBase64).put("contentType", it.contentType)) } }).toString()
        }.toSet())?.apply()
    }

    private fun quote(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"")}\""
    private fun jsonValue(value: Any): String = when (value) {
        is String -> quote(value)
        is Boolean -> value.toString()
        is Byte, is Short, is Int, is Long, is Float, is Double -> value.toString()
        else -> quote(value.toString())
    }
    private fun parseResponse(value: String): FeedbackResponse {
        fun field(name: String) = Regex("\\\"$name\\\":\\\"([^\\\"]*)\\\"").find(value)?.groupValues?.get(1) ?: ""
        return FeedbackResponse(field("id"), field("status"), field("title"), field("createdAt"))
    }
}

class NitroPingHttpException(val statusCode: Int, message: String) : Exception(message)
object NitroPingQueuedException : Exception("Feedback was saved locally and will be retried when connectivity returns")
