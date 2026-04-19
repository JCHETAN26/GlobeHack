/**
 * DispatchIQ — Fleet Overview & Cost Intelligence Routes
 *
 * API endpoints for fleet-wide analytics:
 *   GET    /api/fleet/readiness     - Fleet Readiness Board (map + status overview)
 *   GET    /api/fleet/compliance    - HOS Compliance View
 *   GET    /api/fleet/summary       - Weekly Fleet Summary
 *   GET    /api/fleet/cost          - Cost Intelligence Dashboard data
 *   GET    /api/fleet/cost/driver/:id - Per-driver cost breakdown
 *   GET    /api/fleet/cost/lanes    - Per-lane cost analysis
 *   GET    /api/fleet/alerts        - System alerts
 *   POST   /api/fleet/alerts/:id/acknowledge - Acknowledge an alert
 */

import { Router } from 'express';
import store from '../data/store.js';
import { runFleetComplianceCheck, calculateHOSRemaining, getDriverStatus } from '../engines/hos.js';
import { generateWeeklySummary, getDriverStats, getAllLaneStats, calculateTripCost } from '../engines/cost.js';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/fleet/readiness
 * Fleet Readiness Board — live overview of all drivers for the dispatcher dashboard.
 */
router.get('/readiness', asyncHandler(async (req, res) => {
  const drivers = store.getAllDrivers();

  const readiness = {
    timestamp: new Date().toISOString(),
    totalDrivers: drivers.length,
    onShift: 0,
    offShift: 0,
    available: 0,
    assigned: 0,
    statusBreakdown: { clear: 0, tight: 0, ineligible: 0, off_shift: 0, assigned: 0 },
    drivers: [],
  };

  for (const driver of drivers) {
    const statusInfo = getDriverStatus(driver);
    const hos = driver.status !== 'off_shift' ? calculateHOSRemaining(driver) : null;
    const activeLoad = store.getActiveLoadForDriver(driver.id);

    const driverData = {
      id: driver.id,
      name: driver.name,
      photo: null, // Placeholder for driver photo
      status: statusInfo.status,
      statusEmoji: statusInfo.statusEmoji,
      message: statusInfo.message,
      location: {
        lat: driver.location.lat,
        lng: driver.location.lng,
        city: driver.location.city,
        updatedAt: driver.location.updatedAt,
      },
      hos: hos ? {
        remaining: hos.effectiveRemaining,
        driveHours: hos.driveHoursRemaining,
        onDutyHours: hos.onDutyHoursRemaining,
        weeklyUsed: hos.weeklyHoursUsed,
        weeklyLimit: hos.weeklyLimit,
        limitingFactor: hos.limitingFactor,
        // Percentage for visual bar
        dailyPercentage: Math.round((hos.driveHoursRemaining / 11) * 100),
        weeklyPercentage: Math.round((hos.weeklyHoursRemaining / hos.weeklyLimit) * 100),
      } : null,
      truck: {
        id: driver.truck.id,
        type: driver.truck.type,
        hazmat: driver.truck.hazmat,
      },
      currentLoad: activeLoad ? {
        id: activeLoad.id,
        destination: activeLoad.dropoff.city,
        status: activeLoad.status,
        eta: null, // Would need real-time calculation
        pickup: { lat: activeLoad.pickup.lat, lng: activeLoad.pickup.lng, city: activeLoad.pickup.city },
        dropoff: { lat: activeLoad.dropoff.lat, lng: activeLoad.dropoff.lng, city: activeLoad.dropoff.city },
      } : null,
      lastUpdated: driver.updatedAt,
    };

    readiness.drivers.push(driverData);

    // Count statuses
    if (driver.status === 'off_shift') {
      readiness.offShift++;
      readiness.statusBreakdown.off_shift++;
    } else {
      readiness.onShift++;
      if (driver.currentLoadId) {
        readiness.assigned++;
        readiness.statusBreakdown.assigned++;
      } else if (statusInfo.status === 'clear') {
        readiness.available++;
        readiness.statusBreakdown.clear++;
      } else if (statusInfo.status === 'tight') {
        readiness.available++;
        readiness.statusBreakdown.tight++;
      } else {
        readiness.statusBreakdown.ineligible++;
      }
    }
  }

  // Sort: available drivers first, then by HOS remaining
  readiness.drivers.sort((a, b) => {
    const statusOrder = { clear: 0, tight: 1, assigned: 2, ineligible: 3, off_shift: 4 };
    const orderDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
    if (orderDiff !== 0) return orderDiff;
    // Within same status, sort by HOS remaining descending
    return (b.hos?.remaining ?? 0) - (a.hos?.remaining ?? 0);
  });

  res.json(readiness);
}));

/**
 * GET /api/fleet/compliance
 * HOS Compliance View — detailed compliance status for every driver.
 */
router.get('/compliance', asyncHandler(async (req, res) => {
  const compliance = runFleetComplianceCheck();
  res.json(compliance);
}));

/**
 * GET /api/fleet/summary
 * Weekly Fleet Summary — automatically generated performance report.
 */
router.get('/summary', asyncHandler(async (req, res) => {
  const summary = generateWeeklySummary();
  res.json(summary);
}));

/**
 * GET /api/fleet/cost
 * Cost Intelligence Dashboard — fleet-wide cost breakdown.
 */
