import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Alert } from 'react-native';
import io from 'socket.io-client';
import { Truck, MapPin, FileCheck, Bell } from 'lucide-react-native';

const SOCKET_URL = 'http://localhost:3001';

export default function DriverHomeScreen() {
  const [load, setLoad] = useState<any>(null);
  const [status, setStatus] = useState('Off-Duty');
  const [driverId] = useState('driver1'); // Mocked for the demo match

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('load_assigned', (data: any) => {
      if (data.driverId === driverId) {
        setLoad(data.load);
        setStatus('On-Duty');
        Alert.alert('New Load Assigned!', `New trip from ${data.load.origin} to ${data.load.destination}`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [driverId]);

  const uploadBOL = () => {
    const socket = io(SOCKET_URL);
    socket.emit('bol_uploaded', { driverId, loadId: load?.id });
    Alert.alert('Success', 'Bill of Lading uploaded successfully!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Portal</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!load ? (
          <View style={styles.emptyState}>
            <Bell size={64} color="#94a3b8" />
            <Text style={styles.emptyText}>Waiting for load assignment...</Text>
          </View>
        ) : (
          <View style={styles.loadCard}>
            <View style={styles.loadHeader}>
              <Truck size={24} color="#6366f1" />
              <Text style={styles.loadTitle}>Active Load: {load.id}</Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <MapPin size={20} color="#22c55e" />
                <View style={styles.routeTextContainer}>
                  <Text style={styles.locationLabel}>ORIGIN</Text>
                  <Text style={styles.locationName}>{load.origin}</Text>
                </View>
              </View>
              
              <View style={styles.routeLine} />

              <View style={styles.routePoint}>
                <MapPin size={20} color="#ef4444" />
                <View style={styles.routeTextContainer}>
                  <Text style={styles.locationLabel}>DESTINATION</Text>
                  <Text style={styles.locationName}>{load.destination}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>DISTANCE</Text>
                <Text style={styles.statValue}>{load.mileage} mi</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>PRIORITY</Text>
                <Text style={[styles.statValue, { color: load.priority === 'high' ? '#ef4444' : '#f59e0b' }]}>
                  {load.priority.toUpperCase()}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={uploadBOL}>
              <FileCheck size={20} color="white" />
              <Text style={styles.buttonText}>Upload BOL</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>FleetMind Driver App • v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 40,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#6366f1',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  loadCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  loadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  routeContainer: {
    gap: 15,
  },
  routePoint: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
  routeTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginLeft: 9,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    padding: 15,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
});
