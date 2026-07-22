//! 流媒体可访问性检测（可选）：仅探测服务首页是否可达。

use super::http;
use super::{StreamingInfo, StreamingResult};
use std::time::Instant;

const STREAMING_SERVICES: &[(&str, &str)] = &[
    ("Netflix", "https://www.netflix.com"),
    ("Disney+", "https://www.disneyplus.com"),
    ("YouTube Premium", "https://www.youtube.com"),
    ("Spotify", "https://www.spotify.com"),
    ("Apple TV+", "https://tv.apple.com"),
    ("Prime Video", "https://www.primevideo.com"),
];

async fn probe(url: &str) -> (bool, Option<u32>) {
    let start = Instant::now();
    match http::client().get(url).send().await {
        Ok(resp) => {
            let ms = start.elapsed().as_millis() as u32;
            let reachable = resp.status().is_success()
                || resp.status().is_redirection()
                || resp.status().is_client_error();
            (reachable, Some(ms))
        }
        Err(_) => (false, None),
    }
}

pub async fn detect() -> StreamingInfo {
    let mut tasks = Vec::new();
    for (name, url) in STREAMING_SERVICES {
        let name = name.to_string();
        let url = url.to_string();
        tasks.push(tokio::spawn(async move {
            let (reachable, latency) = probe(&url).await;
            (name, reachable, latency)
        }));
    }

    let mut services = Vec::new();
    for t in tasks {
        if let Ok((name, reachable, latency)) = t.await {
            services.push(StreamingResult {
                name,
                accessible: reachable,
                latency_ms: latency,
            });
        }
    }

    StreamingInfo { services }
}
