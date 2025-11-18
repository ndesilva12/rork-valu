/**
 * FollowingModal Component
 * Modal for viewing and managing followed accounts with filtering
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { X, User, Building2 } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';

type AccountType = 'person' | 'brand' | 'business';
type FilterType = 'all' | 'people' | 'brands';

interface FollowedAccount {
  id: string;
  name: string;
  accountType: AccountType;
  profileImage?: string;
  description?: string;
}

interface FollowingModalProps {
  visible: boolean;
  onClose: () => void;
  followedAccounts: FollowedAccount[];
  onUnfollow: (accountId: string) => Promise<void>;
  isDarkMode?: boolean;
}

export default function FollowingModal({
  visible,
  onClose,
  followedAccounts,
  onUnfollow,
  isDarkMode = false,
}: FollowingModalProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [unfollowingIds, setUnfollowingIds] = useState<Set<string>>(new Set());

  // Filter accounts based on active filter
  const filteredAccounts = useMemo(() => {
    if (activeFilter === 'all') return followedAccounts;
    if (activeFilter === 'people') {
      return followedAccounts.filter(acc => acc.accountType === 'person');
    }
    // 'brands' includes both brand and business accounts
    return followedAccounts.filter(acc =>
      acc.accountType === 'brand' || acc.accountType === 'business'
    );
  }, [followedAccounts, activeFilter]);

  const handleUnfollow = async (accountId: string) => {
    setUnfollowingIds(prev => new Set(prev).add(accountId));
    try {
      await onUnfollow(accountId);
    } catch (error) {
      console.error('Error unfollowing account:', error);
    } finally {
      setUnfollowingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountId);
        return newSet;
      });
    }
  };

  const getAccountIcon = (accountType: AccountType) => {
    if (accountType === 'person') {
      return <User size={20} color={colors.textSecondary} strokeWidth={2} />;
    }
    return <Building2 size={20} color={colors.textSecondary} strokeWidth={2} />;
  };

  const getAccountTypeLabel = (accountType: AccountType) => {
    if (accountType === 'person') return 'Person';
    if (accountType === 'brand') return 'Brand';
    return 'Business';
  };

  const renderFilterTab = (filter: FilterType, label: string) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterTab,
          isActive && [styles.filterTabActive, { backgroundColor: colors.primary }],
          !isActive && { backgroundColor: colors.backgroundSecondary },
        ]}
        onPress={() => setActiveFilter(filter)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterTabText,
            isActive ? { color: colors.white } : { color: colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAccount = ({ item }: { item: FollowedAccount }) => {
    const isUnfollowing = unfollowingIds.has(item.id);

    return (
      <View style={[styles.accountItem, { borderBottomColor: colors.border }]}>
        <View style={styles.accountInfo}>
          {/* Profile Image or Icon */}
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
              {getAccountIcon(item.accountType)}
            </View>
          )}

          {/* Account Details */}
          <View style={styles.accountDetails}>
            <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.accountType, { color: colors.textSecondary }]}>
              {getAccountTypeLabel(item.accountType)}
            </Text>
          </View>
        </View>

        {/* Unfollow Button */}
        <TouchableOpacity
          style={[
            styles.unfollowButton,
            { borderColor: colors.border },
            isUnfollowing && styles.unfollowButtonDisabled,
          ]}
          onPress={() => handleUnfollow(item.id)}
          disabled={isUnfollowing}
          activeOpacity={0.7}
        >
          <Text style={[styles.unfollowButtonText, { color: colors.textSecondary }]}>
            {isUnfollowing ? 'Unfollowing...' : 'Unfollow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>Following</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Filter Tabs */}
              <View style={styles.filterContainer}>
                {renderFilterTab('all', 'All')}
                {renderFilterTab('people', 'People')}
                {renderFilterTab('brands', 'Brands')}
              </View>

              {/* Accounts List */}
              {filteredAccounts.length > 0 ? (
                <FlatList
                  data={filteredAccounts}
                  renderItem={renderAccount}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={true}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    {activeFilter === 'all'
                      ? "You're not following anyone yet"
                      : `No ${activeFilter === 'people' ? 'people' : 'brands'} followed`
                    }
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 13,
  },
  unfollowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  unfollowButtonDisabled: {
    opacity: 0.5,
  },
  unfollowButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 15,
  },
});
