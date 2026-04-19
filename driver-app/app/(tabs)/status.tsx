import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchDriver, startShift, endShift } from '@/utils/api';

export default function StatusScreen() {
  const { connected, subscribe, acceptLoad, completeTrip, driverId } = useWebSocket();

  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState('');
  const [shiftActive, setShiftActive] = useState(false);
  const [hosRemaining, setHosRemaining] = useState(11);
  const [currentLoad, setCurrentLoad] = useState<{
    id: string;
    status: 'assigned' | 'in_transit' | string;
    pickup: { city: string; state?: string };
    dropoff: { city: string; state?: string };
    miles: number;
    rate: string;
    deadline: string;
  } | null>(null);
  const [accepting, setAccepting] = useState(false);

  const loadDriverData = useCallback(async () => {
    try {
      const data = await fetchDriver(driverId);
      setDriverName(data.name || driverId);
      setShiftActive(data.status === 'on_shift');
      if (data.hosDetails?.effectiveRemaining != null) {
        setHosRemaining(Math.max(0, data.hosDetails.effectiveRemaining));
      }
      if (data.activeLoad) {
        const load = data.activeLoad;
        setCurrentLoad({
          id: load.id,
          status: load.status || 'assigned',
          pickup: { city: load.pickup?.city || '—', state: '' },
          dropoff: { city: load.dropoff?.city || '—', state: '' },
          miles: load.estimatedDistance || 0,
          rate: `$${load.rate || 0}`,
          deadline: load.deliveryDeadline ? new Date(load.deliveryDeadline).toLocaleString() : '—',
        });
      }
    } catch (e) {
      console.warn('[Status] Failed to load driver:', e);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadDriverData();
  }, [loadDriverData]);

  // Listen for load:assigned WS events
  useEffect(() => {
    return subscribe('load:assigned', (msg) => {
      const load = msg.payload;
      if (!load) return;
      setCurrentLoad({
        id: load.id,
        status: load.status || 'assigned',
        pickup: { city: load.pickup?.city || '—', state: '' },
        dropoff: { city: load.dropoff?.city || '—', state: '' },
        miles: load.estimatedDistance || 0,
        rate: `$${load.rate || 0}`,
        deadline: load.deliveryDeadline ? new Date(load.deliveryDeadline).toLocaleString() : '—',
      });
      Alert.alert('New Load Assigned!', `${load.pickup?.city} → ${load.dropoff?.city}`);
    });
  }, [subscribe]);

  const toggleShift = async (value: boolean) => {
    try {
      if (value) {
        await startShift(driverId);
      } else {
        await endShift(driverId);
      }
      setShiftActive(value);
    } catch (e) {
      Alert.alert('Error', 'Failed to update shift status');
    }
  };

  const handleAcceptLoad = async () => {
    if (!currentLoad) return;
    setAccepting(true);
    try {
      await acceptLoad(currentLoad.id);
      setCurrentLoad((prev) => prev ? { ...prev, status: 'in_transit' } : null);
      Alert.alert('Picked Up ✅', 'Load is now in transit. Log expenses as you go.');
    } catch (e) {
      Alert.alert('Error', 'Failed to confirm pickup. Try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleCompleteLoad = async () => {
    if (!currentLoad) return;
    try {
      await completeTrip(currentLoad.id);
      setCurrentLoad(null);
      Alert.alert('Trip Completed ✅', 'Trip report sent to dashboard in real-time.');
    } catch (e) {
      Alert.alert('Error', 'Failed to complete load. Try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{driverName || driverId}</Text>
        <Text style={styles.driverId}>Driver ID: {driverId}</Text>
      </View>

      <View style={[styles.statusBadge, connected ? styles.connected : styles.disconnected]}>
        <Text style={styles.statusText}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Shift Status</Text>
          <Switch
            value={shiftActive}
            onValueChange={toggleShift}
            trackColor={{ false: '#d0d0d0', true: '#4CAF50' }}
            thumbColor={shiftActive ? '#fff' : '#f0f0f0'}
          />
        </View>
        <Text style={styles.cardText}>
          {shiftActive ? '✅ Shift Active' : '⏸️  Shift Inactive'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hours of Service Remaining</Text>
        <View style={styles.hosBar}>
          <View style={[styles.hosProgress, { width: `${(hosRemaining / 11) * 100}%` }]} />
        </View>
        <Text style={styles.hosText}>{hosRemaining.toFixed(1)} / 11 hours available</Text>
      </View>

      {currentLoad ? (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.cardTitle}>📦 Current Load</Text>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
              backgroundColor: currentLoad.status === 'in_transit' ? '#e8f5e9' : '#fff3e0',
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: currentLoad.status === 'in_transit' ? '#388e3c' : '#f57c00' }}>
                {currentLoad.status === 'in_transit' ? '🚛 IN TRANSIT' : '📋 ASSIGNED'}
              </Text>
            </View>
          </View>
          <Text style={styles.loadText}>
            {currentLoad.pickup.city} → {currentLoad.dropoff.city}
          </Text>
          <View style={styles.loadDetails}>
            <View>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>{currentLoad.miles} mi</Text>
            </View>
            <View>
              <Text style={styles.label}>Rate</Text>
              <Text style={styles.value}>{currentLoad.rate}</Text>
            </View>
            <View>
              <Text style={styles.label}>Deadline</Text>
              <Text style={styles.value}>{currentLoad.deadline}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 No Active Load</Text>
          <Text style={styles.cardText}>Waiting for assignment from dispatch...</Text>
        </View>
      )}

      <View style={styles.actions}>
        {currentLoad?.status !== 'in_transit' && (
          <Pressable
            style={[styles.button, { backgroundColor: '#FF9800' }, (!currentLoad || accepting) && styles.buttonDisabled]}
            onPress={handleAcceptLoad}
            disabled={!currentLoad || accepting}
          >
            <Text style={styles.buttonText}>{accepting ? 'Confirming...' : '📍 Confirm Pickup'}</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.button, styles.buttonPrimary, (!currentLoad || currentLoad.status !== 'in_transit') && styles.buttonDisabled]}
          onPress={handleCompleteLoad}
          disabled={!currentLoad || currentLoad.status !== 'in_transit'}
        >
          <Text style={styles.buttonText}>✓ Complete Trip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  driverId: { fontSize: 12, color: '#666', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16 },
  connected: { backgroundColor: '#e8f5e9' },
  disconnected: { backgroundColor: '#ffebee' },
  statusText: { fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  cardText: { fontSize: 14, color: '#333' },
  hosBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginVertical: 8, overflow: 'hidden' },
  hosProgress: { height: '100%', backgroundColor: '#4CAF50' },
  hosText: { fontSize: 13, color: '#666', marginTop: 8 },
  loadText: { fontSize: 14, fontWeight: '500', color: '#1a1a1a', marginBottom: 12 },
  loadDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  label: { fontSize: 11, color: '#999', marginBottom: 4 },
  value: { fontSize: 13, fontWeight: '600', color: '#000' },
  actions: { marginTop: 16, gap: 8 },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonPrimary: { backgroundColor: '#4CAF50' },
  buttonSecondary: { backgroundColor: '#f44336' },
  buttonDisabled: { backgroundColor: '#a5d6a7' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
