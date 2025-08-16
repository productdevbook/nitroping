import Foundation
import UIKit

class NitroPingService {
    
    // MARK: - Configuration
    
    private let apiURL = "http://localhost:3000/api/graphql"
    private let appId = "demo-app-id" // ⚠️ Replace with your actual app ID
    
    private var userId: String?
    
    // MARK: - Public Methods
    
    func registerDevice(token: String) async {
        let userId = self.userId ?? "demo-user-\(UUID().uuidString.prefix(8))"
        self.userId = userId
        
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
                "userId": userId,
                "metadata": getDeviceMetadata()
            ]
        ]
        
        do {
            let result = try await performGraphQLRequest(
                query: mutation,
                variables: variables
            )
            
            if let data = result["data"] as? [String: Any],
               let device = data["registerDevice"] as? [String: Any] {
                print("✅ Device registered: \(device["id"] ?? "unknown")")
            } else if let errors = result["errors"] as? [[String: Any]] {
                let errorMessages = errors.compactMap { $0["message"] as? String }
                print("❌ Registration failed: \(errorMessages.joined(separator: ", "))")
            }
        } catch {
            print("❌ Registration error: \(error)")
        }
    }
    
    func updateUserId(_ newUserId: String) async {
        self.userId = newUserId
        
        // Re-register device if needed
        // Keeping it simple in this example
        print("✅ User ID updated to: \(newUserId)")
    }
    
    func trackNotificationDelivered(notificationId: String, deviceId: String) async {
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
    
    func trackNotificationOpened(notificationId: String, deviceId: String) async {
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
    
    func trackNotificationClicked(notificationId: String, deviceId: String, action: String? = nil) async {
        let mutation = """
        mutation TrackNotificationClicked($input: TrackEventInput!) {
            trackNotificationClicked(input: $input) {
                success
                message
            }
        }
        """
        
        var inputData: [String: Any] = [
            "notificationId": notificationId,
            "deviceId": deviceId,
            "platform": "IOS",
            "userAgent": getDeviceUserAgent(),
            "appVersion": getAppVersion(),
            "osVersion": UIDevice.current.systemVersion
        ]
        
        // Add action info if available
        if let action = action {
            inputData["action"] = action
        }
        
        let variables: [String: Any] = [
            "input": inputData
        ]
        
        await trackEvent(mutation: mutation, variables: variables, eventType: "clicked")
    }
    
    // MARK: - Private Methods
    
    private func performGraphQLRequest(
        query: String,
        variables: [String: Any]
    ) async throws -> [String: Any] {
        
        guard let url = URL(string: apiURL) else {
            throw NitroPingError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "query": query,
            "variables": variables
        ]
        
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
        
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw NitroPingError.invalidJSON
        }
        
        return json
    }
    
    private func getDeviceMetadata() -> [String: Any] {
        let device = UIDevice.current
        
        return [
            "deviceModel": device.model,
            "systemName": device.systemName,
            "systemVersion": device.systemVersion,
            "appVersion": getAppVersion(),
            "bundleId": Bundle.main.bundleIdentifier ?? "Unknown",
            "deviceName": device.name
        ]
    }
    
    private func trackEvent(mutation: String, variables: [String: Any], eventType: String) async {
        do {
            let result = try await performGraphQLRequest(
                query: mutation,
                variables: variables
            )
            
            if let data = result["data"] as? [String: Any],
               let trackResult = data["trackNotification\(eventType.capitalized)"] as? [String: Any],
               let success = trackResult["success"] as? Bool {
                if success {
                    print("✅ Notification \(eventType) tracked successfully")
                } else {
                    let message = trackResult["message"] as? String ?? "Unknown error"
                    print("❌ Failed to track notification \(eventType): \(message)")
                }
            } else if let errors = result["errors"] as? [[String: Any]] {
                let errorMessages = errors.compactMap { $0["message"] as? String }
                print("❌ Tracking \(eventType) failed: \(errorMessages.joined(separator: ", "))")
            }
        } catch {
            print("❌ Tracking \(eventType) error: \(error)")
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

enum NitroPingError: LocalizedError {
    case invalidURL
    case serializationError(Error)
    case invalidResponse
    case httpError(Int)
    case invalidJSON
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .serializationError(let error):
            return "Serialization error: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .invalidJSON:
            return "Invalid JSON response"
        }
    }
}