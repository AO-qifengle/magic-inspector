import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { useDetection } from "./hooks/useDetection";
import { useT } from "./i18n";
import { DetectingPage } from "./pages/DetectingPage";
import { DetailPage } from "./pages/DetailPage";
import { HomePage } from "./pages/HomePage";
import { ReportPage } from "./pages/ReportPage";
import { SettingsPage } from "./pages/SettingsPage";

type View = "home" | "detecting" | "report" | "detail" | "settings";

export default function App() {
  const t = useT();
  const detection = useDetection();
  const { status, report, start, reset } = detection;
  const [view, setView] = useState<View>("home");

  // 检测完成后自动进入报告页
  useEffect(() => {
    if (status === "done" && report) {
      setView("report");
    }
  }, [status, report]);

  const handleStart = () => {
    setView("detecting");
    void start();
  };

  const handleRetest = () => {
    reset();
    setView("detecting");
    void start();
  };

  const handleSettingsBack = () => {
    setView(report ? "report" : "home");
  };

  return (
    <div className="app-shell">
      {view === "home" && (
        <div className="app-content">
          <HomePage onStart={handleStart} onOpenSettings={() => setView("settings")} />
        </div>
      )}

      {view === "detecting" && (
        <div className="app-content">
          <DetectingPage
            stages={detection.stages}
            stageOrder={detection.stageOrder}
            status={status}
            error={detection.error}
            onRetry={handleRetest}
          />
        </div>
      )}

      {view === "report" && report && (
        <>
          <Navbar
            title={t("app.name")}
            onBack={() => setView("home")}
            right={<GearButton onClick={() => setView("settings")} />}
          />
          <div className="app-content">
            <ReportPage
              report={report}
              onViewDetail={() => setView("detail")}
              onRetest={handleRetest}
            />
          </div>
        </>
      )}

      {view === "detail" && report && (
        <>
          <Navbar
            title={t("report.viewDetails")}
            onBack={() => setView("report")}
          />
          <div className="app-content">
            <DetailPage report={report} />
          </div>
        </>
      )}

      {view === "settings" && (
        <>
          <Navbar title={t("settings.title")} onBack={handleSettingsBack} />
          <div className="app-content">
            <SettingsPage />
          </div>
        </>
      )}
    </div>
  );
}

function GearButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="nav-btn" onClick={onClick} aria-label="settings">
      <GearIcon />
    </button>
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
