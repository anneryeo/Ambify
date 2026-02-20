import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCO2UIData } from '../utils/co2Utils';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ═══════════════════════════════════════════════════════════════════════════════
// ADJUSTABLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
// Adjust POMODORO_DURATION to change the focus session length (in seconds)
const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds

const PRACTICE_LEVELS = [
	{ co2: 555, temperature: 22, humidity: 45 },
	{ co2: 921, temperature: 24, humidity: 52 },
	{ co2: 1341, temperature: 26, humidity: 60 },
	{ co2: 1802, temperature: 28, humidity: 68 },
];

type ProductivityScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductivityScreen'>;

export const ProductivityScreen: React.FC = () => {
	const [levelIndex, setLevelIndex] = useState(0);
	const [fadeAnim] = useState(new Animated.Value(1));
	const [screenFadeAnim] = useState(new Animated.Value(0));
	const navigation = useNavigation<ProductivityScreenNavigationProp>();

	// Pomodoro timer state
	const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
	const [isRunning, setIsRunning] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		Animated.timing(screenFadeAnim, {
			toValue: 1,
			duration: 800,
			useNativeDriver: true,
		}).start();
	}, [screenFadeAnim]);

	useFocusEffect(
		React.useCallback(() => {
			fadeAnim.setValue(1);
			screenFadeAnim.setValue(0);
			Animated.timing(screenFadeAnim, {
				toValue: 1,
				duration: 800,
				useNativeDriver: true,
			}).start();
		}, [screenFadeAnim])
	);

	// Timer tick
	useEffect(() => {
		if (isRunning) {
			intervalRef.current = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						setIsRunning(false);
						clearInterval(intervalRef.current!);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} else {
			if (intervalRef.current) clearInterval(intervalRef.current);
		}
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isRunning]);

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60).toString().padStart(2, '0');
		const s = (seconds % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	};

	const progress = 1 - timeLeft / POMODORO_DURATION;

	const currentLevel = PRACTICE_LEVELS[levelIndex];
	const co2Value = currentLevel.co2;
	const uiData = getCO2UIData(co2Value);

	const handleCycleLevel = () => {
		Animated.timing(fadeAnim, {
			toValue: 0,
			duration: 800,
			useNativeDriver: true,
		}).start(() => {
			setLevelIndex((prev) => (prev + 1) % PRACTICE_LEVELS.length);
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 800,
				useNativeDriver: true,
			}).start();
		});
	};

	const handleReturn = () => {
		Animated.timing(screenFadeAnim, {
			toValue: 0,
			duration: 800,
			useNativeDriver: true,
		}).start(() => {
			navigation.goBack();
		});
	};

	return (
		<TouchableWithoutFeedback onPress={handleCycleLevel}>
			<Animated.View style={[styles.container, { opacity: screenFadeAnim }]}>
				<AnimatedBackground />

				<View style={styles.header}>
					<Text style={styles.appName}>Ambify</Text>
				</View>

				{/* Pomodoro Timer Card */}
				<View style={styles.pomodoroCard}>
					<Text style={styles.sessionLabel}>FOCUS SESSION</Text>
					<Text style={styles.timerDisplay}>{formatTime(timeLeft)}</Text>

					{/* Progress track */}
					<View style={styles.progressTrack}>
						<View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
					</View>

					<View style={styles.timerControls}>
						<TouchableOpacity
							onPress={() => setIsRunning((prev) => !prev)}
							style={styles.controlBtn}
						>
							<Text style={styles.controlBtnText}>{isRunning ? 'Pause' : 'Start'}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => {
								setIsRunning(false);
								setTimeLeft(POMODORO_DURATION);
							}}
							style={[styles.controlBtn, styles.controlBtnSecondary]}
						>
							<Text style={[styles.controlBtnText, styles.controlBtnTextSecondary]}>Reset</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Bento Grid */}
				<Animated.View style={[styles.bentoGrid, { opacity: fadeAnim }]}>
					{/* Top row: Temperature + Humidity */}
					<View style={styles.bentoRow}>
						<View style={[styles.bentoCard, styles.bentoCardSm]}>
							<Text style={styles.bentoIcon}>🌡</Text>
							<Text style={styles.bentoValue}>{currentLevel.temperature}°</Text>
							<Text style={styles.bentoLabel}>Temperature</Text>
							<Text style={styles.bentoUnit}>Celsius</Text>
						</View>
						<View style={[styles.bentoCard, styles.bentoCardSm]}>
							<Text style={styles.bentoIcon}>💧</Text>
							<Text style={styles.bentoValue}>{currentLevel.humidity}%</Text>
							<Text style={styles.bentoLabel}>Humidity</Text>
							<Text style={styles.bentoUnit}>Relative</Text>
						</View>
					</View>

					{/* Bottom row: CO2 full-width */}
					<View style={[
						styles.bentoCard,
						styles.bentoCardWide,
						{
							backgroundColor: `${uiData.endColor}22`,
							borderColor: `${uiData.endColor}55`,
						},
					]}>
						<View style={styles.co2Row}>
							<View>
								<Text style={styles.bentoLabel}>CO₂</Text>
								<Text style={[styles.co2BigValue, { color: uiData.endColor === '#507e10' ? '#a8d44e' : uiData.endColor }]}>{co2Value}</Text>
								<Text style={styles.bentoUnit}>ppm</Text>
							</View>
							<View style={[styles.co2Badge, { backgroundColor: `${uiData.endColor}33`, borderColor: `${uiData.endColor}66` }]}>
								<Text style={[styles.co2BadgeText, { color: uiData.endColor === '#507e10' ? '#a8d44e' : uiData.endColor }]}>{uiData.label}</Text>
							</View>
						</View>
						<Text style={styles.co2Tip} numberOfLines={2}>{uiData.tip}</Text>
					</View>
				</Animated.View>

				<View style={styles.footer}>
					<TouchableOpacity onPress={handleReturn} style={styles.backButton}>
						<Text style={styles.backIcon}>‹</Text>
					</TouchableOpacity>
				</View>
			</Animated.View>
		</TouchableWithoutFeedback>
	);
};

