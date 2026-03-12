import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCO2UIData } from '../utils/co2Utils';
import { useTransition } from '../context/TransitionContext';
import { useSensorData } from '../hooks/useSensorData';

// ─── DEMO / PRACTICE LEVELS (used when Google Sheets URL is not configured) ──
const PRACTICE_LEVELS = [555, 921, 1341, 1802];

export const MainDashboard: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const { navigate, goBack } = useTransition();
  const { reading, isLive } = useSensorData();

  // Seed from context on every mount: if we already have live data (e.g. returning
  // to this screen after navigating away), start with the correct value immediately
  // rather than flashing the placeholder first.
  const [displayedCO2, setDisplayedCO2] = useState(
    isLive && reading ? reading.co2 : PRACTICE_LEVELS[0]
  );
  // Prime the ref with the same seed so the change-detection effect below does
  // not immediately trigger a redundant fade on mount.
  const prevLiveCO2 = useRef<number | null>(isLive && reading ? reading.co2 : null);

  const fadeTo = (newCO2: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setDisplayedCO2(newCO2);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });
  };

  // When live data arrives or updates, fade to the new value
  useEffect(() => {
    if (!isLive || !reading) return;
    if (reading.co2 === prevLiveCO2.current) return;
    prevLiveCO2.current = reading.co2;
    fadeTo(reading.co2);
  }, [reading, isLive]);

  const uiData = getCO2UIData(displayedCO2);

  const co2Data = {
    value: displayedCO2,
    quality: 'ppm',
    description: `The air is ${uiData.label.toLowerCase()}.`,
  };

  const handleCycleLevel = () => {
    if (isLive) return; // let live data drive transitions
    const next = (levelIndex + 1) % PRACTICE_LEVELS.length;
    setLevelIndex(next);
    fadeTo(PRACTICE_LEVELS[next]);
  };

  const handleBack = () => {
    goBack();
  };

  const handleContinue = () => {
    navigate('ProductivityScreen');
  };

  return (
    <TouchableWithoutFeedback onPress={handleCycleLevel}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.appName}>Ambify</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.circleContainer}>
            <LinearGradient
              colors={['#00000094', uiData.endColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCircle}
            >
              <Text style={styles.co2Value}>{co2Data.value}</Text>
              <Text style={styles.unit}>{co2Data.quality}</Text>
            </LinearGradient>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.qualityText}>{co2Data.description}</Text>
            <Text style={styles.descriptionText}>
              {uiData.tip}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleContinue} style={styles.nextButton}>
            <Text style={styles.nextIcon}>›</Text>
          </TouchableOpacity>
        </View>

      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
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
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 2,
  },
  circleContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    marginBottom: 40,
    opacity: 0.9,
    //shadowColor: '#000',
    //shadowOffset: { width: 0, height: 10 },
    //shadowOpacity: 0.3,
    //shadowRadius: 20,
    //elevation: 15,
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  co2Value: {
    fontSize: 64,
    fontWeight: '100',
    color: '#fff',
    fontFamily: 'Golos-Text',
    letterSpacing: -6,
    paddingHorizontal: 4,
  },
  unit: {
    fontSize: 18,
    fontWeight: '100',
    color: '#fff',
    fontFamily: 'Golos-Text',
    marginTop: 4,
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    
  },
  qualityText: {
    fontSize: 24,
    fontWeight: '100',
    color: '#fff',
    marginBottom: 12,
    fontFamily: 'Golos-Text',
    letterSpacing: -1,
  },
  descriptionText: {
    fontSize: 20,    
    fontWeight: '100',    
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 30,
    fontFamily: 'Golos-Text',
    letterSpacing: -1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingBottom: 24,
    zIndex: 1,
  },
  backButton: {
    padding: 12,
  },
  backIcon: {
    fontSize: 40,
    fontWeight: '300',
    color: '#fff',
    fontFamily: 'Golos-Text',
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
});
