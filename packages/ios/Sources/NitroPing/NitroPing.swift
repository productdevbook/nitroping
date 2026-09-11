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

public struct NitroPingCategory: Codable, Sendable {
    public let id: String
    public let name: String
    public let slug: String
}

public struct NitroPingPublicTheme: Codable, Sendable {
    public let mode: String?
    public let buttonLabel: String?
    public let fields: [String]?
    public let colors: [String: String]?
}

public struct NitroPingPublicConfig: Codable, Sendable {
    public let theme: NitroPingPublicTheme
    public let categories: [NitroPingCategory]
}

public struct NitroPingFeedback: Codable, Sendable {
    public let type: NitroPingFeedbackType
    public let title: String
    public let body: String
    public let priority: String?
    public let categoryId: String?
    public let email: String?
    public let platform: NitroPingPlatform
    public let appVersion: String?
    public let osVersion: String?
    public let locale: String?
    public let metadata: [String: String]?

    public init(type: NitroPingFeedbackType, title: String, body: String, priority: String? = nil, categoryId: String? = nil, email: String? = nil, appVersion: String? = nil, metadata: [String: String]? = nil) {
        self.type = type; self.title = title; self.body = body; self.priority = priority; self.categoryId = categoryId; self.email = email
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

public struct NitroPingAttachment: Sendable {
    public let data: Data
    public let contentType: String

    public init(data: Data, contentType: String) {
        self.data = data; self.contentType = contentType
    }
}

public struct NitroPingFollowUpFeedback: Codable, Sendable {
    public let id: String
    public let type: String
    public let status: String
    public let priority: String
    public let title: String
    public let body: String
    public let createdAt: String
    public let updatedAt: String
}

public struct NitroPingFollowUpComment: Codable, Sendable {
    public let id: String
    public let body: String
    public let createdAt: String
}

public struct NitroPingFollowUp: Codable, Sendable {
    public let feedback: NitroPingFollowUpFeedback
    public let comments: [NitroPingFollowUpComment]
}

public enum NitroPingError: Error, Sendable {
    case invalidResponse
    case server(statusCode: Int, message: String)
    case queued
}

private struct NitroPingPendingSubmission: Codable, Sendable {
    let feedback: NitroPingFeedback
    let idempotencyKey: String
    let attachments: [NitroPingPendingAttachment]

    private enum CodingKeys: String, CodingKey { case feedback, idempotencyKey, attachments }
    init(feedback: NitroPingFeedback, idempotencyKey: String, attachments: [NitroPingPendingAttachment] = []) {
        self.feedback = feedback; self.idempotencyKey = idempotencyKey; self.attachments = attachments
    }
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        feedback = try container.decode(NitroPingFeedback.self, forKey: .feedback)
        idempotencyKey = try container.decode(String.self, forKey: .idempotencyKey)
        attachments = try container.decodeIfPresent([NitroPingPendingAttachment].self, forKey: .attachments) ?? []
    }
}

private struct NitroPingPendingAttachment: Codable, Sendable {
    let data: Data
    let contentType: String
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
        try await submit(feedback, attachments: [])
    }

    public func submit(_ feedback: NitroPingFeedback, attachments: [NitroPingAttachment]) async throws -> NitroPingFeedbackResponse {
        let idempotencyKey = UUID().uuidString
        do {
            let response = try await send(feedback, idempotencyKey: idempotencyKey)
            for attachment in attachments { _ = try await uploadAttachment(feedbackId: response.id, attachment: attachment) }
            return response
        } catch let error as NitroPingError {
            if case .server(let statusCode, _) = error, statusCode < 500 { throw error }
            pending.append(NitroPingPendingSubmission(feedback: feedback, idempotencyKey: idempotencyKey, attachments: attachments.map { NitroPingPendingAttachment(data: $0.data, contentType: $0.contentType) })); persist()
            throw NitroPingError.queued
        } catch {
            pending.append(NitroPingPendingSubmission(feedback: feedback, idempotencyKey: idempotencyKey, attachments: attachments.map { NitroPingPendingAttachment(data: $0.data, contentType: $0.contentType) })); persist()
            throw NitroPingError.queued
        }
    }

