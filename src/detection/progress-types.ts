/** 与 Rust `ProgressPayload` 保持一致的事件载荷。 */
export interface ProgressPayload {
  stage: string;
  status: string;
  label: string;
}

export interface SpeedProgress {
  phase: "latency" | "download" | "upload";
  progress: number;
  mbps: number | null;
  bytes: number;
}
