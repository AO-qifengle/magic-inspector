//! Tauri 命令：编排整次检测，并通过事件向前端推送逐项进度。

use crate::detection::{
    self, ai_services, blacklist, dns, ipv6, ip, proxy, streaming, BackendReport,
    ProgressPayload,
};
use tauri::{AppHandle, Emitter};

const EVENT: &str = "detection-progress";

fn emit(app: &AppHandle, stage: &str, status: &str, label: &str) {
    let _ = app.emit(
        EVENT,
        ProgressPayload {
            stage: stage.to_string(),
            status: status.to_string(),
            label: label.to_string(),
        },
    );
}

#[tauri::command]
pub async fn run_detection(app: AppHandle) -> Result<BackendReport, String> {
    // 1. IP / 网络基础信息（后续检测依赖）
    emit(&app, "ip", "running", "IP");
    let mut network = ip::detect().await;
    emit(&app, "ip", "done", "IP");

    // 2. 并发执行其余后端检测
    emit(&app, "ipv6", "running", "IPv6");
    emit(&app, "dns", "running", "DNS");
    emit(&app, "blacklist", "running", "Blacklist");
    emit(&app, "proxy", "running", "Proxy");
    emit(&app, "ai", "running", "AI");
    emit(&app, "streaming", "running", "Streaming");

    let is_hosting = network.ip_type == detection::IpType::Datacenter;

    let (dns_info, ipv6_pair, blacklist_info, proxy_info, ai_info, stream_info) = tokio::join!(
        dns::detect(&network),
        ipv6::detect(&network),
        blacklist::detect(&network.public_ip),
        proxy::detect(&network),
        ai_services::detect(is_hosting),
        streaming::detect(),
    );

    let (ipv6_info, v6_addr) = ipv6_pair;
    // 把探测到的 IPv6 / IPv4 公网地址回填到 network
    network = ip::with_addresses(network, None, v6_addr);

    emit(&app, "ipv6", "done", "IPv6");
    emit(&app, "dns", "done", "DNS");
    emit(&app, "blacklist", "done", "Blacklist");
    emit(&app, "proxy", "done", "Proxy");
    emit(&app, "ai", "done", "AI");
    emit(&app, "streaming", "done", "Streaming");

    Ok(BackendReport {
        network,
        dns: dns_info,
        ipv6: ipv6_info,
        blacklist: blacklist_info,
        proxy: proxy_info,
        ai_services: ai_info,
        streaming: stream_info,
    })
}
