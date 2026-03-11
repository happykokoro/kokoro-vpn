pub mod handlers;
pub mod jwt;
pub mod middleware;

#[derive(Clone)]
pub struct AuthState {
    pub jwt_secret: String,
}

impl AuthState {
    pub fn new(jwt_secret: String) -> Self {
        Self { jwt_secret }
    }
}
