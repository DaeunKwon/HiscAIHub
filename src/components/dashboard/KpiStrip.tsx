import type { KpiCard } from "@/lib/dashboard";

/** 목업 deltaHTML — 증감률이 없으면(전기간이 0) "—"로 둔다. */
export function PeriodDelta({ value }: { value: number | null }) {
  if (value == null) return <span className="d">전기간 대비 —</span>;
  const up = value >= 0;
  return (
    <span className={`d ${up ? "up" : "down"}`}>
      {up ? "▲" : "▼"} {Math.abs(value)}% 전기간 대비
    </span>
  );
}

export default function KpiStrip({ kpis }: { kpis: KpiCard[] }) {
  return (
    <div className="kpi-strip">
      {kpis.map((k) => (
        <div key={k.key} className={`kpi${k.spread ? " spread" : ""}`}>
          <div className="l">{k.label}</div>
          <div className="v">
            {k.value}
            <small>{k.unit}</small>
          </div>
          <PeriodDelta value={k.delta} />
        </div>
      ))}
    </div>
  );
}
