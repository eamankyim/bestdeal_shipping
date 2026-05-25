import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, spacing, touchTargets } from '../../theme/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish, onGetStarted }) {
  const insets = useSafeAreaInsets();
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const nameRevealAnim = useRef(new Animated.Value(0)).current;
  const nameOpacityAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

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
      Animated.delay(300), // Small delay before loading appears
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto finish after splash display
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ImageBackground
      source={require('../../../assets/splash-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
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

      {/* Loading Indicator */}
      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: loadingAnim,
            paddingBottom: insets.bottom + spacing.md,
            transform: [
              {
                translateY: loadingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ActivityIndicator animating size={20} color="#ffffff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 60,
  },
  logoContainer: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 6,
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
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  appName: {
    color: '#f29000',
    fontWeight: 'bold',
    fontSize: 34,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },
});

