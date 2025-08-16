package com.nitroping.app.fcm

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.nitroping.app.MainActivity
import com.nitroping.app.R
import com.nitroping.app.api.NitroPingApiService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class NitroPingFirebaseMessagingService : FirebaseMessagingService() {
    
    private lateinit var apiService: NitroPingApiService
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    companion object {
        private const val TAG = "NitroPingFCM"
        private const val CHANNEL_ID = "nitroping_notifications"
        private const val NOTIFICATION_ID = 100
        
        fun trackNotificationOpened(context: Context, notificationId: String, deviceId: String) {
            Log.d(TAG, "Tracking notification opened: $notificationId for device: $deviceId")
            
            val apiService = NitroPingApiService(context)
            val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
            
            scope.launch {
                try {
                    val result = apiService.trackNotificationOpened(notificationId, deviceId)
                    result.onSuccess { response ->
                        if (response.success) {
                            Log.d(TAG, "✅ Notification open tracked successfully")
                        } else {
                            Log.w(TAG, "❌ Failed to track open: ${response.message}")
                        }
                    }.onFailure { error ->
                        Log.e(TAG, "❌ Error tracking open: ${error.message}", error)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Exception tracking open: ${e.message}", e)
                }
            }
        }

        fun trackNotificationClicked(context: Context, notificationId: String, deviceId: String) {
            Log.d(TAG, "Tracking notification clicked: $notificationId for device: $deviceId")
            
            val apiService = NitroPingApiService(context)
            val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
            
            scope.launch {
                try {
                    val result = apiService.trackNotificationClicked(notificationId, deviceId)
                    result.onSuccess { response ->
                        if (response.success) {
                            Log.d(TAG, "✅ Notification click tracked successfully")
                        } else {
                            Log.w(TAG, "❌ Failed to track click: ${response.message}")
                        }
                    }.onFailure { error ->
                        Log.e(TAG, "❌ Error tracking click: ${error.message}", error)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Exception tracking click: ${e.message}", e)
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        apiService = NitroPingApiService(applicationContext)
        createNotificationChannel()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d(TAG, "From: ${remoteMessage.from}")
        
        // Track delivery if we have tracking data
        val notificationId = remoteMessage.data["nitroping_notification_id"]
        val deviceId = remoteMessage.data["nitroping_device_id"]
        
        if (!notificationId.isNullOrEmpty() && !deviceId.isNullOrEmpty()) {
            trackNotificationDelivered(notificationId, deviceId)
        }
        
        // Check if message contains a data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            handleDataMessage(remoteMessage.data)
        }

        // Check if message contains a notification payload
        remoteMessage.notification?.let {
            Log.d(TAG, "Message notification body: ${it.body}")
            showNotification(
                title = it.title ?: "NitroPing",
                body = it.body ?: "",
                data = remoteMessage.data
            )
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Refreshed token: $token")
        
        // Send token to your server
        sendRegistrationToServer(token)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "NitroPing Notifications"
            val descriptionText = "Notifications from NitroPing"
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun showNotification(title: String, body: String, data: Map<String, String>) {
        // Create an intent for the notification click
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            // Add data from FCM message as extras
            data.forEach { (key, value) ->
                putExtra(key, value)
            }
            // Add special flag to indicate this came from notification
            putExtra("from_notification", true)
        }
        
        val pendingIntent: PendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        // Check for notification permission (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                Log.w(TAG, "Notification permission not granted")
                return
            }
        }

        with(NotificationManagerCompat.from(this)) {
            notify(NOTIFICATION_ID, builder.build())
        }
    }

    private fun handleDataMessage(data: Map<String, String>) {
        // Handle any additional data-only messages
        // This could include silent updates, analytics tracking, etc.
        
        val action = data["action"]
        val payload = data["payload"]
        
        when (action) {
            "sync" -> {
                // Handle sync request
                Log.d(TAG, "Sync requested")
            }
            "update" -> {
                // Handle app update notification
                Log.d(TAG, "Update available")
            }
            else -> {
                Log.d(TAG, "Unknown action: $action")
            }
        }
    }

    private fun sendRegistrationToServer(token: String) {
        // TODO: Implement token registration with NitroPing server
        // This should send the token to your server along with device info
        
        Log.d(TAG, "Sending token to server: $token")
        
        // Example implementation:
        // val apiService = // Get your API service instance
        // apiService.registerDevice(
        //     token = token,
        //     platform = "android",
        //     appId = "your-app-id"
        // )
    }

    private fun trackNotificationDelivered(notificationId: String, deviceId: String) {
        Log.d(TAG, "Tracking notification delivered: $notificationId for device: $deviceId")
        
        serviceScope.launch {
            try {
                val result = apiService.trackNotificationDelivered(notificationId, deviceId)
                result.onSuccess { response ->
                    if (response.success) {
                        Log.d(TAG, "✅ Notification delivery tracked successfully")
                    } else {
                        Log.w(TAG, "❌ Failed to track delivery: ${response.message}")
                    }
                }.onFailure { error ->
                    Log.e(TAG, "❌ Error tracking delivery: ${error.message}", error)
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Exception tracking delivery: ${e.message}", e)
            }
        }
    }

}