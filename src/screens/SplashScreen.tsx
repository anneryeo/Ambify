import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        <LinearGradient
          colors={['rgba(169, 247, 80, 0.15)', 'rgba(57, 61, 47, 0.4)', 'rgba(32, 36, 33, 0.8)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.radialBlur}
        />
        
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
  radialBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
