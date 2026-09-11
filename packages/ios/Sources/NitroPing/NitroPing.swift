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

    public init(projectKey: String, apiBaseURL: URL = URL(string: "https://nitroping.dev/api/v1")!) {
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
    case queued
}

private struct NitroPingPendingSubmission: Codable, Sendable {
    let feedback: NitroPingFeedback
    let idempotencyKey: String
}

public actor NitroPingClient {
    private let configuration: NitroPingConfiguration
    private let session: URLSession
    private let pendingStorageKey = "com.nitroping.pending-submissions"
    private var pending: [NitroPingPendingSubmission]

    public init(configuration: NitroPingConfiguration, session: URLSession = .shared) {
        self.configuration = configuration; self.session = session
        self.pending = (try? JSONDecoder().decode([NitroPingPendingSubmission].self, from: UserDefaults.standard.data(forKey: pendingStorageKey) ?? Data())) ?? []
    }

    public func submit(_ feedback: NitroPingFeedback) async throws -> NitroPingFeedbackResponse {
        let idempotencyKey = UUID().uuidString
        do {
            return try await send(feedback, idempotencyKey: idempotencyKey)
        } catch let error as NitroPingError {
            if case .server(let statusCode, _) = error, statusCode < 500 { throw error }
            pending.append(NitroPingPendingSubmission(feedback: feedback, idempotencyKey: idempotencyKey)); persist()
            throw NitroPingError.queued
        } catch {
            pending.append(NitroPingPendingSubmission(feedback: feedback, idempotencyKey: idempotencyKey)); persist()
            throw NitroPingError.queued
        }
    }

    public func flushPending() async {
        var remaining: [NitroPingPendingSubmission] = []
        for item in pending {
            do { _ = try await send(item.feedback, idempotencyKey: item.idempotencyKey) }
            catch { remaining.append(item) }
        }
        pending = remaining
        persist()
    }

    public var pendingCount: Int { pending.count }

    private func send(_ feedback: NitroPingFeedback, idempotencyKey: String) async throws -> NitroPingFeedbackResponse {
        var request = URLRequest(url: configuration.apiBaseURL.appendingPathComponent("projects/\(configuration.projectKey)/feedback"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(configuration.projectKey, forHTTPHeaderField: "X-NitroPing-Project-Key")
        request.setValue(idempotencyKey, forHTTPHeaderField: "Idempotency-Key")
        request.httpBody = try JSONEncoder().encode(feedback)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NitroPingError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            let root = (try? JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
            let error = root["error"] as? [String: Any]
            let message = error?["message"] as? String ?? "NitroPing request failed"
            throw NitroPingError.server(statusCode: http.statusCode, message: message)
        }
        return try JSONDecoder().decode(NitroPingFeedbackResponse.self, from: data)
    }

    private func persist() {
        UserDefaults.standard.set(try? JSONEncoder().encode(pending), forKey: pendingStorageKey)
    }
}
