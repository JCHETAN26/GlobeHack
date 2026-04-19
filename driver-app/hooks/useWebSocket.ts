import { useEffect, useRef, useState, useCallback } from 'react';
import { getWsUrl, logExpense as apiLogExpense, deliverLoad as apiDeliverLoad, updateHOS as apiUpdateHOS, acceptLoad as apiAcceptLoad } from '@/utils/api';

const DRIVER_ID = 'DRV-001';
const RECONNECT_DELAY = 3000;

type MessageCallback = (data: any) => void;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const subscribersRef = useRef<Map<string, Set<MessageCallback>>>(new Map());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clientId] = useState(() => `driver-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const subscribe = useCallback((type: string, cb: MessageCallback) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set());
    }
    subscribersRef.current.get(type)!.add(cb);
    return () => subscribersRef.current.get(type)?.delete(cb);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({
        type: 'register',
        clientId,
        clientType: 'driver',
        driverId: DRIVER_ID,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        subscribersRef.current.get(msg.type)?.forEach((cb) => cb(msg));
      } catch (e) {
        console.error('[WS] parse error', e);
      }
    };

    ws.onerror = () => setConnected(false);

    ws.onclose = () => {
      setConnected(false);
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
    };

    wsRef.current = ws;
  }, [clientId]);

  useEffect(() => {
    connect();
    return () => {
      reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // ─── Actions — REST first, backend broadcasts WS to dashboard ──────────────

  const logExpense = useCallback(async (expense: {
    tripId: string;
    category: 'fuel' | 'food' | 'toll' | 'parking' | 'repair' | 'lodging' | 'other';
    amount: number;
    notes?: string;
    location?: { lat: number; lng: number; address: string };
    fuel?: { gallons: number; pricePerGallon: number; station: string };
  }) => {
    return apiLogExpense({ driverId: DRIVER_ID, ...expense });
  }, []);

  const acceptLoad = useCallback(async (loadId: string) => {
    return apiAcceptLoad(loadId, DRIVER_ID);
  }, []);

  const completeTrip = useCallback(async (loadId: string, extras?: { fuelCost?: number; deadheadMiles?: number }) => {
    // Auto-accept if still in assigned state, then deliver
    try {
      return await apiDeliverLoad(loadId, DRIVER_ID, extras);
    } catch (e: any) {
      if (e?.message?.includes('not in transit')) {
        await apiAcceptLoad(loadId, DRIVER_ID);
        return await apiDeliverLoad(loadId, DRIVER_ID, extras);
      }
      throw e;
    }
  }, []);

  const updateHOS = useCallback(async (hoursDrivenToday: number, weeklyHoursDriven?: number) => {
    return apiUpdateHOS(DRIVER_ID, { hoursDrivenToday, weeklyHoursDriven });
  }, []);

  return {
    connected,
    subscribe,
    logExpense,
    acceptLoad,
    completeTrip,
    updateHOS,
    driverId: DRIVER_ID,
  };
}
