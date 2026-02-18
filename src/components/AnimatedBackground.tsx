import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface BlurBall {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
}

const createRandomWaypoints = (ballId: number): Animated.CompositeAnimation => {
  const ball = {
    x: new Animated.Value(Math.random() * 300),
    y: new Animated.Value(Math.random() * 800),
    scale: new Animated.Value(Math.random() * 0.4 + 0.6),
  };

  const animations: Animated.CompositeAnimation[] = [];

  // Create 10 continuous waypoints per cycle
  for (let i = 0; i < 10; i++) {
    animations.push(
      Animated.parallel([
        Animated.timing(ball.x, {
          toValue: Math.random() * 350 - 100,
          duration: 5000 + Math.random() * 3000,
          useNativeDriver: true,
        }),
        Animated.timing(ball.y, {
          toValue: Math.random() * 900 - 100,
          duration: 5000 + Math.random() * 3000,
          useNativeDriver: true,
        }),
        Animated.timing(ball.scale, {
          toValue: Math.random() * 0.4 + 0.6,
          duration: 5000 + Math.random() * 3000,
          useNativeDriver: true,
        }),
      ])
    );
  }

  return Animated.loop(Animated.sequence(animations), { iterations: -1 });
};

export const AnimatedBackground: React.FC = () => {
  const [blurBalls] = useState<BlurBall[]>([
    { id: 1, x: new Animated.Value(50), y: new Animated.Value(100), scale: new Animated.Value(1) },
    { id: 2, x: new Animated.Value(250), y: new Animated.Value(400), scale: new Animated.Value(0.8) },
    { id: 3, x: new Animated.Value(150), y: new Animated.Value(500), scale: new Animated.Value(0.6) },
  ]);

  useEffect(() => {
    const animations = blurBalls.map((ball) => {
      // Create continuous looping animation for each ball
      const sequence: Animated.CompositeAnimation[] = [];

      for (let i = 0; i < 15; i++) {
        sequence.push(
          Animated.parallel([
            Animated.timing(ball.x, {
              toValue: Math.random() * 600 - 200,
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
            Animated.timing(ball.y, {
              toValue: Math.random() * 1400 - 200,
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
            Animated.timing(ball.scale, {
              toValue: Math.random() * 0.5 + 0.5,
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
          ])
        );
      }

      return Animated.loop(Animated.sequence(sequence), { iterations: -1 });
    });

    // Start all animations
    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop?.());
    };
  }, [blurBalls]);

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
    opacity: 0.30,
    shadowColor: '#B3E967',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 120,
    elevation: 5,
  },
});
