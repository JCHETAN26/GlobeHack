/**
 * DispatchIQ — API Client
 *
 * Typed fetch wrappers for all backend endpoints.
 * All functions return parsed JSON responses.
 */

const API_BASE = "http://localhost:3001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type DriverStatus =
  | "clear"
  | "tight"
  | "ineligible"
  | "off_shift"
  | "assigned";

export interface DriverHOS {
  remaining: number;
  driveHours: number;
  onDutyHours: number;
  weeklyUsed: number;
  weeklyLimit: number;
  limitingFactor: string;
  dailyPercentage: number;
  weeklyPercentage: number;
}

export interface FleetDriver {
  id: string;
  name: string;
  photo: string | null;
  status: DriverStatus;
  statusEmoji: string;
  message: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    updatedAt: string;
  };
  hos: DriverHOS | null;
  truck: {
    id: string;
    type: string;
    hazmat: boolean;
  };
  currentLoad: {
    id: string;
    destination: string;
    status: string;
  } | null;
  lastUpdated: string;
}

export interface FleetReadiness {
  timestamp: string;
  totalDrivers: number;
  onShift: number;
  offShift: number;
  available: number;
  assigned: number;
  statusBreakdown: {
    clear: number;
    tight: number;
    ineligible: number;
    off_shift: number;
    assigned: number;
  };
  drivers: FleetDriver[];
}

export interface ComplianceDriver {
  id: string;
  name: string;
  status: string;
  statusEmoji: string;
  message: string;
  hosRemaining: number | null;
  weeklyHoursUsed: number;
  weeklyLimit: number;
  limitingFactor: string | null;
  currentLoadId: string | null;
}

export interface ComplianceResult {
  totalDrivers: number;
  onShift: number;
  offShift: number;
  clear: number;
  tight: number;
  ineligible: number;
  assigned: number;
  alerts: Alert[];
  drivers: ComplianceDriver[];
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  driverId: string;
  driverName: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface CostBreakdown {
  fuel: number;
  driverPay: number;
  insurance: number;
  maintenance: number;
  overhead: number;
}

export interface RecommendedDriver {
  driver: {
    id: string;
    name: string;
    phone: string;
    truckId: string;
    truckType: string;
  };
  reason: string;
  statusEmoji: string;
  deadheadMiles: number;
  hosRemaining: number;
  hosBuffer: number;
  tripRequires: string;
  estimatedCost: {
    totalMiles: number;
    loadedMiles: number;
    deadheadMiles: number;
    breakdown: CostBreakdown;
    totalCost: number;
    costPerMile: number;
    revenue: number;
    profit: number;
    margin: number;
  };
  estimatedTripProfit: number;
  costPerMile: number;
  vsFleetAverage: string;
  backhaul: {
    available: boolean;
    opportunity?: {
      load: {
        pickup: { city: string };
        dropoff: { city: string };
      };
      estimatedRevenue: number;
      distanceToPickup: number;
    };
    summary?: string;
    totalOpportunities?: number;
    message?: string;
  };
  compositeScore: number;
  scoreBreakdown: Record<string, { score: number; weight: number }>;
}

export interface AlternativeDriver {
  driver: {
    id: string;
    name: string;
    truckType: string;
  };
  statusEmoji: string;
  deadheadMiles: number;
  hosRemaining: number;
  costPerMile: number;
  estimatedProfit: number;
  compositeScore: number;
  reason: string;
}

export interface IneligibleDriver {
  id: string;
  name: string;
  status: string;
  statusEmoji: string;
  reason: string;
}

export interface DispatchRecommendation {
  loadId: string;
  load: {
    id: string;
    pickup: string;
    dropoff: string;
    estimatedDuration: string;
    estimatedDistance: string;
    weight: string;
    type: string;
    rate: string;
    ratePerMile: string;
  };
  recommendation: RecommendedDriver | null;
  alternatives?: AlternativeDriver[];
  message?: string;
  totalDrivers: number;
  eligibleCount: number;
  ineligibleCount: number;
  ineligible: IneligibleDriver[];
  generatedAt: string;
}

export interface WeeklySummary {
  period: string;
  generatedAt: string;
  tripCount: number;
  activeDrivers: number;
  totalDrivers: number;
  miles: {
    total: number;
    deadhead: number;
    deadheadPercentage: number;
    deadheadCost: number;
  };
  financials: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    margin: number;
  };
  costPerMile: {
    true: number;
    fuel: number;
    driverPay: number;
  };
  fuel: {
    totalSpend: number;
    totalGallons: number;
    avgPricePerGallon: number;
    receiptsCount: number;
  };
  driverRankings: {
    id: string;
    name: string;
    trips: number;
    miles: number;
    deadheadMiles: number;
    revenue: number;
    cost: number;
    costPerMile: number;
    deadheadPercentage: number;
    profit: number;
  }[];
  topPerformer: { name: string; costPerMile: number; trips: number } | null;
  worstPerformer: { name: string; costPerMile: number; trips: number } | null;
  mostExpensiveLane: { lane: string; costPerMile: number } | null;
  insight: string;
  message?: string;
}

