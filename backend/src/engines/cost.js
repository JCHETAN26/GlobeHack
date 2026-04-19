/**
 * DispatchIQ — Cost Intelligence Engine
 *
 * Tracks and analyzes the true cost of fleet operations:
 *   - Per-load cost breakdown (estimated vs actual)
 *   - Per-driver rolling performance (30-day)
 *   - Per-lane profitability analysis
 *   - Fleet-wide weekly summary
 *
 * Cost components tracked:
 *   - Fuel (from driver receipt uploads)
 *   - Deadhead miles (empty miles to pickup)
 *   - Driver pay (per-mile rate)
 *   - Insurance (fleet average per mile)
 *   - Maintenance (fleet average per mile)
 *   - Overhead (fleet average per mile)
 *   - Detention (flagged when >2 hours at facility)
 */

import store from '../data/store.js';
import { estimateFuelCost, estimateCostPerMile } from '../utils/geo.js';

// ─── Constants ───────────────────────────────────────────────────────────────
const DRIVER_PAY_PER_MILE = 0.55;
const INSURANCE_PER_MILE = 0.18;
const MAINTENANCE_PER_MILE = 0.18;
const OVERHEAD_PER_MILE = 0.27;
const DETENTION_THRESHOLD_MINUTES = 120; // 2 hours
const DETENTION_RATE_PER_HOUR = 75; // $/hour after threshold

/**
 * Calculate cost breakdown for a single trip.
 *
 * @param {Object} trip - Trip object from store
 * @returns {Object} Detailed cost breakdown
 */
export function calculateTripCost(trip) {
  const { totalMiles, deadheadMiles, fuelCost, revenue, driverPay, detentionMinutes } = trip;

  const loadedMiles = totalMiles - deadheadMiles;
  const deadheadPercentage = totalMiles > 0 ? deadheadMiles / totalMiles : 0;

  // Detention fee calculation
  const detentionHours = Math.max(0, detentionMinutes - DETENTION_THRESHOLD_MINUTES) / 60;
  const detentionFee = detentionHours * DETENTION_RATE_PER_HOUR;

  // Fixed costs per mile
  const insuranceCost = totalMiles * INSURANCE_PER_MILE;
  const maintenanceCost = totalMiles * MAINTENANCE_PER_MILE;
  const overheadCost = totalMiles * OVERHEAD_PER_MILE;

  // Total cost
  const totalCost = fuelCost + driverPay + insuranceCost + maintenanceCost + overheadCost + detentionFee;
  const costPerMile = totalMiles > 0 ? totalCost / totalMiles : 0;
  const revenuePerMile = totalMiles > 0 ? revenue / totalMiles : 0;
  const profitPerMile = revenuePerMile - costPerMile;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  // Deadhead cost (cost of empty miles)
  const deadheadCost = deadheadMiles * costPerMile;

  return {
    tripId: trip.id,
    loadId: trip.loadId,
    driverId: trip.driverId,
    lane: trip.lane,
    totalMiles: round2(totalMiles),
    loadedMiles: round2(loadedMiles),
    deadheadMiles: round2(deadheadMiles),
    deadheadPercentage: round2(deadheadPercentage * 100),
    breakdown: {
      fuel: round2(fuelCost),
      driverPay: round2(driverPay),
      insurance: round2(insuranceCost),
      maintenance: round2(maintenanceCost),
      overhead: round2(overheadCost),
      detention: round2(detentionFee),
    },
    totalCost: round2(totalCost),
    costPerMile: round2(costPerMile),
    estimatedCostPerMile: round2(trip.estimatedCostPerMile),
    variance: round2(trip.actualCostPerMile - trip.estimatedCostPerMile),
    revenue: round2(revenue),
    revenuePerMile: round2(revenuePerMile),
    profit: round2(profit),
    profitPerMile: round2(profitPerMile),
    margin: round2(margin),
    deadheadCost: round2(deadheadCost),
    detentionMinutes,
    detentionFlagged: detentionMinutes > DETENTION_THRESHOLD_MINUTES,
  };
}

