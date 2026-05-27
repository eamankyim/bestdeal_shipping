import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../theme/theme';
import AppSearchBar from './AppSearchBar';
import NotificationBellButton from './NotificationBellButton';

export default function SearchBellHeader({
  topInset = 0,
  placeholder = 'Search...',
  value,
  onChangeText,
  style,
}) {
  return (
    <View style={[styles.header, { paddingTop: topInset }, style]}>
      <View style={styles.searchWrap}>
        <AppSearchBar
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
      <NotificationBellButton style={styles.notificationBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  searchWrap: {
    flex: 1,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efefef',
    backgroundColor: '#fff',
  },
});

