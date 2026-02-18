import { CardStyleInterpolators } from '@react-navigation/stack';
import { Animated } from 'react-native';

export const fadeToBlackTransition = {
  cardStyleInterpolator: ({ current, next, layouts }: any) => {
    const opacity = Animated.add(
      current.progress,
      next ? next.progress : 0
    ).interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, 1, 0],
    });

    return {
      cardStyle: {
        opacity,
      },
    };
  },
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 600,
        toValue: 1,
        useNativeDriver: true,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 600,
        toValue: 0,
        useNativeDriver: true,
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }: any) => {
    return {
      cardStyle: {
        opacity: current.progress,
      },
    };
  },
};

export const sceneTransitionConfig = {
  gestureEnabled: false,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 800,
        toValue: 1,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 800,
        toValue: 0,
      },
    },
  },
  cardStyleInterpolator: ({ current, next, layouts }: any) => {
    const opacity = Animated.add(
      current.progress,
      next ? next.progress : 0
    ).interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, 1, 0],
    });

    return {
      cardStyle: {
        opacity,
      },
      overlayStyle: {
        opacity: Animated.subtract(1, opacity),
      },
    };
  },
};
