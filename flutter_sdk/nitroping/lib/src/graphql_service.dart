import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'exceptions.dart';
import 'models/device.dart';

/// Internal GraphQL service for NitroPing API communication.
class GraphQLService {
  final String apiUrl;
  final bool debug;

  const GraphQLService({
    required this.apiUrl,
    this.debug = false,
  });

  /// Register a device with NitroPing server.
  Future<DeviceRegistration> registerDevice({
    required String appId,
    required String token,
    required String platform,
    String? userId,
    String? metadata,
  }) async {
    const mutation = '''
      mutation RegisterDevice(\$input: RegisterDeviceInput!) {
        registerDevice(input: \$input) {
          id
          appId
          token
          platform
          userId
          status
          metadata
          lastSeenAt
          createdAt
          updatedAt
        }
      }
    ''';

    final variables = {
      'input': {
        'appId': appId,
        'token': token,
        'platform': platform,
        if (userId != null) 'userId': userId,
        if (metadata != null) 'metadata': metadata,
      },
    };

    final result = await _request(mutation, variables);
    
    final registerDevice = result['data']?['registerDevice'];
    if (registerDevice == null) {
      throw const NitroPingRegistrationException();
    }

    return DeviceRegistration.fromJson(registerDevice as Map<String, dynamic>);
  }

  /// Track notification delivered event.
  Future<void> trackDelivered({
    required String notificationId,
    required String deviceId,
    required String platform,
    String? userAgent,
    String? appVersion,
    String? osVersion,
  }) async {
    await _trackEvent(
      mutationName: 'trackNotificationDelivered',
      operationName: 'TrackNotificationDelivered',
      notificationId: notificationId,
      deviceId: deviceId,
      platform: platform,
      userAgent: userAgent,
      appVersion: appVersion,
      osVersion: osVersion,
    );
  }

  /// Track notification opened event.
  Future<void> trackOpened({
    required String notificationId,
    required String deviceId,
    required String platform,
    String? userAgent,
    String? appVersion,
    String? osVersion,
  }) async {
    await _trackEvent(
      mutationName: 'trackNotificationOpened',
      operationName: 'TrackNotificationOpened',
      notificationId: notificationId,
      deviceId: deviceId,
      platform: platform,
      userAgent: userAgent,
      appVersion: appVersion,
      osVersion: osVersion,
    );
  }

  /// Track notification clicked event.
  Future<void> trackClicked({
    required String notificationId,
    required String deviceId,
    required String platform,
    String? userAgent,
    String? appVersion,
    String? osVersion,
    String? action,
  }) async {
    await _trackEvent(
      mutationName: 'trackNotificationClicked',
      operationName: 'TrackNotificationClicked',
      notificationId: notificationId,
      deviceId: deviceId,
      platform: platform,
      userAgent: userAgent,
      appVersion: appVersion,
      osVersion: osVersion,
    );
  }

  Future<void> _trackEvent({
    required String mutationName,
    required String operationName,
    required String notificationId,
    required String deviceId,
    required String platform,
    String? userAgent,
    String? appVersion,
    String? osVersion,
  }) async {
    final mutation = '''
      mutation $operationName(\$input: TrackEventInput!) {
        $mutationName(input: \$input) {
          success
          message
        }
      }
    ''';

    final variables = {
      'input': {
        'notificationId': notificationId,
        'deviceId': deviceId,
        'platform': platform,
        if (userAgent != null) 'userAgent': userAgent,
        if (appVersion != null) 'appVersion': appVersion,
        if (osVersion != null) 'osVersion': osVersion,
      },
    };

    await _request(mutation, variables);
  }

  Future<Map<String, dynamic>> _request(
    String query,
    Map<String, dynamic> variables,
  ) async {
    final body = jsonEncode({
      'query': query,
      'variables': variables,
    });

    if (debug) {
      print('📤 NitroPing: Request to $apiUrl');
      print('📤 NitroPing: Body: $body');
    }

    try {
      final response = await http.post(
        Uri.parse(apiUrl),
        headers: {'Content-Type': 'application/json'},
        body: body,
      );

      if (debug) {
        print('📥 NitroPing: Response ${response.statusCode}');
        print('📥 NitroPing: Body: ${response.body}');
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw NitroPingNetworkException(
          'HTTP error: ${response.statusCode}',
          statusCode: response.statusCode,
        );
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;

      // Check for GraphQL errors
      final errors = json['errors'] as List<dynamic>?;
      if (errors != null && errors.isNotEmpty) {
        final errorMessages = errors
            .map((e) => (e as Map<String, dynamic>)['message'] as String?)
            .where((m) => m != null)
            .cast<String>()
            .toList();
        throw NitroPingGraphQLException(errorMessages);
      }

      return json;
    } on SocketException catch (e) {
      throw NitroPingNetworkException(
        'Network error: ${e.message}',
        originalError: e,
      );
    } on FormatException catch (e) {
      throw NitroPingNetworkException(
        'Invalid response format: ${e.message}',
        originalError: e,
      );
    }
  }
}
