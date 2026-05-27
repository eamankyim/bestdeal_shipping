import React from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { standardStyles, theme, spacing } from '../../theme/theme';

export default function AppSearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  style,
  iconColor = '#777',
  withBottomMargin = false,
}) {
  return (
    <Searchbar
      placeholder={placeholder}
      onChangeText={onChangeText}
      value={value}
      style={[styles.searchbar, withBottomMargin && styles.withBottomMargin, style]}
      iconColor={iconColor}
      inputStyle={styles.inputText}
      contentStyle={styles.contentStyle}
      elevation={0}
    />
  );
}

const styles = StyleSheet.create({
  searchbar: {
    ...standardStyles,
    borderRadius: 12,
    height: 40,
    minHeight: 40,
    maxHeight: 40,
    backgroundColor: '#ffffff',
    shadowOpacity: 0,
    elevation: 0,
    paddingVertical: 0,
  },
  withBottomMargin: {
    marginBottom: spacing.sm,
  },
  contentStyle: {
    minHeight: 40,
    maxHeight: 40,
    height: 40,
    paddingVertical: 0,
  },
  inputText: {
    color: theme.colors.text,
    minHeight: 0,
    paddingVertical: 0,
  },
});

