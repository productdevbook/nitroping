/// Configuration for NitroPing client.
class NitroPingConfig {
  /// Your NitroPing app ID.
  final String appId;

  /// NitroPing API URL (GraphQL endpoint).
  final String apiUrl;

  /// Optional default user ID for device registration.
  final String? userId;

  /// Enable debug logging.
  final bool debug;

  const NitroPingConfig({
    required this.appId,
    required this.apiUrl,
    this.userId,
    this.debug = false,
  });

  /// Create config with default localhost URL.
  factory NitroPingConfig.localhost({
    required String appId,
    String? userId,
    bool debug = true,
  }) {
    return NitroPingConfig(
      appId: appId,
      apiUrl: 'http://localhost:3000/api/graphql',
      userId: userId,
      debug: debug,
    );
  }
}
