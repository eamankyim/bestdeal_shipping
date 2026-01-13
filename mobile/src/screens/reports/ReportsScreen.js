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
  Button,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { standardStyles, theme, spacing, touchTargets } from '../../theme/theme';
import logger from '../../utils/logger';

export default function ReportsScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      // TODO: Implement reports API service
      logger.info('Loading reports');
      // Placeholder - will be implemented with actual API
      setReportData(null);
    } catch (error) {
      logger.error('Failed to load reports', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
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
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Report Overview
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              View analytics and reports for shipments, revenue, and performance metrics.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Available Reports
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                // TODO: Navigate to shipment volume report
              }}
              style={styles.reportButton}
              icon="chart-line"
            >
              Shipment Volume Report
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                // TODO: Navigate to revenue report
              }}
              style={styles.reportButton}
              icon="currency-usd"
            >
              Revenue Report
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                // TODO: Navigate to performance report
              }}
              style={styles.reportButton}
              icon="chart-bar"
            >
              Performance Metrics
            </Button>
          </Card.Content>
        </Card>

        {!reportData && (
          <Card style={styles.card} elevation={0}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No report data available
              </Text>
              <Text variant="bodySmall" style={styles.emptySubtext}>
                Reports will be generated here
              </Text>
            </Card.Content>
          </Card>
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
    marginBottom: spacing.sm,
    color: theme.colors.text,
  },
  description: {
    color: theme.colors.placeholder,
    marginBottom: spacing.sm,
  },
  reportButton: {
    marginBottom: spacing.sm,
    minHeight: touchTargets.buttonHeight,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    textAlign: 'center',
    color: theme.colors.placeholder,
  },
});

