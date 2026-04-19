/**
 * DispatchIQ — Fuel Receipt Routes
 *
 * API endpoints for fuel intelligence:
 *   GET    /api/fuel                    - List all fuel receipts
 *   GET    /api/fuel/driver/:driverId   - Get fuel receipts for a driver
 *   POST   /api/fuel                    - Upload a fuel receipt
 *   GET    /api/fuel/stats              - Fleet fuel statistics
 */

import { Router } from 'express';
import store from '../data/store.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/fuel
 * List all fuel receipts, optionally filtered by time period.
 */
router.get('/', asyncHandler(async (req, res) => {
  const { days } = req.query;
  const period = days ? parseInt(days) : 30;

  const receipts = store.getFuelReceiptsInPeriod(period);

  // Sort by timestamp descending
  receipts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Enrich with driver names
  const enriched = receipts.map((r) => {
    const driver = store.getDriver(r.driverId);
    return {
      ...r,
      driverName: driver?.name || 'Unknown',
    };
  });

  res.json({
    count: enriched.length,
    period: `${period} days`,
    receipts: enriched,
  });
}));

/**
 * GET /api/fuel/driver/:driverId
 * Get fuel receipts for a specific driver.
 */
router.get('/driver/:driverId', asyncHandler(async (req, res) => {
  const driver = store.getDriver(req.params.driverId);
  if (!driver) throw new NotFoundError('Driver', req.params.driverId);

  const { days } = req.query;
  const period = days ? parseInt(days) : 30;

  const receipts = store.getFuelReceiptsForDriver(req.params.driverId, period);
  receipts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Calculate fuel stats
  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalGallons = receipts.reduce((sum, r) => sum + r.gallons, 0);
  const avgPricePerGallon = receipts.length > 0
    ? receipts.reduce((sum, r) => sum + r.pricePerGallon, 0) / receipts.length
    : 0;

  // Find cheapest and most expensive fill-ups
  const sorted = [...receipts].sort((a, b) => a.pricePerGallon - b.pricePerGallon);
  const cheapest = sorted[0] || null;
  const mostExpensive = sorted[sorted.length - 1] || null;

  // Fleet average for comparison
  const allReceipts = store.getFuelReceiptsInPeriod(period);
  const fleetAvgPrice = allReceipts.length > 0
    ? allReceipts.reduce((sum, r) => sum + r.pricePerGallon, 0) / allReceipts.length
    : 0;

  const vsFleetAverage = avgPricePerGallon > 0 && fleetAvgPrice > 0
    ? Math.round((avgPricePerGallon - fleetAvgPrice) * 100) / 100
    : 0;

  res.json({
    driverId: driver.id,
    driverName: driver.name,
    period: `${period} days`,
    receiptCount: receipts.length,
    summary: {
      totalAmount: round2(totalAmount),
      totalGallons: round2(totalGallons),
      avgPricePerGallon: round2(avgPricePerGallon),
      fleetAvgPricePerGallon: round2(fleetAvgPrice),
      vsFleetAverage: vsFleetAverage > 0 ? `+$${round2(vsFleetAverage)}/gal` : `−$${round2(Math.abs(vsFleetAverage))}/gal`,
      aboveFleetAverage: vsFleetAverage > 0.05,
    },
    cheapestFillUp: cheapest ? {
      pricePerGallon: cheapest.pricePerGallon,
      location: cheapest.location,
      date: cheapest.timestamp,
    } : null,
    mostExpensiveFillUp: mostExpensive ? {
      pricePerGallon: mostExpensive.pricePerGallon,
      location: mostExpensive.location,
      date: mostExpensive.timestamp,
    } : null,
    receipts,
  });
}));

/**
 * POST /api/fuel
 * Upload a new fuel receipt.
 *
 * Body: {
 *   driverId: string,
 *   amount: number ($),
 *   gallons: number,
 *   pricePerGallon?: number (computed if not provided),
 *   location?: { lat, lng, city, stationName },
 *   tripId?: string
 * }
 */
