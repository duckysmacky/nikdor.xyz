use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct CreateOrderRequest {
    pub service: String,
    pub name: String,
    pub email: String,
    pub budget: Option<i32>,
    pub duration: Option<String>,
    pub message: Option<String>,
}
