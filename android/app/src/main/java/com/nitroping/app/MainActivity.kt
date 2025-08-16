package com.nitroping.app

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import com.nitroping.app.fcm.NitroPingFirebaseMessagingService
import com.nitroping.app.ui.theme.NitropingTheme

class MainActivity : ComponentActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    private var fcmToken by mutableStateOf<String?>(null)
    private var deviceId by mutableStateOf<String?>(null)
    private var lastNotificationId by mutableStateOf<String?>(null)
    private var lastNotificationDeviceId by mutableStateOf<String?>(null)

    // Permission launcher for notification permission (Android 13+)
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.d(TAG, "Notification permission granted")
            getFCMToken()
        } else {
            Log.w(TAG, "Notification permission denied")
            Toast.makeText(this, "Notification permission is required for push notifications", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Generate device ID
        generateDeviceId()
        
        // Check if this activity was launched from a notification
        handleNotificationOpen()
        
        // Request notification permission and get FCM token
        requestNotificationPermissionAndGetToken()
        
        setContent {
            NitropingTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    NitroPingScreen(
                        fcmToken = fcmToken,
                        deviceId = deviceId,
                        lastNotificationId = lastNotificationId,
                        lastNotificationDeviceId = lastNotificationDeviceId,
                        onClickTracking = { notifId, devId ->
                            NitroPingFirebaseMessagingService.trackNotificationClicked(this@MainActivity, notifId, devId)
                        },
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }

    private fun requestNotificationPermissionAndGetToken() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+ requires explicit notification permission
            when {
                ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED -> {
                    // Permission already granted
                    getFCMToken()
                }
                else -> {
                    // Request permission
                    requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        } else {
            // Pre-Android 13 doesn't need explicit permission
            getFCMToken()
        }
    }

    private fun getFCMToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w(TAG, "Fetching FCM registration token failed", task.exception)
                return@addOnCompleteListener
            }

            // Get new FCM registration token
            val token = task.result
            Log.d(TAG, "FCM Registration Token: $token")
            
            // Update UI state
            fcmToken = token
            
            // TODO: Send token to your server
            sendTokenToServer(token)
            
            // Show token in UI for development purposes
            Toast.makeText(this, "FCM Token received!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun generateDeviceId() {
        // Use Android ID as a unique device identifier
        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        deviceId = androidId
        Log.d(TAG, "Device ID: $androidId")
    }

    private fun sendTokenToServer(token: String) {
        Log.d(TAG, "Registering device with token: $token")
        
        // For now, we'll just log the token and device ID for manual registration
        // In a production app, you would implement an HTTP client to call your GraphQL API
        Log.i(TAG, "=== DEVICE REGISTRATION INFO ===")
        Log.i(TAG, "FCM Token: $token")
        Log.i(TAG, "Device ID: $deviceId")
        Log.i(TAG, "Platform: android")
        Log.i(TAG, "===============================")
        
        // TODO: Implement actual API call when you have proper authentication/app ID
        // Example GraphQL mutation:
        // mutation RegisterDevice($input: RegisterDeviceInput!) {
        //   registerDevice(input: $input) {
        //     id
        //     token
        //     platform
        //     status
        //   }
        // }
    }

    private fun handleNotificationOpen() {
        val intent = intent
        if (intent?.getBooleanExtra("from_notification", false) == true) {
            val notificationId = intent.getStringExtra("nitroping_notification_id")
            val deviceId = intent.getStringExtra("nitroping_device_id")
            
            if (!notificationId.isNullOrEmpty() && !deviceId.isNullOrEmpty()) {
                Log.d(TAG, "App opened from notification: $notificationId")
                
                // Save notification info for potential click tracking
                lastNotificationId = notificationId
                lastNotificationDeviceId = deviceId
                
                // Track that notification was opened
                NitroPingFirebaseMessagingService.trackNotificationOpened(this, notificationId, deviceId)
                
                // Note: Click tracking should only happen for specific call-to-action buttons
                // For now, we only track opens when notification tapped
            }
        }
    }
}

@Composable
fun NitroPingScreen(
    fcmToken: String?,
    deviceId: String?,
    lastNotificationId: String?,
    lastNotificationDeviceId: String?,
    onClickTracking: (String, String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    
    fun copyToClipboard(text: String, label: String) {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText(label, text)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(context, "$label copied to clipboard!", Toast.LENGTH_SHORT).show()
    }
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Text(
            text = "NitroPing Android",
            style = MaterialTheme.typography.headlineLarge,
            textAlign = TextAlign.Center
        )

        Text(
            text = "Push Notification Client",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Device ID Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Device ID",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    if (deviceId != null) {
                        IconButton(
                            onClick = { copyToClipboard(deviceId, "Device ID") }
                        ) {
                            Icon(
                                Icons.Default.ContentCopy,
                                contentDescription = "Copy Device ID",
                                tint = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
                Text(
                    text = deviceId ?: "Generating...",
                    style = MaterialTheme.typography.bodyMedium,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }

        // FCM Token Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "FCM Token",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                    if (fcmToken != null) {
                        IconButton(
                            onClick = { copyToClipboard(fcmToken, "FCM Token") }
                        ) {
                            Icon(
                                Icons.Default.ContentCopy,
                                contentDescription = "Copy FCM Token",
                                tint = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                    }
                }
                
                if (fcmToken != null) {
                    Text(
                        text = fcmToken,
                        style = MaterialTheme.typography.bodySmall,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        lineHeight = MaterialTheme.typography.bodySmall.lineHeight
                    )
                } else {
                    Text(
                        text = "Requesting token...",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }
            }
        }

        // Status Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Status",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onTertiaryContainer
                )
                
                val status = when {
                    deviceId != null && fcmToken != null -> "✅ Ready for notifications"
                    deviceId != null -> "⏳ Getting FCM token..."
                    else -> "🔄 Initializing..."
                }
                
                Text(
                    text = status,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onTertiaryContainer
                )
            }
        }

        // Info Card
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "How to Test",
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "1. Copy your Device ID\n2. Register it with NitroPing server\n3. Send a test notification from the web dashboard",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Test click tracking button
                Button(
                    onClick = { 
                        if (!lastNotificationId.isNullOrEmpty() && !lastNotificationDeviceId.isNullOrEmpty()) {
                            onClickTracking(lastNotificationId, lastNotificationDeviceId)
                            Toast.makeText(context, "Click tracked for notification: $lastNotificationId", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(context, "No recent notification to track click for", Toast.LENGTH_SHORT).show()
                        }
                    },
                    enabled = !lastNotificationId.isNullOrEmpty() && !lastNotificationDeviceId.isNullOrEmpty(),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Test Click Tracking")
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun NitroPingScreenPreview() {
    NitropingTheme {
        NitroPingScreen(
            fcmToken = "sample_fcm_token_here_for_preview",
            deviceId = "1234567890abcdef",
            lastNotificationId = "sample_notification_id",
            lastNotificationDeviceId = "sample_device_id",
            onClickTracking = { _, _ -> }
        )
    }
}