import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { standardStyles, theme, spacing, touchTargets, typography } from '../../theme/theme';
import logger from '../../utils/logger';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await authService.updateProfile({
        name,
        phone: phone || null,
      });
      if (response.success) {
        const updatedUser = response?.data?.user || response?.user || null;
        if (updatedUser) {
          await updateUser(updatedUser);
        }
        Alert.alert('Success', 'Profile updated successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      logger.error('Failed to update profile', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      <View style={styles.content}>
        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Edit Profile
            </Text>
            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              disabled={loading}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              placeholder="Email"
              value={user?.email || ''}
              mode="outlined"
              style={styles.input}
              disabled
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              disabled={loading}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              placeholder="Role"
              value={user?.role || ''}
              mode="outlined"
              style={styles.input}
              disabled
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
              placeholderTextColor={theme.colors.placeholder}
            />
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Save Changes
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Cancel
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    ...standardStyles,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: typography.md,
    marginBottom: spacing.md,
    color: theme.colors.text,
  },
  input: {
    marginBottom: spacing.md,
    borderRadius: 8, // Consistent 8px border radius
    ...standardStyles,
  },
  button: {
    marginBottom: spacing.sm,
    minHeight: touchTargets.buttonHeight,
    borderRadius: 8, // Consistent 8px border radius (not fully curved)
  },
  buttonContent: {
    minHeight: touchTargets.buttonHeight,
  },
  buttonLabel: {
    fontSize: typography.button,
    fontWeight: '600',
  },
});

