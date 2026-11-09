import SwiftUI

struct FocusView: View {
    @EnvironmentObject var app: AppState

    var body: some View {
        let ar = app.ar
        VStack(spacing: 28) {
            // Mode picker
            Picker("", selection: Binding(
                get: { app.engine.mode },
                set: { app.engine.setMode($0) }
            )) {
                Text(L.tr("focus", ar)).tag(TimerMode.focus)
                Text(L.tr("shortBreak", ar)).tag(TimerMode.shortBreak)
                Text(L.tr("longBreak", ar)).tag(TimerMode.longBreak)
            }
            .pickerStyle(.segmented)
            .frame(maxWidth: 420)

            // Timer — large tabular digits
            Text(TimerEngine.format(app.engine.remainingSeconds))
                .font(.system(size: 88, weight: .light, design: .rounded))
                .monospacedDigit()
                .contentTransition(.numericText())
                .animation(.default, value: app.engine.remainingSeconds)

            // Controls
            HStack(spacing: 20) {
                Button { app.engine.reset() } label: {
                    Image(systemName: "arrow.counterclockwise")
                        .font(.title2)
                }
                .buttonStyle(.bordered)
                .keyboardShortcut("r", modifiers: [])

                Button {
                    app.engine.isRunning ? app.engine.pause() : app.engine.start()
                } label: {
                    Text(app.engine.isRunning ? L.tr("pause", ar) : L.tr("start", ar))
                        .font(.title3.weight(.semibold))
                        .frame(minWidth: 140)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.accentColor)
                .keyboardShortcut(.space, modifiers: [])
                .controlSize(.large)

                Button { app.engine.skip() } label: {
                    Image(systemName: "forward.end.fill")
                        .font(.title2)
                }
                .buttonStyle(.bordered)
                .keyboardShortcut(.rightArrow, modifiers: .command)
            }

            // Active task picker
            if !app.state.tasks.filter({ !$0.isCompleted }).isEmpty {
                Picker("", selection: Binding(
                    get: { app.state.activeTaskId },
                    set: { app.state.activeTaskId = $0; app.persist() }
                )) {
                    Text(app.ar ? "بدون مهمة" : "No task").tag(UUID?.none)
                    ForEach(app.state.tasks.filter { !$0.isCompleted }) { t in
                        Text(t.title).tag(UUID?.some(t.id))
                    }
                }
                .pickerStyle(.menu)
                .frame(maxWidth: 420)
            }

            // Stats strip
            HStack(spacing: 32) {
                Label("\(app.state.sessionsToday)", systemImage: "flame.fill")
                    .foregroundStyle(.orange)
                Text(L.tr("sessionsToday", ar))
                Divider().frame(height: 16)
                Label("\(app.state.streakDays)", systemImage: "calendar.badge.clock")
                    .foregroundStyle(.blue)
                Text(L.tr("streak", ar))
            }
            .font(.callout)
            .foregroundStyle(.secondary)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
