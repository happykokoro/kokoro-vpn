use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::errors::AppError;
use crate::wireguard::stats;
use crate::AppState;

#[derive(Deserialize)]
pub struct CreateDeviceRequest {
    pub name: String,
}

#[derive(Serialize)]
pub struct DeviceResponse {
    pub id: String,
    pub name: String,
    pub address: String,
    pub public_key: String,
    pub config: String,
    pub created_at: String,
}

#[derive(Serialize)]
pub struct DeviceListItem {
    pub id: String,
    pub name: String,
    pub address: String,
    pub public_key: String,
    pub created_at: String,
    pub last_seen: Option<String>,
}

#[derive(Serialize)]
pub struct StatsResponse {
    pub devices: Vec<DeviceStats>,
}

#[derive(Serialize)]
pub struct DeviceStats {
    pub device_id: String,
    pub name: String,
    pub rx_bytes: i64,
    pub tx_bytes: i64,
    pub last_handshake: i64,
}

pub async fn create_device(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Json(req): Json<CreateDeviceRequest>,
) -> Result<Json<DeviceResponse>, AppError> {
    if req.name.is_empty() {
        return Err(AppError::BadRequest("Device name is required".into()));
    }

    let (private_key, public_key) = state.wg.generate_keypair().await?;
    let address = state.wg.allocate_ip(&state.db).await?;
    let id = Uuid::new_v4().to_string();

    // Add peer to WireGuard interface
    state.wg.add_peer(&public_key, &address).await?;

    // Store in database
    sqlx::query(
        "INSERT INTO devices (id, user_id, name, public_key, private_key, address) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&claims.sub)
    .bind(&req.name)
    .bind(&public_key)
    .bind(&private_key)
    .bind(&address)
    .execute(&state.db)
    .await?;

    let config = state.wg.generate_client_config(&private_key, &address);

    let created_at = sqlx::query_scalar::<_, String>("SELECT created_at FROM devices WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await?;

    Ok(Json(DeviceResponse {
        id,
        name: req.name,
        address,
        public_key,
        config,
        created_at,
    }))
}

pub async fn list_devices(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<DeviceListItem>>, AppError> {
    let devices = sqlx::query_as::<_, (String, String, String, String, String, Option<String>)>(
        "SELECT id, name, address, public_key, created_at, last_seen FROM devices WHERE user_id = ?"
    )
    .bind(&claims.sub)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(
        devices
            .into_iter()
            .map(|(id, name, address, public_key, created_at, last_seen)| DeviceListItem {
                id,
                name,
                address,
                public_key,
                created_at,
                last_seen,
            })
            .collect(),
    ))
}

pub async fn delete_device(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    axum::extract::Path(device_id): axum::extract::Path<String>,
) -> Result<axum::http::StatusCode, AppError> {
    let device = sqlx::query_as::<_, (String,)>(
        "SELECT public_key FROM devices WHERE id = ? AND user_id = ?"
    )
    .bind(&device_id)
    .bind(&claims.sub)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Device not found".into()))?;

    // Remove from WireGuard
    state.wg.remove_peer(&device.0).await?;

    // Remove from database
    sqlx::query("DELETE FROM devices WHERE id = ?")
        .bind(&device_id)
        .execute(&state.db)
        .await?;

    Ok(axum::http::StatusCode::NO_CONTENT)
}

pub async fn get_stats(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
) -> Result<Json<StatsResponse>, AppError> {
    let devices = sqlx::query_as::<_, (String, String, String)>(
        "SELECT id, name, public_key FROM devices WHERE user_id = ?"
    )
    .bind(&claims.sub)
    .fetch_all(&state.db)
    .await?;

    let transfer = stats::get_transfer_stats(&state.config.wg_interface).await.unwrap_or_default();
    let handshakes = stats::get_handshake_times(&state.config.wg_interface).await.unwrap_or_default();

    let device_stats = devices
        .into_iter()
        .map(|(id, name, pubkey)| {
            let (rx, tx) = transfer.get(&pubkey).copied().unwrap_or((0, 0));
            let last_handshake = handshakes.get(&pubkey).copied().unwrap_or(0);
            DeviceStats {
                device_id: id,
                name,
                rx_bytes: rx,
                tx_bytes: tx,
                last_handshake,
            }
        })
        .collect();

    Ok(Json(StatsResponse {
        devices: device_stats,
    }))
}