export interface CostDashboard {
  period: string;
  generatedAt: string;
  overview: {
    tripCount: number;
    totalMiles: number;
    totalDeadheadMiles: number;
    deadheadPercentage: number;
    deadheadCost: number;
    trueCostPerMile: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    margin: number;
  };
  costBreakdown: {
    fuel: number;
    fuelPerMile: number;
    driverPay: number;
    driverPayPerMile: number;
    insurance: number;
    maintenance: number;
    overhead: number;
  };
  driverPerformance: {
    id: string;
    name: string;
    trips: number;
    totalMiles: number;
    deadheadMiles: number;
    totalCost: number;
    totalRevenue: number;
    fuelCost: number;
    costPerMile: number;
    deadheadPercentage: number;
    profit: number;
  }[];
  lanePerformance: {
    lane: { origin: string; destination: string };
    tripCount: number;
    avgCostPerMile: number;
    avgRevenuePerMile: number;
    bestDriver: { name: string; avgCostPerMile: number } | null;
  }[];
  message?: string;
}

// ─── API Functions ───────────────────────────────────────────────────────────

/** Fleet Readiness Board */
export function fetchFleetReadiness(): Promise<FleetReadiness> {
  return request<FleetReadiness>("/fleet/readiness");
}

/** HOS Compliance View */
export function fetchCompliance(): Promise<ComplianceResult> {
  return request<ComplianceResult>("/fleet/compliance");
}

/** Weekly Fleet Summary */
export function fetchWeeklySummary(): Promise<WeeklySummary> {
  return request<WeeklySummary>("/fleet/summary");
}

/** Cost Intelligence Dashboard */
export function fetchCostDashboard(days = 30): Promise<CostDashboard> {
  return request<CostDashboard>(`/fleet/cost?days=${days}`);
}

/** Get dispatch recommendation for a new load */
export function fetchDispatchRecommendation(input: {
  pickup: { lat: number; lng: number; city: string; address?: string };
  dropoff: { lat: number; lng: number; city: string; address?: string };
  weight: number;
  type: string;
  rate: number;
}): Promise<{
  load: Record<string, unknown>;
  recommendation: DispatchRecommendation;
}> {
  return request("/dispatch/recommend-new", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Assign a load to a driver */
export function assignLoadToDriver(loadId: string, driverId: string) {
  return request(`/loads/${loadId}/assign`, {
    method: "POST",
    body: JSON.stringify({ driverId }),
  });
}

/** Fetch alerts */
export function fetchAlerts(): Promise<{ count: number; alerts: Alert[] }> {
  return request("/fleet/alerts?unacknowledged=true");
}

/** Acknowledge an alert */
export function acknowledgeAlert(alertId: string) {
  return request(`/fleet/alerts/${alertId}/acknowledge`, { method: "POST" });
}
