import SwiftUI

struct HistoryView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        let ar = app.ar
        let sessions = app.state.sessions.sorted { $0.date > $1.date }
        let todayFocus = app.state.sessions
            .filter { Calendar.current.isDateInToday($0.date) }
            .reduce(0) { $0 + $1.durationSeconds }
        let weekFocus = app.state.sessions
            .filter { $0.date > Date().addingTimeInterval(-7 * 86400) }
            .reduce(0) { $0 + $1.durationSeconds }

        VStack(alignment: .leading, spacing: 20) {
            // Summary cards
            HStack(spacing: 16) {
                statCard("Today", formatDuration(todayFocus), "clock.fill", .orange)
                statCard("7 days", formatDuration(weekFocus), "calendar", .blue)
                statCard("Total", formatDuration(app.state.totalFocusSeconds), "sum", .green)
                statCard("Streak", "\(app.state.streakDays)", "flame.fill", .red)
            }

            Text(ar ? "السجل" : "Recent sessions").font(.headline)

            if sessions.isEmpty {
                Spacer()
                Text(ar ? "لا جلسات بعد" : "No sessions yet")
                    .foregroundStyle(.secondary)
                Spacer()
            } else {
                List(sessions.prefix(200)) { s in
                    HStack {
                        Image(systemName: s.mode == .focus ? "brain.head.profile" : "cup.and.saucer")
                            .foregroundStyle(s.mode == .focus ? Color.blue : Color.green)
                        VStack(alignment: .leading) {
                            Text(s.taskTitle ?? modeName(s.mode, ar))
                                .font(.body.weight(.medium))
                            Text(s.date.formatted(date: .abbreviated, time: .shortened))
                                .font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(formatDuration(s.durationSeconds))
                            .font(.callout.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 2)
                }
                .listStyle(.inset)
            }
        }
        .padding(24)
        .navigationTitle(ar ? "الإحصائيات" : "Stats")
    }

    private func statCard(_ title: String, _ value: String, _ icon: String, _ color: Color) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon).font(.title3).foregroundStyle(color)
            Text(value).font(.title3.bold().monospacedDigit())
            Text(title).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(.quaternary.opacity(0.4), in: RoundedRectangle(cornerRadius: 16))
    }

    private func modeName(_ m: TimerMode, _ ar: Bool) -> String {
        switch m {
        case .focus: return ar ? "تركيز" : "Focus"
        case .shortBreak: return ar ? "استراحة" : "Break"
        case .longBreak: return ar ? "استراحة طويلة" : "Long break"
        }
    }

    private func formatDuration(_ s: Int) -> String {
        if s < 3600 { return String(format: "%d:%02d", s / 60, s % 60) }
        return String(format: "%dh %02dm", s / 3600, (s % 3600) / 60)
    }
}