/**
 * Get performance stats for a specific driver over a time period.
 *
 * @param {string} driverId - Driver ID
 * @param {number} days - Lookback period in days (default 30)
 * @returns {Object} Driver performance stats
 */
export function getDriverStats(driverId, days = 30) {
  const driver = store.getDriver(driverId);
  if (!driver) return null;

  const trips = store.getTripsForDriver(driverId, days);
  const fuelReceipts = store.getFuelReceiptsForDriver(driverId, days);

  if (trips.length === 0) {
    return {
      driverId,
      driverName: driver.name,
      period: `${days} days`,
      tripCount: 0,
      message: 'No completed trips in this period',
    };
  }

  // Aggregate trip data
  let totalMiles = 0;
  let totalDeadheadMiles = 0;
  let totalFuelCost = 0;
  let totalRevenue = 0;
  let totalDriverPay = 0;
  let totalDetentionMinutes = 0;
  let onTimeCount = 0;

  const tripCosts = [];

  for (const trip of trips) {
    const cost = calculateTripCost(trip);
    tripCosts.push(cost);
    totalMiles += trip.totalMiles;
    totalDeadheadMiles += trip.deadheadMiles;
    totalFuelCost += trip.fuelCost;
    totalRevenue += trip.revenue;
    totalDriverPay += trip.driverPay;
    totalDetentionMinutes += trip.detentionMinutes;

    // On-time if arrived within 30 minutes of appointment
    if (trip.arrivalTime && trip.appointmentTime) {
      const diff = Math.abs(new Date(trip.arrivalTime) - new Date(trip.appointmentTime)) / 60000;
      if (diff <= 30) onTimeCount++;
    }
  }

  // Fuel analysis
  const totalFuelGallons = fuelReceipts.reduce((sum, r) => sum + r.gallons, 0);
  const avgFuelPrice = fuelReceipts.length > 0
    ? fuelReceipts.reduce((sum, r) => sum + r.pricePerGallon, 0) / fuelReceipts.length
    : 0;
  const fuelEfficiency = totalFuelGallons > 0 ? totalMiles / totalFuelGallons : 0;

  // Cost metrics
  const totalCost = tripCosts.reduce((sum, tc) => sum + tc.totalCost, 0);
  const avgCostPerMile = totalMiles > 0 ? totalCost / totalMiles : 0;
  const avgRevenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;
  const totalProfit = totalRevenue - totalCost;

  return {
    driverId,
    driverName: driver.name,
    period: `${days} days`,
    tripCount: trips.length,
    totalMiles: round2(totalMiles),
    totalDeadheadMiles: round2(totalDeadheadMiles),
    deadheadPercentage: round2((totalDeadheadMiles / totalMiles) * 100),
    onTimeRate: round2(onTimeCount / trips.length),
    onTimeCount,
    avgCostPerMile: round2(avgCostPerMile),
    avgRevenuePerMile: round2(avgRevenuePerMile),
    totalRevenue: round2(totalRevenue),
    totalCost: round2(totalCost),
    totalProfit: round2(totalProfit),
    totalFuelCost: round2(totalFuelCost),
    totalDriverPay: round2(totalDriverPay),
    fuelEfficiency: round2(fuelEfficiency),
    avgFuelPrice: round2(avgFuelPrice),
    detentionMinutes: totalDetentionMinutes,
    trips: tripCosts,
  };
}

/**
 * Get performance stats for a specific lane.
 *
 * @param {string} origin - Origin city
 * @param {string} destination - Destination city
 * @returns {Object} Lane performance stats
 */
