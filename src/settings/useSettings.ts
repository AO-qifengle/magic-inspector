import { createContext, useContext } from "react";

export type Language = "zh" | "en";
export type ThemeMode = "auto" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface SettingsValue {
  language: Language;
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setLanguage: (lang: Language) => void;
  setTheme: (mode: ThemeMode) => void;
}

/** 设置上下文：由 <SettingsProvider> 提供值，useSettings() 消费。 */
export const SettingsContext = createContext<SettingsValue | null>(null);

/** 读取与更新用户设置（语言 / 主题）。必须在 <SettingsProvider> 内使用。 */
export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
