import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchTripExpenses, fetchDriver } from '@/utils/api';

const ACTIVE_TRIP_ID = 'TRIP-001';

const CATEGORY_EMOJIS: Record<string, string> = {
  fuel: '⛽', food: '🍔', toll: '🛣️', parking: '🅿️',
  repair: '🔧', lodging: '🏨', other: '📦',
};

export default function TripSummaryScreen() {
  const { completeTrip, driverId } = useWebSocket();

  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [tripData] = useState({
    id: ACTIVE_TRIP_ID,
    loadId: 'LOAD-001',
    revenue: 420,
    distance: 120,
    pickup: { city: 'Phoenix', state: 'AZ' },
    dropoff: { city: 'Tucson', state: 'AZ' },
  });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, byCategory: {} as Record<string, { count: number; total: number }> });

  const loadExpenses = useCallback(async () => {
    try {
      const data = await fetchTripExpenses(ACTIVE_TRIP_ID);
      setExpenses(data.expenses || []);
      setSummary({
        total: data.summary?.total || 0,
        byCategory: data.summary?.byCategory
          ? Object.fromEntries(
              Object.entries(data.summary.byCategory).map(([cat, total]) => [
                cat,
                { count: (data.expenses || []).filter((e: any) => e.category === cat).length, total: total as number },
              ])
            )
          : {},
      });
    } catch (e) {
      console.warn('[Summary] Failed to load expenses:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const profit = tripData.revenue - summary.total;
  const margin = tripData.revenue > 0 ? (profit / tripData.revenue) * 100 : 0;
  const costPerMile = tripData.distance > 0 ? summary.total / tripData.distance : 0;

  const handleCompleteTrip = async () => {
    setCompleting(true);
    try {
      await completeTrip(tripData.loadId, { fuelCost: summary.byCategory['fuel']?.total });
      Alert.alert('Trip Completed ✅', 'Trip report sent to dashboard in real-time.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to complete trip');
    } finally {
      setCompleting(false);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Trip Summary</Text>
        <Text style={styles.tripInfo}>{tripData.pickup.city} → {tripData.dropoff.city}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Revenue</Text>
            <Text style={styles.bigValue}>${tripData.revenue}</Text>
          </View>
          <View>
            <Text style={styles.label}>Total Expenses</Text>
            <Text style={[styles.bigValue, { color: '#f44336' }]}>${summary.total.toFixed(2)}</Text>
          </View>
          <View>
            <Text style={styles.label}>Profit</Text>
            <Text style={[styles.bigValue, { color: profit >= 0 ? '#4CAF50' : '#f44336' }]}>
              ${profit.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>💡 Cost Intelligence</Text>
        <View style={styles.row}>
          {[
            { label: 'Margin', value: `${margin.toFixed(0)}%` },
            { label: 'Cost/Mile', value: `$${costPerMile.toFixed(2)}` },
            { label: 'Distance', value: `${tripData.distance} mi` },
            { label: 'Items', value: String(expenses.length) },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statBox}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧾 Expenses</Text>
        <Text style={styles.itemCount}>{expenses.length} item{expenses.length !== 1 ? 's' : ''} logged</Text>

        {Object.entries(summary.byCategory).map(([category, data]) => (
          <View key={category} style={styles.expenseRow}>
            <View style={styles.expenseLabel}>
              <Text style={styles.emoji}>{CATEGORY_EMOJIS[category] || '📦'}</Text>
              <View>
                <Text style={styles.categoryName}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                <Text style={styles.itemCount}>{data.count} item(s)</Text>
              </View>
            </View>
            <Text style={styles.expenseAmount}>${data.total.toFixed(2)}</Text>
          </View>
        ))}

        {expenses.length === 0 && (
          <Text style={{ color: '#999', fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
            No expenses logged yet.
          </Text>
        )}

        <View style={[styles.expenseRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${summary.total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📝 Trip Details</Text>
        {[
          { label: 'Trip ID', value: tripData.id },
          { label: 'Load ID', value: tripData.loadId },
          { label: 'Pickup', value: `${tripData.pickup.city}, ${tripData.pickup.state}` },
          { label: 'Dropoff', value: `${tripData.dropoff.city}, ${tripData.dropoff.state}` },
          { label: 'Driver', value: driverId },
        ].map(({ label, value }) => (
          <View key={label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.buttonPrimary, completing && styles.buttonDisabled]}
          onPress={handleCompleteTrip}
          disabled={completing}
        >
          <Text style={styles.buttonText}>{completing ? 'Completing...' : '✓ Complete Trip'}</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={loadExpenses}>
          <Text style={styles.buttonText}>🔄 Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingBottom: 20 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  tripInfo: { fontSize: 12, color: '#666', marginTop: 4 },
  card: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 11, color: '#999', marginBottom: 4 },
  bigValue: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  value: { fontSize: 16, fontWeight: '600', color: '#333' },
  statBox: { alignItems: 'center', flex: 1 },
  itemCount: { fontSize: 12, color: '#999', marginBottom: 12 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  expenseLabel: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 20, marginRight: 10 },
  categoryName: { fontSize: 13, fontWeight: '500', color: '#000' },
  expenseAmount: { fontSize: 14, fontWeight: '600', color: '#333' },
  totalRow: { borderBottomWidth: 2, borderBottomColor: '#4CAF50', marginTop: 8 },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  detailLabel: { fontSize: 13, color: '#666' },
  detailValue: { fontSize: 13, fontWeight: '500', color: '#000' },
  actions: { marginHorizontal: 16, gap: 8 },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonPrimary: { backgroundColor: '#4CAF50' },
  buttonSecondary: { backgroundColor: '#2196F3' },
  buttonDisabled: { backgroundColor: '#a5d6a7' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  spacer: { height: 20 },
});
