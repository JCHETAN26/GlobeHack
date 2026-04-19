/**
 * Dashboard WebSocket Hook - module-level singleton
 * Avoids React StrictMode double-mount connect/disconnect races.
 */

import { useEffect, useState, useCallback } from 'react';

const WS_URL = 'ws://localhost:3001';
const CLIENT_ID = `dashboard-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const RECONNECT_DELAY = 3000;

type Expense = Record<string, any>;
type TripReport = Record<string, any>;
type HosUpdate = Record<string, any>;
type LoadAssignment = Record<string, any>;

// Module-level state
let socket: WebSocket | null = null;
let _connected = false;
let _expenses: Expense[] = [];
let _tripReports: TripReport[] = [];
let _hosUpdates: HosUpdate[] = [];
let _loadAssignments: LoadAssignment[] = [];
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

function connect() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log('[Dashboard WS] Connected');
    _connected = true;
    socket!.send(JSON.stringify({ type: 'register', clientId: CLIENT_ID, clientType: 'dashboard' }));
    notify();
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'registered':
          console.log('[Dashboard WS] Registered:', message.clientId);
          break;

        case 'expense:logged':
          _expenses = [..._expenses, { ...message.payload, arrivedAt: new Date().toISOString() }];
          window.dispatchEvent(new CustomEvent('expense:logged', { detail: message.payload }));
          console.log('[Dashboard WS] Expense logged:', message.payload?.amount);
          notify();
          break;

        case 'trip:completed':
          _tripReports = [..._tripReports, message.payload];
          window.dispatchEvent(new CustomEvent('trip:completed', { detail: message.payload }));
          console.log('[Dashboard WS] Trip completed:', message.tripId);
          notify();
          break;

        case 'hos:updated':
          _hosUpdates = [
            ..._hosUpdates,
            { ...message.payload, driverId: message.driverId, timestamp: new Date().toISOString() },
          ];
          window.dispatchEvent(new CustomEvent('hos:updated', { detail: message.payload }));
          console.log('[Dashboard WS] HOS updated for', message.driverId);
          notify();
          break;

        case 'load:assigned':
          _loadAssignments = [
            ..._loadAssignments,
            { ...message.payload, driverId: message.driverId, timestamp: new Date().toISOString() },
          ];
          window.dispatchEvent(new CustomEvent('load:assigned', { detail: message.payload }));
          console.log('[Dashboard WS] Load assigned to', message.driverId);
          notify();
          break;

        default:
          console.log('[Dashboard WS] Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('[Dashboard WS] Parse error:', err);
    }
  };

  socket.onerror = (err) => {
    console.error('[Dashboard WS] Error:', err);
  };

  socket.onclose = () => {
    console.log('[Dashboard WS] Disconnected. Reconnecting in 3s…');
    _connected = false;
    notify();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
  };
}

// Start connecting immediately at module load
connect();

export function useDashboardWebSocket() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener: Listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const clearExpenses = useCallback(() => {
    _expenses = [];
    notify();
  }, []);

  const clearTripReports = useCallback(() => {
    _tripReports = [];
    notify();
  }, []);

  const getLatestTripReport = useCallback((driverId: string) => {
    return (
      _tripReports
        .filter((r) => r.driverId === driverId)
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0] ??
      null
    );
  }, []);

  const getDriverExpenses = useCallback((driverId: string) => {
    return _expenses.filter((e) => e.driverId === driverId);
  }, []);

  const getTripTotal = useCallback((tripId: string) => {
    return _expenses.filter((e) => e.tripId === tripId).reduce((sum, e) => sum + e.amount, 0);
  }, []);

  return {
    connected: _connected,
    expenses: _expenses,
    tripReports: _tripReports,
    hosUpdates: _hosUpdates,
    loadAssignments: _loadAssignments,
    getLatestTripReport,
    getDriverExpenses,
    getTripTotal,
    clearExpenses,
    clearTripReports,
  };
}
