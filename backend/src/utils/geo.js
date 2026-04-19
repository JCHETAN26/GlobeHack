/**
 * DispatchIQ — Geo Utilities
 * 
 * Haversine distance, road distance estimation, drive time calculation,
 * fuel cost estimation, and radius-based filtering.
 */

const EARTH_RADIUS_MILES = 3959;
const AVG_TRUCK_SPEED_MPH = 55;
const ROAD_DISTANCE_FACTOR = 1.3; // Road distance ≈ 1.3× straight-line distance
const DEFAULT_MPG = 6.0;
const DEFAULT_FUEL_PRICE = 3.85; // $/gallon national average

/**
 * Calculate straight-line distance between two lat/lng points using Haversine formula.
 * @returns {number} Distance in miles
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

/**
 * Estimate road distance using straight-line distance × road factor.
 * More accurate estimation than straight-line for trucking routes.
 * @returns {number} Estimated road distance in miles
 */
export function estimateRoadDistance(lat1, lng1, lat2, lng2) {
  return haversineDistance(lat1, lng1, lat2, lng2) * ROAD_DISTANCE_FACTOR;
}

/**
 * Estimate drive time based on road distance and average truck speed.
 * @returns {number} Estimated drive time in hours
 */
export function estimateDriveTime(distanceMiles, avgSpeedMph = AVG_TRUCK_SPEED_MPH) {
  if (distanceMiles <= 0) return 0;
  return distanceMiles / avgSpeedMph;
}

/**
 * Estimate fuel cost for a given distance.
 * @returns {number} Estimated fuel cost in dollars
 */
export function estimateFuelCost(distanceMiles, mpg = DEFAULT_MPG, pricePerGallon = DEFAULT_FUEL_PRICE) {
  if (distanceMiles <= 0) return 0;
  const gallonsNeeded = distanceMiles / mpg;
  return gallonsNeeded * pricePerGallon;
}

/**
 * Calculate estimated cost per mile including fuel, driver pay, and overhead.
 * Industry standard breakdown for small fleets:
 *   - Fuel: ~35% of CPM
 *   - Driver pay: ~30% of CPM
 *   - Insurance: ~10% of CPM
 *   - Maintenance: ~10% of CPM
 *   - Overhead: ~15% of CPM
 * 
 * @param {number} distanceMiles - Total distance
 * @param {number} fuelCost - Fuel cost for the trip
 * @param {number} driverPayPerMile - Driver pay rate per mile (default $0.55)
 * @returns {number} Estimated total cost per mile
 */
export function estimateCostPerMile(distanceMiles, fuelCost, driverPayPerMile = 0.55) {
  if (distanceMiles <= 0) return 0;
  const fuelPerMile = fuelCost / distanceMiles;
  const insurancePerMile = 0.18;
  const maintenancePerMile = 0.18;
  const overheadPerMile = 0.27;
  return fuelPerMile + driverPayPerMile + insurancePerMile + maintenancePerMile + overheadPerMile;
}

/**
 * Check if a point is within a given radius of another point.
 * @returns {boolean}
 */
export function isWithinRadius(lat1, lng1, lat2, lng2, radiusMiles) {
  return haversineDistance(lat1, lng1, lat2, lng2) <= radiusMiles;
}

/**
 * Find the bearing (direction) from point 1 to point 2.
 * @returns {number} Bearing in degrees (0 = North, 90 = East)
 */
export function bearing(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((toDeg(Math.atan2(y, x)) % 360) + 360) % 360;
}

/**
 * Format distance for display.
 * @returns {string}
 */
export function formatDistance(miles) {
  if (miles < 1) return `${Math.round(miles * 5280)} ft`;
  return `${Math.round(miles)} mi`;
}

/**
 * Format drive time for display.
 * @returns {string}
 */
export function formatDriveTime(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}hr`;
  return `${h}hr ${m}min`;
}
