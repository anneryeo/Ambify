import React, { useEffect, useRef, useState } from 'react';
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
//   - width/height (800) → Circle size
//   - #B3E967 → Circle color
//
// Circle Movement (constrained to keep blobs visible):
//   - Math.random() * 400 - 100 → X-axis range (-100 to 300)
//   - Math.random() * 1000 - 200 → Y-axis range (-200 to 800)
//   - 6000 + Math.random() * 4000 → Speed (milliseconds)
//   - Math.random() * 0.5 + 0.5 → Size variation
//
// Animation Behavior:
//   - for (let i = 0; i < 15; i++) → Number of waypoints before repeating
//   - blurBalls array → Add/remove circles (each needs unique id)
// ================================

interface AnimatedBackgroundProps {
  isPaused?: boolean;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ isPaused = false }) => {
  // TWEAK: Add/remove objects from this array to create more or fewer circles
  // Each circle needs id, x, y, and scale Animated values
  // Initial positions are constrained to keep blobs visible on screen
  const [blurBalls] = useState<BlurBall[]>([
    { id: 1, x: new Animated.Value(50), y: new Animated.Value(100), scale: new Animated.Value(1) },
    { id: 2, x: new Animated.Value(200), y: new Animated.Value(400), scale: new Animated.Value(0.8) },
    { id: 3, x: new Animated.Value(100), y: new Animated.Value(600), scale: new Animated.Value(0.6) },
  ]);

  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (isPaused) {
      // Stop all running animations immediately to free CPU
      animationsRef.current.forEach((anim) => anim.stop?.());
      return;
    }

    const animations = blurBalls.map((ball) => {
      // Create continuous looping animation for each ball
      const sequence: Animated.CompositeAnimation[] = [];

      for (let i = 0; i < 15; i++) {
        sequence.push(
          Animated.parallel([
            // X-axis movement: constrained to keep blobs visible on screen
            // TWEAK: range is Math.random() * 400 - 100 (from -100 to 300)
            // Keeps center within screen width while accounting for 800px blob size
            Animated.timing(ball.x, {
              toValue: Math.random() * 400 - 100,
              // TWEAK: duration controls speed (lower = faster). Add/subtract range for variation
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
            // Y-axis movement: constrained to keep blobs visible on screen
            // TWEAK: range is Math.random() * 1000 - 200 (from -200 to 800)
            // Keeps center within screen height while accounting for 800px blob size
            Animated.timing(ball.y, {
              toValue: Math.random() * 1000 - 200,
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

    animationsRef.current = animations;

    // Start all animations
    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop?.());
    };
  }, [blurBalls, isPaused]);

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
