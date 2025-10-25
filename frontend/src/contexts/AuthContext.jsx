import React, { createContext, useContext, useState, useEffect } from 'react';
import config from '../config/env';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem(config.storage.userKey);
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem(config.storage.userKey);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('🌐 API URL:', config.api.fullUrl);
      
      const response = await authAPI.login(email, password);
      
      console.log('📥 Login response:', response);
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        
        console.log('✅ Login successful for user:', user.name);
        console.log('🎯 User role:', user.role);
        
        // Store user data and tokens
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem(config.storage.userKey, JSON.stringify(user));
        localStorage.setItem(config.storage.tokenKey, token);
        
        if (refreshToken) {
          localStorage.setItem('shipease_refresh_token', refreshToken);
        }
        
        console.log('💾 User data and tokens stored in localStorage');
        
        return { success: true, user };
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      const refreshToken = localStorage.getItem('shipease_refresh_token');
      if (refreshToken) {
        await authAPI.logout({ refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local state and storage
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem(config.storage.userKey);
      localStorage.removeItem(config.storage.tokenKey);
      localStorage.removeItem('shipease_refresh_token');
    }
  };

  // Admin function to send invites
  const sendInvite = async (inviteData) => {
    try {
      console.log('📧 AuthContext: Sending invite', inviteData);
      const response = await authAPI.sendInvite(inviteData);
      console.log('✅ AuthContext: Invite response', response);
      return response;
    } catch (error) {
      console.error('❌ AuthContext: Invite error', error);
      throw error;
    }
  };

  // Function to accept invite and create user account
  const acceptInvite = async (token, userData) => {
    try {
      console.log('📧 AuthContext: Accepting invite with token:', token);
      const response = await authAPI.acceptInvite(token, userData);
      console.log('✅ AuthContext: Invite accepted', response);
      return response;
    } catch (error) {
      console.error('❌ AuthContext: Accept invite error', error);
      throw error;
    }
  };

  // Helper function to get permissions for a role
  const getPermissionsForRole = (role) => {
    switch (role) {
      case 'admin':
        return ['all'];
      case 'driver':
        return ['driver-dashboard', 'collection-confirmation'];
      case 'warehouse':
        return ['warehouse-dashboard', 'inventory-management'];
      case 'delivery-agent':
        return ['delivery-dashboard', 'delivery-confirmation'];
      case 'finance':
        return ['finance-dashboard', 'invoice-management', 'payment-tracking'];
      case 'customer-service':
        return ['customer-dashboard', 'customer-support', 'track-shipments'];
      default:
        return ['basic-access'];
    }
  };

  const updateProfile = async (updates) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem(config.storage.userKey, JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      
      if (response.success && response.data) {
        const updatedUser = response.data.user;
        setCurrentUser(updatedUser);
        localStorage.setItem(config.storage.userKey, JSON.stringify(updatedUser));
        console.log('✅ User data refreshed');
        return { success: true, user: updatedUser };
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    return currentUser.permissions?.includes('all') || currentUser.permissions?.includes(permission);
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
    sendInvite,
    acceptInvite,
    pendingInvites,
    updateProfile,
    refreshUser,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
