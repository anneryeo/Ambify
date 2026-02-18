import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { MainDashboard } from '../screens/MainDashboard';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC<{ isSplashComplete: boolean; setSplashComplete: (complete: boolean) => void }> = ({
  isSplashComplete,
  setSplashComplete,
}) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          cardStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen
          name="Splash"
          options={{
            animationEnabled: false,
          }}
        >
          {(props) => (
            <SplashScreen onContinue={() => {
              setSplashComplete(true);
              props.navigation.navigate('Welcome');
            }} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Welcome">
          {(props) => <WelcomeScreen onContinue={() => props.navigation.navigate('Dashboard')} />}
        </Stack.Screen>
        <Stack.Screen name="Dashboard" component={MainDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
