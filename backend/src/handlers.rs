use axum::{
    extract::{State, Path, Json as JsonBody},
    Json,
};
use chrono::Utc;
use uuid::Uuid;
use std::sync::Arc;
use super::{model, dto, error};
use super::error::APIError;
use super::AppState;

pub async fn get_orders(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<model::Order>>, APIError> {
    let query = r#"
        SELECT id, created_at, service, name, email, budget, duration, message
        FROM orders
        ORDER BY created_at DESC
        "#;

    let orders = sqlx::query_as::<_, model::Order>(query)
        .fetch_all(&state.db_pool)
        .await
        .map_err(error::map_internal_error("Failed to fetch orders"))?;

    Ok(Json(orders))
}

pub async fn get_order(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<model::Order>, APIError> {
    let query = r#"
        SELECT id, created_at, service, name, email, budget, duration, message
        FROM orders
        WHERE id = $1
        "#;

    let order = sqlx::query_as::<_, model::Order>(query)
        .bind(id)
        .fetch_optional(&state.db_pool)
        .await
        .map_err(error::map_internal_error("Failed to fetch order"))?;

    match order {
        Some(order) => Ok(Json(order)),
        None => Err(APIError::NotFound(format!("Order with ID {} not found", id))),
    }
}

pub async fn create_order(
    State(state): State<Arc<AppState>>,
    JsonBody(payload): JsonBody<dto::CreateOrderRequest>,
) -> Result<Json<model::Order>, APIError> {
    let query = r#"
        INSERT INTO orders (id, created_at, service, name, email, budget, duration, message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at, service, name, email, budget, duration, message
        "#;

    let order_id = Uuid::new_v4();
    let created_at = Utc::now().naive_utc();

    let order = sqlx::query_as::<_, model::Order>(query)
        .bind(order_id)
        .bind(created_at)
        .bind(payload.service)
        .bind(payload.name)
        .bind(payload.email)
        .bind(payload.budget)
        .bind(payload.duration)
        .bind(payload.message)
        .fetch_one(&state.db_pool)
        .await
        .map_err(error::map_internal_error("Failed to create order"))?;

    Ok(Json(order))
}

pub async fn delete_order(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<(), APIError> {
    let query = r#"
        DELETE FROM orders
        WHERE id = $1
        "#;

    sqlx::query(query)
        .bind(id)
        .execute(&state.db_pool)
        .await
        .map_err(error::map_internal_error("Failed to delete order"))?;

    Ok(())
}
