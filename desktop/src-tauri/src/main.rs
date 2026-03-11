#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    kokoro_vpn_desktop_lib::run()
}
