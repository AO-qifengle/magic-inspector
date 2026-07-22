import { useT } from "../i18n";
import type { RiskLevel } from "../types/report";

const LEVEL_CLASS: Record<RiskLevel, string> = {
  ok: "badge-ok",
  warn: "badge-warn",
  risk: "badge-risk",
};

const LEVEL_KEY: Record<RiskLevel, "risk.ok" | "risk.warn" | "risk.risk"> = {
  ok: "risk.ok",
  warn: "risk.warn",
  risk: "risk.risk",
};

interface Props {
  level: RiskLevel;
  label?: string;
}

/** 状态徽章：圆点 + 文本，颜色随等级变化。 */
export function StatusBadge({ level, label }: Props) {
  const t = useT();
  return (
    <span className={`badge ${LEVEL_CLASS[level]}`}>
      {label ?? t(LEVEL_KEY[level])}
    </span>
  );
}
