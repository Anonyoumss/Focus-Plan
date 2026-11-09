package com.focusplan.app.timer

import com.focusplan.app.data.SessionLog
import com.focusplan.app.data.Store
import com.focusplan.app.data.TaskItem
import com.focusplan.app.data.TimerSnapshot
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import kotlin.math.max

/**
 * Focus timer with end-timestamp persistence: state survives process death
 * because the snapshot stores `targetEndTime`, and remaining time is always
 * derived from the wall clock, never accumulated ticks.
 */
class TimerEngine(
    private val store: Store,
    private val scope: CoroutineScope,
    private val onSessionComplete: suspend (SessionLog) -> Unit,
) {
    private val _snapshot = MutableStateFlow(TimerSnapshot())
    val snapshot: StateFlow<TimerSnapshot> = _snapshot
    private var ticker: Job? = null

    val modeMinutes = mapOf("focus" to 25, "short" to 5, "long" to 15)

    suspend fun restore() {
        store.timer.collect { snap ->
            _snapshot.value = snap
            if (snap.running && snap.targetEndTime != null) startTicker()
        }
    }

    fun start() {
        val cur = _snapshot.value
        val end = cur.targetEndTime ?: (System.currentTimeMillis() + cur.remainingSeconds * 1000L)
        val next = cur.copy(running = true, targetEndTime = end)
        _snapshot.value = next
        scope.launch { store.saveTimer(next) }
        startTicker()
    }

    fun pause() {
        val cur = _snapshot.value
        val remaining = remainingSeconds()
        val next = cur.copy(running = false, targetEndTime = null, remainingSeconds = remaining)
        _snapshot.value = next
        scope.launch { store.saveTimer(next) }
        ticker?.cancel()
    }

    fun reset(mode: String? = null) {
        ticker?.cancel()
        val m = mode ?: _snapshot.value.mode
        val next = TimerSnapshot(mode = m, remainingSeconds = (modeMinutes[m] ?: 25) * 60)
        _snapshot.value = next
        scope.launch { store.saveTimer(next) }
    }

    fun setMode(mode: String) {
        if (_snapshot.value.running) return
        reset(mode)
    }

    fun selectTask(taskId: String?) {
        val cur = _snapshot.value
        val next = cur.copy(taskId = taskId)
        _snapshot.value = next
        scope.launch { store.saveTimer(next) }
    }

    fun remainingSeconds(): Int {
        val s = _snapshot.value
        val end = s.targetEndTime
        return if (s.running && end != null) {
            max(0, ((end - System.currentTimeMillis()) / 1000).toInt())
        } else s.remainingSeconds
    }

    private fun startTicker() {
        ticker?.cancel()
        ticker = scope.launch {
            while (true) {
                val rem = remainingSeconds()
                _snapshot.value = _snapshot.value.copy(remainingSeconds = rem)
                if (rem <= 0) {
                    complete()
                    return@launch
                }
                delay(500)
            }
        }
    }

    private suspend fun complete() {
        ticker?.cancel()
        playCompletionSound()
        val s = _snapshot.value
        val minutes = modeMinutes[s.mode] ?: 25
        val log = SessionLog(
            id = UUID.randomUUID().toString(),
            taskId = s.taskId,
            mode = s.mode,
            minutes = minutes,
            endedAt = System.currentTimeMillis(),
            dateKey = Store.todayKey(),
        )
        onSessionComplete(log)
        // Auto-advance: focus -> short break, breaks -> focus (Pomofocus style)
        val nextMode = if (s.mode == "focus") "short" else "focus"
        reset(nextMode)
    }

    private fun playCompletionSound() {
        try {
            val tg = android.media.ToneGenerator(android.media.AudioManager.STREAM_ALARM, 80)
            tg.startTone(android.media.ToneGenerator.TONE_PROP_ACK, 400)
            scope.launch {
                delay(600)
                try { tg.release() } catch (_: Throwable) {}
            }
        } catch (_: Throwable) {
            // audio may be unavailable; session completion must not crash
        }
    }
}
