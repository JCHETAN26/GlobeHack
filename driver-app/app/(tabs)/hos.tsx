import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchDriver } from '@/utils/api';

export default function HOSLoggerScreen() {
  const { updateHOS, driverId } = useWebSocket();

  const [loading, setLoading] = useState(true);
  const [hoursDrivenToday, setHoursDrivenToday] = useState('0');
  const [weeklyHours, setWeeklyHours] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const MAX_DAILY = 11;
  const MAX_WEEKLY = 70;

  const loadHOS = useCallback(async () => {
    try {
      const data = await fetchDriver(driverId);
      const hos = data.hos || {};
      setHoursDrivenToday(String(hos.hoursDrivenToday ?? 0));
      setWeeklyHours(String(hos.weeklyHoursDriven ?? 0));
    } catch (e) {
      console.warn('[HOS] Failed to load HOS:', e);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadHOS();
  }, [loadHOS]);

  const daily = parseFloat(hoursDrivenToday || '0');
  const weekly = parseFloat(weeklyHours || '0');
  const dailyRemaining = Math.max(0, MAX_DAILY - daily);
  const weeklyRemaining = Math.max(0, MAX_WEEKLY - weekly);
  const isDailyViolation = daily > MAX_DAILY;
  const isWeeklyViolation = weekly > MAX_WEEKLY;

  const handleLogHOS = async () => {
    setSubmitting(true);
    try {
      await updateHOS(daily, weekly);
      Alert.alert('HOS Updated ✅', `${daily}h logged today.\nRemaining: ${dailyRemaining.toFixed(1)}h`);
    } catch (e: any) {
      Alert.alert('Failed to Update HOS', e?.message || 'Please try again');
    } finally {
      setSubmitting(false);
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
        <Text style={styles.title}>🕐 Hours of Service</Text>
        <Text style={styles.subtitle}>DOT Compliance Tracking</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Hours</Text>
        <View style={styles.hoursGrid}>
          <View style={styles.hoursBox}>
            <Text style={styles.hoursLabel}>Hours Driven</Text>
            <TextInput
              style={styles.hoursInput}
              keyboardType="decimal-pad"
              value={hoursDrivenToday}
              onChangeText={setHoursDrivenToday}
            />
          </View>
          <View style={[styles.hoursBox, isDailyViolation && styles.violation]}>
            <Text style={styles.hoursLabel}>Hours Remaining</Text>
            <Text style={[styles.hoursValue, isDailyViolation && styles.violationText]}>
              {dailyRemaining.toFixed(1)}h
            </Text>
          </View>
          <View style={styles.hoursBox}>
            <Text style={styles.hoursLabel}>Max Allowed</Text>
            <Text style={styles.hoursValue}>{MAX_DAILY}h</Text>
          </View>
        </View>
        <View style={styles.hosBar}>
          <View
            style={[
              styles.hosProgress,
              { width: `${Math.min((daily / MAX_DAILY) * 100, 100)}%` },
              isDailyViolation && styles.violationBar,
            ]}
          />
        </View>
        {isDailyViolation && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>⚠️ Daily HOS Violation!</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week</Text>
        <View style={styles.hoursGrid}>
          <View style={styles.hoursBox}>
            <Text style={styles.hoursLabel}>Hours Driven</Text>
            <TextInput
              style={styles.hoursInput}
              keyboardType="decimal-pad"
              value={weeklyHours}
              onChangeText={setWeeklyHours}
            />
          </View>
          <View style={[styles.hoursBox, isWeeklyViolation && styles.violation]}>
            <Text style={styles.hoursLabel}>Hours Remaining</Text>
            <Text style={[styles.hoursValue, isWeeklyViolation && styles.violationText]}>
              {weeklyRemaining.toFixed(1)}h
            </Text>
          </View>
          <View style={styles.hoursBox}>
            <Text style={styles.hoursLabel}>Max Allowed</Text>
            <Text style={styles.hoursValue}>{MAX_WEEKLY}h</Text>
          </View>
        </View>
        <View style={styles.hosBar}>
          <View
            style={[
              styles.hosProgress,
              { width: `${Math.min((weekly / MAX_WEEKLY) * 100, 100)}%` },
              isWeeklyViolation && styles.violationBar,
            ]}
          />
        </View>
        {isWeeklyViolation && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>⚠️ Weekly HOS Violation!</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Compliance Status</Text>
        {[
          { label: 'Daily Compliance', ok: !isDailyViolation },
          { label: 'Weekly Compliance', ok: !isWeeklyViolation },
        ].map(({ label, ok }) => (
          <View key={label} style={styles.complianceRow}>
            <Text style={styles.complianceLabel}>{label}</Text>
            <Text style={[styles.complianceStatus, ok && styles.compliant]}>
              {ok ? '✅ Compliant' : '❌ Violation'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.submitButton, submitting && styles.submitDisabled]} onPress={handleLogHOS} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? 'Updating...' : '✓ Update HOS'}</Text>
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
  subtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  card: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 12 },
  hoursGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  hoursBox: { flex: 1, marginHorizontal: 4, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#f8f9fa', borderRadius: 8, alignItems: 'center' },
  violation: { backgroundColor: '#ffebee' },
  hoursLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  hoursInput: { fontSize: 16, fontWeight: '600', color: '#000', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingVertical: 4, minWidth: 40 },
  hoursValue: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  violationText: { color: '#f44336' },
  hosBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  hosProgress: { height: '100%', backgroundColor: '#4CAF50' },
  violationBar: { backgroundColor: '#f44336' },
  warning: { backgroundColor: '#fff3cd', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderLeftWidth: 4, borderLeftColor: '#ff9800' },
  warningText: { fontSize: 12, fontWeight: '600', color: '#856404' },
  complianceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  complianceLabel: { fontSize: 13, color: '#666' },
  complianceStatus: { fontSize: 13, fontWeight: '600', color: '#f44336' },
  compliant: { color: '#4CAF50' },
  actions: { marginHorizontal: 16, gap: 8 },
  submitButton: { backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitDisabled: { backgroundColor: '#a5d6a7' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  spacer: { height: 20 },
});
