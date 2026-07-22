import type { ReactNode } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { useT, type TranslationKey } from "../i18n";
import { networkExplanation } from "../detection/scoring";
import type {
  AiServiceResult,
  FullReport,
  IpType,
  RiskLevel,
} from "../types/report";

interface Props {
  report: FullReport;
}

/** 详细报告：分卡片展示每项检测的字段与"这意味着什么"解释。 */
export function DetailPage({ report }: Props) {
  const t = useT();
  const r = report;

  return (
    <div className="page">
      {/* 网络 */}
      <Section title={t("section.network")} explain={networkExplanation(r.network, t)}>
        <Field label={t("field.publicIp")} value={<Mono>{r.network.public_ip}</Mono>} />
        <Field label={t("field.country")} value={r.network.country} />
        <Field label={t("field.city")} value={r.network.city} />
        <Field label={t("field.asn")} value={<Mono>{r.network.asn}</Mono>} />
        <Field label={t("field.isp")} value={r.network.isp} />
        <Field label={t("field.organization")} value={r.network.organization} />
        <Field label={t("field.ipType")} value={ipTypeLabel(r.network.ip_type, t)} />
        <Field label={t("field.timezone")} value={r.network.timezone} />
        <Field label={t("field.ipv4")} value={<Mono>{r.network.ipv4 ?? "—"}</Mono>} />
        <Field
          label={t("field.ipv6")}
          value={<Mono>{r.network.ipv6 ?? "—"}</Mono>}
        />
      </Section>

      {/* DNS */}
      <Section title={t("section.dns")} explain={r.dns.status.summary}>
        <Field
          label={t("field.dnsLeak")}
          value={<BoolValue yes={r.dns.country_mismatch || r.dns.status.level === "risk"} />}
        />
        <Field label={t("field.dnsCount")} value={String(r.dns.server_count)} />
        <Field label={t("field.dnsCountry")} value={r.dns.countries.join(", ") || "—"} />
        {r.dns.servers.length > 0 && (
          <div style={{ padding: "var(--space-3) var(--space-4)" }}>
            {r.dns.servers.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                }}
              >
                <span className="mono" style={{ fontSize: 13 }}>
                  {s.address}
                </span>
                <span className="text-tertiary" style={{ fontSize: 13 }}>
                  {s.country} · {s.isp}
                </span>
              </div>
            ))}
          </div>
        )}
        <Field label={t("field.riskNote")} value={r.dns.status.summary} />
      </Section>

      {/* WebRTC */}
      <Section title={t("section.webrtc")} explain={r.webrtc.status.summary}>
        <Field label={t("field.webrtcLeak")} value={<BoolValue yes={r.webrtc.leaked} />} />
        <Field
          label={t("field.localAddr")}
          value={
            r.webrtc.local_addresses.length > 0 ? (
              <Pills values={r.webrtc.local_addresses} />
            ) : (
              t("field.none")
            )
          }
        />
        <Field
          label={t("field.publicAddr")}
          value={<Mono>{r.webrtc.public_address ?? "—"}</Mono>}
        />
      </Section>

      {/* IPv6 */}
      <Section title={t("section.ipv6")} explain={r.ipv6.status.summary}>
        <Field
          label={t("field.ipv6Enabled")}
          value={r.ipv6.enabled ? t("status.enabled") : t("status.disabled")}
        />
        <Field
          label={t("field.ipv6Leak")}
          value={<BoolValue yes={r.ipv6.country_mismatch} />}
        />
        <Field
          label={t("field.ipv6")}
          value={<Mono>{r.ipv6.public_ipv6 ?? "—"}</Mono>}
        />
      </Section>

      {/* 黑名单 */}
      <Section title={t("section.blacklist")} explain={r.blacklist.status.summary}>
        <Field
          label={t("field.reputation")}
          value={`${r.blacklist.reputation_score} / 100`}
        />
        <Field label={t("field.hitCount")} value={String(r.blacklist.hit_count)} />
        <div style={{ padding: "var(--space-3) var(--space-4)" }}>
          {r.blacklist.lists.map((l) => (
            <div
              key={l.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
              }}
            >
              <span className="mono" style={{ fontSize: 13 }}>
                {l.name}
              </span>
              <span
                className="detail-bool-no"
                style={!l.listed ? {} : { color: "var(--color-risk)" }}
              >
                {l.listed ? t("status.listed") : t("status.notListed")}
              </span>
            </div>
          ))}
        </div>
        <Field label={t("field.riskNote")} value={r.blacklist.status.summary} />
      </Section>

      {/* VPN 检测 */}
      <Section title={t("section.vpn")} explain={r.proxy.status.summary}>
        <Field label={t("field.hosting")} value={<BoolValue yes={r.proxy.is_hosting} />} />
        <Field label={t("field.proxy")} value={<BoolValue yes={r.proxy.is_proxy} />} />
        <Field label={t("field.vpn")} value={<BoolValue yes={r.proxy.is_vpn} />} />
        <Field label={t("field.tor")} value={<BoolValue yes={r.proxy.is_tor} />} />
        <Field
          label={t("field.residential")}
          value={<BoolValue yes={r.proxy.is_residential} />}
        />
        <Field label={t("field.mobile")} value={<BoolValue yes={r.proxy.is_mobile} />} />
        <Field label={t("field.cloud")} value={<BoolValue yes={r.proxy.is_cloud} />} />
      </Section>

      {/* AI 服务兼容性 */}
      <Section title={t("section.ai")}>
        {r.ai_services.services.map((s) => (
          <AiRow key={s.name} service={s} />
        ))}
      </Section>

      {/* 流媒体 */}
      <Section title={t("section.streaming")}>
        {r.streaming.services.map((s) => (
          <Field
            key={s.name}
            label={s.name}
            value={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span
                  className="detail-bool-no"
                  style={!s.accessible ? { color: "var(--color-risk)" } : {}}
                >
                  {s.accessible ? t("streaming.accessible") : t("streaming.blocked")}
                </span>
                {s.latency_ms != null && (
                  <span className="text-tertiary" style={{ fontSize: 13 }}>
                    {s.latency_ms}ms
                  </span>
                )}
              </span>
            }
          />
        ))}
      </Section>
    </div>
  );
}

