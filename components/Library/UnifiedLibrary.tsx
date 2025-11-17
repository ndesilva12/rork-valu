/**
 * UnifiedLibrary Component
 * Based on Home tab's library implementation
 * Used across Home tab, Profile tab, and User profile pages
 *
 * Features:
 * - Endorsement list (pinned, always first)
 * - Aligned/Unaligned lists (system-generated from user values)
 * - Custom lists (user-created)
 * - Edit mode (add, remove, reorder items)
 * - Share/Copy functionality (for viewing others' libraries)
 * - Collapsible/expandable lists
 * - Privacy controls (public/private)
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { Image } from 'expo-image';
import {
  ChevronDown,
  ChevronRight,
  User,
  Globe,
  Lock,
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  Share2,
  Copy,
  GripVertical,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { UserList, ListEntry } from '@/types/library';
import { useLibrary } from '@/contexts/LibraryContext';
import EndorsedBadge from '@/components/EndorsedBadge';
import ShareModal from '@/components/ShareModal';
import { getLogoUrl } from '@/lib/logo';
import { copyListToLibrary } from '@/services/firebase/listService';

// ===== Types =====

interface UnifiedLibraryProps {
  // Mode
  mode: 'own' | 'viewing'; // 'own' = full edit, 'viewing' = can share/copy only

  // User info
  currentUserId?: string; // The logged-in user's ID
  viewingUserId?: string; // The user whose library is being viewed (for 'viewing' mode)

  // Data (optional - if not provided, uses context)
  userLists?: UserList[]; // Override lists from context
  endorsementList?: UserList | null; // Override endorsement list from context
  alignedItems?: any[]; // Brands/businesses aligned with user's values
  unalignedItems?: any[]; // Brands/businesses not aligned with user's values

  // UI
  isDarkMode?: boolean;
  profileImage?: string;

  // Callbacks
  onItemPress?: (item: any, listId: string) => void;
  onAddItem?: (listId: string) => void;
  onShareItem?: (item: any) => void;
}

export default function UnifiedLibrary({
  mode,
  currentUserId,
  viewingUserId,
  userLists: propsUserLists,
  endorsementList: propsEndorsementList,
  alignedItems = [],
  unalignedItems = [],
  isDarkMode = false,
  profileImage,
  onItemPress,
  onAddItem,
  onShareItem,
}: UnifiedLibraryProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const library = useLibrary();

  // Local UI state
  const [activeListOptionsId, setActiveListOptionsId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareItem, setShareItem] = useState<any>(null);
  const [copyingListId, setCopyingListId] = useState<string | null>(null);

  const isOwnLibrary = mode === 'own';
  const isEditable = mode === 'own';

  // ===== Helper Functions =====

  const toggleListExpansion = (listId: string) => {
    library.toggleListExpansion(listId);
    library.setSelectedList(listId);
  };

  const handleCopyList = async (list: UserList) => {
    if (!currentUserId) {
      Alert.alert('Error', 'You must be logged in to copy lists');
      return;
    }

    if (viewingUserId === currentUserId) {
      Alert.alert('Info', 'This is already in your library');
      return;
    }

    setCopyingListId(list.id);
    try {
      await copyListToLibrary(currentUserId, list);
      Alert.alert('Success', `"${list.name}" has been copied to your library`);
    } catch (error) {
      console.error('[UnifiedLibrary] Error copying list:', error);
      Alert.alert('Error', 'Failed to copy list. Please try again.');
    } finally {
      setCopyingListId(null);
    }
  };

  const handleShareList = (list: UserList) => {
    setShareItem(list);
    setShowShareModal(true);
  };

  const handleAddToList = (entry: Omit<ListEntry, 'id'>, listId: string) => {
    if (!isOwnLibrary) return;
    library.addEntry(listId, entry);
  };

  const handleRemoveFromList = (entryId: string, listId: string) => {
    if (!isOwnLibrary) return;
    library.removeEntry(listId, entryId);
  };

  // ===== Render Functions =====

  const renderListHeader = (
    listId: string,
    title: string,
    itemCount: number,
    isExpanded: boolean,
    options: {
      isEndorsed?: boolean;
      isPinned?: boolean;
      attribution?: string;
      description?: string;
      isPublic?: boolean;
      creatorProfileImage?: string;
      useAppIcon?: boolean;
      canReorder?: boolean;
      canEdit?: boolean;
      canRemove?: boolean;
      canCopy?: boolean;
      canShare?: boolean;
    } = {}
  ) => {
    const {
      isEndorsed = false,
      isPinned = false,
      attribution,
      description,
      isPublic,
      creatorProfileImage,
      useAppIcon = false,
      canReorder = false,
      canEdit = false,
      canRemove = false,
      canCopy = false,
      canShare = false,
    } = options;

    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;
    const isOptionsOpen = activeListOptionsId === listId;
    const isSelected = library.state.selectedListId === listId;

    return (
      <View style={styles.listHeaderWrapper}>
        <View
          style={[
            styles.listHeader,
            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
            isPinned && styles.pinnedListHeader,
            isExpanded && { borderWidth: 2, borderColor: colors.primary, borderRadius: 12 },
            !isExpanded && isSelected && { borderWidth: 2, borderColor: colors.primary, borderRadius: 12 },
          ]}
        >
          {/* Profile Image */}
          <View style={[styles.listProfileImageContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {useAppIcon ? (
              <Image
                source={require('@/assets/images/endorse1.png')}
                style={styles.listProfileImage}
                contentFit="cover"
              />
            ) : creatorProfileImage ? (
              <Image
                source={{ uri: creatorProfileImage }}
                style={styles.listProfileImage}
                contentFit="cover"
              />
            ) : (
              <User size={24} color={colors.textSecondary} strokeWidth={2} />
            )}
          </View>

          {/* List Info - Tappable */}
          <TouchableOpacity
            style={styles.listHeaderContent}
            onPress={() => toggleListExpansion(listId)}
            activeOpacity={0.7}
          >
            <View style={styles.listInfo}>
              {isExpanded ? (
                // Expanded view - stacked layout
                <>
                  <View style={styles.listTitleRow}>
                    <ChevronIcon size={20} color={colors.text} strokeWidth={2} />
                    <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
                      {title}
                    </Text>
                    {isEndorsed && <EndorsedBadge isDarkMode={isDarkMode} size="small" showText={false} />}
                  </View>
                  <View style={styles.listMeta}>
                    <Text style={[styles.listCount, { color: colors.textSecondary }]}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </Text>
                    {isPublic !== undefined && (
                      <View style={styles.privacyIndicator}>
                        {isPublic ? (
                          <Globe size={14} color={colors.primary} strokeWidth={2} />
                        ) : (
                          <Lock size={14} color={colors.textSecondary} strokeWidth={2} />
                        )}
                      </View>
                    )}
                  </View>
                  {attribution && (
                    <Text style={[styles.listAttribution, { color: colors.textSecondary }]} numberOfLines={1}>
                      {attribution}
                    </Text>
                  )}
                  {description && (
                    <Text style={[styles.listDescription, { color: colors.text }]} numberOfLines={2}>
                      {description}
                    </Text>
                  )}
                </>
              ) : (
                // Collapsed view - horizontal layout
                <View style={styles.listRowLayout}>
                  <View style={styles.listTitleRow}>
                    <ChevronIcon size={20} color={colors.text} strokeWidth={2} />
                    <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
                      {title}
                    </Text>
                    {isEndorsed && <EndorsedBadge isDarkMode={isDarkMode} size="small" showText={false} />}
                  </View>
                  <View style={styles.listMetaRow}>
                    <Text style={[styles.listCount, { color: colors.textSecondary }]} numberOfLines={1}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </Text>
                    {isPublic !== undefined && (
                      <View style={styles.privacyIndicator}>
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
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Options Button */}
          {(canReorder || canEdit || canRemove || canCopy || canShare) && (
            <TouchableOpacity
              style={styles.listHeaderOptionsButton}
              onPress={(e) => {
                setActiveListOptionsId(isOptionsOpen ? null : listId);
              }}
              activeOpacity={0.7}
            >
              <MoreVertical size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Options Dropdown */}
        {isOptionsOpen && (
          <View style={[styles.listOptionsDropdown, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            {canCopy && (
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  const list = library.getListById(listId);
                  if (list) handleCopyList(list);
                  setActiveListOptionsId(null);
                }}
                activeOpacity={0.7}
              >
                <Copy size={18} color={colors.text} strokeWidth={2} />
                <Text style={[styles.optionText, { color: colors.text }]}>Copy to My Library</Text>
              </TouchableOpacity>
            )}
            {canShare && (
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  const list = library.getListById(listId);
                  if (list) handleShareList(list);
                  setActiveListOptionsId(null);
                }}
                activeOpacity={0.7}
              >
                <Share2 size={18} color={colors.text} strokeWidth={2} />
                <Text style={[styles.optionText, { color: colors.text }]}>Share</Text>
              </TouchableOpacity>
            )}
            {canReorder && (
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  library.setReorderMode(true);
                  setActiveListOptionsId(null);
                }}
                activeOpacity={0.7}
              >
                <GripVertical size={18} color={colors.text} strokeWidth={2} />
                <Text style={[styles.optionText, { color: colors.text }]}>Reorder Items</Text>
              </TouchableOpacity>
            )}
            {canEdit && (
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  // TODO: Open edit modal
                  setActiveListOptionsId(null);
                }}
                activeOpacity={0.7}
              >
                <Edit size={18} color={colors.text} strokeWidth={2} />
                <Text style={[styles.optionText, { color: colors.text }]}>Edit Details</Text>
              </TouchableOpacity>
            )}
            {canRemove && (
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  Alert.alert(
                    'Delete List',
                    'Are you sure you want to delete this list? This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          library.removeList(listId);
                          setActiveListOptionsId(null);
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <Trash2 size={18} color="#EF4444" strokeWidth={2} />
                <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete List</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderListContent = (entries: ListEntry[], listId: string) => {
    if (entries.length === 0) {
      return (
        <View style={[styles.listContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isOwnLibrary ? 'No items yet. Tap + to add items.' : 'No items in this list.'}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.listContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {entries.map((entry, index) => (
          <TouchableOpacity
            key={entry.id}
            style={[
              styles.listItem,
              { borderBottomColor: colors.border },
              index < entries.length - 1 && styles.listItemBorder,
            ]}
            onPress={() => onItemPress?.(entry, listId)}
            activeOpacity={0.7}
          >
            {/* Item Number */}
            <Text style={[styles.listItemNumber, { color: colors.textSecondary }]}>
              {index + 1}
            </Text>

            {/* Item Logo (if available) */}
            {(entry.type === 'brand' || entry.type === 'business') && (
              <View style={[styles.itemLogoContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                {entry.logoUrl ? (
                  <Image
                    source={{ uri: entry.logoUrl }}
                    style={styles.itemLogo}
                    contentFit="contain"
                  />
                ) : null}
              </View>
            )}

            {/* Item Name */}
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                {entry.name || entry.brandName || entry.businessName || 'Item'}
              </Text>
              {entry.type === 'value' && entry.mode && (
                <View style={styles.valueModeBadge}>
                  {entry.mode === 'support' ? (
                    <TrendingUp size={12} color="#10B981" strokeWidth={2} />
                  ) : (
                    <TrendingDown size={12} color="#EF4444" strokeWidth={2} />
                  )}
                  <Text style={[styles.valueModeText, { color: entry.mode === 'support' ? '#10B981' : '#EF4444' }]}>
                    {entry.mode === 'support' ? 'Support' : 'Avoid'}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            {isOwnLibrary && (
              <TouchableOpacity
                style={styles.itemRemoveButton}
                onPress={() => handleRemoveFromList(entry.id, listId)}
                activeOpacity={0.7}
              >
                <Trash2 size={18} color="#EF4444" strokeWidth={2} />
              </TouchableOpacity>
            )}
            {!isOwnLibrary && onShareItem && (
              <TouchableOpacity
                style={styles.itemShareButton}
                onPress={() => onShareItem(entry)}
                activeOpacity={0.7}
              >
                <Share2 size={18} color={colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {/* Add Item Button (for own library) */}
        {isOwnLibrary && onAddItem && (
          <TouchableOpacity
            style={[styles.addItemButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={() => onAddItem(listId)}
            activeOpacity={0.7}
          >
            <Plus size={20} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.addItemText, { color: colors.primary }]}>Add Item</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ===== Main Render =====

  // Use props if provided, otherwise use context
  const endorsementList = propsEndorsementList !== undefined ? propsEndorsementList : library.state.endorsementList;
  const userLists = propsUserLists !== undefined ? propsUserLists : library.state.userLists;
  const expandedListId = library.state.expandedListId;

  // Filter out endorsement list from custom lists
  const customLists = userLists.filter(list => list.id !== endorsementList?.id);

  return (
    <View style={styles.container}>
      {/* 1. Endorsement List - Always first, pinned */}
      {endorsementList && (
        <View>
          {renderListHeader(
            'endorsement',
            endorsementList.name,
            endorsementList.entries?.length || 0,
            expandedListId === 'endorsement',
            {
              isEndorsed: true,
              isPinned: true,
              attribution: `Endorsed by ${endorsementList.creatorName || 'you'}`,
              description: endorsementList.description,
              isPublic: endorsementList.isPublic,
              creatorProfileImage: profileImage,
              canReorder: isOwnLibrary,
              canEdit: isOwnLibrary,
              canRemove: false, // Cannot delete endorsement list
              canCopy: !isOwnLibrary,
              canShare: true,
            }
          )}
          {expandedListId === 'endorsement' && renderListContent(endorsementList.entries || [], 'endorsement')}
        </View>
      )}

      {/* 2. Aligned List (system-generated) */}
      {alignedItems.length > 0 && (
        <View>
          {renderListHeader(
            'aligned',
            'Aligned',
            alignedItems.length,
            expandedListId === 'aligned',
            {
              useAppIcon: true,
              description: 'Brands and businesses aligned with your values',
              isPublic: true,
              canShare: true,
            }
          )}
          {expandedListId === 'aligned' && renderListContent(alignedItems as ListEntry[], 'aligned')}
        </View>
      )}

      {/* 3. Unaligned List (system-generated) */}
      {unalignedItems.length > 0 && (
        <View>
          {renderListHeader(
            'unaligned',
            'Unaligned',
            unalignedItems.length,
            expandedListId === 'unaligned',
            {
              useAppIcon: true,
              description: 'Brands and businesses not aligned with your values',
              isPublic: false,
              canShare: true,
            }
          )}
          {expandedListId === 'unaligned' && renderListContent(unalignedItems as ListEntry[], 'unaligned')}
        </View>
      )}

      {/* 4. Custom Lists */}
      {customLists.map(list => {
        const attribution = list.originalCreatorName
          ? `Originally created by ${list.originalCreatorName}`
          : list.creatorName
          ? `Created by ${list.creatorName}`
          : undefined;

        return (
          <View key={list.id}>
            {renderListHeader(
              list.id,
              list.name,
              list.entries.length,
              expandedListId === list.id,
              {
                attribution,
                description: list.description,
                isPublic: list.isPublic,
                creatorProfileImage: profileImage,
                canReorder: isOwnLibrary,
                canEdit: isOwnLibrary && !list.originalListId,
                canRemove: isOwnLibrary,
                canCopy: !isOwnLibrary,
                canShare: true,
              }
            )}
            {expandedListId === list.id && renderListContent(list.entries, list.id)}
          </View>
        );
      })}

      {/* Empty State */}
      {!endorsementList && customLists.length === 0 && alignedItems.length === 0 && unalignedItems.length === 0 && (
        <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <User size={48} color={colors.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Lists Yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isOwnLibrary ? 'Create your first list to get started' : 'This user has no public lists'}
          </Text>
        </View>
      )}

      {/* Share Modal */}
      {showShareModal && shareItem && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          item={shareItem}
          isDarkMode={isDarkMode}
        />
      )}
    </View>
  );
}

// ===== Styles =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  listHeaderWrapper: {
    marginBottom: 8,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  pinnedListHeader: {
    // Add pinned styling if needed
  },
  listProfileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  listProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  listHeaderContent: {
    flex: 1,
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
    fontWeight: '700',
    flex: 1,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listAttribution: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  listDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  listRowLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  listHeaderOptionsButton: {
    padding: 8,
  },
  listOptionsDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    marginTop: 4,
    gap: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  listContent: {
    borderRadius: 12,
    borderWidth: 1,
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
    fontWeight: '600',
    minWidth: 24,
  },
  itemLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemLogo: {
    width: 28,
    height: 28,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueModeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemRemoveButton: {
    padding: 8,
  },
  itemShareButton: {
    padding: 8,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
  },
  addItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
