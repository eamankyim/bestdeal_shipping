import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { spacing, touchTargets, typography } from '../../theme/theme';

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const displayRole = (user?.role || 'user').replace('-', ' ');

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
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
    ]);
  };

  const adminItems = [
    { icon: 'people-outline', title: 'Team Members', route: 'TeamMembers' },
    { icon: 'mail-outline', title: 'Invite Management', route: 'InviteManagement' },
    { icon: 'shield-outline', title: 'Role Management', route: 'RoleManagement' },
    { icon: 'business-outline', title: 'Organisation Settings', route: 'OrganisationSettings' },
  ];

  const managementItems = [
    { icon: 'people-outline', title: 'Customers', route: 'Customers' },
    { icon: 'cube-outline', title: 'Batch Jobs', route: 'BatchJobs' },
    { icon: 'add-circle-outline', title: 'Create Batch', route: 'CreateBatch' },
  ];

  const moreItems = [
    { icon: 'document-text-outline', title: 'Invoices', route: 'Invoices' },
    { icon: 'bar-chart-outline', title: 'Reports', route: 'Reports' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 110 }}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Account</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={18} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <Avatar.Text
            size={50}
            label={user?.name?.charAt(0)?.toUpperCase() || 'A'}
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name || 'Admin User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'admin@bestdeal.com'}</Text>
            <View style={styles.roleRow}>
              <Ionicons name="star" size={11} color="#fff2cf" />
              <Ionicons name="star" size={11} color="#fff2cf" />
              <Ionicons name="star" size={11} color="#fff2cf" />
              <Text style={styles.profileRole}>({displayRole})</Text>
            </View>
          </View>
        </View>

        <Text style={styles.groupTitle}>Manage Account</Text>
        <View style={styles.groupCard}>
          <MenuItem icon="person-outline" title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <MenuItem icon="lock-closed-outline" title="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
          <MenuItem icon="settings-outline" title="Settings" onPress={() => navigation.navigate('Settings')} noBorder />
        </View>

        <Text style={styles.groupTitle}>Management</Text>
        <View style={styles.groupCard}>
          {managementItems.map((item, idx) => (
            <MenuItem
              key={item.title}
              icon={item.icon}
              title={item.title}
              onPress={() => navigation.navigate(item.route)}
              noBorder={idx === managementItems.length - 1}
            />
          ))}
        </View>

        <Text style={styles.groupTitle}>More</Text>
        <View style={styles.groupCard}>
          {moreItems.map((item, idx) => (
            <MenuItem
              key={item.title}
              icon={item.icon}
              title={item.title}
              onPress={() => navigation.navigate(item.route)}
              noBorder={idx === moreItems.length - 1}
            />
          ))}
        </View>

        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <>
            <Text style={styles.groupTitle}>Business</Text>
            <View style={styles.groupCard}>
              {adminItems.map((item, idx) => (
                <MenuItem
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  onPress={() => navigation.navigate(item.route)}
                  noBorder={idx === adminItems.length - 1}
                />
              ))}
            </View>
          </>
        )}

        <Text style={styles.groupTitle}>Support</Text>
        <View style={styles.groupCard}>
          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => Alert.alert('Help & Support', 'Contact support at support@bestdeal.com')}
          />
          <MenuItem
            icon="mail-outline"
            title="Contact Administrator"
            onPress={() => Alert.alert('Contact Admin', 'Send an email to admin@bestdeal.com')}
            noBorder
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#d64545" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>BestDeal Shipping App v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, title, onPress, noBorder = false }) {
  return (
    <TouchableOpacity style={[styles.menuItem, noBorder && styles.noBorder]} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name={icon} size={18} color="#222" style={styles.menuIcon} />
      <Text style={styles.menuText}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color="#bfbfbf" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: '#111',
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#ff9800',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    backgroundColor: '#f6f6f6',
  },
  avatarLabel: {
    color: '#222',
    fontWeight: '700',
  },
  profileName: {
    color: '#fff',
    fontSize: typography.md,
    fontWeight: '700',
  },
  profileEmail: {
    marginTop: 2,
    color: '#fff6ea',
    fontSize: typography.xs,
  },
  profileRole: {
    marginTop: 1,
    color: '#fff6ea',
    fontSize: typography.xs,
    textTransform: 'capitalize',
  },
  roleRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  groupTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: typography.xs,
    color: '#777',
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f2f2f2',
    marginBottom: 10,
  },
  menuItem: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuText: {
    flex: 1,
    fontSize: typography.sm,
    color: '#1e1e1e',
    fontWeight: '500',
  },
  logoutBtn: {
    marginTop: 8,
    minHeight: touchTargets.buttonHeight,
    borderRadius: 10,
    backgroundColor: '#fff2f2',
    borderWidth: 1,
    borderColor: '#fde6e6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoutText: {
    color: '#d64545',
    fontSize: typography.sm,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    color: '#9b9b9b',
    fontSize: typography.xs,
    marginTop: spacing.md,
  },
});
