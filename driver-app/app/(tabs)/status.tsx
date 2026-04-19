import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Dimensions } from 'react-native';
import { useWebSocket } from '@/hooks/useWebSocket';

const { width } = Dimensions.get('window');

/**
 * Screen 1: Home/Status
 * 
 * Shows:
 *   - Current shift status (on/off)
 *   - HOS remaining hours
 *   - Current load assignment
 *   - Quick actions
 */
export default function StatusScreen() {
  const { connected, logExpense, completeTrip, updateHOS } = useWebSocket();
  
  const [shiftActive, setShiftActive] = useState(true);
  const [hosRemaining, setHosRemaining] = useState(11); // Max 11 hours
  const [currentLoad, setCurrentLoad] = useState({
    id: 'LOAD-001',
    pickup: { city: 'Phoenix', state: 'AZ' },
    dropoff: { city: 'Tucson', state: 'AZ' },
    miles: 120,
    rate: '$420',
    deadline: '2026-04-28 3:00 PM',
  });

  const toggleShift = (value) => {
    setShiftActive(value);
    updateHOS(0, new Date().toISOString());
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>👤 Carlos Rivera</Text>
        <Text style={styles.driverId}>Driver ID: DRV-001</Text>
      </View>

      {/* Connection Status */}
      <View style={[styles.statusBadge, connected ? styles.connected : styles.disconnected]}>
        <Text style={styles.statusText}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
      </View>

      {/* Shift Status Card */}
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

      {/* HOS Remaining */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hours of Service Remaining</Text>
        <View style={styles.hosBar}>
          <View
            style={[
              styles.hosProgress,
              { width: `${(hosRemaining / 11) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.hosText}>{hosRemaining} / 11 hours available</Text>
      </View>

      {/* Current Load Assignment */}
      {currentLoad && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Current Load</Text>
          <Text style={styles.loadText}>
            {currentLoad.pickup.city}, {currentLoad.pickup.state} →{' '}
            {currentLoad.dropoff.city}, {currentLoad.dropoff.state}
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
      )}

      {/* Quick Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.buttonPrimary]}
          onPress={() => {
            completeTrip('TRIP-001');
            setCurrentLoad(null);
          }}
        >
          <Text style={styles.buttonText}>✓ Complete Load</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.buttonSecondary]}>
          <Text style={styles.buttonText}>🚫 Decline Load</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  driverId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    width: 'auto',
  },
  connected: {
    backgroundColor: '#e8f5e9',
  },
  disconnected: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardText: {
    fontSize: 14,
    color: '#333',
  },
  hosBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  hosProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  hosText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  loadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  loadDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  actions: {
    marginTop: 16,
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
  },
  buttonSecondary: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
