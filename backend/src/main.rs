mod db;
mod dto;
mod error;
mod model;
mod handlers;
mod bot;

use axum::routing::{get, post, delete};
use std::sync::Arc;

#[allow(dead_code)]
struct AppState {
    db_pool: sqlx::PgPool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    use std::net::SocketAddr;
    use tokio::net::TcpListener;

    dotenv::dotenv().ok();
    pretty_env_logger::init();
    bot::init_bot().await?;
    let db_pool = db::init_pool().await?;

    let state = Arc::new(AppState {
        db_pool,
    });

    let app = axum::Router::new()
        .route("/api/orders", get(handlers::get_orders))
        .route("/api/orders/{id}", get(handlers::get_order))
        .route("/api/orders", post(handlers::create_order))
        .route("/api/orders/{id}", delete(handlers::delete_order))
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    let listener = TcpListener::bind(addr).await.expect("Failed to bind to address");
    println!("Listening on port {}", addr.port());

    axum::serve(listener, app).await?;

    Ok(())
}