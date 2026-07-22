import { ScoreRing } from "../components/ScoreRing";
import { StatusBadge } from "../components/StatusBadge";
import { useT, type TranslationKey } from "../i18n";
import type { FullReport, RiskLevel, StageId } from "../types/report";

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
      level: report.webrtc.leaked ? "risk" : "ok",
      label: report.webrtc.leaked ? "status.risk" : "status.normal",
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
          <div
            key={row.id}
            className="list-row list-row-clickable"
            onClick={onViewDetail}
          >
            <span className="list-row-label">{t(stageKey(row.id))}</span>
            <StatusBadge level={row.level} label={t(row.label)} />
          </div>
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

      <div className="report-actions fade-up" style={{ animationDelay: "320ms" }}>
        <button className="btn-ghost" onClick={onRetest}>
          {t("report.retest")}
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
  };
  return map[id];
}
