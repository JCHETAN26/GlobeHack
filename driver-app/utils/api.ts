import { Platform } from 'react-native';

const API_PORT = 3001;

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}/api`;
  }
  return `http://localhost:${API_PORT}/api`;
};

export const getWsUrl = () => {
  if (Platform.OS === 'android') {
    return `ws://10.0.2.2:${API_PORT}`;
  }
  return `ws://localhost:${API_PORT}`;
};

export const API_BASE_URL = getBaseUrl();

// ─── Drivers ─────────────────────────────────────────────────────────────────

export const fetchDriver = async (driverId: string) => {
  const res = await fetch(`${API_BASE_URL}/drivers/${driverId}`);
  if (!res.ok) throw new Error('Failed to fetch driver');
  return res.json();
};

export const updateDriverStatus = async (driverId: string, status: 'on_shift' | 'off_shift') => {
  const res = await fetch(`${API_BASE_URL}/drivers/${driverId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update driver status');
  return res.json();
};

export const startShift = async (driverId: string) => {
  const res = await fetch(`${API_BASE_URL}/drivers/${driverId}/start-shift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Failed to start shift');
  return res.json();
};

export const endShift = async (driverId: string) => {
  const res = await fetch(`${API_BASE_URL}/drivers/${driverId}/end-shift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Failed to end shift');
  return res.json();
};

export const updateHOS = async (driverId: string, data: { hoursDrivenToday?: number; onDutyHoursToday?: number; weeklyHoursDriven?: number }) => {
  const res = await fetch(`${API_BASE_URL}/drivers/${driverId}/hos`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update HOS');
  return res.json();
};

// ─── Loads ───────────────────────────────────────────────────────────────────

export const fetchLoad = async (loadId: string) => {
  const res = await fetch(`${API_BASE_URL}/loads/${loadId}`);
  if (!res.ok) throw new Error('Failed to fetch load');
  return res.json();
};

export const acceptLoad = async (loadId: string, driverId: string) => {
  const res = await fetch(`${API_BASE_URL}/loads/${loadId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId }),
  });
  if (!res.ok) throw new Error('Failed to accept load');
  return res.json();
};

export const deliverLoad = async (loadId: string, driverId: string, extras?: { fuelCost?: number; deadheadMiles?: number }) => {
  const res = await fetch(`${API_BASE_URL}/loads/${loadId}/deliver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId, ...extras }),
  });
  if (!res.ok) throw new Error('Failed to deliver load');
  return res.json();
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export const logExpense = async (data: {
  driverId: string;
  tripId: string;
  category: 'fuel' | 'food' | 'toll' | 'parking' | 'repair' | 'lodging' | 'other';
  amount: number;
  notes?: string;
  location?: { lat: number; lng: number; address: string };
  fuel?: { gallons: number; pricePerGallon: number; station: string };
}) => {
  const res = await fetch(`${API_BASE_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to log expense');
  }
  return res.json();
};

export const fetchTripExpenses = async (tripId: string) => {
  const res = await fetch(`${API_BASE_URL}/expenses/trip/${tripId}`);
  if (!res.ok) throw new Error('Failed to fetch trip expenses');
  return res.json();
};

export const fetchDriverExpenses = async (driverId: string, days = 30) => {
  const res = await fetch(`${API_BASE_URL}/expenses/driver/${driverId}?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch driver expenses');
  return res.json();
};
