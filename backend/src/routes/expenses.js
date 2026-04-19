/**
 * DispatchIQ — Expense Routes
 *
 * Driver expense tracking API:
 *   POST   /api/expenses              - Log new expense (with optional receipt photo)
 *   GET    /api/expenses/trip/:tripId - Get all expenses for a trip
 *   GET    /api/expenses/driver/:driverId - Get driver expense history
 *   DELETE /api/expenses/:id          - Delete an expense (if not completed trip)
 *   PATCH  /api/expenses/:id          - Update expense
 */

import { Router } from 'express';
import store from '../data/store.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { generateTripReport } from '../engines/reporting.js';

const router = Router();

/**
 * POST /api/expenses
 * Log a new expense during a trip.
 * 
 * Body: {
 *   driverId: string,
 *   tripId: string,
 *   category: 'fuel'|'food'|'toll'|'parking'|'repair'|'lodging'|'other',
 *   amount: number,
 *   notes?: string,
 *   location?: { lat, lng, address },
 *   fuel?: { gallons, pricePerGallon, station },
 *   receiptUrl?: string (base64 encoded image or file path)
 * }
 */
router.post('/', asyncHandler(async (req, res) => {
  const { driverId, tripId, category, amount, notes, location, fuel, receiptUrl } = req.body;

  // Validate required fields
  if (!driverId || typeof driverId !== 'string') throw new ValidationError('driverId is required');
  if (!tripId || typeof tripId !== 'string') throw new ValidationError('tripId is required');
  if (!category || !['fuel', 'food', 'toll', 'parking', 'repair', 'lodging', 'other'].includes(category)) {
    throw new ValidationError('category must be one of: fuel, food, toll, parking, repair, lodging, other');
  }
  if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
    throw new ValidationError('amount is required and must be > 0');
  }

  // Verify driver & trip exist
  const driver = store.getDriver(driverId);
  if (!driver) throw new NotFoundError('Driver', driverId);

  const trip = store.getTrip(tripId);
  if (!trip) throw new NotFoundError('Trip', tripId);

  // Create expense record
  const expense = {
    id: `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    driverId,
    tripId,
    category,
    amount: Math.round(amount * 100) / 100,
    notes: notes || null,
    location: location || null,
    fuel: fuel || null,
    receiptUrl: receiptUrl || null,
    timestamp: new Date().toISOString(),
  };

  // Store in memory (in production, would be database)
  if (!store.expenses) store.expenses = new Map();
  store.expenses.set(expense.id, expense);

  console.log(`[Expense] Logged: ${category} $${expense.amount} for trip ${tripId}`);

  // Broadcast to dashboard via WebSocket
  if (store.wsService) {
    store.wsService.broadcastToDashboard({
      type: 'expense:logged',
      driverId,
      tripId,
      payload: expense,
    });
  }

  res.status(201).json(expense);
}));

/**
 * GET /api/expenses/trip/:tripId
 * Get all expenses for a specific trip.
 */
router.get('/trip/:tripId', asyncHandler(async (req, res) => {
  const { tripId } = req.params;

  const trip = store.getTrip(tripId);
  if (!trip) throw new NotFoundError('Trip', tripId);

  const expenses = [];
  if (store.expenses) {
    for (const [, expense] of store.expenses.entries()) {
      if (expense.tripId === tripId) {
        expenses.push(expense);
      }
    }
  }

  // Sort by timestamp
  expenses.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Calculate totals by category
  const summary = {
    total: 0,
    byCategory: {},
  };

  for (const exp of expenses) {
    summary.total += exp.amount;
    if (!summary.byCategory[exp.category]) {
      summary.byCategory[exp.category] = 0;
    }
    summary.byCategory[exp.category] += exp.amount;
  }

  res.json({
    tripId,
    expenses,
    summary,
  });
}));

/**
 * GET /api/expenses/driver/:driverId
 * Get expense history for a driver (last 30 days or custom range).
 * Query: ?days=30 or ?startDate=2026-04-01&endDate=2026-04-30
 */
router.get('/driver/:driverId', asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { days = 30 } = req.query;

  const driver = store.getDriver(driverId);
  if (!driver) throw new NotFoundError('Driver', driverId);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

  const expenses = [];
  if (store.expenses) {
    for (const [, expense] of store.expenses.entries()) {
      if (
        expense.driverId === driverId &&
        new Date(expense.timestamp) >= cutoffDate
      ) {
        expenses.push(expense);
      }
    }
  }

  // Sort by timestamp descending (newest first)
  expenses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Group by trip
  const byTrip = {};
  for (const exp of expenses) {
    if (!byTrip[exp.tripId]) {
      byTrip[exp.tripId] = [];
    }
    byTrip[exp.tripId].push(exp);
  }

  res.json({
    driverId,
    days,
    expenseCount: expenses.length,
    total: expenses.reduce((sum, e) => sum + e.amount, 0),
    byTrip,
  });
}));

/**
 * DELETE /api/expenses/:id
 * Remove an expense (only if trip hasn't been completed).
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!store.expenses || !store.expenses.has(id)) {
    throw new NotFoundError('Expense', id);
  }

  const expense = store.expenses.get(id);
  const trip = store.getTrip(expense.tripId);

  // Prevent deletion if trip is completed
  if (trip && trip.completedAt) {
    throw new ValidationError('Cannot delete expenses from completed trips');
  }

  store.expenses.delete(id);
  console.log(`[Expense] Deleted: ${id}`);

  res.json({ success: true, id });
}));

/**
 * GET /api/expenses/stats
 * Fleet-wide expense statistics.
 * Query: ?days=30
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

  const expenses = [];
  if (store.expenses) {
    for (const [, expense] of store.expenses.entries()) {
      if (new Date(expense.timestamp) >= cutoffDate) {
        expenses.push(expense);
      }
    }
  }

  const stats = {
    totalExpenses: expenses.length,
    totalAmount: 0,
    byCategory: {},
    byDriver: {},
    averagePerTrip: 0,
    topExpenseCategory: null,
  };

  const tripExpenses = {};
  for (const exp of expenses) {
    stats.totalAmount += exp.amount;

    // By category
    if (!stats.byCategory[exp.category]) {
      stats.byCategory[exp.category] = { count: 0, total: 0 };
    }
    stats.byCategory[exp.category].count += 1;
    stats.byCategory[exp.category].total += exp.amount;

    // By driver
    if (!stats.byDriver[exp.driverId]) {
      stats.byDriver[exp.driverId] = { count: 0, total: 0 };
    }
    stats.byDriver[exp.driverId].count += 1;
    stats.byDriver[exp.driverId].total += exp.amount;

    // By trip
    if (!tripExpenses[exp.tripId]) {
      tripExpenses[exp.tripId] = 0;
    }
    tripExpenses[exp.tripId] += exp.amount;
  }

  if (Object.keys(tripExpenses).length > 0) {
    stats.averagePerTrip =
      stats.totalAmount /
      Object.keys(tripExpenses).length;
  }

  // Top category
  let topCategory = null;
  let topAmount = 0;
  for (const [cat, { total }] of Object.entries(stats.byCategory)) {
    if (total > topAmount) {
      topAmount = total;
      topCategory = cat;
    }
  }
  stats.topExpenseCategory = topCategory;

  res.json(stats);
}));

export default router;
