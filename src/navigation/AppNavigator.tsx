import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { MainDashboard } from '../screens/MainDashboard';
import { ProductivityScreen } from '../screens/ProductivityScreen';
import { TransitionContext } from '../context/TransitionContext';
import { SensorProvider } from '../context/SensorContext';
import { AnimatedBackground } from '../components/AnimatedBackground';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Dashboard: undefined;
  ProductivityScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isBgPaused, setIsBgPaused] = useState(false);
  const isTransitioning = useRef(false);

  const performTransition = useCallback((action: () => void) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    // 1. Pause heavy background animations
    setIsBgPaused(true);

    // 2. Fade to black
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      // 3. Navigate while hidden behind the black overlay
      action();

      // 4. Give the new screen 2 frames to mount, then reveal
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 5. Resume background before fade-in so blobs are moving during reveal
          setIsBgPaused(false);

          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }).start(() => {
            isTransitioning.current = false;
          });
        });
      });
    });
  }, [overlayOpacity]);

  const transitionApi = useMemo(() => ({
    navigate: (screen: string, params?: any) => {
      performTransition(() => {
        navRef.current?.navigate(screen as any, params);
      });
    },
    goBack: () => {
      performTransition(() => {
        if (navRef.current?.canGoBack()) {
          navRef.current.goBack();
        }
      });
    },
  }), [performTransition]);

  return (
    <SensorProvider>
    <TransitionContext.Provider value={transitionApi}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Single shared background — only ONE instance for the entire app */}
        <AnimatedBackground isPaused={isBgPaused} />

        <NavigationContainer ref={navRef}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'none',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Dashboard" component={MainDashboard} />
            <Stack.Screen name="ProductivityScreen" component={ProductivityScreen} />
          </Stack.Navigator>
        </NavigationContainer>

        {/* Black overlay for cinema-style dip-to-black transition */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000', opacity: overlayOpacity, zIndex: 999 },
          ]}
        />
      </View>
    </TransitionContext.Provider>
    </SensorProvider>
  );
};
