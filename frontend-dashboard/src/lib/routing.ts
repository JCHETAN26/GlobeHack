export interface RouteWaypoint {
  lat: number;
  lng: number;
}

export interface TruckRoute {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  provider: "openrouteservice" | "osrm";
  truckAware: boolean;
}

const routeCache = new Map<string, Promise<TruckRoute>>();

const OPENROUTESERVICE_API_KEY = import.meta.env.VITE_OPENROUTESERVICE_API_KEY;

function getCacheKey(start: RouteWaypoint, end: RouteWaypoint) {
  return `${start.lat},${start.lng}:${end.lat},${end.lng}`;
}

function toLatLngPairs(
  coordinates: number[][] | undefined,
): [number, number][] {
  if (!coordinates) return [];

  return coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
}

async function fetchOpenRouteServiceRoute(
  start: RouteWaypoint,
  end: RouteWaypoint,
): Promise<TruckRoute> {
  const res = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-hgv/geojson",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: OPENROUTESERVICE_API_KEY,
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat],
        ],
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`OpenRouteService error: ${res.status}`);
  }

  const data = await res.json();
  const feature = data?.features?.[0];
  const summary = feature?.properties?.summary;

  return {
    coordinates: toLatLngPairs(feature?.geometry?.coordinates),
    distanceMeters: summary?.distance ?? 0,
    durationSeconds: summary?.duration ?? 0,
    provider: "openrouteservice",
    truckAware: true,
  };
}

async function fetchOsrmRoute(
  start: RouteWaypoint,
  end: RouteWaypoint,
): Promise<TruckRoute> {
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "false",
  });
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`OSRM error: ${res.status}`);
  }

  const data = await res.json();
  const route = data?.routes?.[0];

  return {
    coordinates: toLatLngPairs(route?.geometry?.coordinates),
    distanceMeters: route?.distance ?? 0,
    durationSeconds: route?.duration ?? 0,
    provider: "osrm",
    truckAware: false,
  };
}

export async function fetchTruckRoute(
  start: RouteWaypoint,
  end: RouteWaypoint,
): Promise<TruckRoute> {
  if (OPENROUTESERVICE_API_KEY) {
    return fetchOpenRouteServiceRoute(start, end);
  }

  return fetchOsrmRoute(start, end);
}

export function getTruckRoute(
  start: RouteWaypoint,
  end: RouteWaypoint,
): Promise<TruckRoute> {
  const key = getCacheKey(start, end);
  const cached = routeCache.get(key);

  if (cached) {
    return cached;
  }

  const request = fetchTruckRoute(start, end).catch((error: unknown) => {
    routeCache.delete(key);
    throw error;
  });

  routeCache.set(key, request);
  return request;
}

export function formatRouteDistance(distanceMeters: number) {
  return `${(distanceMeters / 1609.344).toFixed(0)} mi`;
}

export function formatRouteDuration(durationSeconds: number) {
  const totalMinutes = Math.round(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}
