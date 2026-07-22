import { useCallback, useRef, useState } from "react";
import {
  onDetectionProgress,
  runDetection,
} from "../detection/bridge";
import { buildFullReport } from "../detection/scoring";
import { gatherWebRtcCandidates } from "../detection/webrtc";
import type { FullReport, StageId, StageState } from "../types/report";
import { useT } from "../i18n";

/** 检测项的展示顺序（与首页/检测页一致）。 */
export const STAGE_ORDER: StageId[] = [
  "ip",
  "dns",
  "webrtc",
  "ipv6",
  "blacklist",
  "proxy",
  "ai",
  "streaming",
];

function initialStages(): Record<StageId, StageState> {
  const map = {} as Record<StageId, StageState>;
  for (const id of STAGE_ORDER) {
    map[id] = { id, status: "pending" };
  }
  return map;
}

export type DetectionStatus = "idle" | "running" | "done" | "error";

export function useDetection() {
  const t = useT();
  const [stages, setStages] = useState<Record<StageId, StageState>>(initialStages);
  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [report, setReport] = useState<FullReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  const patchStage = useCallback((id: StageId, st: StageState["status"]) => {
    setStages((prev) => ({ ...prev, [id]: { id, status: st } }));
  }, []);

  const start = useCallback(async () => {
    setStatus("running");
    setError(null);
    setReport(null);
    setStages(initialStages());
    patchStage("ip", "running");
    patchStage("webrtc", "running");

    let unlisten: (() => void) | null = null;
    try {
      unlisten = await onDetectionProgress((stage) => {
        patchStage(stage.id, stage.status);
      });
      unlistenRef.current = unlisten;

      const [backend, webrtcRaw] = await Promise.all([
        runDetection(),
        gatherWebRtcCandidates(),
      ]);
      // WebRTC 原始采集完成
      patchStage("webrtc", "done");

      const full = buildFullReport(backend, webrtcRaw, t);
      setReport(full);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
      patchStage("webrtc", "error");
    } finally {
      if (unlisten) unlisten();
      unlistenRef.current = null;
    }
  }, [patchStage, t]);

  const reset = useCallback(() => {
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }
    setStatus("idle");
    setReport(null);
    setError(null);
    setStages(initialStages());
  }, []);

  return { stages, status, report, error, start, reset, stageOrder: STAGE_ORDER };
}
