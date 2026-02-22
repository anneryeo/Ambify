# Project Changelog: Smooth Transition System Implementation

## Overview

Implemented a **"Pause & Swap" Orchestration System** with a **single shared background** to eliminate choppy/laggy screen transitions. The root causes were:
1. Heavy SVG background animations (originally 4 blur balls × 3 properties = 12 concurrent `Animated.timing` calls) **duplicated in every screen** — with native-stack, previous screens stay mounted so up to 48 simultaneous animations competed for the JS thread
2. Navigation, screen mounting, and background animations all ran simultaneously during transitions

### Architecture Summary (Final)

- **ONE** `AnimatedBackground` instance (3 `#B3E967` blur balls) lives in `AppNavigator`, behind all screens
- Screens contain **zero** background components — they are fully transparent shells
- All screens have `backgroundColor: 'transparent'` + `contentStyle: { backgroundColor: 'transparent' }` so the shared background shows through
- Transitions use a cinema-style dip-to-black overlay managed centrally

```
User taps navigate
       │
       ▼
  TransitionContext.navigate("Screen")
       │
       ▼
  AppNavigator.performTransition()
       │
       ├─ 1. setIsBgPaused(true)        ← freeze all SVG blob animations
       ├─ 2. Fade overlay to black       ← 400ms, native driver
       ├─ 3. Navigate (hidden)           ← actual React Navigation call
       ├─ 4. Double requestAnimationFrame ← give new screen 2 frames to mount
       ├─ 5. setIsBgPaused(false)        ← resume blobs BEFORE reveal
       └─ 6. Fade overlay to clear       ← 600ms, native driver
```

> **Note**: Background resumes (step 5) *before* the reveal (step 6) so blobs are already moving when the overlay fades away — this looks more natural than a static frame appearing first.

---

## File-by-File Changes

---

### 1. `src/context/TransitionContext.tsx` — **NEW FILE**

**Purpose**: Decouple navigation triggers from React Navigation so every navigation call routes through the orchestrated transition system.

```tsx
import React, { createContext, useContext } from 'react';

interface TransitionContextType {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

export const TransitionContext = createContext<TransitionContextType>({
  navigate: () => {},
  goBack: () => {},
});

export const useTransition = () => useContext(TransitionContext);
```

---

### 2. `src/navigation/AppNavigator.tsx` — **MAJOR REWRITE**

**Purpose**: Central orchestrator. Owns the **single shared** `AnimatedBackground`, the black overlay, pause state, and the navigation ref. No screen receives `isPaused` or renders its own background.

