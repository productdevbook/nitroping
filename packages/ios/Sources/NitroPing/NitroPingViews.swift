#if canImport(SwiftUI)
import SwiftUI

@available(iOS 15.0, macOS 12.0, *)
public struct NitroPingFeedbackView: View {
    private let client: NitroPingClient
    @State private var title = ""
    @State private var message = ""
    @State private var email = ""
    @State private var status = ""
    @State private var sending = false

    public init(client: NitroPingClient) { self.client = client }

    public var body: some View {
        Form {
            Section("Share feedback") {
                TextField("Title", text: $title)
                TextEditor(text: $message).frame(minHeight: 110)
                TextField("Email (optional)", text: $email)
#if os(iOS)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
#endif
                Button(sending ? "Sending…" : "Submit feedback") { submit() }.disabled(sending || title.trimmingCharacters(in: .whitespacesAndNewlines).count < 3 || message.trimmingCharacters(in: .whitespacesAndNewlines).count < 3)
            }
            if !status.isEmpty { Section { Text(status).foregroundColor(.secondary) } }
        }
        .navigationTitle("Feedback")
    }

    private func submit() {
        sending = true
        Task {
            do {
                _ = try await client.submit(NitroPingFeedback(type: .suggestion, title: title, body: message, email: email.isEmpty ? nil : email))
                await MainActor.run { status = "Thanks — your feedback was sent."; title = ""; message = ""; email = ""; sending = false }
            } catch NitroPingError.queued {
                await MainActor.run { status = "Saved locally and will retry when you are online."; sending = false }
            } catch {
                await MainActor.run { status = "Unable to send feedback."; sending = false }
            }
        }
    }
}
#endif

#if canImport(UIKit)
import UIKit

public final class NitroPingViewController: UIViewController {
    private let client: NitroPingClient
    private let titleField = UITextField()
    private let bodyField = UITextView()
    private let emailField = UITextField()
    private let submitButton = UIButton(type: .system)
    private let statusLabel = UILabel()

    public init(client: NitroPingClient) { self.client = client; super.init(nibName: nil, bundle: nil) }
    @available(*, unavailable) required init?(coder: NSCoder) { fatalError("init(coder:) is unavailable") }

    public override func viewDidLoad() {
        super.viewDidLoad(); view.backgroundColor = .systemBackground; title = "Feedback"
        titleField.placeholder = "Title"; titleField.borderStyle = .roundedRect
        bodyField.layer.borderWidth = 1; bodyField.layer.borderColor = UIColor.separator.cgColor; bodyField.layer.cornerRadius = 8; bodyField.font = .preferredFont(forTextStyle: .body)
        emailField.placeholder = "Email (optional)"; emailField.borderStyle = .roundedRect; emailField.keyboardType = .emailAddress
        submitButton.setTitle("Submit feedback", for: .normal); submitButton.addTarget(self, action: #selector(submit), for: .touchUpInside)
        statusLabel.numberOfLines = 0; statusLabel.textColor = .secondaryLabel
        let stack = UIStackView(arrangedSubviews: [titleField, bodyField, emailField, submitButton, statusLabel]); stack.axis = .vertical; stack.spacing = 12; stack.translatesAutoresizingMaskIntoConstraints = false; view.addSubview(stack)
        NSLayoutConstraint.activate([stack.leadingAnchor.constraint(equalTo: view.layoutMarginsGuide.leadingAnchor), stack.trailingAnchor.constraint(equalTo: view.layoutMarginsGuide.trailingAnchor), stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 18), bodyField.heightAnchor.constraint(greaterThanOrEqualToConstant: 120)])
    }

    @objc private func submit() {
        let feedback = NitroPingFeedback(type: .suggestion, title: titleField.text ?? "", body: bodyField.text ?? "", email: emailField.text?.isEmpty == false ? emailField.text : nil)
        submitButton.isEnabled = false
        Task {
            do { _ = try await client.submit(feedback); await MainActor.run { self.statusLabel.text = "Thanks — your feedback was sent."; self.submitButton.isEnabled = true } }
            catch NitroPingError.queued { await MainActor.run { self.statusLabel.text = "Saved locally and will retry when online."; self.submitButton.isEnabled = true } }
            catch { await MainActor.run { self.statusLabel.text = "Unable to send feedback."; self.submitButton.isEnabled = true } }
        }
    }
}
#endif
