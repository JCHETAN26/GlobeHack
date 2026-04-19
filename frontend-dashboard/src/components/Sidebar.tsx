import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, Truck, DollarSign, ShieldCheck } from "lucide-react";

const items = [
  { to: "/", label: "Fleet Readiness", icon: LayoutGrid },
  { to: "/assign", label: "Load Assignment", icon: Truck },
  { to: "/cost", label: "Cost Intelligence", icon: DollarSign },
  { to: "/hos", label: "HOS Compliance", icon: ShieldCheck },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="w-60 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center">
          <Truck className="h-4 w-4 text-primary" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">DispatchIQ</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white border border-transparent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-sidebar-border text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Live · ELD synced
        </div>
      </div>
    </aside>
  );
}
