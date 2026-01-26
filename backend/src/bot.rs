use std::env;
use teloxide::{
    prelude::*,
    types::Message,
    Bot
};

pub async fn init_bot() -> ResponseResult<()> {
    let bot_token = env::var("TELEGRAM_BOT_TOKEN").expect("TELEGRAM_BOT_TOKEN is not set");

    let bot = Bot::new(bot_token);

    let me = bot.get_me().await?;
    log::info!("Bot started successfully: @{}", me.username());

    teloxide::repl(bot, |bot: Bot, msg: Message| async move {
        if let Some(text) = msg.text() {
            bot.send_message(msg.chat.id, format!("You said: {}", text)).await?;
        }
        Ok(())
    }).await;

    Ok(())
}