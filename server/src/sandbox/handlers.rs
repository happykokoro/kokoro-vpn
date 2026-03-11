use axum::extract::State;
use axum::Json;
use chrono::{Duration, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::auth::jwt::create_token;
use crate::errors::AppError;
use crate::AppState;

#[derive(Serialize)]
pub struct GuestResponse {
    pub token: String,
    pub config: String,
    pub expires_at: String,
    pub bandwidth_limit_mb: i64,
}

pub async fn create_guest(
    State(state): State<AppState>,
) -> Result<Json<GuestResponse>, AppError> {
    let id = Uuid::new_v4().to_string();
    let username = format!("guest-{}", &id[..8]);
    let expires_at = Utc::now() + Duration::minutes(state.config.guest_expiry_minutes);
    let expires_str = expires_at.format("%Y-%m-%d %H:%M:%S").to_string();

    // Create guest user
    sqlx::query(
        "INSERT INTO users (id, username, password_hash, role, expires_at, bandwidth_limit_bytes) \
         VALUES (?, ?, '', 'guest', ?, ?)"
    )
    .bind(&id)
    .bind(&username)
    .bind(&expires_str)
    .bind(state.config.guest_bandwidth_bytes)
    .execute(&state.db)
    .await?;

    // Generate device for guest
    let (private_key, public_key) = state.wg.generate_keypair().await?;
    let address = state.wg.allocate_ip(&state.db).await?;
    let device_id = Uuid::new_v4().to_string();

    state.wg.add_peer(&public_key, &address).await?;

    sqlx::query(
        "INSERT INTO devices (id, user_id, name, public_key, private_key, address) \
         VALUES (?, ?, 'guest-device', ?, ?, ?)"
    )
    .bind(&device_id)
    .bind(&id)
    .bind(&public_key)
    .bind(&private_key)
    .bind(&address)
    .execute(&state.db)
    .await?;

    let config = state.wg.generate_client_config(&private_key, &address);

    let token = create_token(&id, "guest", &state.auth.jwt_secret)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(Json(GuestResponse {
        token,
        config,
        expires_at: expires_str,
        bandwidth_limit_mb: state.config.guest_bandwidth_bytes / 1_048_576,
    }))
}
