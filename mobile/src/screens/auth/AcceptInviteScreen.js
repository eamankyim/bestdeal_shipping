import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';
import { theme } from '../../theme/theme';

export default function AcceptInviteScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { token } = route?.params || {};
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchingInvite, setFetchingInvite] = useState(true);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setFetchingInvite(false);
      return;
    }

    const fetchInviteDetails = async () => {
      try {
        const response = await authService.getInviteByToken(token);
        
        if (response.success && response.data?.invitation) {
          const invitation = response.data.invitation;
          setInviteInfo({
            token,
            email: invitation.email,
            role: invitation.role,
          });
        } else {
          throw new Error('Invalid invitation response');
        }
      } catch (err) {
        console.error('Failed to fetch invite:', err);
        const errorMsg = err?.message?.includes('expired') 
          ? 'This invitation link has expired. Please request a new invitation.'
          : err?.message?.includes('accepted')
          ? 'This invitation has already been accepted.'
          : err?.message?.includes('not found')
          ? 'Invalid invitation link. Please check the link and try again.'
          : 'Invalid or expired invitation link';
        
        setError(errorMsg);
      } finally {
        setFetchingInvite(false);
      }
    };
    
    fetchInviteDetails();
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!formData.name || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.acceptInvite(token, {
        name: formData.name,
        password: formData.password,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          'Account created successfully! Please login with your credentials.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create account');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create account';
      
      if (errorMsg.includes('expired') || errorMsg.includes('Invalid')) {
        Alert.alert(
          'Invitation Error',
          'This invitation link has expired or is invalid. Please request a new invitation.'
        );
      } else if (errorMsg.includes('already exists')) {
        Alert.alert(
          'Account Exists',
          'An account with this email already exists. Please login instead.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdmin = () => {
    Linking.openURL('mailto:support@icreationsglobal.com?subject=Account Access Request');
  };

  if (fetchingInvite) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading invitation details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}>
          <View style={styles.content}>
            <View style={styles.headerSection}>
<<<<<<< HEAD
=======
              <Image
                source={require('../../../assets/AppLogo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
>>>>>>> origin/master
              <Text variant="headlineMedium" style={styles.errorTitle}>
                Invitation Error
              </Text>
              <Text variant="bodyLarge" style={styles.errorText}>
                {error}
              </Text>
              <Button
                mode="contained"
                onPress={handleContactAdmin}
                style={styles.button}
<<<<<<< HEAD
                buttonColor={theme.colors.shipeaseOrange}
=======
                buttonColor={theme.colors.bestdealOrange}
>>>>>>> origin/master
              >
                Contact Administrator
              </Button>
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
      </View>
    );
  }

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
            <Image
              source={require('../../../assets/AppLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text variant="displaySmall" style={styles.title}>
              Welcome to the Team!
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Complete your account setup to get started
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <TextInput
              label="Email Address"
              value={inviteInfo?.email || ''}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              disabled
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
              backgroundColor="#ffffff"
            />

            <TextInput
              label="Full Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
              backgroundColor="#ffffff"
            />

            <TextInput
              label="Password *"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              helperText="Minimum 6 characters"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
              backgroundColor="#ffffff"
            />

            <TextInput
              label="Confirm Password *"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
              backgroundColor="#ffffff"
            />

            <Button
              mode="contained"
              onPress={handleAcceptInvite}
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
              Create Account & Get Started
            </Button>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Already have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.linkButton}
            >
              Sign In
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.text,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  errorTitle: {
    fontWeight: 'bold',
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 24,
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
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 16,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: theme.colors.text,
  },
  linkButton: {
    marginLeft: -8,
  },
});


