package com.nitroping.app.api

import android.content.Context
import android.os.Build
import android.util.Log
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

data class GraphQLRequest(
    val query: String,
    val variables: Map<String, Any>
)

data class GraphQLResponse<T>(
    val data: T?,
    val errors: List<GraphQLError>?
)

data class GraphQLError(
    val message: String,
    val locations: List<Map<String, Any>>?,
    val path: List<String>?
)

data class TrackEventInput(
    val notificationId: String,
    val deviceId: String,
    val platform: String,
    val userAgent: String?,
    val appVersion: String?,
    val osVersion: String?
)

data class TrackEventResponse(
    val success: Boolean,
    val message: String?
)

data class TrackEventData(
    val trackNotificationDelivered: TrackEventResponse? = null,
    val trackNotificationOpened: TrackEventResponse? = null,
    val trackNotificationClicked: TrackEventResponse? = null
)

class NitroPingApiService(private val context: Context) {
    
    companion object {
        private const val TAG = "NitroPingAPI"
        // Use Android emulator's localhost IP
        private const val BASE_URL = "http://10.0.2.2:3000" // Android emulator localhost
        private const val GRAPHQL_ENDPOINT = "$BASE_URL/api/graphql"
        
        // Alternative endpoints if the above doesn't work:
        // private const val BASE_URL = "http://198.19.249.3:3000" // Your computer's IP (failed)
        // private const val BASE_URL = "http://192.168.215.0:3000" // Alternative IP (failed)  
        // private const val BASE_URL = "http://172.20.10.3:3000" // Alternative IP (failed)
    }
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    
    suspend fun trackNotificationDelivered(
        notificationId: String,
        deviceId: String
    ): Result<TrackEventResponse> = withContext(Dispatchers.IO) {
        val mutation = """
            mutation TrackNotificationDelivered(${'$'}input: TrackEventInput!) {
                trackNotificationDelivered(input: ${'$'}input) {
                    success
                    message
                }
            }
        """.trimIndent()
        
        val input = TrackEventInput(
            notificationId = notificationId,
            deviceId = deviceId,
            platform = "ANDROID",
            userAgent = getUserAgent(),
            appVersion = getAppVersion(),
            osVersion = Build.VERSION.RELEASE
        )
        
        return@withContext executeGraphQL(mutation, mapOf("input" to input))
            .map { it.trackNotificationDelivered ?: TrackEventResponse(false, "No response") }
    }
    
    suspend fun trackNotificationOpened(
        notificationId: String,
        deviceId: String
    ): Result<TrackEventResponse> = withContext(Dispatchers.IO) {
        val mutation = """
            mutation TrackNotificationOpened(${'$'}input: TrackEventInput!) {
                trackNotificationOpened(input: ${'$'}input) {
                    success
                    message
                }
            }
        """.trimIndent()
        
        val input = TrackEventInput(
            notificationId = notificationId,
            deviceId = deviceId,
            platform = "ANDROID",
            userAgent = getUserAgent(),
            appVersion = getAppVersion(),
            osVersion = Build.VERSION.RELEASE
        )
        
        return@withContext executeGraphQL(mutation, mapOf("input" to input))
            .map { it.trackNotificationOpened ?: TrackEventResponse(false, "No response") }
    }
    
    suspend fun trackNotificationClicked(
        notificationId: String,
        deviceId: String
    ): Result<TrackEventResponse> = withContext(Dispatchers.IO) {
        val mutation = """
            mutation TrackNotificationClicked(${'$'}input: TrackEventInput!) {
                trackNotificationClicked(input: ${'$'}input) {
                    success
                    message
                }
            }
        """.trimIndent()
        
        val input = TrackEventInput(
            notificationId = notificationId,
            deviceId = deviceId,
            platform = "ANDROID",
            userAgent = getUserAgent(),
            appVersion = getAppVersion(),
            osVersion = Build.VERSION.RELEASE
        )
        
        return@withContext executeGraphQL(mutation, mapOf("input" to input))
            .map { it.trackNotificationClicked ?: TrackEventResponse(false, "No response") }
    }
    
    private suspend fun executeGraphQL(
        query: String,
        variables: Map<String, Any>
    ): Result<TrackEventData> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "🚀 Making GraphQL request to: $GRAPHQL_ENDPOINT")
            Log.d(TAG, "📝 Variables: $variables")
            
            val requestBody = GraphQLRequest(query, variables)
            val json = gson.toJson(requestBody)
            
            val request = Request.Builder()
                .url(GRAPHQL_ENDPOINT)
                .post(json.toRequestBody("application/json".toMediaType()))
                .addHeader("Content-Type", "application/json")
                .build()
            
            val response = client.newCall(request).execute()
            
            Log.d(TAG, "📡 Response code: ${response.code}")
            
            if (!response.isSuccessful) {
                Log.e(TAG, "❌ HTTP error: ${response.code} ${response.message}")
                return@withContext Result.failure(
                    Exception("HTTP error: ${response.code} ${response.message}")
                )
            }
            
            val responseBody = response.body?.string()
                ?: return@withContext Result.failure(Exception("Empty response body"))
            
            Log.d(TAG, "📄 Response body: $responseBody")
            
            val graphQLResponse = gson.fromJson(responseBody, GraphQLResponse::class.java)
            
            if (graphQLResponse.errors?.isNotEmpty() == true) {
                val errorMessage = graphQLResponse.errors.joinToString(", ") { it.message }
                Log.e(TAG, "❌ GraphQL errors: $errorMessage")
                return@withContext Result.failure(Exception("GraphQL errors: $errorMessage"))
            }
            
            val data = gson.fromJson(gson.toJson(graphQLResponse.data), TrackEventData::class.java)
            Log.d(TAG, "✅ GraphQL request successful")
            Result.success(data)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Exception in GraphQL request: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    private fun getUserAgent(): String {
        val appVersion = getAppVersion()
        return "NitroPing Android/$appVersion (${Build.MODEL}; Android ${Build.VERSION.RELEASE})"
    }
    
    private fun getAppVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }
}