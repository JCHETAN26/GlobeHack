/**
 * DispatchIQ — Dispatch Routes
 *
 * API endpoints for the smart dispatch engine:
 *   POST   /api/dispatch/recommend        - Get AI-ranked driver recommendations for a load
 *   POST   /api/dispatch/recommend-new     - Create a new load + get recommendations in one call
 *   GET    /api/dispatch/backhaul/:loadId  - Get backhaul opportunities for a load's drop point
 */

import { Router } from 'express';
import store from '../data/store.js';
import { generateRecommendation } from '../engines/dispatch.js';
import { findReturnLoads, findBestBackhaul } from '../engines/backhaul.js';
import { calculateHOSRemaining } from '../engines/hos.js';
import { estimateRoadDistance, estimateDriveTime } from '../utils/geo.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/dispatch/recommend
 * Get ranked driver recommendations for an existing load.
 * Body: { loadId: string }
 */
router.post('/recommend', asyncHandler(async (req, res) => {
  const { loadId } = req.body;
  if (!loadId) throw new ValidationError('loadId is required');

  const load = store.getLoad(loadId);
  if (!load) throw new NotFoundError('Load', loadId);

  const recommendation = generateRecommendation(loadId);

  res.json(recommendation);
}));

/**
 * POST /api/dispatch/recommend-new
 * Create a new load and immediately get dispatch recommendations.
 * Convenience endpoint that combines load creation + recommendation.
 *
 * Body: {
 *   pickup: { lat, lng, city, address },
 *   dropoff: { lat, lng, city, address },
 *   weight: number,
 *   type: string,
 *   rate: number,
 *   pickupAppointment?: ISO string,
 *   deliveryDeadline?: ISO string,
 *   specialRequirements?: { hazmat, oversize, teamDriver }
 * }
 */
router.post('/recommend-new', asyncHandler(async (req, res) => {
  const { pickup, dropoff, weight, type, rate, pickupAppointment, deliveryDeadline, specialRequirements } = req.body;

  // Validate
  if (!pickup?.lat || !pickup?.lng) throw new ValidationError('pickup must include lat and lng');
  if (!dropoff?.lat || !dropoff?.lng) throw new ValidationError('dropoff must include lat and lng');
  if (!weight || typeof weight !== 'number') throw new ValidationError('weight is required (number in lbs)');
  if (!type) throw new ValidationError('type is required');
  if (!rate || typeof rate !== 'number') throw new ValidationError('rate is required (number in $)');

  // Calculate distance and duration
  const estimatedDistance = Math.round(estimateRoadDistance(
    pickup.lat, pickup.lng, dropoff.lat, dropoff.lng
  ));
  const estimatedDuration = Math.round(estimateDriveTime(estimatedDistance) * 10) / 10;
  const ratePerMile = estimatedDistance > 0 ? Math.round((rate / estimatedDistance) * 100) / 100 : 0;

  // Create load
  const load = store.createLoad({
    pickup,
    dropoff,
    estimatedDuration,
    estimatedDistance,
    weight,
    type,
    rate,
    ratePerMile,
    pickupAppointment: pickupAppointment || null,
    deliveryDeadline: deliveryDeadline || null,
    specialRequirements: specialRequirements || { hazmat: false, oversize: false, teamDriver: false },
  });

  // Get recommendations
  const recommendation = generateRecommendation(load.id);

  res.status(201).json({
    load,
    recommendation,
  });
}));

/**
 * GET /api/dispatch/backhaul/:loadId
 * Get backhaul opportunities for a load's drop point.
 * Useful for viewing return load options before assigning a driver.
 */
router.get('/backhaul/:loadId', asyncHandler(async (req, res) => {
  const load = store.getLoad(req.params.loadId);
  if (!load) throw new NotFoundError('Load', req.params.loadId);

  const { driverId, radius } = req.query;
  const searchRadius = radius ? parseFloat(radius) : 25;

  let hosAfterTrip = 4; // Default assumption: 4 hours remaining

  // If a specific driver is specified, use their actual HOS
  if (driverId) {
    const driver = store.getDriver(driverId);
    if (!driver) throw new NotFoundError('Driver', driverId);

    const hos = calculateHOSRemaining(driver);
    const deadheadMiles = estimateRoadDistance(
      driver.location.lat, driver.location.lng,
      load.pickup.lat, load.pickup.lng
    );
    const deadheadTime = estimateDriveTime(deadheadMiles);
    hosAfterTrip = Math.max(0, hos.effectiveRemaining - load.estimatedDuration - deadheadTime);
  }

  const opportunities = findReturnLoads(
    load.dropoff,
    hosAfterTrip,
    {
      radiusMiles: searchRadius,
      truckType: driverId ? store.getDriver(driverId)?.truck?.type : null,
      maxWeight: driverId ? store.getDriver(driverId)?.truck?.maxWeight : null,
      hazmat: driverId ? store.getDriver(driverId)?.truck?.hazmat : false,
    }
  );

  const best = findBestBackhaul(load.dropoff, hosAfterTrip, {
    radiusMiles: searchRadius,
  });

  res.json({
    loadId: load.id,
    dropLocation: load.dropoff,
    searchRadius,
    hosAfterTrip: Math.round(hosAfterTrip * 100) / 100,
    totalOpportunities: opportunities.length,
    bestOpportunity: best,
    opportunities,
  });
}));

export default router;
