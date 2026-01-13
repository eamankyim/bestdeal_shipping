import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';
import CreateJobScreen from '../screens/jobs/CreateJobScreen';
import MapScreen from '../screens/map/MapScreen';
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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function JobsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="JobsList" 
        component={JobsScreen}
        options={{ title: 'Jobs' }}
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
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();
  const isDriver = user?.role === 'driver';
  const isDeliveryAgent = user?.role === 'delivery_agent';
  const isWarehouseStaff = user?.role === 'warehouse_staff';

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
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff9800', // Orange
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Jobs" component={JobsStack} />
      {(isDriver || isDeliveryAgent) && (
        <Tab.Screen name="Map" component={MapScreen} />
      )}
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



