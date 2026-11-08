package com.focusplan.native

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import com.focusplan.native.ui.AppRoot

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { FocusPlanTheme { AppRoot() } }
    }
}

@Composable
fun FocusPlanTheme(content: @Composable () -> Unit) {
    val dark = LocalConfiguration.current.uiMode and
        android.content.res.Configuration.UI_MODE_NIGHT_MASK ==
        android.content.res.Configuration.UI_MODE_NIGHT_YES
    val scheme = if (dark) darkColorScheme(
        primary = Color(0xFF8FD6B4),
        onPrimary = Color(0xFF0B3B2E),
        surface = Color(0xFF1B1B1F),
        surfaceVariant = Color(0xFF2B2F36),
        onSurface = Color(0xFFE6E1E5),
    ) else lightColorScheme(
        primary = Color(0xFF2D6A4F),
        onPrimary = Color(0xFFFFFFFF),
        surface = Color(0xFFF7F9F7),
        surfaceVariant = Color(0xFFE4EAE6),
        onSurface = Color(0xFF1B1B1F),
    )
    MaterialTheme(colorScheme = scheme, content = content)
}
