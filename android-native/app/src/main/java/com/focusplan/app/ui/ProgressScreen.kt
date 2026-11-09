package com.focusplan.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.focusplan.app.data.Store
import kotlinx.coroutines.flow.first


@Composable
fun ProgressScreen(state: AppState) {
    val sessions by state.store.sessions.collectAsState(initial = emptyList())
    val tasks by state.store.tasks.collectAsState(initial = emptyList())

    val today = Store.todayKey()
    val todayMinutes = sessions.filter { it.dateKey == today && it.mode == "focus" }.sumOf { it.minutes }
    val todaySessions = sessions.count { it.dateKey == today && it.mode == "focus" }

    // Streak: consecutive days (ending today or yesterday) with >=3 focus sessions
    val byDay = sessions.filter { it.mode == "focus" }.groupingBy { it.dateKey }.eachCount()
    var streak = 0
    var daysAgo = if ((byDay[Store.todayKey()] ?: 0) < 3) 1 else 0
    while ((byDay[Store.dateKey(daysAgo)] ?: 0) >= 3) {
        streak++
        daysAgo++
        if (daysAgo > 3650) break
    }

    // Last 7 days minutes for a simple bar row
    val week = (0..6).map { offset ->
        val ago = 6 - offset
        Store.dateKey(ago) to sessions.filter { it.dateKey == Store.dateKey(ago) && it.mode == "focus" }.sumOf { it.minutes }
    }
    val maxMin = week.maxOf { it.second }.coerceAtLeast(1)

    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Text(L10n.tr("progress"), style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(24.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard("${todayMinutes}", L10n.tr("minutes"), Modifier.weight(1f))
            StatCard("$streak", L10n.tr("streak"), Modifier.weight(1f))
            StatCard("$todaySessions", L10n.tr("sessions"), Modifier.weight(1f))
        }
        Spacer(Modifier.height(24.dp))
        Text(L10n.tr("todayMinutes"), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            week.forEachIndexed { idx, (_, mins) ->
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        Modifier.fillMaxWidth().height((mins * 4).coerceIn(4, 120).dp)
                            .padding(bottom = 4.dp),
                    ) {
                        Surface(
                            modifier = Modifier.fillMaxSize(),
                            shape = MaterialTheme.shapes.small,
                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.35f + 0.65f * mins / maxMin),
                        ) {}
                    }
                    Text(
                        Store.dayNameShort(6 - idx),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
fun StatCard(value: String, label: String, modifier: Modifier = Modifier) {
    Card(modifier) {
        Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, fontSize = 28.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
