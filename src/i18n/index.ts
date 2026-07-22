import { useCallback, useMemo } from "react";
import { useSettings } from "../settings/useSettings";
import { en } from "./en";
import { zh, type TranslationKey } from "./zh";

const dictionaries = { zh, en } as const;

/** 翻译函数：支持 {name} 占位符插值。 */
export type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  );
}

export function useT(): TFn {
  const { language } = useSettings();
  return useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const dict = dictionaries[language];
      const value = dict[key] ?? zh[key] ?? key;
      return interpolate(value, params);
    },
    [language],
  );
}

export function useLanguage() {
  const { language } = useSettings();
  return useMemo(() => language, [language]);
}

export type { TranslationKey };
