//! 网络检测核心数据模型。
//!
//! 所有结构体均可序列化为 JSON 供前端消费，并与 `src/types` 中的 TypeScript 类型保持一致。

use serde::{Deserialize, Serialize};

pub mod ai_services;
pub mod blacklist;
pub mod dns;
pub mod http;
pub mod ip;
pub mod ipv6;
pub mod proxy;
pub mod streaming;

/// IP 归属类型，用于判断是家宽还是数据中心。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum IpType {
    /// 家庭宽带
    Residential,
    /// 数据中心 / 托管
    Datacenter,
    /// 移动网络
    Mobile,
    /// 未知
    Unknown,
}

/// 风险等级，三档制：正常 / 警告 / 风险。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RiskLevel {
    /// 正常 / 通过
    Ok,
    /// 警告 / 低风险
    Warn,
    /// 风险 / 不通过
    Risk,
}

/// 单项检测的通用状态结果。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckStatus {
    pub level: RiskLevel,
    /// 面向普通用户的简短说明（"这意味着什么"）。
    pub summary: String,
    /// 是否在采集过程中发生错误（此时结果为部分可用）。
    pub error: Option<String>,
}

/// 网络基础信息（IP / 地理位置 / ASN / ISP / IP 类型）。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub public_ip: String,
    pub country: String,
    pub country_code: String,
    pub city: String,
    pub asn: String,
    pub isp: String,
    pub organization: String,
    pub ip_type: IpType,
    pub timezone: String,
    pub ipv4: Option<String>,
    pub ipv6: Option<String>,
}

/// DNS 检测结果。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DnsInfo {
    pub servers: Vec<DnsServer>,
    pub server_count: usize,
    pub countries: Vec<String>,
    /// DNS 解析器所在国家与公网 IP 所在国家是否一致。
    pub country_mismatch: bool,
    pub status: CheckStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DnsServer {
    pub address: String,
    pub country: String,
    pub isp: String,
}

/// IPv6 检测结果。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ipv6Info {
    pub enabled: bool,
    pub public_ipv6: Option<String>,
    /// IPv6 与 IPv4 归属国家是否一致（不一致意味着 VPN 可能未覆盖 IPv6，存在泄露）。
    pub country_mismatch: bool,
    pub status: CheckStatus,
}

/// 黑名单（DNSBL）检测结果。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlacklistInfo {
    pub lists: Vec<BlacklistEntry>,
    pub reputation_score: u32,
    pub hit_count: u32,
    pub status: CheckStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlacklistEntry {
    pub name: String,
    pub listed: bool,
}

/// 代理 / VPN / 托管检测（基于 ASN/ISP 关键字与连通性启发式判断）。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyInfo {
    pub is_hosting: bool,
    pub is_proxy: bool,
    pub is_vpn: bool,
    pub is_tor: bool,
    pub is_residential: bool,
    pub is_mobile: bool,
    pub is_cloud: bool,
    pub status: CheckStatus,
}

/// AI 服务兼容性单项。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiServiceResult {
    pub name: String,
    pub reachable: bool,
    pub latency_ms: Option<u32>,
    pub level: RiskLevel,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiServicesInfo {
    pub services: Vec<AiServiceResult>,
}

/// 流媒体可访问性单项。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingResult {
    pub name: String,
    pub accessible: bool,
    pub latency_ms: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingInfo {
    pub services: Vec<StreamingResult>,
}

/// 后端采集到的全部检测结果（不含 WebRTC，WebRTC 由前端采集后合并）。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackendReport {
    pub network: NetworkInfo,
    pub dns: DnsInfo,
    pub ipv6: Ipv6Info,
    pub blacklist: BlacklistInfo,
    pub proxy: ProxyInfo,
    pub ai_services: AiServicesInfo,
    pub streaming: StreamingInfo,
}

/// 单个检测阶段的进度事件载荷。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressPayload {
    /// 阶段标识，与前端 STAGES 一致。
    pub stage: String,
    /// running / done / error
    pub status: String,
    /// 阶段显示名（i18n 由前端负责，这里仅做调试用）。
    pub label: String,
}