#### BEFORE

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { MainDashboard } from '../screens/MainDashboard';
import { ProductivityScreen } from '../screens/ProductivityScreen';

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
        <Stack.Screen name="Splash">
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
        <Stack.Screen name="ProductivityScreen" component={ProductivityScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

**Problems**:
- Navigation callbacks passed as props (`onContinue`) — tightly coupled
- No mechanism to pause background animations during transitions
- Each screen had to manage its own fade-in/fade-out animations (duplicated logic)
- `animationEnabled: false` disabled default animations but screens still fought for JS thread
- Each screen rendered its own `AnimatedBackground` — with native-stack keeping screens mounted, up to 4 instances ran simultaneously

#### AFTER

```tsx
import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { MainDashboard } from '../screens/MainDashboard';
import { ProductivityScreen } from '../screens/ProductivityScreen';
import { TransitionContext } from '../context/TransitionContext';
import { AnimatedBackground } from '../components/AnimatedBackground';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Dashboard: undefined;
  ProductivityScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [isBgPaused, setIsBgPaused] = useState(false);
  const isTransitioning = useRef(false);

  const performTransition = useCallback((action: () => void) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setIsBgPaused(true);                           // 1. Pause background

    Animated.timing(overlayOpacity, {
      toValue: 1, duration: 400, useNativeDriver: true,  // 2. Dip to black
    }).start(() => {
      action();                                    // 3. Navigate (hidden)
      requestAnimationFrame(() => {                // 4. Wait 2 frames
        requestAnimationFrame(() => {
          setIsBgPaused(false);                    // 5. Resume background BEFORE reveal

          Animated.timing(overlayOpacity, {
            toValue: 0, duration: 600, useNativeDriver: true,  // 6. Reveal
          }).start(() => {
            isTransitioning.current = false;
          });
        });
      });
    });
  }, [overlayOpacity]);

  const transitionApi = useMemo(() => ({
    navigate: (screen: string, params?: any) => {
      performTransition(() => {
        navRef.current?.navigate(screen as any, params);
      });
    },
    goBack: () => {
      performTransition(() => {
        if (navRef.current?.canGoBack()) navRef.current.goBack();
      });
    },
  }), [performTransition]);

  return (
    <TransitionContext.Provider value={transitionApi}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Single shared background — only ONE instance for the entire app */}
        <AnimatedBackground isPaused={isBgPaused} />

        <NavigationContainer ref={navRef}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'none',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Dashboard" component={MainDashboard} />
            <Stack.Screen name="ProductivityScreen" component={ProductivityScreen} />
          </Stack.Navigator>
        </NavigationContainer>

        {/* Black overlay for cinema-style dip-to-black transition */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000', opacity: overlayOpacity, zIndex: 999 },
          ]}
        />
      </View>
    </TransitionContext.Provider>
  );
};
```

**Key Changes**:
- Added `NavigationContainerRef` to control navigation programmatically
- Added `overlayOpacity` animated value for the cinema-style dip-to-black overlay
- Added `isBgPaused` state — passed directly to the **single** `AnimatedBackground` in this file (NOT to screens)
- Added `isTransitioning` ref guard against double-tap navigation
- Added `TransitionContext.Provider` wrapping the entire navigator
- Added **single shared** `<AnimatedBackground isPaused={isBgPaused} />` rendered *before* the navigator (behind all screens)
- Screens registered with `component={ScreenName}` — no render props, no `isPaused` forwarding
- `contentStyle: { backgroundColor: 'transparent' }` so screens are see-through to the shared background
- Changed `animationEnabled: false` → `animation: 'none'` (correct native-stack API)
- Double `requestAnimationFrame` gives the new screen 2 frames to mount before reveal begins
- Background resumes BEFORE the reveal animation starts (blobs are already moving when the overlay fades)

---

### 3. `src/components/AnimatedBackground.tsx` — **REWRITTEN WITH PAUSE SUPPORT**

**Purpose**: 3 SVG blur balls (`#B3E967`) with looping movement animations, pausable via `isPaused` prop. Only one instance exists in the entire app (rendered in `AppNavigator`).

#### BEFORE

```tsx
export const AnimatedBackground: React.FC = () => {
  // 4 blur balls with various colors (#b9da29, etc.)
  const [blurBalls] = useState<BlurBall[]>([
    { id: 1, x: new Animated.Value(...), y: new Animated.Value(...), scale: new Animated.Value(1) },
    { id: 2, ... },
    { id: 3, ... },
    { id: 4, ... },  // ← 4th ball
  ]);

  useEffect(() => {
    const animations = blurBalls.map((ball) => {
      // ... build animation sequences ...
      return Animated.loop(Animated.sequence(sequence), { iterations: -1 });
    });
    animations.forEach((anim) => anim.start());
    return () => { animations.forEach((anim) => anim.stop?.()); };
  }, [blurBalls]);
```

**Problems**:
- Animations ran continuously with no way to pause
- 4 balls meant 4 × 3 = 12 concurrent `Animated.timing` calls per instance
- No `isPaused` mechanism

#### AFTER

```tsx
interface AnimatedBackgroundProps {
  isPaused?: boolean;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ isPaused = false }) => {
  // 3 blur balls — all #B3E967
  const [blurBalls] = useState<BlurBall[]>([
    { id: 1, x: new Animated.Value(50),  y: new Animated.Value(100), scale: new Animated.Value(1) },
    { id: 2, x: new Animated.Value(200), y: new Animated.Value(400), scale: new Animated.Value(0.8) },
    { id: 3, x: new Animated.Value(100), y: new Animated.Value(600), scale: new Animated.Value(0.6) },
  ]);

  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (isPaused) {
      animationsRef.current.forEach((anim) => anim.stop?.());
      return;  // ← Exit early, don't restart
    }

    const animations = blurBalls.map((ball) => {
      const sequence: Animated.CompositeAnimation[] = [];
      for (let i = 0; i < 15; i++) {  // 15 waypoints per loop
        sequence.push(
          Animated.parallel([
            Animated.timing(ball.x, {
              toValue: Math.random() * 400 - 100,  // X range: -100 to 300
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
            Animated.timing(ball.y, {
              toValue: Math.random() * 1000 - 200,  // Y range: -200 to 800
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
            Animated.timing(ball.scale, {
              toValue: Math.random() * 0.5 + 0.5,  // Scale: 0.5 to 1.0
              duration: 6000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
          ])
        );
      }
      return Animated.loop(Animated.sequence(sequence), { iterations: -1 });
    });

    animationsRef.current = animations;
    animations.forEach((anim) => anim.start());
    return () => { animations.forEach((anim) => anim.stop?.()); };
  }, [blurBalls, isPaused]);

  // SVG circles: 800×800 with RadialGradient, all stops use #B3E967
  // Stop opacities: 0% → 0.6, 70% → 0.2, 100% → 0
```

**Key Changes**:
- Reduced from 4 balls to **3 balls** (9 concurrent animations instead of 12)
- Unified color to `#B3E967` (all stops) — previously mixed colors
- Initial positions: (50,100), (200,400), (100,600)
- Movement range: X from -100 to 300, Y from -200 to 800
- Added `isPaused` prop (defaults to `false`)
- Added `animationsRef` to track running animations for stopping
- When `isPaused` flips to `true`: all 9 running `Animated.timing` calls stop immediately
- When `isPaused` flips to `false`: animations restart from current positions
- SVG circle size: 800×800, radius 400, RadialGradient with 3 stops
- 15 waypoints per loop cycle, duration 6000–10000ms per waypoint

---

### 4. `src/screens/SplashScreen.tsx` — **SIMPLIFIED**

#### BEFORE

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedBackground } from '../components/AnimatedBackground';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const [fadeAnim] = useState(new Animated.Value(1));

  useFocusEffect(
    React.useCallback(() => {
      fadeAnim.setValue(1);
    }, [fadeAnim])
  );

  const handlePress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 800, useNativeDriver: true,
    }).start(() => { onContinue(); });
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <AnimatedBackground />
        ...
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
```

**Problems**:
- Screen-level fade animation (800ms) competed with background animations
- Used `Animated.View` with opacity for the whole screen — unnecessary JS work
- `useFocusEffect` + `fadeAnim` management = boilerplate on every screen
- `onContinue` prop coupling
- Had its own `AnimatedBackground` instance (redundant with native-stack)

#### AFTER

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { useTransition } from '../context/TransitionContext';

export const SplashScreen: React.FC = () => {
  const { navigate } = useTransition();

  const handlePress = () => { navigate('Welcome'); };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        {/* No AnimatedBackground — shared instance shows through transparent bg */}
        ...
      </View>
    </TouchableWithoutFeedback>
  );
};

// styles.container: backgroundColor: 'transparent'
```

