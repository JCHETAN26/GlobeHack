/**
 * DispatchIQ — In-Memory Data Store
 *
 * Centralized state management for drivers, loads, trips, fuel receipts,
 * and the load board. Initialized with seed data on startup.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  seedDrivers,
  seedLoads,
  seedTrips,
  seedFuelReceipts,
  seedLoadBoard,
} from './seed.js';

class Store {
  constructor() {
    this.drivers = new Map();
    this.loads = new Map();
    this.trips = new Map();
    this.fuelReceipts = new Map();
    this.loadBoard = new Map();
    this.alerts = []; // compliance + system alerts

    this._seed();
  }

  // ─── Initialization ──────────────────────────────────────────────────────

  _seed() {
    for (const d of seedDrivers) {
      this.drivers.set(d.id, { ...d, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    for (const l of seedLoads) {
      this.loads.set(l.id, { ...l });
    }
    for (const t of seedTrips) {
      this.trips.set(t.id, { ...t });
    }
    for (const f of seedFuelReceipts) {
      this.fuelReceipts.set(f.id, { ...f });
    }
    for (const lb of seedLoadBoard) {
      this.loadBoard.set(lb.id, { ...lb });
    }
    console.log(`[Store] Seeded: ${this.drivers.size} drivers, ${this.loads.size} loads, ${this.trips.size} trips, ${this.fuelReceipts.size} fuel receipts, ${this.loadBoard.size} load board entries`);
  }

  // ─── Drivers ─────────────────────────────────────────────────────────────

  getDriver(id) {
    return this.drivers.get(id) || null;
  }

  getAllDrivers() {
    return Array.from(this.drivers.values());
  }

  getAvailableDrivers() {
    return this.getAllDrivers().filter(
      (d) => d.status === 'on_shift' && !d.currentLoadId
    );
  }

  getDriversByStatus(status) {
    return this.getAllDrivers().filter((d) => d.status === status);
  }

  updateDriver(id, updates) {
    const driver = this.drivers.get(id);
    if (!driver) return null;

    const updated = {
      ...driver,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Deep merge nested objects
    if (updates.location) {
      updated.location = { ...driver.location, ...updates.location, updatedAt: new Date().toISOString() };
    }
    if (updates.hos) {
      updated.hos = { ...driver.hos, ...updates.hos };
    }
    if (updates.performance) {
      updated.performance = { ...driver.performance, ...updates.performance };
    }

    this.drivers.set(id, updated);
    return updated;
  }

  // ─── Loads ───────────────────────────────────────────────────────────────

  getLoad(id) {
    return this.loads.get(id) || null;
  }

  getAllLoads() {
    return Array.from(this.loads.values());
  }

  getLoadsByStatus(status) {
    return this.getAllLoads().filter((l) => l.status === status);
  }

  createLoad(loadData) {
    const id = `LOAD-${uuidv4().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    const load = {
      id,
      ...loadData,
      status: 'available',
      assignedDriverId: null,
      assignedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.loads.set(id, load);
    return load;
  }

  updateLoad(id, updates) {
    const load = this.loads.get(id);
    if (!load) return null;

    const updated = {
      ...load,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.loads.set(id, updated);
    return updated;
  }

  getActiveLoadForDriver(driverId) {
    return this.getAllLoads().find(
      (l) => l.assignedDriverId === driverId && ['assigned', 'in_transit'].includes(l.status)
    ) || null;
  }

  // ─── Trips ───────────────────────────────────────────────────────────────

  getTrip(id) {
    return this.trips.get(id) || null;
  }

  getAllTrips() {
    return Array.from(this.trips.values());
  }

  getTripsForDriver(driverId, days = 30) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    return this.getAllTrips().filter(
      (t) => t.driverId === driverId && t.completedAt >= cutoff
    );
  }

  getTripsInPeriod(days = 7) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    return this.getAllTrips().filter((t) => t.completedAt >= cutoff);
  }

  getTripsByLane(origin, destination) {
    return this.getAllTrips().filter(
      (t) => t.lane.origin === origin && t.lane.destination === destination
    );
  }

  createTrip(tripData) {
    const id = `TRIP-${uuidv4().slice(0, 8).toUpperCase()}`;
    const trip = { id, ...tripData, completedAt: new Date().toISOString() };
    this.trips.set(id, trip);
    return trip;
  }

  // ─── Fuel Receipts ───────────────────────────────────────────────────────

  getFuelReceipt(id) {
    return this.fuelReceipts.get(id) || null;
  }

  getAllFuelReceipts() {
    return Array.from(this.fuelReceipts.values());
  }

  getFuelReceiptsForDriver(driverId, days = 30) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    return this.getAllFuelReceipts().filter(
      (f) => f.driverId === driverId && f.timestamp >= cutoff
    );
  }

  getFuelReceiptsInPeriod(days = 7) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    return this.getAllFuelReceipts().filter((f) => f.timestamp >= cutoff);
  }

  createFuelReceipt(receiptData) {
    const id = `FUEL-${uuidv4().slice(0, 8).toUpperCase()}`;
    const receipt = {
      id,
      ...receiptData,
      timestamp: receiptData.timestamp || new Date().toISOString(),
    };
    this.fuelReceipts.set(id, receipt);
    return receipt;
  }

  // ─── Load Board ──────────────────────────────────────────────────────────

  getLoadBoardEntry(id) {
    return this.loadBoard.get(id) || null;
  }

  getAllLoadBoardEntries() {
    return Array.from(this.loadBoard.values());
  }

  getLoadBoardNear(lat, lng, radiusMiles = 25) {
    // Uses simple distance check — imported by consumers
    return this.getAllLoadBoardEntries();
    // Actual filtering done by the backhaul engine using geo utilities
  }

  addLoadBoardEntry(entry) {
    const id = `LB-${uuidv4().slice(0, 8).toUpperCase()}`;
    this.loadBoard.set(id, { id, ...entry });
    return this.loadBoard.get(id);
  }

  // ─── Alerts ──────────────────────────────────────────────────────────────

  addAlert(alert) {
    const id = `ALERT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const entry = {
      id,
      ...alert,
      acknowledged: false,
      createdAt: new Date().toISOString(),
    };
    this.alerts.push(entry);
    return entry;
  }

  getAlerts(filters = {}) {
    let alerts = [...this.alerts];
    if (filters.driverId) {
      alerts = alerts.filter((a) => a.driverId === filters.driverId);
    }
    if (filters.type) {
      alerts = alerts.filter((a) => a.type === filters.type);
    }
    if (filters.unacknowledged) {
      alerts = alerts.filter((a) => !a.acknowledged);
    }
    return alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  acknowledgeAlert(id) {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
    }
    return alert || null;
  }

  // ─── Stats Helpers ───────────────────────────────────────────────────────

  /**
   * Get unique lanes from completed trips.
   */
  getUniqueLanes() {
    const lanes = new Map();
    for (const trip of this.getAllTrips()) {
      const key = `${trip.lane.origin} → ${trip.lane.destination}`;
      if (!lanes.has(key)) {
        lanes.set(key, { origin: trip.lane.origin, destination: trip.lane.destination, trips: [] });
      }
      lanes.get(key).trips.push(trip);
    }
    return Array.from(lanes.values());
  }
}

// Singleton instance
const store = new Store();
export default store;
