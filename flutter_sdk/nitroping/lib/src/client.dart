import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'exceptions.dart';
import 'graphql_service.dart';
import 'models/config.dart';
import 'models/device.dart';
import 'models/notification.dart';

/// Main client for NitroPing push notification service.
///
/// Usage:
/// ```dart
/// // Initialize in your app
/// await NitroPingClient.configure(
///   appId: 'your-app-id',
///   apiUrl: 'https://your-server.com/api/graphql',
/// );
///
/// // Register device for push notifications
/// final device = await NitroPingClient.instance.registerDevice();
/// ```
class NitroPingClient {
  static NitroPingClient? _instance;

  /// Get the singleton instance.
  /// Throws [NitroPingNotConfiguredException] if not configured.
  static NitroPingClient get instance {
    if (_instance == null) {
      throw const NitroPingNotConfiguredException();
    }
    return _instance!;
  }

  /// Check if the client is configured.
  static bool get isConfigured => _instance != null;

  final NitroPingConfig _config;
  final GraphQLService _graphql;
  final FirebaseMessaging _messaging;

  String? _deviceToken;
  DeviceRegistration? _device;

  NitroPingClient._({
    required NitroPingConfig config,
    FirebaseMessaging? messaging,
  })  : _config = config,
        _messaging = messaging ?? FirebaseMessaging.instance,
        _graphql = GraphQLService(
          apiUrl: config.apiUrl,
          debug: config.debug,
        );

  /// Configure the NitroPing client.
  ///
  /// Must be called before using [instance].
  /// Typically called after [Firebase.initializeApp()].
  static Future<void> configure({
    required String appId,
    required String apiUrl,
    String? userId,
    bool debug = false,
  }) async {
    _instance = NitroPingClient._(
      config: NitroPingConfig(
        appId: appId,
        apiUrl: apiUrl,
        userId: userId,
        debug: debug,
      ),
    );

    if (debug) {
      debugPrint('✅ NitroPing: Configured with appId: $appId');
    }
  }

  /// Configure with a [NitroPingConfig] object.
  static Future<void> configureWithConfig(NitroPingConfig config) async {
    _instance = NitroPingClient._(config: config);

    if (config.debug) {
      debugPrint('✅ NitroPing: Configured with appId: ${config.appId}');
    }
  }

  /// The current device registration, if available.
  DeviceRegistration? get device => _device;

  /// The current device token, if available.
  String? get deviceToken => _deviceToken;

  /// The current configuration.
  NitroPingConfig get config => _config;

  /// Request notification permissions and register device.
  ///
  /// Returns the [DeviceRegistration] from the server.
  Future<DeviceRegistration> registerDevice({
    String? userId,
  }) async {
    // Request permission
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      throw const NitroPingPermissionDeniedException();
    }

    if (_config.debug) {
      debugPrint('✅ NitroPing: Notification permission granted');
    }

    // Get FCM token
    _deviceToken = await _messaging.getToken();
    if (_deviceToken == null) {
      throw const NitroPingRegistrationException('Failed to get push token');
    }

    if (_config.debug) {
      debugPrint('📱 NitroPing: Token: $_deviceToken');
    }

    // Determine platform
    final platform = _getPlatform();

    // Register with NitroPing server
    _device = await _graphql.registerDevice(
      appId: _config.appId,
      token: _deviceToken!,
      platform: platform,
      userId: userId ?? _config.userId,
      metadata: _getDeviceMetadata(),
    );

    if (_config.debug) {
      debugPrint('✅ NitroPing: Device registered: ${_device!.id}');
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen(_handleTokenRefresh);

    return _device!;
  }

  /// Update user ID for the current device.
  Future<DeviceRegistration> updateUserId(String userId) async {
    if (_deviceToken == null) {
      throw const NitroPingRegistrationException(
        'Device not registered. Call registerDevice() first.',
      );
    }

    _device = await _graphql.registerDevice(
      appId: _config.appId,
      token: _deviceToken!,
      platform: _getPlatform(),
      userId: userId,
      metadata: _getDeviceMetadata(),
    );

    if (_config.debug) {
      debugPrint('✅ NitroPing: User ID updated to: $userId');
    }

    return _device!;
  }

  /// Handle incoming notification and parse NitroPing data.
  NitroPingNotification handleNotification(RemoteMessage message) {
    final notification = NitroPingNotification.fromRemoteMessageData(
      message.data,
    );

    if (_config.debug) {
      debugPrint('📬 NitroPing: Received notification: $notification');
    }

    // Auto-track delivery if tracking info is available
    if (notification.hasTrackingInfo && _device != null) {
      trackDelivered(notification.notificationId!);
    }

    return notification;
  }

