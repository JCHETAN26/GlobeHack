import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Animated, Platform } from 'react-native';
import { fetchDriver, updateDriverStatus, updateHOS } from '../../utils/api';

const { width } = Dimensions.get('window');

const DRIVER_ID = 'DRV-001';

export default function HomeScreen() {
  const [driver, setDriver] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadData = async () => {
    try {
      const data = await fetchDriver(DRIVER_ID);
      setDriver(data);
      setError(null);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      setError(err.message || 'Failed to load driver data. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Setup polling every 10 seconds for the handshake
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleStatus = async () => {
    if (!driver) return;
    try {
      const newStatus = driver.status === 'on_shift' ? 'off_shift' : 'on_shift';
      await updateDriverStatus(DRIVER_ID, newStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddHOS = async () => {
    if (!driver || driver.status === 'off_shift') {
      alert('Must be on shift to log HOS.');
      return;
    }
    try {
      const currentHOS = driver.hos?.hoursDrivenToday || 0;
      await updateHOS(DRIVER_ID, Math.min(11, currentHOS + 0.5));
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading DispatchIQ...</Text>
      </View>
    );
  }

  const isOnShift = driver?.status === 'on_shift';

  return (
    <Animated.ScrollView 
      style={[styles.container, { opacity: fadeAnim }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A1CEDC" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>{driver?.name || 'Driver'}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{driver?.name?.charAt(0) || 'D'}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.cardTitle}>Current Status</Text>
          <View style={[styles.badge, isOnShift ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={styles.badgeText}>{isOnShift ? '🟢 On Shift' : '⚫ Off Shift'}</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.mainButton, isOnShift ? styles.btnDanger : styles.btnSuccess]} 
            onPress={handleToggleStatus}
          >
            <Text style={styles.mainButtonText}>
              {isOnShift ? 'End Shift' : 'Start Shift'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {driver?.hosDetails?.effectiveRemaining?.toFixed(1) || '0.0'}h
          </Text>
          <Text style={styles.statLabel}>HOS Remaining</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{driver?.performance?.avgCostPerMile ? `$${driver.performance.avgCostPerMile}` : 'N/A'}</Text>
          <Text style={styles.statLabel}>Cost per Mile</Text>
        </View>
      </View>

      {isOnShift && (
        <View style={styles.hosCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.cardTitle}>Log Hours (Demo)</Text>
            <Text style={styles.cardSubtitle}>{driver?.hos?.hoursDrivenToday?.toFixed(1) || 0} / 11 hrs</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${Math.min(100, ((driver?.hos?.hoursDrivenToday || 0) / 11) * 100)}%` }]} />
          </View>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleAddHOS}>
            <Text style={styles.secondaryButtonText}>+ Add 0.5 Hours (Simulate)</Text>
          </TouchableOpacity>
        </View>
      )}

      {driver?.activeLoad ? (
        <View style={styles.loadCard}>
          <Text style={styles.cardTitle}>Active Load</Text>
          <View style={styles.loadRow}>
            <Text style={styles.loadLoc}>{driver.activeLoad.pickup?.city}</Text>
            <Text style={styles.loadArrow}>→</Text>
            <Text style={styles.loadLoc}>{driver.activeLoad.dropoff?.city}</Text>
          </View>
          <Text style={styles.loadRate}>Rate: ${driver.activeLoad.rate}</Text>
        </View>
      ) : (
        <View style={styles.emptyLoadBox}>
          <Text style={styles.emptyLoadText}>No active load assigned.</Text>
          {isOnShift && <Text style={styles.emptyLoadSub}>Waiting for dispatch...</Text>}
        </View>
      )}

    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 24,
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#A1CEDC',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    color: '#94A3B8',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  name: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#7F1D1D',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: '#166534',
  },
  badgeInactive: {
    backgroundColor: '#475569',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    alignItems: 'center',
  },
  mainButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#3B82F6',
  },
  btnDanger: {
    backgroundColor: '#EF4444',
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: (width - 48 - 12) / 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  hosCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 6,
  },
  secondaryButton: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  loadCard: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
  },
  loadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  loadLoc: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  loadArrow: {
    color: '#FFF',
    fontSize: 24,
    opacity: 0.7,
    marginHorizontal: 16,
  },
  loadRate: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyLoadBox: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 40,
  },
  emptyLoadText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  emptyLoadSub: {
    color: '#3B82F6',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  }
});
