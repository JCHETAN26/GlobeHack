import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { ChatPanel } from "@/components/ChatPanel";
import { MapPin, Clock, Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchFleetReadiness,
  type FleetDriver,
  type FleetReadiness,
} from "@/lib/api";

export const Route = createFileRoute("/")({
  component: FleetBoard,
});

function FleetBoard() {
  const [data, setData] = useState<FleetReadiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchFleetReadiness()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 3000); // refresh every 3s
    return () => clearInterval(id);
  }, []);

  if (loading && !data) {
    return (
      <>
        <TopBar title="Fleet Readiness Board" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading fleet data…
          </span>
        </div>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <TopBar title="Fleet Readiness Board" />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <WifiOff className="h-8 w-8 text-danger" />
          <p className="text-sm text-danger font-medium">
            Failed to connect to backend
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

  const counts = data.statusBreakdown;
  const driverSummary = [
    `${counts.clear} available`,
    `${counts.assigned} assigned`,
    `${counts.tight} tight HOS`,
    `${counts.ineligible} blocked`,
  ].join(" · ");

  return (
    <>
      <TopBar title="Fleet Readiness Board" />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Driver list */}
        <div className="flex w-[30%] min-w-[340px] flex-col border-r border-border">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Drivers</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.totalDrivers} total · live ELD feed
              </p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              {new Date(data.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {data.drivers.map((d) => (
              <DriverCard key={d.id} d={d} />
            ))}
          </div>
        </div>

        {/* Ops assistant */}
        <div className="flex flex-1 min-w-0 flex-col gap-4 overflow-hidden p-5">
          <div className="grid grid-cols-4 gap-3">
            <StatChip label="Available" value={counts.clear} tone="success" />
            <StatChip label="Tight HOS" value={counts.tight} tone="warning" />
            <StatChip
              label="Ineligible"
              value={counts.ineligible}
              tone="danger"
            />
            <StatChip label="Off Shift" value={counts.off_shift} tone="muted" />
          </div>

          <div className="ops-card px-5 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-semibold">
                Fleet Copilot
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                Ask the board instead of scanning the map
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Check fleet status, HOS constraints, cost performance, and load
                recommendations in plain English.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/25 px-3 py-2 text-right shrink-0">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Live snapshot
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {driverSummary}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPanel
              embedded
              title="Fleet Operations Copilot"
              subtitle="Online · Ask about drivers, HOS, loads, and costs"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function DriverCard({ d }: { d: FleetDriver }) {
  const hosHours = d.hos?.remaining ?? 0;
  const pct = Math.min(100, (hosHours / 11) * 100);
  const initials = d.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const loadText = d.currentLoad
    ? `${d.currentLoad.destination} (${d.currentLoad.status})`
    : d.status === "off_shift"
      ? "Off Shift"
      : "Available";

  const timeSince = d.lastUpdated ? formatTimeAgo(d.lastUpdated) : "—";

  return (
    <div className="ops-card p-3 hover:border-primary/40 transition-colors cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold truncate">{d.name}</p>
            <LiveStatusBadge status={d.status} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">HOS Remaining</span>
            <span className="text-sm font-bold tabular-nums">
              {hosHours.toFixed(1)} hrs
            </span>
          </div>
          <div className="mt-1 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${hosBarColor(hosHours)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              {d.location.city}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeSince}
            </span>
          </div>
          <div className="mt-1.5 text-[11px]">
            <span className="text-muted-foreground">Load: </span>
            <span className="text-foreground/90 font-medium">{loadText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveStatusBadge({ status }: { status: string }) {
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

function hosBarColor(hours: number) {
  if (hours >= 6) return "bg-success";
  if (hours >= 3) return "bg-warning";
  return "bg-danger";
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr ago`;
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger" | "muted";
}) {
  const toneCls =
    tone === "success"
      ? "text-success border-success/30 bg-success/10"
      : tone === "warning"
        ? "text-warning border-warning/30 bg-warning/10"
        : tone === "danger"
          ? "text-danger  border-danger/30  bg-danger/10"
          : "text-muted-foreground border-border bg-muted/40";
  return (
    <div className={`ops-card px-4 py-3 border ${toneCls}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        <span className="text-[11px] uppercase tracking-wider font-medium opacity-90">
          {label}
        </span>
      </div>
    </div>
  );
}
