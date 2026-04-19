import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DriverMapData {
  id: string;
  name: string;
  status: "CLEAR" | "TIGHT_HOS" | "INELIGIBLE" | "OFF_SHIFT" | "ASSIGNED";
  location: string;
  lat: number;
  lng: number;
  hosRemaining: number;
  load: string;
  lastUpdated: string;
  activeRoute?: {
    pickup: { lat: number; lng: number; city: string };
    dropoff: { lat: number; lng: number; city: string };
  };
}

// ─── Custom Icons ────────────────────────────────────────────────────────────

// Create colored SVG markers for different driver statuses
const createIcon = (colorClass: string) => {
  // Map our Tailwind colors to standard hex for the SVG stroke/fill
  const hexMap: Record<string, string> = {
    "text-success": "#10b981",    // Emerald 500
    "text-warning": "#f59e0b",    // Amber 500
    "text-danger": "#ef4444",     // Red 500
    "text-primary": "#facc15",    // Yellow 400 (Assigned)
    "text-muted-foreground": "#9ca3af", // Gray 400
  };

  const hex = hexMap[colorClass] || hexMap["text-success"];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${hex}" fill-opacity="0.2" stroke="${hex}" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="${hex}"/>
    </svg>
  `;

  return new L.DivIcon({
    className: "bg-transparent border-none",
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const ICONS = {
  CLEAR: createIcon("text-success"),
  TIGHT_HOS: createIcon("text-warning"),
  INELIGIBLE: createIcon("text-danger"),
  ASSIGNED: createIcon("text-primary"),
  OFF_SHIFT: createIcon("text-muted-foreground"),
};

// ─── Component ───────────────────────────────────────────────────────────────

export function FleetMap({ drivers, title }: { drivers: DriverMapData[]; title?: string }) {
  // Center roughly on Arizona/Southwest
  const center: [number, number] = [34.0, -111.0];

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-border shadow-inner bg-background">
      {title && (
        <div className="absolute top-4 left-4 z-[400] bg-background/80 backdrop-blur border border-border px-3 py-1.5 rounded-md shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono font-bold">
            {title}
          </p>
        </div>
      )}

      {/* Map Key */}
      <div className="absolute top-4 right-4 z-[400] bg-background/80 backdrop-blur border border-border px-3 py-2 rounded-md shadow-sm hidden sm:block">
        <div className="flex gap-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success ring-2 ring-success/30" /> Clear</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary ring-2 ring-primary/30" /> Assigned</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning ring-2 ring-warning/30" /> Tight</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger ring-2 ring-danger/30" /> Ineligible</span>
        </div>
      </div>

      <MapContainer 
        center={center} 
        zoom={6} 
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Dark mode styled map tiles (CartoDB Dark Matter) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {drivers.map((driver) => {
          // Draw a route line if the driver is assigned & we have coordinates
          const hasRoute = driver.activeRoute && driver.status === "ASSIGNED";

          return (
            <div key={driver.id}>
               {/* Note: Leaflet expects [lat, lng] arrays */}
              <Marker position={[driver.lat, driver.lng]} icon={ICONS[driver.status]}>
                <Popup className="dispatch-popup">
                  <div className="p-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        {driver.name.split(" ").map(n => n[0]).join("")}
                       </div>
                       <div>
                         <h4 className="font-bold text-sm leading-tight text-foreground">{driver.name}</h4>
                         <p className="text-[10px] text-muted-foreground uppercase">{driver.status.replace("_", " ")}</p>
                       </div>
                    </div>
                    
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium text-foreground">{driver.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">HOS Left:</span>
                        <span className="font-medium text-foreground">{driver.hosRemaining} hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Activity:</span>
                        <span className="font-medium text-foreground truncate max-w-[100px]" title={driver.load}>{driver.load}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Draw polyline A -> B for the current dispatch load */}
              {hasRoute && (
                <Polyline 
                  positions={[
                    [driver.activeRoute!.pickup.lat, driver.activeRoute!.pickup.lng],
                    [driver.activeRoute!.dropoff.lat, driver.activeRoute!.dropoff.lng]
                  ]}
                  pathOptions={{ color: '#facc15', weight: 3, dashArray: '5, 10', opacity: 0.8 }}
                />
              )}
            </div>
          );
        })}
        
        <FitMapBounds drivers={drivers} />
      </MapContainer>
    </div>
  );
}

// ─── Utility to auto-fit map view to pins ────────────────────────────────────

function FitMapBounds({ drivers }: { drivers: DriverMapData[] }) {
  const map = useMap();

  useEffect(() => {
    if (drivers.length === 0) return;

    const bounds = L.latLngBounds(drivers.map(d => [d.lat, d.lng] as [number, number]));
    
    // Also include load dropoff points so the route lines aren't cut off
    drivers.forEach(d => {
      if (d.activeRoute) {
        bounds.extend([d.activeRoute.dropoff.lat, d.activeRoute.dropoff.lng]);
        bounds.extend([d.activeRoute.pickup.lat, d.activeRoute.pickup.lng]);
      }
    });

    if (bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    }
  }, [drivers, map]);

  return null;
}
