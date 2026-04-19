import { useEffect, useState } from "react";
import {
  getTruckRoute,
  type RouteWaypoint,
  type TruckRoute,
} from "@/lib/routing";

interface UseTruckRouteResult {
  route: TruckRoute | null;
  loading: boolean;
  error: string | null;
}

export function useTruckRoute(
  start?: RouteWaypoint,
  end?: RouteWaypoint,
): UseTruckRouteResult {
  const [route, setRoute] = useState<TruckRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!start || !end) {
      setRoute(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    getTruckRoute(start, end)
      .then((nextRoute) => {
        if (!cancelled) {
          setRoute(nextRoute);
        }
      })
      .catch((nextError: unknown) => {
        if (!cancelled) {
          setRoute(null);
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Failed to calculate route",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [start?.lat, start?.lng, end?.lat, end?.lng]);

  return { route, loading, error };
}
