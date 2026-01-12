import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  ActivityIndicator,
  Searchbar,
  Avatar,
  Chip,
  Button,
  List,
  Divider,
  FAB,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { standardStyles, theme, spacing, touchTargets } from '../../theme/theme';
import logger from '../../utils/logger';

export default function TeamMembersScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await authService.getUsers();
      if (response.success && response.data) {
        const users = Array.isArray(response.data) ? response.data : response.data.users || [];
        setTeamMembers(users);
      }
    } catch (error) {
      logger.error('Failed to load team members', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeamMembers();
  };

  const getRoleColor = (role) => {
    const colors = {
      superadmin: '#f44336',
      admin: '#ff9800', // Orange
      driver: '#ff9800',
      warehouse: '#4caf50',
      'delivery-agent': '#9c27b0',
      finance: '#ffc107',
      'customer-service': '#00bcd4',
    };
    return colors[role] || theme.colors.placeholder;
  };

  const filteredMembers = teamMembers.filter((member) =>
    member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: insets.top }]}>
        <Searchbar
          placeholder="Search team members..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredMembers.length === 0 ? (
          <Card style={styles.card} elevation={0}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No team members found
              </Text>
              <Text variant="bodySmall" style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Team members will appear here'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <TouchableOpacity
              key={member.id}
              onPress={() => {
                // TODO: Navigate to user details/edit screen
                if (user?.role === 'admin' || user?.role === 'superadmin') {
                  navigation.navigate('EditUser', { userId: member.id });
                }
              }}
            >
              <Card style={styles.card} elevation={0}>
                <Card.Content>
                  <List.Item
                    title={member.name || 'Unknown'}
                    description={member.email || 'No email'}
                    left={(props) => (
                      <Avatar.Text
                        size={48}
                        label={member.name?.charAt(0).toUpperCase() || 'U'}
                        style={{ backgroundColor: getRoleColor(member.role) }}
                      />
                    )}
                    right={() => (
                      <View style={styles.rightContent}>
                        <Chip
                          style={[
                            styles.roleChip,
                            { backgroundColor: getRoleColor(member.role) + '20' },
                          ]}
                          textStyle={{ color: getRoleColor(member.role), fontSize: 10 }}
                        >
                          {member.role?.toUpperCase()}
                        </Chip>
                        {member.warehouseLocation && (
                          <Chip
                            style={styles.locationChip}
                            textStyle={{ fontSize: 10 }}
                          >
                            {member.warehouseLocation}
                          </Chip>
                        )}
                      </View>
                    )}
                  />
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button for Invite */}
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => navigation.navigate('InviteManagement')}
        color="#ffffff"
        customSize={56}
        visible={user?.role === 'admin' || user?.role === 'superadmin'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: theme.colors.background,
  },
  searchbar: {
    ...standardStyles,
    elevation: 0,
    shadowOpacity: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Space for FAB
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...standardStyles,
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  roleChip: {
    height: 24,
  },
  locationChip: {
    height: 24,
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
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#ff9800',
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    zIndex: 1000,
  },
});

