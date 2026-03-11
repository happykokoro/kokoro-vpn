use serde::Serialize;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub username: String,
    #[serde(skip)]
    pub password_hash: String,
    pub role: String,
    pub created_at: String,
    pub expires_at: Option<String>,
    pub bandwidth_limit_bytes: Option<i64>,
    pub bandwidth_used_bytes: i64,
}
