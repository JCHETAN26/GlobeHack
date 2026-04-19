/**
 * DispatchIQ — Backhaul Intelligence Engine
 *
 * Scans the load board for available freight near a delivery drop point,
 * filters for HOS-eligible loads, and surfaces the best return load
 * opportunity alongside every dispatch recommendation.
 *
 * This engine turns empty return trips into revenue opportunities.
 */

import store from '../data/store.js';
import { haversineDistance, estimateRoadDistance, estimateDriveTime, estimateFuelCost } from '../utils/geo.js';

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_SEARCH_RADIUS_MILES = 25;
const MAX_SEARCH_RADIUS_MILES = 50;
const HOS_BUFFER_HOURS = 1; // Buffer required for backhaul trip too

/**
 * Find available return loads near a drop point.
 *
 * @param {Object} dropLocation - { lat, lng } of delivery drop point
 * @param {number} driverHOSAfterTrip - Estimated HOS remaining after delivering the primary load
 * @param {Object} options - Search options
 * @param {number} options.radiusMiles - Search radius (default 25 miles)
 * @param {string} options.truckType - Filter by truck type compatibility
 * @param {number} options.maxWeight - Filter by truck weight capacity
 * @param {boolean} options.hazmat - Filter by hazmat certification
 * @returns {Array} Scored and ranked return load opportunities
 */
export function findReturnLoads(dropLocation, driverHOSAfterTrip, options = {}) {
  const {
    radiusMiles = DEFAULT_SEARCH_RADIUS_MILES,
    truckType = null,
    maxWeight = null,
    hazmat = false,
  } = options;

  const allLoads = store.getAllLoadBoardEntries();

  const opportunities = [];

  for (const load of allLoads) {
    // Calculate distance from drop point to load pickup
    const distanceToPickup = haversineDistance(
      dropLocation.lat, dropLocation.lng,
      load.pickup.lat, load.pickup.lng
    );

    // Filter: must be within search radius
    if (distanceToPickup > radiusMiles) continue;

    // Filter: truck type compatibility
    if (truckType && load.type !== truckType) continue;

    // Filter: weight capacity
    if (maxWeight && load.weight > maxWeight) continue;

    // Filter: hazmat requirement (load requires hazmat but driver isn't certified)
    if (load.specialRequirements?.hazmat && !hazmat) continue;

    // Calculate trip details
    const deadheadToPickup = estimateRoadDistance(
      dropLocation.lat, dropLocation.lng,
      load.pickup.lat, load.pickup.lng
    );
    const driveTimeToPickup = estimateDriveTime(deadheadToPickup);
    const totalTimeNeeded = driveTimeToPickup + load.estimatedDuration + HOS_BUFFER_HOURS;

    // Filter: HOS eligibility for backhaul
    if (driverHOSAfterTrip < totalTimeNeeded) continue;

    // Score the opportunity
    const score = scoreBackhaulOpportunity(load, {
      distanceToPickup,
      deadheadToPickup,
      driveTimeToPickup,
      driverHOSAfterTrip,
      totalTimeNeeded,
    });

    opportunities.push({
      load,
      distanceToPickup: round2(distanceToPickup),
      deadheadToPickup: round2(deadheadToPickup),
      driveTimeToPickup: round2(driveTimeToPickup),
      totalTimeNeeded: round2(totalTimeNeeded),
      hosRemainingAfter: round2(driverHOSAfterTrip - totalTimeNeeded),
      estimatedRevenue: load.rate,
      estimatedFuelCost: round2(estimateFuelCost(deadheadToPickup + load.estimatedDistance)),
      estimatedProfit: round2(load.rate - estimateFuelCost(deadheadToPickup + load.estimatedDistance)),
      score,
    });
  }

  // Sort by score (highest = best opportunity)
  return opportunities.sort((a, b) => b.score - a.score);
}

/**
 * Score a backhaul opportunity. Higher = better.
 *
 * Scoring factors:
 *   - Revenue (40% weight): higher rate = better
 *   - Proximity (30% weight): closer pickup = less deadhead waste
 *   - HOS fit (20% weight): more buffer = safer
 *   - Rate per mile (10% weight): higher RPM = more efficient
 *
 * @param {Object} load - Load board entry
 * @param {Object} metrics - Calculated trip metrics
 * @returns {number} Composite score (0-100)
 */
function scoreBackhaulOpportunity(load, metrics) {
  // Revenue score: normalize against $2000 (a "great" load)
  const revenueScore = Math.min(100, (load.rate / 2000) * 100);

  // Proximity score: inverse of distance (closer = better)
  // 0 miles = 100, 25 miles = 0
  const proximityScore = Math.max(0, 100 - (metrics.distanceToPickup / MAX_SEARCH_RADIUS_MILES) * 100);

  // HOS fit score: how much buffer remains after backhaul
  const hosBuffer = metrics.driverHOSAfterTrip - metrics.totalTimeNeeded;
  const hosScore = Math.min(100, (hosBuffer / 3) * 100); // 3+ hours buffer = max score

  // Rate per mile score
  const rpmScore = Math.min(100, (load.ratePerMile / 4) * 100); // $4+/mile = max score

  // Weighted composite
  const score = (
    revenueScore * 0.40 +
    proximityScore * 0.30 +
    hosScore * 0.20 +
    rpmScore * 0.10
  );

  return round2(score);
}

/**
 * Find the best single backhaul opportunity for a given scenario.
 *
 * @param {Object} dropLocation - { lat, lng } of delivery drop point  
 * @param {number} driverHOSAfterTrip - Estimated HOS remaining after primary load
 * @param {Object} options - Truck compatibility filters
 * @returns {Object|null} Best backhaul opportunity or null if none found
 */
export function findBestBackhaul(dropLocation, driverHOSAfterTrip, options = {}) {
  const opportunities = findReturnLoads(dropLocation, driverHOSAfterTrip, options);
  
  if (opportunities.length === 0) {
    return {
      available: false,
      message: 'No return loads available within search radius matching driver eligibility',
      searchRadius: options.radiusMiles || DEFAULT_SEARCH_RADIUS_MILES,
    };
  }

  const best = opportunities[0];
  return {
    available: true,
    opportunity: best,
    totalOpportunities: opportunities.length,
    summary: `Return load available ${round2(best.distanceToPickup)} miles from drop: ` +
      `${best.load.pickup.city} → ${best.load.dropoff.city}, ` +
      `$${best.estimatedRevenue} revenue, ${round2(best.load.estimatedDuration)}hr trip. ` +
      `${round2(best.hosRemainingAfter)}hr HOS remaining after completion.`,
  };
}

/**
 * Utility: round to 2 decimal places.
 */
function round2(num) {
  return Math.round(num * 100) / 100;
}
