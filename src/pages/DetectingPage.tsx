import { useT } from "../i18n";
import type { DetectionStatus } from "../hooks/useDetection";
import type { StageId, StageState } from "../types/report";

interface Props {
  stages: Record<StageId, StageState>;
  stageOrder: StageId[];
  status: DetectionStatus;
  error: string | null;
  onRetry: () => void;
}

const STAGE_KEY: Record<StageId, "stage.ip" | "stage.dns" | "stage.webrtc" | "stage.ipv6" | "stage.blacklist" | "stage.proxy" | "stage.ai" | "stage.streaming"> = {
  ip: "stage.ip",
  dns: "stage.dns",
  webrtc: "stage.webrtc",
  ipv6: "stage.ipv6",
  blacklist: "stage.blacklist",
  proxy: "stage.proxy",
  ai: "stage.ai",
  streaming: "stage.streaming",
};

/** 检测进行中：逐项出现的进度列表。 */
export function DetectingPage({ stages, stageOrder, status, error, onRetry }: Props) {
  const t = useT();

  return (
    <div className="detect-list">
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          textAlign: "center",
          letterSpacing: "-0.02em",
          marginBottom: 4,
        }}
      >
        {t("detection.title")}
      </h2>
      <p
        className="text-secondary text-center"
        style={{ fontSize: 14, marginBottom: "var(--space-6)" }}
      >
        {status === "error" ? t("detection.failed") : t("detection.subtitle")}
      </p>

      {status === "error" && error && (
        <p
          className="text-center"
          style={{
            fontSize: 13,
            color: "var(--color-risk)",
            marginBottom: "var(--space-4)",
            wordBreak: "break-word",
          }}
        >
          {error}
        </p>
      )}

      <div>
        {stageOrder.map((id, i) => {
          const s = stages[id];
          return (
            <div
              key={id}
              className="detect-item"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <StageIcon status={s.status} />
              <span className="detect-label">{t(STAGE_KEY[id])}</span>
              <span
                className={`detect-status ${
                  s.status === "running" ? "detect-status-running" : ""
                }`}
              >
                {statusText(s.status)}
              </span>
            </div>
          );
        })}
      </div>

      {status === "error" && (
        <div style={{ textAlign: "center", marginTop: "var(--space-6)" }}>
          <button className="btn-primary" onClick={onRetry}>
            {t("common.retry")}
          </button>
        </div>
      )}
    </div>
  );
}

function statusText(status: StageState["status"]): string {
  if (status === "running") return "···";
  if (status === "done") return "✓";
  if (status === "error") return "!";
  return "";
}

function StageIcon({ status }: { status: StageState["status"] }) {
  if (status === "running") {
    return <span className="detect-icon detect-icon-running" />;
  }
  if (status === "done") {
    return (
      <span className="detect-icon detect-icon-done">
        <CheckIcon />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="detect-icon detect-icon-error">
        <CrossIcon />
      </span>
    );
  }
  return <span className="detect-icon detect-icon-pending" />;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 6.2L4.8 8.5L9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path
        d="M2.5 2.5l6 6M8.5 2.5l-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
