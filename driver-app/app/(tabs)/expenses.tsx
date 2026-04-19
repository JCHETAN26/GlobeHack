import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useWebSocket } from '@/hooks/useWebSocket';

const ACTIVE_TRIP_ID = 'TRIP-001';

const CATEGORIES = [
  { id: 'fuel', name: '⛽ Fuel', icon: '⛽' },
  { id: 'food', name: '🍔 Food', icon: '🍔' },
  { id: 'toll', name: '🛣️ Toll', icon: '🛣️' },
  { id: 'parking', name: '🅿️ Parking', icon: '🅿️' },
  { id: 'repair', name: '🔧 Repair', icon: '🔧' },
  { id: 'lodging', name: '🏨 Lodging', icon: '🏨' },
  { id: 'other', name: '📦 Other', icon: '📦' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

export default function ExpenseLoggerScreen() {
  const { logExpense, connected } = useWebSocket();

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [fuelData, setFuelData] = useState({ gallons: '', pricePerGallon: '', station: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleCategorySelect = (id: CategoryId) => {
    setSelectedCategory(id);
    setAmount('');
    setNotes('');
    setFuelData({ gallons: '', pricePerGallon: '', station: '' });
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !amount) {
      Alert.alert('Missing Information', 'Please select a category and enter an amount');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      await logExpense({
        tripId: ACTIVE_TRIP_ID,
        category: selectedCategory,
        amount: parsedAmount,
        notes: notes || undefined,
        location: { lat: 33.4484, lng: -112.074, address: 'Current Location' },
        fuel: selectedCategory === 'fuel' && fuelData.gallons
          ? {
              gallons: parseFloat(fuelData.gallons),
              pricePerGallon: parseFloat(fuelData.pricePerGallon),
              station: fuelData.station,
            }
          : undefined,
      });

      Alert.alert('Expense Logged ✅', `$${parsedAmount.toFixed(2)} logged for ${selectedCategory}.\nSyncing to dashboard...`);
      setSelectedCategory(null);
      setAmount('');
      setNotes('');
      setFuelData({ gallons: '', pricePerGallon: '', station: '' });
    } catch (e: any) {
      Alert.alert('Failed to Log Expense', e?.message || 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Log Expense</Text>
        <Text style={styles.subtitle}>{connected ? '🟢 Live sync enabled' : '🔴 Offline'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.categoryButton, selectedCategory === cat.id && styles.categoryButtonActive]}
              onPress={() => handleCategorySelect(cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{cat.name.split(' ')[1]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

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

      {selectedCategory === 'fuel' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel Details</Text>
          {[
            { label: 'Gallons', key: 'gallons', placeholder: '10.5' },
            { label: 'Price/Gal', key: 'pricePerGallon', placeholder: '3.45' },
          ].map(({ label, key, placeholder }) => (
            <View key={key} style={styles.fuelInputGroup}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.fuelInput}
                placeholder={placeholder}
                keyboardType="decimal-pad"
                value={fuelData[key as keyof typeof fuelData]}
                onChangeText={(val) => setFuelData({ ...fuelData, [key]: val })}
                placeholderTextColor="#ccc"
              />
            </View>
          ))}
          <View style={styles.fuelInputGroup}>
            <Text style={styles.label}>Station</Text>
            <TextInput
              style={styles.fuelInput}
              placeholder="Love's, Pilot, Shell"
              value={fuelData.station}
              onChangeText={(val) => setFuelData({ ...fuelData, station: val })}
              placeholderTextColor="#ccc"
            />
          </View>
        </View>
      )}

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

      {selectedCategory && (
        <View style={styles.section}>
          <Pressable style={[styles.submitButton, submitting && styles.submitDisabled]} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.submitText}>{submitting ? 'Logging...' : '✓ Log Expense'}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingBottom: 20 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: {
    width: '23%', aspectRatio: 1, backgroundColor: '#fff', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#e0e0e0',
  },
  categoryButtonActive: { borderColor: '#4CAF50', backgroundColor: '#f0f8f0' },
  categoryIcon: { fontSize: 28, marginBottom: 6 },
  categoryLabel: { fontSize: 11, color: '#666', textAlign: 'center' },
  amountInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e0e0e0',
  },
  currencySymbol: { fontSize: 18, fontWeight: 'bold', color: '#333', marginRight: 4 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#000' },
  fuelInputGroup: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '500', color: '#666', marginBottom: 6 },
  fuelInput: {
    backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, borderWidth: 1, borderColor: '#e0e0e0', color: '#000',
  },
  notesInput: { height: 80, textAlignVertical: 'top', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12 },
  submitButton: { backgroundColor: '#4CAF50', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  submitDisabled: { backgroundColor: '#a5d6a7' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  spacer: { height: 20 },
});
