package com.focusplan.native.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(state: AppState) {
    val user by state.auth.user.collectAsState()
    val sync by state.auth.syncStatus.collectAsState()
    val locale by state.store.locale.collectAsState(initial = "")
    val scope = rememberCoroutineScope()

    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Text(L10n.tr("settings"), style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(24.dp))

        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text(
                    user?.displayName ?: user?.email ?: L10n.tr("guest"),
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    when (sync) {
                        "synced" -> L10n.tr("syncSynced")
                        "error" -> "Sync error"
                        else -> L10n.tr("syncLocal")
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(12.dp))
                if (user == null) {
                    Button(onClick = {
                        scope.launch {
                            state.auth.signInWithGoogle().onSuccess {
                                user?.let { u ->
                                    scope.launch {
                                        state.auth.pushUserData(
                                            u.uid,
                                            state.store.tasks.first(),
                                            state.store.sessions.first(),
                                        )
                                    }
                                }
                            }
                        }
                    }) { Text(L10n.tr("signIn")) }
                } else {
                    OutlinedButton(onClick = { state.auth.signOut() }) { Text(L10n.tr("signOut")) }
                }
            }
        }

        Spacer(Modifier.height(24.dp))
        Text(L10n.tr("language"), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            FilterChip(
                selected = locale != "ar",
                onClick = { scope.launch { state.store.setLocale("en") } },
                label = { Text("English") },
            )
            FilterChip(
                selected = locale == "ar",
                onClick = { scope.launch { state.store.setLocale("ar") } },
                label = { Text("العربية") },
            )
        }
    }
}
