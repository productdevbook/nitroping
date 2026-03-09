/// Registered device information from NitroPing server.
class DeviceRegistration {
  /// Unique device ID.
  final String id;

  /// App ID this device belongs to.
  final String appId;

  /// Push token (FCM or APNs).
  final String token;

  /// Platform: 'IOS' or 'ANDROID'.
  final String platform;

  /// Optional user ID.
  final String? userId;

  /// Device status: 'ACTIVE' or 'INACTIVE'.
  final String status;

  /// Device metadata as JSON string.
  final String? metadata;

  /// Last seen timestamp.
  final DateTime? lastSeenAt;

  /// Creation timestamp.
  final DateTime createdAt;

  /// Last update timestamp.
  final DateTime updatedAt;

  const DeviceRegistration({
    required this.id,
    required this.appId,
    required this.token,
    required this.platform,
    this.userId,
    required this.status,
    this.metadata,
    this.lastSeenAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DeviceRegistration.fromJson(Map<String, dynamic> json) {
    return DeviceRegistration(
      id: json['id'] as String,
      appId: json['appId'] as String,
      token: json['token'] as String,
      platform: json['platform'] as String,
      userId: json['userId'] as String?,
      status: json['status'] as String,
      metadata: json['metadata'] as String?,
      lastSeenAt: json['lastSeenAt'] != null
          ? DateTime.parse(json['lastSeenAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'appId': appId,
      'token': token,
      'platform': platform,
      'userId': userId,
      'status': status,
      'metadata': metadata,
      'lastSeenAt': lastSeenAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  @override
  String toString() {
    return 'DeviceRegistration(id: $id, platform: $platform, status: $status)';
  }
}