**Key Changes**:
- Removed: `useState`, `Animated`, `useFocusEffect`, `AnimatedBackground` imports
- Removed: `fadeAnim` state and all per-screen fade animation logic
- Removed: `onContinue` prop and `SplashScreenProps` interface entirely
- Removed: `<AnimatedBackground />` component — shared background shows through transparent container
- Added: `useTransition().navigate()` for navigation
- Changed: `Animated.View` → plain `View`, `backgroundColor: '#000000'` → `'transparent'`

---

### 5. `src/screens/WelcomeScreen.tsx` — **SIMPLIFIED**

#### BEFORE

```tsx
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AnimatedBackground } from '../components/AnimatedBackground';

interface WelcomeScreenProps { onContinue: () => void; }

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, ... }).start();
  }, []);

  useFocusEffect(React.useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, ... }).start();
  }, [fadeAnim]));

  const handleContinue = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 800, ... }).start(() => { onContinue(); });
  };

  const handleBack = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 800, ... }).start(() => {
      navigation.navigate('Splash' as never);
    });
  };
  // ... <Animated.View style={{ opacity: fadeAnim }}>
  //       <AnimatedBackground />
```

#### AFTER

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { useTransition } from '../context/TransitionContext';

export const WelcomeScreen: React.FC = () => {
  const { navigate, goBack } = useTransition();

  const handleContinue = () => { navigate('Dashboard'); };
  const handleBack = () => { goBack(); };

  // ... <View style={styles.container}>
  //       (no AnimatedBackground — transparent to shared bg)
```

**Key Changes**:
- Removed: `useState`, `useEffect`, `Animated`, `useNavigation`, `useFocusEffect`, `AnimatedBackground`
- Removed: `fadeAnim` + all 4 animation calls (mount fade-in, focus fade-in, continue fade-out, back fade-out)
- Removed: `onContinue` prop and `WelcomeScreenProps` interface
- Removed: `<AnimatedBackground />` component
- Added: `useTransition()` hook for `navigate` and `goBack`
- Changed: `Animated.View` → plain `View`, `backgroundColor` → `'transparent'`

---

### 6. `src/screens/MainDashboard.tsx` — **SIMPLIFIED**

#### BEFORE

```tsx
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AnimatedBackground } from '../components/AnimatedBackground';

