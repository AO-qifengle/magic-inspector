/**
 * 规则评分与解释引擎 —— 跨平台共享逻辑（未来 React Native 端可直接复用）。
 *
 * 评分采用固定规则，保证稳定、一致、可解释：
 *   基础分 100，按发现的问题逐项扣分，最低 0。
 */

import type { TFn, TranslationKey } from "../i18n";
import type {
  BackendReport,
  FullReport,
  NetworkInfo,
  RiskLevel,
  WebRtcInfo,
} from "../types/report";
import type { WebRtcRaw } from "./webrtc";

/** 根据 WebRTC 原始候选与公网 IP 判定是否泄露。 */
export function evaluateWebRtc(raw: WebRtcRaw, network: NetworkInfo, t: TFn): WebRtcInfo {
  const egress = new Set<string>();
  if (network.public_ip && network.public_ip !== "—") egress.add(network.public_ip);
  if (network.ipv6) egress.add(network.ipv6);

  const divergent = raw.public_candidates.find((ip) => !egress.has(ip));

  const leaked = Boolean(divergent);
  const level: RiskLevel = leaked ? "risk" : "ok";
  const summary = leaked ? t("explain.webrtc.leak") : t("explain.webrtc.ok");

  return {
    leaked,
    local_addresses: raw.local_addresses,
    public_address: divergent ?? null,
    status: { level, summary, error: null },
  };
}

function explainNetwork(network: NetworkInfo, t: TFn): string {
  switch (network.ip_type) {
    case "datacenter":
      return t("explain.network.datacenter");
    case "residential":
      return t("explain.network.residential");
    case "mobile":
      return t("explain.network.mobile");
    default:
      return t("explain.network.unknown");
  }
}

function explainDns(report: BackendReport, t: TFn): string {
  const { status, country_mismatch, server_count } = report.dns;
  if (status.error || server_count === 0) return t("explain.dns.unknown");
  return country_mismatch ? t("explain.dns.leak") : t("explain.dns.ok");
}

function explainIpv6(report: BackendReport, t: TFn): string {
  const { enabled, country_mismatch } = report.ipv6;
  if (!enabled) return t("explain.ipv6.ok.disabled");
  return country_mismatch ? t("explain.ipv6.leak") : t("explain.ipv6.ok.enabled");
}

function explainBlacklist(report: BackendReport, t: TFn): string {
  const level = report.blacklist.status.level;
  if (level === "ok") return t("explain.blacklist.ok");
  if (level === "warn") return t("explain.blacklist.warn");
  return t("explain.blacklist.risk");
}

function explainProxy(report: BackendReport, t: TFn): string {
  const p = report.proxy;
  if (p.is_tor) return t("explain.proxy.tor");
  if (p.is_vpn || p.is_proxy) return t("explain.proxy.vpn");
  if (p.is_hosting) return t("explain.proxy.hosting");
  return t("explain.proxy.ok");
}

/** 计算综合健康度评分与等级。 */
export function computeScore(report: BackendReport, webrtc: WebRtcInfo): {
  score: number;
  level: RiskLevel;
} {
  let score = 100;

  // DNS 泄露
  if (report.dns.country_mismatch || report.dns.status.level === "risk") score -= 15;
  else if (report.dns.status.level === "warn") score -= 6;

  // WebRTC 泄露
  if (webrtc.leaked) score -= 15;

  // IPv6 泄露
  if (report.ipv6.country_mismatch) score -= 10;

  // IP 类型：数据中心扣分
  if (report.network.ip_type === "datacenter") score -= 10;
  else if (report.network.ip_type === "unknown") score -= 4;

  // 代理 / VPN / TOR
  if (report.proxy.is_tor) score -= 30;
  else if (report.proxy.is_vpn || report.proxy.is_proxy) score -= 8;

  // 黑名单
  score -= Math.min(report.blacklist.hit_count * 8, 24);

  // AI 服务不可达
  const unreachableAi = report.ai_services.services.filter((s) => !s.reachable).length;
  score -= Math.min(unreachableAi * 3, 12);

  score = Math.max(0, Math.min(100, score));

  const level: RiskLevel = score >= 80 ? "ok" : score >= 55 ? "warn" : "risk";
  return { score, level };
}

