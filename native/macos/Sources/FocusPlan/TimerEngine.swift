import Foundation
import Combine

/// Framework-free timer core: end-timestamp based so it survives sleep,
/// app backgrounding and even process restart (deadline persisted).
final class TimerEngine: ObservableObject {
    @Published private(set) var mode: TimerMode = .focus
    @Published private(set) var remainingSeconds: Int = TimerMode.focus.defaultSeconds
    @Published private(set) var isRunning = false
    @Published private(set) var targetEnd: Date?

    private var durations: [TimerMode: Int] = [:]
    private var ticker: Timer?
    private var sessionCount = 0
    var onSessionComplete: ((TimerMode) -> Void)?

    func configure(durations: [TimerMode: Int]) {
        self.durations = durations
        if !isRunning { remainingSeconds = duration(for: mode) }
    }

    private func duration(for m: TimerMode) -> Int { durations[m] ?? m.defaultSeconds }

    func setMode(_ m: TimerMode) {
        mode = m
        if !isRunning { remainingSeconds = duration(for: m) }
    }

    func start() {
        guard !isRunning else { return }
        isRunning = true
        targetEnd = Date().addingTimeInterval(TimeInterval(remainingSeconds))
        scheduleTick()
    }

    func pause() {
        isRunning = false
        ticker?.invalidate(); ticker = nil
        if let end = targetEnd {
            remainingSeconds = max(0, Int(end.timeIntervalSinceNow))
        }
        targetEnd = nil
    }

    func reset() {
        pause()
        remainingSeconds = duration(for: mode)
    }

    func skip() {
        pause()
        completeCurrent()
    }

    /// Call on app launch/foreground to recover after process death.
    func resumeIfNeeded() {
        guard let end = targetEnd, isRunning else { return }
        remainingSeconds = max(0, Int(end.timeIntervalSinceNow))
        if remainingSeconds == 0 { completeCurrent() } else { scheduleTick() }
    }

    private func scheduleTick() {
        ticker?.invalidate()
        ticker = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            guard let self, let end = self.targetEnd else { return }
            let left = Int(end.timeIntervalSinceNow.rounded(.up))
            if left <= 0 {
                self.completeCurrent()
            } else {
                self.remainingSeconds = left
            }
        }
    }

    private func completeCurrent() {
        isRunning = false
        ticker?.invalidate(); ticker = nil
        targetEnd = nil
        remainingSeconds = duration(for: mode)
        if mode == .focus { sessionCount += 1 }
        onSessionComplete?(mode)
        // Auto-advance: focus -> short/long break, break -> focus
        let next: TimerMode = (mode == .focus)
            ? (sessionCount % 4 == 0 ? .longBreak : .shortBreak)
            : .focus
        mode = next
        remainingSeconds = duration(for: next)
    }

    static func format(_ s: Int) -> String {
        String(format: "%02d:%02d", s / 60, s % 60)
    }
}
