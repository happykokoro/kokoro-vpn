mod auth;
mod config;
mod db;
mod errors;
mod sandbox;
mod users;
mod wireguard;

use axum::routing::{delete, get, post};
use axum::Router;
use sqlx::SqlitePool;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::trace::TraceLayer;

use crate::auth::AuthState;
use crate::config::AppConfig;
use crate::wireguard::manager::WgManager;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub config: AppConfig,
    pub auth: AuthState,
    pub wg: WgManager,
}

impl AsRef<AuthState> for AppState {
    fn as_ref(&self) -> &AuthState {
        &self.auth
    }
}

#[tokio::main]
async fn main() {
    // Load .env file if present
    let _ = dotenvy::dotenv();

    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "kokoro_vpn_server=info,tower_http=info".into()),
        )
        .init();

    let config = AppConfig::from_env();

    // Initialize database
    let db = db::init_pool(&config.database_url).await;

    // Seed admin account
    seed_admin(&db, &config).await;

    let auth = AuthState::new(config.jwt_secret.clone());
    let wg = WgManager::new(config.clone());

    let state = AppState {
        db: db.clone(),
        config: config.clone(),
        auth,
        wg: wg.clone(),
    };

    // Start background cleanup task
    sandbox::cleanup::spawn_cleanup_task(db, wg, config.wg_interface.clone());

    // Build router
    let app = Router::new()
        // Auth routes
        .route("/api/auth/register", post(auth::handlers::register))
        .route("/api/auth/login", post(auth::handlers::login))
        // User routes
        .route("/api/users/me", get(users::handlers::get_me))
        .route("/api/users", get(users::handlers::list_users))
        .route("/api/users/{id}", delete(users::handlers::delete_user))
        // Device routes
        .route("/api/devices", post(wireguard::handlers::create_device))
        .route("/api/devices", get(wireguard::handlers::list_devices))
        .route("/api/devices/{id}", delete(wireguard::handlers::delete_device))
        // Stats
        .route("/api/wg/stats", get(wireguard::handlers::get_stats))
        // Sandbox
        .route("/api/sandbox/guest", post(sandbox::handlers::create_guest))
        // Server profiles
        .route("/api/servers", get(list_servers))
        // Middleware
        .layer(RequestBodyLimitLayer::new(1024 * 1024)) // 1MB max request body
        .layer(build_cors(&config))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("{}:{}", config.server_host, config.server_port);
    tracing::info!("Kokoro VPN server listening on {addr}");

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

fn build_cors(config: &AppConfig) -> CorsLayer {
    // In production, restrict to known origins; fall back to permissive for dev
    if let Ok(origins) = std::env::var("CORS_ORIGINS") {
        let origins: Vec<_> = origins
            .split(',')
            .filter_map(|o| o.trim().parse().ok())
            .collect();
        CorsLayer::new()
            .allow_origin(AllowOrigin::list(origins))
            .allow_methods(tower_http::cors::Any)
            .allow_headers(tower_http::cors::Any)
    } else {
        CorsLayer::permissive()
    }
}

async fn seed_admin(db: &SqlitePool, config: &AppConfig) {
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        .fetch_one(db)
        .await
        .unwrap_or(0);

    if exists == 0 {
        use argon2::{password_hash::SaltString, Argon2, PasswordHasher};
        use rand::rngs::OsRng;

        let salt = SaltString::generate(&mut OsRng);
        let hash = Argon2::default()
            .hash_password(config.admin_password.as_bytes(), &salt)
            .expect("Failed to hash admin password")
            .to_string();

        let id = uuid::Uuid::new_v4().to_string();
        sqlx::query("INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, 'admin')")
            .bind(&id)
            .bind(&config.admin_username)
            .bind(&hash)
            .execute(db)
            .await
            .expect("Failed to seed admin account");

        tracing::info!("Admin account created: {}", config.admin_username);
    }
}

async fn list_servers(
    auth::middleware::AuthUser(_claims): auth::middleware::AuthUser,
    axum::extract::State(state): axum::extract::State<AppState>,
) -> Result<axum::Json<Vec<serde_json::Value>>, errors::AppError> {
    let servers: Vec<(String, String, String, String, String, String, bool)> = sqlx::query_as(
        "SELECT id, name, endpoint, public_key, dns, allowed_ips, is_active FROM server_profiles WHERE is_active = 1"
    )
    .fetch_all(&state.db)
    .await?;

    let result: Vec<serde_json::Value> = servers
        .into_iter()
        .map(|(id, name, endpoint, public_key, dns, allowed_ips, is_active)| {
            serde_json::json!({
                "id": id,
                "name": name,
                "endpoint": endpoint,
                "public_key": public_key,
                "dns": dns,
                "allowed_ips": allowed_ips,
                "is_active": is_active,
            })
        })
        .collect();

    Ok(axum::Json(result))
}
