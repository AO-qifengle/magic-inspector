import { ScoreRing } from "../components/ScoreRing";
import { StatusBadge } from "../components/StatusBadge";
import { useT, type TranslationKey } from "../i18n";
import type { FullReport, RiskLevel, StageId } from "../types/report";
import { copyReport, downloadReport } from "../report/export";

interface Props {
  report: FullReport;
  onViewDetail: () => void;
  onRetest: () => void;
}

interface Row {
  id: StageId;
  level: RiskLevel;
  label: TranslationKey;
}

/** 健康报告：评分环 + 总体结论 + 各项结果 + 建议。 */
export function ReportPage({ report, onViewDetail, onRetest }: Props) {
  const t = useT();

  const rows: Row[] = [
    {
      id: "ip",
      level: report.network.ip_type === "datacenter" ? "warn" : "ok",
      label:
        report.network.ip_type === "datacenter" ? "status.lowRisk" : "status.normal",
    },
    {
      id: "dns",
      level: report.dns.status.level,
      label: levelLabel(report.dns.status.level),
    },
    {
      id: "webrtc",
      level: report.webrtc.status.level,
      label: webRtcLabel(report.webrtc.outcome),
    },
    {
      id: "ipv6",
      level: report.ipv6.status.level,
      label: levelLabel(report.ipv6.status.level),
    },
    {
      id: "blacklist",
      level:
        report.blacklist.hit_count === 0
          ? "ok"
          : report.blacklist.hit_count >= 3
            ? "risk"
            : "warn",
      label:
        report.blacklist.hit_count === 0
          ? "status.pass"
          : report.blacklist.hit_count >= 3
            ? "status.risk"
            : "status.lowRisk",
    },
    {
      id: "proxy",
      level: report.proxy.status.level,
      label: proxyLabel(report),
    },
    {
      id: "ai",
      level: aiAggregateLevel(report),
      label: aiAggregateLabel(report),
    },
    {
      id: "streaming",
      level: streamingAggregateLevel(report),
      label: streamingAggregateLabel(report),
    },
  ];

  return (
    <div className="page">
      <div className="report-hero fade-in">
        <ScoreRing score={report.score} level={report.score_level} />
        <p className="report-conclusion fade-up" style={{ animationDelay: "120ms" }}>
          {report.conclusion}
        </p>
      </div>

      <div className="report-section-title fade-in" style={{ animationDelay: "160ms" }}>
        {t("report.sections")}
      </div>
      <div className="list-group fade-up" style={{ animationDelay: "180ms" }}>
        {rows.map((row) => (
          <button
            key={row.id}
            className="list-row list-row-clickable"
            onClick={onViewDetail}
            type="button"
          >
            <span className="list-row-label">{t(stageKey(row.id))}</span>
            <StatusBadge level={row.level} label={t(row.label)} />
          </button>
        ))}
      </div>

      <div className="report-section-title fade-in" style={{ animationDelay: "240ms" }}>
        {t("report.recommendation")}
      </div>
      <div className="report-recommendation fade-up" style={{ animationDelay: "260ms" }}>
        {report.recommendations.map((r, i) => (
          <div key={i} className="rec-item">
            <span className={`rec-dot rec-dot-${r.level}`} />
            <span className="rec-text">{r.text}</span>
          </div>
        ))}
      </div>

      <div className="report-section-title fade-in" style={{ animationDelay: "280ms" }}>
        {t("section.speed")}
      </div>
      <SpeedSummary report={report} />

      <div className="report-actions fade-up" style={{ animationDelay: "320ms" }}>
        <button className="btn-ghost" onClick={onRetest}>
          {t("report.retest")}
        </button>
        <button className="btn-ghost" onClick={() => void copyReport(report).then(() => alert(t("report.copied"))).catch(() => alert(t("settings.updateError")))}>
          {t("report.copy")}
        </button>
        <button className="btn-ghost" onClick={() => downloadReport(report)}>
          {t("report.export")}
        </button>
        <button className="btn-primary" onClick={onViewDetail}>
          {t("report.viewDetails")}
        </button>
      </div>
    </div>
  );
}

