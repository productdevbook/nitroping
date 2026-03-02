/// Push notification payload from NitroPing.
class NitroPingNotification {
  /// Notification title.
  final String? title;

  /// Notification body.
  final String? body;

  /// Notification icon URL.
  final String? icon;

  /// Notification image URL.
  final String? image;

  /// Badge count.
  final int? badge;

  /// Custom data payload.
  final Map<String, dynamic>? data;

  /// NitroPing notification ID (for tracking).
  final String? notificationId;

  /// NitroPing device ID (for tracking).
  final String? deviceId;

  const NitroPingNotification({
    this.title,
    this.body,
    this.icon,
    this.image,
    this.badge,
    this.data,
    this.notificationId,
    this.deviceId,
  });

  /// Parse notification from FCM RemoteMessage data.
  factory NitroPingNotification.fromRemoteMessageData(
    Map<String, dynamic> data,
  ) {
    return NitroPingNotification(
      title: data['title'] as String?,
      body: data['body'] as String?,
      icon: data['icon'] as String?,
      image: data['image'] as String?,
      badge: data['badge'] != null ? int.tryParse(data['badge'].toString()) : null,
      data: data['data'] is Map<String, dynamic>
          ? data['data'] as Map<String, dynamic>
          : null,
      notificationId: data['nitroping_notification_id'] as String?,
      deviceId: data['nitroping_device_id'] as String?,
    );
  }

  /// Check if this notification has tracking info.
  bool get hasTrackingInfo => notificationId != null && deviceId != null;

  @override
  String toString() {
    return 'NitroPingNotification(title: $title, body: $body)';
  }
}
