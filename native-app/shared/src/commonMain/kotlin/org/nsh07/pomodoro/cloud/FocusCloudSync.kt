/*
 * Focus Plan cloud sync for the native app.
 *
 * Derived from Tomato (GPL-3.0) — see native-app/LICENSE and
 * THIRD-PARTY-LICENSES.md.
 *
 * Pushes pomodoro topics and completed focus sessions to the same
 * Firestore collections the web app uses (users/{uid}/tasks and
 * users/{uid}/sessionLogs), so data lines up with firestore.rules.
 *
 * Auth: anonymous Firebase sign-in for now. Google sign-in needs a
 * registered Android OAuth client and is tracked separately.
 */

package org.nsh07.pomodoro.cloud

import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.FirebaseOptions
import dev.gitlive.firebase.apps
import dev.gitlive.firebase.auth.auth
import dev.gitlive.firebase.firestore.firestore
import dev.gitlive.firebase.initialize
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.nsh07.pomodoro.data.Topic
import java.time.LocalDate
import java.time.format.DateTimeFormatter

object FocusCloudSync {

    enum class Status { OFFLINE, CONNECTING, SYNCED, ERROR }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val _status = MutableStateFlow(Status.OFFLINE)
    val status: StateFlow<Status> = _status.asStateFlow()

    @Volatile
    private var ready = false

    private var appContext: Any? = null

    // Public web config for project focus-plan-m3e — same values the web
    // app ships; they identify the project and are not secrets.
    private val options = FirebaseOptions(
        applicationId = "1:509405731415:android:focusplan000000000000",
        apiKey = "AIzaSyBHk3Rj9BwGuSZRNvyE08DKf_7FU0XrGLg",
        projectId = "focus-plan-m3e",
        gcmSenderId = "509405731415",
        storageBucket = "focus-plan-m3e.firebasestorage.app",
        authDomain = "focus-plan-m3e.firebaseapp.com",
    )

    /**
     * Call once from the platform entry point (Android Application).
     * Initializes Firebase and signs in anonymously. Safe to call on
     * platforms without Firebase support — status stays OFFLINE.
     */
    fun initialize(context: Any?) {
        appContext = context
        scope.launch { connect() }
    }

    private suspend fun connect() {
        _status.value = Status.CONNECTING
        val ok = runCatching {
            if (Firebase.apps(appContext).isEmpty()) {
                Firebase.initialize(appContext, options)
            }
            val auth = Firebase.auth
            if (auth.currentUser == null) {
                auth.signInAnonymously()
            }
        }.isSuccess
        ready = ok
        _status.value = if (ok) Status.SYNCED else Status.OFFLINE
    }

    private fun uid(): String? =
        if (ready) runCatching { Firebase.auth.currentUser?.uid }.getOrNull() else null

    private fun userRef(uid: String) =
        Firebase.firestore.collection("users").document(uid)

    /** Fire-and-forget topic upsert. Maps a Tomato topic onto the web
     *  app's task document shape required by firestore.rules. */
    fun syncTopic(topic: Topic) {
        val uid = uid() ?: return
        val now = System.currentTimeMillis()
        scope.launch {
            runCatching {
                userRef(uid).collection("tasks").document("topic-${topic.id}").set(
                    mapOf(
                        "title" to topic.name.take(200),
                        "category" to "focus",
                        "estimatedSessions" to 0,
                        "completedSessions" to 0,
                        "minGoal" to 0,
                        "maxGoal" to 0,
                        "cadence" to "daily",
                        "notes" to "",
                        "isCompleted" to false,
                        "createdAt" to now,
                        "updatedAt" to now,
                    )
                )
            }
        }
    }

    /** Fire-and-forget tombstone for a deleted topic (hard deletes are
     *  denied by firestore.rules). */
    fun deleteTopic(topicId: Long) {
        val uid = uid() ?: return
        val now = System.currentTimeMillis()
        scope.launch {
            runCatching {
                userRef(uid).collection("tasks").document("topic-$topicId").set(
                    mapOf(
                        "_deleted" to true,
                        "updatedAt" to now,
                    )
                )
            }
        }
    }

    /** Records one completed focus interval as a sessionLogs entry.
     *  durationMinutes is the topic's focus length in minutes. */
    fun recordFocusSession(topic: Topic) {
        val uid = uid() ?: return
        val minutes = (topic.focusTime / 60_000L).coerceIn(1L, 600L)
        val now = System.currentTimeMillis()
        val dateStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
        val docId = "focus-${topic.id}-$now"
        scope.launch {
            runCatching {
                userRef(uid).collection("sessionLogs").document(docId).set(
                    mapOf(
                        "id" to docId.take(64),
                        "timestamp" to now,
                        "dateStr" to dateStr,
                        "durationMinutes" to minutes,
                        "taskId" to "topic-${topic.id}".take(64),
                        "taskTitle" to topic.name.take(200),
                        "category" to "focus",
                    )
                )
            }
        }
    }
}