function levelLabel(level: RiskLevel): TranslationKey {
  if (level === "ok") return "status.normal";
  if (level === "warn") return "status.lowRisk";
  return "status.risk";
}

function proxyLabel(report: FullReport): TranslationKey {
  if (report.proxy.is_tor) return "status.risk";
  if (report.proxy.is_hosting || report.proxy.is_vpn || report.proxy.is_proxy)
    return "status.lowRisk";
  return "status.normal";
}

function aiAggregateLevel(report: FullReport): RiskLevel {
  const levels = report.ai_services.services.map((s) => s.level);
  if (levels.includes("risk")) return "risk";
  if (levels.includes("warn")) return "warn";
  return "ok";
}

function aiAggregateLabel(report: FullReport): TranslationKey {
  const level = aiAggregateLevel(report);
  if (level === "ok") return "aiLevel.ok";
  if (level === "warn") return "aiLevel.warn";
  return "aiLevel.risk";
}

function streamingAggregateLevel(report: FullReport): RiskLevel {
  const services = report.streaming.services;
  if (!services.length) return "warn";
  const accessible = services.filter((service) => service.accessible).length;
  return accessible === services.length ? "ok" : accessible === 0 ? "risk" : "warn";
}

function streamingAggregateLabel(report: FullReport): TranslationKey {
  const level = streamingAggregateLevel(report);
  return level === "ok" ? "status.normal" : level === "warn" ? "status.lowRisk" : "status.risk";
}

function SpeedSummary({ report }: { report: FullReport }) {
  const t = useT();
  const m = report.speed.metrics;
  const value = (n: number | null, unit: string) => n == null ? t("speed.notAvailable") : `${n.toFixed(1)} ${unit}`;
  const useCaseKeys = {
    browsing: "speed.browsing",
    streaming4k: "speed.streaming4k",
    video_call: "speed.videoCall",
    gaming: "speed.gaming",
  } as const;
  return (
    <div className="speed-summary fade-up">
      <div className="speed-score-row">
        <span>{t("speed.score")}</span>
        <strong className="mono">{report.speed.assessment.score}/100</strong>
      </div>
      <div className="speed-metric-grid">
        <Metric label={t("speed.latency")} value={value(m.latency_ms, "ms")} />
        <Metric label={t("speed.jitter")} value={value(m.jitter_ms, "ms")} />
        <Metric label={t("speed.download")} value={value(m.download_mbps, "Mbps")} />
        <Metric label={t("speed.upload")} value={value(m.upload_mbps, "Mbps")} />
        <Metric label={t("speed.downloadLoaded")} value={value(m.download_loaded_latency_ms, "ms")} />
        <Metric label={t("speed.uploadLoaded")} value={value(m.upload_loaded_latency_ms, "ms")} />
      </div>
      <div className="speed-usecases">
        {report.speed.assessment.use_cases.map((item) => (
          <div className="speed-usecase" key={item.id}>
            <span>{t(useCaseKeys[item.id])}</span><span className="mono">{item.score}/100</span>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 12 }}>{report.speed.metrics.status === "complete" ? t("speed.provider") : t("speed.partial")}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="speed-metric"><span>{label}</span><strong className="mono">{value}</strong></div>;
}

function webRtcLabel(outcome: FullReport["webrtc"]["outcome"]): TranslationKey {
  const labels = {
    leak: "webrtc.outcome.leak",
    clear: "webrtc.outcome.clear",
    inconclusive: "webrtc.outcome.inconclusive",
    unsupported: "webrtc.outcome.unsupported",
  } as const;
  return labels[outcome];
}

function stageKey(id: StageId): TranslationKey {
  const map: Record<StageId, TranslationKey> = {
    ip: "section.network",
    dns: "section.dns",
    webrtc: "section.webrtc",
    ipv6: "section.ipv6",
    blacklist: "section.blacklist",
    proxy: "section.vpn",
    ai: "section.ai",
    streaming: "section.streaming",
    speed: "section.speed",
  };
  return map[id];
}
