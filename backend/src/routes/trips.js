/**
 * DispatchIQ — Trip Routes
 *
 * Completed trip records created when loads are delivered:
 *   GET /api/trips        - List all trips (filter: ?driverId=&days=30)
 *   GET /api/trips/:id    - Get single trip with expenses
 */

import { Router } from 'express';
import store from '../data/store.js';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/trips
 * List completed trips, optionally filtered by driver or time window.
 */
router.get('/', asyncHandler(async (req, res) => {
  const { driverId, days } = req.query;

  let trips = store.getAllTrips();

  if (driverId) {
    trips = trips.filter((t) => t.driverId === driverId);
  }

  if (days) {
    const cutoff = new Date(Date.now() - parseInt(days) * 86400000).toISOString();
    trips = trips.filter((t) => t.completedAt >= cutoff);
  }

  trips.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  res.json({ count: trips.length, trips });
}));

/**
 * GET /api/trips/:id
 * Get a single trip with its expense summary.
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const trip = store.getTrip(req.params.id);
  if (!trip) throw new NotFoundError('Trip', req.params.id);

  // Attach expenses if available
  const expenses = [];
  if (store.expenses) {
    for (const [, exp] of store.expenses.entries()) {
      if (exp.tripId === trip.id) expenses.push(exp);
    }
  }

  expenses.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const expenseSummary = {
    total: expenses.reduce((sum, e) => sum + e.amount, 0),
    count: expenses.length,
    byCategory: {},
  };
  for (const exp of expenses) {
    if (!expenseSummary.byCategory[exp.category]) {
      expenseSummary.byCategory[exp.category] = { count: 0, total: 0 };
    }
    expenseSummary.byCategory[exp.category].count += 1;
    expenseSummary.byCategory[exp.category].total += exp.amount;
  }

  res.json({ ...trip, expenses, expenseSummary });
}));

export default router;
