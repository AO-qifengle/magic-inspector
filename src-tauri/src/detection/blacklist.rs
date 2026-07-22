//! 黑名单（DNSBL）检测：通过 DNS 反向查询公开黑名单服务，判断当前公网 IP 是否被列入。
//!
//! 例如查询 `8.8.8.8` 时，会向 `8.8.8.8.zen.spamhaus.org` 发起 A 记录查询；
//! 返回 127.0.0.x 表示已被列入。

use super::{BlacklistEntry, BlacklistInfo, CheckStatus, RiskLevel};
use hickory_resolver::config::ResolverConfig;
use hickory_resolver::TokioAsyncResolver;
use std::net::IpAddr;
use std::time::Duration;

const DNSBL_LISTS: &[&str] = &[
    "zen.spamhaus.org",
    "bl.spamcop.net",
    "dnsbl.sorbs.net",
    "b.barracudacentral.org",
    "dnsbl-1.uceprotect.net",
];

fn reverse_ip(ip: &IpAddr) -> Option<String> {
    match ip {
        IpAddr::V4(v4) => {
            let o = v4.octets();
            Some(format!("{}.{}.{}.{}", o[3], o[2], o[1], o[0]))
        }
        IpAddr::V6(_) => None, // 多数 DNSBL 不支持 IPv6，跳过
    }
}

async fn is_listed(resolver: &TokioAsyncResolver, query: &str) -> bool {
    match resolver.ipv4_lookup(query).await {
        Ok(lookup) => {
            // 命中：返回 127.0.0.x（排除 127.0.255.255 这类查询失败/超限标记）
            lookup.iter().any(|ip| {
                let o = ip.octets();
                o[0] == 127 && o[1] == 0 && !(o[2] == 255 && o[3] == 255)
            })
        }
        Err(_) => false,
    }
}

pub async fn detect(public_ip: &str) -> BlacklistInfo {
    let ip: Option<IpAddr> = public_ip.parse().ok();
    // 使用 Google 公共 DNS 并设置短超时，避免系统 DNS 慢导致卡住
    let mut opts = hickory_resolver::config::ResolverOpts::default();
    opts.timeout = Duration::from_secs(2);
    opts.attempts = 1;
    let resolver = TokioAsyncResolver::tokio(ResolverConfig::google(), opts);

    let rev = match ip.and_then(|i| reverse_ip(&i)) {
        Some(r) => r,
        None => {
            return BlacklistInfo {
                lists: Vec::new(),
                reputation_score: 100,
                hit_count: 0,
                status: CheckStatus {
                    level: RiskLevel::Ok,
                    summary: "当前为 IPv6 地址，多数公开黑名单不支持查询，已跳过。"
                        .to_string(),
                    error: None,
                },
            };
        }
    };

    let mut entries = Vec::new();
    let mut hit_count = 0u32;
    for dnsbl in DNSBL_LISTS {
        let query = format!("{}.{}", rev, dnsbl);
        let listed = is_listed(&resolver, &query).await;
        if listed {
            hit_count += 1;
        }
        entries.push(BlacklistEntry {
            name: dnsbl.to_string(),
            listed,
        });
    }

    // 信誉分：每命中一个列表扣 20 分，最低 0。
    let reputation_score = (100u32).saturating_sub(hit_count * 20);

    let (level, summary) = if hit_count == 0 {
        (
            RiskLevel::Ok,
            "当前 IP 未出现在主流公开黑名单中，信誉良好。".to_string(),
        )
    } else if hit_count <= 2 {
        (
            RiskLevel::Warn,
            "当前 IP 出现在部分公开黑名单中，部分服务可能对其加强验证。".to_string(),
        )
    } else {
        (
            RiskLevel::Risk,
            "当前 IP 被多个公开黑名单收录，邮件与部分网站可能直接拒绝访问。".to_string(),
        )
    };

    BlacklistInfo {
        lists: entries,
        reputation_score,
        hit_count,
        status: CheckStatus { level, summary, error: None },
    }
}
