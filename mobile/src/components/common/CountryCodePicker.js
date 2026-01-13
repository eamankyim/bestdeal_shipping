import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, TextInput, Text } from 'react-native-paper';
import { COUNTRY_CODES } from '../../config/countryCodes';

export default function CountryCodePicker({
  value,
  onValueChange,
  style,
}) {
  const [visible, setVisible] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customCode, setCustomCode] = useState('');

  const selectedCountry = COUNTRY_CODES.find(c => c.code === value) || null;

  const handleSelect = (code) => {
    if (code === 'Other') {
      setShowOtherInput(true);
      setVisible(false);
    } else {
      onValueChange(code);
      setVisible(false);
    }
  };

  const handleCustomSubmit = () => {
    if (customCode.trim()) {
      onValueChange(customCode.trim());
      setShowOtherInput(false);
      setCustomCode('');
    }
  };

  if (showOtherInput) {
    return (
      <View style={style}>
        <TextInput
          label="Country Code (Custom)"
          value={customCode}
          onChangeText={setCustomCode}
          mode="outlined"
          placeholder="+XXX"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <View style={styles.actions}>
          <Text
            variant="bodySmall"
            style={styles.cancel}
            onPress={() => {
              setShowOtherInput(false);
              setCustomCode('');
            }}
          >
            Cancel
          </Text>
          <Text
            variant="bodySmall"
            style={styles.save}
            onPress={handleCustomSubmit}
          >
            Save
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TextInput
            label="Country Code"
            value={selectedCountry ? `${selectedCountry.flag} ${selectedCountry.code}` : value || 'Select'}
            mode="outlined"
            editable={false}
            style={styles.codeInput}
            right={
              <TextInput.Icon
                icon="menu-down"
                onPress={() => setVisible(true)}
              />
            }
            onPress={() => setVisible(true)}
          />
        }
      >
        {COUNTRY_CODES.map((country) => (
          <Menu.Item
            key={country.code}
            onPress={() => handleSelect(country.code)}
            title={`${country.flag} ${country.code} (${country.country})`}
          />
        ))}
        <Menu.Item
          onPress={() => handleSelect('Other')}
          title="Other..."
        />
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  codeInput: {
    flex: 0,
    minWidth: 150,
    marginRight: 8,
    borderRadius: 8,
  },
  input: {
    marginBottom: 8,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  cancel: {
    color: '#8c8c8c',
    marginRight: 16,
  },
  save: {
    color: '#ff9800', // Orange
  },
});

