import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AnimatedBackground } from '../components/AnimatedBackground';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // When navigating back to this screen, reset and fade in
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim])
  );

  const handleContinue = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      onContinue();
    });
  };

  const handleBack = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('Splash' as never);
    });
  };

  return (
    <TouchableWithoutFeedback onPress={handleContinue}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <AnimatedBackground />

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
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  },
  subtitle: {
    fontSize: 34,
    fontWeight: '400',
    color: '#aaa',
    fontFamily: 'Golos-Text',
    lineHeight: 30,
    letterSpacing: -3,
  },

});
