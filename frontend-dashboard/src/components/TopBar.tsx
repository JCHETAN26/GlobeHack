import { Bell, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export function TopBar({ title }: { title: string }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = time.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-6">
      <div>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground/90 font-medium">Fleet:</span> Phoenix
          Operations
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          <span className="text-foreground font-medium">{timeStr}</span> ·{" "}
          {dateStr}
        </div>
        <button className="relative h-9 w-9 rounded-md border border-border hover:bg-accent flex items-center justify-center">
          <Bell className="h-4 w-4 text-foreground/80" />
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center">
            2
          </span>
        </button>
      </div>
    </header>
  );
}
