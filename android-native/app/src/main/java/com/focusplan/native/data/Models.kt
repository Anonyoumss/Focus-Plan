package com.focusplan.native.data

import kotlinx.serialization.Serializable

@Serializable
data class TaskItem(
    val id: String,
    val title: String,
    val category: String = "general",
    val minSessions: Int = 1,
    val maxSessions: Int = 4,
    val completedSessions: Int = 0,
    val order: Int = 0,
    val active: Boolean = false,
)

@Serializable
data class SessionLog(
    val id: String,
    val taskId: String? = null,
    val mode: String,           // "focus" | "short" | "long"
    val minutes: Int,
    val endedAt: Long,          // epoch millis
    val dateKey: String,        // yyyy-MM-dd local
)

@Serializable
data class TimerSnapshot(
    val mode: String = "focus",
    val running: Boolean = false,
    val targetEndTime: Long? = null, // epoch millis; null when paused/stopped
    val remainingSeconds: Int = 25 * 60,
    val taskId: String? = null,
)

@Serializable
data class UserProfile(
    val uid: String = "",
    val displayName: String = "",
    val email: String = "",
    val coins: Int = 0,
    val streakDays: Int = 0,
)
