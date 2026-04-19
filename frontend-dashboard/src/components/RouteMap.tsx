import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
}

interface RouteMapProps {
  pickup: Location;
  dropoff: Location;
  driverLocation?: Location;
  title?: string;
}

// Custom truck icon SVG with cargo design
const truckSVG = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
  <!-- Cargo area -->
  <rect x="8" y="20" width="45" height="35" rx="3" fill="${color}" opacity="0.9"/>
  <!-- Cargo lines -->
  <line x1="15" y1="26" x2="40" y2="26" stroke="white" stroke-width="2" opacity="0.7"/>
  <line x1="15" y1="32" x2="40" y2="32" stroke="white" stroke-width="2" opacity="0.7"/>
  <line x1="15" y1="38" x2="40" y2="38" stroke="white" stroke-width="2" opacity="0.7"/>
  <line x1="15" y1="44" x2="40" y2="44" stroke="white" stroke-width="2" opacity="0.7"/>
  
  <!-- Cab -->
  <rect x="50" y="24" width="26" height="31" rx="2" fill="#f97316"/>
  <!-- Cab window -->
  <rect x="55" y="28" width="16" height="12" rx="1" fill="#87ceeb" opacity="0.8"/>
  <!-- Cab door line -->
  <line x1="68" y1="24" x2="68" y2="55" stroke="#ea580c" stroke-width="1"/>
  
  <!-- Bumper -->
  <rect x="48" y="52" width="28" height="3" fill="#374151"/>
  
  <!-- Back wheel -->
  <circle cx="24" cy="62" r="8" fill="#1f2937"/>
  <circle cx="24" cy="62" r="5" fill="#4b5563"/>
  
  <!-- Front wheel -->
  <circle cx="66" cy="62" r="8" fill="#1f2937"/>
  <circle cx="66" cy="62" r="5" fill="#4b5563"/>
  
  <!-- Axle connection -->
  <line x1="30" y1="62" x2="60" y2="62" stroke="#6b7280" stroke-width="1.5"/>
</svg>
`;

const getTruckIconDataUrl = (color: string) => {
  return `data:image/svg+xml;base64,${btoa(truckSVG(color))}`;
};

// Custom icons for pickup, dropoff, and driver
const pickupIcon = L.icon({
  iconUrl: getTruckIconDataUrl("#22c55e"), // green truck
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const dropoffIcon = L.icon({
  iconUrl: getTruckIconDataUrl("#ef4444"), // red truck
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const driverIcon = L.icon({
  iconUrl: getTruckIconDataUrl("#3b82f6"), // blue truck
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Component to fit bounds
function FitBounds({ pickup, dropoff, driver }: { pickup: Location; dropoff: Location; driver?: Location }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng],
    ]);

    if (driver) {
      bounds.extend([driver.lat, driver.lng]);
    }

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [pickup, dropoff, driver, map]);

  return null;
}

export function RouteMap({ pickup, dropoff, driverLocation, title = "Route Map" }: RouteMapProps) {
  const center: [number, number] = [
    (pickup.lat + dropoff.lat) / 2,
    (pickup.lng + dropoff.lng) / 2,
  ];

  const routeLine: [number, number][] = [
    [pickup.lat, pickup.lng],
    [dropoff.lat, dropoff.lng],
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Route line */}
          <Polyline
            positions={routeLine}
            color="#3b82f6"
            weight={3}
            opacity={0.8}
            dashArray="5, 5"
          />

          {/* Pickup marker (Point A) */}
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Pickup (A)</p>
                <p className="text-xs text-muted-foreground">{pickup.address || pickup.city}</p>
              </div>
            </Popup>
          </Marker>

          {/* Dropoff marker (Point B) */}
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Dropoff (B)</p>
                <p className="text-xs text-muted-foreground">{dropoff.address || dropoff.city}</p>
              </div>
            </Popup>
          </Marker>

          {/* Driver location marker (if provided) */}
          {driverLocation && (
            <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Driver Location</p>
                  <p className="text-xs text-muted-foreground">{driverLocation.address || "Current location"}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Fit all points in view */}
          <FitBounds pickup={pickup} dropoff={dropoff} driver={driverLocation} />
        </MapContainer>
      </div>
    </div>
  );
}
