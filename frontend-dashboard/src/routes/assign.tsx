import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { RouteMap } from "@/components/RouteMap";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  fetchDispatchRecommendation,
  assignLoadToDriver,
  type DispatchRecommendation,
  type RecommendedDriver,
  type AlternativeDriver,
  type IneligibleDriver,
} from "@/lib/api";

export const Route = createFileRoute("/assign")({
  component: AssignPage,
});

// Location presets for the form
const LOCATIONS: Record<string, { lat: number; lng: number; city: string }> = {
  "Phoenix, AZ": { lat: 33.4484, lng: -112.074, city: "Phoenix, AZ" },
  "Tempe, AZ": { lat: 33.4255, lng: -111.94, city: "Tempe, AZ" },
  "Mesa, AZ": { lat: 33.4152, lng: -111.832, city: "Mesa, AZ" },
  "Scottsdale, AZ": { lat: 33.4942, lng: -111.926, city: "Scottsdale, AZ" },
  "Tucson, AZ": { lat: 32.2226, lng: -110.975, city: "Tucson, AZ" },
  "Dallas, TX": { lat: 32.7767, lng: -96.797, city: "Dallas, TX" },
  "Los Angeles, CA": { lat: 34.0522, lng: -118.244, city: "Los Angeles, CA" },
  "Las Vegas, NV": { lat: 36.1699, lng: -115.14, city: "Las Vegas, NV" },
  "Denver, CO": { lat: 39.7392, lng: -104.99, city: "Denver, CO" },
  "Albuquerque, NM": { lat: 35.0844, lng: -106.65, city: "Albuquerque, NM" },
  "El Paso, TX": { lat: 31.7619, lng: -106.485, city: "El Paso, TX" },
  "San Diego, CA": { lat: 32.7157, lng: -117.161, city: "San Diego, CA" },
  "Salt Lake City, UT": {
    lat: 40.7608,
    lng: -111.891,
    city: "Salt Lake City, UT",
  },
};

const TRUCK_TYPES = [
  { value: "dry_van", label: "Dry Van" },
  { value: "reefer", label: "Refrigerated" },
  { value: "flatbed", label: "Flatbed" },
  { value: "tanker", label: "Tanker" },
];

