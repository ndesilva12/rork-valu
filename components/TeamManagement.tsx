/**
 * Team Management Component (Phase 0)
 * Allows business owners to invite and manage team members
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Users, Copy, Trash2, Mail, CheckCircle, Clock } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { createTeamInvitation, getTeamMembers, removeTeamMember, initializeBusinessOwner } from '@/services/firebase/businessTeamService';
import { BusinessTeamMember } from '@/types';

export default function TeamManagement() {
  const { isDarkMode, clerkUser, profile } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const [teamMembers, setTeamMembers] = useState<BusinessTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const businessName = profile.businessInfo?.name || 'Your Business';

  // Load team members
  const loadTeamMembers = async () => {
    if (!clerkUser) {
      console.log('[TeamManagement] No clerkUser, skipping load');
      return;
    }

    if (!profile.businessInfo?.name) {
      console.log('[TeamManagement] No business info yet, skipping lazy init check');
      setIsLoading(true);
      try {
        const members = await getTeamMembers(clerkUser.id);
        setTeamMembers(members);
      } catch (error) {
        console.error('[TeamManagement] Error loading team members:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      console.log('[TeamManagement] Loading team members for business:', profile.businessInfo.name);
      const members = await getTeamMembers(clerkUser.id);
      console.log('[TeamManagement] Found', members.length, 'team members');

      // Lazy initialization: If owner doesn't exist in team, add them (for existing businesses)
      const ownerExists = members.some(m => m.role === 'owner' && m.id === clerkUser.id);
      console.log('[TeamManagement] Owner exists in team?', ownerExists);

      if (!ownerExists) {
        console.log('[TeamManagement] 🔄 Initializing owner as team member...');
        const email = clerkUser.primaryEmailAddress?.emailAddress || '';
        await initializeBusinessOwner(clerkUser.id, profile.businessInfo.name, email);
        console.log('[TeamManagement] ✅ Owner initialized, reloading team members...');

        // Reload to include the newly added owner
        const updatedMembers = await getTeamMembers(clerkUser.id);
        console.log('[TeamManagement] After init, found', updatedMembers.length, 'team members');
        setTeamMembers(updatedMembers);
      } else {
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('[TeamManagement] ❌ Error loading team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run when clerkUser OR businessInfo changes (important for lazy initialization)
  useEffect(() => {
    loadTeamMembers();
  }, [clerkUser, profile.businessInfo?.name]);

  const handleInviteTeamMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!clerkUser) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsInviting(true);
    try {
      const invitation = await createTeamInvitation(
        clerkUser.id,
        inviteEmail,
        clerkUser.id,
        businessName
      );

      // Generate invitation link
      const baseUrl = Platform.OS === 'web'
        ? window.location.origin
        : 'uprightmoney://'; // Deep link for mobile
      const inviteLink = `${baseUrl}/business/join/${invitation.inviteCode}`;

      // Copy to clipboard
      await Clipboard.setStringAsync(inviteLink);

      Alert.alert(
        'Invitation Created',
        `Invitation link copied to clipboard!\n\nShare this link with ${inviteEmail}:\n\n${inviteLink}`,
        [{ text: 'OK', onPress: () => {
          setInviteEmail('');
          setShowInviteForm(false);
          loadTeamMembers();
        }}]
      );
    } catch (error) {
      console.error('[TeamManagement] Error creating invitation:', error);
      Alert.alert('Error', 'Failed to create invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyInviteLink = async (inviteCode: string) => {
    const baseUrl = Platform.OS === 'web'
      ? window.location.origin
      : 'uprightmoney://';
    const inviteLink = `${baseUrl}/business/join/${inviteCode}`;

    await Clipboard.setStringAsync(inviteLink);

    if (Platform.OS === 'web') {
      Alert.alert('Copied', 'Invitation link copied to clipboard!');
    } else {
      // On mobile, just show a brief alert
      Alert.alert('Copied!', inviteLink);
    }
  };

  const handleRemoveTeamMember = async (member: BusinessTeamMember) => {
    if (!clerkUser) return;

    Alert.alert(
      'Remove Team Member',
      `Are you sure you want to remove ${member.name} from your team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await removeTeamMember(member.id, clerkUser.id);
              if (success) {
                Alert.alert('Success', `${member.name} has been removed from your team.`);
                loadTeamMembers();
              } else {
                Alert.alert('Error', 'Failed to remove team member.');
              }
            } catch (error) {
              console.error('[TeamManagement] Error removing team member:', error);
              Alert.alert('Error', 'Failed to remove team member.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Team Management</Text>
        </View>
        <TouchableOpacity
          style={[styles.inviteButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowInviteForm(!showInviteForm)}
          disabled={isInviting}
        >
          <Mail size={16} color={colors.white} />
          <Text style={[styles.inviteButtonText, { color: colors.white }]}>Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Invite Form */}
      {showInviteForm && (
        <View style={[styles.inviteForm, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.inviteFormTitle, { color: colors.text }]}>Invite Team Member</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Email address"
            placeholderTextColor={colors.textSecondary}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isInviting}
          />
          <View style={styles.inviteFormButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => {
                setShowInviteForm(false);
                setInviteEmail('');
              }}
              disabled={isInviting}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleInviteTeamMember}
              disabled={isInviting}
            >
              {isInviting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.submitButtonText, { color: colors.white }]}>Send Invite</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.inviteHint, { color: colors.textSecondary }]}>
            A link will be generated that you can share with the team member via email or messaging.
          </Text>
        </View>
      )}

      {/* Team Members List */}
      <View style={styles.membersContainer}>
        {teamMembers.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No team members yet. Invite someone to get started!
          </Text>
        ) : (
          teamMembers.map((member) => (
            <View
              key={member.id}
              style={[styles.memberCard, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                  {member.role === 'owner' && (
                    <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.roleBadgeText, { color: colors.primary }]}>Owner</Text>
                    </View>
                  )}
                  {member.status === 'pending' && (
                    <View style={[styles.statusBadge, { backgroundColor: colors.textSecondary + '20' }]}>
                      <Clock size={12} color={colors.textSecondary} />
                      <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>Pending</Text>
                    </View>
                  )}
                  {member.status === 'active' && member.role !== 'owner' && (
                    <View style={[styles.statusBadge, { backgroundColor: '#28a745' + '20' }]}>
                      <CheckCircle size={12} color="#28a745" />
                      <Text style={[styles.statusBadgeText, { color: '#28a745' }]}>Active</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{member.email}</Text>
              </View>

              <View style={styles.memberActions}>
                {member.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleCopyInviteLink(member.inviteCode)}
                  >
                    <Copy size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
                {member.role !== 'owner' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRemoveTeamMember(member)}
                  >
                    <Trash2 size={18} color="#dc3545" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Info Text */}
      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
        Team members can confirm transactions but cannot view customer data or edit settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inviteForm: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  inviteFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  inviteFormButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  inviteHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  membersContainer: {
    gap: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 13,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  infoText: {
    fontSize: 12,
    marginTop: 12,
    lineHeight: 16,
  },
});
