import UIKit
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate, ObservableObject {
    
    @Published var deviceToken: String = "Loading token..."
    @Published var notificationCount: Int = 0
    @Published var lastNotification: [AnyHashable: Any] = [:]
    
    private var nitroPingService: NitroPingService?
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        
        // Initialize NitroPing service
        nitroPingService = NitroPingService()
        
        // Set notification delegate
        UNUserNotificationCenter.current().delegate = self
        
        // Request push notification permission
        Task {
            await requestNotificationPermission()
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
        
        // Register device with NitroPing
        Task {
            await nitroPingService?.registerDevice(token: tokenString)
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
        
        // Track delivery
        trackNotificationDelivered(userInfo: userInfo)
        
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
        
        // Track notification opened/clicked
        trackNotificationOpened(userInfo: userInfo)
        
        // If user performed specific action, track click
        if response.actionIdentifier != UNNotificationDefaultActionIdentifier {
            trackNotificationClicked(userInfo: userInfo, action: response.actionIdentifier)
        } else {
            // Default action (tap) counts as click too
            trackNotificationClicked(userInfo: userInfo, action: "default")
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
        await nitroPingService?.updateUserId(userId)
    }
    
    // MARK: - Notification Tracking
    
    private func trackNotificationDelivered(userInfo: [AnyHashable: Any]) {
        guard let notificationId = userInfo["nitroping_notification_id"] as? String,
              let deviceId = userInfo["nitroping_device_id"] as? String else {
            return
        }
        
        Task {
            await nitroPingService?.trackNotificationDelivered(notificationId: notificationId, deviceId: deviceId)
        }
    }
    
    private func trackNotificationOpened(userInfo: [AnyHashable: Any]) {
        guard let notificationId = userInfo["nitroping_notification_id"] as? String,
              let deviceId = userInfo["nitroping_device_id"] as? String else {
            return
        }
        
        Task {
            await nitroPingService?.trackNotificationOpened(notificationId: notificationId, deviceId: deviceId)
        }
    }
    
    private func trackNotificationClicked(userInfo: [AnyHashable: Any], action: String) {
        guard let notificationId = userInfo["nitroping_notification_id"] as? String,
              let deviceId = userInfo["nitroping_device_id"] as? String else {
            return
        }
        
        Task {
            await nitroPingService?.trackNotificationClicked(notificationId: notificationId, deviceId: deviceId, action: action)
        }
    }
}