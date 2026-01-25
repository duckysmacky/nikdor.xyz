use axum::{Json, http::StatusCode, response::IntoResponse};

use super::dto::ErrorResponse;

pub enum APIError {
    InternalServerError(String),
    NotFound(String),
}

impl IntoResponse for APIError {
    fn into_response(self) -> axum::response::Response {
        match self {
            APIError::InternalServerError(message) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: message,
                }),
            ),
            APIError::NotFound(message) => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: message,
                }),
            ),
        }.into_response()
    }
}

pub fn map_internal_error<E>(message: &str) -> impl FnOnce(E) -> APIError
where
    E: std::fmt::Display,
{
    move |_| {
        APIError::InternalServerError(message.to_string())
    }
}