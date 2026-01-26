mod db;
mod dto;
mod error;
mod model;
mod handlers;
mod bot;

use axum::{Router, routing::{delete, get, post}};
use teloxide::types::UserId;
use std::{env, sync::Arc};
use tower_http::cors::{Any, CorsLayer};

struct BotConfig {
    target_user_id: UserId
}

#[allow(dead_code)]
struct AppState {
    db_pool: sqlx::PgPool,
    tg_bot: teloxide::Bot,
    bot_config: BotConfig
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    use std::net::SocketAddr;
    use tokio::net::TcpListener;

    dotenv::dotenv().ok();
    pretty_env_logger::init();

    let user_id = {
        let user_id = env::var("TELEGRAM_TARGET_USER_ID").expect("TELEGRAM_TARGET_USER_ID is not set");
        let user_id = user_id.parse().expect("TELEGRAM_TARGET_USER_ID is not a valid integer");
        UserId(user_id)
    };

    let tg_bot = match bot::init_bot().await {
        Ok(bot) => bot,
        Err(err) => {
            eprintln!("Failed to initialize Telegram bot: {}", err);
            std::process::exit(1);
        }
    };

    let db_pool = match db::init_pool().await {
        Ok(pool) => pool,
        Err(err) => {
            eprintln!("Failed to initialize database pool: {}", err);
            std::process::exit(1);
        }
    };

    let state = Arc::new(AppState {
        db_pool,
        tg_bot,
        bot_config: BotConfig {
            target_user_id: user_id,
        }
    });

    let app = create_app(state);

    let addr = {
        let port = env::var("APP_PORT")
            .map(|port| port.parse().expect("APP_PORT is not a valid integer"))
            .unwrap_or(8000);
        SocketAddr::from(([127, 0, 0, 1], port))
    };

    let listener = TcpListener::bind(addr).await.expect("Failed to bind to address");
    println!("Listening on port {}", addr.port());

    axum::serve(listener, app).await?;

    Ok(())
}

fn create_app(state: Arc<AppState>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    axum::Router::new()
        .route("/api/orders", get(handlers::get_orders))
        .route("/api/orders/{id}", get(handlers::get_order))
        .route("/api/orders", post(handlers::create_order))
        .route("/api/orders/{id}", delete(handlers::delete_order))
        .layer(cors)
        .with_state(state)
}