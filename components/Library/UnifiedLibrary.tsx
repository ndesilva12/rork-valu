/**
 * UnifiedLibrary Component
 * EXACTLY matches Home tab's library visual appearance
 * Functionality controlled by mode prop
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import {
  ChevronDown,
  ChevronRight,
  User,
  Globe,
  Lock,
  MoreVertical,
  Target,
  ExternalLink,
  Plus,
} from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { UserList, ListEntry } from '@/types/library';
import { useLibrary } from '@/contexts/LibraryContext';
import EndorsedBadge from '@/components/EndorsedBadge';
import { getLogoUrl } from '@/lib/logo';

// ===== Types =====

interface UnifiedLibraryProps {
  mode: 'edit' | 'preview' | 'view';
  // 'edit' = Home tab - full editing
  // 'preview' = Profile tab - view only (what others see)
  // 'view' = Profile details - can add/share

  currentUserId?: string;
  viewingUserId?: string;
  userLists?: UserList[];
  endorsementList?: UserList | null;
  alignedItems?: any[];
  unalignedItems?: any[];
  isDarkMode?: boolean;
  profileImage?: string;
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
}: UnifiedLibraryProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const library = useLibrary();

  const [activeListOptionsId, setActiveListOptionsId] = useState<string | null>(null);

  // Mode-based permissions
  const canInteract = mode !== 'preview';

  // Use props if provided, otherwise use context
  const endorsementList = propsEndorsementList !== undefined ? propsEndorsementList : library.state.endorsementList;
  const userLists = propsUserLists !== undefined ? propsUserLists : library.state.userLists;
  const expandedListId = library.state.expandedListId;
  const selectedListId = library.state.selectedListId;

  const toggleListExpansion = (listId: string) => {
    if (!canInteract) return;
    library.toggleListExpansion(listId);
    library.setSelectedList(listId);
  };

  // Filter out endorsement list from custom lists
  const customLists = userLists.filter(list => list.id !== endorsementList?.id);

  // EXACT copy of Home tab's renderCollapsibleListHeader
  const renderCollapsibleListHeader = (
    listId: string,
    title: string,
    itemCount: number,
    isExpanded: boolean,
    isEndorsed: boolean = false,
    isPinned: boolean = false,
    attribution?: string,
    description?: string,
    isPublic?: boolean,
    creatorProfileImage?: string,
    useAppIcon?: boolean
  ) => {
    const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;
    const isOptionsOpen = activeListOptionsId === listId;
    const isSelected = selectedListId === listId;

    return (
      <View>
        <View
          style={[
            styles.collapsibleListHeader,
            isPinned && styles.pinnedListHeader,
            isExpanded && { backgroundColor: colors.backgroundSecondary, borderWidth: 2, borderColor: colors.primary, borderRadius: 12 },
            !isExpanded && isSelected && { borderWidth: 2, borderColor: colors.primary, borderRadius: 12 },
          ]}
        >
          {/* Profile Image */}
          <View style={[styles.listProfileImageContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            {useAppIcon ? (
              <Image
                source={require('@/assets/images/endorse1.png')}
                style={styles.listProfileImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : creatorProfileImage ? (
              <Image
                source={{ uri: creatorProfileImage }}
                style={styles.listProfileImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <User size={24} color={colors.textSecondary} strokeWidth={2} />
            )}
          </View>

          <TouchableOpacity
            style={styles.collapsibleListHeaderContent}
            onPress={() => toggleListExpansion(listId)}
            activeOpacity={0.7}
            disabled={!canInteract}
          >
            <View style={styles.collapsibleListInfo}>
              {isExpanded ? (
                // Expanded view - stacked layout
                <>
                  <View style={styles.collapsibleListTitleRow}>
                    <ChevronIcon size={20} color={colors.text} strokeWidth={2} />
                    <Text style={[styles.collapsibleListTitle, { color: colors.text }]}>
                      {title}
                    </Text>
                    {isEndorsed && <EndorsedBadge isDarkMode={isDarkMode} size="small" showText={false} />}
                  </View>
                  <View style={styles.collapsibleListMeta}>
                    <Text style={[styles.collapsibleListCount, { color: colors.textSecondary }]}>
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
                    <Text style={[styles.collapsibleListAttribution, { color: colors.textSecondary }]}>
                      {attribution}
                    </Text>
                  )}
                  {description && (
                    <Text style={[styles.collapsibleListDescription, { color: colors.text }]} numberOfLines={2}>
                      {description}
                    </Text>
                  )}
                </>
              ) : (
                // Collapsed view - horizontal layout
                <View style={styles.collapsibleListRowLayout}>
                  <View style={styles.collapsibleListTitleRow}>
                    <ChevronIcon size={20} color={colors.text} strokeWidth={2} />
                    <Text style={[styles.collapsibleListTitle, { color: colors.text }]} numberOfLines={1}>
                      {title}
                    </Text>
                    {isEndorsed && <EndorsedBadge isDarkMode={isDarkMode} size="small" showText={false} />}
                  </View>
                  <View style={styles.collapsibleListMetaRow}>
                    <Text style={[styles.collapsibleListCount, { color: colors.textSecondary }]} numberOfLines={1}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </Text>
                    {isPublic !== undefined && (
                      <View style={styles.privacyIndicator}>
                        {isPublic ? (
                          <>
                            <Globe size={12} color={colors.primary} strokeWidth={2} />
                            <Text style={[styles.privacyText, { color: colors.primary }]} numberOfLines={1}>Public</Text>
                          </>
                        ) : (
                          <>
                            <Lock size={12} color={colors.textSecondary} strokeWidth={2} />
                            <Text style={[styles.privacyText, { color: colors.textSecondary }]} numberOfLines={1}>Private</Text>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Three-dot menu - only show in edit mode */}
          {mode === 'edit' && (
            <TouchableOpacity
              style={[styles.listHeaderOptionsButton, { transform: [{ rotate: '90deg' }] }]}
              onPress={(e) => {
                setActiveListOptionsId(isOptionsOpen ? null : listId);
              }}
              activeOpacity={0.7}
            >
              <MoreVertical size={20} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Options dropdown - only in edit mode */}
        {mode === 'edit' && isOptionsOpen && (
          <View style={[styles.listOptionsDropdown, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Text style={[styles.listOptionText, { color: colors.textSecondary, padding: 12 }]}>
              Options menu (to be implemented)
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.libraryDirectory}>
      {/* 1. Endorsement List - Always first, pinned */}
      {endorsementList && (
        <>
          {renderCollapsibleListHeader(
            'endorsement',
            endorsementList.name,
            endorsementList.entries?.length || 0,
            expandedListId === 'endorsement',
            true,
            true,
            `Endorsed by ${endorsementList.creatorName || 'you'}`,
            endorsementList.description,
            endorsementList.isPublic,
            profileImage
          )}
          {expandedListId === 'endorsement' && (
            <View style={styles.listContentContainer}>
              <Text style={[styles.collapsibleListCount, { color: colors.textSecondary }]}>
                {endorsementList.entries?.length || 0} items (content rendering to be added)
              </Text>
            </View>
          )}
        </>
      )}

      {/* 2. Aligned List */}
      {alignedItems.length > 0 && (
        <>
          {renderCollapsibleListHeader(
            'aligned',
            'Aligned',
            alignedItems.length,
            expandedListId === 'aligned',
            false,
            false,
            undefined,
            'Brands and businesses aligned with your values',
            true,
            undefined,
            true
          )}
          {expandedListId === 'aligned' && (
            <View style={styles.listContentContainer}>
              <Text style={[styles.collapsibleListCount, { color: colors.textSecondary }]}>
                {alignedItems.length} items (content rendering to be added)
              </Text>
            </View>
          )}
        </>
      )}

      {/* 3. Unaligned List */}
      {unalignedItems.length > 0 && (
        <>
          {renderCollapsibleListHeader(
            'unaligned',
            'Unaligned',
            unalignedItems.length,
            expandedListId === 'unaligned',
            false,
            false,
            undefined,
            'Brands and businesses not aligned with your values',
            false,
            undefined,
            true
          )}
          {expandedListId === 'unaligned' && (
            <View style={styles.listContentContainer}>
              <Text style={[styles.collapsibleListCount, { color: colors.textSecondary }]}>
                {unalignedItems.length} items (content rendering to be added)
              </Text>
            </View>
          )}
        </>
      )}

      {/* 4. Custom Lists */}
      {customLists.map(list => {
        const attribution = list.originalCreatorName
          ? `Originally created by ${list.originalCreatorName}`
          : list.creatorName
          ? `Created by ${list.creatorName}`
          : undefined;

        return (
          <React.Fragment key={list.id}>
            {renderCollapsibleListHeader(
              list.id,
              list.name,
              list.entries.length,
              expandedListId === list.id,
              false,
              false,
              attribution,
              list.description,
              list.isPublic,
              profileImage
            )}
            {expandedListId === list.id && (
              <View style={styles.listContentContainer}>
                <Text style={[styles.collapsibleListCount, { color: colors.textSecondary }]}>
                  {list.entries.length} items (content rendering to be added)
                </Text>
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// EXACT copy of Home tab styles
const styles = StyleSheet.create({
  libraryDirectory: {
    flex: 1,
  },
  collapsibleListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: Platform.OS === 'web' ? 4 : 8,
    marginHorizontal: Platform.OS === 'web' ? 8 : 16,
    marginVertical: 3,
  },
  listContentContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  pinnedListHeader: {
    // No special styling for pinned headers
  },
  collapsibleListHeaderContent: {
    flex: 1,
  },
  listProfileImageContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  listProfileImage: {
    width: '100%',
    height: '100%',
  },
  collapsibleListRowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  collapsibleListMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listHeaderOptionsButton: {
    padding: 4,
    marginLeft: 8,
  },
  listOptionsDropdown: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  listOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  collapsibleListInfo: {
    flex: 1,
  },
  collapsibleListTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  collapsibleListTitle: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  collapsibleListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 26,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  collapsibleListCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  collapsibleListAttribution: {
    fontSize: 11,
    fontStyle: 'italic',
    marginLeft: 26,
    marginBottom: 2,
  },
  collapsibleListDescription: {
    fontSize: 12,
    marginLeft: 26,
    lineHeight: 16,
  },
});
