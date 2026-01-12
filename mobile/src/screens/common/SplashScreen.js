import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, spacing, touchTargets } from '../../theme/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish, onGetStarted }) {
  const insets = useSafeAreaInsets();
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const nameRevealAnim = useRef(new Animated.Value(0)).current;
  const nameOpacityAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(logoFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Name reveal animation - smooth reveal with mask
    Animated.sequence([
      Animated.delay(600), // Wait for logo to appear
      Animated.parallel([
        Animated.timing(nameOpacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(nameRevealAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(300), // Small delay before button appears
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Don't auto navigate - let user click button instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else if (onFinish) {
      onFinish();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoFadeAnim,
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/AppLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App Name with Reveal Animation */}
        <View style={styles.nameContainer}>
          <Animated.View
            style={[
              styles.nameRevealMask,
              {
                transform: [
                  {
                    translateX: nameRevealAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-width, width],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.Text
            variant="displayMedium"
            style={[
              styles.appName,
              {
                opacity: nameOpacityAnim,
              },
            ]}
          >
            BestDeal Shipping App
          </Animated.Text>
        </View>
      </View>

      {/* Get Started Button - Outside content to allow full width */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: buttonAnim,
            paddingBottom: insets.bottom + spacing.md,
            transform: [
              {
                translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Button
          mode="contained"
          onPress={handleGetStarted}
          style={styles.getStartedButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          buttonColor="#ff9800"
        >
          Get Started
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000d1f', // Very dark blue
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
  },
  nameRevealMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: '100%',
    backgroundColor: '#000d1f',
    zIndex: 1,
  },
  appName: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 24,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  getStartedButton: {
    borderRadius: 8,
    elevation: 0,
    shadowOpacity: 0,
    width: '100%',
    alignSelf: 'stretch',
  },
  buttonContent: {
    paddingVertical: spacing.sm,
    minHeight: touchTargets.buttonHeight,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

