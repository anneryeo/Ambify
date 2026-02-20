import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedBackground } from '../components/AnimatedBackground';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const [fadeAnim] = useState(new Animated.Value(1));

  useFocusEffect(
    React.useCallback(() => {
      // Reset to fully visible when navigating back to this screen
      fadeAnim.setValue(1);
    }, [fadeAnim])
  );

  const handlePress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      onContinue();
    });
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <AnimatedBackground />

        <View style={styles.content}>
          <Text style={styles.title}>Ambify</Text>
          <Text style={styles.subtitle}>Clear air. Clear mind.</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handlePress} style={styles.nextButton}>
            <Text style={styles.nextIcon}>›</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    zIndex: 1,
  },
  nextButton: {
    padding: 12,
  },
  nextIcon: {
    fontSize: 40,
    fontWeight: '300',
    color: '#fff',
    fontFamily: 'Golos-Text',
  },
  title: {
    fontSize: 64,
    fontWeight: '600',
    color: '#fff',
    marginBottom: -26,
    fontFamily: 'Gotu-Regular',
    letterSpacing: -6,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Gotu-Regular',
  },

});
