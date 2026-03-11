use std::env;

#[derive(Clone)]
pub struct AppConfig {
    pub database_url: String,
    pub jwt_secret: String,
    pub server_host: String,
    pub server_port: u16,
    pub wg_interface: String,
    pub wg_endpoint: String,
    pub wg_port: u16,
    pub wg_subnet: String,
    pub wg_dns: String,
    pub wg_server_private_key: String,
    pub wg_server_public_key: String,
    pub wg_config_dir: String,
    pub admin_username: String,
    pub admin_password: String,
    pub guest_expiry_minutes: i64,
    pub guest_bandwidth_bytes: i64,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:kokoro-vpn.db".into()),
            jwt_secret: env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
            server_host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".into()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "3000".into())
                .parse()
                .expect("SERVER_PORT must be a number"),
            wg_interface: env::var("WG_INTERFACE").unwrap_or_else(|_| "wg0".into()),
            wg_endpoint: env::var("WG_ENDPOINT").expect("WG_ENDPOINT must be set"),
            wg_port: env::var("WG_PORT")
                .unwrap_or_else(|_| "51820".into())
                .parse()
                .expect("WG_PORT must be a number"),
            wg_subnet: env::var("WG_SUBNET").unwrap_or_else(|_| "10.8.0".into()),
            wg_dns: env::var("WG_DNS").unwrap_or_else(|_| "1.1.1.1,8.8.8.8".into()),
            wg_server_private_key: env::var("WG_SERVER_PRIVATE_KEY")
                .unwrap_or_default(),
            wg_server_public_key: env::var("WG_SERVER_PUBLIC_KEY")
                .unwrap_or_default(),
            wg_config_dir: env::var("WG_CONFIG_DIR")
                .unwrap_or_else(|_| "/etc/wireguard".into()),
            admin_username: env::var("ADMIN_USERNAME")
                .unwrap_or_else(|_| "admin".into()),
            admin_password: env::var("ADMIN_PASSWORD")
                .unwrap_or_else(|_| "admin".into()),
            guest_expiry_minutes: env::var("GUEST_EXPIRY_MINUTES")
                .unwrap_or_else(|_| "30".into())
                .parse()
                .unwrap_or(30),
            guest_bandwidth_bytes: env::var("GUEST_BANDWIDTH_BYTES")
                .unwrap_or_else(|_| "104857600".into()) // 100MB
                .parse()
                .unwrap_or(104857600),
        }
    }
}
