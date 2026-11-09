import Foundation
import FirebaseCore
import FirebaseAuth
import FirebaseFirestore
import AuthenticationServices
import AppKit

/// Firebase backend for the native macOS app.
/// - Google sign-in uses ASWebAuthenticationSession (system browser OAuth)
///   then exchanges the Google id_token for a Firebase credential.
/// - Syncs tasks and session history to users/{uid}/... in Firestore.
/// - Fully optional: the app runs 100% offline as a guest when signed out
///   or when Firebase is not configured.
@MainActor
final class FirebaseService: NSObject, ObservableObject, ASWebAuthenticationPresentationContextProviding {
    @Published var user: User?
    @Published var isConfigured = false
    @Published var isSyncing = false
    @Published var lastSync: Date?
    @Published var syncError: String?

    private var handle: AuthStateDidChangeListenerHandle?
    private let db = Firestore.firestore()
    private let googleClientID: String? = {
        // OAuth client ID for the Google sign-in web flow. Configure via
        // `defaults write com.focusplan.app GoogleClientID -string <id>`
        // or the FOCUSPLAN_GOOGLE_CLIENT_ID environment variable.
        if let env = ProcessInfo.processInfo.environment["FOCUSPLAN_GOOGLE_CLIENT_ID"], !env.isEmpty { return env }
        return UserDefaults.standard.string(forKey: "GoogleClientID")
    }()

    func configure() {
        // FirebaseApp.configure reads GoogleService-Info.plist from the bundle.
        // For SPM builds we inject options manually from bundled plist values
        // that CI substitutes at build time.
        guard FirebaseApp.app() == nil else { return }
        guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
              let opts = FirebaseOptions(contentsOfFile: path) else {
            // No config -> guest mode, still fully functional offline.
            isConfigured = false
            return
        }
        FirebaseApp.configure(options: opts)
        isConfigured = true
        handle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            Task { @MainActor in self?.user = user }
        }
    }

    // MARK: - Google sign-in

    /// Runs the Google OAuth consent flow in the system browser and
    /// exchanges the returned id_token for a Firebase credential.
    func signInWithGoogle() async {
        guard let clientID = googleClientID else {
            syncError = "google-client-id-not-configured"
            return
        }
        guard let url = googleAuthURL(clientID: clientID) else { return }
        do {
            let callback = try await withCheckedThrowingContinuation { cont in
                let session = ASWebAuthenticationSession(
                    url: url,
                    callbackURLScheme: "com.googleusercontent.apps"
                ) { callbackURL, error in
                    if let error { cont.resume(throwing: error); return }
                    guard let callbackURL else {
                        cont.resume(throwing: URLError(.cancelled)); return
                    }
                    cont.resume(returning: callbackURL)
                }
                session.presentationContextProvider = self
                session.start()
            }
            // Parse id_token from the redirect fragment/query
            guard let idToken = extractIdToken(from: callback) else {
                syncError = "no-id-token"
                return
            }
            let credential = GoogleAuthProvider.credential(withIDToken: idToken, accessToken: nil)
            _ = try await Auth.auth().signIn(with: credential)
            syncError = nil
        } catch {
            syncError = error.localizedDescription
        }
    }

    private func googleAuthURL(clientID: String) -> URL? {
        var c = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        c.queryItems = [
            URLQueryItem(name: "client_id", value: clientID),
            URLQueryItem(name: "redirect_uri", value: "com.googleusercontent.apps:/oauth2redirect"),
            URLQueryItem(name: "response_type", value: "id_token token"),
            URLQueryItem(name: "scope", value: "openid email profile"),
            URLQueryItem(name: "nonce", value: UUID().uuidString),
        ]
        return c.url
    }

    private func extractIdToken(from url: URL) -> String? {
        // id_token arrives in the URL fragment: #id_token=...&access_token=...
        if let frag = url.fragment {
            for part in frag.split(separator: "&") {
                if part.hasPrefix("id_token=") {
                    return String(part.dropFirst("id_token=".count))
                }
            }
        }
        return URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?.first(where: { $0.name == "id_token" })?.value
    }

    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        NSApplication.shared.keyWindow ?? NSApplication.shared.windows.first ?? ASPresentationAnchor()
    }

    func signOut() {
        try? Auth.auth().signOut()
    }

    // MARK: - Firestore sync (push model, same shape as the web app)

    /// Pushes tasks and recent sessions to users/{uid}/... docs.
    /// Merge-safe: each record carries updatedAt; server timestamps kept simple.
    func sync(state: PersistedState) async {
        guard isConfigured, let uid = user?.uid else { return }
        isSyncing = true; syncError = nil
        defer { isSyncing = false }
        let userRef = db.collection("users").document(uid)
        do {
            try await userRef.setData([
                "displayName": user?.displayName ?? "",
                "email": user?.email ?? "",
                "updatedAt": FieldValue.serverTimestamp(),
            ], merge: true)

            // Tasks -> users/{uid}/tasks/{id}
            let batch = db.batch()
            for t in state.tasks {
                let ref = userRef.collection("tasks").document(t.id.uuidString)
                batch.setData([
                    "title": t.title,
                    "isCompleted": t.isCompleted,
                    "category": t.category,
                    "estimatedMinutes": t.estimatedMinutes,
                    "createdAt": t.createdAt.timeIntervalSince1970 * 1000,
                    "updatedAt": FieldValue.serverTimestamp(),
                ], forDocument: ref, merge: true)
            }
            // Recent sessions -> users/{uid}/sessions/{id} (last 500)
            for s in state.sessions.suffix(500) {
                let ref = userRef.collection("sessions").document(s.id.uuidString)
                batch.setData([
                    "date": s.date.timeIntervalSince1970 * 1000,
                    "mode": s.mode.rawValue,
                    "durationSeconds": s.durationSeconds,
                    "taskTitle": s.taskTitle ?? "",
                    "updatedAt": FieldValue.serverTimestamp(),
                ], forDocument: ref, merge: true)
            }
            try await batch.commit()
            lastSync = Date()
        } catch {
            syncError = error.localizedDescription
        }
    }
}
