use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};

pub async fn init_pool(database_url: &str) -> SqlitePool {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
        .expect("Failed to connect to database");

    run_migrations(&pool).await;
    pool
}

async fn run_migrations(pool: &SqlitePool) {
    let migration_sql = include_str!("../migrations/001_init.sql");
    for statement in migration_sql.split(';') {
        let trimmed = statement.trim();
        if !trimmed.is_empty() {
            sqlx::query(trimmed)
                .execute(pool)
                .await
                .expect("Failed to run migration");
        }
    }
    tracing::info!("Database migrations complete");
}
