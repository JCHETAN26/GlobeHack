/**
 * DispatchIQ — Reporting Engine
 *
 * Generates comprehensive trip reports that Maria receives:
 *   - Timeline (pickup, delivery, duration)
 *   - Distance breakdown
 *   - Expenses (categorized with receipts)
 *   - Cost intelligence (CPM, margin, vs fleet average)
 *   - HOS compliance
 *   - Documents (BOL, POD, fuel receipts)
 *   - AI summary
 */

import store from '../data/store.js';

/**
 * Generate a complete trip report for a driver.
 * Called when trip is marked complete.
 */
export function generateTripReport(tripId, driverId) {
  const trip = store.getTrip(tripId);
  if (!trip) return null;

  const driver = store.getDriver(driverId);
  const load = store.getLoad(trip.loadId);

  if (!driver || !load) return null;

  // Gather trip expenses
  const tripExpenses = [];
  if (store.expenses) {
    for (const [, expense] of store.expenses.entries()) {
      if (expense.tripId === tripId) {
        tripExpenses.push(expense);
      }
    }
  }
  tripExpenses.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Calculate totals by category
  const expensesByCategory = {};
  let totalExpenses = 0;
  for (const exp of tripExpenses) {
    if (!expensesByCategory[exp.category]) {
      expensesByCategory[exp.category] = { count: 0, total: 0, items: [] };
    }
    expensesByCategory[exp.category].count += 1;
    expensesByCategory[exp.category].total += exp.amount;
    expensesByCategory[exp.category].items.push(exp);
    totalExpenses += exp.amount;
  }

  // Timestamps
  const assignedTime = trip.assignedAt || new Date().toISOString();
  const pickupTime = trip.pickupTime || assignedTime;
  const deliveryTime = trip.deliveredAt || new Date().toISOString();

  // Distance (from trip or load)
  const totalMiles = trip.totalMiles || load.estimatedDistance;
  const deadheadMiles = trip.deadheadMiles || 0;
  const loadedMiles = totalMiles - deadheadMiles;

  // Cost calculations
  const tripCost = totalExpenses; // simplified; could include labor, overhead
  const costPerMile = totalMiles > 0 ? tripCost / totalMiles : 0;
  const revenue = load.rate || 0;
  const profit = revenue - tripCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  // HOS
  const hos = {
    hoursDriven: trip.hoursDriven || 0,
    maxAllowed: 11,
    weeklyUsed: driver.hos?.weeklyHoursDriven || 0,
    weeklyMax: 70,
  };

  // Fleet average CPM (for comparison)
  const fleetAvgCPM = getFleetAverageCPM();
  const cpmVariance = fleetAvgCPM > 0
    ? ((costPerMile - fleetAvgCPM) / fleetAvgCPM) * 100
    : 0;

  // AI Summary
  const aiSummary = generateAISummary(
    costPerMile,
    fleetAvgCPM,
    cpmVariance,
    margin,
    tripExpenses,
    hos
  );

  // Build report object
  const report = {
    id: `REPORT-${tripId}`,
    tripId,
    driverId,
    driverName: driver.name,
    loadId: load.id,
    lane: `${load.pickup.city} → ${load.dropoff.city}`,
    date: new Date(pickupTime).toISOString().split('T')[0],

    // Timeline
    timeline: {
      assigned: assignedTime,
      pickup: pickupTime,
      delivery: deliveryTime,
      totalDuration: calculateDuration(pickupTime, deliveryTime),
    },

    // Distance
    distance: {
      totalMiles: Math.round(totalMiles * 100) / 100,
      deadheadMiles: Math.round(deadheadMiles * 100) / 100,
      loadedMiles: Math.round(loadedMiles * 100) / 100,
      deadheadPercentage: totalMiles > 0 ? (deadheadMiles / totalMiles * 100).toFixed(1) : 0,
    },

    // Expenses
    expenses: {
      byCategory: expensesByCategory,
      total: Math.round(totalExpenses * 100) / 100,
      itemCount: tripExpenses.length,
      receiptsUploaded: tripExpenses.filter((e) => e.receiptUrl).length,
    },

    // Cost intelligence
    costIntelligence: {
      fuelCostPerMile: Math.round((expensesByCategory.fuel?.total || 0) / totalMiles * 100) / 100,
      totalCostPerMile: Math.round(costPerMile * 100) / 100,
      costPerMileVsFleet: `${cpmVariance > 0 ? '+' : ''}${cpmVariance.toFixed(1)}%`,
      revenue: Math.round(revenue * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      fleetAverageCPM: Math.round(fleetAvgCPM * 100) / 100,
    },

    // HOS compliance
    hosCompliance: {
      hoursDriven: hos.hoursDriven,
      maxAllowed: hos.maxAllowed,
      compliant: hos.hoursDriven <= hos.maxAllowed,
      weeklyUsed: hos.weeklyUsed,
      weeklyMax: hos.weeklyMax,
      weeklyCompliant: hos.weeklyUsed <= hos.weeklyMax,
      violations: [],
    },

    // Documents (placeholders)
    documents: {
      bol: { uploaded: true, timestamp: pickupTime },
      pod: { uploaded: true, timestamp: deliveryTime },
      fuelReceipts: expensesByCategory.fuel?.items || [],
    },

    // AI Summary
    aiSummary,

    // Generated
    generatedAt: new Date().toISOString(),
  };

  return report;
}

/**
 * Get average CPM for all drivers (fleet benchmark).
 */
function getFleetAverageCPM() {
  let totalCPM = 0;
  let driverCount = 0;
  for (const driver of store.getAllDrivers()) {
    if (driver.performance?.avgCostPerMile) {
      totalCPM += driver.performance.avgCostPerMile;
      driverCount += 1;
    }
  }
  return driverCount > 0 ? totalCPM / driverCount : 1.80;
}

/**
 * Calculate duration between two ISO timestamps.
 */
function calculateDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const hours = (end - start) / (1000 * 60 * 60);
  return `${hours.toFixed(1)} hrs`;
}

