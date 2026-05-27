import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthContext } from './src/context/AuthContext';
import { theme } from './src/theme/theme';
import LoadingScreen from './src/screens/common/LoadingScreen';
import SplashScreen from './src/screens/common/SplashScreen';
import logger from './src/utils/logger';

const Stack = createStackNavigator();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Initialize logger
    logger.info('App initialized', {
      platform: 'mobile',
      environment: __DEV__ ? 'development' : 'production',
    });

    // Check for stored authentication after splash
    if (!showSplash) {
      checkAuthState();
      requestNotificationPermissions();
      handleDeepLink();
    }
  }, [showSplash]);

  // Global error handler
  useEffect(() => {
    const errorHandler = (error, isFatal) => {
      logger.fatal('Unhandled error', error, {
        component: 'App',
        isFatal,
      });
    };

    // Handle unhandled promise rejections
    const rejectionHandler = (event) => {
      logger.error('Unhandled promise rejection', event.reason, {
        component: 'App',
        type: 'promise_rejection',
      });
    };

    // Note: React Native doesn't have global error handlers like web
    // But we can log errors in catch blocks
    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleDeepLink = async () => {
    // Handle initial URL if app was opened via deep link
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      processInviteLink(initialUrl);
    }

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      processInviteLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  };

  const processInviteLink = (url) => {
    try {
      // Extract token from URL
      // Expected formats:
      // - bestdeal://accept-invite?token=xxx
      // - https://app.bestdeal.com/accept-invite/xxx
      // - bestdeal://accept-invite/xxx
      let token = null;
      
      // Check for query parameter
      if (url.includes('token=')) {
        const match = url.match(/token=([^&]+)/);
        token = match ? match[1] : null;
      } else {
        // Extract from path
        const parts = url.split('/');
        const inviteIndex = parts.findIndex(part => part.includes('accept-invite') || part.includes('invite'));
        if (inviteIndex >= 0 && inviteIndex < parts.length - 1) {
          token = parts[inviteIndex + 1].split('?')[0]; // Remove query params if any
        }
      }
      
      if (token) {
        logger.info('Invitation token detected', { url, hasToken: !!token });
        // Store token temporarily for navigation
        AsyncStorage.setItem('pendingInviteToken', token);
      }
    } catch (error) {
      logger.error('Error processing invite link', error, {
        component: 'App',
        method: 'processInviteLink',
        url,
      });
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const checkAuthState = async () => {
    try {
      logger.debug('Checking auth state');
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        setUserToken(token);
        setUser(JSON.parse(userData));
        logger.info('User authenticated from storage');
      } else {
        logger.debug('No stored authentication found');
      }
    } catch (error) {
      logger.error('Error checking auth state', error, {
        component: 'App',
        method: 'checkAuthState',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Notification permission not granted', { status });
      } else {
        logger.info('Notification permission granted');
      }
    } catch (error) {
      logger.error('Error requesting notification permissions', error, {
        component: 'App',
        method: 'requestNotificationPermissions',
      });
    }
  };

  const authContext = {
    user,
    userToken,
    signIn: async (token, userData) => {
      try {
        logger.info('Signing in user', { userId: userData?.id, email: userData?.email });
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setUserToken(token);
        setUser(userData);
        logger.info('User signed in successfully', { userId: userData?.id });
      } catch (error) {
        logger.error('Error signing in', error, {
          component: 'App',
          method: 'signIn',
          userId: userData?.id,
        });
      }
    },
    signOut: async () => {
      try {
        logger.info('Signing out user');
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        setUserToken(null);
        setUser(null);
        logger.info('User signed out successfully');
      } catch (error) {
        logger.error('Error signing out', error, {
          component: 'App',
          method: 'signOut',
        });
      }
    },
    updateUser: async (userData) => {
      try {
        logger.debug('Updating user data', { userId: userData?.id });
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
      } catch (error) {
        logger.error('Error updating user', error, {
          component: 'App',
          method: 'updateUser',
          userId: userData?.id,
        });
      }
    },
  };

  // Show splash screen first
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="light" />
          <SplashScreen 
            onFinish={() => setShowSplash(false)}
            onGetStarted={() => setShowSplash(false)}
          />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={authContext}>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <StatusBar style="auto" />
            {userToken ? <MainNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </PaperProvider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}