function buildConclusion(score: number): {
  key: "conclusion.excellent" | "conclusion.good" | "conclusion.fair" | "conclusion.poor";
} {
  if (score >= 85) return { key: "conclusion.excellent" };
  if (score >= 70) return { key: "conclusion.good" };
  if (score >= 50) return { key: "conclusion.fair" };
  return { key: "conclusion.poor" };
}

function buildRecommendations(
  report: BackendReport,
  webrtc: WebRtcInfo,
): { key: TranslationKey; level: RiskLevel }[] {
  type Rec = { key: TranslationKey; level: RiskLevel };
  const recs: Rec[] = [];

  // 风险级（红）：需要立即处理
  if (report.proxy.is_tor) recs.push({ key: "rec.torExit", level: "risk" });
  if (report.blacklist.hit_count >= 3 || report.blacklist.status.level === "risk")
    recs.push({ key: "rec.blacklisted", level: "risk" });
  if (report.dns.country_mismatch || report.dns.status.level === "risk")
    recs.push({ key: "rec.fixDnsLeak", level: "risk" });
  if (report.ipv6.country_mismatch)
    recs.push({ key: "rec.disableIpv6", level: "risk" });
  if (webrtc.leaked) recs.push({ key: "rec.fixWebRTC", level: "risk" });

  // 警告级（黄）：影响体验但不紧急
  const unreachableAi = report.ai_services.services.filter(
    (s) => !s.reachable,
  ).length;
  if (unreachableAi >= 2)
    recs.push({ key: "rec.aiBlocked", level: "warn" });

  const captchaRisk =
    report.network.ip_type === "datacenter" ||
    report.proxy.is_vpn ||
    report.proxy.is_proxy;
  if (captchaRisk) recs.push({ key: "rec.aiCaptcha", level: "warn" });

  if (report.network.ip_type === "datacenter" && recs.length === 0)
    recs.push({ key: "rec.changeNode", level: "warn" });

  // 正常（绿）：无需处理
  if (recs.length === 0) recs.push({ key: "rec.noChange", level: "ok" });
  return recs;
}

/** 合并后端结果与 WebRTC，生成本地化的完整报告。 */
export function buildFullReport(
  backend: BackendReport,
  webrtcRaw: WebRtcRaw,
  t: TFn,
): FullReport {
  const webrtc = evaluateWebRtc(webrtcRaw, backend.network, t);
  const { score, level } = computeScore(backend, webrtc);
  const { key } = buildConclusion(score);
  const recKeys = buildRecommendations(backend, webrtc);

  // 用本地化解释覆盖各段 status.summary
  const dns = {
    ...backend.dns,
    status: { ...backend.dns.status, summary: explainDns(backend, t) },
  };
  const ipv6 = {
    ...backend.ipv6,
    status: { ...backend.ipv6.status, summary: explainIpv6(backend, t) },
  };
  const blacklist = {
    ...backend.blacklist,
    status: { ...backend.blacklist.status, summary: explainBlacklist(backend, t) },
  };
  const proxy = {
    ...backend.proxy,
    status: { ...backend.proxy.status, summary: explainProxy(backend, t) },
  };

  return {
    network: backend.network,
    dns,
    webrtc,
    ipv6,
    blacklist,
    proxy,
    ai_services: backend.ai_services,
    streaming: backend.streaming,
    score,
    score_level: level,
    conclusion: t(key),
    recommendations: recKeys.map((r) => ({ level: r.level, text: t(r.key) })),
  };
}

/** 网络段的本地化解释（detail 页使用）。 */
export function networkExplanation(network: NetworkInfo, t: TFn): string {
  return explainNetwork(network, t);
}
