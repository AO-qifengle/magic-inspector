//! DNS 检测：读取系统配置的 DNS 解析器，地理定位后与公网 IP 归属国对比，
//! 以启发式判断是否存在 DNS 泄露风险（解析器跨国 = VPN 可能未接管 DNS）。

use super::http;
use super::{CheckStatus, DnsInfo, DnsServer, NetworkInfo, RiskLevel};
use hickory_resolver::config::NameServerConfig;
use hickory_resolver::system_conf;
use serde::Deserialize;
use std::net::IpAddr;

#[derive(Deserialize)]
struct IpWhoIs {
    success: Option<bool>,
    country: Option<String>,
    country_code: Option<String>,
    connection: Option<Conn>,
}

#[derive(Deserialize)]
struct Conn {
    isp: Option<String>,
    org: Option<String>,
}

fn is_private(addr: &IpAddr) -> bool {
    match addr {
        IpAddr::V4(v4) => {
            v4.is_private() || v4.is_loopback() || v4.is_link_local()
        }
        IpAddr::V6(v6) => v6.is_loopback() || {
            let seg = v6.segments();
            // 唯一本地地址 fc00::/7
            (seg[0] & 0xfe00) == 0xfc00
                || seg[0] == 0xfe80 // 链路本地
        },
    }
}

fn system_name_servers() -> Vec<NameServerConfig> {
    // hickory_resolver 0.24：read_system_conf() 返回 (ResolverConfig, ResolverOpts)，
    // 直接从 ResolverConfig 取 name_servers 即可，无需构造 AsyncResolver。
    match system_conf::read_system_conf() {
        Ok((config, _opts)) => config.name_servers().to_vec(),
        Err(_) => Vec::new(),
    }
}

async fn geolocate(addr: &str) -> Option<(String, String)> {
    let url = format!("https://ipwho.is/{}", addr);
    let data: IpWhoIs = http::fetch_json(&url).await?;
    if data.success == Some(false) {
        return None;
    }
    let country = data.country.unwrap_or_default();
    let isp = data
        .connection
        .and_then(|c| c.isp.or(c.org))
        .unwrap_or_default();
    if country.is_empty() {
        None
    } else {
        Some((country, isp))
    }
}

pub async fn detect(network: &NetworkInfo) -> DnsInfo {
    let servers_cfg = system_name_servers();
    let mut servers: Vec<DnsServer> = Vec::new();

    for ns in servers_cfg.iter() {
        let ip = ns.socket_addr.ip();
        let addr_str = ip.to_string();
        if is_private(&ip) {
            // 本地路由器 / 系统转发器，无法地理定位。
            servers.push(DnsServer {
                address: addr_str,
                country: "本地".to_string(),
                isp: "本地路由器 / 网关".to_string(),
            });
            continue;
        }
        let geo = geolocate(&addr_str).await;
        match geo {
            Some((country, isp)) => servers.push(DnsServer {
                address: addr_str,
                country,
                isp: if isp.is_empty() { "—".to_string() } else { isp },
            }),
            None => servers.push(DnsServer {
                address: addr_str,
                country: "未知".to_string(),
                isp: "—".to_string(),
            }),
        }
    }

    let server_count = servers.len();
    let countries: Vec<String> = servers
        .iter()
        .map(|s| s.country.clone())
        .filter(|c| !c.is_empty() && c != "本地" && c != "未知")
        .collect::<Vec<_>>()
        .into_iter()
        .collect();
    let mut unique_countries: Vec<String> = Vec::new();
    for c in countries {
        if !unique_countries.contains(&c) {
            unique_countries.push(c);
        }
    }

    let country_mismatch = !unique_countries.is_empty()
        && !network.country_code.is_empty()
        && !unique_countries
            .iter()
            .any(|c| c.eq_ignore_ascii_case(&network.country));

    let (level, summary) = if server_count == 0 {
        (
            RiskLevel::Warn,
            "无法读取系统 DNS 配置，建议在网络稳定环境下复测。".to_string(),
        )
    } else if country_mismatch {
        (
            RiskLevel::Risk,
            "DNS 解析器与你的公网 IP 不在同一地区，可能意味着 VPN 未接管 DNS，\
             你的网络运营商仍可能知道你访问的网站。"
                .to_string(),
        )
    } else {
        (
            RiskLevel::Ok,
            "DNS 解析器与公网 IP 处于同一地区，未发现明显泄露。".to_string(),
        )
    };

    DnsInfo {
        servers,
        server_count,
        countries: unique_countries,
        country_mismatch,
        status: CheckStatus {
            level,
            summary,
            error: None,
        },
    }
}
