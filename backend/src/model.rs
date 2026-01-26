use chrono::NaiveDateTime;
use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Order {
    pub id: Uuid,
    pub created_at: NaiveDateTime,
    pub service: String,
    pub name: String,
    pub email: String,
    pub budget: Option<i32>,
    pub duration: Option<String>,
    pub message: Option<String>,
}