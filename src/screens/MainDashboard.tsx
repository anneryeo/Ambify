import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getCO2UIData } from '../utils/co2Utils';
import { AnimatedBackground } from '../components/AnimatedBackground';

const PRACTICE_LEVELS = [555, 921, 1341, 1802];

export const MainDashboard: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const navigation = useNavigation();
  
  const co2Value = PRACTICE_LEVELS[levelIndex];
  
  const uiData = getCO2UIData(co2Value);
  
  const co2Data = {
    value: co2Value,
    quality: 'ppm',
    description: `The air is ${uiData.label.toLowerCase()}.`,
  };

  const handleCycleLevel = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setLevelIndex((prev) => (prev + 1) % PRACTICE_LEVELS.length);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <TouchableWithoutFeedback onPress={handleCycleLevel}>
      <View style={styles.container}>
        <AnimatedBackground />
        
        <View style={styles.header}>
          <Text style={styles.appName}>Ambify</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.circleContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', uiData.endColor]}
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1609',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
