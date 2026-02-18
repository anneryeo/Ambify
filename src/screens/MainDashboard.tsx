import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CO2Indicator {
  value: number;
  quality: string;
  description: string;
}

export const MainDashboard: React.FC = () => {
  const co2Data: CO2Indicator = {
    value: 555,
    quality: 'ppm',
    description: 'The air is crisp.',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Ambify</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.circleContainer}>
          <LinearGradient
            colors={['#EAF371', '#507e10']}
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
            The CO2 levels are low. This is the perfect time for deep focus or creative work.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a3a2a',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
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
  },
  circleContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
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
    lineHeight: 20,
    fontFamily: 'Golos-Text',
    letterSpacing: -1,
  },
});
