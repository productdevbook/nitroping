# NitroPing iOS SDK

iOS SDK for integrating with NitroPing push notification service.

## 🚀 Installation

### Swift Package Manager

Add this to your `Package.swift`:

```swift
dependencies: [
    .package(path: "../ios/nitroping")
]
```

Or add via Xcode:
1. File → Add Package Dependencies
2. Enter local path: `../ios/nitroping`

## 📱 Quick Start

### 1. UIKit Integration

```swift
import UIKit
import NitroPingClient

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    
    var nitroPingClient: NitroPingClient?
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        
        // Initialize NitroPing
        nitroPingClient = NitroPingClient(
            apiURL: "http://localhost:3000/api/graphql",
            appId: "your-app-id-from-nitroping"
        )
        
        // Set notification delegate
        UNUserNotificationCenter.current().delegate = self
        
        // Request permissions and register
        Task {
            try await nitroPingClient?.initialize(userId: "user-123")
        }
        
        return true
    }
    
    // Handle device token
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Task {
            await nitroPingClient?.handleDeviceToken(deviceToken)
        }
    }
    
    // Handle foreground notifications
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        nitroPingClient?.handleNotification(notification.request.content.userInfo)
        completionHandler([.banner, .badge, .sound])
    }
    
    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        nitroPingClient?.handleNotification(response.notification.request.content.userInfo)
        completionHandler()
    }
}
```

### 2. SwiftUI Integration

```swift
import SwiftUI
import NitroPingClient

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .nitroPing(
                    appId: "your-app-id-from-nitroping",
                    apiURL: "http://localhost:3000/api/graphql",
                    userId: "user-123"
                )
        }
    }
}
```

## 🔧 Configuration

### 1. App ID Setup

Your app ID from NitroPing dashboard:

```swift
let client = NitroPingClient(
    apiURL: "https://your-nitroping-server.com/api/graphql",
    appId: "your-app-id-here"
)
```

### 2. Environment Configuration

#### Development
```swift
// Use localhost for development
let client = NitroPingClient(
    apiURL: "http://localhost:3000/api/graphql",
    appId: "dev-app-id"
)
```

#### Production
```swift
// Use production server
let client = NitroPingClient(
    apiURL: "https://api.yourserver.com/api/graphql",
    appId: "prod-app-id"
)
```

## 📨 Usage Examples

### Initialize with User ID

```swift
// Initialize with specific user
try await nitroPingClient?.initialize(userId: "user-123")
```

### Update User ID

```swift
// Update user ID (useful for login/logout)
try await nitroPingClient?.updateUserId("new-user-456")
```

### Handle Notifications

```swift
// In your notification handlers
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
) {
    // Let NitroPing handle the notification
    nitroPingClient?.handleNotification(notification.request.content.userInfo)
    
    // Show notification UI
    completionHandler([.banner, .badge, .sound])
}
```

## 🔒 APNS Setup

### 1. Enable Push Notifications

In Xcode:
1. Select your target
2. Go to "Signing & Capabilities"
3. Add "Push Notifications" capability

### 2. Add Background Modes

Add "Background processing" and "Remote notifications":

```xml
<!-- In Info.plist -->
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

### 3. APNS Configuration

Make sure your NitroPing server has the correct APNS configuration:

- **Development:** Use sandbox APNS certificates
- **Production:** Use production APNS certificates
- **Bundle ID:** Must match your app's bundle identifier

## 🧪 Testing

### 1. Development Testing

```swift
#if DEBUG
// Use development server for testing
let client = NitroPingClient(
    apiURL: "http://localhost:3000/api/graphql",
    appId: "test-app-id"
)
#endif
```

### 2. Simulator Testing

```swift
#if targetEnvironment(simulator)
// Simulator doesn't receive real push notifications
// but you can test device registration
print("Running in simulator - push notifications won't work")
#endif
```

### 3. Debug Logging

```swift
// Enable debug logging
client.debugMode = true // If you add this feature
```

## ⚠️ Important Notes

### Device Token Format
- iOS device tokens are 64-character hex strings
- Tokens change when the app is restored from backup
- Tokens are different for development vs production builds

### Permissions
- Users must grant notification permission
- Handle permission denied gracefully
- Re-request permission if needed

### Network Requirements
- Requires internet connection for device registration
- Gracefully handle network failures
- Implement retry logic for failed registrations

## 🔍 Troubleshooting

### "Permission Denied" Error
```swift
// Check notification settings
let settings = await UNUserNotificationCenter.current().notificationSettings()
if settings.authorizationStatus != .authorized {
    // Guide user to enable notifications in Settings
}
```

### "Invalid App ID" Error
```swift
// Verify your app ID from NitroPing dashboard
// Make sure it matches exactly
```

### "Device Registration Failed" Error
```swift
// Check network connectivity
// Verify API URL is correct
// Check server logs for details
```

## 📚 API Reference

### NitroPingClient

#### Methods
- `init(apiURL: String, appId: String)` - Initialize client
- `initialize(userId: String?) async throws` - Setup notifications
- `handleDeviceToken(_ deviceToken: Data) async` - Register device token
- `handleNotification(_ userInfo: [AnyHashable: Any])` - Process notification
- `updateUserId(_ userId: String) async throws` - Update user ID

#### Errors
- `NitroPingError.permissionDenied` - Notification permission denied
- `NitroPingError.invalidURL` - Invalid API URL
- `NitroPingError.httpError(Int)` - HTTP error from server
- `NitroPingError.graphQLError(String)` - GraphQL API error

## 🚀 Advanced Usage

### Custom Metadata

The SDK automatically includes device metadata:

```swift
// Automatically included:
{
    "deviceModel": "iPhone",
    "systemName": "iOS", 
    "systemVersion": "17.0",
    "appVersion": "1.0.0",
    "bundleId": "com.yourapp.bundle"
}
```

### Error Handling

```swift
do {
    try await nitroPingClient?.initialize(userId: "user-123")
} catch NitroPingError.permissionDenied {
    // Handle permission denied
    showPermissionAlert()
} catch NitroPingError.httpError(let code) {
    // Handle server error
    print("Server error: \(code)")
} catch {
    // Handle other errors
    print("Unexpected error: \(error)")
}
```

## 📄 License

This SDK is part of the NitroPing project.