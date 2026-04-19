/**
 * DispatchIQ — Driver Routes
 *
 * API endpoints for driver management:
 *   GET    /api/drivers              - List all drivers
 *   GET    /api/drivers/:id          - Get single driver with full status
 *   PATCH  /api/drivers/:id          - Update driver info (location, etc.)
 *   PATCH  /api/drivers/:id/hos      - Update driver HOS data
 *   POST   /api/drivers/:id/start-shift  - Start a driver's shift
 *   POST   /api/drivers/:id/end-shift    - End a driver's shift
 *   PATCH  /api/drivers/:id/status   - Toggle availability (on/off shift)
 */

import { Router } from 'express';
import store from '../data/store.js';
import {
  getDriverStatus,
  calculateHOSRemaining,
  updateDriverHOS,
  startShift,
  endShift,
} from '../engines/hos.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/drivers
 * List all drivers with their current status.
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status: filterStatus, available } = req.query;

  let drivers = store.getAllDrivers();

  // Filter by availability
  if (available === 'true') {
    drivers = store.getAvailableDrivers();
  }

  // Filter by status
  if (filterStatus) {
    drivers = drivers.filter((d) => d.status === filterStatus);
  }

  // Enrich each driver with live status
  const enriched = drivers.map((driver) => {
    const statusInfo = getDriverStatus(driver);
    const hos = driver.status !== 'off_shift' ? calculateHOSRemaining(driver) : null;

    return {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      location: driver.location,
      truck: driver.truck,
      status: statusInfo.status,
      statusEmoji: statusInfo.statusEmoji,
      message: statusInfo.message,
      hosRemaining: hos?.effectiveRemaining ?? null,
      hosDetails: hos,
      currentLoadId: driver.currentLoadId,
      performance: driver.performance,
      updatedAt: driver.updatedAt,
    };
  });

  res.json({
    count: enriched.length,
    drivers: enriched,
  });
}));

/**
 * GET /api/drivers/:id
 * Get a single driver with full HOS breakdown and status.
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const driver = store.getDriver(req.params.id);
  if (!driver) throw new NotFoundError('Driver', req.params.id);

  const statusInfo = getDriverStatus(driver);
  const hos = driver.status !== 'off_shift' ? calculateHOSRemaining(driver) : null;
  const activeLoad = store.getActiveLoadForDriver(driver.id);

  res.json({
    ...driver,
    statusInfo,
    hosDetails: hos,
    activeLoad,
  });
}));

/**
 * PATCH /api/drivers/:id
 * Update driver fields (location, phone, truck details, performance).
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const driver = store.getDriver(req.params.id);
  if (!driver) throw new NotFoundError('Driver', req.params.id);

  const allowedFields = ['phone', 'location', 'truck', 'performance'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No valid fields to update. Allowed: ' + allowedFields.join(', '));
  }

  const updated = store.updateDriver(req.params.id, updates);
  const statusInfo = getDriverStatus(updated);

  res.json({
    message: 'Driver updated',
    driver: { ...updated, statusInfo },
  });
}));

/**
 * PATCH /api/drivers/:id/hos
 * Update HOS data for a driver.
 * Body: { hoursDrivenToday, onDutyHoursToday, weeklyHoursDriven }
 */
router.patch('/:id/hos', asyncHandler(async (req, res) => {
  const driver = store.getDriver(req.params.id);
  if (!driver) throw new NotFoundError('Driver', req.params.id);

  if (driver.status === 'off_shift') {
    throw new ValidationError('Cannot update HOS for an off-shift driver');
  }

  const { hoursDrivenToday, onDutyHoursToday, weeklyHoursDriven } = req.body;

  // Validate inputs
  if (hoursDrivenToday !== undefined) {
    if (typeof hoursDrivenToday !== 'number' || hoursDrivenToday < 0 || hoursDrivenToday > 11) {
      throw new ValidationError('hoursDrivenToday must be a number between 0 and 11');
    }
  }
  if (onDutyHoursToday !== undefined) {
    if (typeof onDutyHoursToday !== 'number' || onDutyHoursToday < 0 || onDutyHoursToday > 14) {
      throw new ValidationError('onDutyHoursToday must be a number between 0 and 14');
    }
  }

  const hosUpdate = {};
  if (hoursDrivenToday !== undefined) hosUpdate.hoursDrivenToday = hoursDrivenToday;
  if (onDutyHoursToday !== undefined) hosUpdate.onDutyHoursToday = onDutyHoursToday;
  if (weeklyHoursDriven !== undefined) hosUpdate.weeklyHoursDriven = weeklyHoursDriven;

  const result = updateDriverHOS(req.params.id, hosUpdate);

  res.json({
    message: 'HOS updated',
    driver: result.driver,
    status: result.status,
  });
}));

/**
 * POST /api/drivers/:id/start-shift
 * Start a driver's shift.
 * Body: { hoursDrivenToday? } - optional if driver already has hours
 */
router.post('/:id/start-shift', asyncHandler(async (req, res) => {
  const driver = store.getDriver(req.params.id);
  if (!driver) throw new NotFoundError('Driver', req.params.id);

  if (driver.status === 'on_shift') {
    throw new ValidationError('Driver is already on shift');
  }

  const { hoursDrivenToday = 0 } = req.body;
  const updated = startShift(req.params.id, hoursDrivenToday);
  const statusInfo = getDriverStatus(updated);

  res.json({
    message: `${updated.name} is now on shift`,
    driver: { ...updated, statusInfo },
  });
}));

/**
 * POST /api/drivers/:id/end-shift
 * End a driver's shift and log hours.
 */
router.post('/:id/end-shift', asyncHandler(async (req, res) => {
  const driver = store.getDriver(req.params.id);
  if (!driver) throw new NotFoundError('Driver', req.params.id);

  if (driver.status === 'off_shift') {
    throw new ValidationError('Driver is already off shift');
  }

  if (driver.currentLoadId) {
    throw new ValidationError(`Driver has an active load (${driver.currentLoadId}). Must complete or drop load before ending shift.`);
  }

  const updated = endShift(req.params.id);
  const statusInfo = getDriverStatus(updated);

  res.json({
    message: `${updated.name} is now off shift`,
    driver: { ...updated, statusInfo },
  });
}));

/**
 * PATCH /api/drivers/:id/status
 * Toggle driver availability (convenience endpoint).
 * Body: { status: 'on_shift' | 'off_shift' }
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const driver = store.getDriver(req.params.id);
  if (!driver) throw new NotFoundError('Driver', req.params.id);

  const { status } = req.body;
  if (!['on_shift', 'off_shift'].includes(status)) {
    throw new ValidationError('Status must be "on_shift" or "off_shift"');
  }

  if (status === 'on_shift' && driver.status === 'off_shift') {
    const updated = startShift(req.params.id);
    return res.json({ message: `${updated.name} is now on shift`, driver: updated });
  }

  if (status === 'off_shift' && driver.status === 'on_shift') {
    if (driver.currentLoadId) {
      throw new ValidationError(`Cannot go off shift with active load ${driver.currentLoadId}`);
    }
    const updated = endShift(req.params.id);
    return res.json({ message: `${updated.name} is now off shift`, driver: updated });
  }

  res.json({ message: `Driver already ${status}`, driver });
}));

export default router;
