import { Platform } from 'react-native';

const API_PORT = 3001;
// Determine API origin based on platform to handle localhost correctly
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}/api`;
  }
  return `http://localhost:${API_PORT}/api`;
};

export const API_BASE_URL = getBaseUrl();

export const fetchDriver = async (driverId: string) => {
  const res = await fetch(`${API_BASE_URL}/drivers/${driverId}`);
  if (!res.ok) throw new Error('Failed to fetch driver');
  return res.json();
};

export const updateDriverStatus = async (driverId: string, status: 'on_shift' | 'off_shift') => {
  const res = await fetch(`${API_BASE_URL}/drivers/${driverId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update driver status');
  return res.json();
};

export const updateHOS = async (driverId: string, hoursDrivenToday: number) => {
  const res = await fetch(`${API_BASE_URL}/drivers/${driverId}/hos`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hoursDrivenToday })
  });
  if (!res.ok) throw new Error('Failed to update HOS');
  return res.json();
};
