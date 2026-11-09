package com.focusplan.app.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.tasks.await
import java.util.UUID

/**
 * Firebase Auth (Google sign-in via Credential Manager) + Firestore sync.
 * Firebase is initialized lazily from public config values passed by the
 * caller — no google-services.json required.
 */
class AuthManager(private val context: Context) {
    private var firebaseReady = false
    private val _user = MutableStateFlow<com.google.firebase.auth.FirebaseUser?>(null)
    val user: StateFlow<com.google.firebase.auth.FirebaseUser?> = _user
    private val _syncStatus = MutableStateFlow("local")
    val syncStatus: StateFlow<String> = _syncStatus

    val firestore: FirebaseFirestore? get() = if (firebaseReady) FirebaseFirestore.getInstance() else null

    fun init(apiKey: String, appId: String, projectId: String, senderId: String) {
        if (firebaseReady) return
        if (apiKey.isBlank() || appId.isBlank() || projectId.isBlank() || senderId.isBlank()) return
        FirebaseApp.initializeApp(
            context,
            com.google.firebase.FirebaseOptions.Builder()
                .setApiKey(apiKey)
                .setApplicationId(appId)
                .setProjectId(projectId)
                .setGcmSenderId(senderId)
                .build(),
        )
        FirebaseAuth.getInstance().addAuthStateListener { _user.value = it.currentUser }
        firebaseReady = true
    }

    val isReady get() = firebaseReady

    suspend fun signInWithGoogle(): Result<Unit> = runCatching {
        check(firebaseReady) { "Firebase is not configured" }
        val serverClientId = context.getString(com.focusplan.app.R.string.default_web_client_id)
        val option = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(serverClientId)
            .setAutoSelectEnabled(false)
            .build()
        val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
        val result = CredentialManager.create(context).getCredential(context, request)
        val credential = GoogleIdTokenCredential.createFrom(result.credential.data)
        val firebaseCredential = GoogleAuthProvider.getCredential(credential.idToken, null)
        FirebaseAuth.getInstance().signInWithCredential(firebaseCredential).await()
    }

    fun signOut() {
        if (firebaseReady) FirebaseAuth.getInstance().signOut()
    }

    /** Merge local docs into Firestore under users/{uid}; called after sign-in. */
    suspend fun pushUserData(uid: String, tasks: List<com.focusplan.app.data.TaskItem>,
                             sessions: List<com.focusplan.app.data.SessionLog>) {
        val db = firestore ?: return
        runCatching {
            db.collection("users").document(uid).collection("tasks")
                .let { col ->
                    // last-write-wins per doc id; tombstones not needed for v1 native
                    tasks.forEach { t -> col.document(t.id).set(t, SetOptions.merge()).await() }
                }
            sessions.takeLast(500).forEach { s ->
                db.collection("users").document(uid).collection("sessions")
                    .document("${s.endedAt}-${s.id.take(8)}").set(s, SetOptions.merge()).await()
            }
            _syncStatus.value = "synced"
        }.onFailure { _syncStatus.value = "error" }
    }
}
