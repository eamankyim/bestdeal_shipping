import React, { useState } from 'react';
import { ScrollView, Alert, Image, View } from 'react-native';
import { Text, TextInput, Button, RadioButton, Divider } from 'react-native-paper';
import { format } from 'date-fns';
import { invoiceService } from '../../services/invoiceService';
import ThreeDotsLoader from '../../components/common/ThreeDotsLoader';
import AuthImage from '../../components/common/AuthImage';
import { useAuth } from '../../hooks/useAuth';
import { canManageInvoices } from '../../utils/permissions';
import { choosePhoto, takePhoto } from '../../utils/photos';

// Notes on the state of an invoice, each with an optional reference number and image.
function InvoiceNotes({ invoice, onAdded }) {
  const [note, setNote] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);

  const attach = async getPhoto => {
    try { const photo = await getPhoto(); if (photo) setImage(photo); }
    catch (error) { Alert.alert('Error', 'Failed to add image'); }
  };
  const add = async () => {
    setBusy(true);
    try {
      await invoiceService.addNote(invoice.id, {
        note: note.trim(),
        referenceNumber: referenceNumber.trim() || undefined,
        image: image ? { fileData: image.fileData, fileName: image.name, mimeType: image.type } : undefined,
      });
      setNote(''); setReferenceNumber(''); setImage(null);
      await onAdded();
    } catch (error) { Alert.alert('Could not add note', error.response?.data?.message || error.message); }
    finally { setBusy(false); }
  };

  return <View>
    <Divider style={{ marginVertical: 20 }} />
    <Text variant="titleMedium">Invoice State Notes</Text>
    <TextInput label="State of this invoice" value={note} onChangeText={setNote} multiline maxLength={5000} style={{ marginVertical: 8 }} />
    <TextInput label="Reference number (optional)" value={referenceNumber} onChangeText={setReferenceNumber} maxLength={100} style={{ marginVertical: 8 }} />
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button mode="outlined" icon="camera" onPress={() => attach(takePhoto)}>Camera</Button>
      <Button mode="outlined" icon="image" onPress={() => attach(choosePhoto)}>Gallery</Button>
    </View>
    {image && <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
      <Image source={{ uri: image.uri }} style={{ width: 88, height: 88, borderRadius: 8 }} />
      <Button onPress={() => setImage(null)}>Remove</Button>
    </View>}
    <Button mode="contained" icon="note-plus" loading={busy} disabled={busy || !note.trim()} onPress={add} style={{ marginVertical: 12 }}>Add Note</Button>
    {(invoice.invoiceNotes || []).map(item => <View key={item.id} style={{ backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 8, gap: 6 }}>
      <Text>{item.note}</Text>
      {item.referenceNumber && <Text variant="bodySmall">Ref: {item.referenceNumber}</Text>}
      {item.imageSize && <AuthImage path={`/invoices/notes/${item.id}/image`} size={120} />}
      <Text variant="bodySmall" style={{ color: '#8c8c8c' }}>{item.author?.name || 'Unknown'} · {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}</Text>
    </View>)}
  </View>;
}

export default function InvoiceDetailScreen({ route }) {
  const { user } = useAuth();
  const canManage = canManageInvoices(user); // the Ghana warehouse can only view and add notes
  const [invoice, setInvoice] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const load = async () => {
    try {
      const result = await invoiceService.getInvoice(route.params.invoiceId);
      if (!result.success) throw new Error(result.message);
      setInvoice(result.data.invoice);
      setForm({ subtotal: String(result.data.invoice.subtotal), tax: String(result.data.invoice.tax), notes: result.data.invoice.notes || '', dueDate: result.data.invoice.dueDate?.slice(0, 10) || '' });
    } catch (error) { Alert.alert('Invoice unavailable', error.response?.data?.message || error.message); }
  };
  // Keep edits intact while this form is open; refresh on navigation focus.
  React.useEffect(() => { load(); }, [route.params.invoiceId]);
  const run = async action => {
    setBusy(true);
    try { const result = await action(); if (!result.success) throw new Error(result.message); Alert.alert('Success', result.emailDelivery?.sent === false ? 'Invoice finalized; email was not delivered.' : result.message); await load(); }
    catch (error) { Alert.alert('Error', error.response?.data?.message || error.message); }
    finally { setBusy(false); }
  };
  if (!invoice) return <ThreeDotsLoader style={{ marginTop: 40 }} />;
  return <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
    <Text variant="headlineSmall">{invoice.invoiceNumber}</Text><Text>{invoice.customer?.name} · {invoice.status}</Text>
    <Text variant="titleLarge">£{Number(invoice.total).toFixed(2)}</Text>
    {(invoice.items || []).map(item => <Text key={item.id}>{item.description} · {item.quantity} × £{Number(item.unitPrice).toFixed(2)}</Text>)}
    {canManage && invoice.status === 'Draft' && <>
      {['subtotal', 'tax', 'dueDate', 'notes'].map(key => <TextInput key={key} label={key === 'dueDate' ? 'Due date (YYYY-MM-DD)' : key} value={form[key]} onChangeText={value => setForm({ ...form, [key]: value })} style={{ marginVertical: 8 }} />)}
      <Button disabled={busy} onPress={() => {
        if (![form.subtotal, form.tax].every(value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0) || !/^\d{4}-\d{2}-\d{2}$/.test(form.dueDate) || Number.isNaN(Date.parse(form.dueDate))) return Alert.alert('Invalid details', 'Enter valid amounts and a due date.');
        run(() => invoiceService.updateInvoice(invoice.id, form));
      }}>Save Draft</Button>
      <Button disabled={busy} onPress={() => Alert.alert('Send invoice?', 'This finalizes the saved draft and emails it to the customer.', [{ text: 'Cancel' }, { text: 'Send', onPress: () => run(() => invoiceService.sendInvoice(invoice.id)) }])}>Send Invoice</Button>
    </>}
    {canManage && ['Pending', 'Overdue'].includes(invoice.status) && <>
      <RadioButton.Group value={method} onValueChange={setMethod}>{['cash', 'bank', 'pos'].map(value => <RadioButton.Item key={value} value={value} label={value} />)}</RadioButton.Group>
      <TextInput label="Payment reference" value={reference} onChangeText={setReference} />
      <Button disabled={busy} onPress={() => Alert.alert('Confirm payment?', 'Mark the full invoice amount as paid.', [{ text: 'Cancel' }, { text: 'Confirm', onPress: () => run(() => invoiceService.payInvoice(invoice.id, { paymentMethod: method, paymentReference: reference })) }])}>Mark Paid</Button>
    </>}
    {canManage && !['Paid', 'Cancelled'].includes(invoice.status) && <Button disabled={busy} textColor="#c62828" onPress={() => Alert.alert('Cancel invoice?', 'This marks the invoice as cancelled.', [{ text: 'Keep' }, { text: 'Cancel Invoice', style: 'destructive', onPress: () => run(() => invoiceService.cancelInvoice(invoice.id)) }])}>Cancel Invoice</Button>}
    <InvoiceNotes invoice={invoice} onAdded={load} />
  </ScrollView>;
}
