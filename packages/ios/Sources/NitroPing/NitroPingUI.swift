import Foundation

#if canImport(SwiftUI)
import SwiftUI

/// A ready-to-embed SwiftUI feedback form.
@available(iOS 15.0, macOS 12.0, *)
public struct NitroPingFeedbackForm: View {
    private let client: NitroPingClient
    private let type: NitroPingFeedbackType
    @State private var title = ""
    @State private var description = ""
    @State private var email = ""
    @State private var categoryId = ""
    @State private var publicConfig: NitroPingPublicConfig?
    @State private var status = ""
    @State private var sending = false

    public init(client: NitroPingClient, type: NitroPingFeedbackType = .suggestion) {
        self.client = client
        self.type = type
    }

    public var body: some View {
        Form {
            Section("Share feedback") {
                TextField("Title", text: $title)
                TextEditor(text: $description)
                    .frame(minHeight: 100)
                if let categories = publicConfig?.categories, !categories.isEmpty {
                    Picker("Category", selection: $categoryId) {
                        Text("No category").tag("")
                        ForEach(categories, id: \.id) { category in
                            Text(category.name).tag(category.id)
                        }
                    }
                }
                TextField("Email (optional)", text: $email)
                Button(sending ? "Sending…" : "Submit feedback") {
                    submit()
                }
                .disabled(sending || title.trimmingCharacters(in: .whitespacesAndNewlines).count < 3 || description.trimmingCharacters(in: .whitespacesAndNewlines).count < 3)
                if !status.isEmpty { Text(status).foregroundStyle(.secondary) }
            }
        }
        .task {
            publicConfig = try? await client.fetchPublicConfig()
        }
    }

    private func submit() {
        sending = true
        let feedback = NitroPingFeedback(
            type: type,
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            body: description.trimmingCharacters(in: .whitespacesAndNewlines),
            categoryId: categoryId.isEmpty ? nil : categoryId,
            email: email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : email.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        Task {
            do {
                _ = try await client.submit(feedback)
                await MainActor.run {
                    title = ""; description = ""; email = ""; status = "Thanks — your feedback was sent."; sending = false
                }
            } catch NitroPingError.queued {
                await MainActor.run { status = "Saved locally and will retry when online."; sending = false }
            } catch {
                await MainActor.run { status = "Unable to send feedback."; sending = false }
            }
        }
    }
}
#endif

#if canImport(UIKit)
import UIKit

/// A ready-to-embed UIKit feedback form.
@available(iOS 15.0, *)
public final class NitroPingFeedbackViewController: UIViewController {
    private let client: NitroPingClient
    private let type: NitroPingFeedbackType
    private let titleField = UITextField()
    private let bodyField = UITextView()
    private let emailField = UITextField()
    private let statusLabel = UILabel()
    private let submitButton = UIButton(type: .system)

    public init(client: NitroPingClient, type: NitroPingFeedbackType = .suggestion) {
        self.client = client; self.type = type
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }

    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        title = "Share feedback"
        titleField.placeholder = "Title"
        bodyField.layer.borderWidth = 1
        bodyField.layer.borderColor = UIColor.separator.cgColor
        bodyField.layer.cornerRadius = 8
        bodyField.heightAnchor.constraint(equalToConstant: 120).isActive = true
        emailField.placeholder = "Email (optional)"
        emailField.keyboardType = .emailAddress
        emailField.autocapitalizationType = .none
        submitButton.setTitle("Submit feedback", for: .normal)
        submitButton.addTarget(self, action: #selector(submit), for: .touchUpInside)
        statusLabel.textColor = .secondaryLabel
        let stack = UIStackView(arrangedSubviews: [titleField, bodyField, emailField, submitButton, statusLabel])
        stack.axis = .vertical; stack.spacing = 12; stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.layoutMarginsGuide.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: view.layoutMarginsGuide.trailingAnchor),
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
        ])
    }

    @objc private func submit() {
        let title = titleField.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let body = bodyField.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard title.count >= 3, body.count >= 3 else { statusLabel.text = "Please enter a title and description."; return }
        submitButton.isEnabled = false
        let feedback = NitroPingFeedback(type: type, title: title, body: body, email: emailField.text?.isEmpty == true ? nil : emailField.text)
        Task {
            do {
                _ = try await client.submit(feedback)
                await MainActor.run { self.statusLabel.text = "Thanks — your feedback was sent."; self.titleField.text = ""; self.bodyField.text = ""; self.emailField.text = ""; self.submitButton.isEnabled = true }
            } catch NitroPingError.queued {
                await MainActor.run { self.statusLabel.text = "Saved locally and will retry when online."; self.submitButton.isEnabled = true }
            } catch {
                await MainActor.run { self.statusLabel.text = "Unable to send feedback."; self.submitButton.isEnabled = true }
            }
        }
    }
}

/// Captures a view as a PNG attachment for feedback submissions.
public enum NitroPingScreenshot {
    @MainActor
    public static func attachment(from view: UIView, scale: CGFloat = UIScreen.main.scale) -> NitroPingAttachment? {
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = scale
        let renderer = UIGraphicsImageRenderer(size: view.bounds.size, format: format)
        let data = renderer.pngData { context in view.layer.render(in: context.cgContext) }
        return NitroPingAttachment(data: data, contentType: "image/png")
    }
}
#endif
