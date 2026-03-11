use std::collections::HashMap;
use serde::Serialize;
use tokio::process::Command;

use crate::errors::AppError;

#[derive(Debug, Serialize)]
pub struct PeerStats {
    pub public_key: String,
    pub rx_bytes: i64,
    pub tx_bytes: i64,
    pub last_handshake: i64,
}

/// Parse `wg show <interface> transfer` output
pub async fn get_transfer_stats(interface: &str) -> Result<HashMap<String, (i64, i64)>, AppError> {
    let output = Command::new("wg")
        .args(["show", interface, "transfer"])
        .output()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to run wg show: {e}")))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut stats = HashMap::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() >= 3 {
            let key = parts[0].to_string();
            let rx: i64 = parts[1].parse().unwrap_or(0);
            let tx: i64 = parts[2].parse().unwrap_or(0);
            stats.insert(key, (rx, tx));
        }
    }

    Ok(stats)
}

/// Parse `wg show <interface> latest-handshakes` output
pub async fn get_handshake_times(interface: &str) -> Result<HashMap<String, i64>, AppError> {
    let output = Command::new("wg")
        .args(["show", interface, "latest-handshakes"])
        .output()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to run wg show: {e}")))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut times = HashMap::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split('\t').collect();
        if parts.len() >= 2 {
            let key = parts[0].to_string();
            let time: i64 = parts[1].parse().unwrap_or(0);
            times.insert(key, time);
        }
    }

    Ok(times)
}
