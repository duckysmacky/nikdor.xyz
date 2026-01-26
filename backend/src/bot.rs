use std::env;
use teloxide::{
    prelude::*,
    Bot
};

pub async fn init_bot() -> ResponseResult<Bot> {
    let bot_token = env::var("TELEGRAM_BOT_TOKEN").expect("TELEGRAM_BOT_TOKEN is not set");

    let bot = Bot::new(bot_token);

    let me = bot.get_me().await?;
    log::info!("Bot started successfully: @{}", me.username());

    Ok(bot)
}