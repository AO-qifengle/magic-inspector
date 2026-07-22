//! 共享的 HTTP 客户端与轻量 JSON 抓取工具。
//!
//! 使用 rustls-tls，避免对系统 OpenSSL 的依赖。所有外部请求都设置较短超时，
//! 以保证整次检测可在 5 秒内完成（并发执行时尤其重要）。
//!
//! 关键：读取 macOS / Windows 的系统代理设置并应用到 reqwest，
//! 确保 VPN 客户端（Clash / Surge / V2RayU 等）的系统代理模式下检测流量也能走 VPN。

use std::collections::HashMap;
use std::process::Command;
use std::time::Duration;

const TIMEOUT: Duration = Duration::from_secs(4);

/// 读取 macOS 系统代理设置（通过 `scutil --proxy`）。
/// 返回 (host, port, proxy_type) 三元组，proxy_type 为 "http" / "https" / "socks"。
#[cfg(target_os = "macos")]
fn read_macos_proxy() -> Option<(&'static str, String, u16)> {
    let output = Command::new("scutil").arg("--proxy").output().ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    let map: HashMap<&str, &str> = stdout
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            let mut parts = line.splitn(2, ':');
            let key = parts.next()?.trim();
            let val = parts.next()?.trim();
            Some((key, val))
        })
        .collect();

    // 优先 HTTPS，其次 HTTP，最后 SOCKS
    let proxy_configs = [
        ("HTTPSProxy", "HTTPSEnable", "https"),
        ("HTTPProxy", "HTTPEnable", "http"),
        ("SOCKSProxy", "SOCKSEnable", "socks"),
    ];

    for (host_key, enable_key, ptype) in &proxy_configs {
        let enabled = map.get(enable_key).map(|v| *v == "1").unwrap_or(false);
        if !enabled {
            continue;
        }
        let host = map.get(host_key)?.to_string();
        let port_str = match *ptype {
            "https" => map.get("HTTPSPort")?,
            "http" => map.get("HTTPPort")?,
            "socks" => map.get("SOCKSPort")?,
            _ => continue,
        };
        let port: u16 = port_str.parse().ok()?;
        if host.is_empty() || port == 0 {
            continue;
        }
        return Some((ptype, host, port));
    }
    None
}

/// 读取 Windows 系统代理设置（通过注册表）。
#[cfg(target_os = "windows")]
fn read_windows_proxy() -> Option<(&'static str, String, u16)> {
    // Windows 上 reqwest 默认会读取环境变量。
    // 系统代理通常存在注册表 HKCU\...\Internet Settings，
    // 大多数 VPN 客户端也会设置环境变量，所以这里仅做环境变量兜底。
    None
}

/// 获取系统代理，返回 reqwest::Proxy 配置用的字符串（如 "http://127.0.0.1:7890"）。
fn system_proxy_url() -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        let (ptype, host, port) = read_macos_proxy()?;
        // 注意：系统代理设置中的 "HTTPSProxy" 指的是"用于代理 HTTPS 流量的代理服务器"，
        // 而非"用 HTTPS 协议连接的代理服务器"。Clash / Surge 等客户端监听的是 HTTP 协议端口，
        // 所以代理 URL 始终用 http:// 前缀（SOCKS 除外）。
        let scheme = if ptype == "socks" { "socks5h" } else { "http" };
        Some(format!("{}://{}:{}", scheme, host, port))
    }
    #[cfg(target_os = "windows")]
    {
        read_windows_proxy()
            .map(|(ptype, host, port)| {
                let scheme = if ptype == "socks" { "socks5h" } else { "http" };
                format!("{}://{}:{}", scheme, host, port)
            })
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        None
    }
}

pub fn client() -> reqwest::Client {
    let mut builder = reqwest::Client::builder()
        .timeout(TIMEOUT)
        .connect_timeout(Duration::from_secs(3))
        .user_agent("MagicInspector/1.0 (+https://magicinspector.app)");

    // 应用系统代理（macOS 系统代理设置 / Windows 注册表代理）
    if let Some(proxy_url) = system_proxy_url() {
        if let Ok(proxy) = reqwest::Proxy::all(&proxy_url) {
            builder = builder.proxy(proxy);
        }
    }

    builder.build().expect("failed to build reqwest client")
}

/// 以 JSON 获取并反序列化，失败时返回 None（调用方按"部分可用"处理）。
pub async fn fetch_json<T: serde::de::DeserializeOwned>(url: &str) -> Option<T> {
    let resp = client().get(url).send().await.ok()?;
    if !resp.status().is_success() {
        return None;
    }
    resp.json::<T>().await.ok()
}

/// 获取纯文本响应（如 icanhazip）。
pub async fn fetch_text(url: &str) -> Option<String> {
    let resp = client().get(url).send().await.ok()?;
    if !resp.status().is_success() {
        return None;
    }
    let text = resp.text().await.ok()?;
    Some(text.trim().to_string())
}
