import { useT } from "../i18n";
import hatIcon from "../assets/hat.png";

interface Props {
  onStart: () => void;
  onOpenSettings: () => void;
}

/** 首页：极简居中布局，标题 + 检测环 + 开始按钮。 */
export function HomePage({ onStart, onOpenSettings }: Props) {
  const t = useT();

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8) var(--space-6)",
        textAlign: "center",
        position: "relative",
      }}
    >
      <button
        className="nav-btn"
        onClick={onOpenSettings}
        aria-label={t("settings.title")}
        style={{ position: "absolute", top: 8, right: 8 }}
      >
        <GearIcon />
      </button>

      <div className="fade-up" style={{ marginBottom: "var(--space-10)" }}>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          {t("app.name")}
        </h1>
        <p
          style={{
            marginTop: 6,
            fontSize: 15,
            color: "var(--text-secondary)",
          }}
        >
          {t("app.tagline")}
        </p>
      </div>

      {/* 魔法帽图标 */}
      <button
        onClick={onStart}
        aria-label={t("home.start")}
        className="home-icon-btn fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <img src={hatIcon} alt="" className="home-icon-img" />
      </button>

      <button
        className="btn-primary fade-up"
        onClick={onStart}
        style={{ marginTop: "var(--space-8)", animationDelay: "160ms" }}
      >
        {t("home.start")}
      </button>

      <p
        className="note fade-in"
        style={{
          marginTop: "var(--space-6)",
          maxWidth: 420,
          animationDelay: "240ms",
        }}
      >
        {t("home.subtitle")}
      </p>

      <p
        className="note fade-in"
        style={{
          position: "absolute",
          bottom: "var(--space-6)",
          color: "var(--text-tertiary)",
          fontSize: 12,
        }}
      >
        {t("home.privacy")}
      </p>
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M16 4l-1.4 1.4M5.4 14.6L4 16M16 16l-1.4-1.4M5.4 5.4L4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
