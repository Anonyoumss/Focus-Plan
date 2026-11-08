package com.focusplan.app.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import java.time.LocalDate
import java.time.format.DateTimeFormatter

private val Context.dataStore by preferencesDataStore(name = "focusplan")

class Store(private val context: Context) {
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
    private object Keys {
        val TASKS = stringPreferencesKey("tasks")
        val SESSIONS = stringPreferencesKey("sessions")
        val TIMER = stringPreferencesKey("timer")
        val PROFILE = stringPreferencesKey("profile")
        val LOCALE = stringPreferencesKey("locale")
        val LAST_DATE = stringPreferencesKey("last_active_date")
    }

    val tasks: Flow<List<TaskItem>> = context.dataStore.data.map { p ->
        p[Keys.TASKS]?.let { runCatching { json.decodeFromString(it) }.getOrNull() } ?: emptyList()
    }
    val sessions: Flow<List<SessionLog>> = context.dataStore.data.map { p ->
        p[Keys.SESSIONS]?.let { runCatching { json.decodeFromString(it) }.getOrNull() } ?: emptyList()
    }
    val timer: Flow<TimerSnapshot> = context.dataStore.data.map { p ->
        p[Keys.TIMER]?.let { runCatching { json.decodeFromString(it) }.getOrNull() }
            ?: TimerSnapshot()
    }
    val profile: Flow<UserProfile> = context.dataStore.data.map { p ->
        p[Keys.PROFILE]?.let { runCatching { json.decodeFromString(it) }.getOrNull() } ?: UserProfile()
    }
    val locale: Flow<String> = context.dataStore.data.map { it[Keys.LOCALE] ?: "" }

    suspend fun saveTasks(tasks: List<TaskItem>) = put(Keys.TASKS, json.encodeToString(tasks))
    suspend fun saveSessions(sessions: List<SessionLog>) = put(Keys.SESSIONS, json.encodeToString(sessions))
    suspend fun saveTimer(timer: TimerSnapshot) = put(Keys.TIMER, json.encodeToString(timer))
    suspend fun saveProfile(profile: UserProfile) = put(Keys.PROFILE, json.encodeToString(profile))
    suspend fun setLocale(locale: String) = context.dataStore.edit { it[Keys.LOCALE] = locale }

    private suspend fun put(key: androidx.datastore.preferences.core.Preferences.Key<String>, value: String) {
        context.dataStore.edit { it[key] = value }
    }

    companion object {
        val DATE_FMT: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        fun todayKey(): String = LocalDate.now().format(DATE_FMT)
    }
}
