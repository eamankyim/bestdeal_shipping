import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Chip,
  TextInput,
  Modal,
  Portal,
  IconButton,
  List,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';
import { standardStyles, theme, spacing, touchTargets } from '../../theme/theme';
import logger from '../../utils/logger';

export default function InviteManagementScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'driver',
    warehouseLocation: '',
  });

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      setLoading(true);
      const response = await authService.getInvites();
      if (response.success && response.data) {
        // Handle nested data structure: response.data.data.invitations
        const invitationsData = response.data.data?.invitations || response.data.invitations || [];
        setInvites(Array.isArray(invitationsData) ? invitationsData : Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      logger.error('Failed to load invites', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInvites();
  };

  const handleSendInvite = async () => {
    if (!inviteForm.email) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!inviteForm.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setSendingInvite(true);
      const response = await authService.sendInvite(
        inviteForm.email,
        inviteForm.role,
        inviteForm.warehouseLocation || undefined
      );

      if (response.success) {
        Alert.alert('Success', 'Invitation sent successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setInviteModalVisible(false);
              setInviteForm({ email: '', role: 'driver', warehouseLocation: '' });
              loadInvites();
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to send invitation');
      }
    } catch (error) {
      logger.error('Failed to send invite', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleShareInvite = async (invite) => {
    try {
      // Construct invite link - adjust URL scheme based on your app configuration
      const inviteLink = invite.token 
<<<<<<< HEAD
        ? `shipease://accept-invite/${invite.token}` 
        : `https://app.shipease.com/accept-invite/${invite.token || invite.id}`;
      
      const message = `You've been invited to join ShipEASE Shipping!\n\nEmail: ${invite.email}\nRole: ${invite.role}\n\nClick here to accept: ${inviteLink}`;
      
      const result = await Share.share({
        message: message,
        title: 'ShipEASE Invitation',
=======
        ? `bestdeal://accept-invite/${invite.token}` 
        : `https://app.bestdeal.com/accept-invite/${invite.token || invite.id}`;
      
      const message = `You've been invited to join BestDeal Shipping!\n\nEmail: ${invite.email}\nRole: ${invite.role}\n\nClick here to accept: ${inviteLink}`;
      
      const result = await Share.share({
        message: message,
        title: 'BestDeal Invitation',
>>>>>>> origin/master
      });

      if (result.action === Share.sharedAction) {
        logger.info('Invite shared successfully', { email: invite.email });
      }
    } catch (error) {
      logger.error('Failed to share invite', error);
      Alert.alert('Error', 'Failed to share invitation. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#faad14';
      case 'accepted':
        return '#52c41a';
      case 'expired':
        return '#ff4d4f';
      default:
        return '#8c8c8c';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const roleOptions = [
    { value: 'driver', label: 'Driver' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'delivery-agent', label: 'Delivery Agent' },
    { value: 'finance', label: 'Finance' },
    { value: 'customer-service', label: 'Customer Service' },
    { value: 'admin', label: 'Admin' },
  ];

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Invite Management
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Send invitations to new team members and manage pending invites.
            </Text>
            <Button
              mode="contained"
              onPress={() => setInviteModalVisible(true)}
              style={styles.button}
              icon="email-plus"
              buttonColor="#ff9800"
            >
              Send Invite
            </Button>
          </Card.Content>
        </Card>

        {invites.length === 0 ? (
          <Card style={styles.card} elevation={0}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No pending invites
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Card style={styles.card} elevation={0}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Pending Invitations ({invites.length})
                </Text>
              </Card.Content>
            </Card>

            {invites.map((invite) => (
              <Card key={invite.id || invite._id} style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text variant="titleMedium" style={styles.emailText}>
                        {invite.email}
                      </Text>
                      <View style={styles.chipContainer}>
                        <Chip 
                          style={[styles.roleChip, { backgroundColor: '#ff980020' }]}
                          textStyle={{ color: '#ff9800', fontSize: 11 }}
                        >
                          {invite.role?.toUpperCase() || 'N/A'}
                        </Chip>
                        <Chip 
                          style={[
                            styles.statusChip, 
                            { backgroundColor: getStatusColor(invite.status) + '20' }
                          ]}
                          textStyle={{ 
                            color: getStatusColor(invite.status), 
                            fontSize: 11 
                          }}
                        >
                          {(invite.status || 'pending').toUpperCase()}
                        </Chip>
                      </View>
                    </View>
                    <IconButton
                      icon="share-variant"
                      size={24}
                      iconColor="#ff9800"
                      onPress={() => handleShareInvite(invite)}
                      style={styles.shareButton}
                    />
                  </View>
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.dateContainer}>
                      <Text variant="bodySmall" style={styles.dateLabel}>
                        Sent:
                      </Text>
                      <Text variant="bodySmall" style={styles.dateText}>
                        {formatDate(invite.createdAt)}
                      </Text>
                    </View>
                    {invite.expiresAt && (
                      <View style={styles.dateContainer}>
                        <Text variant="bodySmall" style={styles.dateLabel}>
                          Expires:
                        </Text>
                        <Text variant="bodySmall" style={styles.dateText}>
                          {formatDate(invite.expiresAt)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </View>

      {/* Send Invite Modal */}
      <Portal>
        <Modal
          visible={inviteModalVisible}
          onDismiss={() => setInviteModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Card style={styles.modalCard} elevation={0}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Send Invitation
              </Text>

              <TextInput
                label="Email Address"
                value={inviteForm.email}
                onChangeText={(text) =>
                  setInviteForm({ ...inviteForm, email: text })
                }
                backgroundColor="#ffffff"
                outlineColor="#e0e0e0"
                activeOutlineColor="#ff9800"
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                disabled={sendingInvite}
              />

              <Text variant="bodyMedium" style={styles.label}>
                Role
              </Text>
              <View style={styles.roleContainer}>
                {roleOptions.map((option) => (
                  <Button
                    key={option.value}
                    mode={inviteForm.role === option.value ? 'contained' : 'outlined'}
                    onPress={() =>
                      setInviteForm({ ...inviteForm, role: option.value })
                    }
                    style={styles.roleButton}
                    disabled={sendingInvite}
                    buttonColor={
                      inviteForm.role === option.value ? '#ff9800' : undefined
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </View>

              {inviteForm.role === 'warehouse' && (
                <TextInput
                  label="Warehouse Location (Optional)"
                  value={inviteForm.warehouseLocation}
                  onChangeText={(text) =>
                    setInviteForm({ ...inviteForm, warehouseLocation: text })
                  }
                  backgroundColor="#ffffff"
                  outlineColor="#e0e0e0"
                  activeOutlineColor="#ff9800"
                  mode="outlined"
                  placeholder="e.g., Ghana Warehouse"
                  style={styles.input}
                  disabled={sendingInvite}
                />
              )}

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setInviteModalVisible(false);
                    setInviteForm({ email: '', role: 'driver', warehouseLocation: '' });
                  }}
                  disabled={sendingInvite}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSendInvite}
                  loading={sendingInvite}
                  disabled={sendingInvite}
                  style={styles.modalButton}
                  buttonColor="#ff9800"
                >
                  Send Invite
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
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
    marginBottom: spacing.md,
    ...standardStyles,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: spacing.sm,
    color: theme.colors.text,
  },
  description: {
    color: theme.colors.placeholder,
    marginBottom: spacing.md,
  },
  button: {
    marginBottom: spacing.sm,
    minHeight: touchTargets.buttonHeight,
  },
  chip: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  date: {
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  roleChip: {
    height: 28,
  },
  statusChip: {
    height: 28,
  },
  shareButton: {
    margin: 0,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateLabel: {
    color: theme.colors.placeholder,
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.text,
  },
  modalContent: {
    padding: spacing.md,
  },
  modalCard: {
    ...standardStyles,
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
    color: theme.colors.text,
  },
  input: {
    marginBottom: spacing.md,
    ...standardStyles,
  },
  label: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    color: theme.colors.text,
    fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  roleButton: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    minHeight: touchTargets.buttonHeight,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  modalButton: {
    minHeight: touchTargets.buttonHeight,
  },
});

