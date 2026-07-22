//! IP / 地理位置 / ASN / ISP 检测。
//!
//! 数据源（均为免费、无需密钥的公开服务）：
//! - 主：https://ipwho.is （HTTPS，返回地理 + ASN + ISP）
//! - 备：http://ip-api.com/json （返回地理 + ASN + ISP + hosting/proxy/mobile 信号）
//!
//! IP 类型（家宽 / 数据中心 / 移动）采用关键字启发式判断，避免依赖付费 API。

use super::http;
use super::{CheckStatus, IpType, NetworkInfo};
use serde::Deserialize;

#[derive(Deserialize)]
struct IpWhoIs {
    ip: Option<String>,
    success: Option<bool>,
    country: Option<String>,
    country_code: Option<String>,
    city: Option<String>,
    connection: Option<IpWhoIsConn>,
    timezone: Option<IpWhoIsTz>,
}

#[derive(Deserialize)]
struct IpWhoIsConn {
    asn: Option<serde_json::Value>,
    org: Option<String>,
    isp: Option<String>,
}

#[derive(Deserialize)]
struct IpWhoIsTz {
    id: Option<String>,
}

#[derive(Deserialize)]
struct IpApiResponse {
    status: Option<String>,
    query: Option<String>,
    country: Option<String>,
    countryCode: Option<String>,
    city: Option<String>,
    isp: Option<String>,
    org: Option<String>,
    #[serde(rename = "as")]
    as_field: Option<String>,
    mobile: Option<bool>,
    proxy: Option<bool>,
    hosting: Option<bool>,
    timezone: Option<String>,
}

/// 判断 IP 归属类型（家宽 / 数据中心 / 移动）。
/// org/isp 为关键词启发式，signals 为 ip-api.com 的 hosting/proxy/mobile 原始信号。
pub fn classify_ip_type(org: &str, isp: &str) -> IpType {
    let blob = format!("{} {}", org, isp).to_lowercase();
    let mobile_kw = [
        "mobile", "wireless", "cellular", "t-mobile", "verizon wireless",
        "at&t mobility", "china mobile", "chinamobile", "telecom mobile",
        "orange mobile", "vodafone mobile",
    ];
    let dc_kw = [
        "hosting", "data center", "datacenter", "cloud", "ovh", "digitalocean",
        "amazon", "aws", "google cloud", "google llc", "microsoft", "azure",
        "linode", "vultr", "hetzner", "contabo", "leaseweb", "m247", "choopa",
        "cloudflare", "alibaba", "tencent", "huawei cloud", "oracle", "ibm cloud",
        "scaleway", "upcloud", "kamatera", "server", "colo", "colocation",
        "datacamp", "akamai", "fastly", "m247 ltd", "greenhost", "nexus bytes",
        "eons data", "communications limited",
    ];
    if mobile_kw.iter().any(|k| blob.contains(k)) {
        return IpType::Mobile;
    }
    if dc_kw.iter().any(|k| blob.contains(k)) {
        return IpType::Datacenter;
    }
    IpType::Residential
}

/// 综合 ip-api.com 的 proxy/hosting/mobile 信号修正 IP 类型。
pub fn refine_ip_type(base: IpType, hosting: bool, proxy: bool, mobile: bool) -> IpType {
    if mobile {
        return IpType::Mobile;
    }
    if hosting || proxy {
        return IpType::Datacenter;
    }
    base
}

fn none_if_empty(s: String) -> String {
    if s.trim().is_empty() {
        "—".to_string()
    } else {
        s
    }
}

