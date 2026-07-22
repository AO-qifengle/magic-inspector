//! IPv6 检测：通过 IPv6-only 端点探测是否具备 IPv6 公网连通性，
//! 并对比 IPv6 与 IPv4 归属国以判断是否存在 IPv6 绕过 VPN 的泄露风险。

use super::http;
use super::{CheckStatus, Ipv6Info, NetworkInfo, RiskLevel};
use serde::Deserialize;

#[derive(Deserialize)]
struct IpWhoIs {
    success: Option<bool>,
    country: Option<String>,
}

/// 探测公网 IPv6 地址（仅通过 IPv6 端点）。
async fn public_ipv6() -> Option<String> {
    // api6.ipify.org 仅在 IPv6 可达时返回内容。
    http::fetch_text("https://api6.ipify.org").await
}

async fn geolocate_country(ip: &str) -> Option<String> {
    let url = format!("https://ipwho.is/{}", ip);
    let data: IpWhoIs = http::fetch_json(&url).await?;
    if data.success == Some(false) {
        return None;
    }
    data.country
}

pub async fn detect(network: &NetworkInfo) -> (Ipv6Info, Option<String>) {
    let v6 = public_ipv6().await;
    let enabled = v6.is_some();

    let country_mismatch = match &v6 {
        Some(ip) => {
            let v6_country = geolocate_country(ip).await;
            match v6_country {
                Some(c) => {
                    !network.country.is_empty()
                        && !c.eq_ignore_ascii_case(&network.country)
                }
                None => false,
            }
        }
        None => false,
    };

    let (level, summary) = if !enabled {
        (
            RiskLevel::Ok,
            "当前网络未启用 IPv6，不存在 IPv6 绕过 VPN 的泄露风险。".to_string(),
        )
    } else if country_mismatch {
        (
            RiskLevel::Risk,
            "检测到 IPv6 公网地址，且其归属地区与 IPv4 不一致。\
             你的 VPN 可能未覆盖 IPv6 流量，存在 IPv6 泄露。"
                .to_string(),
        )
    } else {
        (
            RiskLevel::Ok,
            "已启用 IPv6，且与 IPv4 归属一致，未发现泄露。".to_string(),
        )
    };

    let info = Ipv6Info {
        enabled,
        public_ipv6: v6.clone(),
        country_mismatch,
        status: CheckStatus {
            level,
            summary,
            error: None,
        },
    };
    (info, v6)
}
