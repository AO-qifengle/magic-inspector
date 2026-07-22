mod commands;
mod detection;

use commands::run_detection;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![run_detection])
        .run(tauri::generate_context!())
        .expect("error while running Magic Inspector");
}
