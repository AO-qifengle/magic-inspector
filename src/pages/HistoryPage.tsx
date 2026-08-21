import { useMemo, useState } from "react";
import { useT } from "../i18n";
import type { ReportSnapshot } from "../history/reportHistory";

interface Props { items: ReportSnapshot[]; onOpen: (item: ReportSnapshot) => void; onDelete: (id: string) => void; onClear: () => void; }

export function HistoryPage({ items, onOpen, onDelete, onClear }: Props) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const locale = useMemo(() => navigator.language || "zh-CN", []);
  return <div className="page">
    <div className="list-section-header">{t("history.title")}</div>
    {!items.length ? <div className="card history-empty"><p>{t("history.empty")}</p><span className="muted">{t("history.emptyHint")}</span></div> : <>
      <div className="list-group">
        {items.map((item) => <div className="history-row" key={item.id}>
          <button className="history-open" type="button" onClick={() => onOpen(item)}>
            <span>{new Date(item.createdAt).toLocaleString(locale)}</span>
            <span className="muted mono">{item.report.score}/100 · {item.report.speed.assessment.score}/100</span>
          </button>
          <button className="history-delete" type="button" aria-label={t("history.delete")} onClick={() => onDelete(item.id)}>×</button>
        </div>)}
      </div>
      {confirming ? <div className="report-actions"><button className="btn-ghost" type="button" onClick={() => setConfirming(false)}>{t("common.close")}</button><button className="btn-primary" type="button" onClick={() => { onClear(); setConfirming(false); }}>{t("history.confirmClear")}</button></div> : <button className="btn-ghost history-clear" type="button" onClick={() => setConfirming(true)}>{t("history.clear")}</button>}
    </>}
  </div>;
}
