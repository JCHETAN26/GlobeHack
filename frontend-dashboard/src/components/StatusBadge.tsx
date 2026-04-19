import type { DriverStatus } from "@/lib/mockData";

const map: Record<DriverStatus, { label: string; cls: string; dot: string }> = {
  CLEAR:      { label: "CLEAR",       cls: "bg-success/15 text-success border-success/30",       dot: "bg-success" },
  TIGHT_HOS:  { label: "TIGHT HOS",   cls: "bg-warning/15 text-warning border-warning/30",       dot: "bg-warning" },
  INELIGIBLE: { label: "INELIGIBLE",  cls: "bg-danger/15 text-danger border-danger/30",          dot: "bg-danger" },
  OFF_SHIFT:  { label: "OFF SHIFT",   cls: "bg-muted text-muted-foreground border-border",       dot: "bg-muted-foreground" },
};

export function StatusBadge({ status, size = "md" }: { status: DriverStatus; size?: "sm" | "md" }) {
  const m = map[status];
  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-bold tracking-wide ${padding} ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function hosColor(hours: number) {
  if (hours >= 6) return "bg-success";
  if (hours >= 3) return "bg-warning";
  return "bg-danger";
}
