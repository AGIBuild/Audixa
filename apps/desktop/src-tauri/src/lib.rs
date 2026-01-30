use tauri_plugin_log::{Target, TargetKind, TimezoneStrategy, RotationStrategy};

#[tauri::command]
fn parse_subtitle_content(format: String, content: String) -> Vec<subtitle_core::SubtitleItem> {
  subtitle_core::parse_subtitle_content(&format, &content)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Configure logging: warn/error only, daily rotation, max 7 days
  let log_plugin = tauri_plugin_log::Builder::default()
    .level(log::LevelFilter::Warn)
    .timezone_strategy(TimezoneStrategy::UseLocal)
    .rotation_strategy(RotationStrategy::KeepAll)
    .max_file_size(5_000_000) // 5MB per file
    .targets([
      Target::new(TargetKind::Stdout),
      Target::new(TargetKind::LogDir { file_name: None }),
    ])
    .build();

  tauri::Builder::default()
    .plugin(log_plugin)
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_keyring::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![parse_subtitle_content])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
