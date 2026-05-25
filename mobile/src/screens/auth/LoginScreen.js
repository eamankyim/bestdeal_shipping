import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { theme, spacing, touchTargets, typography } from '../../theme/theme';
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
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/signin-background.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.main}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.brandSection}>
              <Image
                source={require('../../../assets/AppLogo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>BestDeal Shipping</Text>
              <Text style={styles.welcomeText}>Sign in to continue</Text>
            </View>

            <View style={styles.formSection}>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                left={<TextInput.Icon icon="email-outline" />}
                outlineColor="#d9d9d9"
                activeOutlineColor="#ff9800"
                textColor="#1f1f1f"
                theme={{
                  colors: {
                    onSurfaceVariant: '#666666',
                    surface: 'rgba(255,255,255,0.22)',
                    background: 'rgba(255,255,255,0.22)',
                  },
                }}
              />

              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                left={<TextInput.Icon icon="lock-outline" />}
                outlineColor="#d9d9d9"
                activeOutlineColor="#ff9800"
                textColor="#1f1f1f"
                theme={{
                  colors: {
                    onSurfaceVariant: '#666666',
                    surface: 'rgba(255,255,255,0.22)',
                    background: 'rgba(255,255,255,0.22)',
                  },
                }}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor={theme.colors.bestdealOrange}
                labelStyle={styles.buttonLabel}
              >
                Sign In
              </Button>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Need an account? </Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.contactText}>Contact Administrator</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  main: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  content: {
    width: '100%',
    justifyContent: 'flex-start',
    paddingBottom: spacing.md,
  },
  brandSection: {
    alignItems: 'center',
    marginTop: spacing.xl * 2.25,
    marginBottom: spacing.md,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 8,
  },
  title: {
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 8,
    fontSize: typography.title,
  },
  welcomeText: {
    color: theme.colors.placeholder,
    textAlign: 'center',
    fontSize: typography.md,
  },
  formSection: {
    width: '100%',
    marginTop: spacing.sm,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
  },
  button: {
    marginTop: 4,
    marginBottom: spacing.sm,
    borderRadius: 10,
  },
  buttonContent: {
    minHeight: touchTargets.buttonHeight,
  },
  buttonLabel: {
    fontSize: typography.button,
    fontWeight: '600',
  },
  forgotWrap: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  forgotText: {
    color: '#d79000',
    fontSize: typography.lg,
    fontWeight: '600',
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    flexWrap: 'wrap',
    alignSelf: 'center',
  },
  footerText: {
    color: theme.colors.text,
    fontSize: typography.md,
  },
  contactText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: typography.md,
  },
});



