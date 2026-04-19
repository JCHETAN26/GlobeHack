/**
 * DispatchIQ — Load Management Routes
 *
 * API endpoints for load lifecycle:
 *   GET    /api/loads              - List all loads (filter by status)
 *   GET    /api/loads/:id          - Get single load with assignment details
 *   POST   /api/loads              - Create a new load
 *   POST   /api/loads/:id/assign   - Assign a load to a driver
 *   POST   /api/loads/:id/accept   - Driver accepts assigned load
 *   POST   /api/loads/:id/drop     - Driver drops a load
 *   POST   /api/loads/:id/deliver  - Mark load as delivered (creates trip record)
 */

import { Router } from 'express';
import store from '../data/store.js';
import {
  assignLoad,
  acceptLoad,
  dropLoad,
  completeDelivery,
} from '../engines/dispatch.js';
import { estimateRoadDistance, estimateDriveTime } from '../utils/geo.js';
import { asyncHandler, NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/loads
 * List all loads, optionally filtered by status.
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;

  let loads = store.getAllLoads();

  if (status) {
    loads = loads.filter((l) => l.status === status);
  }

  // Sort: available first, then by created date
  loads.sort((a, b) => {
    const statusOrder = { available: 0, assigned: 1, in_transit: 2, delivered: 3, cancelled: 4 };
    const orderDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
    if (orderDiff !== 0) return orderDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Enrich with driver info if assigned
  const enriched = loads.map((load) => {
    const driver = load.assignedDriverId ? store.getDriver(load.assignedDriverId) : null;
    return {
      ...load,
      assignedDriver: driver ? { id: driver.id, name: driver.name, phone: driver.phone } : null,
    };
  });

  res.json({
    count: enriched.length,
    loads: enriched,
  });
}));

/**
 * GET /api/loads/:id
 * Get details for a single load.
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const load = store.getLoad(req.params.id);
  if (!load) throw new NotFoundError('Load', req.params.id);

  const driver = load.assignedDriverId ? store.getDriver(load.assignedDriverId) : null;

  res.json({
    ...load,
    assignedDriver: driver ? {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      location: driver.location,
    } : null,
  });
}));

/**
 * POST /api/loads
 * Create a new load.
 *
 * Body: {
 *   pickup: { lat, lng, city, address },
 *   dropoff: { lat, lng, city, address },
 *   weight: number (lbs),
 *   type: 'dry_van' | 'flatbed' | 'reefer' | 'tanker',
 *   rate: number ($),
 *   pickupAppointment: ISO string,
 *   deliveryDeadline: ISO string,
 *   specialRequirements?: { hazmat, oversize, teamDriver }
 * }
 */
router.post('/', asyncHandler(async (req, res) => {
  const { pickup, dropoff, weight, type, rate, pickupAppointment, deliveryDeadline, specialRequirements } = req.body;

  // Validate required fields
  if (!pickup?.lat || !pickup?.lng) throw new ValidationError('pickup must include lat and lng');
  if (!dropoff?.lat || !dropoff?.lng) throw new ValidationError('dropoff must include lat and lng');
  if (!weight || typeof weight !== 'number') throw new ValidationError('weight is required (number in lbs)');
  if (!type) throw new ValidationError('type is required (dry_van, flatbed, reefer, or tanker)');
  if (!rate || typeof rate !== 'number') throw new ValidationError('rate is required (number in $)');

  const validTypes = ['dry_van', 'flatbed', 'reefer', 'tanker'];
  if (!validTypes.includes(type)) {
    throw new ValidationError(`type must be one of: ${validTypes.join(', ')}`);
  }

  // Calculate distance and duration
  const estimatedDistance = Math.round(estimateRoadDistance(
    pickup.lat, pickup.lng, dropoff.lat, dropoff.lng
  ));
  const estimatedDuration = Math.round(estimateDriveTime(estimatedDistance) * 10) / 10;
  const ratePerMile = estimatedDistance > 0 ? Math.round((rate / estimatedDistance) * 100) / 100 : 0;

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

  res.status(201).json({
    message: 'Load created',
    load,
  });
}));

/**
 * POST /api/loads/:id/assign
 * Assign a load to a specific driver.
 * Body: { driverId: string }
 */
router.post('/:id/assign', asyncHandler(async (req, res) => {
  const { driverId } = req.body;
  if (!driverId) throw new ValidationError('driverId is required');

  const result = assignLoad(req.params.id, driverId);

  if (result.error) {
    throw new ConflictError(result.error);
  }

  res.json(result);
}));

/**
 * POST /api/loads/:id/accept
 * Driver accepts a load assigned to them.
 * Body: { driverId: string }
 */
router.post('/:id/accept', asyncHandler(async (req, res) => {
  const { driverId } = req.body;
  if (!driverId) throw new ValidationError('driverId is required');

  const result = acceptLoad(req.params.id, driverId);

  if (result.error) {
    throw new ConflictError(result.error);
  }

  res.json(result);
}));

/**
 * POST /api/loads/:id/drop
 * Driver drops a load. Load returns to available pool and triggers re-recommendation.
 * Body: { driverId: string }
 */
router.post('/:id/drop', asyncHandler(async (req, res) => {
  const { driverId } = req.body;
  if (!driverId) throw new ValidationError('driverId is required');

  const result = dropLoad(req.params.id, driverId);

  if (result.error) {
    throw new ConflictError(result.error);
  }

  res.json(result);
}));

/**
 * POST /api/loads/:id/deliver
 * Mark a load as delivered and create a trip record for cost intelligence.
 * Body: { driverId, fuelCost?, deadheadMiles?, detentionMinutes? }
 */
router.post('/:id/deliver', asyncHandler(async (req, res) => {
  const { driverId, fuelCost, deadheadMiles, detentionMinutes } = req.body;
  if (!driverId) throw new ValidationError('driverId is required');

  const result = completeDelivery(req.params.id, driverId, {
    fuelCost,
    deadheadMiles,
    detentionMinutes,
  });

  if (result.error) {
    throw new ConflictError(result.error);
  }

  if (store.wsService && result.trip) {
    store.wsService.broadcastToDashboard({
      type: 'trip:completed',
      driverId,
      tripId: result.trip.id,
      payload: result.trip,
    });
  }

  res.json(result);
}));

export default router;
