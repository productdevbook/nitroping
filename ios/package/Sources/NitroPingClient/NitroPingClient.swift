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
                "platform": "ios",
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
    
    private func trackNotificationDelivery(_ userInfo: [AnyHashable: Any]) async {
        // Extract notification ID if available
        guard let notificationId = userInfo["notification_id"] as? String else {
            return
        }
        
        let mutation = """
        mutation trackDelivery($notificationId: ID!) {
            trackNotificationDelivery(notificationId: $notificationId) {
                success
            }
        }
        """
        
        let variables: [String: Any] = [
            "notificationId": notificationId
        ]
        
        let body: [String: Any] = [
            "query": mutation,
            "variables": variables
        ]
        
        do {
            try await performGraphQLRequest(body: body)
            print("📊 NitroPing: Delivery tracked for notification: \(notificationId)")
        } catch {
            print("⚠️ NitroPing: Failed to track delivery: \(error)")
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
    
    private func getDeviceMetadata() -> [String: Any] {
        let device = UIDevice.current
        
        return [
            "deviceModel": device.model,
            "systemName": device.systemName,
            "systemVersion": device.systemVersion,
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown",
            "bundleId": Bundle.main.bundleIdentifier ?? "Unknown"
        ]
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