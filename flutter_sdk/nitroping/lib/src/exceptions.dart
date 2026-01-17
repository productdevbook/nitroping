/// Base exception for NitroPing SDK errors.
class NitroPingException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;

  const NitroPingException(
    this.message, {
    this.code,
    this.statusCode,
  });

  @override
  String toString() => 'NitroPingException: $message (code: $code)';
}

/// Thrown when the SDK is not properly configured.
class NitroPingNotConfiguredException extends NitroPingException {
  const NitroPingNotConfiguredException()
      : super(
          'NitroPing SDK not configured. Call NitroPingClient.configure() first.',
          code: 'NOT_CONFIGURED',
        );
}

/// Thrown when notification permission is denied.
class NitroPingPermissionDeniedException extends NitroPingException {
  const NitroPingPermissionDeniedException()
      : super(
          'Push notification permission denied.',
          code: 'PERMISSION_DENIED',
        );
}

/// Thrown when a network request fails.
class NitroPingNetworkException extends NitroPingException {
  final Object? originalError;

  const NitroPingNetworkException(
    super.message, {
    this.originalError,
    super.statusCode,
  }) : super(code: 'NETWORK_ERROR');
}

/// Thrown when the GraphQL API returns an error.
class NitroPingGraphQLException extends NitroPingException {
  final List<String> errors;

  NitroPingGraphQLException(this.errors)
      : super(
          errors.join(', '),
          code: 'GRAPHQL_ERROR',
        );
}

/// Thrown when device registration fails.
class NitroPingRegistrationException extends NitroPingException {
  const NitroPingRegistrationException([super.message = 'Device registration failed'])
      : super(code: 'REGISTRATION_FAILED');
}
