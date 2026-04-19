import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

/**
 * Screen 3: Trip Expenses Summary
 * 
 * Real-time expense totals for current trip:
 *   - Total expenses by category
 *   - Grand total
 *   - Revenue vs cost analysis
 *   - Complete trip button
 */
export default function TripsummaryScreen() {
  const [tripExpenses, setTripExpenses] = useState({
    total: 0,
    itemCount: 0,
    byCategory: {
      fuel: { count: 0, total: 0 },
      food: { count: 0, total: 0 },
      toll: { count: 0, total: 0 },
      parking: { count: 0, total: 0 },
      repair: { count: 0, total: 0 },
      lodging: { count: 0, total: 0 },
      other: { count: 0, total: 0 },
    },
  });

  const [tripData] = useState({
    id: 'TRIP-001',
    loadId: 'LOAD-001',
    revenue: 420,
    distance: 120,
    duration: '3.5',
    pickup: { city: 'Phoenix', state: 'AZ' },
    dropoff: { city: 'Tucson', state: 'AZ' },
  });

  // Simulate fetching trip expenses
  useEffect(() => {
    // In real app, would fetch from API
    setTripExpenses({
      total: 52.45,
      itemCount: 4,
      byCategory: {
        fuel: { count: 1, total: 45.00 },
        food: { count: 1, total: 12.50 },
        toll: { count: 1, total: 0.0 },
        parking: { count: 1, total: 5.00 },
        repair: { count: 0, total: 0 },
        lodging: { count: 0, total: 0 },
        other: { count: 0, total: 0 },
      },
    });
  }, []);

  const categoryEmojis = {
    fuel: '⛽',
    food: '🍔',
    toll: '🛣️',
    parking: '🅿️',
    repair: '🔧',
    lodging: '🏨',
    other: '📦',
  };

  const profit = tripData.revenue - tripExpenses.total;
  const margin = tripData.revenue > 0 ? (profit / tripData.revenue) * 100 : 0;
  const costPerMile = tripData.distance > 0 ? tripExpenses.total / tripData.distance : 0;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Trip Summary</Text>
        <Text style={styles.tripInfo}>
          {tripData.pickup.city} → {tripData.dropoff.city}
        </Text>
      </View>

      {/* Trip Overview Card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Revenue</Text>
            <Text style={styles.bigValue}>${tripData.revenue}</Text>
          </View>
          <View>
            <Text style={styles.label}>Total Expenses</Text>
            <Text style={[styles.bigValue, { color: '#f44336' }]}>
              ${tripExpenses.total.toFixed(2)}
            </Text>
          </View>
          <View>
            <Text style={styles.label}>Profit</Text>
            <Text
              style={[
                styles.bigValue,
                { color: profit >= 0 ? '#4CAF50' : '#f44336' },
              ]}
            >
              ${profit.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Cost Intelligence */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💡 Cost Intelligence</Text>
        <View style={styles.row}>
          <View style={styles.statBox}>
            <Text style={styles.label}>Margin</Text>
            <Text style={styles.value}>{margin.toFixed(0)}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.label}>Cost/Mile</Text>
            <Text style={styles.value}>${costPerMile.toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{tripData.distance} mi</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{tripData.duration} hrs</Text>
          </View>
        </View>
      </View>

      {/* Expenses by Category */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧾 Expenses</Text>
        <Text style={styles.itemCount}>
          {tripExpenses.itemCount} item{tripExpenses.itemCount !== 1 ? 's' : ''} logged
        </Text>

        {Object.entries(tripExpenses.byCategory).map(([category, data]) => {
          if (data.count === 0) return null;
          return (
            <View key={category} style={styles.expenseRow}>
              <View style={styles.expenseLabel}>
                <Text style={styles.emoji}>{categoryEmojis[category]}</Text>
                <View>
                  <Text style={styles.categoryName}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <Text style={styles.itemCount}>{data.count} item(s)</Text>
                </View>
              </View>
              <Text style={styles.expenseAmount}>${data.total.toFixed(2)}</Text>
            </View>
          );
        })}

        <View style={[styles.expenseRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${tripExpenses.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Trip Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📝 Trip Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Trip ID</Text>
          <Text style={styles.detailValue}>{tripData.id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Load ID</Text>
          <Text style={styles.detailValue}>{tripData.loadId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pickup</Text>
          <Text style={styles.detailValue}>
            {tripData.pickup.city}, {tripData.pickup.state}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Dropoff</Text>
          <Text style={styles.detailValue}>
            {tripData.dropoff.city}, {tripData.dropoff.state}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.buttonPrimary]}>
          <Text style={styles.buttonText}>✓ Complete Trip</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.buttonSecondary]}>
          <Text style={styles.buttonText}>📝 Add More Expenses</Text>
        </Pressable>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  tripInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  bigValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  itemCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expenseLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  actions: {
    marginHorizontal: 16,
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
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
});
