/**
 * LibraryView Component
 * Shared library display used across Home tab, Profile tab, and User Profile views
 * Displays user's lists in a collapsible, expandable format
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import {
  ChevronDown,
  ChevronRight,
  User,
  Globe,
  Lock,
  MoreVertical,
  Plus,
  MapPin,
  TrendingUp,
  TrendingDown
} from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { UserList, ListEntry } from '@/types/library';
import { UserProfile } from '@/types';
import { BusinessUser } from '@/services/firebase/businessService';
import EndorsedBadge from './EndorsedBadge';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LibraryViewProps {
  // Data
  userLists: UserList[];
  userPersonalList: UserList | null;
  alignedItems?: any[]; // Brands/businesses aligned with user
  unalignedItems?: any[]; // Brands/businesses not aligned
  userBusinesses?: BusinessUser[];
  profile: UserProfile;

  // Configuration
  isDarkMode?: boolean;
  isOwnLibrary?: boolean; // Is this the current user's library?
  userId?: string; // For tracking first-time visits
  showSystemLists?: boolean; // Show Aligned/Unaligned lists

  // Callbacks
  onListPress?: (listId: string) => void;
  onItemPress?: (item: any) => void;
  onAddToList?: (itemId: string, itemType: string) => void;
  onRemoveFromList?: (entryId: string) => void;
  onShareItem?: (itemId: string, itemType: string) => void;
}

export default function LibraryView({
  userLists,
  userPersonalList,
  alignedItems = [],
  unalignedItems = [],
  userBusinesses = [],
  profile,
  isDarkMode = false,
  isOwnLibrary = true,
  userId,
  showSystemLists = true,
  onListPress,
  onItemPress,
  onAddToList,
  onRemoveFromList,
  onShareItem,
}: LibraryViewProps) {
  const colors = isDarkMode ? darkColors : lightColors;

  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [hasSetDefault, setHasSetDefault] = useState(false);

  // Set default expanded/selected list on first load
  useEffect(() => {
    const setDefaultState = async () => {
      if (hasSetDefault || !userPersonalList || !userId) return;

      const firstTimeKey = `firstTimeLibraryVisit_${userId}`;
      const isFirstTime = await AsyncStorage.getItem(firstTimeKey);

      if (isFirstTime === null) {
        // First time: expand aligned list
        setExpandedListId('aligned');
        setSelectedListId('aligned');
        await AsyncStorage.setItem(firstTimeKey, 'false');
      } else {
        // Not first time: select endorsed list but keep collapsed
        setExpandedListId(null);
        setSelectedListId('endorsement');
      }
      setHasSetDefault(true);
    };

    if (isOwnLibrary) {
      setDefaultState();
    }
  }, [hasSetDefault, userPersonalList, userId, isOwnLibrary]);

  const toggleListExpansion = (listId: string) => {
    setSelectedListId(listId);
    setExpandedListId(expandedListId === listId ? null : listId);
  };

  // Filter out endorsement list from custom lists
  const customLists = userLists.filter(list => list.id !== userPersonalList?.id);

  const renderListHeader = (
    listId: string,
    title: string,
    itemCount: number,
    isEndorsed: boolean = false,
    creatorImage?: string,
    useAppIcon?: boolean,
    description?: string,
    isPublic?: boolean
  ) => {
    const isExpanded = expandedListId === listId;
    const isSelected = selectedListId === listId;
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

    return (
      <TouchableOpacity
        style={[
          styles.listHeader,
          { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
          isExpanded && { borderColor: colors.primary, borderWidth: 2 },
          !isExpanded && isSelected && { borderColor: colors.primary, borderWidth: 2 },
        ]}
        onPress={() => toggleListExpansion(listId)}
        activeOpacity={0.7}
      >
        {/* Profile Image */}
        <View style={[styles.listImageContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {useAppIcon ? (
            <Image
              source={require('@/assets/images/endorse1.png')}
              style={styles.listImage}
              contentFit="cover"
            />
          ) : creatorImage ? (
            <Image
              source={{ uri: creatorImage }}
              style={styles.listImage}
              contentFit="cover"
            />
          ) : (
            <User size={24} color={colors.textSecondary} strokeWidth={2} />
          )}
        </View>

        {/* List Info */}
        <View style={styles.listInfo}>
          <View style={styles.listTitleRow}>
            <ChevronIcon size={20} color={colors.text} strokeWidth={2} />
            <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            {isEndorsed && <EndorsedBadge isDarkMode={isDarkMode} size="small" />}
          </View>
          <View style={styles.listMeta}>
            <Text style={[styles.listCount, { color: colors.textSecondary }]}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
            {isPublic !== undefined && (
              <View style={styles.privacyBadge}>
                {isPublic ? (
                  <>
                    <Globe size={12} color={colors.primary} strokeWidth={2} />
                    <Text style={[styles.privacyText, { color: colors.primary }]}>Public</Text>
                  </>
                ) : (
                  <>
                    <Lock size={12} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.privacyText, { color: colors.textSecondary }]}>Private</Text>
                  </>
                )}
              </View>
            )}
          </View>
          {description && isExpanded && (
            <Text style={[styles.listDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Endorsement List - Always first */}
      {userPersonalList && (
        <View>
          {renderListHeader(
            'endorsement',
            userPersonalList.name,
            userPersonalList.entries?.length || 0,
            true,
            profile?.userDetails?.profileImage,
            false,
            userPersonalList.description,
            userPersonalList.isPublic
          )}
          {expandedListId === 'endorsement' && (
            <View style={[styles.listItems, { backgroundColor: colors.background }]}>
              {userPersonalList.entries?.length > 0 ? (
                userPersonalList.entries.map((entry, index) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.listItem,
                      { borderBottomColor: colors.border },
                      index < userPersonalList.entries.length - 1 && styles.listItemBorder
                    ]}
                  >
                    <Text style={[styles.listItemNumber, { color: colors.textSecondary }]}>
                      {index + 1}
                    </Text>
                    <Text style={[styles.listItemText, { color: colors.text }]} numberOfLines={1}>
                      {entry.name || entry.brandName || entry.businessName || 'Item'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No items yet
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Aligned List */}
      {showSystemLists && alignedItems.length > 0 && (
        <View style={styles.listWrapper}>
          {renderListHeader(
            'aligned',
            'Aligned',
            alignedItems.length,
            false,
            undefined,
            true,
            'Brands and businesses aligned with your values'
          )}
          {expandedListId === 'aligned' && (
            <View style={[styles.listItems, { backgroundColor: colors.background }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {alignedItems.length} aligned items
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Unaligned List */}
      {showSystemLists && unalignedItems.length > 0 && (
        <View style={styles.listWrapper}>
          {renderListHeader(
            'unaligned',
            'Unaligned',
            unalignedItems.length,
            false,
            undefined,
            true,
            'Brands and businesses not aligned with your values'
          )}
          {expandedListId === 'unaligned' && (
            <View style={[styles.listItems, { backgroundColor: colors.background }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {unalignedItems.length} unaligned items
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Custom Lists */}
      {customLists.map(list => (
        <View key={list.id} style={styles.listWrapper}>
          {renderListHeader(
            list.id,
            list.name,
            list.entries.length,
            false,
            profile?.userDetails?.profileImage,
            false,
            list.description,
            list.isPublic
          )}
          {expandedListId === list.id && (
            <View style={[styles.listItems, { backgroundColor: colors.background }]}>
              {list.entries.length > 0 ? (
                list.entries.map((entry, index) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.listItem,
                      { borderBottomColor: colors.border },
                      index < list.entries.length - 1 && styles.listItemBorder
                    ]}
                  >
                    <Text style={[styles.listItemNumber, { color: colors.textSecondary }]}>
                      {index + 1}
                    </Text>
                    <Text style={[styles.listItemText, { color: colors.text }]} numberOfLines={1}>
                      {entry.name || entry.brandName || entry.businessName || 'Item'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No items yet
                </Text>
              )}
            </View>
          )}
        </View>
      ))}

      {/* Empty State */}
      {!userPersonalList && customLists.length === 0 && (
        <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <User size={48} color={colors.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Lists Yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isOwnLibrary ? 'Create your first list to get started' : 'This user has no public lists'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  listWrapper: {
    marginBottom: 0,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  listImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  listImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  listInfo: {
    flex: 1,
    gap: 4,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    flex: 1,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listCount: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  listDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  listItems: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  listItemBorder: {
    borderBottomWidth: 1,
  },
  listItemNumber: {
    fontSize: 13,
    fontWeight: '600' as const,
    minWidth: 24,
  },
  listItemText: {
    fontSize: 14,
    fontWeight: '500' as const,
    flex: 1,
  },
  emptyContainer: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 12,
  },
});