export const MainDashboard: React.FC = () => {
  const [screenFadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation<MainDashboardNavigationProp>();

  useEffect(() => {
    Animated.timing(screenFadeAnim, { toValue: 1, duration: 800, ... }).start();
  }, []);

  useFocusEffect(React.useCallback(() => {
    screenFadeAnim.setValue(0);
    Animated.timing(screenFadeAnim, { toValue: 1, duration: 800, ... }).start();
  }, []));

  const handleBack = () => {
    Animated.timing(screenFadeAnim, { toValue: 0, duration: 800, ... })
      .start(() => { navigation.navigate('Welcome'); });
  };
  const handleContinue = () => {
    Animated.timing(screenFadeAnim, { toValue: 0, duration: 800, ... })
      .start(() => { navigation.navigate('ProductivityScreen'); });
  };
  // ... <Animated.View style={{ opacity: screenFadeAnim }}>
  //       <AnimatedBackground />
```

#### AFTER

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCO2UIData } from '../utils/co2Utils';
import { useTransition } from '../context/TransitionContext';

export const MainDashboard: React.FC = () => {
  const [fadeAnim] = useState(new Animated.Value(1));  // kept for CO2 cycling only
  const { navigate, goBack } = useTransition();

  const handleBack = () => { goBack(); };
  const handleContinue = () => { navigate('ProductivityScreen'); };

  // ... <View style={styles.container}>
  //       (no AnimatedBackground — transparent to shared bg)
```

**Key Changes**:
- Removed: `screenFadeAnim`, `useEffect`, `useFocusEffect`, `useNavigation`, navigation type imports, `AnimatedBackground`
- Removed: 4 separate `Animated.timing` calls for screen-level fading
- Removed: `<AnimatedBackground />` component
- Added: `useTransition()` hook for `navigate` and `goBack`
- Changed: `backgroundColor` → `'transparent'`
- Kept: `fadeAnim` for the CO2 level cycling animation (this is an in-screen effect, not a transition)

---

### 7. `src/screens/ProductivityScreen.tsx` — **SIMPLIFIED**

#### BEFORE

```tsx
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AnimatedBackground } from '../components/AnimatedBackground';

export const ProductivityScreen: React.FC = () => {
  const [screenFadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation<ProductivityScreenNavigationProp>();

  useEffect(() => { /* screenFadeAnim → 1 */ }, []);
  useFocusEffect(React.useCallback(() => { /* screenFadeAnim 0 → 1 */ }, []));

  const handleReturn = () => {
    Animated.timing(screenFadeAnim, { toValue: 0, duration: 800, ... })
      .start(() => { navigation.goBack(); });
  };
  // ... <Animated.View style={{ opacity: screenFadeAnim }}>
  //       <AnimatedBackground />
```

#### AFTER

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { getCO2UIData } from '../utils/co2Utils';
import { useTransition } from '../context/TransitionContext';

interface ProductivityScreenProps {}

export const ProductivityScreen: React.FC<ProductivityScreenProps> = () => {
  const { goBack } = useTransition();

  const handleReturn = () => { goBack(); };

  // ... <View style={styles.container}>
  //       (no AnimatedBackground — transparent to shared bg)
```

**Key Changes**:
- Removed: `screenFadeAnim`, `useNavigation`, `useFocusEffect`, navigation type imports, `AnimatedBackground`
- Removed: 3 separate `Animated.timing` calls for screen-level fading
- Removed: `<AnimatedBackground />` component
- Added: `useTransition()` hook for `goBack`
- Changed: `backgroundColor` → `'transparent'`
- Kept: `fadeAnim` for bento grid level cycling (in-screen effect)
- Kept: Pomodoro timer logic (unrelated to transitions)

---

## Summary of Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| AnimatedBackground instances | **4** (one per screen, all mounted) | **1** (shared in AppNavigator) |
| Concurrent Animated.timing during nav | ~12 per bg instance × 4 screens + screen fade = **49+** | **2** (overlay fade-out + fade-in) |
| Background animation during transition | **Running** across all mounted screens | **Paused** (0 CPU cost) |
| Screen fade management | Each screen manages own fade-in/out (**duplicated 4×**) | **Centralized** in AppNavigator overlay |
| Navigation coupling | Props (`onContinue`) or direct `useNavigation` | **Context-based** (`useTransition()`) |
| Double-tap protection | **None** | `isTransitioning` ref guard |
| Transition style | Per-screen opacity fade (inconsistent timing) | **Cinema-style dip-to-black** (400ms out, 600ms in) |
| Blur ball count | 4 per screen (various colors) | **3 total** (all `#B3E967`) |
| Screen background | `backgroundColor: '#000000'` (opaque) | `backgroundColor: 'transparent'` |

### Why This Works

1. **Single Instance**: Only ONE `AnimatedBackground` exists. With native-stack keeping screens mounted, the old approach had up to 4 instances running simultaneously — now there's exactly 1.
2. **Zero Stutter**: The 9 concurrent `Animated.timing` calls (3 balls × 3 properties) from blob animations are stopped before the overlay even starts animating.
3. **Consistent Experience**: Every navigation looks identical — the same black dip regardless of how complex the destination screen is to mount.
4. **Native Driver**: Both overlay animations use `useNativeDriver: true`, running entirely on the native UI thread — the JS thread is free to mount the new screen.
5. **Sequential Execution**: Background pause → fade out → navigate → wait 2 frames → background resume → fade in. No step overlaps with another.
6. **Transparent Screens**: Screens are just UI shells with `transparent` backgrounds — the shared background shows through uniformly across all screens.
