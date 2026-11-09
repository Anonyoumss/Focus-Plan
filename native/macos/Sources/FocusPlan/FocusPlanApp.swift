import SwiftUI

@main
struct FocusPlanApp: App {
    @StateObject private var app = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(app)
                .environment(\.locale, Locale(identifier: app.ar ? "ar" : "en"))
                .environment(\.layoutDirection, app.ar ? .rightToLeft : .leftToRight)
                .preferredColorScheme(
                    app.state.settings.theme == "dark" ? .dark :
                    app.state.settings.theme == "light" ? .light : nil
                )
        }
        .windowStyle(.hiddenTitleBar)
        .defaultSize(width: 560, height: 720)
    }
}

struct RootView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        TabView(selection: $app.selectedTab) {
            FocusView().tabItem {
                Label(L.tr("focus", app.ar), systemImage: "timer")
            }.tag(0)
            TasksView().tabItem {
                Label(L.tr("tasks", app.ar), systemImage: "checklist")
            }.tag(1)
            HistoryView().tabItem {
                Label(app.ar ? "الإحصائيات" : "Stats", systemImage: "chart.bar")
            }.tag(3)
            SettingsView().tabItem {
                Label(L.tr("settings", app.ar), systemImage: "gearshape")
            }.tag(4)
        }
        // Liquid Glass: native window material behind the translucent sidebar
        .background(.ultraThinMaterial)
    }
}
