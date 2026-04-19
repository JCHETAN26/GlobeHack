/**
 * DispatchIQ — Smart Dispatch Engine
 *
 * The core decision-making engine. When a new load comes in, this engine:
 *   1. Filters out INELIGIBLE and OFF_SHIFT drivers (hard gate)
 *   2. Filters out trucks that don't match load requirements
 *   3. Scores remaining drivers on a weighted composite
 *   4. Ranks drivers 1–N
 *   5. Generates a recommendation with plain-language reasoning + dollar amounts
 *
 * Scoring dimensions:
 *   - Deadhead miles (25%): lower empty miles to pickup = better
 *   - HOS buffer (20%): more hours remaining above minimum = safer
 *   - Estimated cost (25%): lower total trip cost = more profitable
 *   - Driver performance (15%): historical on-time rate + cost efficiency
 *   - Return load availability (15%): backhaul opportunity near drop = bonus revenue
 */

import store from '../data/store.js';
import { estimateRoadDistance, estimateDriveTime, estimateFuelCost } from '../utils/geo.js';
import { checkEligibility, calculateHOSRemaining } from './hos.js';
import { estimateLoadCost } from './cost.js';
import { findBestBackhaul } from './backhaul.js';

// ─── Scoring Weights ─────────────────────────────────────────────────────────
const WEIGHTS = {
  deadhead: 0.25,
  hosBuf: 0.20,
  cost: 0.25,
  performance: 0.15,
  backhaul: 0.15,
};

// ─── Normalization Baselines ─────────────────────────────────────────────────
const MAX_DEADHEAD_MILES = 100;  // 100+ miles deadhead = score of 0
const MAX_HOS_BUFFER = 6;       // 6+ hours buffer = max score
const TARGET_CPM = 1.50;        // Ideal cost per mile
const MAX_CPM = 2.50;           // Worst acceptable CPM
const MAX_BACKHAUL_REVENUE = 2000; // Great backhaul = $2000+

/**
 * Generate dispatch recommendations for a load.
 * This is the primary entry point for the dispatch engine.
 *
 * @param {string} loadId - Load ID to generate recommendations for
 * @returns {Object} Full dispatch recommendation with ranked drivers
 */
