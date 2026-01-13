import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';
import { standardStyles, theme, spacing } from '../../theme/theme';
import logger from '../../utils/logger';

export default function RoleManagementScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await authService.getRoles();
      if (response.success && response.data?.roles) {
        setRoles(response.data.roles);
      }
    } catch (error) {
      logger.error('Failed to load roles', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRoles();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Role Management
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              View all available roles and their permissions.
            </Text>
          </Card.Content>
        </Card>

        {roles.length === 0 ? (
          <Card style={styles.card} elevation={0}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No roles found
              </Text>
            </Card.Content>
          </Card>
        ) : (
          roles.map((role) => (
            <Card key={role.id} style={styles.card} elevation={0}>
              <Card.Content>
                <Text variant="titleMedium">{role.displayName || role.name}</Text>
                <Text variant="bodySmall" style={styles.description}>
                  {role.description || 'No description'}
                </Text>
                <Chip style={styles.chip}>
                  {role.userCount || 0} users
                </Chip>
              </Card.Content>
            </Card>
          ))
        )}
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
    marginBottom: spacing.sm,
    color: theme.colors.text,
  },
  description: {
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  chip: {
    marginTop: spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.text,
  },
});

