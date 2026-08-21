/**
 * Tauri 桥接：调用后端检测命令并订阅逐项进度事件。
 */

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { BackendReport, SpeedReport, StageId, StageState } from "../types/report";
import type { ProgressPayload, SpeedProgress } from "./progress-types";

export const PROGRESS_EVENT = "detection-progress";

/** 将后端 stage 字符串映射为前端 StageId；未知值归入 streaming（容错）。 */
function toStageId(stage: string): StageId {
  const known: StageId[] = [
    "ip",
    "dns",
    "webrtc",
    "ipv6",
    "blacklist",
    "proxy",
    "ai",
  "streaming",
    "speed",
  ];
  return (known as string[]).includes(stage) ? (stage as StageId) : "streaming";
}

/** 订阅检测进度事件，返回取消监听函数。 */
export async function onDetectionProgress(
  cb: (stage: StageState) => void,
): Promise<UnlistenFn> {
  return listen<ProgressPayload>(PROGRESS_EVENT, (event) => {
    const p = event.payload;
    cb({
      id: toStageId(p.stage),
      status: p.status === "running" ? "running" : p.status === "error" ? "error" : "done",
    });
  });
}

/** 调用后端执行整次检测，返回后端报告。 */
export async function runDetection(): Promise<BackendReport> {
  return invoke<BackendReport>("run_detection");
}

export const SPEED_PROGRESS_EVENT = "speed-progress";

export async function onSpeedProgress(cb: (progress: SpeedProgress) => void): Promise<UnlistenFn> {
  return listen<SpeedProgress>(SPEED_PROGRESS_EVENT, (event) => cb(event.payload));
}

export function runSpeedTest(): Promise<SpeedReport> {
  return invoke<SpeedReport>("run_speed_test");
}

export function cancelSpeedTest(): Promise<void> {
  return invoke("cancel_speed_test");
}
