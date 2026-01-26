use std::env;
use teloxide::{
    prelude::*,
    types::ParseMode,
    Bot
};
use super::{
    model::Order,
    BotConfig
};

pub async fn init_bot() -> ResponseResult<Bot> {
    let bot_token = env::var("TELEGRAM_BOT_TOKEN").expect("TELEGRAM_BOT_TOKEN is not set");

    let bot = Bot::new(bot_token);

    let me = bot.get_me().await?;
    log::info!("Bot started successfully: @{}", me.username());

    Ok(bot)
}

pub async fn send_notification(bot: &Bot, bot_config: &BotConfig, order: &Order) -> ResponseResult<()> {
    let user_id = bot_config.target_user_id;
    let message = format_order(order);

    bot.send_message(user_id.clone(), message)
        .parse_mode(ParseMode::MarkdownV2).await?;

    Ok(())
}

fn format_order(order: &Order) -> String {
    use teloxide::utils::markdown::escape;

    let mut lines = Vec::with_capacity(8);

    lines.push("🚨 *New order received*\n".to_string());
    lines.push(format!("*Created at*: {}", escape(order.created_at.to_string().as_ref())));
    lines.push(format!("*Service*: {}", escape(&order.service)));
    lines.push(format!("*Name*: {}", escape(&order.name)));
    lines.push(format!("*Email*: {}", escape(&order.email)));

    if let Some(budget) = order.budget {
        lines.push(format!("*Budget*: {}", budget));
    }

    if let Some(duration) = order.duration.as_ref().filter(|s| !s.trim().is_empty()) {
        lines.push(format!("*Duration*: {}", escape(duration)));
    }

    if let Some(message) = order.message.as_ref().filter(|s| !s.trim().is_empty()) {
        lines.push(format!("\n*Message*: {}", escape(message)));
    }

    lines.push(format!("\n_Order ID: {}_", escape(order.id.to_string().as_ref())));

    lines.join("\n")
}