// —— 子组件 ——

function Section({
  title,
  explain,
  children,
}: {
  title: string;
  explain?: string;
  children: ReactNode;
}) {
  return (
    <div className="detail-section">
      <div className="list-section-header">{title}</div>
      <div className="list-group">{children}</div>
      {explain && <div className="detail-explain">{explain}</div>}
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="list-row">
      <span className="list-row-label">{label}</span>
      <span className="list-row-value">{value}</span>
    </div>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="list-row-value-mono">{children}</span>;
}

function BoolValue({ yes }: { yes: boolean }) {
  const t = useT();
  return (
    <span className={yes ? "detail-bool-yes" : "detail-bool-no"}>
      {yes ? t("status.yes") : t("status.no")}
    </span>
  );
}

function Pills({ values }: { values: string[] }) {
  return (
    <span style={{ textAlign: "right" }}>
      {values.map((v) => (
        <span key={v} className="detail-pill">
          {v}
        </span>
      ))}
    </span>
  );
}

function AiRow({ service }: { service: AiServiceResult }) {
  const t = useT();
  const levelKey: Record<RiskLevel, TranslationKey> = {
    ok: "aiLevel.ok",
    warn: "aiLevel.warn",
    risk: "aiLevel.risk",
  };
  return (
    <div className="list-row">
      <span className="list-row-label">{service.name}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        {!service.reachable && (
          <span className="text-tertiary" style={{ fontSize: 13 }}>
            {t("ai.unreachable")}
          </span>
        )}
        {service.latency_ms != null && service.reachable && (
          <span className="text-tertiary" style={{ fontSize: 13 }}>
            {service.latency_ms}ms
          </span>
        )}
        <StatusBadge level={service.level} label={t(levelKey[service.level])} />
      </span>
    </div>
  );
}

function ipTypeLabel(type: IpType, t: ReturnType<typeof useT>): string {
  const key: Record<IpType, TranslationKey> = {
    residential: "ipType.residential",
    datacenter: "ipType.datacenter",
    mobile: "ipType.mobile",
    unknown: "ipType.unknown",
  };
  return t(key[type]);
}
