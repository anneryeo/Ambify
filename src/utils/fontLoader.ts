import * as Font from 'expo-font';

export const loadFonts = async () => {
  try {
    await Font.loadAsync({
      'Gotu-Regular': require('../../assets/fonts/Gotu-Regular.ttf'),
      'Golos-Text': require('../../assets/fonts/GolosText-VariableFont_wght.ttf'),
    });
  } catch (error) {
    console.error('Error loading fonts:', error);
  }
};
