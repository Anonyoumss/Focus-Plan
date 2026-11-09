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
