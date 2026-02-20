import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { MainDashboard } from '../screens/MainDashboard';
import { GeneralDashboard } from '../screens/GeneralDashboard';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Dashboard: undefined;
  GeneralDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
          contentStyle: { backgroundColor: '#000000' },
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
        <Stack.Screen name="GeneralDashboard" component={GeneralDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
