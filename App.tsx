import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Font from 'expo-font';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [isFontsLoaded, setIsFontsLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          'Gotu-Regular': require('./assets/fonts/Gotu-Regular.ttf'),
          'Golos-Text': require('./assets/fonts/GolosText-VariableFont_wght.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setIsFontsLoaded(true);
      }
    }

    prepare();
  }, []);

  if (!isFontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
    </View>
  );
}
