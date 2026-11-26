import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { format } from 'date-fns';
import AuthImage from '../common/AuthImage';

const GROUPS = [
  { type: 'proof_of_delivery', title: 'Delivery Photos' },
  { type: 'photo', title: 'Collection & Status Photos' },
];

/** Photos taken on collection and delivery, so everyone can see what was sent. */
export default function JobPhotos({ documents = [] }) {
  return GROUPS.map(({ type, title }) => {
    const photos = documents.filter((doc) => doc.documentType === type && (doc.mimeType || '').startsWith('image/'));
    if (!photos.length) return null;
    return (
      <View key={type} style={styles.group}>
        <Text variant="titleMedium" style={styles.title}>{title}</Text>
        <View style={styles.row}>
          {photos.map((photo) => (
            <View key={photo.id}>
              <AuthImage path={`/jobs/documents/${photo.id}`} />
              <Text variant="bodySmall" style={styles.muted}>{photo.uploader?.name || ''}</Text>
              <Text variant="bodySmall" style={styles.muted}>{format(new Date(photo.uploadedAt), 'MMM dd')}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  });
}

const styles = StyleSheet.create({
  group: { marginBottom: 16 },
  title: { fontWeight: '600', fontSize: 15, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  muted: { color: '#8c8c8c', fontSize: 11 },
});
