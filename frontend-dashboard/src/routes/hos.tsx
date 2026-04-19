import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchCompliance, type ComplianceResult } from "@/lib/api";

export const Route = createFileRoute("/hos")({
  component: HosPage,
});

function HosPage() {
  const [data, setData] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchCompliance()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  if (loading && !data) {
    return (
      <>
        <TopBar title="HOS Compliance" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading compliance data…
          </span>
        </div>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <TopBar title="HOS Compliance" />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <WifiOff className="h-8 w-8 text-danger" />
          <p className="text-sm text-danger font-medium">
            Failed to load compliance data
          </p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <button
            onClick={load}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  if (!data) return null;

  // Find drivers needing attention
  const dangerDrivers = data.drivers.filter(
    (d) =>
      d.status === "ineligible" ||
      (d.hosRemaining !== null &&
        d.hosRemaining <= 2 &&
        d.status !== "off_shift"),
  );
  const warningDrivers = data.drivers.filter(
    (d) =>
      d.status === "tight" ||
      (d.weeklyHoursUsed / d.weeklyLimit >= 0.85 &&
        d.status !== "off_shift" &&
        d.status !== "ineligible"),
  );
  const compliantCount = data.clear + data.assigned;

  return (
    <>
      <TopBar title="HOS Compliance" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Alert cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dangerDrivers.length > 0 ? (
            <AlertCard
              tone="danger"
              icon={<AlertTriangle className="h-5 w-5" />}
              title={
                dangerDrivers.length === 1
                  ? `Driver ${dangerDrivers[0].name}`
                  : `${dangerDrivers.length} Drivers at Limit`
              }
              body={dangerDrivers
                .map(
                  (d) =>
                    `${d.name}: ${d.hosRemaining?.toFixed(1) ?? 0} hrs remaining`,
                )
                .join(". ")}
            />
          ) : (
            <AlertCard
              tone="success"
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="No critical HOS alerts"
              body="All on-shift drivers have sufficient daily hours."
            />
          )}
          {warningDrivers.length > 0 ? (
            <AlertCard
              tone="warning"
              icon={<AlertCircle className="h-5 w-5" />}
              title={
                warningDrivers.length === 1
                  ? `Driver ${warningDrivers[0].name}`
                  : `${warningDrivers.length} Drivers Tight`
              }
              body={warningDrivers
                .map(
                  (d) =>
                    `${d.name}: ${d.weeklyHoursUsed}/${d.weeklyLimit} weekly hrs`,
                )
                .join(". ")}
            />
          ) : (
            <AlertCard
              tone="success"
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Weekly limits healthy"
              body="No drivers approaching weekly cycle limits."
            />
          )}
          <AlertCard
            tone="success"
            icon={<CheckCircle2 className="h-5 w-5" />}
            title={`${compliantCount} drivers compliant`}
            body={`${compliantCount} of ${data.totalDrivers} drivers within safe operating window.`}
          />
        </div>

        {/* Table */}
        <div className="ops-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Driver HOS Status</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Auto-synced from ELD · refreshes every 15s
              </p>
            </div>
            <span className="text-[10px] font-mono text-success bg-success/10 border border-success/30 px-2 py-1 rounded uppercase tracking-wider">
              Live
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Driver</th>
                  <th className="text-left font-medium px-5 py-3">Daily HOS</th>
                  <th className="text-left font-medium px-5 py-3">
                    Weekly Hours
                  </th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">
                    Limiting Factor
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.drivers.map((d, i) => {
                  const hosHours = d.hosRemaining ?? 0;
                  const hosPct = Math.min(100, (hosHours / 11) * 100);
                  const weekPct = (d.weeklyHoursUsed / d.weeklyLimit) * 100;
                  const weekTone =
                    weekPct >= 90
                      ? "bg-danger"
                      : weekPct >= 75
                        ? "bg-warning"
                        : "bg-success";
                  const initials = d.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2);

                  return (
                    <tr
                      key={d.id}
                      className={i % 2 === 0 ? "bg-table-row-alt/40" : ""}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                            {initials}
                          </div>
                          <span className="font-medium">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 max-w-[160px]">
                          <span className="tabular-nums font-semibold w-14">
                            {d.status === "off_shift"
                              ? "—"
                              : `${hosHours.toFixed(1)} hrs`}
                          </span>
                          {d.status !== "off_shift" && (
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${hosBarColor(hosHours)}`}
                                style={{ width: `${hosPct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 max-w-[180px]">
                          <span className="tabular-nums w-20 text-foreground/90">
                            {d.weeklyHoursUsed} / {d.weeklyLimit} hrs
                          </span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${weekTone}`}
                              style={{ width: `${weekPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <ComplianceStatusBadge status={d.status} />
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {d.limitingFactor
                          ? d.limitingFactor
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function hosBarColor(hours: number) {
  if (hours >= 6) return "bg-success";
  if (hours >= 3) return "bg-warning";
  return "bg-danger";
}

function ComplianceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    clear: {
      label: "CLEAR",
      cls: "bg-success/15 text-success border-success/30",
      dot: "bg-success",
    },
    tight: {
      label: "TIGHT HOS",
      cls: "bg-warning/15 text-warning border-warning/30",
      dot: "bg-warning",
    },
    ineligible: {
      label: "INELIGIBLE",
      cls: "bg-danger/15 text-danger border-danger/30",
      dot: "bg-danger",
    },
    off_shift: {
      label: "OFF SHIFT",
      cls: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground",
    },
    assigned: {
      label: "ASSIGNED",
      cls: "bg-primary/15 text-primary border-primary/30",
      dot: "bg-primary",
    },
  };
  const m = map[status] || map.clear;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-bold tracking-wide px-2 py-0.5 text-[10px] ${m.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function AlertCard({
  tone,
  icon,
  title,
  body,
}: {
  tone: "danger" | "warning" | "success";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const cls =
    tone === "danger"
      ? "border-danger/40 bg-danger/10 text-danger"
      : tone === "warning"
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border-success/40 bg-success/10 text-success";
  return (
    <div className={`rounded-lg border ${cls} p-4 flex gap-3`}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-foreground/80 mt-0.5">{body}</div>
      </div>
    </div>
  );
}
