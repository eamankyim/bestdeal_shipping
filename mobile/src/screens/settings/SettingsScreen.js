import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  List,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { standardStyles, theme, spacing, touchTargets } from '../../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../../utils/logger';

export default function SettingsScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage except auth token
              const keys = await AsyncStorage.getAllKeys();
              const authKeys = keys.filter(
                (key) => !key.includes('auth') && !key.includes('token')
              );
              await AsyncStorage.multiRemove(authKeys);
              Alert.alert('Success', 'Cache cleared successfully');
              logger.info('Cache cleared');
            } catch (error) {
              logger.error('Failed to clear cache', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
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
              Notifications
            </Text>
            <List.Item
              title="Push Notifications"
              description="Receive notifications about job updates"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Email Notifications"
              description="Receive email updates"
              left={(props) => <List.Icon {...props} icon="email" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Location
            </Text>
            <List.Item
              title="Location Tracking"
              description="Allow app to track your location"
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              right={() => (
                <Switch
                  value={locationTracking}
                  onValueChange={setLocationTracking}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Data & Storage
            </Text>
            <Button
              mode="outlined"
              onPress={handleClearCache}
              style={styles.button}
              icon="delete"
            >
              Clear Cache
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            <List.Item
              title="App Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            <Divider />
            <List.Item
              title="User Role"
              description={user?.role || 'N/A'}
              left={(props) => <List.Icon {...props} icon="account" />}
            />
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
    marginBottom: spacing.md,
    ...standardStyles,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: spacing.md,
    color: theme.colors.text,
  },
  button: {
    marginBottom: spacing.sm,
    minHeight: touchTargets.buttonHeight,
  },
});

