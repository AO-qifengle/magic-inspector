//! 代理 / VPN / 托管 / TOR 检测。
//!
//! 综合三方信号（ip-api.com 的 hosting/proxy/mobile）与 ASN/ISP 关键字启发式，
//! 以及 TOR 出口节点 DNSBL 查询，给出面向用户的解释。

use super::ip::{classify_ip_type, fetch_raw_signals};
use super::{CheckStatus, NetworkInfo, ProxyInfo, RiskLevel};
use hickory_resolver::config::{ResolverConfig, ResolverOpts};
use hickory_resolver::TokioAsyncResolver;
use std::net::IpAddr;
use std::time::Duration;

const VPN_KEYWORDS: &[&str] = &[
    "vpn", "nordvpn", "expressvpn", "private internet access", "mullvad",
    "protonvpn", "proton ag", "cyberghost", "surfshark", "ipvanish",
    "tunnelbear", "privatevpn", "windscribe", "astrill", "vyprvpn",
    "purevpn", "hidemyass", "hotspot shield", "strongvpn",
];

const CLOUD_KEYWORDS: &[&str] = &[
    "amazon", "aws", "azure", "microsoft", "google cloud", "google llc",
    "alibaba", "tencent", "huawei cloud", "oracle", "ibm cloud",
    "digitalocean", "vultr", "linode", "hetzner", "ovh", "scaleway",
    "contabo", "leaseweb", "cloudflare",
];

fn matches_any(blob: &str, keywords: &[&str]) -> bool {
    let b = blob.to_lowercase();
    keywords.iter().any(|k| b.contains(k))
}

async fn is_tor_exit(ip: &IpAddr) -> bool {
    let rev = match ip {
        IpAddr::V4(v4) => {
            let o = v4.octets();
            format!("{}.{}.{}.{}", o[3], o[2], o[1], o[0])
        }
        IpAddr::V6(_) => return false,
    };
    // 使用 Google 公共 DNS + 短超时，避免系统 DNS 慢导致卡住
    let mut opts = ResolverOpts::default();
    opts.timeout = Duration::from_secs(2);
    opts.attempts = 1;
    let resolver = TokioAsyncResolver::tokio(ResolverConfig::google(), opts);
    let query = format!("{}.torexit.dan.me.uk", rev);
    resolver
        .ipv4_lookup(&query)
        .await
        .map(|l| l.iter().next().is_some())
        .unwrap_or(false)
}

pub async fn detect(network: &NetworkInfo) -> ProxyInfo {
    let org_blob = format!("{} {}", network.organization, network.isp);
    let ip: Option<IpAddr> = network.public_ip.parse().ok();

    // 三方原始信号（best effort）
    let (raw_hosting, raw_proxy, raw_mobile) =
        fetch_raw_signals().await.unwrap_or((false, false, false));

    let is_cloud = matches_any(&org_blob, CLOUD_KEYWORDS);
    let is_vpn_kw = matches_any(&org_blob, VPN_KEYWORDS);
    let is_tor = match ip {
        Some(i) => is_tor_exit(&i).await,
        None => false,
    };

    let ip_type = classify_ip_type(&network.organization, &network.isp);
    let is_hosting =
        raw_hosting || is_cloud || ip_type == super::IpType::Datacenter;
    let is_mobile = raw_mobile || ip_type == super::IpType::Mobile;
    let is_residential = !is_hosting && !is_mobile && ip_type == super::IpType::Residential;
    let is_proxy = raw_proxy;
    let is_vpn = is_vpn_kw || (is_hosting && raw_proxy) || (is_hosting && is_vpn_kw);

    let (level, summary) = if is_tor {
        (
            RiskLevel::Risk,
            "当前 IP 是 TOR 出口节点，多数服务会显著限制或拒绝访问。".to_string(),
        )
    } else if is_proxy || is_vpn {
        (
            RiskLevel::Warn,
            "当前 IP 表现出代理 / VPN 特征（数据中心或代理标记）。\
             ChatGPT、Claude 等服务可能要求额外验证。"
                .to_string(),
        )
    } else if is_hosting {
        (
            RiskLevel::Warn,
            "当前 IP 属于数据中心 / 云服务器，部分网站可能增加验证码或限制访问。"
                .to_string(),
        )
    } else if is_mobile {
        (
            RiskLevel::Ok,
            "当前 IP 属于移动网络，伪装度尚可，多数服务可正常使用。".to_string(),
        )
    } else if is_residential {
        (
            RiskLevel::Ok,
            "当前 IP 属于家庭宽带，伪装度较高，多数网站不会额外限制。".to_string(),
        )
    } else {
        (
            RiskLevel::Ok,
            "未发现明显的代理 / VPN 特征。".to_string(),
        )
    };

    ProxyInfo {
        is_hosting,
        is_proxy,
        is_vpn,
        is_tor,
        is_residential,
        is_mobile,
        is_cloud,
        status: CheckStatus { level, summary, error: None },
    }
}