export function getLaneStats(origin, destination) {
  const trips = store.getTripsByLane(origin, destination);

  if (trips.length === 0) {
    return {
      lane: { origin, destination },
      tripCount: 0,
      message: 'No completed trips on this lane',
    };
  }

  const tripCosts = trips.map((t) => calculateTripCost(t));

  const totalMiles = trips.reduce((sum, t) => sum + t.totalMiles, 0);
  const totalRevenue = trips.reduce((sum, t) => sum + t.revenue, 0);
  const totalCost = tripCosts.reduce((sum, tc) => sum + tc.totalCost, 0);
  const avgCPM = totalMiles > 0 ? totalCost / totalMiles : 0;
  const avgRPM = totalMiles > 0 ? totalRevenue / totalMiles : 0;

  // Find best and worst performing drivers on this lane
  const driverPerf = {};
  for (const tc of tripCosts) {
    if (!driverPerf[tc.driverId]) {
      driverPerf[tc.driverId] = { trips: 0, totalCPM: 0 };
    }
    driverPerf[tc.driverId].trips++;
    driverPerf[tc.driverId].totalCPM += tc.costPerMile;
  }

  let bestDriver = null;
  let worstDriver = null;
  let bestAvgCPM = Infinity;
  let worstAvgCPM = 0;

  for (const [driverId, perf] of Object.entries(driverPerf)) {
    const avgCPM = perf.totalCPM / perf.trips;
    const driver = store.getDriver(driverId);
    if (avgCPM < bestAvgCPM) {
      bestAvgCPM = avgCPM;
      bestDriver = { id: driverId, name: driver?.name, avgCostPerMile: round2(avgCPM), tripCount: perf.trips };
    }
    if (avgCPM > worstAvgCPM) {
      worstAvgCPM = avgCPM;
      worstDriver = { id: driverId, name: driver?.name, avgCostPerMile: round2(avgCPM), tripCount: perf.trips };
    }
  }

  return {
    lane: { origin, destination },
    tripCount: trips.length,
    avgDistance: round2(totalMiles / trips.length),
    avgCostPerMile: round2(avgCPM),
    avgRevenuePerMile: round2(avgRPM),
    avgProfit: round2((totalRevenue - totalCost) / trips.length),
    totalRevenue: round2(totalRevenue),
    totalCost: round2(totalCost),
    bestDriver,
    worstDriver,
    trips: tripCosts,
  };
}

/**
 * Get all unique lanes with performance stats.
 *
 * @returns {Array} Lane stats sorted by cost per mile (worst first)
 */
export function getAllLaneStats() {
  const lanes = store.getUniqueLanes();
  return lanes
    .map((lane) => getLaneStats(lane.origin, lane.destination))
    .filter((l) => l.tripCount > 0)
    .sort((a, b) => b.avgCostPerMile - a.avgCostPerMile);
}

/**
 * Generate a weekly fleet summary.
 * Covers the past 7 days of operations.
 *
 * @returns {Object} Comprehensive weekly fleet summary
 */
