import SwiftUI
import Combine

@MainActor
final class AppState: ObservableObject {
    @Published var state: PersistedState
    @Published var selectedTab = 0
    let engine = TimerEngine()

    init() {
        state = Store.load()
        engine.configure(durations: [
            .focus: state.settings.focusMinutes * 60,
            .shortBreak: state.settings.shortBreakMinutes * 60,
            .longBreak: state.settings.longBreakMinutes * 60,
        ])
        engine.onSessionComplete = { [weak self] mode in
            guard let self, mode == .focus else { return }
            self.recordSession()
        }
        // Recover timer if the app was killed mid-session
        DispatchQueue.main.async { self.engine.resumeIfNeeded() }
    }

    var ar: Bool { state.settings.language == "ar" }

    func persist() { Store.save(state) }

    private func todayKey() -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.string(from: Date())
    }

    private func recordSession() {
        let today = todayKey()
        if state.lastSessionDate != today {
            // Streak: consecutive days with >=1 session
            if let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date()) {
                let yf = DateFormatter(); yf.dateFormat = "yyyy-MM-dd"
                state.streakDays = (yf.string(from: yesterday) == state.lastSessionDate) ? state.streakDays + 1 : 1
            } else { state.streakDays = 1 }
            state.sessionsToday = 0
            state.lastSessionDate = today
        }
        state.sessionsToday += 1
        persist()
    }

    func addTask(_ title: String) {
        let t = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !t.isEmpty else { return }
        state.tasks.append(TaskItem(title: t))
        persist()
    }

    func toggleTask(_ id: UUID) {
        if let i = state.tasks.firstIndex(where: { $0.id == id }) {
            state.tasks[i].isCompleted.toggle()
            persist()
        }
    }

    func deleteTask(_ id: UUID) {
        state.tasks.removeAll { $0.id == id }
        persist()
    }

    func updateSettings(_ mutate: (inout AppSettings) -> Void) {
        mutate(&state.settings)
        engine.configure(durations: [
            .focus: state.settings.focusMinutes * 60,
            .shortBreak: state.settings.shortBreakMinutes * 60,
            .longBreak: state.settings.longBreakMinutes * 60,
        ])
        persist()
    }
}
