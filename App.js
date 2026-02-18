import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [co2Level, setCo2Level] = useState(555);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Splash screen animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimer);
  }, []);

  // Simulate CO₂ changes for testing
  useEffect(() => {
    if (!showSplash) {
      const interval = setInterval(() => {
        const randomCO2 = Math.floor(Math.random() * 2000) + 300;
        setCo2Level(randomCO2);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [showSplash]);

  // Determine air quality status and gradient colors
  const getAirQualityData = (co2) => {
    if (co2 < 600) {
      return {
        status: 'crisp',
        message: 'Your air is crisp.',
        tip: 'Perfect conditions for deep focus and creative thinking.',
        gradientColors: ['#EAF371', '#95CC47'],
      };
    } else if (co2 < 1000) {
      return {
        status: 'good',
        message: 'Your air is good.',
        tip: 'Great for productivity. Stay hydrated to maintain clarity.',
        gradientColors: ['#47CCBC', '#3AB5A8'],
      };
    } else if (co2 < 1500) {
      return {
        status: 'stagnant',
        message: 'Your air is stagnant.',
        tip: 'Consider opening a window. Fresh air can boost your mood.',
        gradientColors: ['#EF9A22', '#E88A15'],
      };
    } else {
      return {
        status: 'heavy',
        message: 'Your air is heavy.',
        tip: 'Time for ventilation. Your mental clarity depends on it.',
        gradientColors: ['#2100DF', '#1A00B3'],
      };
    }
  };

  const airData = getAirQualityData(co2Level);

  if (showSplash) {
    return (
      <LinearGradient
        colors={['#0D0D52', '#1A1A70', '#0D0D52']}
        style={styles.splashContainer}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0D0D52" />
        <Animated.View style={[styles.splashContent, { opacity: fadeAnim }]}>
          <Text style={styles.logoText}>Ambify</Text>
          <Text style={styles.tagline}>Clear air. Clear mind.</Text>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0D0D52', '#1A1A70', '#0D0D52']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D0D52" />
      
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, Josh</Text>
        <Text style={styles.subtext}>
          Sync your space with your state of mind.
        </Text>
      </View>

      <View style={styles.heroContainer}>
        <LinearGradient
          colors={airData.gradientColors}
          style={styles.heroCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.co2Value}>{co2Level}</Text>
          <Text style={styles.unit}>ppm</Text>
          <Text style={styles.co2Label}>CO₂</Text>
        </LinearGradient>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusMessage}>{airData.message}</Text>
        <Text style={styles.healthTip}>{airData.tip}</Text>
      </View>

      <View style={styles.legend}>
        <LegendItem label="Crisp" range="< 600" color="#95CC47" />
        <LegendItem label="Good" range="600-1000" color="#47CCBC" />
        <LegendItem label="Stagnant" range="1000-1500" color="#EF9A22" />
        <LegendItem label="Heavy" range="1500+" color="#2100DF" />
      </View>
    </LinearGradient>
  );
}

// Legend item component
const LegendItem = ({ label, range, color }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>
      {label} <Text style={styles.legendRange}>({range})</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  // Splash Screen Styles
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'Instrument Sans',
    fontSize: 64,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: 'Instrument Sans',
    fontSize: 18,
    color: '#EAF371',
    fontWeight: '300',
    letterSpacing: 1,
  },

  // Main Dashboard Styles
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
  },
  greeting: {
    fontFamily: 'Instrument Sans',
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtext: {
    fontFamily: 'Instrument Sans',
    fontSize: 16,
    color: '#B0B0D0',
    fontWeight: '400',
    lineHeight: 24,
  },

  // Hero Circle Styles
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  heroCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  co2Value: {
    fontFamily: 'Instrument Sans',
    fontSize: 72,
    fontWeight: '800',
    color: '#0D0D52',
    marginBottom: 4,
  },
  unit: {
    fontFamily: 'Instrument Sans',
    fontSize: 20,
    fontWeight: '600',
    color: '#0D0D52',
    marginBottom: 8,
  },
  co2Label: {
    fontFamily: 'Instrument Sans',
    fontSize: 16,
    fontWeight: '500',
    color: '#0D0D52',
    letterSpacing: 2,
  },

  // Status Section Styles
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  statusMessage: {
    fontFamily: 'Instrument Sans',
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  healthTip: {
    fontFamily: 'Instrument Sans',
    fontSize: 16,
    color: '#B0B0D0',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },

  // Legend Styles
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '48%',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontFamily: 'Instrument Sans',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  legendRange: {
    fontFamily: 'Instrument Sans',
    fontSize: 12,
    color: '#B0B0D0',
    fontWeight: '400',
  },
});
