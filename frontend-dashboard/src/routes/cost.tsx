import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { TrendingUp, TrendingDown, Lightbulb, Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchCostDashboard, fetchWeeklySummary, type CostDashboard, type WeeklySummary } from "@/lib/api";

export const Route = createFileRoute("/cost")({
  component: CostPage,
});

function CostPage() {
  const [cost, setCost] = useState<CostDashboard | null>(null);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchCostDashboard(30), fetchWeeklySummary()])
      .then(([c, s]) => { setCost(c); setSummary(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <TopBar title="Cost Intelligence" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading cost data…</span>
        </div>
      </>
    );
  }

  if (error || !cost) {
    return (
      <>
        <TopBar title="Cost Intelligence" />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <WifiOff className="h-8 w-8 text-danger" />
          <p className="text-sm text-danger font-medium">Failed to load cost data</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </>
    );
  }

  const o = cost.overview;
  const drivers = cost.driverPerformance ?? [];
  const lanes = cost.lanePerformance ?? [];
  const fleetAvg = o.trueCostPerMile;
  const maxCPM = Math.max(...drivers.map((d) => d.costPerMile), 2.2) * 1.05;
  const insight = summary?.insight || "";

  return (
    <>
      <TopBar title="Cost Intelligence" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stat row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="True Cost Per Mile"
            value={`$${o.trueCostPerMile.toFixed(2)}`}
            sub={
              o.trueCostPerMile > 1.85
                ? <span className="text-danger inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" />Above $1.85 target</span>
                : <span className="text-success inline-flex items-center gap-1"><TrendingDown className="h-3 w-3" />On target</span>
            }
          />
          <MetricCard
            label="Total Deadhead Miles"
            value={`${Math.round(o.totalDeadheadMiles)} mi`}
            sub={<span className="text-danger">${Math.round(o.deadheadCost)} wasted</span>}
          />
          <MetricCard
            label="Fuel Spend"
            value={`$${cost.costBreakdown.fuel.toLocaleString()}`}
            sub={<span className="text-muted-foreground">avg ${cost.costBreakdown.fuelPerMile.toFixed(2)}/mi</span>}
          />
          <MetricCard
            label="Profit Margin"
            value={`${o.margin.toFixed(0)}%`}
            valueClass={o.margin >= 25 ? "text-success" : "text-warning"}
            sub={<span className={o.margin >= 25 ? "text-success" : "text-warning"}>${o.totalProfit.toLocaleString()} profit</span>}
          />
        </div>

        {/* Chart + Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="ops-card p-5 lg:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold">Cost Per Mile by Driver</h3>
              <span className="text-[11px] text-muted-foreground">Fleet avg <span className="font-bold text-foreground">${fleetAvg.toFixed(2)}</span></span>
            </div>
            <div className="space-y-3 relative">
              {drivers.map((d) => {
                const pct = (d.costPerMile / maxCPM) * 100;
                const above = d.costPerMile > fleetAvg;
                return (
                  <div key={d.id} className="flex items-center gap-3">
                    <div className="w-[140px] text-xs truncate">{d.name}</div>
                    <div className="flex-1 h-7 bg-muted/40 rounded relative overflow-hidden">
                      <div
                        className={`h-full ${above ? "bg-danger/70" : "bg-success/70"} flex items-center justify-end pr-2 text-[11px] font-bold text-background`}
                        style={{ width: `${pct}%` }}
                      >
                        ${d.costPerMile.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ops-card p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Cost Breakdown ({cost.period})</h3>
            <div className="space-y-2.5 text-sm">
              <Row label="Fuel Cost" value={`$${cost.costBreakdown.fuel.toLocaleString()}`} />
              <Row label="Deadhead Waste" value={`$${Math.round(o.deadheadCost)}`} tone="danger" />
              <Row label="Driver Pay" value={`$${cost.costBreakdown.driverPay.toLocaleString()}`} />
              <Row label="Insurance" value={`$${Math.round(cost.costBreakdown.insurance)}`} />
              <Row label="Maintenance" value={`$${Math.round(cost.costBreakdown.maintenance)}`} />
              <div className="h-px bg-border my-2" />
              <Row label="True Total Cost" value={`$${o.totalCost.toLocaleString()}`} bold />
              <Row label="Revenue" value={`$${o.totalRevenue.toLocaleString()}`} tone="success" bold />
              <div className="h-px bg-border my-2" />
              <Row label="Net Margin" value={`${o.margin.toFixed(0)}%`} tone={o.margin >= 25 ? "success" : "danger"} bold large />
            </div>
          </div>
        </div>

        {/* AI Insight */}
        {insight && (
          <div className="ops-card p-5 border-l-4 border-l-primary flex gap-4">
            <div className="h-10 w-10 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-widest font-bold text-primary mb-1">AI Insight</div>
              <p className="text-sm text-foreground/90 leading-relaxed">{insight}</p>
            </div>
          </div>
        )}

        {/* Lane perf */}
        {lanes.length > 0 && (
          <div className="ops-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">Lane Performance</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Lane</th>
                  <th className="text-left font-medium px-5 py-3">Avg CPM</th>
                  <th className="text-left font-medium px-5 py-3">Trips</th>
                  <th className="text-left font-medium px-5 py-3">Best Driver</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {lanes.map((l, i) => {
                  const status = l.avgCostPerMile <= 1.80 ? "Healthy" : l.avgCostPerMile <= 1.90 ? "Watch" : "Underperforming";
                  return (
                    <tr key={`${l.lane.origin}-${l.lane.destination}`} className={i % 2 === 0 ? "bg-table-row-alt/40" : ""}>
                      <td className="px-5 py-3 font-medium">{l.lane.origin} → {l.lane.destination}</td>
                      <td className="px-5 py-3 tabular-nums">${l.avgCostPerMile.toFixed(2)}</td>
                      <td className="px-5 py-3 tabular-nums">{l.tripCount}</td>
                      <td className="px-5 py-3 text-foreground/80">{l.bestDriver?.name || "—"}</td>
                      <td className="px-5 py-3"><LaneStatus status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function MetricCard({ label, value, sub, valueClass }: { label: string; value: string; sub?: React.ReactNode; valueClass?: string }) {
  return (
    <div className="ops-card p-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className={`mt-2 text-3xl font-bold tabular-nums ${valueClass ?? ""}`}>{value}</div>
      {sub && <div className="mt-1.5 text-xs">{sub}</div>}
    </div>
  );
}

function Row({ label, value, tone, bold, large }: { label: string; value: string; tone?: "success" | "danger"; bold?: boolean; large?: boolean }) {
  const t = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "";
  return (
    <div className="flex items-center justify-between">
      <span className={`text-muted-foreground ${bold ? "text-foreground font-semibold" : ""}`}>{label}</span>
      <span className={`tabular-nums ${t} ${bold ? "font-bold" : ""} ${large ? "text-xl" : ""}`}>{value}</span>
    </div>
  );
}

function LaneStatus({ status }: { status: string }) {
  const cls =
    status === "Healthy" ? "text-success bg-success/10 border-success/30" :
    status === "Watch" ? "text-warning bg-warning/10 border-warning/30" :
    "text-danger bg-danger/10 border-danger/30";
  return <span className={`text-[10px] uppercase tracking-wider font-bold border px-2 py-1 rounded ${cls}`}>{status}</span>;
}
