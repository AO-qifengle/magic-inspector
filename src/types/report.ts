/**
 * 共享类型定义 —— 与 `src-tauri/src/detection/mod.rs` 中的 Rust 结构体保持一致。
 *
 * 这些类型刻意与平台无关，未来 React Native 端可直接复用。
 */

export type IpType = "residential" | "datacenter" | "mobile" | "unknown";

/** 三档风险等级。 */
export type RiskLevel = "ok" | "warn" | "risk";

/** 单项检测状态。 */
export interface CheckStatus {
  level: RiskLevel;
  /** 面向普通用户的"这意味着什么"解释。 */
  summary: string;
  error: string | null;
}

export interface NetworkInfo {
  public_ip: string;
  country: string;
  country_code: string;
  city: string;
  asn: string;
  isp: string;
  organization: string;
  ip_type: IpType;
  timezone: string;
  ipv4: string | null;
  ipv6: string | null;
}

export interface DnsServer {
  address: string;
  country: string;
  isp: string;
}

export interface DnsInfo {
  servers: DnsServer[];
  server_count: number;
  countries: string[];
  country_mismatch: boolean;
  status: CheckStatus;
}

export interface Ipv6Info {
  enabled: boolean;
  public_ipv6: string | null;
  country_mismatch: boolean;
  status: CheckStatus;
}

export interface BlacklistEntry {
  name: string;
  listed: boolean;
}

export interface BlacklistInfo {
  lists: BlacklistEntry[];
  reputation_score: number;
  hit_count: number;
  status: CheckStatus;
}

export interface ProxyInfo {
  is_hosting: boolean;
  is_proxy: boolean;
  is_vpn: boolean;
  is_tor: boolean;
  is_residential: boolean;
  is_mobile: boolean;
  is_cloud: boolean;
  status: CheckStatus;
}

export interface AiServiceResult {
  name: string;
  reachable: boolean;
  latency_ms: number | null;
  level: RiskLevel;
  summary: string;
}

export interface AiServicesInfo {
  services: AiServiceResult[];
}

export interface StreamingResult {
  name: string;
  accessible: boolean;
  latency_ms: number | null;
}

export interface StreamingInfo {
  services: StreamingResult[];
}

/** WebRTC 检测结果（前端采集，非后端）。 */
export interface WebRtcInfo {
  leaked: boolean;
  local_addresses: string[];
  public_address: string | null;
  status: CheckStatus;
}

/** 后端采集结果（不含 WebRTC）。 */
export interface BackendReport {
  network: NetworkInfo;
  dns: DnsInfo;
  ipv6: Ipv6Info;
  blacklist: BlacklistInfo;
  proxy: ProxyInfo;
  ai_services: AiServicesInfo;
  streaming: StreamingInfo;
}

/** 单条建议：带严重程度，用于 UI 着色。 */
export interface Recommendation {
  level: RiskLevel;
  text: string;
}

/** 合并 WebRTC 后的完整报告。 */
export interface FullReport {
  network: NetworkInfo;
  dns: DnsInfo;
  webrtc: WebRtcInfo;
  ipv6: Ipv6Info;
  blacklist: BlacklistInfo;
  proxy: ProxyInfo;
  ai_services: AiServicesInfo;
  streaming: StreamingInfo;
  /** 综合健康度评分（0–100），由前端规则计算。 */
  score: number;
  score_level: RiskLevel;
  /** 面向用户的总体结论。 */
  conclusion: string;
  /** 建议（带严重程度，用于 UI 着色）。 */
  recommendations: Recommendation[];
}

/** 检测阶段标识（与后端 ProgressPayload.stage 对应，外加前端 webrtc）。 */
export type StageId =
  | "ip"
  | "dns"
  | "webrtc"
  | "ipv6"
  | "blacklist"
  | "proxy"
  | "ai"
  | "streaming";

export interface StageState {
  id: StageId;
  status: "pending" | "running" | "done" | "error";
}
