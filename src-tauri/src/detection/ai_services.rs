//! AI 服务兼容性检测：对主流国际服务发起 HTTPS 探测，结合 IP 是否为数据中心，
//! 给出"推荐 / 正常 / 风险"三档评级。

use super::http;
use super::{AiServiceResult, AiServicesInfo, RiskLevel};
use std::time::Instant;

const AI_SERVICES: &[(&str, &str)] = &[
    ("ChatGPT", "https://chat.openai.com"),
    ("Claude", "https://claude.ai"),
    ("Gemini", "https://gemini.google.com"),
    ("Google", "https://www.google.com"),
    ("GitHub", "https://github.com"),
    ("Microsoft", "https://www.microsoft.com"),
    ("Cloudflare", "https://www.cloudflare.com"),
];

async fn probe(url: &str) -> (bool, Option<u32>) {
    let start = Instant::now();
    match http::client().get(url).send().await {
        Ok(resp) => {
            let ms = start.elapsed().as_millis() as u32;
            // 任何 HTTP 响应都算可达（服务端有应答）；3xx/4xx/5xx 也计入连通。
            let reachable = resp.status().is_informational()
                || resp.status().is_success()
                || resp.status().is_redirection()
                || resp.status().is_client_error()
                || resp.status().is_server_error();
            (reachable, Some(ms))
        }
        Err(_) => (false, None),
    }
}

pub async fn detect(is_hosting: bool) -> AiServicesInfo {
    let mut tasks = Vec::new();
    for (name, url) in AI_SERVICES {
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
            let (level, summary) = match (reachable, latency, is_hosting) {
                (false, _, _) => (
                    RiskLevel::Risk,
                    "无法连通，当前网络可能无法访问该服务。".to_string(),
                ),
                (true, Some(ms), true) if ms < 800 => (
                    RiskLevel::Warn,
                    "可访问，但当前为数据中心 IP，可能遇到验证码或风控。".to_string(),
                ),
                (true, Some(ms), false) if ms < 800 => (
                    RiskLevel::Ok,
                    "访问流畅，适合日常使用。".to_string(),
                ),
                (true, _, _) => (
                    RiskLevel::Warn,
                    "可访问但响应较慢，体验可能受影响。".to_string(),
                ),
            };
            services.push(AiServiceResult {
                name,
                reachable,
                latency_ms: latency,
                level,
                summary,
            });
        }
    }

    AiServicesInfo { services }
}
