import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface BlurBall {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
}

export const AnimatedBackground: React.FC = () => {
  const [blurBalls] = useState<BlurBall[]>([
    { id: 1, x: new Animated.Value(100), y: new Animated.Value(100), scale: new Animated.Value(1) },
    { id: 2, x: new Animated.Value(250), y: new Animated.Value(400), scale: new Animated.Value(0.8) },
    { id: 3, x: new Animated.Value(150), y: new Animated.Value(500), scale: new Animated.Value(0.6) },
  ]);

  useEffect(() => {
    const animations = blurBalls.map((ball, index) => {
      const delay = index * 1000;
      
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ball.x, {
              toValue: Math.random() * 200 + 50,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(ball.y, {
              toValue: Math.random() * 600 + 50,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(ball.scale, {
              toValue: Math.random() * 0.4 + 0.6,
              duration: 8000,
              useNativeDriver: true,
            }),
          ]),
        ]),
        { iterations: -1 }
      );
    });

    // Start animations with staggered delay
    setTimeout(() => {
      animations.forEach((anim) => anim.start());
    }, 0);

    return () => {
      animations.forEach((anim) => anim.stop?.());
    };
  }, []);

  return (
    <View style={styles.container}>
      {blurBalls.map((ball) => (
        <Animated.View
          key={ball.id}
          style={[
            styles.blurBall,
            {
              transform: [
                { translateX: ball.x },
                { translateY: ball.y },
                { scale: ball.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  blurBall: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: '#B3E967',
    opacity: 0.08,
    shadowColor: '#B3E967',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 5,
  },
});
