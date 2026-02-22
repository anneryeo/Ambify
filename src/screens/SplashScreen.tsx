import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { useTransition } from '../context/TransitionContext';

export const SplashScreen: React.FC = () => {
  const { navigate } = useTransition();

  const handlePress = () => {
    navigate('Welcome');
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>

        <View style={styles.content}>
          <Text style={styles.title}>Ambify</Text>
          <Text style={styles.subtitle}>Clear air. Clear mind.</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handlePress} style={styles.nextButton}>
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
    fontSize: 13.5,
    color: '#fff',
    fontFamily: 'Gotu-Regular',
    paddingVertical: 1,
  },

});
