import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, TextInput, Button, Text } from 'react-native-paper';
import { FREIGHT_TYPES, PRIORITY_LEVELS } from '../../config/constants';

export default function DropdownWithOther({
  label,
  value,
  onValueChange,
  options,
  style,
  allowOther = true,
}) {
  const [visible, setVisible] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  const handleSelect = (selectedValue) => {
    if (selectedValue === 'Other' && allowOther) {
      setShowOtherInput(true);
      setVisible(false);
    } else {
      onValueChange(selectedValue);
      setVisible(false);
    }
  };

  const handleOtherSubmit = () => {
    if (otherValue.trim()) {
      onValueChange(otherValue.trim());
      setShowOtherInput(false);
      setOtherValue('');
    }
  };

  if (showOtherInput) {
    return (
      <View style={style}>
        <TextInput
          label={`${label} (Custom)`}
          value={otherValue}
          onChangeText={setOtherValue}
          mode="outlined"
          style={styles.input}
        />
        <View style={styles.otherActions}>
          <Button
            mode="outlined"
            onPress={() => {
              setShowOtherInput(false);
              setOtherValue('');
            }}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleOtherSubmit}
            disabled={!otherValue.trim()}
            style={styles.button}
          >
            Save
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={style}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TextInput
            label={label}
            value={value || ''}
            mode="outlined"
            editable={false}
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
        {options.map((option) => (
          <Menu.Item
            key={option}
            onPress={() => handleSelect(option)}
            title={option}
          />
        ))}
        {allowOther && (
          <Menu.Item
            onPress={() => handleSelect('Other')}
            title="Other..."
          />
        )}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 8,
    borderRadius: 8,
  },
  otherActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
});

