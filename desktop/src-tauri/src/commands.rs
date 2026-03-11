use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

pub struct VpnState {
    connected: Mutex<bool>,
    config_path: Mutex<Option<String>>,
}

impl Default for VpnState {
    fn default() -> Self {
        Self {
            connected: Mutex::new(false),
            config_path: Mutex::new(None),
        }
    }
}

#[derive(Serialize)]
pub struct VpnStatusResponse {
    connected: bool,
}

#[tauri::command]
pub async fn vpn_connect(config: String) -> Result<(), String> {
    // Write config to a temp file
    let config_path = std::env::temp_dir().join("kokoro-vpn.conf");
    std::fs::write(&config_path, &config).map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        // On Windows, use wireguard.exe to install the tunnel
        let status = tokio::process::Command::new("wireguard.exe")
            .args(["/installtunnelservice", &config_path.to_string_lossy()])
            .status()
            .await
            .map_err(|e| format!("Failed to start WireGuard: {e}"))?;

        if !status.success() {
            return Err("WireGuard tunnel installation failed".into());
        }
    }

    #[cfg(target_os = "macos")]
    {
        // On macOS, use wg-quick
        let status = tokio::process::Command::new("wg-quick")
            .args(["up", &config_path.to_string_lossy()])
            .status()
            .await
            .map_err(|e| format!("Failed to start WireGuard: {e}"))?;

        if !status.success() {
            return Err("wg-quick up failed".into());
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn vpn_disconnect() -> Result<(), String> {
    let config_path = std::env::temp_dir().join("kokoro-vpn.conf");

    #[cfg(target_os = "windows")]
    {
        let _ = tokio::process::Command::new("wireguard.exe")
            .args(["/uninstalltunnelservice", "kokoro-vpn"])
            .status()
            .await;
    }

    #[cfg(target_os = "macos")]
    {
        let _ = tokio::process::Command::new("wg-quick")
            .args(["down", &config_path.to_string_lossy()])
            .status()
            .await;
    }

    // Clean up temp config
    let _ = std::fs::remove_file(&config_path);

    Ok(())
}

#[tauri::command]
pub async fn vpn_status(_state: State<'_, VpnState>) -> Result<VpnStatusResponse, String> {
    // Check if WireGuard interface is active
    #[cfg(target_os = "windows")]
    {
        let output = tokio::process::Command::new("wireguard.exe")
            .args(["/dumplog", "kokoro-vpn"])
            .output()
            .await;

        let connected = output.map(|o| o.status.success()).unwrap_or(false);
        return Ok(VpnStatusResponse { connected });
    }

    #[cfg(target_os = "macos")]
    {
        let output = tokio::process::Command::new("wg")
            .args(["show", "kokoro-vpn"])
            .output()
            .await;

        let connected = output.map(|o| o.status.success()).unwrap_or(false);
        return Ok(VpnStatusResponse { connected });
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    Ok(VpnStatusResponse { connected: false })
}
