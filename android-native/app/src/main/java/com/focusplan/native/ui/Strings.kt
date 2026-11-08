package com.focusplan.native.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalContext
import com.focusplan.native.data.Store
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

object L10n {
    private val en = mapOf(
        "app" to "Focus Plan",
        "focus" to "Focus", "tasks" to "Tasks", "progress" to "Progress", "settings" to "Settings",
        "start" to "Start", "pause" to "Pause", "reset" to "Reset",
        "focusMode" to "Focus", "shortBreak" to "Short break", "longBreak" to "Long break",
        "addTask" to "Add task", "taskTitle" to "Task title", "save" to "Save", "cancel" to "Cancel",
        "delete" to "Delete", "edit" to "Edit",
        "todayMinutes" to "Today", "streak" to "Streak", "sessions" to "Sessions",
        "signIn" to "Sign in with Google", "signOut" to "Sign out",
        "language" to "Language", "guest" to "Guest (local only)",
        "syncLocal" to "Local only", "syncSynced" to "Synced",
        "emptyTasks" to "No tasks yet. Add one to get started.",
        "minutes" to "min", "noTask" to "No task",
    )
    private val ar = mapOf(
        "app" to "خطة التركيز",
        "focus" to "تركيز", "tasks" to "المهام", "progress" to "التقدم", "settings" to "الإعدادات",
        "start" to "ابدأ", "pause" to "إيقاف", "reset" to "إعادة",
        "focusMode" to "تركيز", "shortBreak" to "استراحة قصيرة", "longBreak" to "استراحة طويلة",
        "addTask" to "إضافة مهمة", "taskTitle" to "عنوان المهمة", "save" to "حفظ", "cancel" to "إلغاء",
        "delete" to "حذف", "edit" to "تعديل",
        "todayMinutes" to "اليوم", "streak" to "السلسلة", "sessions" to "الجلسات",
        "signIn" to "تسجيل الدخول عبر Google", "signOut" to "تسجيل الخروج",
        "language" to "اللغة", "guest" to "ضيف (محلي فقط)",
        "syncLocal" to "محلي فقط", "syncSynced" to "تمت المزامنة",
        "emptyTasks" to "لا توجد مهام بعد. أضف مهمة للبدء.",
        "minutes" to "دقيقة", "noTask" to "بدون مهمة",
    )

    fun t(key: String, arabic: Boolean): String =
        (if (arabic) ar else en)[key] ?: en[key] ?: key

    @Composable
    fun tr(key: String): String {
        val ctx = LocalContext.current
        val store = rememberStore(ctx)
        val locale by store.locale.collectAsState(initial = "")
        val sys = ctx.resources.configuration.locales[0].language == "ar"
        val arabic = if (locale.isEmpty()) sys else locale == "ar"
        return t(key, arabic)
    }

    @Composable
    private fun rememberStore(ctx: android.content.Context): Store {
        return androidx.compose.runtime.remember { Store(ctx.applicationContext) }
    }
}
