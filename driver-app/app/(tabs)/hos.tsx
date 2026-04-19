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
 * Screen 4: HOS Logger
 * 
 * Track Hours of Service (DOT compliance):
 *   - Hours driven today
 *   - Hours remaining (max 11)
 *   - Weekly hours (max 70)
 *   - HOS violation alerts
 *   - Break tracking
 */
export default function HOSLoggerScreen() {
  const { updateHOS } = useWebSocket();

  const [hoursDrivenToday, setHoursDrivenToday] = useState('3.5');
  const [breakMinutes, setBreakMinutes] = useState('30');
  const [weeklyHours, setWeeklyHours] = useState('45');

  const maxDailyHours = 11;
  const maxWeeklyHours = 70;

  const dailyRemaining =
    Math.max(0, maxDailyHours - parseFloat(hoursDrivenToday || '0'));
  const weeklyRemaining =
    Math.max(0, maxWeeklyHours - parseFloat(weeklyHours || '0'));

  const isDailyViolation = hoursDrivenToday > maxDailyHours;
  const isWeeklyViolation = weeklyHours > maxWeeklyHours;

  const handleLogHOS = () => {
    updateHOS(parseFloat(hoursDrivenToday), new Date().toISOString());
    Alert.alert(
      'HOS Logged ✅',
      `${hoursDrivenToday} hours logged.\nRemaining: ${dailyRemaining.toFixed(1)} hrs`
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🕐 Hours of Service</Text>
        <Text style={styles.subtitle}>DOT Compliance Tracking</Text>
      </View>

      {/* Daily HOS Status */}
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
            <Text
              style={[
                styles.hoursValue,
                isDailyViolation && styles.violationText,
              ]}
            >
              {dailyRemaining.toFixed(1)}h
            </Text>
          </View>

          <View style={styles.hoursBox}>
            <Text style={styles.hoursLabel}>Max Allowed</Text>
            <Text style={styles.hoursValue}>{maxDailyHours}h</Text>
          </View>
        </View>

        {/* Daily Progress Bar */}
        <View style={styles.hosBar}>
          <View
            style={[
              styles.hosProgress,
              {
                width: `${Math.min(
                  (parseFloat(hoursDrivenToday || '0') / maxDailyHours) * 100,
                  100
                )}%`,
              },
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

      {/* Weekly HOS Status */}
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
            <Text
              style={[
                styles.hoursValue,
                isWeeklyViolation && styles.violationText,
              ]}
            >
              {weeklyRemaining.toFixed(1)}h
            </Text>
          </View>

          <View style={styles.hoursBox}>
            <Text style={styles.hoursLabel}>Max Allowed</Text>
            <Text style={styles.hoursValue}>{maxWeeklyHours}h</Text>
          </View>
        </View>

        {/* Weekly Progress Bar */}
        <View style={styles.hosBar}>
          <View
            style={[
              styles.hosProgress,
              {
                width: `${Math.min(
                  (parseFloat(weeklyHours || '0') / maxWeeklyHours) * 100,
                  100
                )}%`,
              },
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

      {/* Mandatory Break Tracking */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rest Requirements</Text>

        <View style={styles.breakCard}>
          <View>
            <Text style={styles.breakLabel}>Last Break</Text>
            <Text style={styles.breakTime}>{breakMinutes} min ago</Text>
          </View>
          <View>
            <Text style={styles.breakLabel}>10-Hour Rest</Text>
            <Text style={styles.breakStatus}>
              {breakMinutes >= 600 ? '✅ Met' : '⏳ Pending'}
            </Text>
          </View>
        </View>

        <Pressable style={styles.breakButton}>
          <Text style={styles.breakButtonText}>🔄 Log Break Now</Text>
        </Pressable>
      </View>

      {/* Compliance Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Compliance Status</Text>

        <View style={styles.complianceRow}>
          <Text style={styles.complianceLabel}>Daily Compliance</Text>
          <Text style={[styles.complianceStatus, !isDailyViolation && styles.compliant]}>
            {isDailyViolation ? '❌ Violation' : '✅ Compliant'}
          </Text>
        </View>

        <View style={styles.complianceRow}>
          <Text style={styles.complianceLabel}>Weekly Compliance</Text>
          <Text style={[styles.complianceStatus, !isWeeklyViolation && styles.compliant]}>
            {isWeeklyViolation ? '❌ Violation' : '✅ Compliant'}
          </Text>
        </View>

        <View style={styles.complianceRow}>
          <Text style={styles.complianceLabel}>Rest Compliance</Text>
          <Text style={[styles.complianceStatus, styles.compliant]}>
            ✅ Compliant
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable style={styles.submitButton} onPress={handleLogHOS}>
          <Text style={styles.submitText}>✓ Update HOS</Text>
        </Pressable>

        <Pressable style={styles.helpButton}>
          <Text style={styles.helpText}>❓ Help & Rules</Text>
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
  subtitle: {
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
  hoursGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  hoursBox: {
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  violation: {
    backgroundColor: '#ffebee',
  },
  hoursLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  hoursInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 4,
    minWidth: 40,
  },
  hoursValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  violationText: {
    color: '#f44336',
  },
  hosBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  hosProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  violationBar: {
    backgroundColor: '#f44336',
  },
  warning: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
  },
  breakCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  breakTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  breakStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  breakButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  breakButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  complianceLabel: {
    fontSize: 13,
    color: '#666',
  },
  complianceStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f44336',
  },
  compliant: {
    color: '#4CAF50',
  },
  actions: {
    marginHorizontal: 16,
    gap: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  helpButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  helpText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
});