  /// Track that a notification was delivered.
  Future<void> trackDelivered(String notificationId) async {
    if (_device == null) {
      if (_config.debug) {
        debugPrint('⚠️ NitroPing: Cannot track - device not registered');
      }
      return;
    }

    try {
      await _graphql.trackDelivered(
        notificationId: notificationId,
        deviceId: _device!.id,
        platform: _getPlatform(),
        userAgent: _getUserAgent(),
        appVersion: _getAppVersion(),
        osVersion: _getOsVersion(),
      );

      if (_config.debug) {
        debugPrint('✅ NitroPing: Tracked delivery for $notificationId');
      }
    } catch (e) {
      if (_config.debug) {
        debugPrint('❌ NitroPing: Failed to track delivery: $e');
      }
    }
  }

  /// Track that a notification was opened.
  Future<void> trackOpened(String notificationId) async {
    if (_device == null) return;

    try {
      await _graphql.trackOpened(
        notificationId: notificationId,
        deviceId: _device!.id,
        platform: _getPlatform(),
        userAgent: _getUserAgent(),
        appVersion: _getAppVersion(),
        osVersion: _getOsVersion(),
      );

      if (_config.debug) {
        debugPrint('✅ NitroPing: Tracked open for $notificationId');
      }
    } catch (e) {
      if (_config.debug) {
        debugPrint('❌ NitroPing: Failed to track open: $e');
      }
    }
  }

  /// Track that a notification was clicked (with optional action).
  Future<void> trackClicked(String notificationId, {String? action}) async {
    if (_device == null) return;

    try {
      await _graphql.trackClicked(
        notificationId: notificationId,
        deviceId: _device!.id,
        platform: _getPlatform(),
        userAgent: _getUserAgent(),
        appVersion: _getAppVersion(),
        osVersion: _getOsVersion(),
        action: action,
      );

      if (_config.debug) {
        debugPrint('✅ NitroPing: Tracked click for $notificationId');
      }
    } catch (e) {
      if (_config.debug) {
        debugPrint('❌ NitroPing: Failed to track click: $e');
      }
    }
  }

  /// Setup message handlers for foreground and background notifications.
  void setupMessageHandlers({
    void Function(RemoteMessage)? onMessage,
    void Function(RemoteMessage)? onMessageOpenedApp,
  }) {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((message) {
      final notification = handleNotification(message);
      onMessage?.call(message);

      if (notification.hasTrackingInfo) {
        trackDelivered(notification.notificationId!);
      }
    });

    // When app is opened from notification
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      final notification = handleNotification(message);
      onMessageOpenedApp?.call(message);

      if (notification.hasTrackingInfo) {
        trackOpened(notification.notificationId!);
      }
    });
  }

  void _handleTokenRefresh(String newToken) {
    if (_config.debug) {
      debugPrint('🔄 NitroPing: Token refreshed');
    }

    _deviceToken = newToken;

    // Re-register with new token
    if (_device != null) {
      _graphql.registerDevice(
        appId: _config.appId,
        token: newToken,
        platform: _getPlatform(),
        userId: _device!.userId,
        metadata: _getDeviceMetadata(),
      ).then((device) {
        _device = device;
        if (_config.debug) {
          debugPrint('✅ NitroPing: Re-registered with new token');
        }
      }).catchError((e) {
        if (_config.debug) {
          debugPrint('❌ NitroPing: Failed to re-register: $e');
        }
      });
    }
  }

  String _getPlatform() {
    if (kIsWeb) return 'WEB';
    if (Platform.isIOS) return 'IOS';
    if (Platform.isAndroid) return 'ANDROID';
    return 'UNKNOWN';
  }

  String _getDeviceMetadata() {
    final metadata = <String, dynamic>{
      'platform': _getPlatform(),
      'isWeb': kIsWeb,
    };

    if (!kIsWeb) {
      metadata['osVersion'] = Platform.operatingSystemVersion;
      metadata['locale'] = Platform.localeName;
    }

    return jsonEncode(metadata);
  }

  String _getUserAgent() {
    if (kIsWeb) return 'NitroPing Flutter/Web';
    return 'NitroPing Flutter/${Platform.operatingSystem}';
  }

  String? _getAppVersion() {
    // Could be enhanced with package_info_plus
    return null;
  }

  String? _getOsVersion() {
    if (kIsWeb) return null;
    return Platform.operatingSystemVersion;
  }
}
