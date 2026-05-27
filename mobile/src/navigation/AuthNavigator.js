import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../screens/auth/LoginScreen';
import AcceptInviteScreen from '../screens/auth/AcceptInviteScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  const [initialRoute, setInitialRoute] = useState('Login');
  const [initialParams, setInitialParams] = useState({});

  useEffect(() => {
    // Check for pending invite token
    const checkPendingInvite = async () => {
      try {
        const token = await AsyncStorage.getItem('pendingInviteToken');
        if (token) {
          setInitialRoute('AcceptInvite');
          setInitialParams({ token });
          // Clear the token after using it
          await AsyncStorage.removeItem('pendingInviteToken');
        }
      } catch (error) {
        console.error('Error checking pending invite:', error);
      }
    };

    checkPendingInvite();
  }, []);

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen 
        name="AcceptInvite" 
        component={AcceptInviteScreen}
        initialParams={initialParams}
      />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
