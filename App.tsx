import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreenExpo from 'expo-splash-screen';
import { AppNavigator } from './src/navigation/AppNavigator';

SplashScreenExpo.preventAutoHideAsync();

export default function App() {
  const [isFontsLoaded, setIsFontsLoaded] = useState(false);
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          'Gotu-Regular': require('./assets/fonts/Gotu-Regular.ttf'),
          'Golos-Text': require('./assets/fonts/GolosText-Regular.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setIsFontsLoaded(true);
        await SplashScreenExpo.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isFontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <AppNavigator isSplashComplete={isSplashComplete} setSplashComplete={setIsSplashComplete} />
    </View>
  );
}