function AssignPage() {
  const [pickup, setPickup] = useState("Phoenix, AZ");
  const [dropoff, setDropoff] = useState("Dallas, TX");
  const [weight, setWeight] = useState("38000");
  const [type, setType] = useState("dry_van");
  const [rate, setRate] = useState("2800");

  const [result, setResult] = useState<DispatchRecommendation | null>(null);
  const [loadId, setLoadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigned, setAssigned] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const handleSubmit = async () => {
    const pickupLoc = LOCATIONS[pickup];
    const dropoffLoc = LOCATIONS[dropoff];
    if (!pickupLoc || !dropoffLoc) {
      setError("Invalid pickup or dropoff location");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setAssigned(false);

    try {
      const data = await fetchDispatchRecommendation({
        pickup: { ...pickupLoc, address: pickup },
        dropoff: { ...dropoffLoc, address: dropoff },
        weight: parseInt(weight),
        type,
        rate: parseFloat(rate),
      });
      setResult(data.recommendation);
      setLoadId(data.load?.id || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!loadId || !result?.recommendation) return;
    setAssigning(true);
    try {
      await assignLoadToDriver(loadId, result.recommendation.driver.id);
      setAssigned(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAssigning(false);
    }
  };

  const rec = result?.recommendation;
  const alternatives = result?.alternatives ?? [];
  const ineligible = result?.ineligible ?? [];

  return (
    <>
      <TopBar title="Load Assignment" />
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left panel: Form & Results */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Form */}
          <section className="ops-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">New Load</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter load details — AI evaluates all eligible drivers in
                  &lt;1s.
                </p>
              </div>
              <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/30 px-2 py-1 rounded uppercase tracking-wider">
                AI Dispatch
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Pickup Location
                </label>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  {Object.keys(LOCATIONS).map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Drop Location
                </label>
                <select
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  {Object.keys(LOCATIONS).map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Load Weight (lbs)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Load Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  {TRUCK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Rate ($)
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md py-2.5 text-sm transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {loading ? "Analyzing fleet…" : "Find Best Driver"}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-danger">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}
          </section>

          {/* Recommendation */}
          {rec && (
            <>
              <section className="ops-card border-2 border-primary/60 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-[11px] uppercase tracking-widest font-bold text-primary">
                      Recommended Driver
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-base font-bold text-primary shrink-0">
                      {rec.driver.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold">{rec.driver.name}</h3>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {rec.driver.truckType}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reason:{" "}
                        <span className="text-foreground/90">{rec.reason}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Match Score
                      </div>
                      <div className="text-3xl font-bold text-primary tabular-nums">
                        {Math.round(rec.compositeScore)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    <Stat label="Deadhead" value={`${rec.deadheadMiles} mi`} />
                    <Stat
                      label="HOS Remaining"
                      value={`${rec.hosRemaining} hrs`}
                    />
                    <Stat label="Est. Cost" value={`$${rec.costPerMile}/mi`} />
                    <Stat
                      label="Est. Profit"
                      value={`$${rec.estimatedTripProfit.toLocaleString()}`}
                      tone="success"
                    />
                  </div>

                  {rec.backhaul?.available && rec.backhaul.opportunity && (
                    <div className="mt-5 flex items-center gap-3 bg-success/10 border border-success/30 rounded-md px-4 py-3">
                      <RotateCcw className="h-4 w-4 text-success shrink-0" />
                      <p className="text-sm">
                        <span className="font-bold text-success">
                          Return Load Available
                        </span>
                        <span className="text-foreground/80">
                          {" "}
                          — {rec.backhaul.opportunity.distanceToPickup} mi from
                          drop.{" "}
                        </span>
                        <span className="font-bold text-success">
                          +$
                          {rec.backhaul.opportunity.estimatedRevenue.toLocaleString()}{" "}
                          revenue
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex gap-3">
                    {assigned ? (
                      <div className="inline-flex items-center gap-2 bg-success/20 text-success font-semibold rounded-md px-5 py-2.5 text-sm border border-success/40">
                        <CheckCircle2 className="h-4 w-4" />
                        Load Assigned to {rec.driver.name}
                      </div>
                    ) : (
                      <button
                        onClick={handleAssign}
                        disabled={assigning}
                        className="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold rounded-md px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
                      >
                        {assigning ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {assigning ? "Assigning…" : "Assign Load"}
                      </button>
                    )}
                    <button className="inline-flex items-center gap-2 border border-border hover:border-primary/50 hover:text-primary text-foreground/90 font-semibold rounded-md px-5 py-2.5 text-sm transition-colors">
                      See All Options
                    </button>
                  </div>
                </div>
              </section>

              {/* Alternative eligible */}
              {alternatives.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                    Other Eligible Drivers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {alternatives.map((d) => (
                      <div
                        key={d.driver.id}
                        className="ops-card p-4 flex items-center gap-3"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {d.driver.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">
                              {d.driver.name}
                            </p>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {d.driver.truckType}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Deadhead {d.deadheadMiles} mi · {d.hosRemaining} hrs
                            HOS · ${d.costPerMile}/mi
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase text-muted-foreground">
                            Score
                          </div>
                          <div className="text-lg font-bold tabular-nums">
                            {Math.round(d.compositeScore)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Ineligible */}
              {ineligible.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                    Ineligible Drivers
                  </h3>
                  <div className="space-y-2">
                    {ineligible.map((d) => (
                      <div
                        key={d.id}
                        className="rounded-lg border border-border bg-muted/20 px-4 py-3 flex items-center gap-3 opacity-80"
                      >
                        <XCircle className="h-4 w-4 text-danger shrink-0" />
                        <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {d.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground/80">
                            {d.name}
                          </p>
                          <p className="text-xs text-danger mt-0.5 truncate">
                            {d.reason}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-danger bg-danger/10 border border-danger/30 px-2 py-1 rounded shrink-0">
                          Blocked
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* No recommendation (all ineligible) */}
          {result && !rec && (
            <section className="ops-card border-2 border-danger/40 p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-danger" />
                <div>
                  <h3 className="text-lg font-bold text-danger">
                    No Eligible Drivers
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.message ||
                      "All drivers are ineligible for this load."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.totalDrivers} drivers checked ·{" "}
                    {result.ineligibleCount} ineligible
                  </p>
                </div>
              </div>
              {ineligible.length > 0 && (
                <div className="mt-4 space-y-2">
                  {ineligible.map((d) => (
                    <div
                      key={d.id}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <XCircle className="h-3 w-3 text-danger shrink-0" />
                      <span className="font-medium text-foreground/70">
                        {d.name}:
                      </span>
                      <span className="truncate">{d.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right panel: Map */}
        <div className="w-96 border-l border-border">
          <RouteMap
            pickup={LOCATIONS[pickup]}
            dropoff={LOCATIONS[dropoff]}
            title="Route Overview"
          />
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="rounded-md bg-background/50 border border-border px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-base font-bold tabular-nums mt-0.5 ${tone === "success" ? "text-success" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
