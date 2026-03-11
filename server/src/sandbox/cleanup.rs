use std::time::Duration;
use sqlx::SqlitePool;
use tokio::time::interval;

use crate::wireguard::manager::WgManager;
use crate::wireguard::stats;

/// Background task that cleans up expired guest accounts
pub fn spawn_cleanup_task(db: SqlitePool, wg: WgManager, wg_interface: String) {
    tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(60));

        loop {
            ticker.tick().await;

            if let Err(e) = cleanup_expired_guests(&db, &wg).await {
                tracing::error!("Guest cleanup error: {e}");
            }

            if let Err(e) = enforce_bandwidth_limits(&db, &wg, &wg_interface).await {
                tracing::error!("Bandwidth enforcement error: {e}");
            }
        }
    });
}

async fn cleanup_expired_guests(db: &SqlitePool, wg: &WgManager) -> anyhow::Result<()> {
    // Find expired guests and their devices
    let expired: Vec<(String, String)> = sqlx::query_as(
        "SELECT d.id, d.public_key FROM devices d \
         JOIN users u ON d.user_id = u.id \
         WHERE u.role = 'guest' AND u.expires_at IS NOT NULL AND u.expires_at < datetime('now')"
    )
    .fetch_all(db)
    .await?;

    for (device_id, public_key) in &expired {
        tracing::info!("Removing expired guest device {device_id}");
        let _ = wg.remove_peer(public_key).await;
    }

    // Delete expired guest users (CASCADE deletes devices too)
    let result = sqlx::query(
        "DELETE FROM users WHERE role = 'guest' AND expires_at IS NOT NULL AND expires_at < datetime('now')"
    )
    .execute(db)
    .await?;

    if result.rows_affected() > 0 {
        tracing::info!("Cleaned up {} expired guest accounts", result.rows_affected());
    }

    Ok(())
}

async fn enforce_bandwidth_limits(
    db: &SqlitePool,
    wg: &WgManager,
    wg_interface: &str,
) -> anyhow::Result<()> {
    let transfer = stats::get_transfer_stats(wg_interface).await.unwrap_or_default();

    // Get guests with bandwidth limits
    let guests: Vec<(String, String, i64)> = sqlx::query_as(
        "SELECT d.user_id, d.public_key, u.bandwidth_limit_bytes \
         FROM devices d JOIN users u ON d.user_id = u.id \
         WHERE u.role = 'guest' AND u.bandwidth_limit_bytes IS NOT NULL"
    )
    .fetch_all(db)
    .await?;

    for (user_id, public_key, limit) in &guests {
        if let Some(&(rx, tx)) = transfer.get(public_key) {
            let total = rx + tx;

            // Update usage
            sqlx::query("UPDATE users SET bandwidth_used_bytes = ? WHERE id = ?")
                .bind(total)
                .bind(user_id)
                .execute(db)
                .await?;

            // If over limit, remove peer
            if total > *limit {
                tracing::info!("Guest {user_id} exceeded bandwidth limit ({total} > {limit}), removing");
                let _ = wg.remove_peer(public_key).await;
                sqlx::query("DELETE FROM users WHERE id = ?")
                    .bind(user_id)
                    .execute(db)
                    .await?;
            }
        }
    }

    Ok(())
}
