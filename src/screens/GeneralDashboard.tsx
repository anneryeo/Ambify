import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCO2UIData } from '../utils/co2Utils';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const PRACTICE_LEVELS = [
	{ co2: 555, temperature: 22, humidity: 45 },
	{ co2: 921, temperature: 24, humidity: 52 },
	{ co2: 1341, temperature: 26, humidity: 60 },
	{ co2: 1802, temperature: 28, humidity: 68 },
];

type GeneralDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GeneralDashboard'>;

export const GeneralDashboard: React.FC = () => {
	const [levelIndex, setLevelIndex] = useState(0);
	const [fadeAnim] = useState(new Animated.Value(1));
	const [screenFadeAnim] = useState(new Animated.Value(0));
	const navigation = useNavigation<GeneralDashboardNavigationProp>();

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

	const currentLevel = PRACTICE_LEVELS[levelIndex];
	const co2Value = currentLevel.co2;
	const uiData = getCO2UIData(co2Value);

	const co2Data = {
		value: co2Value,
		quality: 'ppm',
		description: `The air is ${uiData.label.toLowerCase()}.`,
	};

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

				<Animated.View style={[styles.content, { opacity: fadeAnim }]}>
					<View style={styles.circleContainer}>
						<LinearGradient
							colors={['rgba(255, 255, 255, 0.1)', uiData.endColor]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.gradientCircle}
						>
							<Text style={styles.co2Value}>{co2Data.value}</Text>
							<Text style={styles.unit}>{co2Data.quality}</Text>
						</LinearGradient>
					</View>

					<View style={styles.infoContainer}>
						<Text style={styles.qualityText}>{co2Data.description}</Text>
						<Text style={styles.descriptionText}>{uiData.tip}</Text>
						<View style={styles.metricsRow}>
							<View style={styles.metricItem}>
								<Text style={styles.metricLabel}>Temperature</Text>
								<Text style={styles.metricValue}>{currentLevel.temperature}°C</Text>
							</View>
							<View style={styles.metricItem}>
								<Text style={styles.metricLabel}>Humidity</Text>
								<Text style={styles.metricValue}>{currentLevel.humidity}%</Text>
							</View>
							<View style={styles.metricItem}>
								<Text style={styles.metricLabel}>CO2</Text>
								<Text style={styles.metricValue}>{currentLevel.co2} ppm</Text>
							</View>
						</View>
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

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
		paddingHorizontal: 24,
		paddingVertical: 20,
	},
	header: {
		alignItems: 'center',
		paddingVertical: 16,
		zIndex: 1,
	},
	appName: {
		fontSize: 20,
		fontWeight: '600',
		color: '#fff',
		fontFamily: 'Gotu-Regular',
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1,
	},
	circleContainer: {
		width: 280,
		height: 280,
		borderRadius: 140,
		marginBottom: 40,
		opacity: 0.9,
	},
	gradientCircle: {
		width: '100%',
		height: '100%',
		borderRadius: 140,
		justifyContent: 'center',
		alignItems: 'center',
	},
	co2Value: {
		fontSize: 64,
		fontWeight: '100',
		color: '#fff',
		fontFamily: 'Golos-Text',
		letterSpacing: -6,
	},
	unit: {
		fontSize: 18,
		fontWeight: '100',
		color: '#fff',
		fontFamily: 'Golos-Text',
		marginTop: 4,
	},
	infoContainer: {
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	qualityText: {
		fontSize: 24,
		fontWeight: '100',
		color: '#fff',
		marginBottom: 12,
		fontFamily: 'Golos-Text',
		letterSpacing: -1,
	},
	descriptionText: {
		fontSize: 20,
		fontWeight: '100',
		color: '#bbb',
		textAlign: 'center',
		lineHeight: 30,
		fontFamily: 'Golos-Text',
		letterSpacing: -1,
	},
	metricsRow: {
		marginTop: 24,
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 8,
	},
	metricItem: {
		alignItems: 'center',
		flex: 1,
	},
	metricLabel: {
		fontSize: 14,
		fontWeight: '400',
		color: '#aaa',
		fontFamily: 'Golos-Text',
	},
	metricValue: {
		marginTop: 6,
		fontSize: 18,
		fontWeight: '500',
		color: '#fff',
		fontFamily: 'Golos-Text',
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingBottom: 24,
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
