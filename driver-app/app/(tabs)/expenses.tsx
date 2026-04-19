import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useWebSocket } from '@/hooks/useWebSocket';

/**
 * Screen 2: Expense Logger
 * 
 * Driver logs expenses during trip:
 *   ⛽ Fuel (gallons, price/gal, station)
 *   🍔 Food
 *   🛣️ Toll
 *   🅿️ Parking
 *   🔧 Repair
 *   🏨 Lodging
 *   📦 Other
 * 
 * Auto-attaches to current trip, syncs to dashboard via WebSocket
 */
export default function ExpenseLoggerScreen() {
  const { logExpense, connected } = useWebSocket();

  const categories = [
    { id: 'fuel', name: '⛽ Fuel', icon: '⛽' },
    { id: 'food', name: '🍔 Food', icon: '🍔' },
    { id: 'toll', name: '🛣️ Toll', icon: '🛣️' },
    { id: 'parking', name: '🅿️ Parking', icon: '🅿️' },
    { id: 'repair', name: '🔧 Repair', icon: '🔧' },
    { id: 'lodging', name: '🏨 Lodging', icon: '🏨' },
    { id: 'other', name: '📦 Other', icon: '📦' },
  ];

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [fuelData, setFuelData] = useState({
    gallons: '',
    pricePerGallon: '',
    station: '',
  });

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setAmount('');
    setNotes('');
    setFuelData({ gallons: '', pricePerGallon: '', station: '' });
  };

  const handleSubmit = () => {
    if (!selectedCategory || !amount) {
      Alert.alert('Missing Information', 'Please select a category and enter an amount');
      return;
    }

    const expense = {
      tripId: 'TRIP-001',
      category: selectedCategory,
      amount: parseFloat(amount),
      notes: notes || null,
      location: {
        lat: 33.4484,
        lng: -112.074,
        address: 'Current Location',
      },
      timestamp: new Date().toISOString(),
    };

    // Add fuel-specific data if fuel category
    if (selectedCategory === 'fuel' && fuelData.gallons) {
      expense.fuel = {
        gallons: parseFloat(fuelData.gallons),
        pricePerGallon: parseFloat(fuelData.pricePerGallon),
        station: fuelData.station,
      };
    }

    // Send to backend via WebSocket
    logExpense(expense);

    Alert.alert(
      'Expense Logged ✅',
      `$${amount} logged for ${selectedCategory}.\nSyncing to dashboard...`
    );

    // Reset form
    handleCategorySelect(null);
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💰 Log Expense</Text>
        <Text style={styles.subtitle}>
          {connected ? '🟢 Live sync enabled' : '🔴 Offline'}
        </Text>
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryButton,
                selectedCategory === cat.id && styles.categoryButtonActive,
              ]}
              onPress={() => handleCategorySelect(cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{cat.name.split(' ')[1]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Amount Input */}
      {selectedCategory && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor="#ccc"
            />
          </View>
        </View>
      )}

      {/* Fuel-Specific Fields */}
      {selectedCategory === 'fuel' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel Details</Text>

          <View style={styles.fuelInputGroup}>
            <Text style={styles.label}>Gallons</Text>
            <TextInput
              style={styles.fuelInput}
              placeholder="10.5"
              keyboardType="decimal-pad"
              value={fuelData.gallons}
              onChangeText={(val) =>
                setFuelData({ ...fuelData, gallons: val })
              }
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.fuelInputGroup}>
            <Text style={styles.label}>Price/Gal</Text>
            <TextInput
              style={styles.fuelInput}
              placeholder="3.45"
              keyboardType="decimal-pad"
              value={fuelData.pricePerGallon}
              onChangeText={(val) =>
                setFuelData({ ...fuelData, pricePerGallon: val })
              }
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.fuelInputGroup}>
            <Text style={styles.label}>Station</Text>
            <TextInput
              style={styles.fuelInput}
              placeholder="Love's, Pilot, Loves, Shell"
              value={fuelData.station}
              onChangeText={(val) =>
                setFuelData({ ...fuelData, station: val })
              }
              placeholderTextColor="#ccc"
            />
          </View>
        </View>
      )}

      {/* Notes Field */}
      {selectedCategory && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Add any additional details..."
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor="#ccc"
          />
        </View>
      )}

      {/* Submit Button */}
      {selectedCategory && (
        <View style={styles.section}>
          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>✓ Log Expense</Text>
          </Pressable>
        </View>
      )}

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
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  fuelInputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  fuelInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#000',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  spacer: {
    height: 20,
  },
});
