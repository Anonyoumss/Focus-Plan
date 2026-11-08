package com.focusplan.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.focusplan.app.data.TaskItem
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FocusScreen(state: AppState) {
    val snap by state.engine.snapshot.collectAsState()
    val tasks by state.store.tasks.collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var showTaskPicker by remember { mutableStateOf(false) }
    var durations by remember { mutableStateOf(mapOf("focus" to 25, "short" to 5, "long" to 15)) }

    Column(
        Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // Mode selector
        SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
            listOf("focus" to L10n.tr("focusMode"), "short" to L10n.tr("shortBreak"), "long" to L10n.tr("longBreak"))
                .forEachIndexed { i, (mode, label) ->
                    SegmentedButton(
                        selected = snap.mode == mode,
                        onClick = { state.engine.setMode(mode) },
                        shape = SegmentedButtonDefaults.itemShape(i, 3),
                    ) { Text(label) }
                }
        }

        Spacer(Modifier.height(32.dp))

        val rem = snap.remainingSeconds
        val mm = rem / 60
        val ss = rem % 60
        Text(
            String.format(Locale.US, "%02d:%02d", mm, ss),
            fontSize = 72.sp,
            fontWeight = FontWeight.Light,
            color = MaterialTheme.colorScheme.primary,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            tasks.firstOrNull { it.id == snap.taskId }?.title ?: L10n.tr("noTask"),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(Modifier.height(32.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            FilledTonalButton(
                onClick = { if (snap.running) state.engine.pause() else state.engine.start() },
                modifier = Modifier.height(56.dp).width(140.dp),
                shape = RoundedCornerShape(28.dp),
            ) {
                Text(if (snap.running) L10n.tr("pause") else L10n.tr("start"))
            }
            OutlinedButton(
                onClick = { state.engine.reset() },
                modifier = Modifier.height(56.dp),
                shape = RoundedCornerShape(28.dp),
            ) { Text(L10n.tr("reset")) }
        }

        Spacer(Modifier.height(24.dp))

        AssistChip(
            onClick = { showTaskPicker = true },
            label = { Text(tasks.firstOrNull { it.id == snap.taskId }?.title ?: L10n.tr("tasks")) },
        )
    }

    if (showTaskPicker) {
        AlertDialog(
            onDismissRequest = { showTaskPicker = false },
            title = { Text(L10n.tr("tasks")) },
            text = {
                Column {
                    tasks.forEach { t ->
                        TextButton(onClick = {
                            state.engine.selectTask(t.id)
                            showTaskPicker = false
                        }) { Text(t.title) }
                    }
                    TextButton(onClick = {
                        state.engine.selectTask(null)
                        showTaskPicker = false
                    }) { Text(L10n.tr("noTask")) }
                }
            },
            confirmButton = {},
            dismissButton = { TextButton(onClick = { showTaskPicker = false }) { Text(L10n.tr("cancel")) } },
        )
    }
}
