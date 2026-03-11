use std::sync::Arc;
use tokio::process::Command;
use tokio::sync::Mutex;

use crate::config::AppConfig;
use crate::errors::AppError;

#[derive(Clone)]
pub struct WgManager {
    config: AppConfig,
    lock: Arc<Mutex<()>>,
}

impl WgManager {
    pub fn new(config: AppConfig) -> Self {
        Self {
            config,
            lock: Arc::new(Mutex::new(())),
        }
    }

    /// Generate a WireGuard private key
    pub async fn generate_private_key(&self) -> Result<String, AppError> {
        let output = Command::new("wg")
            .arg("genkey")
            .output()
            .await
            .map_err(|e| AppError::Internal(format!("Failed to run wg genkey: {e}")))?;

        if !output.status.success() {
            return Err(AppError::Internal("wg genkey failed".into()));
        }

        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    /// Derive public key from private key
    pub async fn derive_public_key(&self, private_key: &str) -> Result<String, AppError> {
        let mut child = Command::new("wg")
            .arg("pubkey")
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to run wg pubkey: {e}")))?;

        use tokio::io::AsyncWriteExt;
        if let Some(mut stdin) = child.stdin.take() {
            stdin.write_all(private_key.as_bytes()).await
                .map_err(|e| AppError::Internal(e.to_string()))?;
        }

        let output = child.wait_with_output().await
            .map_err(|e| AppError::Internal(e.to_string()))?;

        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    /// Generate a keypair (private_key, public_key)
    pub async fn generate_keypair(&self) -> Result<(String, String), AppError> {
        let private_key = self.generate_private_key().await?;
        let public_key = self.derive_public_key(&private_key).await?;
        Ok((private_key, public_key))
    }

    /// Allocate the next available IP address in the subnet
    pub async fn allocate_ip(&self, db: &sqlx::SqlitePool) -> Result<String, AppError> {
        let used: Vec<String> = sqlx::query_scalar("SELECT address FROM devices")
            .fetch_all(db)
            .await?;

        let subnet = &self.config.wg_subnet;

        // Find next available IP (skip .1 which is the server)
        for i in 2..=254 {
            let addr = format!("{subnet}.{i}/32");
            if !used.contains(&addr) {
                return Ok(addr);
            }
        }

        Err(AppError::Internal("No available IP addresses in subnet".into()))
    }

    /// Add a peer to the WireGuard interface
    pub async fn add_peer(&self, public_key: &str, allowed_ips: &str) -> Result<(), AppError> {
        let _lock = self.lock.lock().await;

        let status = Command::new("wg")
            .args(["set", &self.config.wg_interface, "peer", public_key, "allowed-ips", allowed_ips])
            .status()
            .await
            .map_err(|e| AppError::Internal(format!("Failed to add peer: {e}")))?;

        if !status.success() {
            return Err(AppError::Internal("wg set peer failed".into()));
        }

        self.save_config().await?;
        Ok(())
    }

    /// Remove a peer from the WireGuard interface
    pub async fn remove_peer(&self, public_key: &str) -> Result<(), AppError> {
        let _lock = self.lock.lock().await;

        let status = Command::new("wg")
            .args(["set", &self.config.wg_interface, "peer", public_key, "remove"])
            .status()
            .await
            .map_err(|e| AppError::Internal(format!("Failed to remove peer: {e}")))?;

        if !status.success() {
            return Err(AppError::Internal("wg set peer remove failed".into()));
        }

        self.save_config().await?;
        Ok(())
    }

    /// Save the current WireGuard runtime config to disk
    async fn save_config(&self) -> Result<(), AppError> {
        let config_path = format!("{}/{}.conf", self.config.wg_config_dir, self.config.wg_interface);

        let status = Command::new("bash")
            .args(["-c", &format!("wg-quick save {}", self.config.wg_interface)])
            .status()
            .await
            .map_err(|e| AppError::Internal(format!("Failed to save config: {e}")))?;

        if !status.success() {
            tracing::warn!("wg-quick save failed, config at {config_path} may be stale");
        }

        Ok(())
    }

    /// Generate a client .conf file
    pub fn generate_client_config(
        &self,
        private_key: &str,
        address: &str,
    ) -> String {
        format!(
            "[Interface]\n\
             PrivateKey = {private_key}\n\
             Address = {address}\n\
             DNS = {dns}\n\
             \n\
             [Peer]\n\
             PublicKey = {server_pubkey}\n\
             Endpoint = {endpoint}:{port}\n\
             AllowedIPs = 0.0.0.0/0, ::/0\n\
             PersistentKeepalive = 25\n",
            dns = self.config.wg_dns,
            server_pubkey = self.config.wg_server_public_key,
            endpoint = self.config.wg_endpoint,
            port = self.config.wg_port,
        )
    }
}
