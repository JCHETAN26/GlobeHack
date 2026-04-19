/**
 * Dashboard WebSocket Hook
 * 
 * Listens to real-time events from backend:
 *   - expense:logged → Driver logged an expense
 *   - trip:completed → Trip finished, report generated
 *   - hos:updated → HOS status changed
 *   - load:assigned → Load assigned to driver
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export function useDashboardWebSocket(backendUrl = 'ws://localhost:3001') {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [tripReports, setTripReports] = useState([]);
  const [hosUpdates, setHosUpdates] = useState([]);
  const [loadAssignments, setLoadAssignments] = useState([]);
  const [clientId] = useState(() => `dashboard-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  // Connect to WebSocket on mount
  useEffect(() => {
    const ws = new WebSocket(backendUrl);

    ws.onopen = () => {
      console.log('[Dashboard WS] Connected');
      setConnected(true);

      // Register as dashboard client
      ws.send(JSON.stringify({
        type: 'register',
        clientId,
        clientType: 'dashboard',
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Dashboard WS] Received:', message.type);

        // Route messages by type
        switch (message.type) {
          case 'registered':
            console.log('[Dashboard WS] Registered:', message.clientId);
            break;

          case 'expense:logged':
            // Add expense to state
            setExpenses((prev) => [
              ...prev,
              {
                ...message.payload,
                arrivedAt: new Date().toISOString(),
              },
            ]);
            // Notify consumer
            window.dispatchEvent(
              new CustomEvent('expense:logged', {
                detail: message.payload,
              })
            );
            console.log('[Dashboard] Expense logged:', message.payload.amount);
            break;

          case 'trip:completed':
            // Add trip report to state
            setTripReports((prev) => [...prev, message.payload]);
            // Notify consumer
            window.dispatchEvent(
              new CustomEvent('trip:completed', {
                detail: message.payload,
              })
            );
            console.log('[Dashboard] Trip completed:', message.tripId);
            break;

          case 'hos:updated':
            // Track HOS updates
            setHosUpdates((prev) => [
              ...prev,
              {
                ...message.payload,
                driverId: message.driverId,
                timestamp: new Date().toISOString(),
              },
            ]);
            // Notify consumer
            window.dispatchEvent(
              new CustomEvent('hos:updated', {
                detail: message.payload,
              })
            );
            console.log('[Dashboard] HOS updated for', message.driverId);
            break;

          case 'load:assigned':
            // Track load assignments
            setLoadAssignments((prev) => [
              ...prev,
              {
                ...message.payload,
                driverId: message.driverId,
                timestamp: new Date().toISOString(),
              },
            ]);
            // Notify consumer
            window.dispatchEvent(
              new CustomEvent('load:assigned', {
                detail: message.payload,
              })
            );
            console.log('[Dashboard] Load assigned to', message.driverId);
            break;

          default:
            console.log('[Dashboard WS] Unknown message type:', message.type);
        }
      } catch (err) {
        console.error('[Dashboard WS] Parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[Dashboard WS] Error:', err);
    };

    ws.onclose = () => {
      console.log('[Dashboard WS] Disconnected. Reconnecting in 3s...');
      setConnected(false);
      setTimeout(() => {
        const newWs = new WebSocket(backendUrl);
        wsRef.current = newWs;
      }, 3000);
    };

    wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [backendUrl, clientId]);

  // Get latest trip report for a driver
  const getLatestTripReport = useCallback(
    (driverId) => {
      return tripReports
        .filter((r) => r.driverId === driverId)
        .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))[0] || null;
    },
    [tripReports]
  );

  // Get expenses for a specific driver
  const getDriverExpenses = useCallback(
    (driverId) => {
      return expenses.filter((e) => e.driverId === driverId);
    },
    [expenses]
  );

  // Get total expenses for a trip
  const getTripTotal = useCallback(
    (tripId) => {
      return expenses
        .filter((e) => e.tripId === tripId)
        .reduce((sum, e) => sum + e.amount, 0);
    },
    [expenses]
  );

  // Clear expenses (after viewing)
  const clearExpenses = useCallback(() => {
    setExpenses([]);
  }, []);

  // Clear trip reports (after viewing)
  const clearTripReports = useCallback(() => {
    setTripReports([]);
  }, []);

  return {
    connected,
    expenses,
    tripReports,
    hosUpdates,
    loadAssignments,
    getLatestTripReport,
    getDriverExpenses,
    getTripTotal,
    clearExpenses,
    clearTripReports,
  };
}
