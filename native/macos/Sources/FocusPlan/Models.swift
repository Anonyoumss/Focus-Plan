import Foundation

// MARK: - Domain model (framework-free logic, mirrors src/lib semantics)

enum TimerMode: String, Codable, CaseIterable {
    case focus, shortBreak, longBreak

    var defaultSeconds: Int {
        switch self {
        case .focus: return 25 * 60
        case .shortBreak: return 5 * 60
        case .longBreak: return 15 * 60
        }
    }
}

struct TaskItem: Identifiable, Codable, Equatable {
    var id: UUID = UUID()
    var title: String
    var isCompleted: Bool = false
    var createdAt: Date = Date()
    var category: String = "general"   // general | study | work | personal | custom
    var estimatedMinutes: Int = 25
}

struct SessionRecord: Identifiable, Codable, Equatable {
    var id: UUID = UUID()
    var date: Date
    var mode: TimerMode
    var durationSeconds: Int
    var taskTitle: String?
}

struct AppSettings: Codable {
    var language: String = "en"          // "en" | "ar"
    var theme: String = "system"         // "system" | "light" | "dark"
    var focusMinutes: Int = 25
    var shortBreakMinutes: Int = 5
    var longBreakMinutes: Int = 15
    var sessionsUntilLongBreak: Int = 4
    var soundEnabled: Bool = true
}

struct PersistedState: Codable {
    var settings = AppSettings()
    var tasks: [TaskItem] = []
    var sessionsToday: Int = 0
    var lastSessionDate: String = ""
    var streakDays: Int = 0
    var lastStreakDate: String = ""
    var sessions: [SessionRecord] = []
    var totalFocusSeconds: Int = 0
    var activeTaskId: UUID?
}

// MARK: - Persistence (100% local, JSON in Application Support)

enum Store {
    static let fileURL: URL = {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let appDir = dir.appendingPathComponent("FocusPlan", isDirectory: true)
        try? FileManager.default.createDirectory(at: appDir, withIntermediateDirectories: true)
        return appDir.appendingPathComponent("state.json")
    }()

    static func load() -> PersistedState {
        guard let data = try? Data(contentsOf: fileURL),
              let state = try? JSONDecoder.withISO.decode(PersistedState.self, from: data) else {
            return PersistedState()
        }
        return state
    }

    static func save(_ state: PersistedState) {
        if let data = try? JSONEncoder.withISO.encode(state) {
            try? data.write(to: fileURL, options: .atomic)
        }
    }
}

extension JSONEncoder {
    static var withISO: JSONEncoder {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        e.outputFormatting = [.prettyPrinted, .sortedKeys]
        return e
    }
}

extension JSONDecoder {
    static var withISO: JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }
}

// MARK: - Localization (minimal EN/AR, full RTL via SwiftUI)

enum L {
    static func tr(_ key: String, _ ar: Bool) -> String {
        let en: [String: String] = [
            "focus": "Focus", "shortBreak": "Short break", "longBreak": "Long break",
            "start": "Start", "pause": "Pause", "reset": "Reset", "skip": "Skip",
            "tasks": "Tasks", "addTask": "Add task", "settings": "Settings",
            "language": "Language", "theme": "Theme", "sound": "Sound",
            "sessionsToday": "Sessions today", "streak": "Day streak",
            "focusLength": "Focus length (min)", "breakLength": "Break length (min)",
            "longBreak": "Long break (min)", "untilLong": "Sessions until long break",
            "emptyTasks": "No tasks yet", "delete": "Delete",
            "sessionDone": "Session complete!",
        ]
        let arStrings: [String: String] = [
            "focus": "تركيز", "shortBreak": "استراحة قصيرة", "longBreak": "استراحة طويلة",
            "start": "ابدأ", "pause": "إيقاف", "reset": "إعادة", "skip": "تخطي",
            "tasks": "المهام", "addTask": "أضف مهمة", "settings": "الإعدادات",
            "language": "اللغة", "theme": "المظهر", "sound": "الصوت",
            "sessionsToday": "جلسات اليوم", "streak": "أيام متتالية",
            "focusLength": "مدة التركيز (دقيقة)", "breakLength": "مدة الاستراحة (دقيقة)",
            "longBreak": "الاستراحة الطويلة (دقيقة)", "untilLong": "جلسات قبل الاستراحة الطويلة",
            "emptyTasks": "لا مهام بعد", "delete": "حذف",
            "sessionDone": "اكتملت الجلسة!",
        ]
        return (ar ? arStrings : en)[key] ?? key
    }
}
