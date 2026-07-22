import type { ReactNode } from "react";
import { useT } from "../i18n";

interface Props {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

/** 顶部导航栏：左侧返回、中间标题、右侧自定义操作。 */
export function Navbar({ title, onBack, right }: Props) {
  const t = useT();
  return (
    <header className="navbar">
      <div style={{ width: 80, display: "flex" }}>
        {onBack && (
          <button className="nav-btn" onClick={onBack} aria-label={t("common.back")}>
            <ChevronLeft />
            {t("common.back")}
          </button>
        )}
      </div>
      <div className="navbar-title">{title}</div>
      <div style={{ width: 80, display: "flex", justifyContent: "flex-end" }}>
        {right}
      </div>
    </header>
  );
}

function ChevronLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path
        d="M8.5 1.5L3.5 6.5L8.5 11.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