async fn from_ipwho() -> Option<NetworkInfo> {
    let data: IpWhoIs = http::fetch_json("https://ipwho.is").await?;
    let ip = data.ip?;
    let conn = data.connection.unwrap_or(IpWhoIsConn {
        asn: None,
        org: None,
        isp: None,
    });
    let org = conn.org.unwrap_or_default();
    let isp = conn.isp.unwrap_or_default();
    let asn = conn
        .asn
        .and_then(|v| {
            if v.is_string() {
                v.as_str().map(|s| s.to_string())
            } else {
                Some(v.to_string())
            }
        })
        .unwrap_or_default();
    Some(NetworkInfo {
        public_ip: none_if_empty(ip),
        country: none_if_empty(data.country.unwrap_or_default()),
        country_code: data.country_code.unwrap_or_default(),
        city: none_if_empty(data.city.unwrap_or_default()),
        asn: if asn.is_empty() { "—".to_string() } else { asn },
        isp: none_if_empty(isp.clone()),
        organization: none_if_empty(org.clone()),
        ip_type: classify_ip_type(&org, &isp),
        timezone: none_if_empty(
            data.timezone.and_then(|t| t.id).unwrap_or_default(),
        ),
        ipv4: None,
        ipv6: None,
    })
}

async fn from_ipapi() -> Option<NetworkInfo> {
    let data: IpApiResponse =
        http::fetch_json("http://ip-api.com/json/?fields=status,query,country,countryCode,city,isp,org,as,mobile,proxy,hosting,timezone")
            .await?;
    if data.status.as_deref() != Some("success") {
        return None;
    }
    let isp = data.isp.unwrap_or_default();
    let org = data.org.unwrap_or_default();
    Some(NetworkInfo {
        public_ip: none_if_empty(data.query.unwrap_or_default()),
        country: none_if_empty(data.country.unwrap_or_default()),
        country_code: data.countryCode.unwrap_or_default(),
        city: none_if_empty(data.city.unwrap_or_default()),
        asn: none_if_empty(data.as_field.unwrap_or_default()),
        isp: none_if_empty(isp.clone()),
        organization: none_if_empty(org.clone()),
        ip_type: classify_ip_type(&org, &isp),
        timezone: none_if_empty(data.timezone.unwrap_or_default()),
        ipv4: None,
        ipv6: None,
    })
}

/// 也返回 ip-api.com 的原始托管/代理/移动信号，供 proxy 模块复用。
pub async fn fetch_raw_signals() -> Option<(bool, bool, bool)> {
    let data: IpApiResponse =
        http::fetch_json("http://ip-api.com/json/?fields=status,mobile,proxy,hosting")
            .await?;
    if data.status.as_deref() != Some("success") {
        return None;
    }
    Some((
        data.hosting.unwrap_or(false),
        data.proxy.unwrap_or(false),
        data.mobile.unwrap_or(false),
    ))
}

pub async fn detect() -> NetworkInfo {
    // 优先 HTTPS 源；失败再退到 HTTP 源。
    let mut info = if let Some(i) = from_ipwho().await {
        i
    } else if let Some(i) = from_ipapi().await {
        return i;
    } else {
        return fallback_unknown();
    };

    // 用 ip-api.com 的 hosting/proxy/mobile 信号修正 IP 类型
    if let Some((hosting, proxy, mobile)) = fetch_raw_signals().await {
        info.ip_type = refine_ip_type(info.ip_type, hosting, proxy, mobile);
    }

    info
}

fn fallback_unknown() -> NetworkInfo {
    NetworkInfo {
        public_ip: "—".to_string(),
        country: "—".to_string(),
        country_code: String::new(),
        city: "—".to_string(),
        asn: "—".to_string(),
        isp: "—".to_string(),
        organization: "—".to_string(),
        ip_type: IpType::Unknown,
        timezone: "—".to_string(),
        ipv4: None,
        ipv6: None,
    }
}

/// 给 IP 信息补充 IPv4 / IPv6 公网地址（由 ipv6 模块调用）。
pub fn with_addresses(mut info: NetworkInfo, v4: Option<String>, v6: Option<String>) -> NetworkInfo {
    if v4.is_some() {
        info.ipv4 = v4;
    }
    if info.ipv4.is_none() {
        info.ipv4 = Some(info.public_ip.clone());
    }
    info.ipv6 = v6;
    info
}

#[allow(dead_code)]
pub fn ok_status() -> CheckStatus {
    CheckStatus {
        level: super::RiskLevel::Ok,
        summary: String::new(),
        error: None,
    }
}