export function generateRecommendation(loadId) {
  const load = store.getLoad(loadId);
  if (!load) {
    return { error: 'Load not found', loadId };
  }

  if (load.status !== 'available') {
    return { error: `Load is not available (status: ${load.status})`, loadId };
  }

  const allDrivers = store.getAllDrivers();
  const eligible = [];
  const ineligible = [];

  // ─── Phase 1: Filter ────────────────────────────────────────────────────

  for (const driver of allDrivers) {
    // Check HOS eligibility for this specific trip
    const eligibility = checkEligibility(driver, load.estimatedDuration);

    if (!eligibility.eligible) {
      ineligible.push({
        id: driver.id,
        name: driver.name,
        status: eligibility.status,
        statusEmoji: eligibility.statusEmoji,
        reason: eligibility.reason,
      });
      continue;
    }

    // Check truck compatibility
    const truckCheck = checkTruckCompatibility(driver.truck, load);
    if (!truckCheck.compatible) {
      ineligible.push({
        id: driver.id,
        name: driver.name,
        status: 'incompatible_truck',
        statusEmoji: '🚫',
        reason: truckCheck.reason,
      });
      continue;
    }

    eligible.push({ driver, eligibility });
  }

  if (eligible.length === 0) {
    return {
      loadId: load.id,
      load: summarizeLoad(load),
      recommendation: null,
      message: 'No eligible drivers for this load',
      totalDrivers: allDrivers.length,
      eligibleCount: 0,
      ineligibleCount: ineligible.length,
      ineligible,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Phase 2: Score ─────────────────────────────────────────────────────

  const scoredCandidates = [];

  for (const { driver, eligibility } of eligible) {
    const scores = scoreDriver(driver, load, eligibility);
    scoredCandidates.push(scores);
  }

  // ─── Phase 3: Rank ─────────────────────────────────────────────────────

  scoredCandidates.sort((a, b) => b.compositeScore - a.compositeScore);

  // ─── Phase 4: Generate Output ───────────────────────────────────────────

  const recommended = scoredCandidates[0];
  const alternatives = scoredCandidates.slice(1);

  // Determine primary reason for recommendation
  const primaryReason = determinePrimaryReason(recommended, scoredCandidates);

  return {
    loadId: load.id,
    load: summarizeLoad(load),
    recommendation: {
      driver: {
        id: recommended.driverId,
        name: recommended.driverName,
        phone: recommended.phone,
        truckId: recommended.truckId,
        truckType: recommended.truckType,
      },
      reason: primaryReason,
      statusEmoji: recommended.statusEmoji,
      deadheadMiles: recommended.deadheadMiles,
      hosRemaining: recommended.hosRemaining,
      hosBuffer: recommended.hosBuffer,
      tripRequires: `${load.estimatedDuration}hr + 1hr buffer`,
      estimatedCost: recommended.costEstimate,
      estimatedTripProfit: recommended.costEstimate.profit,
      costPerMile: recommended.costEstimate.costPerMile,
      vsFleetAverage: recommended.vsFleetAverage,
      backhaul: recommended.backhaul,
      compositeScore: recommended.compositeScore,
      scoreBreakdown: recommended.scoreBreakdown,
    },
    alternatives: alternatives.map((alt) => ({
      driver: {
        id: alt.driverId,
        name: alt.driverName,
        truckType: alt.truckType,
      },
      statusEmoji: alt.statusEmoji,
      deadheadMiles: alt.deadheadMiles,
      hosRemaining: alt.hosRemaining,
      costPerMile: alt.costEstimate.costPerMile,
      estimatedProfit: alt.costEstimate.profit,
      compositeScore: alt.compositeScore,
      reason: alt.topStrength,
    })),
    totalDrivers: allDrivers.length,
    eligibleCount: eligible.length,
    ineligibleCount: ineligible.length,
    ineligible,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Score a single driver for a specific load.
 *
 * @param {Object} driver - Driver object
 * @param {Object} load - Load object
 * @param {Object} eligibility - Eligibility check result from HOS engine
 * @returns {Object} Scored candidate with all metrics
 */
function scoreDriver(driver, load, eligibility) {
  // ─── Calculate Raw Metrics ──────────────────────────────────────────────

  // Deadhead: distance from driver to pickup
  const deadheadMiles = estimateRoadDistance(
    driver.location.lat, driver.location.lng,
    load.pickup.lat, load.pickup.lng
  );
  const deadheadTime = estimateDriveTime(deadheadMiles);

  // HOS: how much buffer above minimum
  const hos = calculateHOSRemaining(driver);
  const hosBuffer = eligibility.buffer;

  // Cost: estimate total trip cost including deadhead
  const costEstimate = estimateLoadCost(driver, load, deadheadMiles);

  // Performance: historical metrics
  const onTimeRate = driver.performance?.onTimeRate || 0.85;
  const historicalCPM = driver.performance?.avgCostPerMile || 2.00;

  // Fleet average CPM for comparison
  const fleetAvgCPM = getFleetAverageCPM();
  const vsFleetAverage = fleetAvgCPM > 0
    ? round2(((costEstimate.costPerMile - fleetAvgCPM) / fleetAvgCPM) * 100)
    : 0;

  // Backhaul: check for return loads near drop point
  const hosAfterTrip = hos.effectiveRemaining - load.estimatedDuration - deadheadTime;
  const backhaul = findBestBackhaul(
    load.dropoff,
    Math.max(0, hosAfterTrip),
    {
      truckType: driver.truck.type,
      maxWeight: driver.truck.maxWeight,
      hazmat: driver.truck.hazmat,
    }
  );

  // ─── Score Each Dimension ───────────────────────────────────────────────

  // Deadhead score: 0-100, lower miles = higher score
  const deadheadScore = Math.max(0, 100 - (deadheadMiles / MAX_DEADHEAD_MILES) * 100);

  // HOS buffer score: 0-100, more buffer = higher score
  const hosScore = Math.min(100, (hosBuffer / MAX_HOS_BUFFER) * 100);

  // Cost score: 0-100, lower CPM = higher score
  const cpmNormalized = (costEstimate.costPerMile - TARGET_CPM) / (MAX_CPM - TARGET_CPM);
  const costScore = Math.max(0, Math.min(100, (1 - cpmNormalized) * 100));

  // Performance score: 0-100, based on on-time rate + cost efficiency
  const onTimeScore = onTimeRate * 100;
  const costEffScore = Math.max(0, 100 - ((historicalCPM - TARGET_CPM) / (MAX_CPM - TARGET_CPM)) * 100);
  const performanceScore = onTimeScore * 0.6 + costEffScore * 0.4;

  // Backhaul score: 0-100, based on available return load revenue
  let backhaulScore = 0;
  if (backhaul.available) {
    backhaulScore = Math.min(100, (backhaul.opportunity.estimatedRevenue / MAX_BACKHAUL_REVENUE) * 100);
  }

  // ─── Composite Score ────────────────────────────────────────────────────

  const compositeScore = round2(
    deadheadScore * WEIGHTS.deadhead +
    hosScore * WEIGHTS.hosBuf +
    costScore * WEIGHTS.cost +
    performanceScore * WEIGHTS.performance +
    backhaulScore * WEIGHTS.backhaul
  );

  // Determine top strength
  const scoreMap = {
    'Closest to pickup': deadheadScore,
    'Most HOS buffer': hosScore,
    'Lowest cost': costScore,
    'Best performance record': performanceScore,
    'Best return load': backhaulScore,
  };
  const topStrength = Object.entries(scoreMap)
    .sort(([, a], [, b]) => b - a)[0][0];

  return {
    driverId: driver.id,
    driverName: driver.name,
    phone: driver.phone,
    truckId: driver.truck.id,
    truckType: driver.truck.type,
    statusEmoji: eligibility.statusEmoji,
    deadheadMiles: round2(deadheadMiles),
    deadheadTime: round2(deadheadTime),
    hosRemaining: hos.effectiveRemaining,
    hosBuffer: round2(hosBuffer),
    costEstimate,
    vsFleetAverage: `${vsFleetAverage >= 0 ? '+' : ''}${vsFleetAverage}%`,
    backhaul,
    compositeScore,
    scoreBreakdown: {
      deadhead: { score: round2(deadheadScore), weight: WEIGHTS.deadhead, miles: round2(deadheadMiles) },
      hos: { score: round2(hosScore), weight: WEIGHTS.hosBuf, buffer: round2(hosBuffer) },
      cost: { score: round2(costScore), weight: WEIGHTS.cost, cpm: costEstimate.costPerMile },
      performance: { score: round2(performanceScore), weight: WEIGHTS.performance, onTimeRate },
      backhaul: { score: round2(backhaulScore), weight: WEIGHTS.backhaul, available: backhaul.available },
    },
    topStrength,
  };
}

/**
 * Check if a truck is compatible with a load's requirements.
 *
 * @param {Object} truck - Truck profile
 * @param {Object} load - Load object
 * @returns {Object} { compatible, reason }
 */
function checkTruckCompatibility(truck, load) {
  // Type match
  if (truck.type !== load.type) {
    return {
      compatible: false,
      reason: `Truck type mismatch: truck is ${truck.type}, load requires ${load.type}`,
    };
  }

  // Weight capacity
  if (load.weight > truck.maxWeight) {
    return {
      compatible: false,
      reason: `Weight exceeds capacity: load is ${load.weight}lbs, truck max is ${truck.maxWeight}lbs`,
    };
  }

  // Hazmat requirement
  if (load.specialRequirements?.hazmat && !truck.hazmat) {
    return {
      compatible: false,
      reason: 'Load requires HazMat certification — truck/driver not certified',
    };
  }

  // Oversize requirement (flatbed)
  if (load.specialRequirements?.oversize && truck.type !== 'flatbed') {
    return {
      compatible: false,
      reason: 'Oversize load requires flatbed — truck is not flatbed',
    };
  }

  return { compatible: true, reason: 'Truck meets all load requirements' };
}

/**
 * Determine the primary reason the recommended driver was chosen.
 *
 * @param {Object} recommended - Top-scored driver
 * @param {Array} allCandidates - All scored candidates
 * @returns {string} Plain language reason
 */
function determinePrimaryReason(recommended, allCandidates) {
  const parts = [];

  // Check if they're the closest
  const closestByDeadhead = [...allCandidates].sort((a, b) => a.deadheadMiles - b.deadheadMiles)[0];
  if (closestByDeadhead.driverId === recommended.driverId) {
    parts.push(`Closest to pickup (${recommended.deadheadMiles} mi deadhead)`);
  }

  // Check if most HOS
  const mostHOS = [...allCandidates].sort((a, b) => b.hosRemaining - a.hosRemaining)[0];
  if (mostHOS.driverId === recommended.driverId) {
    parts.push(`Most HOS available (${recommended.hosRemaining}hr)`);
  }

  // Check if lowest cost
  const lowestCost = [...allCandidates].sort((a, b) => a.costEstimate.costPerMile - b.costEstimate.costPerMile)[0];
  if (lowestCost.driverId === recommended.driverId) {
    parts.push(`Lowest cost ($${recommended.costEstimate.costPerMile}/mi)`);
  }

  // Check if best backhaul
  if (recommended.backhaul.available) {
    parts.push(`Return load available ($${recommended.backhaul.opportunity.estimatedRevenue} revenue)`);
  }

  if (parts.length === 0) {
    parts.push(`Best overall fit (score: ${recommended.compositeScore})`);
  }

  return parts.join(' · ');
}

/**
 * Get fleet average cost per mile from driver performance data.
 *
 * @returns {number} Fleet average CPM
 */
function getFleetAverageCPM() {
  const drivers = store.getAllDrivers();
  const cpms = drivers
    .filter((d) => d.performance?.avgCostPerMile)
    .map((d) => d.performance.avgCostPerMile);

  if (cpms.length === 0) return 1.85; // default fallback
  return cpms.reduce((sum, cpm) => sum + cpm, 0) / cpms.length;
}

/**
 * Quick load assignment — assign a load to the recommended driver.
 *
 * @param {string} loadId - Load ID
 * @param {string} driverId - Driver ID to assign
 * @returns {Object} Assignment result
 */
export function assignLoad(loadId, driverId) {
  const load = store.getLoad(loadId);
  if (!load) return { error: 'Load not found' };
  if (load.status !== 'available') return { error: `Load is not available (status: ${load.status})` };

  const driver = store.getDriver(driverId);
  if (!driver) return { error: 'Driver not found' };
  if (driver.currentLoadId) return { error: `Driver already assigned to load ${driver.currentLoadId}` };

  // Final eligibility check
  const eligibility = checkEligibility(driver, load.estimatedDuration);
  if (!eligibility.eligible) {
    return { error: `Driver not eligible: ${eligibility.reason}` };
  }

  // Update load
  const updatedLoad = store.updateLoad(loadId, {
    status: 'assigned',
    assignedDriverId: driverId,
    assignedAt: new Date().toISOString(),
  });

  // Update driver
  const updatedDriver = store.updateDriver(driverId, {
    currentLoadId: loadId,
  });

  return {
    success: true,
    message: `Load ${loadId} assigned to ${driver.name}`,
    load: updatedLoad,
    driver: {
      id: updatedDriver.id,
      name: updatedDriver.name,
      hosRemaining: eligibility.hosRemaining,
      status: eligibility.status,
    },
    assignedAt: updatedLoad.assignedAt,
  };
}

/**
 * Driver accepts an assigned load — transitions to in_transit.
 *
 * @param {string} loadId - Load ID
 * @param {string} driverId - Driver ID confirming
 * @returns {Object} Acceptance result
 */
export function acceptLoad(loadId, driverId) {
  const load = store.getLoad(loadId);
  if (!load) return { error: 'Load not found' };
  if (load.status !== 'assigned') return { error: `Load is not in assigned status (status: ${load.status})` };
  if (load.assignedDriverId !== driverId) return { error: 'Load is not assigned to this driver' };

  const updatedLoad = store.updateLoad(loadId, {
    status: 'in_transit',
  });

  return {
    success: true,
    message: `${store.getDriver(driverId)?.name || driverId} accepted load ${loadId}`,
    load: updatedLoad,
  };
}

/**
 * Driver drops an assigned load — returns to available pool.
 *
 * @param {string} loadId - Load ID
 * @param {string} driverId - Driver ID dropping
 * @returns {Object} Drop result + new recommendation
 */
export function dropLoad(loadId, driverId) {
  const load = store.getLoad(loadId);
  if (!load) return { error: 'Load not found' };
  if (!['assigned', 'in_transit'].includes(load.status)) {
    return { error: `Cannot drop load in ${load.status} status` };
  }
  if (load.assignedDriverId !== driverId) return { error: 'Load is not assigned to this driver' };

  // Release the load
  const updatedLoad = store.updateLoad(loadId, {
    status: 'available',
    assignedDriverId: null,
    assignedAt: null,
  });

  // Free the driver
  store.updateDriver(driverId, { currentLoadId: null });

  // Generate new recommendation
  const newRecommendation = generateRecommendation(loadId);

  return {
    success: true,
    message: `${store.getDriver(driverId)?.name || driverId} dropped load ${loadId}`,
    load: updatedLoad,
    newRecommendation,
  };
}

/**
 * Mark a load as delivered and create a trip record.
 *
 * @param {string} loadId - Load ID
 * @param {string} driverId - Driver ID who delivered
 * @param {Object} deliveryData - Delivery specifics { fuelCost, deadheadMiles, detentionMinutes }
 * @returns {Object} Delivery confirmation + trip record
 */
export function completeDelivery(loadId, driverId, deliveryData = {}) {
  const load = store.getLoad(loadId);
  if (!load) return { error: 'Load not found' };
  if (load.status !== 'in_transit') return { error: `Load is not in transit (status: ${load.status})` };
  if (load.assignedDriverId !== driverId) return { error: 'Load is not assigned to this driver' };

  const driver = store.getDriver(driverId);
  const now = new Date().toISOString();

  // Mark load as delivered
  store.updateLoad(loadId, { status: 'delivered' });

  // Free the driver
  store.updateDriver(driverId, { currentLoadId: null });

  // Create trip record for cost intelligence
  const deadheadMiles = deliveryData.deadheadMiles || 0;
  const fuelCost = deliveryData.fuelCost || estimateFuelCost(load.estimatedDistance + deadheadMiles);
  const driverPay = (load.estimatedDistance + deadheadMiles) * 0.55;
  const estimatedCPM = estimateLoadCost(driver, load, deadheadMiles).costPerMile;
  const actualCPM = (fuelCost + driverPay + (load.estimatedDistance + deadheadMiles) * (0.18 + 0.18 + 0.27)) / (load.estimatedDistance + deadheadMiles);

  const trip = store.createTrip({
    loadId,
    driverId,
    lane: {
      origin: load.pickup.city,
      destination: load.dropoff.city,
    },
    pickup: load.pickup,
    dropoff: load.dropoff,
    estimatedCostPerMile: round2(estimatedCPM),
    actualCostPerMile: round2(actualCPM),
    totalMiles: load.estimatedDistance + deadheadMiles,
    deadheadMiles,
    fuelCost,
    revenue: load.rate,
    driverPay: round2(driverPay),
    arrivalTime: now,
    appointmentTime: load.deliveryDeadline,
    deliveredAt: now,
    detentionMinutes: deliveryData.detentionMinutes || 0,
  });

  return {
    success: true,
    message: `Load ${loadId} delivered by ${driver?.name || driverId}`,
    trip,
    loadRate: load.rate,
    estimatedProfit: round2(load.rate - (fuelCost + driverPay)),
  };
}

/**
 * Summarize load for output (strip unnecessary fields).
 */
function summarizeLoad(load) {
  return {
    id: load.id,
    pickup: load.pickup.city || load.pickup.address,
    dropoff: load.dropoff.city || load.dropoff.address,
    estimatedDuration: `${load.estimatedDuration}hr`,
    estimatedDistance: `${load.estimatedDistance}mi`,
    weight: `${load.weight}lbs`,
    type: load.type,
    rate: `$${load.rate}`,
    ratePerMile: `$${load.ratePerMile}/mi`,
  };
}

/**
 * Utility: round to 2 decimal places.
 */
function round2(num) {
  return Math.round(num * 100) / 100;
}
