import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Switch, RadioButton } from 'react-native-paper';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { hasAdminAccess } from '../../utils/permissions';

export default function EditUserScreen({ route, navigation }) {
  const { user } = useAuth();
  const [member, setMember] = useState(route.params.member);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (action, close = false) => {
    setBusy(true);
    try {
      const result = await action();
      if (!result.success) throw new Error(result.message);
      Alert.alert('Success', result.message);
      if (close) navigation.goBack();
      setPassword('');
    } catch (error) { Alert.alert('Error', error.response?.data?.message || error.message); }
    finally { setBusy(false); }
  };
  if (!hasAdminAccess(user)) return <Text>Administrator access required.</Text>;
  return <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
    <Text variant="titleLarge">{member.email}</Text>
    {['name', 'phone'].map(key => <TextInput key={key} label={key} value={member[key] || ''} onChangeText={value => setMember({ ...member, [key]: value })} mode="outlined" style={{ marginVertical: 8 }} />)}
    <Text>Role</Text>
    <RadioButton.Group value={member.role} onValueChange={role => setMember({ ...member, role })}>
      {['admin', 'superadmin', 'customer-service', 'finance', 'driver', 'warehouse', 'delivery-agent'].map(role => <RadioButton.Item key={role} label={role} value={role} />)}
    </RadioButton.Group>
    {member.role === 'warehouse' && <RadioButton.Group value={member.warehouseLocation} onValueChange={warehouseLocation => setMember({ ...member, warehouseLocation })}>
      {['UK Warehouse', 'Ghana Warehouse'].map(value => <RadioButton.Item key={value} label={value} value={value} />)}
    </RadioButton.Group>}
    <Text>Account active</Text><Switch value={member.active} onValueChange={active => setMember({ ...member, active })} />
    <Button disabled={busy || !member.name?.trim()} loading={busy} onPress={() => run(() => authService.updateUser(member.id, { name: member.name, phone: member.phone, role: member.role, active: member.active, warehouseLocation: member.warehouseLocation }), true)}>Save Changes</Button>
    <TextInput label="New password" secureTextEntry value={password} onChangeText={setPassword} />
    <Button disabled={busy || password.length < 6} onPress={() => Alert.alert('Reset password?', 'This will replace this member’s password.', [{ text: 'Cancel' }, { text: 'Reset', onPress: () => run(() => authService.resetUserPassword(member.id, password)) }])}>Reset Password</Button>
    <Button disabled={busy} textColor="#c62828" onPress={() => Alert.alert('Delete member?', 'This removes access to the account.', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => run(() => authService.deleteUser(member.id), true) }])}>Delete Member</Button>
  </ScrollView>;
}