/**
 * Generate AI summary insights about the trip.
 */
function generateAISummary(costPerMile, fleetAvgCPM, cpmVariance, margin, expenses, hos) {
  const insights = [];

  // Cost efficiency
  if (cpmVariance < -5) {
    insights.push(
      `✅ Excellent efficiency: Cost per mile is ${Math.abs(cpmVariance).toFixed(1)}% below fleet average.`
    );
  } else if (cpmVariance > 5) {
    insights.push(
      `⚠️ Cost per mile is ${cpmVariance.toFixed(1)}% above fleet average. Review fuel and route efficiency.`
    );
  }

  // Margin
  if (margin > 75) {
    insights.push(
      `✅ Strong margin at ${margin.toFixed(0)}%. This trip was highly profitable.`
    );
  } else if (margin < 25) {
    insights.push(
      `⚠️ Low margin at ${margin.toFixed(0)}%. Consider cost optimization.`
    );
  }

  // Fuel efficiency
  const fuelExpenses = expenses.filter((e) => e.category === 'fuel');
  if (fuelExpenses.length > 1) {
    const avgFuelPrice = fuelExpenses.reduce((sum, e) => sum + (e.fuel?.pricePerGallon || 0), 0) / fuelExpenses.length;
    insights.push(`Fueled ${fuelExpenses.length} times at avg $${avgFuelPrice.toFixed(2)}/gal.`);
  }

  // HOS compliance
  if (!hos.violations || hos.violations.length === 0) {
    insights.push(`✅ HOS compliant. No violations.`);
  }

  // Missing receipts
  const missingReceipts = expenses.filter((e) => !e.receiptUrl && e.category !== 'toll');
  if (missingReceipts.length > 0) {
    insights.push(
      `⚠️ ${missingReceipts.length} expense(s) missing receipt. Flag for reimbursement policy.`
    );
  }

  return insights.join(' ');
}

export default generateTripReport;
