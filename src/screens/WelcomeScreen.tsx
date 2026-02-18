import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Ambify</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.greeting}>Hello, Josh</Text>
        <Text style={styles.subtitle}>Sync your space with your state of mind</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Gotu-Regular',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 64,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Golos-Text',
    letterSpacing: -6,
  },
  subtitle: {
    fontSize: 34,
    color: '#aaa',
    fontFamily: 'Golos-Text',
    lineHeight: 30,
    letterSpacing: -3,
  },
  button: {
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7cb342',
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Golos-Text',
  },
});
