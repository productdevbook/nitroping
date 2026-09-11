import Foundation

public enum NitroPingFeedbackType: String, Codable, Sendable {
    case complaint, bug, suggestion, featureRequest = "feature_request"
}

public enum NitroPingPlatform: String, Codable, Sendable {
    case ios
}

public struct NitroPingConfiguration: Sendable {
    public let projectKey: String
    public let apiBaseURL: URL

    public init(projectKey: String, apiBaseURL: URL = URL(string: "https://api.nitroping.com/api/v1")!) {
        self.projectKey = projectKey
        self.apiBaseURL = apiBaseURL
    }
}

public struct NitroPingFeedback: Codable, Sendable {
    public let type: NitroPingFeedbackType
    public let title: String
    public let body: String
    public let priority: String?
    public let email: String?
    public let platform: NitroPingPlatform
    public let appVersion: String?
    public let osVersion: String?
    public let locale: String?
    public let metadata: [String: String]?

    public init(type: NitroPingFeedbackType, title: String, body: String, priority: String? = nil, email: String? = nil, appVersion: String? = nil, metadata: [String: String]? = nil) {
        self.type = type; self.title = title; self.body = body; self.priority = priority; self.email = email
        self.platform = .ios; self.appVersion = appVersion; self.osVersion = ProcessInfo.processInfo.operatingSystemVersionString
        self.locale = Locale.current.identifier; self.metadata = metadata
    }
}

public struct NitroPingFeedbackResponse: Codable, Sendable {
    public let id: String
    public let status: String
    public let title: String
    public let createdAt: String
}

public enum NitroPingError: Error, Sendable {
    case invalidResponse
    case server(statusCode: Int, message: String)
}

public actor NitroPingClient {
    private let configuration: NitroPingConfiguration
    private let session: URLSession

    public init(configuration: NitroPingConfiguration, session: URLSession = .shared) {
        self.configuration = configuration; self.session = session
    }

    public func submit(_ feedback: NitroPingFeedback) async throws -> NitroPingFeedbackResponse {
        var request = URLRequest(url: configuration.apiBaseURL.appendingPathComponent("projects/\(configuration.projectKey)/feedback"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(configuration.projectKey, forHTTPHeaderField: "X-NitroPing-Project-Key")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "Idempotency-Key")
        request.httpBody = try JSONEncoder().encode(feedback)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NitroPingError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["message"] as? String ?? "NitroPing request failed"
            throw NitroPingError.server(statusCode: http.statusCode, message: message)
        }
        return try JSONDecoder().decode(NitroPingFeedbackResponse.self, from: data)
    }
}
