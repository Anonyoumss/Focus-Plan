package com.focusplan.app.ui

import android.content.Context
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.focusplan.app.MainActivity
import com.focusplan.app.auth.AuthManager
import com.focusplan.app.data.Store
import com.focusplan.app.data.TaskItem
import com.focusplan.app.data.TimerSnapshot
import com.focusplan.app.timer.TimerEngine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.UUID

class AppState(context: Context) {
    val store = Store(context.applicationContext)
    val auth = AuthManager(context.applicationContext)
    val scope = kotlinx.coroutines.CoroutineScope(
        kotlinx.coroutines.SupervisorJob() + kotlinx.coroutines.Dispatchers.Main,
    )
    val engine = TimerEngine(store, scope) { log ->
        val sessions = store.sessions.first()
        store.saveSessions(sessions + log)
    }
    init {
        val res = context.resources
        auth.init(
            res.getString(com.focusplan.app.R.string.firebase_api_key),
            res.getString(com.focusplan.app.R.string.firebase_app_id),
            res.getString(com.focusplan.app.R.string.firebase_project_id),
            res.getString(com.focusplan.app.R.string.firebase_sender_id),
        )
        scope.launch { engine.restore() }
    }

    suspend fun addTask(title: String) {
        val tasks = store.tasks.first()
        store.saveTasks(tasks + TaskItem(id = UUID.randomUUID().toString(), title = title, order = tasks.size))
    }
    suspend fun updateTask(task: TaskItem) {
        val tasks = store.tasks.first()
        store.saveTasks(tasks.map { if (it.id == task.id) task else it })
    }
    suspend fun deleteTask(id: String) {
        val tasks = store.tasks.first()
        store.saveTasks(tasks.filter { it.id != id })
    }
    suspend fun toggleTaskDone(task: TaskItem) {
        updateTask(task.copy(completedSessions = task.completedSessions + if (task.completedSessions >= task.maxSessions) -task.maxSessions else 1))
    }
}

@Composable
fun AppRoot() {
    val context = LocalContext.current
    val state = remember { AppState(context) }
    var tab by androidx.compose.runtime.remember { androidx.compose.runtime.mutableIntStateOf(0) }
    val tabs = listOf("focus", "tasks", "progress", "settings")
    val icons = listOf(Icons.Filled.PlayArrow, Icons.Filled.List, Icons.Filled.DateRange, Icons.Filled.Settings)

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEachIndexed { i, key ->
                    NavigationBarItem(
                        selected = tab == i,
                        onClick = { tab = i },
                        icon = { Icon(icons[i], contentDescription = L10n.tr(key)) },
                        label = { Text(L10n.tr(key)) },
                    )
                }
            }
        },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (tab) {
                0 -> FocusScreen(state)
                1 -> TasksScreen(state)
                2 -> ProgressScreen(state)
                else -> SettingsScreen(state)
            }
        }
    }
}