router.post('/', asyncHandler(async (req, res) => {
  const { driverId, amount, gallons, pricePerGallon, location, tripId } = req.body;

  // Validate
  if (!driverId) throw new ValidationError('driverId is required');
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new ValidationError('amount is required and must be a positive number');
  }
  if (!gallons || typeof gallons !== 'number' || gallons <= 0) {
    throw new ValidationError('gallons is required and must be a positive number');
  }

  const driver = store.getDriver(driverId);
  if (!driver) throw new NotFoundError('Driver', driverId);

  // Compute price per gallon if not provided
  const computedPrice = pricePerGallon || round2(amount / gallons);

  // Auto-fill location from driver's current location if not provided
  const receiptLocation = location || {
    lat: driver.location.lat,
    lng: driver.location.lng,
    city: driver.location.city,
    stationName: 'Unknown Station',
  };

  const receipt = store.createFuelReceipt({
    driverId,
    tripId: tripId || null,
    amount: round2(amount),
    gallons: round2(gallons),
    pricePerGallon: computedPrice,
    location: receiptLocation,
  });

  // Check if driver is fueling above fleet average
  const allReceipts = store.getAllFuelReceipts();
  const fleetAvgPrice = allReceipts.reduce((sum, r) => sum + r.pricePerGallon, 0) / allReceipts.length;
  const aboveAverage = computedPrice > fleetAvgPrice + 0.10;

  res.status(201).json({
    message: 'Fuel receipt recorded',
    receipt,
    ...(aboveAverage && {
      warning: `This fill-up at $${computedPrice}/gal is $${round2(computedPrice - fleetAvgPrice)} above fleet average ($${round2(fleetAvgPrice)}/gal)`,
    }),
  });
}));

/**
 * GET /api/fuel/stats
 * Fleet-wide fuel statistics.
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const { days } = req.query;
  const period = days ? parseInt(days) : 30;

  const receipts = store.getFuelReceiptsInPeriod(period);

  if (receipts.length === 0) {
    return res.json({
      period: `${period} days`,
      message: 'No fuel receipts in this period',
    });
  }

  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalGallons = receipts.reduce((sum, r) => sum + r.gallons, 0);
  const avgPrice = receipts.reduce((sum, r) => sum + r.pricePerGallon, 0) / receipts.length;
  const cheapest = [...receipts].sort((a, b) => a.pricePerGallon - b.pricePerGallon)[0];
  const mostExpensive = [...receipts].sort((a, b) => b.pricePerGallon - a.pricePerGallon)[0];

  // Per-driver breakdown
  const driverFuel = {};
  for (const r of receipts) {
    if (!driverFuel[r.driverId]) {
      const driver = store.getDriver(r.driverId);
      driverFuel[r.driverId] = {
        id: r.driverId,
        name: driver?.name || 'Unknown',
        totalAmount: 0,
        totalGallons: 0,
        receipts: 0,
        prices: [],
      };
    }
    driverFuel[r.driverId].totalAmount += r.amount;
    driverFuel[r.driverId].totalGallons += r.gallons;
    driverFuel[r.driverId].receipts++;
    driverFuel[r.driverId].prices.push(r.pricePerGallon);
  }

  const driverBreakdown = Object.values(driverFuel).map((d) => ({
    ...d,
    totalAmount: round2(d.totalAmount),
    totalGallons: round2(d.totalGallons),
    avgPricePerGallon: round2(d.prices.reduce((s, p) => s + p, 0) / d.prices.length),
    prices: undefined,
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  // Flag drivers consistently above average
  const flaggedDrivers = driverBreakdown.filter((d) => d.avgPricePerGallon > avgPrice + 0.05);

  res.json({
    period: `${period} days`,
    receiptCount: receipts.length,
    totalSpend: round2(totalAmount),
    totalGallons: round2(totalGallons),
    avgPricePerGallon: round2(avgPrice),
    cheapestFillUp: {
      pricePerGallon: cheapest.pricePerGallon,
      location: cheapest.location,
      driver: store.getDriver(cheapest.driverId)?.name,
    },
    mostExpensiveFillUp: {
      pricePerGallon: mostExpensive.pricePerGallon,
      location: mostExpensive.location,
      driver: store.getDriver(mostExpensive.driverId)?.name,
    },
    driverBreakdown,
    flaggedDrivers: flaggedDrivers.length > 0 ? {
      count: flaggedDrivers.length,
      message: `${flaggedDrivers.length} driver(s) consistently fueling above fleet average`,
      drivers: flaggedDrivers.map((d) => d.name),
    } : null,
  });
}));

/**
 * Utility: round to 2 decimal places.
 */
function round2(num) {
  return Math.round(num * 100) / 100;
}

export default router;
