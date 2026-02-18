import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const [fadeAnim] = useState(new Animated.Value(1));

  const handlePress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      onContinue();
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Ambify</Text>
        <Text style={styles.subtitle}>Clear air. Clear mind.</Text>
      </View>
      
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 64,
    fontWeight: '600',
    color: '#fff',
    marginBottom: -26,
    fontFamily: 'Gotu-Regular',
    
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Gotu-Regular',
  },
  button: {
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7cb342',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Golos-Text',
  },
});
