import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Switch, Text, TextInput } from 'react-native-paper';
import ThreeDotsLoader from '../../components/common/ThreeDotsLoader';
import { settingsService } from '../../services/settingsService';

/** Admins choose which SMS and emails customers get at each stage, and what they say. */
export default function CustomerMessagesScreen() {
  const [messages, setMessages] = useState(null);
  const [placeholders, setPlaceholders] = useState([]);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [smsProblem, setSmsProblem] = useState(null);
  const [openKey, setOpenKey] = useState(null);
  const [dirty, setDirty] = useState([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null);

  const load = useCallback(async () => {
    setFailed(null);
    try {
      const { data } = await settingsService.getCustomerMessages();
      setMessages(data.messages);
      setPlaceholders(data.placeholders);
      setEmailConfigured(data.emailConfigured);
      setSmsProblem(data.smsReady ? null : data.smsProblem);
      setDirty([]);
    } catch (error) {
      setFailed(error.response?.data?.message || 'Could not load customer messages');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const change = (key, changes) => {
    setMessages((current) => current.map((item) => (item.key === key ? { ...item, ...changes } : item)));
    setDirty((current) => (current.includes(key) ? current : [...current, key]));
  };

  const save = async () => {
    setBusy(true);
    try {
      const { data } = await settingsService.updateCustomerMessages(
        messages
          .filter((item) => dirty.includes(item.key))
          .map(({ key, enabled, subject, body, smsEnabled, smsBody }) => ({ key, enabled, subject, body, smsEnabled, smsBody }))
      );
      setMessages(data.messages);
      setDirty([]);
      Alert.alert('Saved', 'Customer messages saved.');
    } catch (error) {
      Alert.alert('Could not save', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  if (failed) {
    return (
      <View style={styles.center}>
        <Text>{failed}</Text>
        <Button onPress={load}>Retry</Button>
      </View>
    );
  }
  if (!messages) return <ThreeDotsLoader style={{ marginTop: 40 }} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.muted}>
          Choose which stages send the customer an SMS or an email, and write each one in your own words.
        </Text>
        {smsProblem && (
          <Text style={styles.warning}>No SMS will be sent yet: {smsProblem}. SMS is set up on the website, under Settings.</Text>
        )}
        {!emailConfigured && (
          <Text style={styles.warning}>Email is not set up on the server, so no emails will be sent yet.</Text>
        )}
        <Text style={styles.muted}>You can use: {placeholders.map((item) => `{{${item.key}}}`).join('  ')}</Text>

        {messages.map((item) => (
          <Card key={item.key} style={styles.card} elevation={0}>
            <Card.Content>
              <Text variant="titleMedium" onPress={() => setOpenKey(openKey === item.key ? null : item.key)}>
                {item.label}{dirty.includes(item.key) ? ' *' : ''}
              </Text>
              <View style={styles.row}>
                <Text style={styles.channel}>SMS</Text>
                <Switch value={item.smsEnabled} onValueChange={(smsEnabled) => change(item.key, { smsEnabled })} />
                <Text style={[styles.channel, { marginLeft: 24 }]}>Email</Text>
                <Switch value={item.enabled} onValueChange={(enabled) => change(item.key, { enabled })} />
              </View>
              {openKey === item.key ? (
                <>
                  <TextInput mode="outlined" label="SMS text" value={item.smsBody} maxLength={459} multiline onChangeText={(smsBody) => change(item.key, { smsBody })} style={[styles.input, { minHeight: 90 }]} />
                  <Text style={styles.hint}>{item.smsBody.length} characters. Over 160 is charged as more than one SMS.</Text>
                  <TextInput mode="outlined" label="Email subject" value={item.subject} maxLength={200} onChangeText={(subject) => change(item.key, { subject })} style={styles.input} />
                  <TextInput mode="outlined" label="Email message" value={item.body} maxLength={5000} multiline onChangeText={(body) => change(item.key, { body })} style={[styles.input, { minHeight: 140 }]} />
                </>
              ) : (
                <Button compact onPress={() => setOpenKey(item.key)} style={{ alignSelf: 'flex-start' }}>Edit wording</Button>
              )}
            </Card.Content>
          </Card>
        ))}

        <Button mode="contained" onPress={save} loading={busy} disabled={busy || !dirty.length}>Save Changes</Button>
        <Button onPress={load} disabled={busy || !dirty.length}>Discard Changes</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  channel: { color: '#555', marginRight: 8 },
  hint: { color: '#7f7f7f', fontSize: 12, marginTop: 4 },
  input: { backgroundColor: '#fff', marginTop: 8 },
  muted: { color: '#7f7f7f', marginBottom: 12 },
  warning: { color: '#d46b08', marginBottom: 12 },
});
