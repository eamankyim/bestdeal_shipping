import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';
import CreateJobScreen from '../screens/jobs/CreateJobScreen';
import CameraScreen from '../screens/camera/CameraScreen';
import BatchJobsScreen from '../screens/batches/BatchJobsScreen';
import CreateBatchScreen from '../screens/batches/CreateBatchScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import InvoicesScreen from '../screens/invoices/InvoicesScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import TeamMembersScreen from '../screens/admin/TeamMembersScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import InviteManagementScreen from '../screens/admin/InviteManagementScreen';
import RoleManagementScreen from '../screens/admin/RoleManagementScreen';
import OrganisationSettingsScreen from '../screens/admin/OrganisationSettingsScreen';
import CustomerMessagesScreen from '../screens/admin/CustomerMessagesScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

import EditUserScreen from '../screens/admin/EditUserScreen';
import TrackingScreen from '../screens/tracking/TrackingScreen';

import InvoiceDetailScreen from '../screens/invoices/InvoiceDetailScreen';

import BatchesScreen from '../screens/batches/BatchesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function JobsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="JobsList" 
        component={JobsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="JobDetail" 
        component={JobDetailScreen}
        options={{ title: 'Job Details' }}
      />
      <Stack.Screen 
        name="CreateJob" 
        component={CreateJobScreen}
        options={{ title: 'Create Job' }}
      />
    </Stack.Navigator>
  );
}

function AccountStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AccountMain" 
        component={ProfileScreen}
        options={{ title: 'Account' }}
      />
      <Stack.Screen 
        name="BatchJobs" 
        component={BatchJobsScreen}
        options={{ title: 'Batch Jobs' }}
      />
      <Stack.Screen 
        name="CreateBatch" 
        component={CreateBatchScreen}
        options={{ title: 'Create Batch' }}
      />
      <Stack.Screen 
        name="Invoices" 
        component={InvoicesScreen}
        options={{ title: 'Invoice Management' }}
      />
      <Stack.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen name="Batches" component={BatchesScreen} options={{ title: "Batches" }} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: "Invoice" }} />
      <Stack.Screen name="EditUser" component={EditUserScreen} options={{ title: "Edit Member" }} />
      <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: "Track Shipment" }} />
      <Stack.Screen 
        name="TeamMembers" 
        component={TeamMembersScreen}
        options={{ title: 'Team Members' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Stack.Screen 
        name="InviteManagement" 
        component={InviteManagementScreen}
        options={{ title: 'Invite Management' }}
      />
      <Stack.Screen 
        name="RoleManagement" 
        component={RoleManagementScreen}
        options={{ title: 'Role Management' }}
      />
      <Stack.Screen 
        name="OrganisationSettings" 
        component={OrganisationSettingsScreen}
        options={{ title: 'Organisation Settings' }}
      />
      <Stack.Screen
        name="CustomerMessages"
        component={CustomerMessagesScreen}
        options={{ title: 'Customer Messages' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  // Android's safe-area bottom inset often under-reports the space taken by
  // gesture/nav bars, so pad generously beyond it; iOS's inset is reliable.
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 12) + 20 : Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Customers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff9800', // Orange
        tabBarInactiveTintColor: '#7b7b7b',
        tabBarStyle: {
          height: 60 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Jobs" component={JobsStack} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Account" component={AccountStack} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          presentation: 'card',
          title: 'Notifications',
        }}
      />
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{ 
          presentation: 'modal',
          title: 'Camera' 
        }}
      />
    </Stack.Navigator>
  );
}



