# NitroPing Flutter SDK

Flutter SDK for [NitroPing](https://github.com/productdevbook/nitroping) self-hosted push notification service.

## Features

- 📱 **Multi-platform**: iOS (APNs) and Android (FCM) support
- 🔔 **Easy integration**: Simple API for device registration
- 📊 **Event tracking**: Track delivered, opened, and clicked events
- 🔄 **Auto token refresh**: Automatically handles FCM token updates
- 🛡️ **Type-safe**: Full Dart type safety

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  nitroping:
    git:
      url: https://github.com/productdevbook/nitroping.git
      path: flutter_sdk/nitroping
```

## Requirements

- Flutter 3.27.0+
- Dart 3.6.0+
- Firebase project configured for your app

## Quick Start

### 1. Configure Firebase

Follow [Firebase Flutter setup](https://firebase.google.com/docs/flutter/setup) for your platform.

### 2. Initialize NitroPing

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:nitroping/nitroping.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Configure NitroPing
  await NitroPingClient.configure(
    appId: 'your-nitroping-app-id',
    apiUrl: 'https://your-server.com/api/graphql',
    debug: true, // Enable debug logging
  );

  runApp(MyApp());
}
```

### 3. Register Device

```dart
class _MyHomePageState extends State<MyHomePage> {
  DeviceRegistration? _device;

  @override
  void initState() {
    super.initState();
    _registerDevice();
  }

  Future<void> _registerDevice() async {
    try {
      final device = await NitroPingClient.instance.registerDevice(
        userId: 'user-123', // optional
      );
      setState(() => _device = device);
      print('Registered: ${device.id}');
    } on NitroPingPermissionDeniedException {
      print('Permission denied');
    } on NitroPingException catch (e) {
      print('Error: ${e.message}');
    }
  }
}
```

### 4. Handle Notifications

```dart
@override
void initState() {
  super.initState();
  
  // Setup message handlers
  NitroPingClient.instance.setupMessageHandlers(
    onMessage: (message) {
      print('Foreground notification: ${message.notification?.title}');
    },
    onMessageOpenedApp: (message) {
      print('App opened from notification');
    },
  );
}
```

## API Reference

### NitroPingClient

#### Configuration

```dart
// Configure with individual parameters
await NitroPingClient.configure(
  appId: 'your-app-id',
  apiUrl: 'https://your-server.com/api/graphql',
  userId: 'default-user-id', // optional
  debug: false,
);

// Or with config object
await NitroPingClient.configureWithConfig(
  NitroPingConfig(
    appId: 'your-app-id',
    apiUrl: 'https://your-server.com/api/graphql',
  ),
);

// For local development
await NitroPingClient.configureWithConfig(
  NitroPingConfig.localhost(appId: 'your-app-id'),
);
```

#### Device Registration

```dart
// Register device for push notifications
final device = await NitroPingClient.instance.registerDevice(
  userId: 'user-123', // optional
);

// Update user ID later
await NitroPingClient.instance.updateUserId('new-user-id');

// Access registered device
final device = NitroPingClient.instance.device;
final token = NitroPingClient.instance.deviceToken;
```

#### Event Tracking

```dart
// Track notification events manually
await NitroPingClient.instance.trackDelivered('notification-id');
await NitroPingClient.instance.trackOpened('notification-id');
await NitroPingClient.instance.trackClicked('notification-id', action: 'view');
```

### Exceptions

```dart
try {
  await NitroPingClient.instance.registerDevice();
} on NitroPingNotConfiguredException {
  // SDK not configured
} on NitroPingPermissionDeniedException {
  // User denied notification permission
} on NitroPingNetworkException catch (e) {
  // Network error
  print('Status: ${e.statusCode}');
} on NitroPingGraphQLException catch (e) {
  // GraphQL API error
  print('Errors: ${e.errors}');
} on NitroPingRegistrationException {
  // Device registration failed
}
```

## Background Notifications

For background notification handling, set up a top-level handler:

```dart
// Must be top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  
  // Re-configure NitroPing for background isolate
  await NitroPingClient.configure(
    appId: 'your-app-id',
    apiUrl: 'https://your-server.com/api/graphql',
  );
  
  final notification = NitroPingClient.instance.handleNotification(message);
  print('Background notification: ${notification.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  // ... rest of initialization
}
```

## Platform Setup

### Android

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

### iOS

Add to `ios/Runner/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>fetch</string>
  <string>remote-notification</string>
</array>
```

## License

MIT License - see [LICENSE](LICENSE) file.
