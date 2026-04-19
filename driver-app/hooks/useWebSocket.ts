import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useWebSocket Hook
 * 
 * Manages real-time bidirectional communication with DispatchIQ backend.
 * Automatically reconnects on disconnect.
 */
export function useWebSocket(backendUrl = 'ws://localhost:3001') {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [clientId] = useState(() => `driver-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  // Register driver client on first connect
  useEffect(() => {
    const ws = new WebSocket(backendUrl);

    ws.onopen = () => {
      console.log('[WebSocket] Connected');
      setConnected(true);

      // Register as driver
      ws.send(JSON.stringify({
        type: 'register',
        clientId,
        clientType: 'driver',
        driverId: 'DRIVER-001', // Will be dynamic later
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[WebSocket] Message received:', message.type);
        setLastMessage(message);
      } catch (err) {
        console.error('[WebSocket] Parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[WebSocket] Error:', err);
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected. Reconnecting in 3s...');
      setConnected(false);
      setTimeout(() => {
        // Reconnect
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

  // Send message to backend
  const send = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('[WebSocket] Sent:', message.type);
    } else {
      console.warn('[WebSocket] Not connected, cannot send:', message.type);
    }
  }, []);

  // Send expense to backend (then it broadcasts to dashboard)
  const logExpense = useCallback((expense) => {
    send({
      type: 'expense:logged',
      clientId,
      driverId: 'DRIVER-001',
      tripId: expense.tripId || 'TRIP-001',
      payload: expense,
    });
  }, [send, clientId]);

  // Mark trip as complete (triggers report generation)
  const completeTrip = useCallback((tripId) => {
    send({
      type: 'trip:completed',
      clientId,
      driverId: 'DRIVER-001',
      tripId,
      payload: { completedAt: new Date().toISOString() },
    });
  }, [send, clientId]);

  // Update HOS
  const updateHOS = useCallback((hoursDriven, hosBreak) => {
    send({
      type: 'hos:updated',
      clientId,
      driverId: 'DRIVER-001',
      payload: { hoursDriven, hosBreak, timestamp: new Date().toISOString() },
    });
  }, [send, clientId]);

  return {
    connected,
    send,
    lastMessage,
    logExpense,
    completeTrip,
    updateHOS,
  };
}
