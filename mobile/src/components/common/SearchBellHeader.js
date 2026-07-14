import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { spacing } from '../../theme/theme';
import AppSearchBar from './AppSearchBar';
import NotificationBellButton from './NotificationBellButton';

export default function SearchBellHeader({
  topInset = 0,
  placeholder = 'Search...',
  value,
  onChangeText,
  onNotificationPress,
  style,
}) {
  const navigation = useNavigation();

  const handleNotificationPress = useCallback(() => {
    if (onNotificationPress) {
      onNotificationPress();
      return;
    }
    // navigate (not push) so tapping again while already on Notifications
    // focuses the existing screen instead of stacking duplicates
    navigation.navigate('Notifications');
  }, [navigation, onNotificationPress]);

  return (
    <View style={[styles.header, { paddingTop: topInset }, style]}>
      <View style={styles.searchWrap}>
        <AppSearchBar
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
      <NotificationBellButton
        style={styles.notificationBtn}
        onPress={handleNotificationPress}
      />
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
