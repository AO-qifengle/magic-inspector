mod commands;
mod detection;

use commands::{cancel_speed_test, run_detection, run_speed_test};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            run_detection,
            run_speed_test,
            cancel_speed_test
        ])
        .run(tauri::generate_context!())
        .expect("error while running Magic Inspector");
}
