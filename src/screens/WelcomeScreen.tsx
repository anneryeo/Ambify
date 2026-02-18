import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { AnimatedBackground } from '../components/AnimatedBackground';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <TouchableWithoutFeedback onPress={onContinue}>
      <View style={styles.container}>
        <AnimatedBackground />

        <View style={styles.header}>
          <Text style={styles.appName}>Ambify</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.greeting}>Hello, Josh</Text>
          <Text style={styles.subtitle}>Sync your space with your state of mind</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
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
    zIndex: 1,
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
    zIndex: 1,
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
    fontWeight: '400',
    color: '#aaa',
    fontFamily: 'Golos-Text',
    lineHeight: 30,
    letterSpacing: -3,
  },

});
