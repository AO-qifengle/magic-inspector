/**
 * WebRTC 泄露检测 —— 必须在浏览器 / WebView 上下文中执行（Rust 无法访问 RTCPeerConnection）。
 *
 * 原理：创建一个 RTCPeerConnection 并收集 ICE 候选，从中提取本地地址与服务器反射公网地址。
 * 真正的"泄露"判定：候选中暴露了与代理出口不同的公网 IP（说明 WebRTC 绕过了代理）。
 */

export interface WebRtcRaw {
  local_addresses: string[];
  public_candidates: string[];
  /** ICE 收集是否在超时前正常结束。 */
  gathering_complete: boolean;
  /** 当前 WebView 是否支持 WebRTC。 */
  supported: boolean;
}

function isPrivateIp(ip: string): boolean {
  if (ip.endsWith(".local")) return false;
  // IPv4
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = +v4[1];
    const b = +v4[2];
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
    return false;
  }
  // IPv6
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fe80:")) return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  return false;
}

function isPublicAddress(ip: string): boolean {
  return !isPrivateIp(ip) && ip !== "0.0.0.0" && ip !== "::";
}

function extractAddress(candidate: string): { address: string; type: string } | null {
  // candidate:<foundation> <component> <proto> <priority> <addr> <port> typ <type> ...
  const parts = candidate.split(/\s+/);
  if (parts.length < 8 || parts[6] !== "typ") return null;
  const address = parts[4];
  const type = parts[7];
  if (!address || address === "0.0.0.0") return null;
  return { address, type };
}

export async function gatherWebRtcCandidates(timeoutMs = 3000): Promise<WebRtcRaw> {
  if (typeof window === "undefined" || typeof window.RTCPeerConnection !== "function") {
    return { local_addresses: [], public_candidates: [], gathering_complete: false, supported: false };
  }

  let pc: RTCPeerConnection | null = null;
  const local = new Set<string>();
  const pub = new Set<string>();
  let gatheringComplete = false;

  try {
    pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
      ],
    });
    pc.createDataChannel("mi-probe");

    pc.onicecandidate = (e) => {
      if (!e.candidate || !e.candidate.candidate) return;
      const extracted = extractAddress(e.candidate.candidate);
      if (!extracted) return;
      const { address, type } = extracted;
      if (address.endsWith(".local")) {
        return;
      }
      if (isPrivateIp(address)) {
        local.add(address);
      } else if (isPublicAddress(address) && (type === "host" || type === "srflx")) {
        // relay 是 TURN 服务器的中继地址，不代表设备真实出口，不能用于泄露判断。
        pub.add(address);
      }
    };

    const completion = new Promise<void>((resolve) => {
      pc!.onicegatheringstatechange = () => {
        if (pc!.iceGatheringState === "complete") {
          gatheringComplete = true;
          resolve();
        }
      };
    });
    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);

    await Promise.race([completion, new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))]);
  } catch {
    /* 静默失败，返回空结果 */
  } finally {
    if (pc) {
      try {
        pc.close();
      } catch {
        /* noop */
      }
    }
  }

  return {
    local_addresses: Array.from(local),
    public_candidates: Array.from(pub),
    gathering_complete: gatheringComplete,
    supported: true,
  };
}