export function generateWeeklySummary() {
  const trips = store.getTripsInPeriod(7);
  const fuelReceipts = store.getFuelReceiptsInPeriod(7);
  const allDrivers = store.getAllDrivers();

  if (trips.length === 0) {
    return {
      period: 'Last 7 days',
      tripCount: 0,
      message: 'No completed trips this week',
      generatedAt: new Date().toISOString(),
    };
  }

  // Aggregate metrics
  let totalMiles = 0;
  let totalDeadheadMiles = 0;
  let totalFuelCost = 0;
  let totalRevenue = 0;
  let totalCost = 0;

  const driverStats = {};
  const tripCosts = [];

  for (const trip of trips) {
    const cost = calculateTripCost(trip);
    tripCosts.push(cost);

    totalMiles += trip.totalMiles;
    totalDeadheadMiles += trip.deadheadMiles;
    totalFuelCost += trip.fuelCost;
    totalRevenue += trip.revenue;
    totalCost += cost.totalCost;

    // Per-driver aggregation
    if (!driverStats[trip.driverId]) {
      const driver = store.getDriver(trip.driverId);
      driverStats[trip.driverId] = {
        id: trip.driverId,
        name: driver?.name || 'Unknown',
        trips: 0,
        miles: 0,
        deadheadMiles: 0,
        revenue: 0,
        cost: 0,
      };
    }
    driverStats[trip.driverId].trips++;
    driverStats[trip.driverId].miles += trip.totalMiles;
    driverStats[trip.driverId].deadheadMiles += trip.deadheadMiles;
    driverStats[trip.driverId].revenue += trip.revenue;
    driverStats[trip.driverId].cost += cost.totalCost;
  }

  // Fuel analysis
  const totalGallons = fuelReceipts.reduce((sum, r) => sum + r.gallons, 0);
  const avgFuelPrice = fuelReceipts.length > 0
    ? fuelReceipts.reduce((sum, r) => sum + r.pricePerGallon, 0) / fuelReceipts.length
    : 0;

  // Driver rankings
  const driverRankings = Object.values(driverStats)
    .map((d) => ({
      ...d,
      costPerMile: d.miles > 0 ? round2(d.cost / d.miles) : 0,
      deadheadPercentage: d.miles > 0 ? round2((d.deadheadMiles / d.miles) * 100) : 0,
      profit: round2(d.revenue - d.cost),
    }))
    .sort((a, b) => a.costPerMile - b.costPerMile);

  const topDriver = driverRankings[0];
  const bottomDriver = driverRankings[driverRankings.length - 1];

  // Lane analysis
  const laneStats = getAllLaneStats();
  const mostExpensiveLane = laneStats[0];

  // Deadhead analysis
  const deadheadPercentage = totalMiles > 0 ? (totalDeadheadMiles / totalMiles) * 100 : 0;
  const trueCPM = totalMiles > 0 ? totalCost / totalMiles : 0;
  const deadheadCost = totalDeadheadMiles * trueCPM;

  // Generate AI insight
  const insight = generateInsight({
    deadheadPercentage,
    deadheadCost,
    mostExpensiveLane,
    topDriver,
    bottomDriver,
    trueCPM,
  });

  return {
    period: 'Last 7 days',
    generatedAt: new Date().toISOString(),
    tripCount: trips.length,
    activeDrivers: Object.keys(driverStats).length,
    totalDrivers: allDrivers.length,
    miles: {
      total: round2(totalMiles),
      deadhead: round2(totalDeadheadMiles),
      deadheadPercentage: round2(deadheadPercentage),
      deadheadCost: round2(deadheadCost),
    },
    financials: {
      totalRevenue: round2(totalRevenue),
      totalCost: round2(totalCost),
      totalProfit: round2(totalRevenue - totalCost),
      margin: round2(((totalRevenue - totalCost) / totalRevenue) * 100),
    },
    costPerMile: {
      true: round2(trueCPM),
      fuel: round2(totalFuelCost / totalMiles),
      driverPay: DRIVER_PAY_PER_MILE,
    },
    fuel: {
      totalSpend: round2(totalFuelCost),
      totalGallons: round2(totalGallons),
      avgPricePerGallon: round2(avgFuelPrice),
      receiptsCount: fuelReceipts.length,
    },
    driverRankings,
    topPerformer: topDriver ? {
      name: topDriver.name,
      costPerMile: topDriver.costPerMile,
      trips: topDriver.trips,
    } : null,
    worstPerformer: bottomDriver && driverRankings.length > 1 ? {
      name: bottomDriver.name,
      costPerMile: bottomDriver.costPerMile,
      trips: bottomDriver.trips,
    } : null,
    mostExpensiveLane: mostExpensiveLane ? {
      lane: `${mostExpensiveLane.lane.origin} → ${mostExpensiveLane.lane.destination}`,
      costPerMile: mostExpensiveLane.avgCostPerMile,
    } : null,
    insight,
  };
}

