import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { theme, spacing, touchTargets } from '../../theme/theme';
import logger from '../../utils/logger';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      logger.warn('Login attempt with missing fields', { email: !!email, password: !!password });
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      logger.info('Login attempt started', { email });
      const response = await authService.login(email, password);
      
      if (response.success) {
        logger.info('Login successful, signing in user', { email });
        await signIn(response.data.token, response.data.user);
      } else {
        logger.warn('Login failed - invalid response', { 
          email, 
          message: response.message 
        });
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
      logger.error('Login error', error, {
        component: 'LoginScreen',
        method: 'handleLogin',
        email,
      });
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
<<<<<<< HEAD
          {/* Brand Section (text-only, logo image removed) */}
          <View style={styles.brandSection}>
            <Text variant="displaySmall" style={styles.title}>
              ShipEASE Shipping
=======
          {/* Logo/Brand Section */}
          <View style={styles.brandSection}>
            <Image
              source={require('../../../assets/AppLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text variant="displaySmall" style={styles.title}>
              BestDeal Shipping
>>>>>>> origin/master
            </Text>
            <Text variant="bodyLarge" style={styles.welcomeText}>
              Sign in to continue
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
              backgroundColor="#ffffff"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
              backgroundColor="#ffffff"
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
<<<<<<< HEAD
              buttonColor={theme.colors.shipeaseOrange}
=======
              buttonColor={theme.colors.bestdealOrange}
>>>>>>> origin/master
            >
              Sign In
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotButton}
            >
              Forgot Password?
            </Button>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Need an account?{' '}
            </Text>
            <Text variant="bodyMedium" style={styles.contactText}>
              Contact Administrator
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: spacing.sm,
    fontSize: 24,
  },
  welcomeText: {
    color: theme.colors.placeholder,
    textAlign: 'center',
    fontSize: 15,
  },
  formSection: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: '#ffffff', // White background
    borderRadius: 8, // Consistent 8px border radius
  },
  button: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    minHeight: touchTargets.buttonHeight,
    borderRadius: 8, // Consistent 8px border radius (not fully curved)
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  forgotButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    minHeight: touchTargets.minHeight,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
  footerText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  contactText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});



