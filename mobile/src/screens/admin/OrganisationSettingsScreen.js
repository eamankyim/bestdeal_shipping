import { authService } from '../../services/authService';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { standardStyles, theme, spacing, touchTargets, typography } from '../../theme/theme';

export default function OrganisationSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [companyName, setCompanyName] = useState('Best Deal');
  const [businessReg, setBusinessReg] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [address, setAddress] = useState('');

  const [busy, setBusy] = useState(false);
  useEffect(() => {
    authService.getOrganisation().then(result => {
      const data = result.data.organisation;
      setCompanyName(data.companyName || ''); setBusinessReg(data.businessReg || '');
      setVatNumber(data.vatNumber || ''); setAddress(data.address || '');
    }).catch(error => Alert.alert('Error', error.response?.data?.message || 'Unable to load settings'));
  }, []);
  const handleSave = async () => {
    setBusy(true);
    try {
      const result = await authService.updateOrganisation({ companyName, businessReg, vatNumber, address });
      if (!result.success) throw new Error(result.message);
      Alert.alert('Saved', result.message);
    } catch (error) { Alert.alert('Error', error.response?.data?.message || error.message); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      <View style={styles.content}>
        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Organisation Settings
            </Text>
            <TextInput
              placeholder="Company Name"
              value={companyName}
              onChangeText={setCompanyName}
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
            />
            <TextInput
              placeholder="Business Registration"
              value={businessReg}
              onChangeText={setBusinessReg}
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
            />
            <TextInput
              placeholder="VAT Number"
              value={vatNumber}
              onChangeText={setVatNumber}
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
            />
            <TextInput
              placeholder="Company Address"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
            />
            <Button
              mode="contained"
              onPress={handleSave}
              disabled={busy || !companyName.trim()}
              loading={busy}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Save Changes
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Cancel
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: spacing.md,
  },
  card: {
    ...standardStyles,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: typography.md,
    marginBottom: spacing.md,
    color: theme.colors.text,
  },
  input: {
    marginBottom: spacing.md,
    borderRadius: 8, // Consistent 8px border radius
    ...standardStyles,
  },
  button: {
    marginBottom: spacing.sm,
    minHeight: touchTargets.buttonHeight,
    borderRadius: 8, // Consistent 8px border radius (not fully curved)
  },
  buttonContent: {
    minHeight: touchTargets.buttonHeight,
  },
  buttonLabel: {
    fontSize: typography.button,
    fontWeight: '600',
  },
});

