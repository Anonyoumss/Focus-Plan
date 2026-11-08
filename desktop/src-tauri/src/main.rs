// Focus Plan desktop shell (Tauri 2).
// Serves the same built web app (dist/) natively on Linux and macOS.
// Material 3 Expressive styling comes from the web bundle itself.
// On macOS the window uses the native "Liquid Glass" vibrancy material
// (window-vibrancy) so the app feels at home on both Intel and Apple
// Silicon Macs; the same binary source builds for x86_64 and aarch64.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};
                if let Some(window) = app.get_webview_window("main") {
                    // Liquid Glass style: full-window vibrancy with the
                    // sidebar/under-window material, matching macOS design.
                    let _ = apply_vibrancy(
                        &window,
                        NSVisualEffectMaterial::Sidebar,
                        Some(NSVisualEffectState::Active),
                        None,
                    );
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Focus Plan");
}
