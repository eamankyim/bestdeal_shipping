import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Avatar,
  List,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { standardStyles, theme, spacing, touchTargets } from '../../theme/theme';

export default function ProfileScreen({ navigation }) {
  const { user, signOut, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              await signOut();
            }
          },
        },
      ]
    );
  };

  const refreshUserData = async () => {
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();
      if (response.success) {
        await updateUser(response.data.user);
        Alert.alert('Success', 'Profile updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      {/* Profile Header - WhatsApp Style */}
      <View style={styles.profileHeader}>
        <Avatar.Text
          size={100}
          label={user?.name?.charAt(0).toUpperCase() || 'U'}
          style={styles.avatar}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.name || 'User'}
        </Text>
        <Text variant="bodyMedium" style={styles.status}>
          {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}
        </Text>
      </View>

      {/* Menu Items - WhatsApp Style */}
      <View style={styles.menuSection}>
        {/* Account Info */}
        <View style={styles.menuGroup}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="person-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
          <Divider style={styles.divider} />
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Ionicons name="lock-closed-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.menuGroup}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>

        {/* Management - Role Based */}
        {(user?.role === 'admin' || user?.role === 'customer-service') && (
          <View style={styles.menuGroup}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Customers')}
            >
              <Ionicons name="people-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Customers</Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
          </View>
        )}

        {/* Batch Management */}
        {(user?.role === 'admin' || user?.role === 'warehouse_staff') && (
          <View style={styles.menuGroup}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('BatchJobs')}
            >
              <Ionicons name="cube-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Batch Jobs</Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
            <Divider style={styles.divider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('CreateBatch')}
            >
              <Ionicons name="add-circle-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Create Batch</Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
          </View>
        )}

        {/* Finance */}
        {(user?.role === 'admin' || user?.role === 'finance') && (
          <View style={styles.menuGroup}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Invoices')}
            >
              <Ionicons name="document-text-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Invoices</Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
            <Divider style={styles.divider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Reports')}
            >
              <Ionicons name="bar-chart-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Reports</Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Features */}
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <View style={styles.menuGroup}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('TeamMembers')}
            >
              <Ionicons name="people-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Team Members</Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
            <Divider style={styles.divider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('InviteManagement')}
            >
              <Ionicons name="mail-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Invite Management</Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
            <Divider style={styles.divider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('RoleManagement')}
            >
              <Ionicons name="shield-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Role Management</Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
            <Divider style={styles.divider} />
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('OrganisationSettings')}
            >
              <Ionicons name="business-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Organisation Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
          </View>
        )}

        {/* Help & Support */}
        <View style={styles.menuGroup}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Help & Support', 'Contact support at support@shipease.com')}
          >
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.text} style={styles.menuIcon} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.menuGroup}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#ff4d4f" style={styles.menuIcon} />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>ShipEASE Shipping App v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: spacing.md,
  },
  name: {
    fontWeight: '600',
    fontSize: 22,
    marginBottom: spacing.xs,
    color: theme.colors.text,
  },
  status: {
    color: theme.colors.placeholder,
    fontSize: 15,
  },
  menuSection: {
    paddingTop: spacing.md,
  },
  menuGroup: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: touchTargets.listItemHeight,
  },
  menuIcon: {
    marginRight: spacing.md,
    width: 28,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  logoutText: {
    color: '#ff4d4f',
  },
  divider: {
    marginLeft: spacing.md + 28, // Align with text (icon width + margin)
    backgroundColor: theme.colors.divider,
  },
  version: {
    textAlign: 'center',
    color: theme.colors.placeholder,
    fontSize: 12,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
});