// Frosted glass base
// Adjust backgroundColor and borderColor opacity values to change grid box transparency
// Example: '0.07' = 7% opacity, '0.14' = 14% opacity (lower = more transparent)
const glass = {
	backgroundColor: 'rgba(255, 255, 255, 0.07)', // Adjust first 0.07 for background opacity
	borderWidth: 1,
	borderColor: 'rgba(255, 255, 255, 0.14)', // Adjust 0.14 for border opacity
	borderRadius: 20,
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
		paddingHorizontal: 20,
		paddingVertical: 20,
	},
	header: {
		alignItems: 'center',
		paddingVertical: 12,
		zIndex: 1,
	},
	appName: {
		fontSize: 20,
		fontWeight: '600',
		color: '#fff',
		fontFamily: 'Gotu-Regular',
	},

	// ─── Pomodoro ────────────────────────────────────────────────────────────
	pomodoroCard: {
		...glass,
		marginTop: 8,
		paddingVertical: 24,
		paddingHorizontal: 28,
		alignItems: 'center',
		zIndex: 1,
	},
	sessionLabel: {
		fontSize: 11,
		letterSpacing: 3,
		color: 'rgba(255,255,255,0.4)',
		fontFamily: 'Golos-Text',
		marginBottom: 10,
	},
	timerDisplay: {
		fontSize: 72,
		fontWeight: '100',
		color: '#fff',
		fontFamily: 'Golos-Text',
		letterSpacing: -4,
		lineHeight: 80,
	},
	progressTrack: {
		marginTop: 18,
		width: '100%',
		height: 3,
		borderRadius: 2,
		backgroundColor: 'rgba(255,255,255,0.12)',
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		borderRadius: 2,
		backgroundColor: 'rgba(255,255,255,0.72)',
	},
	timerControls: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 20,
	},
	controlBtn: {
		paddingVertical: 10,
		paddingHorizontal: 28,
		borderRadius: 50,
		backgroundColor: 'rgba(255,255,255,0.88)',
	},
	controlBtnSecondary: {
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.28)',
	},
	controlBtnText: {
		fontSize: 15,
		fontWeight: '500',
		color: '#000',
		fontFamily: 'Golos-Text',
	},
	controlBtnTextSecondary: {
		color: 'rgba(255,255,255,0.7)',
	},

	// ─── Bento Grid ──────────────────────────────────────────────────────────
	bentoGrid: {
		flex: 1,
		marginTop: 14,
		gap: 10,
		zIndex: 1,
	},
	bentoRow: {
		flexDirection: 'row',
		gap: 10,
	},
	bentoCard: {
		...glass,
		padding: 18,
	},
	bentoCardSm: {
		flex: 1,
	},
	bentoCardWide: {
		flex: 1,
		justifyContent: 'space-between',
	},
	bentoIcon: {
		fontSize: 22,
		marginBottom: 8,
	},
	bentoValue: {
		fontSize: 36,
		fontWeight: '200',
		color: '#fff',
		fontFamily: 'Golos-Text',
		letterSpacing: -1,
		lineHeight: 40,
	},
	bentoLabel: {
		fontSize: 13,
		fontWeight: '400',
		color: 'rgba(255,255,255,0.5)',
		fontFamily: 'Golos-Text',
		marginTop: 6,
	},
	bentoUnit: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.3)',
		fontFamily: 'Golos-Text',
		marginTop: 2,
	},
	co2Row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	co2BigValue: {
		fontSize: 52,
		fontWeight: '100',
		color: '#fff',
		fontFamily: 'Golos-Text',
		letterSpacing: -3,
		lineHeight: 58,
	},
	co2Badge: {
		marginTop: 4,
		paddingVertical: 6,
		paddingHorizontal: 14,
		borderRadius: 50,
		backgroundColor: 'rgba(255,255,255,0.1)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.18)',
		alignSelf: 'flex-start',
	},
	co2BadgeText: {
		fontSize: 13,
		color: 'rgba(255,255,255,0.75)',
		fontFamily: 'Golos-Text',
	},
	co2Tip: {
		marginTop: 10,
		fontSize: 13,
		color: 'rgba(255,255,255,0.35)',
		fontFamily: 'Golos-Text',
		lineHeight: 19,
	},

	// ─── Footer ──────────────────────────────────────────────────────────────
	footer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingBottom: 16,
		zIndex: 1,
	},
	backButton: {
		padding: 12,
	},
	backIcon: {
		fontSize: 40,
		fontWeight: '300',
		color: '#fff',
		fontFamily: 'Golos-Text',
	},
});
