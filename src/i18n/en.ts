import type { TranslationKey } from "./zh";

export const en: Record<TranslationKey, string> = {
  "app.name": "Magic Inspector",
  "app.tagline": "Inspect your network",

  "home.subtitle":
    "One tap to check whether your network is safe, leak-free, and ready for ChatGPT, Claude, Google and other global services.",
  "home.start": "Start Inspection",
  "home.privacy": "All checks run locally by default. No data is uploaded.",

  "stage.ip": "IP",
  "stage.dns": "DNS",
  "stage.webrtc": "WebRTC",
  "stage.ipv6": "IPv6",
  "stage.blacklist": "Blacklist",
  "stage.proxy": "Proxy",
  "stage.ai": "AI Services",
  "stage.streaming": "Streaming",

  "detection.title": "Inspecting your network",
  "detection.subtitle": "Analyzing each item, please wait…",
  "detection.complete": "Inspection complete",
  "detection.failed": "Inspection failed, please retry",

  "report.healthScore": "Network Health",
  "report.viewDetails": "View Detailed Report",
  "report.retest": "Run Again",
  "report.recommendation": "Recommendation",
  "report.overall": "Overall",
  "report.sections": "Results",
  "report.streamingOptional": "Streaming (optional)",

  "conclusion.excellent":
    "Your network is safe and ready for browsing and AI services.",
  "conclusion.good":
    "Your network is generally safe with minor room for improvement.",
  "conclusion.fair":
    "Your network has some risks; some services may be restricted.",
  "conclusion.poor": "Your network is risky. Please take action soon.",

  "rec.noChange":
    "Your network is in good shape — no leaks or risks detected. You can use all services normally.",
  "rec.changeNode":
    "Your IP belongs to a datacenter, which some sites may flag as a proxy and add captchas. Switch to a residential-type node for better compatibility.",
  "rec.fixDnsLeak":
    "DNS leak detected — your DNS requests are not going through an encrypted tunnel, so your ISP can see which sites you visit. Enable \"DNS protection\" or \"DNS over HTTPS\" in your VPN client.",
  "rec.disableIpv6":
    "IPv6 leak detected — your IPv6 traffic is bypassing the proxy, which may expose your real location. Disable IPv6 in system settings, or enable IPv6 forwarding in your VPN client.",
  "rec.fixWebRTC":
    "WebRTC leak detected — your browser is exposing your real IP via WebRTC. Install a WebRTC blocking extension (e.g. WebRTC Control), or disable WebRTC in your browser settings.",
  "rec.aiCaptcha":
    "This IP type may trigger captchas on AI services like ChatGPT and Claude. Switching to a residential node will improve the experience.",
  "rec.blacklisted":
    "This IP is listed on multiple public blacklists with poor reputation. Some services may block it outright. Consider switching to a node with better reputation.",
  "rec.torExit":
    "This IP is a TOR exit node — most services will refuse it outright. Please switch to a non-TOR node.",
  "rec.aiBlocked":
    "Some AI services are unreachable on this network. Check if the node's region supports the service, or switch to a node in a different region.",

  "risk.ok": "OK",
  "risk.warn": "Caution",
  "risk.risk": "Risk",

  "status.normal": "Normal",
  "status.pass": "Pass",
  "status.lowRisk": "Low risk",
  "status.recommend": "Recommended",
  "status.risk": "Risk",
  "status.notRecommend": "Not recommended",
  "status.yes": "Yes",
  "status.no": "No",
  "status.enabled": "Enabled",
  "status.disabled": "Disabled",
  "status.leaked": "Leaking",
  "status.noLeak": "No leak",
  "status.notListed": "Not listed",
  "status.listed": "Listed",

  "ipType.residential": "Residential",
  "ipType.datacenter": "Datacenter",
  "ipType.mobile": "Mobile",
  "ipType.unknown": "Unknown",

  "section.network": "Network",
  "section.dns": "DNS",
  "section.webrtc": "WebRTC",
  "section.ipv6": "IPv6",
  "section.blacklist": "Blacklist",
  "section.vpn": "VPN Detection",
  "section.ai": "AI Service Compatibility",
  "section.streaming": "Streaming",

  "field.publicIp": "Public IP",
  "field.country": "Country",
  "field.city": "City",
  "field.asn": "ASN",
  "field.isp": "ISP",
  "field.organization": "Organization",
  "field.ipType": "IP Type",
  "field.timezone": "Timezone",
  "field.ipv4": "IPv4",
  "field.ipv6": "IPv6",

  "field.dnsLeak": "DNS Leak",
  "field.dnsServers": "DNS Servers",
  "field.dnsCountry": "DNS Country",
  "field.dnsCount": "DNS Count",
  "field.riskNote": "Risk Note",
  "field.none": "None",

  "field.webrtcLeak": "Leaking",
  "field.localAddr": "Local Address",
  "field.publicAddr": "Public Address",

  "field.ipv6Enabled": "Enabled",
  "field.ipv6Leak": "Leaking",

  "field.reputation": "Reputation Score",
  "field.hitCount": "Hits",
  "field.blacklistLists": "Blacklists",

  "field.hosting": "Hosting",
  "field.proxy": "Proxy",
  "field.vpn": "VPN",
  "field.tor": "TOR",
  "field.residential": "Residential",
  "field.mobile": "Mobile",
  "field.cloud": "Cloud",

  "aiLevel.ok": "Recommended",
  "aiLevel.warn": "Normal",
  "aiLevel.risk": "Risk",
  "ai.reachable": "Reachable",
  "ai.unreachable": "Unreachable",
  "ai.latency": "Latency",

  "streaming.accessible": "Accessible",
  "streaming.blocked": "Blocked",

  "explain.network.datacenter":
    "This IP belongs to a datacenter. Some sites may add captchas or restrict access.",
  "explain.network.residential":
    "This IP is residential and looks natural — most sites won't restrict it.",
  "explain.network.mobile":
    "This IP is from a mobile network. Most services work normally.",
  "explain.network.unknown":
    "Could not determine the IP type. Retry on a stable network.",

  "explain.dns.leak":
    "Your DNS resolvers are in a different region than your public IP. That means your ISP may still see which sites you visit.",
  "explain.dns.ok":
    "DNS resolvers match your public IP region. No obvious leak detected — your DNS queries aren't being exposed.",
  "explain.dns.unknown":
    "Could not read system DNS config. DNS leak status is unknown.",

  "explain.webrtc.leak":
    "WebRTC is exposing your real IP. That means sites can bypass your proxy via WebRTC to find your real address.",
  "explain.webrtc.ok":
    "WebRTC is not leaking your real IP. Sites can't discover it via WebRTC.",

  "explain.ipv6.leak":
    "An IPv6 address was found and it doesn't match your IPv4 region. Your proxy may not cover IPv6 traffic — a leak is possible.",
  "explain.ipv6.ok.enabled":
    "IPv6 is enabled and matches your IPv4 region. No IPv6 leak detected.",
  "explain.ipv6.ok.disabled":
    "IPv6 is not enabled. No risk of IPv6 bypassing your proxy.",

  "explain.blacklist.ok":
    "This IP is not on major public blacklists. Reputation is good.",
  "explain.blacklist.warn":
    "This IP appears on some public blacklists. Some services may scrutinize it.",
  "explain.blacklist.risk":
    "This IP is listed on multiple blacklists. Some services may block it.",

  "explain.proxy.tor":
    "This IP is a TOR exit node. Most services restrict or refuse it.",
  "explain.proxy.vpn":
    "This IP shows VPN / proxy traits. ChatGPT, Claude and others may require extra verification.",
  "explain.proxy.hosting":
    "This IP belongs to a datacenter / cloud server. Some sites may add captchas or restrict access.",
  "explain.proxy.ok":
    "No obvious proxy / VPN traits detected. The IP looks natural.",

  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.theme": "Theme",
  "settings.about": "About",
  "settings.version": "Version",
  "settings.checkUpdate": "Check for Updates",
  "settings.upToDate": "Up to date",
  "settings.privacy": "Privacy",
  "settings.privacyBody":
    "Magic Inspector never uploads your inspection data. All checks run locally by default. When a public API is needed (e.g. IP geolocation), only the necessary network request is sent. We never collect browsing history, accounts, cookies, passwords, proxy config, or any personal information.",
  "settings.aboutBody":
    "Magic Inspector helps you understand at a glance whether your network is safe, leak-free, and ready for global services. It does not provide VPN or proxy, and it never modifies system settings.",

  "theme.auto": "Auto",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "lang.zh": "中文",
  "lang.en": "English",

  "common.back": "Back",
  "common.close": "Close",
  "common.retry": "Retry",
  "common.loading": "Loading",
  "common.unknown": "Unknown",
};
