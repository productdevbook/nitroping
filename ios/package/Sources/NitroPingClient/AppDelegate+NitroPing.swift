import Foundation
import UIKit
import UserNotifications

/// AppDelegate extension for NitroPing integration
@available(iOS 15.0, *)
public extension UIApplicationDelegate {
    
    /// Setup NitroPing with your app
    func setupNitroPing(appId: String, apiURL: String = "http://localhost:3000/api/graphql") -> NitroPingClient {
        let client = NitroPingClient(apiURL: apiURL, appId: appId)
        
        // Store client in AppDelegate
        if let appDelegate = self as? AppDelegate {
            appDelegate.nitroPingClient = client
        }
        
        return client
    }
}

/// Example AppDelegate implementation
open class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    
    public var nitroPingClient: NitroPingClient?
    
    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        
        // Initialize NitroPing
        nitroPingClient = setupNitroPing(
            appId: "your-app-id-here", // Replace with your actual app ID
            apiURL: "http://localhost:3000/api/graphql" // Replace with your NitroPing server URL
        )
        
        // Set notification delegate
        UNUserNotificationCenter.current().delegate = self
        
        // Initialize NitroPing (request permissions and register)
        Task {
            do {
                try await nitroPingClient?.initialize(userId: "demo-user-\(UUID().uuidString)")
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
        // Handle notification when app is in foreground
        nitroPingClient?.handleNotification(notification.request.content.userInfo)
        
        // Show notification even when app is in foreground
        completionHandler([.banner, .badge, .sound])
    }
    
    public func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // Handle notification tap
        nitroPingClient?.handleNotification(response.notification.request.content.userInfo)
        
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
    
    @StateObject private var appDelegate = AppDelegate()
    
    public func body(content: Content) -> some View {
        content
            .onAppear {
                // Setup NitroPing for SwiftUI apps
                let client = appDelegate.setupNitroPing(appId: appId, apiURL: apiURL)
                
                Task {
                    do {
                        try await client.initialize(userId: userId)
                    } catch {
                        print("❌ Failed to initialize NitroPing: \(error)")
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