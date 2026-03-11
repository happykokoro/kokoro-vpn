use axum::extract::FromRequestParts;
use axum::http::request::Parts;

use crate::auth::jwt::{verify_token, Claims};
use crate::errors::AppError;

use super::AuthState;

/// Extractor that validates JWT and provides Claims
pub struct AuthUser(pub Claims);

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync + AsRef<AuthState>,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let auth_state = state.as_ref();

        let header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| AppError::Auth("Missing Authorization header".into()))?;

        let token = header
            .strip_prefix("Bearer ")
            .ok_or_else(|| AppError::Auth("Invalid Authorization format".into()))?;

        let claims = verify_token(token, &auth_state.jwt_secret)
            .map_err(|_| AppError::Auth("Invalid or expired token".into()))?;

        Ok(AuthUser(claims))
    }
}

/// Extractor that requires admin role
pub struct AdminUser(pub Claims);

impl<S> FromRequestParts<S> for AdminUser
where
    S: Send + Sync + AsRef<AuthState>,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let AuthUser(claims) = AuthUser::from_request_parts(parts, state).await?;

        if claims.role != "admin" {
            return Err(AppError::Forbidden("Admin access required".into()));
        }

        Ok(AdminUser(claims))
    }
}