    public func flushPending() async {
        var remaining: [NitroPingPendingSubmission] = []
        for item in pending {
            do {
                let response = try await send(item.feedback, idempotencyKey: item.idempotencyKey)
                for attachment in item.attachments { _ = try await uploadAttachment(feedbackId: response.id, attachment: NitroPingAttachment(data: attachment.data, contentType: attachment.contentType)) }
            }
            catch { remaining.append(item) }
        }
        pending = remaining
        persist()
    }

    public var pendingCount: Int { pending.count }

    public func fetchPublicConfig() async throws -> NitroPingPublicConfig {
        var request = URLRequest(url: configuration.apiBaseURL.appendingPathComponent("projects/\(configuration.projectKey)/public/config"))
        request.setValue(configuration.projectKey, forHTTPHeaderField: "X-NitroPing-Project-Key")
        return try JSONDecoder().decode(NitroPingPublicConfig.self, from: try await perform(request))
    }

    @discardableResult
    public func uploadAttachment(feedbackId: String, attachment: NitroPingAttachment) async throws -> String {
        guard attachment.data.count > 0, attachment.data.count <= 10 * 1024 * 1024 else { throw NitroPingError.server(statusCode: 413, message: "Attachments cannot exceed 10 MB") }
        var initiate = URLRequest(url: configuration.apiBaseURL.appendingPathComponent("projects/\(configuration.projectKey)/uploads/initiate"))
        initiate.httpMethod = "POST"; initiate.setValue("application/json", forHTTPHeaderField: "Content-Type"); initiate.setValue(configuration.projectKey, forHTTPHeaderField: "X-NitroPing-Project-Key")
        initiate.httpBody = try JSONSerialization.data(withJSONObject: ["feedbackId": feedbackId, "contentType": attachment.contentType, "size": attachment.data.count])
        let initiated = try JSONDecoder().decode(NitroPingUploadInitiation.self, from: try await perform(initiate))
        guard let uploadURL = URL(string: initiated.uploadUrl, relativeTo: configuration.apiBaseURL)?.absoluteURL else { throw NitroPingError.invalidResponse }
        var upload = URLRequest(url: uploadURL); upload.httpMethod = "PUT"; upload.httpBody = attachment.data; upload.setValue(attachment.contentType, forHTTPHeaderField: "Content-Type"); upload.setValue(configuration.projectKey, forHTTPHeaderField: "X-NitroPing-Project-Key")
        _ = try await perform(upload)
        return initiated.attachmentId
    }

    public func requestFollowUp(feedbackId: String, email: String) async throws {
        var request = URLRequest(url: configuration.apiBaseURL.appendingPathComponent("projects/\(configuration.projectKey)/follow-up/request"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(configuration.projectKey, forHTTPHeaderField: "X-NitroPing-Project-Key")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["feedbackId": feedbackId, "email": email])
        _ = try await perform(request)
    }

    public func fetchFollowUp(token: String) async throws -> NitroPingFollowUp {
        let request = URLRequest(url: configuration.apiBaseURL.appendingPathComponent("follow-up/\(token)"))
        let data = try await perform(request)
        return try JSONDecoder().decode(NitroPingFollowUp.self, from: data)
    }

    private func perform(_ request: URLRequest) async throws -> Data {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NitroPingError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            let root = (try? JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
            let error = root["error"] as? [String: Any]
            throw NitroPingError.server(statusCode: http.statusCode, message: error?["message"] as? String ?? "NitroPing request failed")
        }
        return data
    }

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

private struct NitroPingUploadInitiation: Codable, Sendable {
    let attachmentId: String
    let uploadUrl: String
}
