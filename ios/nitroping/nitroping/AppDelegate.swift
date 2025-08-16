import UIKit
import UserNotifications
import NitroPingClient

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate, ObservableObject {
    
    @Published var deviceToken: String = "Loading token..."
    @Published var notificationCount: Int = 0
    @Published var lastNotification: [AnyHashable: Any] = [:]
    
    private var nitroPingClient: NitroPingClient?
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        
        // Initialize NitroPing client
        nitroPingClient = NitroPingClient(
            apiURL: "http://172.20.10.3:3000/api/graphql", // Use network IP instead of localhost
            appId: "707bf3c9-5553-40da-9508-15a7bf371324" // Use APNs configured app ID
        )
        
        // Set notification delegate
        UNUserNotificationCenter.current().delegate = self
        
        // Initialize NitroPing (request permissions and register)
        Task {
            do {
                try await nitroPingClient?.initialize(userId: "demo-user-\(UUID().uuidString.prefix(8))")
            } catch {
                print("❌ Failed to initialize NitroPing: \(error)")
                // Fallback to manual permission request
                await requestNotificationPermission()
            }
        }
        
        return true
    }
    
    // MARK: - Remote Notifications
    
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        
        DispatchQueue.main.async {
            self.deviceToken = tokenString
        }
        
        print("📱 Device token: \(tokenString)")
        
        // Handle device token with NitroPing
        Task {
            await nitroPingClient?.handleDeviceToken(deviceToken)
        }
    }
    
    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("❌ Push notification registration failed: \(error)")
        
        DispatchQueue.main.async {
            self.deviceToken = "Registration failed: \(error.localizedDescription)"
        }
    }
    
    // MARK: - UNUserNotificationCenterDelegate
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo
        
        DispatchQueue.main.async {
            self.notificationCount += 1
            self.lastNotification = userInfo
        }
        
        print("📬 Notification received (foreground): \(userInfo)")
        
        // Handle notification with NitroPing (includes delivery tracking)
        nitroPingClient?.handleNotification(userInfo)
        
        // Track delivered if we have the necessary IDs
        if let notificationId = userInfo["nitroping_notification_id"] as? String,
           let deviceId = userInfo["nitroping_device_id"] as? String {
            Task {
                await nitroPingClient?.trackNotificationDelivered(notificationId: notificationId, deviceId: deviceId)
            }
        }
        
        // Show notification
        completionHandler([.banner, .badge, .sound])
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        
        DispatchQueue.main.async {
            self.lastNotification = userInfo
        }
        
        print("📬 Notification tapped: \(userInfo)")
        
        // Handle notification with NitroPing
        nitroPingClient?.handleNotification(userInfo)
        
        // Track opened and clicked if we have the necessary IDs
        if let notificationId = userInfo["nitroping_notification_id"] as? String,
           let deviceId = userInfo["nitroping_device_id"] as? String {
            Task {
                await nitroPingClient?.trackNotificationOpened(notificationId: notificationId, deviceId: deviceId)
                
                // If user performed specific action, track click
                if response.actionIdentifier != UNNotificationDefaultActionIdentifier {
                    await nitroPingClient?.trackNotificationClicked(notificationId: notificationId, deviceId: deviceId, action: response.actionIdentifier)
                } else {
                    // Default action (tap) counts as click too
                    await nitroPingClient?.trackNotificationClicked(notificationId: notificationId, deviceId: deviceId, action: "default")
                }
            }
        }
        
        completionHandler()
    }
    
    // MARK: - Private Methods
    
    private func requestNotificationPermission() async {
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(
                options: [.alert, .badge, .sound]
            )
            
            if granted {
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
                print("✅ Notification permission granted")
            } else {
                print("❌ Notification permission denied")
                await MainActor.run {
                    self.deviceToken = "Permission denied"
                }
            }
        } catch {
            print("❌ Permission request error: \(error)")
            await MainActor.run {
                self.deviceToken = "Permission error: \(error.localizedDescription)"
            }
        }
    }
    
    // MARK: - Public Methods
    
    func updateUserId(_ userId: String) async {
        do {
            try await nitroPingClient?.updateUserId(userId)
        } catch {
            print("❌ Failed to update user ID: \(error)")
        }
    }
    
    func testClickTracking() async {
        guard !lastNotification.isEmpty,
              let notificationId = lastNotification["nitroping_notification_id"] as? String,
              let deviceId = lastNotification["nitroping_device_id"] as? String else {
            print("❌ No recent notification to track click for")
            return
        }
        
        print("🔄 Testing click tracking for notification: \(notificationId)")
        await nitroPingClient?.trackNotificationClicked(notificationId: notificationId, deviceId: deviceId, action: "manual_test")
    }
    
}