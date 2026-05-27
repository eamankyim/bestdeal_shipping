import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, touchTargets, typography } from '../../theme/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    // TODO: Implement password reset API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Email Sent',
        'If an account exists with this email, you will receive password reset instructions.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }, 1000);
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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text variant="displaySmall" style={styles.title}>
              Reset Password
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
              backgroundColor="#ffffff"
              textColor={theme.colors.text}
              placeholderTextColor={theme.colors.placeholder}
            />

            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              buttonColor={theme.colors.bestdealOrange}
              labelStyle={styles.buttonLabel}
            >
              Send Reset Link
            </Button>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.backButton}
            >
              Back to Login
            </Button>
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
    padding: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.placeholder,
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff', // White background
    borderRadius: 8,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    minHeight: touchTargets.buttonHeight,
  },
  buttonLabel: {
    fontSize: typography.button,
    fontWeight: '600',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  backButton: {
    marginTop: 8,
  },
});



