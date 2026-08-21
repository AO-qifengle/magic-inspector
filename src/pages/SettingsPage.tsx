import { useState } from "react";
import { useSettings } from "../settings/useSettings";
import { useT } from "../i18n";
import { APP_VERSION, checkForUpdate, type UpdateInfo } from "../update/check";

/** 设置页：语言 / 主题 / 关于 / 隐私说明。 */
export function SettingsPage() {
  const t = useT();
  const { language, setLanguage, theme, setTheme } = useSettings();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [update, setUpdate] = useState<"idle" | "checking" | "latest" | "error">("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  const handleUpdate = async () => {
    setUpdate("checking");
    try {
      const info = await checkForUpdate();
      setUpdateInfo(info);
      setUpdate(info ? "idle" : "latest");
      if (info && window.confirm(t("settings.newVersion", { version: info.latest }))) window.open(info.url, "_blank");
    } catch { setUpdate("error"); }
  };

  return (
    <div className="page">
      {/* 语言 */}
      <div className="list-section-header">{t("settings.language")}</div>
      <div className="list-group">
        <SelectRow
          label={t("lang.zh")}
          selected={language === "zh"}
          onSelect={() => setLanguage("zh")}
        />
        <SelectRow
          label={t("lang.en")}
          selected={language === "en"}
          onSelect={() => setLanguage("en")}
        />
      </div>

      {/* 主题 */}
      <div className="list-section-header">{t("settings.theme")}</div>
      <div className="list-group">
        <SelectRow
          label={t("theme.auto")}
          selected={theme === "auto"}
          onSelect={() => setTheme("auto")}
        />
        <SelectRow
          label={t("theme.light")}
          selected={theme === "light"}
          onSelect={() => setTheme("light")}
        />
        <SelectRow
          label={t("theme.dark")}
          selected={theme === "dark"}
          onSelect={() => setTheme("dark")}
        />
      </div>

      {/* 关于 */}
      <div className="list-section-header">{t("settings.about")}</div>
      <div className="list-group">
        <div className="list-row">
          <span className="list-row-label">{t("settings.version")}</span>
          <span className="list-row-value">{APP_VERSION}</span>
        </div>
        <button className="list-row list-row-clickable" type="button" onClick={() => void handleUpdate()} disabled={update === "checking"}>
          <span className="list-row-label">{t("settings.checkUpdate")}</span>
          <span className="list-row-value">{update === "checking" ? t("common.loading") : update === "latest" ? t("settings.upToDate") : update === "error" ? t("settings.updateError") : updateInfo?.latest ?? <ChevronRight />}</span>
        </button>
        <button
          className="list-row list-row-clickable"
          type="button"
          onClick={() => setShowPrivacy((v) => !v)}
        >
          <span className="list-row-label">{t("settings.privacy")}</span>
          <ChevronRight />
        </button>
      </div>

      {showPrivacy && (
        <div className="report-recommendation fade-in" style={{ marginTop: "var(--space-3)" }}>
          <p style={{ marginBottom: 8 }}>{t("settings.aboutBody")}</p>
          <p>{t("settings.privacyBody")}</p>
        </div>
      )}
    </div>
  );
}

function SelectRow({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button className="list-row list-row-clickable" type="button" onClick={onSelect} aria-pressed={selected}>
      <span className="list-row-label">{label}</span>
      {selected && <Checkmark />}
    </button>
  );
}

function Checkmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M3.5 9.2L7 12.7L14.5 5.2"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M4 2.5L7.5 6L4 9.5"
        stroke="var(--text-tertiary)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
