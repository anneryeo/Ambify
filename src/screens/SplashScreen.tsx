import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const [fadeAnim] = useState(new Animated.Value(1));

  useFocusEffect(
    React.useCallback(() => {
      // Reset animation when screen comes back into focus
      fadeAnim.setValue(1);
    }, [fadeAnim])
  );

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
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.content}>
          <Text style={styles.title}>Ambify</Text>
          <Text style={styles.subtitle}>Clear air. Clear mind.</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
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
    letterSpacing: -6,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Gotu-Regular',
  },

});
