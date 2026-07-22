import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SettingsContext,
  type Language,
  type ResolvedTheme,
  type SettingsValue,
  type ThemeMode,
} from "./useSettings";

const STORAGE_KEY = "mi:settings";

interface PersistedSettings {
  language: Language;
  theme: ThemeMode;
}

const DEFAULTS: PersistedSettings = { language: "zh", theme: "auto" };

function readPersisted(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      language: parsed.language === "en" ? "en" : "zh",
      theme:
        parsed.theme === "light" || parsed.theme === "dark"
          ? parsed.theme
          : "auto",
    };
  } catch {
    return DEFAULTS;
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** 设置 Provider：在应用根节点包裹一次，提供语言 / 主题给全局。 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PersistedSettings>(() =>
    typeof window === "undefined" ? DEFAULTS : readPersisted(),
  );
  const [system, setSystem] = useState<ResolvedTheme>(() =>
    typeof window === "undefined" ? "light" : systemTheme(),
  );

  // 监听系统主题变化（仅 auto 模式生效）
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) =>
      setSystem(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedTheme: ResolvedTheme =
    settings.theme === "auto" ? system : settings.theme;

  // 把解析后的主题写到 <html data-theme>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // 持久化
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* 忽略写入失败 */
    }
  }, [settings]);

  const setLanguage = useCallback(
    (language: Language) => setSettings((s) => ({ ...s, language })),
    [],
  );
  const setTheme = useCallback(
    (theme: ThemeMode) => setSettings((s) => ({ ...s, theme })),
    [],
  );

  const value = useMemo<SettingsValue>(
    () => ({
      language: settings.language,
      theme: settings.theme,
      resolvedTheme,
      setLanguage,
      setTheme,
    }),
    [settings, resolvedTheme, setLanguage, setTheme],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