router.get('/cost', asyncHandler(async (req, res) => {
  const { days } = req.query;
  const period = days ? parseInt(days) : 7;

  const trips = store.getTripsInPeriod(period);
  const drivers = store.getAllDrivers();

  if (trips.length === 0) {
    return res.json({
      period: `${period} days`,
      message: 'No completed trips in this period',
      generatedAt: new Date().toISOString(),
    });
  }

  // Calculate trip costs
  const tripCosts = trips.map((t) => calculateTripCost(t));

  // Aggregate
  const totalMiles = trips.reduce((sum, t) => sum + t.totalMiles, 0);
  const totalDeadhead = trips.reduce((sum, t) => sum + t.deadheadMiles, 0);
  const totalRevenue = trips.reduce((sum, t) => sum + t.revenue, 0);
  const totalCost = tripCosts.reduce((sum, tc) => sum + tc.totalCost, 0);
  const totalFuel = trips.reduce((sum, t) => sum + t.fuelCost, 0);
  const totalDriverPay = trips.reduce((sum, t) => sum + t.driverPay, 0);
  const totalDetention = tripCosts.filter((tc) => tc.detentionFlagged).length;

  const trueCPM = totalMiles > 0 ? totalCost / totalMiles : 0;
  const deadheadPct = totalMiles > 0 ? (totalDeadhead / totalMiles) * 100 : 0;

  // Per-driver table
  const driverCosts = {};
  for (const tc of tripCosts) {
    if (!driverCosts[tc.driverId]) {
      const driver = store.getDriver(tc.driverId);
      driverCosts[tc.driverId] = {
        id: tc.driverId,
        name: driver?.name || 'Unknown',
        trips: 0,
        totalMiles: 0,
        deadheadMiles: 0,
        totalCost: 0,
        totalRevenue: 0,
        fuelCost: 0,
      };
    }
    driverCosts[tc.driverId].trips++;
    driverCosts[tc.driverId].totalMiles += tc.totalMiles;
    driverCosts[tc.driverId].deadheadMiles += tc.deadheadMiles;
    driverCosts[tc.driverId].totalCost += tc.totalCost;
    driverCosts[tc.driverId].totalRevenue += tc.revenue;
    driverCosts[tc.driverId].fuelCost += tc.breakdown.fuel;
  }

  const driverTable = Object.values(driverCosts).map((d) => ({
    ...d,
    costPerMile: d.totalMiles > 0 ? round2(d.totalCost / d.totalMiles) : 0,
    deadheadPercentage: d.totalMiles > 0 ? round2((d.deadheadMiles / d.totalMiles) * 100) : 0,
    profit: round2(d.totalRevenue - d.totalCost),
    totalMiles: round2(d.totalMiles),
    deadheadMiles: round2(d.deadheadMiles),
    totalCost: round2(d.totalCost),
    totalRevenue: round2(d.totalRevenue),
    fuelCost: round2(d.fuelCost),
  })).sort((a, b) => a.costPerMile - b.costPerMile);

  // Lane table
  const laneStats = getAllLaneStats();

  res.json({
    period: `${period} days`,
    generatedAt: new Date().toISOString(),
    overview: {
      tripCount: trips.length,
      totalMiles: round2(totalMiles),
      totalDeadheadMiles: round2(totalDeadhead),
      deadheadPercentage: round2(deadheadPct),
      deadheadCost: round2(totalDeadhead * trueCPM),
      trueCostPerMile: round2(trueCPM),
      totalRevenue: round2(totalRevenue),
      totalCost: round2(totalCost),
      totalProfit: round2(totalRevenue - totalCost),
      margin: round2(((totalRevenue - totalCost) / totalRevenue) * 100),
    },
    costBreakdown: {
      fuel: round2(totalFuel),
      fuelPerMile: round2(totalFuel / totalMiles),
      driverPay: round2(totalDriverPay),
      driverPayPerMile: round2(totalDriverPay / totalMiles),
      insurance: round2(totalMiles * 0.18),
      maintenance: round2(totalMiles * 0.18),
      overhead: round2(totalMiles * 0.27),
    },
    detentionEvents: totalDetention,
    driverPerformance: driverTable,
    lanePerformance: laneStats.slice(0, 10),
    trips: tripCosts,
  });
}));

/**
 * GET /api/fleet/cost/driver/:id
 * Per-driver cost breakdown.
 */
router.get('/cost/driver/:id', asyncHandler(async (req, res) => {
  const stats = getDriverStats(req.params.id);
  if (!stats) throw new NotFoundError('Driver', req.params.id);

  res.json(stats);
}));

/**
 * GET /api/fleet/cost/lanes
 * Per-lane cost analysis.
 */
router.get('/cost/lanes', asyncHandler(async (req, res) => {
  const lanes = getAllLaneStats();
  res.json({
    count: lanes.length,
    lanes,
  });
}));

/**
 * GET /api/fleet/alerts
 * System and compliance alerts.
 */
router.get('/alerts', asyncHandler(async (req, res) => {
  const { type, driverId, unacknowledged } = req.query;

  const alerts = store.getAlerts({
    type,
    driverId,
    unacknowledged: unacknowledged === 'true',
  });

  res.json({
    count: alerts.length,
    alerts,
  });
}));

/**
 * POST /api/fleet/alerts/:id/acknowledge
 * Acknowledge an alert.
 */
router.post('/alerts/:id/acknowledge', asyncHandler(async (req, res) => {
  const alert = store.acknowledgeAlert(req.params.id);
  if (!alert) throw new NotFoundError('Alert', req.params.id);

  res.json({
    message: 'Alert acknowledged',
    alert,
  });
}));

/**
 * Utility: round to 2 decimal places.
 */
function round2(num) {
  return Math.round(num * 100) / 100;
}

export default router;
