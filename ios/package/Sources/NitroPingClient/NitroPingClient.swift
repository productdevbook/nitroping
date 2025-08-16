import Foundation
import UserNotifications

@available(iOS 15.0, macOS 12.0, *)
public class NitroPingClient: NSObject {
    
    // MARK: - Properties
    
    private let apiURL: String
    private let appId: String
    private var deviceToken: String?
    private var userId: String?
    
    // MARK: - Initialization
    
    public init(apiURL: String = "http://localhost:3000/api/graphql", appId: String) {
        self.apiURL = apiURL
        self.appId = appId
        super.init()
    }
    
    // MARK: - Public Methods
    
    /// Request push notification permission and register device
    public func initialize(userId: String? = nil) async throws {
        self.userId = userId
        
        // Request notification permission
        try await requestNotificationPermission()
        
        // Register for remote notifications
        await MainActor.run {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
    
    /// Handle device token received from APNS
    public func handleDeviceToken(_ deviceToken: Data) async {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceToken = tokenString
        
        print("📱 NitroPing: Device token received: \(tokenString)")
        
        // Register device with NitroPing
        do {
            try await registerDevice(token: tokenString)
        } catch {
            print("❌ NitroPing: Failed to register device: \(error)")
        }
    }
    
    /// Handle push notification received
    public func handleNotification(_ userInfo: [AnyHashable: Any]) {
        print("📬 NitroPing: Notification received: \(userInfo)")
        
        // Extract NitroPing specific data
        if let data = userInfo["data"] as? [String: Any] {
            print("📊 NitroPing: Notification data: \(data)")
        }
        
        // Track notification delivery (optional)
        Task {
            await trackNotificationDelivery(userInfo)
        }
    }
    
    /// Update user ID for the device
    public func updateUserId(_ userId: String) async throws {
        self.userId = userId
        
        // Re-register device with new user ID
        if let token = deviceToken {
            try await registerDevice(token: token)
        }
    }
    
    // MARK: - Private Methods
    
    private func requestNotificationPermission() async throws {
        let center = UNUserNotificationCenter.current()
        
        let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
        
        if !granted {
            throw NitroPingError.permissionDenied
        }
        
        print("✅ NitroPing: Notification permission granted")
    }
    
    private func registerDevice(token: String) async throws {
        let mutation = """
        mutation registerDevice($input: RegisterDeviceInput!) {
            registerDevice(input: $input) {
                id
                token
                platform
                userId
                status
                createdAt
            }
        }
        """
        
        let variables: [String: Any] = [
            "input": [
                "appId": appId,
                "token": token,
                "platform": "IOS",
                "userId": userId as Any,
                "metadata": getDeviceMetadata()
            ]
        ]
        
        let body: [String: Any] = [
            "query": mutation,
            "variables": variables
        ]
        
        try await performGraphQLRequest(body: body)
        print("✅ NitroPing: Device registered successfully")
    }
    
    /// Track notification delivered
    public func trackNotificationDelivered(notificationId: String, deviceId: String) async {
        let mutation = """
        mutation TrackNotificationDelivered($input: TrackEventInput!) {
            trackNotificationDelivered(input: $input) {
                success
                message
            }
        }
        """
        
        let variables: [String: Any] = [
            "input": [
                "notificationId": notificationId,
                "deviceId": deviceId,
                "platform": "IOS",
                "userAgent": getDeviceUserAgent(),
                "appVersion": getAppVersion(),
                "osVersion": UIDevice.current.systemVersion
            ]
        ]
        
        await trackEvent(mutation: mutation, variables: variables, eventType: "delivered")
    }
    
    /// Track notification opened
    public func trackNotificationOpened(notificationId: String, deviceId: String) async {
        let mutation = """
        mutation TrackNotificationOpened($input: TrackEventInput!) {
            trackNotificationOpened(input: $input) {
                success
                message
            }
        }
        """
        
        let variables: [String: Any] = [
            "input": [
                "notificationId": notificationId,
                "deviceId": deviceId,
                "platform": "IOS",
                "userAgent": getDeviceUserAgent(),
                "appVersion": getAppVersion(),
                "osVersion": UIDevice.current.systemVersion
            ]
        ]
        
        await trackEvent(mutation: mutation, variables: variables, eventType: "opened")
    }
    
    /// Track notification clicked
    public func trackNotificationClicked(notificationId: String, deviceId: String, action: String? = nil) async {
        let mutation = """
        mutation TrackNotificationClicked($input: TrackEventInput!) {
            trackNotificationClicked(input: $input) {
                success
                message
            }
        }
        """
        
        let inputData: [String: Any] = [
            "notificationId": notificationId,
            "deviceId": deviceId,
            "platform": "IOS",
            "userAgent": getDeviceUserAgent(),
            "appVersion": getAppVersion(),
            "osVersion": UIDevice.current.systemVersion
        ]
        
        let variables: [String: Any] = [
            "input": inputData
        ]
        
        await trackEvent(mutation: mutation, variables: variables, eventType: "clicked")
    }
    
    private func trackNotificationDelivery(_ userInfo: [AnyHashable: Any]) async {
        // Extract NitroPing IDs from notification payload
        guard let notificationId = userInfo["nitroping_notification_id"] as? String,
              let deviceId = userInfo["nitroping_device_id"] as? String else {
            return
        }
        
        await trackNotificationDelivered(notificationId: notificationId, deviceId: deviceId)
    }
    
    private func trackEvent(mutation: String, variables: [String: Any], eventType: String) async {
        do {
            let body: [String: Any] = [
                "query": mutation,
                "variables": variables
            ]
            
            try await performGraphQLRequest(body: body)
            print("✅ NitroPing: Notification \(eventType) tracked successfully")
        } catch {
            print("❌ NitroPing: Failed to track notification \(eventType): \(error)")
        }
    }
    
    private func performGraphQLRequest(body: [String: Any]) async throws {
        guard let url = URL(string: apiURL) else {
            throw NitroPingError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        } catch {
            throw NitroPingError.serializationError(error)
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NitroPingError.invalidResponse
        }
        
        guard 200...299 ~= httpResponse.statusCode else {
            throw NitroPingError.httpError(httpResponse.statusCode)
        }
        
        // Parse response to check for GraphQL errors
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let errors = json["errors"] as? [[String: Any]] {
            let errorMessages = errors.compactMap { $0["message"] as? String }
            throw NitroPingError.graphQLError(errorMessages.joined(separator: ", "))
        }
    }
    
    private func getDeviceMetadata() -> String {
        let device = UIDevice.current
        
        let metadata: [String: Any] = [
            "deviceModel": device.model,
            "systemName": device.systemName,
            "systemVersion": device.systemVersion,
            "appVersion": getAppVersion(),
            "bundleId": Bundle.main.bundleIdentifier ?? "Unknown"
        ]
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: metadata, options: [])
            return String(data: jsonData, encoding: .utf8) ?? "{}"
        } catch {
            return "{}"
        }
    }
    
    private func getDeviceUserAgent() -> String {
        let device = UIDevice.current
        let appVersion = getAppVersion()
        return "NitroPing iOS/\(appVersion) (\(device.model); \(device.systemName) \(device.systemVersion))"
    }
    
    private func getAppVersion() -> String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown"
    }
}

// MARK: - Error Types

public enum NitroPingError: LocalizedError {
    case permissionDenied
    case invalidURL
    case serializationError(Error)
    case invalidResponse
    case httpError(Int)
    case graphQLError(String)
    
    public var errorDescription: String? {
        switch self {
        case .permissionDenied:
            return "Push notification permission denied"
        case .invalidURL:
            return "Invalid API URL"
        case .serializationError(let error):
            return "Serialization error: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .graphQLError(let message):
            return "GraphQL error: \(message)"
        }
    }
}

// MARK: - UIApplication Extension

#if os(iOS)
import UIKit

extension UIApplication {
    
    /// Get the current NitroPing client instance from AppDelegate
    public var nitroPingClient: NitroPingClient? {
        guard let appDelegate = delegate as? AppDelegate else {
            return nil
        }
        return appDelegate.nitroPingClient
    }
}
#endif