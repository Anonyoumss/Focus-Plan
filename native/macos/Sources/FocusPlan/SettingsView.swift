import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        let ar = app.ar
        Form {
            Section(L.tr("language", ar)) {
                Picker(L.tr("language", ar), selection: Binding(
                    get: { app.state.settings.language },
                    set: { lang in app.updateSettings { $0.language = lang } }
                )) {
                    Text("English").tag("en")
                    Text("العربية").tag("ar")
                }
                .pickerStyle(.segmented)
            }
            Section(L.tr("theme", ar)) {
                Picker(L.tr("theme", ar), selection: Binding(
                    get: { app.state.settings.theme },
                    set: { t in app.updateSettings { $0.theme = t } }
                )) {
                    Text("System").tag("system")
                    Text("Light").tag("light")
                    Text("Dark").tag("dark")
                }
                .pickerStyle(.segmented)
            }
            Section(ar ? "الحساب" : "Account") {
                if app.firebase.isConfigured {
                    if let u = app.firebase.user {
                        LabeledContent(ar ? "مسجّل الدخول" : "Signed in", value: u.email ?? u.displayName ?? "")
                        Button(ar ? "تسجيل الخروج" : "Sign out") { app.firebase.signOut() }
                    } else {
                        Button(ar ? "تسجيل الدخول عبر Google" : "Sign in with Google") {
                            Task { await app.firebase.signInWithGoogle() }
                        }
                    }
                    if app.firebase.isSyncing {
                        ProgressView(ar ? "جارٍ المزامنة…" : "Syncing…")
                    } else if let t = app.firebase.lastSync {
                        Text(ar ? "آخر مزامنة: \(t.formatted(date: .omitted, time: .shortened))" : "Last sync: \(t.formatted(date: .omitted, time: .shortened))")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    if let e = app.firebase.syncError {
                        Text(e).font(.caption).foregroundStyle(.red)
                    }
                } else {
                    Text(ar ? "الوضع الضيف — بدون مزامنة سحابية" : "Guest mode — no cloud sync")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
            Section(L.tr("sound", ar)) {
                Toggle(L.tr("sound", ar), isOn: Binding(
                    get: { app.state.settings.soundEnabled },
                    set: { v in app.updateSettings { $0.soundEnabled = v } }
                ))
            }
            Section(ar ? "المدد" : "Durations") {
                Stepper("\(L.tr("focusLength", ar)): \(app.state.settings.focusMinutes)",
                        value: Binding(get: { app.state.settings.focusMinutes },
                                       set: { v in app.updateSettings { $0.focusMinutes = v } }),
                        in: 1...120)
                Stepper("\(L.tr("breakLength", ar)): \(app.state.settings.shortBreakMinutes)",
                        value: Binding(get: { app.state.settings.shortBreakMinutes },
                                       set: { v in app.updateSettings { $0.shortBreakMinutes = v } }),
                        in: 1...60)
                Stepper("\(L.tr("longBreak", ar)): \(app.state.settings.longBreakMinutes)",
                        value: Binding(get: { app.state.settings.longBreakMinutes },
                                       set: { v in app.updateSettings { $0.longBreakMinutes = v } }),
                        in: 1...120)
            }
        }
        .formStyle(.grouped)
        .frame(width: 420)
        .navigationTitle(L.tr("settings", ar))
    }
}
