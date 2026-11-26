import useScreenRefresh from '../../hooks/useScreenRefresh';
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
  Button,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { standardStyles, theme, spacing, touchTargets } from '../../theme/theme';
import logger from '../../utils/logger';
import { dashboardService } from '../../services/dashboardService';
import ThreeDotsLoader from '../../components/common/ThreeDotsLoader';

export default function ReportsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [reportData, setReportData] = useState(null);



  const loadReports = async () => {
    try {
      setLoading(true);
      logger.info('Loading reports');
      const response = await dashboardService.getFinanceDashboard();
      const payload = response?.data || response || null;
      setReportData(payload);
    } catch (error) {
      logger.error('Failed to load reports', error);
      setReportData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useScreenRefresh(loadReports);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ThreeDotsLoader color={theme.colors.primary} />
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

        {reportData ? (
          <Card style={styles.card} elevation={0}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Finance Snapshot
              </Text>
              <Text variant="bodyMedium" style={styles.metricText}>
                Total Invoices: {reportData?.invoiceStats?.total || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.metricText}>
                Pending Invoices: {reportData?.invoiceStats?.pending || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.metricText}>
                Paid Invoices: {reportData?.invoiceStats?.paid || 0}
              </Text>
              <Text variant="bodyMedium" style={styles.metricText}>
                Total Revenue: GBP {Number(reportData?.revenueStats?.totalRevenue || 0).toFixed(2)}
              </Text>
              <Text variant="bodyMedium" style={styles.metricText}>
                Pending Revenue: GBP {Number(reportData?.revenueStats?.pendingRevenue || 0).toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Available Reports
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                navigation.navigate('Jobs', { screen: 'JobsList' });
              }}
              style={styles.reportButton}
              icon="chart-line"
            >
              Shipment Volume Report
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                navigation.navigate('Invoices');
              }}
              style={styles.reportButton}
              icon="currency-usd"
            >
              Revenue Report
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                setShowPerformance(value => !value);
              }}
              style={styles.reportButton}
              icon="chart-bar"
            >
              Performance Metrics
            </Button>
          </Card.Content>
        </Card>

        {showPerformance && reportData && <Card style={styles.card}><Card.Content>
          <Text variant="titleMedium">Payment Performance</Text>
          <Text>Paid invoices: {reportData.invoiceStats?.total ? Math.round(reportData.invoiceStats.paid / reportData.invoiceStats.total * 100) : 0}%</Text>
          <Text>This month: £{Number(reportData.monthlyRevenue?.total || 0).toFixed(2)} from {reportData.monthlyRevenue?.count || 0} payments</Text>
          <Text>Today's payments: {reportData.todayActivity?.payments || 0}</Text>
          <Text>Overdue invoices: {reportData.invoiceStats?.overdue || 0}</Text>
        </Card.Content></Card>}
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
  metricText: {
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
});

