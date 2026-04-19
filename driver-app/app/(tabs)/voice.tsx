import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';

/**
 * Screen 5: Voice Assistant
 * 
 * Hands-free commands for driver:
 *   🎤 "Log fuel" → Expense logger
 *   🎤 "Show trip summary"
 *   🎤 "Complete trip"
 *   🎤 "My HOS"
 *   🎤 "Call support"
 */
export default function VoiceAssistantScreen() {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [recentCommands, setRecentCommands] = useState([
    { id: 1, text: 'Log fuel $45', time: '2 min ago' },
    { id: 2, text: 'Show HOS', time: '5 min ago' },
    { id: 3, text: 'Trip summary', time: '12 min ago' },
  ]);

  const commands = [
    { text: 'Log an expense', icon: '💰' },
    { text: 'Show trip summary', icon: '📊' },
    { text: 'Complete trip', icon: '✓' },
    { text: 'Check my HOS', icon: '🕐' },
    { text: 'Call support', icon: '📞' },
    { text: 'Take a break', icon: '☕' },
  ];

  const handleMicPress = () => {
    setIsListening(true);
    
    // Simulate listening
    setTimeout(() => {
      setIsListening(false);
      const mockCommands = [
        'Log fuel $45.50',
        'Show trip summary',
        'What is my HOS?',
        'Complete this trip',
      ];
      const randomCommand =
        mockCommands[Math.floor(Math.random() * mockCommands.length)];
      
      setLastCommand(randomCommand);
      setRecentCommands([
        { id: recentCommands.length + 1, text: randomCommand, time: 'Just now' },
        ...recentCommands.slice(0, 2),
      ]);

      Alert.alert('Command Heard', `"${randomCommand}"\n\nProcessing...`);
    }, 2000);
  };

  const handleCommandPress = (command) => {
    setLastCommand(command);
    setRecentCommands([
      { id: recentCommands.length + 1, text: command, time: 'Just now' },
      ...recentCommands.slice(0, 2),
    ]);
    Alert.alert('Command', `Executing: ${command}`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎤 Voice Assistant</Text>
        <Text style={styles.subtitle}>Hands-free commands</Text>
      </View>

      {/* Microphone Button */}
      <View style={styles.micContainer}>
        <Pressable
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={handleMicPress}
        >
          <Text style={styles.micIcon}>{isListening ? '🔴' : '🎤'}</Text>
          <Text style={styles.micText}>
            {isListening ? 'Listening...' : 'Tap to speak'}
          </Text>
        </Pressable>
      </View>

      {/* Last Command */}
      {lastCommand && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last Command</Text>
          <View style={styles.commandBox}>
            <Text style={styles.commandText}>"{lastCommand}"</Text>
          </View>
        </View>
      )}

      {/* Quick Commands */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Commands</Text>
        <View style={styles.commandGrid}>
          {commands.map((cmd, idx) => (
            <Pressable
              key={idx}
              style={styles.commandButton}
              onPress={() => handleCommandPress(cmd.text)}
            >
              <Text style={styles.commandIcon}>{cmd.icon}</Text>
              <Text style={styles.commandLabel}>{cmd.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Recent Commands */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Commands</Text>
        {recentCommands.map((cmd) => (
          <View key={cmd.id} style={styles.historyRow}>
            <View>
              <Text style={styles.historyText}>"{cmd.text}"</Text>
              <Text style={styles.historyTime}>{cmd.time}</Text>
            </View>
            <Pressable
              onPress={() => handleCommandPress(cmd.text)}
              style={styles.repeatButton}
            >
              <Text style={styles.repeatText}>Repeat</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Tips</Text>
        <Text style={styles.tipText}>
          • Speak naturally - "Log fuel" or "I filled up"
        </Text>
        <Text style={styles.tipText}>• Keep commands short and clear</Text>
        <Text style={styles.tipText}>
          • Connected to backend for real-time processing
        </Text>
        <Text style={styles.tipText}>• All commands are logged for compliance</Text>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

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
  micContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  micButtonActive: {
    backgroundColor: '#f44336',
    shadowOpacity: 0.3,
  },
  micIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  micText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
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
  commandBox: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  commandText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333',
  },
  commandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  commandButton: {
    width: (width - 64) / 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  commandIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  commandLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 11,
    color: '#999',
  },
  repeatButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  repeatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2196F3',
  },
  tipsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 12,
    color: '#0d47a1',
    marginBottom: 6,
    lineHeight: 18,
  },
  spacer: {
    height: 20,
  },
});
