export const APP_VERSION = "1.1.0";
const RELEASES_API = "https://api.github.com/repos/AO-qifengle/magic-inspector/releases/latest";

export interface UpdateInfo { latest: string; url: string; notes: string; }

function versionParts(v: string): number[] {
  return v.replace(/^v/i, "").split(".").map((x) => Number.parseInt(x, 10) || 0);
}

export function isNewer(current: string, latest: string): boolean {
  const a = versionParts(current); const b = versionParts(latest);
  for (let i = 0; i < 3; i += 1) if ((b[i] ?? 0) !== (a[i] ?? 0)) return (b[i] ?? 0) > (a[i] ?? 0);
  return false;
}

export async function checkForUpdate(signal?: AbortSignal): Promise<UpdateInfo | null> {
  const response = await fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json" }, signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json() as { tag_name?: string; html_url?: string; body?: string };
  if (!data.tag_name || !data.html_url || !isNewer(APP_VERSION, data.tag_name)) return null;
  return { latest: data.tag_name, url: data.html_url, notes: data.body ?? "" };
}
