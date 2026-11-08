package com.focusplan.native.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun TasksScreen(state: AppState) {
    val tasks by state.store.tasks.collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var showAdd by remember { mutableStateOf(false) }
    var newTitle by remember { mutableStateOf("") }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showAdd = true }) {
                Icon(Icons.Filled.Add, contentDescription = L10n.tr("addTask"))
            }
        },
    ) { padding ->
        if (tasks.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text(L10n.tr("emptyTasks"), color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp)) {
                items(tasks.sortedBy { it.order }) { task ->
                    TaskRow(
                        task = task,
                        onToggle = { scope.launch { state.toggleTaskDone(task) } },
                        onDelete = { scope.launch { state.deleteTask(task.id) } },
                    )
                }
            }
        }
    }

    if (showAdd) {
        AlertDialog(
            onDismissRequest = { showAdd = false },
            title = { Text(L10n.tr("addTask")) },
            text = {
                OutlinedTextField(
                    value = newTitle,
                    onValueChange = { newTitle = it },
                    label = { Text(L10n.tr("taskTitle")) },
                    singleLine = true,
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    if (newTitle.isNotBlank()) {
                        scope.launch { state.addTask(newTitle.trim()) }
                        newTitle = ""
                    }
                    showAdd = false
                }) { Text(L10n.tr("save")) }
            },
            dismissButton = { TextButton(onClick = { showAdd = false }) { Text(L10n.tr("cancel")) } },
        )
    }
}

@Composable
fun TaskRow(task: com.focusplan.native.data.TaskItem, onToggle: () -> Unit, onDelete: () -> Unit) {
    val done = task.completedSessions >= task.maxSessions
    Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(
            Modifier.padding(start = 4.dp, end = 8.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            FilledIconButton(onClick = onToggle, modifier = Modifier.size(40.dp)) {
                if (done) Icon(Icons.Filled.Check, contentDescription = null)
            }
            Spacer(Modifier.width(8.dp))
            Column(Modifier.weight(1f)) {
                Text(task.title, fontWeight = FontWeight.Medium)
                Text(
                    "${task.completedSessions}/${task.maxSessions} ${L10n.tr("sessions")}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            TextButton(onClick = onDelete) { Text(L10n.tr("delete")) }
        }
    }
}
