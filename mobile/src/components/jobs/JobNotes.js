import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { format } from 'date-fns';
import { jobService } from '../../services/jobService';

/** Internal staff notes on a job, with a box to add one. */
export default function JobNotes({ jobId, notes = [], onAdded }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    try {
      await jobService.addNote(jobId, note.trim());
      setNote('');
      onAdded?.();
    } catch (error) {
      Alert.alert('Could not add note', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <TextInput
        mode="outlined"
        label="Add a note"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={5000}
        style={styles.input}
      />
      <Text variant="bodySmall" style={styles.muted}>Visible to staff only.</Text>
      <Button mode="contained" icon="note-plus" onPress={add} loading={busy} disabled={busy || !note.trim()} style={styles.button}>
        Add Note
      </Button>
      {notes.map((item) => (
        <View key={item.id} style={styles.note}>
          <Text variant="bodyMedium">{item.note}</Text>
          <Text variant="bodySmall" style={styles.muted}>
            {item.author?.name || 'Unknown'} · {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: '#fff' },
  button: { marginVertical: 8 },
  note: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginTop: 8 },
  muted: { color: '#8c8c8c', marginTop: 4 },
});
