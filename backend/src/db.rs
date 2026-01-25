use sqlx::{PgPool, postgres::{PgConnectOptions, PgPoolOptions}};
use std::{env, time::Duration};

pub async fn init_pool() -> Result<PgPool, sqlx::Error> {
    let db_username = env::var("POSTGRES_USER").expect("POSTGRES_USER is not set");
    let db_password = env::var("POSTGRES_PASSWORD").expect("POSTGRES_PASSWORD is not set");
    let db_name = env::var("POSTGRES_DB").expect("POSTGRES_DB is not set");

    let options = PgConnectOptions::new()
        .host("127.0.0.1")
        .port(5432)
        .username(db_username.as_str())
        .password(db_password.as_str())
        .database(db_name.as_str());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(5))
        .connect_with(options).await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}
