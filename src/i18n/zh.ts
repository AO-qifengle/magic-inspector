/**
 * 中文翻译字典（key 的来源 of truth）。
 * 修改 key 后需同步 en.ts。
 */
export const zh = {
  "app.name": "魔法检测工具",
  "app.tagline": "检测当前网络环境",

  "home.subtitle":
    "一键检测网络是否安全、是否存在泄露、是否适合使用 ChatGPT、Claude、Google 等国际互联网服务。",
  "home.start": "开始检测",
  "home.privacy": "所有检测默认本地完成，不上传任何数据。",

  "stage.ip": "IP",
  "stage.dns": "DNS",
  "stage.webrtc": "WebRTC",
  "stage.ipv6": "IPv6",
  "stage.blacklist": "黑名单",
  "stage.proxy": "代理检测",
  "stage.ai": "AI 服务检测",
  "stage.streaming": "流媒体",

  "detection.title": "正在检测当前网络环境",
  "detection.subtitle": "正在逐项分析，请稍候……",
  "detection.complete": "检测完成",
  "detection.failed": "检测失败，请重试",

  "report.healthScore": "网络健康度",
  "report.viewDetails": "查看详细报告",
  "report.retest": "重新检测",
  "report.recommendation": "建议",
  "report.overall": "总体结论",
  "report.sections": "各项结果",
  "report.streamingOptional": "流媒体（可选）",

  "conclusion.excellent": "当前网络环境安全，适合日常浏览与 AI 服务。",
  "conclusion.good": "当前网络基本安全，存在小幅可改进项。",
  "conclusion.fair": "当前网络存在一定风险，部分服务可能受限。",
  "conclusion.poor": "当前网络风险较高，建议尽快处理。",

  "rec.noChange": "当前网络状态良好，未发现泄露或风险，可正常使用各类服务。",
  "rec.changeNode":
    "当前 IP 属于数据中心，部分网站可能将其识别为代理并增加验证码。建议更换为家庭宽带（Residential）类型的节点，可减少验证码和访问限制。",
  "rec.fixDnsLeak":
    "检测到 DNS 泄露 — 你的 DNS 请求未经过加密通道，运营商可以看到你访问的网站。请在 VPN 客户端中开启「DNS 保护」或使用「DNS over HTTPS」，确保 DNS 查询通过加密隧道发送。",
  "rec.disableIpv6":
    "检测到 IPv6 泄露 — 你的 IPv6 流量未经过代理，可能导致真实位置暴露。请在系统设置中关闭 IPv6，或在 VPN 客户端中开启 IPv6 流量转发。",
  "rec.fixWebRTC":
    "检测到 WebRTC 泄露 — 浏览器通过 WebRTC 暴露了你的真实 IP 地址。请在浏览器中安装 WebRTC 防泄露插件（如 WebRTC Control），或在浏览器设置中禁用 WebRTC 功能。",
  "rec.aiCaptcha":
    "当前 IP 类型可能触发 AI 服务（如 ChatGPT、Claude）的验证码或风控。更换为家庭宽带类型的节点可显著改善使用体验。",
  "rec.blacklisted":
    "当前 IP 被多个公开黑名单收录，信誉较差，部分服务可能直接拒绝访问。建议尽快更换为信誉良好的节点。",
  "rec.torExit":
    "当前 IP 是 TOR 网络的出口节点，绝大多数服务会直接拒绝访问。请更换为非 TOR 节点。",
  "rec.aiBlocked":
    "部分 AI 服务在当前网络下无法访问，请检查节点所在地区是否支持该服务，或更换其他地区的节点。",

  "risk.ok": "正常",
  "risk.warn": "注意",
  "risk.risk": "风险",

  "status.normal": "正常",
  "status.pass": "通过",
  "status.lowRisk": "低风险",
  "status.recommend": "推荐",
  "status.risk": "风险",
  "status.notRecommend": "不建议",
  "status.yes": "是",
  "status.no": "否",
  "status.enabled": "已开启",
  "status.disabled": "未开启",
  "status.leaked": "存在泄露",
  "status.noLeak": "未泄露",
  "status.notListed": "未命中",
  "status.listed": "命中",

  "ipType.residential": "家庭宽带",
  "ipType.datacenter": "数据中心",
  "ipType.mobile": "移动网络",
  "ipType.unknown": "未知",

  "section.network": "网络",
  "section.dns": "DNS",
  "section.webrtc": "WebRTC",
  "section.ipv6": "IPv6",
  "section.blacklist": "黑名单",
  "section.vpn": "VPN 检测",
  "section.ai": "AI 服务兼容性",
  "section.streaming": "流媒体",

  "field.publicIp": "公网 IP",
  "field.country": "国家",
  "field.city": "城市",
  "field.asn": "ASN",
  "field.isp": "ISP",
  "field.organization": "组织",
  "field.ipType": "IP 类型",
  "field.timezone": "时区",
  "field.ipv4": "IPv4",
  "field.ipv6": "IPv6",

  "field.dnsLeak": "DNS 是否泄露",
  "field.dnsServers": "DNS 服务器",
  "field.dnsCountry": "DNS 国家",
  "field.dnsCount": "DNS 数量",
  "field.riskNote": "风险说明",
  "field.none": "无",

  "field.webrtcLeak": "是否泄露",
  "field.localAddr": "本地地址",
  "field.publicAddr": "公网地址",

  "field.ipv6Enabled": "是否开启",
  "field.ipv6Leak": "是否泄露",

  "field.reputation": "综合信誉评分",
  "field.hitCount": "命中数量",
  "field.blacklistLists": "黑名单列表",

  "field.hosting": "托管 (Hosting)",
  "field.proxy": "代理 (Proxy)",
  "field.vpn": "VPN",
  "field.tor": "TOR",
  "field.residential": "家宽 (Residential)",
  "field.mobile": "移动 (Mobile)",
  "field.cloud": "云 (Cloud)",

  "aiLevel.ok": "推荐",
  "aiLevel.warn": "正常",
  "aiLevel.risk": "风险",
  "ai.reachable": "可访问",
  "ai.unreachable": "无法访问",
  "ai.latency": "延迟",

  "streaming.accessible": "可访问",
  "streaming.blocked": "不可访问",

  "explain.network.datacenter":
    "当前 IP 属于数据中心。部分网站可能增加验证码或限制访问。",
  "explain.network.residential":
    "当前 IP 属于家庭宽带，伪装度较高，多数网站不会额外限制。",
  "explain.network.mobile":
    "当前 IP 属于移动网络，伪装度尚可，多数服务可正常使用。",
  "explain.network.unknown": "无法判断 IP 类型，建议在稳定网络下复测。",

  "explain.dns.leak":
    "检测到 DNS 解析器与你的公网 IP 不在同一地区。这意味着你的网络运营商可能仍知道你访问的网站。",
  "explain.dns.ok":
    "DNS 解析器与公网 IP 处于同一地区，未发现明显泄露。这意味着你的 DNS 查询未被额外暴露。",
  "explain.dns.unknown": "无法读取系统 DNS 配置，DNS 泄露情况未知。",

  "explain.webrtc.leak":
    "检测到 WebRTC 暴露了你的真实 IP。这意味着网站可通过 WebRTC 绕过代理获取你的真实地址。",
  "explain.webrtc.ok":
    "WebRTC 未暴露真实 IP。这意味着网站无法通过 WebRTC 获取你的真实地址。",

  "explain.ipv6.leak":
    "检测到 IPv6 公网地址，且与 IPv4 归属不一致。这意味着你的代理可能未覆盖 IPv6 流量，存在泄露。",
  "explain.ipv6.ok.enabled":
    "已开启 IPv6，且与 IPv4 归属一致。未发现 IPv6 泄露。",
  "explain.ipv6.ok.disabled":
    "当前网络未开启 IPv6，不存在 IPv6 绕过代理的泄露风险。",

  "explain.blacklist.ok": "当前 IP 未出现在主流公开黑名单中，信誉良好。",
  "explain.blacklist.warn": "当前 IP 出现在部分公开黑名单中，部分服务可能加强验证。",
  "explain.blacklist.risk": "当前 IP 被多个公开黑名单收录，部分服务可能拒绝访问。",

  "explain.proxy.tor": "当前 IP 是 TOR 出口节点，多数服务会显著限制或拒绝访问。",
  "explain.proxy.vpn":
    "当前 IP 表现出 VPN / 代理特征。ChatGPT、Claude 等服务可能要求额外验证。",
  "explain.proxy.hosting":
    "当前 IP 属于数据中心 / 云服务器，部分网站可能增加验证码或限制访问。",
  "explain.proxy.ok": "未发现明显的代理 / VPN 特征，IP 伪装度较好。",

  "settings.title": "设置",
  "settings.language": "语言",
  "settings.theme": "主题",
  "settings.about": "关于",
  "settings.version": "版本",
  "settings.checkUpdate": "检查更新",
  "settings.upToDate": "已是最新版本",
  "settings.privacy": "隐私说明",
  "settings.privacyBody":
    "魔法检测工具不会上传任何检测数据，所有检测默认在本地完成。当需要调用公开网络接口（如 IP 归属查询）时，仅发送必要的网络请求，绝不收集浏览记录、账号、Cookie、密码、代理配置或任何个人信息。",
  "settings.aboutBody":
    "魔法检测工具帮助你一键了解当前网络环境是否安全、是否存在泄露、是否适合使用国际互联网服务。它不提供 VPN，不提供代理，也不修改任何系统配置。",

  "theme.auto": "自动",
  "theme.light": "浅色",
  "theme.dark": "深色",
  "lang.zh": "中文",
  "lang.en": "English",

  "common.back": "返回",
  "common.close": "关闭",
  "common.retry": "重试",
  "common.loading": "加载中",
  "common.unknown": "未知",
} as const;

export type TranslationKey = keyof typeof zh;
