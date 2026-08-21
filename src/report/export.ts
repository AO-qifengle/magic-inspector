import type { FullReport } from "../types/report";

export function reportText(report: FullReport, createdAt = new Date().toISOString()): string {
  const m = report.speed.metrics;
  const line = (label: string, value: string | number | null) => `${label}: ${value ?? "—"}`;
  return [
    "Magic Inspector 1.1.0",
    `Time: ${createdAt}`,
    line("Safety score", `${report.score}/100`),
    line("Quality score", `${report.speed.assessment.score}/100`),
    line("Public IP", report.network.public_ip),
    line("Latency", m.latency_ms == null ? null : `${m.latency_ms.toFixed(1)} ms`),
    line("Jitter", m.jitter_ms == null ? null : `${m.jitter_ms.toFixed(1)} ms`),
    line("Download", m.download_mbps == null ? null : `${m.download_mbps.toFixed(1)} Mbps`),
    line("Upload", m.upload_mbps == null ? null : `${m.upload_mbps.toFixed(1)} Mbps`),
    "",
    "Recommendations:",
    ...report.recommendations.map((r) => `- ${r.text}`),
    "",
    "Speed provider: Cloudflare edge network. No result upload is performed by Magic Inspector.",
  ].join("\n");
}

export async function copyReport(report: FullReport, createdAt?: string): Promise<void> {
  await navigator.clipboard.writeText(reportText(report, createdAt));
}

export function downloadReport(report: FullReport, createdAt = new Date().toISOString()): void {
  const stamp = createdAt.replace(/[:.]/g, "-");
  const blob = new Blob([JSON.stringify({ exportedAt: createdAt, appVersion: "1.1.0", report }, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `magic-inspector-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(href);
}
