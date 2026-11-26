import React, { useState } from 'react';
import { ScrollView, Alert, RefreshControl } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { batchService } from '../../services/batchService';
import useScreenRefresh from '../../hooks/useScreenRefresh';
import { useAuth } from '../../hooks/useAuth';
import { isGhanaWarehouse } from '../../utils/permissions';
export default function BatchesScreen({ navigation }) {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    try {
      const all = []; let page = 1; let pages = 1;
      do {
        const response = await batchService.getBatches({ page, limit: 100 });
        if (!response.success) throw new Error(response.message);
        all.push(...(response.data?.batches || []));
        pages = response.data?.pagination?.totalPages || 1; page += 1;
      } while (page <= pages);
      setBatches(all);
    } catch (error) { Alert.alert('Unable to load batches', error.response?.data?.message || error.message); }
    finally { setBusy(false); }
  };
  useScreenRefresh(load);
  return <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />}>
    {!isGhanaWarehouse(user) && <Button icon="plus" onPress={() => navigation.navigate('CreateBatch')}>Create Batch</Button>}
    {!batches.length && <Text>No batches found.</Text>}
    {batches.map(batch => <Card key={batch.id} style={{ marginVertical: 8 }} onPress={() => navigation.navigate('BatchJobs', { batchId: batch.id })}>
      <Card.Title title={batch.name ? `${batch.name} (${batch.batchId})` : batch.batchId} subtitle={`${batch.route || ''} · ${batch.status}`} />
      <Card.Content><Text>{batch.totalJobs || batch.jobs?.length || 0} jobs · {Number(batch.totalWeight || 0).toFixed(2)} kg</Text></Card.Content>
    </Card>)}
  </ScrollView>;
}
