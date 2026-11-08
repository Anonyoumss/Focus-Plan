plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.focusplan.native"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.focusplan.native"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0-native"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures {
        compose = true
        buildConfig = true
    }

    // Public Firebase config injected from gradle properties / local.properties.
    // Empty defaults keep the app buildable and runnable as a guest.
    val fpProps = java.util.Properties().apply {
        val f = rootProject.file("local.properties")
        if (f.exists()) f.inputStream().use { load(it) }
    }
    fun fp(key: String) = (project.findProperty(key) as? String) ?: fpProps.getProperty(key) ?: ""
    defaultConfig {
        resValue("string", "firebase_api_key", fp("FP_FIREBASE_API_KEY"))
        resValue("string", "firebase_app_id", fp("FP_FIREBASE_APP_ID"))
        resValue("string", "firebase_project_id", fp("FP_FIREBASE_PROJECT_ID"))
        resValue("string", "firebase_sender_id", fp("FP_FIREBASE_SENDER_ID"))
        resValue("string", "default_web_client_id", fp("FP_WEB_CLIENT_ID"))
    }
}

dependencies {
    implementation("androidx.credentials:credentials:1.5.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.5.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.11.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    implementation("com.google.android.gms:play-services-auth:21.3.0")
}

// Firebase is initialized at runtime from resValue-injected public config
// (FP_* gradle properties), so no google-services.json is required.
