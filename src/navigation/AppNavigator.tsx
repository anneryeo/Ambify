import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { MainDashboard } from '../screens/MainDashboard';
import { sceneTransitionConfig } from '../utils/transitionConfig';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          ...sceneTransitionConfig,
        }}
      >
        <Stack.Screen
          name="Splash"
        >
          {(props) => (
            <SplashScreen onContinue={() => {
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
