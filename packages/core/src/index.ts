export type RiskLevel = "ok" | "warn" | "risk";
export type WebRtcOutcome = "leak" | "clear" | "inconclusive" | "unsupported";

export interface WebRtcRaw { local_addresses: string[]; public_candidates: string[]; gathering_complete: boolean; supported: boolean; }
export interface NetworkLike { public_ip: string; ipv6?: string | null; }
export interface WebRtcAssessment { outcome: WebRtcOutcome; leaked: boolean; public_address: string | null; level: RiskLevel; }

function normalizeIp(ip: string): string {
  const value = ip.trim().replace(/^\[|\]$/g, "").toLowerCase().split("%")[0];
  if (!value.includes(":")) return value;
  const [head, tail = ""] = value.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  if (value.includes("::")) return [...left, ...Array(8 - left.length - right.length).fill("0"), ...right].map((part) => part.padStart(4, "0")).join(":");
  return value.split(":").map((part) => part.padStart(4, "0")).join(":");
}

export function evaluateWebRtc(raw: WebRtcRaw, network: NetworkLike): WebRtcAssessment {
  const egress = new Set([network.public_ip, network.ipv6 ?? ""].filter(Boolean).map(normalizeIp));
  const divergent = raw.public_candidates.find((ip) => !egress.has(normalizeIp(ip))) ?? null;
  const outcome: WebRtcOutcome = !raw.supported ? "unsupported" : divergent ? "leak" : raw.gathering_complete && raw.public_candidates.length ? "clear" : "inconclusive";
  return { outcome, leaked: outcome === "leak", public_address: divergent, level: outcome === "leak" ? "risk" : outcome === "clear" ? "ok" : "warn" };
}

export interface QualityInput { latency_ms?: number | null; jitter_ms?: number | null; download_mbps?: number | null; upload_mbps?: number | null; download_loaded_latency_ms?: number | null; upload_loaded_latency_ms?: number | null; }
export interface QualityAssessment { score: number; level: RiskLevel; use_cases: Array<{ id: "browsing" | "streaming4k" | "video_call" | "gaming"; score: number; level: RiskLevel }>; }

function level(score: number): RiskLevel { return score >= 80 ? "ok" : score >= 55 ? "warn" : "risk"; }
function score(values: Array<[number, number]>): number { return Math.round(values.reduce((sum, [value, target]) => sum + Math.min(1, target / Math.max(value, 0.1)) * 100, 0) / values.length); }

export function scoreQuality(input: QualityInput): QualityAssessment {
  const latency = input.latency_ms ?? 999, jitter = input.jitter_ms ?? 999, down = input.download_mbps ?? 0, up = input.upload_mbps ?? 0;
  const cases = [
    ["browsing", score([[down ? 10 / down : 999, 1], [latency, 150]])],
    ["streaming4k", score([[down ? 25 / down : 999, 1], [input.download_loaded_latency_ms ?? 999, 200]])],
    ["video_call", score([[down ? 10 / down : 999, 1], [up ? 5 / up : 999, 1], [jitter, 30], [input.upload_loaded_latency_ms ?? 999, 200]])],
    ["gaming", score([[latency, 60], [jitter, 15], [input.download_loaded_latency_ms ?? 999, 120]])],
  ] as const;
  const use_cases = cases.map(([id, value]) => ({ id, score: Math.max(0, Math.min(100, value)), level: level(value) }));
  const total = Math.round(use_cases.reduce((sum, item) => sum + item.score, 0) / use_cases.length);
  return { score: total, level: level(total), use_cases };
}
