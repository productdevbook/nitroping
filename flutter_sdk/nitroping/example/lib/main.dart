import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:nitroping/nitroping.dart';

/// Background notification handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Background notification: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp();

  // Setup background handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Configure NitroPing
  await NitroPingClient.configure(
    appId: 'your-nitroping-app-id', // Replace with your app ID
    apiUrl: 'http://localhost:3000/api/graphql', // Replace with your server URL
    debug: true,
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NitroPing Example',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  DeviceRegistration? _device;
  String? _error;
  bool _isLoading = false;
  final List<String> _notifications = [];

  @override
  void initState() {
    super.initState();
    _setupMessageHandlers();
  }

  void _setupMessageHandlers() {
    NitroPingClient.instance.setupMessageHandlers(
      onMessage: (message) {
        setState(() {
          _notifications.insert(
            0,
            '📬 ${message.notification?.title ?? 'New notification'}',
          );
        });
      },
      onMessageOpenedApp: (message) {
        setState(() {
          _notifications.insert(
            0,
            '👆 Opened: ${message.notification?.title ?? 'Notification'}',
          );
        });
      },
    );
  }

  Future<void> _registerDevice() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final device = await NitroPingClient.instance.registerDevice(
        userId: 'demo-user',
      );

      setState(() {
        _device = device;
        _isLoading = false;
      });
    } on NitroPingPermissionDeniedException {
      setState(() {
        _error = 'Notification permission denied';
        _isLoading = false;
      });
    } on NitroPingException catch (e) {
      setState(() {
        _error = e.message;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NitroPing Demo'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Device Status',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    if (_device != null) ...[
                      Text('✅ Registered'),
                      const SizedBox(height: 4),
                      Text(
                        'ID: ${_device!.id}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        'Platform: ${_device!.platform}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ] else ...[
                      const Text('❌ Not registered'),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        '⚠️ $_error',
                        style: TextStyle(color: Colors.red[700]),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Register Button
            ElevatedButton.icon(
              onPressed: _isLoading ? null : _registerDevice,
              icon: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.notifications),
              label: Text(_device == null ? 'Register Device' : 'Re-register'),
            ),

            const SizedBox(height: 24),

            // Token Display
            if (NitroPingClient.instance.deviceToken != null) ...[
              Text(
                'Push Token:',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: SelectableText(
                  NitroPingClient.instance.deviceToken!,
                  style: const TextStyle(
                    fontSize: 10,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Notifications List
            Text(
              'Received Notifications (${_notifications.length})',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _notifications.isEmpty
                  ? const Center(
                      child: Text('No notifications yet'),
                    )
                  : ListView.builder(
                      itemCount: _notifications.length,
                      itemBuilder: (context, index) {
                        return ListTile(
                          dense: true,
                          title: Text(_notifications[index]),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
