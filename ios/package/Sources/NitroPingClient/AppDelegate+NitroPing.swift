import Foundation
import UIKit
import UserNotifications

/// AppDelegate extension for NitroPing integration
@available(iOS 15.0, *)
public extension UIApplicationDelegate {
    
    /// Setup NitroPing with your app
    func setupNitroPing(appId: String, apiURL: String = "http://localhost:3000/api/graphql", userId: String? = nil) -> NitroPingClient {
        let client = NitroPingClient(apiURL: apiURL, appId: appId)
        
        // Store client in AppDelegate
        if let appDelegate = self as? AppDelegate {
            appDelegate.nitroPingClient = client
        }
        
        return client
    }
}

/// Example AppDelegate implementation
open class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate, ObservableObject {
    
    public var nitroPingClient: NitroPingClient?
    private var nitroPingUserId: String?
    
    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        
        // Initialize NitroPing
        let defaultUserId = "demo-user" // Replace with your actual user ID
        nitroPingUserId = defaultUserId
        
        nitroPingClient = setupNitroPing(
            appId: "your-app-id-here", // Replace with your actual app ID
            apiURL: "http://localhost:3000/api/graphql", // Replace with your NitroPing server URL
            userId: defaultUserId
        )
        
        // Set notification delegate
        UNUserNotificationCenter.current().delegate = self
        
        // Initialize NitroPing (request permissions and register)
        Task {
            do {
                try await nitroPingClient?.initialize(userId: nitroPingUserId)
            } catch {
                print("❌ Failed to initialize NitroPing: \(error)")
            }
        }
        
        return true
    }
    
    // MARK: - Remote Notifications
    
    public func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        print("📱 Device token received")
        
        // Handle device token with NitroPing
        Task {
            await nitroPingClient?.handleDeviceToken(deviceToken)
        }
    }
    
    public func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("❌ Failed to register for remote notifications: \(error)")
    }
    
    // MARK: - UNUserNotificationCenterDelegate
    
    public func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo
        
        // Handle notification when app is in foreground (delivered)
        nitroPingClient?.handleNotification(userInfo)
        
        // Track delivered if we have the necessary IDs
        if let notificationId = userInfo["nitroping_notification_id"] as? String,
           let deviceId = userInfo["nitroping_device_id"] as? String {
            Task {
                await nitroPingClient?.trackNotificationDelivered(notificationId: notificationId, deviceId: deviceId)
            }
        }
        
        // Show notification even when app is in foreground
        completionHandler([.banner, .badge, .sound])
    }
    
    public func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        
        // Handle notification tap (opened)
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
}

// MARK: - SwiftUI App Integration

#if canImport(SwiftUI)
import SwiftUI

@available(iOS 15.0, *)
public struct NitroPingAppModifier: ViewModifier {
    let appId: String
    let apiURL: String
    let userId: String?
    
    @State private var nitroPingClient: NitroPingClient?
    
    public func body(content: Content) -> some View {
        content
            .onAppear {
                // Setup NitroPing for SwiftUI apps
                if nitroPingClient == nil {
                    let client = NitroPingClient(apiURL: apiURL, appId: appId)
                    nitroPingClient = client
                    
                    Task {
                        do {
                            try await client.initialize(userId: userId ?? "demo-user")
                        } catch {
                            print("❌ Failed to initialize NitroPing: \(error)")
                        }
                    }
                }
            }
    }
}

@available(iOS 15.0, *)
public extension View {
    func nitroPing(
        appId: String,
        apiURL: String = "http://localhost:3000/api/graphql",
        userId: String? = nil
    ) -> some View {
        modifier(NitroPingAppModifier(appId: appId, apiURL: apiURL, userId: userId))
    }
}
#endif