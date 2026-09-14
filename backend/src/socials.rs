use axum::{Json, extract::State};
use serde::{Deserialize, Serialize};
use std::{
    env,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::sync::Mutex;

use super::AppState;

const CACHE_TTL: Duration = Duration::from_secs(300);

#[derive(Debug, Clone, Serialize)]
pub struct SocialsResponse {
    pub youtube: Option<VideoInfo>,
    pub twitch: TwitchInfo,
}

#[derive(Debug, Clone, Serialize)]
pub struct VideoInfo {
    pub id: String,
    pub title: String,
    pub url: String,
    pub thumbnail: String,
    pub published: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TwitchInfo {
    pub live: bool,
    pub title: Option<String>,
    pub url: String,
}

pub struct SocialsCache {
    client: reqwest::Client,
    twitch_token: Mutex<Option<(String, Instant)>>,
    cached: Mutex<Option<(SocialsResponse, Instant)>>,
}

impl Default for SocialsCache {
    fn default() -> Self {
        Self {
            client: reqwest::Client::new(),
            twitch_token: Mutex::new(None),
            cached: Mutex::new(None),
        }
    }
}

pub async fn get_socials(State(state): State<Arc<AppState>>) -> Json<SocialsResponse> {
    {
        let cached = state.socials.cached.lock().await;

        if let Some((data, fetched_at)) = cached.as_ref() {
            if fetched_at.elapsed() < CACHE_TTL {
                log::debug!("socials: served from cache");
                return Json(data.clone());
            }
        }
    }

    let (youtube, twitch) = tokio::join!(
        fetch_youtube(&state.socials.client),
        fetch_twitch(&state.socials),
    );

    log::info!(
        "socials refreshed: youtube={} twitch_live={}",
        if youtube.is_some() { "ok" } else { "none" },
        twitch.live
    );

    let response = SocialsResponse { youtube, twitch };

    let mut cached = state.socials.cached.lock().await;
    *cached = Some((response.clone(), Instant::now()));

    Json(response)
}

async fn fetch_youtube(client: &reqwest::Client) -> Option<VideoInfo> {
    let channel_id = match env::var("YOUTUBE_CHANNEL_ID") {
        Ok(id) => id,
        Err(_) => {
            log::warn!("youtube: YOUTUBE_CHANNEL_ID is not set, skipping");
            return None;
        }
    };
    let url = format!("https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}");

    let response = match client.get(url).send().await {
        Ok(response) => response,
        Err(err) => {
            log::warn!("youtube: request failed: {err}");
            return None;
        }
    };

    let body = match response.text().await {
        Ok(body) => body,
        Err(err) => {
            log::warn!("youtube: failed to read response body: {err}");
            return None;
        }
    };

    // ponytail: string-sliced RSS parsing instead of an XML crate, swap for
    // quick-xml if the feed shape ever changes underneath this
    let Some(entry) = body.split("<entry>").nth(1) else {
        log::warn!("youtube: feed has no <entry> (empty channel or unexpected shape)");
        return None;
    };
    let Some(id) = extract_tag(entry, "yt:videoId") else {
        log::warn!("youtube: could not find yt:videoId in feed entry");
        return None;
    };
    let Some(title) = extract_tag(entry, "media:title").or_else(|| extract_tag(entry, "title"))
    else {
        log::warn!("youtube: could not find title in feed entry");
        return None;
    };
    let published = extract_tag(entry, "published");

    log::info!("youtube: latest video is {id} ({title})");

    Some(VideoInfo {
        url: format!("https://www.youtube.com/watch?v={id}"),
        thumbnail: format!("https://i.ytimg.com/vi/{id}/mqdefault.jpg"),
        id,
        title,
        published,
    })
}

fn extract_tag(xml: &str, tag: &str) -> Option<String> {
    let open = format!("<{tag}>");
    let close = format!("</{tag}>");
    let start = xml.find(&open)? + open.len();
    let end = xml[start..].find(&close)? + start;
    Some(xml[start..end].trim().to_string())
}

#[derive(Debug, Deserialize)]
struct TwitchStream {
    title: String,
}

#[derive(Debug, Deserialize)]
struct TwitchStreamsResponse {
    data: Vec<TwitchStream>,
}

#[derive(Debug, Deserialize)]
struct TwitchTokenResponse {
    access_token: String,
    expires_in: u64,
}

async fn fetch_twitch(cache: &SocialsCache) -> TwitchInfo {
    let login = env::var("TWITCH_LOGIN").unwrap_or_default();
    let fallback = TwitchInfo {
        live: false,
        title: None,
        url: format!("https://www.twitch.tv/{login}"),
    };

    if login.is_empty() {
        log::warn!("twitch: TWITCH_LOGIN is not set, skipping");
        return fallback;
    }

    let Some(token) = get_twitch_token(cache).await else {
        log::warn!("twitch: could not obtain an access token, skipping");
        return fallback;
    };
    let Ok(client_id) = env::var("TWITCH_CLIENT_ID") else {
        log::warn!("twitch: TWITCH_CLIENT_ID is not set, skipping");
        return fallback;
    };

    let result = cache
        .client
        .get("https://api.twitch.tv/helix/streams")
        .query(&[("user_login", login.as_str())])
        .header("Client-Id", client_id)
        .header("Authorization", format!("Bearer {token}"))
        .send()
        .await;

    let response = match result {
        Ok(response) => response,
        Err(err) => {
            log::warn!("twitch: streams request failed: {err}");
            return fallback;
        }
    };

    let body = match response.json::<TwitchStreamsResponse>().await {
        Ok(body) => body,
        Err(err) => {
            log::warn!("twitch: failed to parse streams response: {err}");
            return fallback;
        }
    };

    match body.data.into_iter().next() {
        Some(stream) => {
            log::info!("twitch: {login} is live ({})", stream.title);
            TwitchInfo {
                live: true,
                title: Some(stream.title),
                url: fallback.url,
            }
        }
        None => {
            log::info!("twitch: {login} is offline");
            fallback
        }
    }
}

async fn get_twitch_token(cache: &SocialsCache) -> Option<String> {
    {
        let token = cache.twitch_token.lock().await;
        if let Some((value, expires_at)) = token.as_ref() {
            if Instant::now() < *expires_at {
                return Some(value.clone());
            }
        }
    }

    let client_id = env::var("TWITCH_CLIENT_ID").ok()?;
    let client_secret = env::var("TWITCH_CLIENT_SECRET").ok()?;

    let sent = cache
        .client
        .post("https://id.twitch.tv/oauth2/token")
        .query(&[
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("grant_type", "client_credentials"),
        ])
        .send()
        .await;

    let response = match sent {
        Ok(response) => response,
        Err(err) => {
            log::warn!("twitch: token request failed: {err}");
            return None;
        }
    };

    let response = match response.json::<TwitchTokenResponse>().await {
        Ok(response) => response,
        Err(err) => {
            log::warn!("twitch: failed to parse token response: {err}");
            return None;
        }
    };

    log::info!("twitch: refreshed access token");

    let expires_at = Instant::now() + Duration::from_secs(response.expires_in.saturating_sub(60));
    let mut token = cache.twitch_token.lock().await;
    *token = Some((response.access_token.clone(), expires_at));

    Some(response.access_token)
}
