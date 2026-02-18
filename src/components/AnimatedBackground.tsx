import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

interface BlurBall {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
}

// ===== QUICK TWEAKING GUIDE =====
// Circle Appearance:
//   - stopOpacity values (0.6, 0.2, 0) → Change brightness/fade intensity
//   - offset="70%" → Where fade starts (0-100%)
//   - width/height (500) → Circle size
//   - #B3E967 → Circle color
//
// Circle Movement:
//   - Math.random() * 600 - 200 → X-axis spread range
//   - Math.random() * 1400 - 200 → Y-axis spread range
//   - 6000 + Math.random() * 4000 → Speed (milliseconds)
//   - Math.random() * 0.5 + 0.5 → Size variation
//
// Animation Behavior:
//   - for (let i = 0; i < 15; i++) → Number of waypoints before repeating
//   - blurBalls array → Add/remove circles (each needs unique id)
// ================================

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
  // TWEAK: Add/remove objects from this array to create more or fewer circles
  // Each circle needs id, x, y, and scale Animated values
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
            // X-axis movement: range is Math.random() * 600 - 200 
            // TWEAK: Increase 600 for wider horizontal spread, -200 is offset
            Animated.timing(ball.x, {
              toValue: Math.random() * 600 - 200,
              // TWEAK: duration controls speed (lower = faster). Add/subtract range for variation
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
            // Y-axis movement: range is Math.random() * 1400 - 200
            // TWEAK: Increase 1400 for taller vertical spread, -200 is offset
            Animated.timing(ball.y, {
              toValue: Math.random() * 1400 - 200,
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
            // Scale (size): ranges from 0.5 to 1.0
            // TWEAK: Change Math.random() * 0.5 + 0.5 to adjust size variation
            Animated.timing(ball.scale, {
              toValue: Math.random() * 0.5 + 0.5,
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
          ])
        );
      }
      // TWEAK: Change loop number (15) to control how many waypoints before pattern repeats (more = longer before cycle)

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
            styles.blurBallWrapper,
            {
              transform: [
                { translateX: ball.x },
                { translateY: ball.y },
                { scale: ball.scale },
              ],
            },
          ]}
        >
          {/* SVG Circle with Radial Gradient */}
          {/* width/height: Size of the circle (500 = large, reduce for smaller) */}
          <Svg width={800} height={800} viewBox="0 0 800 800">
            <Defs>
              {/* Radial Gradient: Controls the fade effect from center to edges */}
              <RadialGradient id={`grad-${ball.id}`} cx="50%" cy="50%" r="50%">
                {/* First Stop: Center of circle - TWEAK stopOpacity to control brightness (0.1-1) */}
                <Stop offset="0%" stopColor="#B3E967" stopOpacity="0.6" />
                
                {/* Middle Stop: Fade region - offset="70%" controls where fade starts (0-100%), 
                    stopOpacity controls fade intensity (0.1-0.5) */}
                <Stop offset="70%" stopColor="#B3E967" stopOpacity="0.2" />
                
                {/* Last Stop: Edges - Always 0% opacity for fully transparent fade to nothing */}
                <Stop offset="100%" stopColor="#B3E967" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {/* Circle: r="250" is the radius (half of width/height). Keep matching SVG dimensions */}
            <Circle cx="400" cy="400" r="400" fill={`url(#grad-${ball.id})`} />
          </Svg>
        </Animated.View>
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
  // TWEAK: width/height must match the Svg dimensions above (500x500)
  // Increase both for larger circles, decrease for smaller
  blurBallWrapper: {
    position: 'absolute',
    width: 800,
    height: 800,
  },
});
