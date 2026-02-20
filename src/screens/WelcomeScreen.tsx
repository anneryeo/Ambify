import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { useTransition } from '../context/TransitionContext';

export const WelcomeScreen: React.FC = () => {
  const { navigate, goBack } = useTransition();

  const handleContinue = () => {
    navigate('Dashboard');
  };

  const handleBack = () => {
    goBack();
  };

  return (
    <TouchableWithoutFeedback onPress={handleContinue}>
      <View style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.appName}>Ambify</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.greeting}>Hello, Josh</Text>
          <Text style={styles.subtitle}>Sync your space with your state of mind</Text>
        </View>

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
    paddingHorizontal: 2,
    paddingVertical: 2,
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
  greeting: {
    fontSize: 64,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Golos-Text',
    letterSpacing: -6,
    paddingHorizontal: 2,
  },
  subtitle: {
    fontSize: 34,
    fontWeight: '400',
    color: '#e6e6e6',
    fontFamily: 'Golos-Text',
    lineHeight: 30,
    letterSpacing: -3,
    paddingVertical: 2,
  },

});
