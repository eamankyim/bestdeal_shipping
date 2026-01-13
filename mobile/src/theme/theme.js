import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#ff9800', // Orange (changed from dark blue)
    secondary: '#ff9800', // Orange
    accent: '#ff9800', // Orange
    error: '#ff4d4f',
    success: '#52c41a',
    warning: '#faad14',
    info: '#ff9800', // Orange (changed from dark blue)
    background: '#f8f9fa', // Softer background
    surface: '#ffffff',
    text: '#1a1a1a', // Darker for better readability
    disabled: '#d9d9d9',
    placeholder: '#8c8c8c',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    // Custom colors for ShipEASE
    shipeaseBlue: '#003d82', // Only for splash screen background
    shipeaseOrange: '#ff9800',
    inputBorder: '#e0e0e0', // Softer border
    inputBorderFocus: '#ff9800',
    // Standard border color (light grey)
    border: '#e0e0e0',
    // Additional mobile-friendly colors
    cardBackground: '#ffffff',
    divider: '#f0f0f0',
    sectionBackground: '#ffffff',
  },
  roundness: 8, // 8px border radius for all components (consistent throughout app)
  // Disable shadows globally - all elevation levels set to 0
  elevation: {
    level0: 0,
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
  },
};

// Mobile-optimized spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Touch target sizes (minimum 44px for accessibility)
export const touchTargets = {
  minHeight: 44,
  buttonHeight: 48,
  listItemHeight: 72,
};

// Standard styling constants
export const standardStyles = {
  borderRadius: 8, // Consistent 8px border radius (not fully curved/pill-shaped)
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.cardBackground,
  // No shadows
  shadowOpacity: 0,
  elevation: 0,
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowRadius: 0,
};

// Standard button styles - consistent 8px border radius
export const buttonStyles = {
  borderRadius: 8, // Consistent 8px (not fully curved)
  minHeight: touchTargets.buttonHeight,
};

// Standard input styles - consistent 8px border radius, white background, light grey border
export const inputStyles = {
  borderRadius: 8, // Consistent 8px (not fully curved)
  backgroundColor: '#ffffff', // White background
  outlineColor: '#e0e0e0', // Light grey border
  activeOutlineColor: '#ff9800', // Orange when focused
};

export const statusColors = {
  'Pending Collection': '#faad14',
  'Assigned': '#ff9800', // Orange (changed from dark blue)
  'En Route to Customer': '#722ed1',
  'Collected': '#13c2c2',
  'Collection Failed': '#ff4d4f',
  'Returning to Warehouse': '#eb2f96',
  'At Warehouse': '#52c41a',
  'Batched': '#ff9800', // Orange (changed from blue)
  'Shipped': '#ff9800', // Orange (changed from blue)
  'Arrived at Destination': '#389e0d',
  'Ready for Delivery': '#52c41a',
  'Out for Delivery': '#d48806',
  'Delivered': '#52c41a',
  'Draft': '#8c8c8c',
};



