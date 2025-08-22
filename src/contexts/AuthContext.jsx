import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Mock user data for demo purposes (internal users only)
  const mockUsers = [
    {
      id: 1,
      email: 'admin@shipease.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      avatar: null, // No avatar to test initials
      permissions: ['all'],
      status: 'active',
      invitedBy: null,
      invitedAt: null,
      onboardedAt: '2024-01-01'
    },
    {
      id: 2,
      email: 'driver@shipease.com',
      password: 'driver123',
      name: 'John Driver',
      role: 'driver',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=driver',
      permissions: ['driver-dashboard', 'collection-confirmation'],
      status: 'active',
      invitedBy: 'admin@shipease.com',
      invitedAt: '2024-01-05',
      onboardedAt: '2024-01-06'
    },
    {
      id: 3,
      email: 'warehouse@shipease.com',
      password: 'warehouse123',
      name: 'Sarah Warehouse',
      role: 'warehouse',
      avatar: null, // No avatar to test initials
      permissions: ['warehouse-dashboard', 'inventory-management'],
      status: 'active',
      invitedBy: 'admin@shipease.com',
      invitedAt: '2024-01-03',
      onboardedAt: '2024-01-04'
    },
    {
      id: 4,
      email: 'delivery@shipease.com',
      password: 'delivery123',
      name: 'Mike Delivery',
      role: 'delivery-agent',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=delivery',
      permissions: ['delivery-dashboard', 'delivery-confirmation'],
      status: 'active',
      invitedBy: 'admin@shipease.com',
      invitedAt: '2024-01-02',
      onboardedAt: '2024-01-03'
    },
    {
      id: 5,
      email: 'finance@shipease.com',
      password: 'finance123',
      name: 'Emma',
      role: 'finance',
      avatar: null, // Single name to test initials
      permissions: ['finance-dashboard', 'invoice-management'],
      status: 'active',
      invitedBy: 'admin@shipease.com',
      invitedAt: '2024-01-01',
      onboardedAt: '2024-01-02'
    }
  ];

  // Mock pending invites
  const [pendingInvites, setPendingInvites] = useState([
    {
      id: 'invite_001',
      email: 'newdriver@shipease.com',
      role: 'driver',
      invitedBy: 'admin@shipease.com',
      invitedAt: '2024-01-20',
      expiresAt: '2024-01-27',
      status: 'pending'
    },
    {
      id: 'invite_002',
      email: 'accountant@shipease.com',
      role: 'finance',
      invitedBy: 'admin@shipease.com',
      invitedAt: '2024-01-19',
      expiresAt: '2024-01-26',
      status: 'pending'
    }
  ]);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('shipease_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('shipease_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in mock data
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Remove password from user object before storing
        const { password: _, ...userWithoutPassword } = user;
        
        // Set user in state and localStorage
        setCurrentUser(userWithoutPassword);
        setIsAuthenticated(true);
        localStorage.setItem('shipease_user', JSON.stringify(userWithoutPassword));
        
        return { success: true, user: userWithoutPassword };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('shipease_user');
  };

  // Admin function to send invites
  const sendInvite = async (inviteData) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === inviteData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Check if invite already exists
      const existingInvite = pendingInvites.find(inv => inv.email === inviteData.email);
      if (existingInvite) {
        throw new Error('Invite already sent to this email');
      }
      
      // Create new invite
      const newInvite = {
        id: `invite_${Date.now()}`,
        email: inviteData.email,
        role: inviteData.role,
        invitedBy: currentUser?.email || 'admin@shipease.com',
        invitedAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
        status: 'pending'
      };
      
      // Add to pending invites
      setPendingInvites(prev => [...prev, newInvite]);
      
      // In real app, this would send an email
      console.log('Invite sent:', newInvite);
      
      return { success: true, invite: newInvite };
    } catch (error) {
      throw error;
    }
  };

  // Function to accept invite and create user account
  const acceptInvite = async (inviteId, userData) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the invite
      const invite = pendingInvites.find(inv => inv.id === inviteId);
      if (!invite) {
        throw new Error('Invite not found or expired');
      }
      
      // Check if invite is expired
      if (new Date(invite.expiresAt) < new Date()) {
        throw new Error('Invite has expired');
      }
      
      // Create new user
      const newUser = {
        id: mockUsers.length + 1,
        email: invite.email,
        password: userData.password,
        name: userData.name,
        role: invite.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`,
        permissions: getPermissionsForRole(invite.role),
        status: 'active',
        invitedBy: invite.invitedBy,
        invitedAt: invite.invitedAt,
        onboardedAt: new Date().toISOString().split('T')[0]
      };
      
      // Remove invite from pending list
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
      
      // In real app, this would add the user to the database
      console.log('User created from invite:', newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
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
      localStorage.setItem('shipease_user', JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      throw error;
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    return currentUser.permissions.includes('all') || currentUser.permissions.includes(permission);
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
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
