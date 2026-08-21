import type { FullReport } from "../types/report";

const KEY = "mi:report-history:v1";
const MAX = 20;

export interface ReportSnapshot {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  appVersion: string;
  report: FullReport;
}

function read(): ReportSnapshot[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ReportSnapshot => {
      const x = item as Partial<ReportSnapshot>;
      return x.schemaVersion === 1 && typeof x.id === "string" && typeof x.createdAt === "string" && !!x.report;
    });
  } catch { return []; }
}

function write(items: ReportSnapshot[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX))); } catch { /* storage is optional */ }
}

export function listReports(): ReportSnapshot[] { return read(); }

export function saveReport(report: FullReport): ReportSnapshot {
  const item: ReportSnapshot = {
    schemaVersion: 1,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    appVersion: "1.1.0",
    report,
  };
  write([item, ...read().filter((x) => x.id !== item.id)]);
  return item;
}

export function removeReport(id: string) { write(read().filter((item) => item.id !== id)); }
export function clearReports() { write([]); }