/**
 * Generate a human-readable insight based on fleet performance data.
 *
 * @param {Object} data - Performance metrics
 * @returns {string} AI-generated insight in plain language
 */
function generateInsight(data) {
  const insights = [];

  // Deadhead insight
  if (data.deadheadPercentage > 12) {
    insights.push(
      `Your deadhead miles are at ${round2(data.deadheadPercentage)}% this week — above the 10% target. ` +
      `Estimated waste: $${round2(data.deadheadCost)}. Consider pre-booking backhaul loads for your highest-deadhead lanes.`
    );
  } else if (data.deadheadPercentage < 8) {
    insights.push(
      `Deadhead at ${round2(data.deadheadPercentage)}% — excellent. Your dispatch efficiency is above fleet average.`
    );
  }

  // Cost per mile insight
  if (data.trueCPM > 1.90) {
    insights.push(
      `True cost per mile is $${round2(data.trueCPM)} — trending above the $1.85 target. Check fuel stops and driver routing.`
    );
  }

  // Driver spread insight
  if (data.topDriver && data.bottomDriver) {
    const spread = data.bottomDriver.costPerMile - data.topDriver.costPerMile;
    if (spread > 0.20) {
      insights.push(
        `${round2(spread * 100)}¢/mile gap between your best (${data.topDriver.name}) and most expensive (${data.bottomDriver.name}) driver. Consider route coaching.`
      );
    }
  }

  // Most expensive lane
  if (data.mostExpensiveLane && data.mostExpensiveLane.avgCostPerMile > 1.95) {
    insights.push(
      `${data.mostExpensiveLane.lane.origin} → ${data.mostExpensiveLane.lane.destination} is your most expensive lane at $${data.mostExpensiveLane.avgCostPerMile}/mile. Evaluate if the rate covers your costs.`
    );
  }

  return insights.length > 0
    ? insights.join(' ')
    : 'Fleet performance is within normal parameters this week. Keep it up.';
}

/**
 * Estimate the cost of a proposed load assignment.
 * Used by the dispatch engine to compare candidates.
 *
 * @param {Object} driver - Driver object
 * @param {Object} load - Load object
 * @param {number} deadheadMiles - Deadhead miles to pickup
 * @returns {Object} Estimated cost breakdown
 */
export function estimateLoadCost(driver, load, deadheadMiles) {
  const totalMiles = load.estimatedDistance + deadheadMiles;
  const mpg = driver.performance?.fuelEfficiency || 6.0;
  const fuelCost = estimateFuelCost(totalMiles, mpg);
  const driverPay = totalMiles * DRIVER_PAY_PER_MILE;
  const insuranceCost = totalMiles * INSURANCE_PER_MILE;
  const maintenanceCost = totalMiles * MAINTENANCE_PER_MILE;
  const overheadCost = totalMiles * OVERHEAD_PER_MILE;
  const totalCost = fuelCost + driverPay + insuranceCost + maintenanceCost + overheadCost;
  const costPerMile = totalMiles > 0 ? totalCost / totalMiles : 0;
  const profit = load.rate - totalCost;
  const margin = load.rate > 0 ? (profit / load.rate) * 100 : 0;

  return {
    totalMiles: round2(totalMiles),
    loadedMiles: round2(load.estimatedDistance),
    deadheadMiles: round2(deadheadMiles),
    breakdown: {
      fuel: round2(fuelCost),
      driverPay: round2(driverPay),
      insurance: round2(insuranceCost),
      maintenance: round2(maintenanceCost),
      overhead: round2(overheadCost),
    },
    totalCost: round2(totalCost),
    costPerMile: round2(costPerMile),
    revenue: round2(load.rate),
    profit: round2(profit),
    margin: round2(margin),
  };
}

/**
 * Utility: round to 2 decimal places.
 */
function round2(num) {
  return Math.round(num * 100) / 100;
}
