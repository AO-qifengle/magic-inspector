import { useT } from "../i18n";
import type { RiskLevel } from "../types/report";
import { useCountUp } from "../hooks/useCountUp";

const LEVEL_COLOR: Record<RiskLevel, string> = {
  ok: "var(--color-ok)",
  warn: "var(--color-warn)",
  risk: "var(--color-risk)",
};

interface Props {
  score: number;
  level: RiskLevel;
  size?: number;
  stroke?: number;
}

/** 圆环评分图：环颜色随等级，中心数字缓慢增长。 */
export function ScoreRing({ score, level, size = 184, stroke = 12 }: Props) {
  const t = useT();
  const animated = useCountUp(score);
  const color = LEVEL_COLOR[level];
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animated / 100);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--score-ring-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.2s linear, stroke 0.4s ease",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {animated}
        </span>
        <span
          style={{
            fontSize: 14,
            color: "var(--text-tertiary)",
            marginTop: 4,
          }}
        >
          {t("report.healthScore")}
        </span>
      </div>
    </div>
  );
}
