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
import { Product } from '@/types';
import { BusinessUser, calculateAlignmentScore } from '@/services/firebase/businessService';
import { useUser } from '@/contexts/UserContext';

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
  alignedItems?: Product[];  // Changed from any[] to Product[]
  unalignedItems?: Product[];  // Changed from any[] to Product[]
  isDarkMode?: boolean;
  profileImage?: string;
  // Additional props for score calculation
  userBusinesses?: BusinessUser[];
  scoredBrands?: Map<string, number>;
  userCauses?: string[];
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
  userBusinesses = [],
  scoredBrands = new Map(),
  userCauses = [],
}: UnifiedLibraryProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const library = useLibrary();
  const { profile } = useUser();

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

  // Render brand card with score (for Product type)
  const renderBrandCard = (product: Product, type: 'support' | 'avoid') => {
    const isSupport = type === 'support';
    const titleColor = isSupport ? colors.primary : colors.danger;
    const alignmentScore = scoredBrands.get(product.id) || 0;

    return (
      <TouchableOpacity
        style={[
          styles.brandCard,
          { backgroundColor: isDarkMode ? colors.backgroundSecondary : 'rgba(0, 0, 0, 0.06)' },
        ]}
        onPress={() => {
          // TODO: Navigate to product details
        }}
        activeOpacity={0.7}
        disabled={!canInteract}
      >
        <View style={styles.brandCardInner}>
          <View style={styles.brandLogoContainer}>
            <Image
              source={{ uri: getLogoUrl(product.website || '') }}
              style={styles.brandLogo}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>
          <View style={styles.brandCardContent}>
            <Text style={[styles.brandName, { color: titleColor }]} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.category}
            </Text>
          </View>
          <View style={styles.brandScoreContainer}>
            <Text style={[styles.brandScore, { color: titleColor }]}>{alignmentScore}</Text>
          </View>
          {mode === 'edit' && (
            <TouchableOpacity
              style={[styles.quickAddButton, { backgroundColor: colors.background }]}
              onPress={(e) => {
                e.stopPropagation();
                // TODO: Show options menu
              }}
              activeOpacity={0.7}
            >
              <MoreVertical size={18} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          )}
          {mode === 'view' && (
            <TouchableOpacity
              style={[styles.quickAddButton, { backgroundColor: colors.background }]}
              onPress={(e) => {
                e.stopPropagation();
                // TODO: Quick add to library
              }}
              activeOpacity={0.7}
            >
              <Plus size={18} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // EXACT copy of Home tab's renderListEntry with score calculation
  const renderListEntry = (entry: ListEntry) => {
    if (!entry) return null;

    switch (entry.type) {
      case 'brand':
        if ('brandId' in entry) {
          const brand = alignedItems.find(b => b.id === entry.brandId) ||
                       unalignedItems.find(b => b.id === entry.brandId);
          if (!brand) {
            // Brand not found - show placeholder
            return (
              <View style={[styles.brandCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={styles.brandCardContent}>
                  <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>
                    {entry.brandName || 'Brand not found'}
                  </Text>
                </View>
              </View>
            );
          }
          // Render brand card with score
          return renderBrandCard(brand, 'support');
        }
        break;

      case 'business':
        if ('businessId' in entry) {
          // Find business to get alignment score
          const businessData = userBusinesses.find(b => b.id === entry.businessId);
          const rawScore = businessData ? calculateAlignmentScore(userCauses || profile?.causes || [], businessData.causes || []) : 0;
          let alignmentScore = Math.round(50 + (rawScore * 0.8));
          alignmentScore = Math.max(10, Math.min(90, alignmentScore));
          const isAligned = alignmentScore >= 50;
          const titleColor = isAligned ? colors.primary : colors.danger;

          return (
            <TouchableOpacity
              style={[
                styles.brandCard,
                { backgroundColor: isDarkMode ? colors.backgroundSecondary : 'rgba(0, 0, 0, 0.06)' },
              ]}
              onPress={() => {
                // TODO: Navigation handled by mode
              }}
              activeOpacity={0.7}
              disabled={!canInteract}
            >
              <View style={styles.brandCardInner}>
                <View style={styles.brandLogoContainer}>
                  <Image
                    source={{ uri: entry.logoUrl || getLogoUrl(entry.website || '') }}
                    style={styles.brandLogo}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </View>
                <View style={styles.brandCardContent}>
                  <Text style={[styles.brandName, { color: titleColor }]} numberOfLines={2}>
                    {entry.businessName}
                  </Text>
                  {entry.businessCategory && (
                    <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                      {entry.businessCategory}
                    </Text>
                  )}
                </View>
                <View style={styles.brandScoreContainer}>
                  <Text style={[styles.brandScore, { color: titleColor }]}>{alignmentScore}</Text>
                </View>
                {mode === 'edit' && (
                  <TouchableOpacity
                    style={[styles.quickAddButton, { backgroundColor: colors.background }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      // TODO: Show options menu
                    }}
                    activeOpacity={0.7}
                  >
                    <MoreVertical size={18} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
                {mode === 'view' && (
                  <TouchableOpacity
                    style={[styles.quickAddButton, { backgroundColor: colors.background }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      // TODO: Quick add to user's library
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus size={18} color={colors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }
        break;

      case 'value':
        if ('valueId' in entry) {
          const isSupport = entry.mode !== 'maxPain';
          const titleColor = isSupport ? colors.primary : colors.danger;

          return (
            <View style={[
              styles.brandCard,
              { backgroundColor: isDarkMode ? colors.backgroundSecondary : 'rgba(0, 0, 0, 0.06)' },
            ]}>
              <View style={styles.brandCardInner}>
                <View style={[
                  styles.brandLogoContainer,
                  {
                    backgroundColor: isSupport ? colors.primary + '20' : colors.danger + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }
                ]}>
                  <Target size={32} color={titleColor} strokeWidth={2} />
                </View>
                <View style={styles.brandCardContent}>
                  <Text style={[styles.brandName, { color: titleColor }]} numberOfLines={2}>
                    {entry.valueName}
                  </Text>
                  <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                    {entry.mode === 'maxPain' ? 'Avoid' : 'Support'}
                  </Text>
                </View>
                {mode === 'view' && (
                  <TouchableOpacity
                    style={[styles.quickAddButton, { backgroundColor: colors.background }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      // TODO: Quick add to user's library
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus size={18} color={colors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }
        break;

      case 'link':
        if ('url' in entry) {
          return (
            <TouchableOpacity
              style={[
                styles.brandCard,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }
              ]}
              onPress={() => canInteract && Linking.openURL(entry.url)}
              activeOpacity={0.7}
              disabled={!canInteract}
            >
              <View style={styles.brandCardContent}>
                <Text style={[styles.brandName, { color: colors.primary }]} numberOfLines={1}>
                  {entry.title}
                </Text>
                {entry.description && (
                  <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={2}>
                    {entry.description}
                  </Text>
                )}
              </View>
              <ExternalLink size={16} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          );
        }
        break;

      case 'text':
        if ('content' in entry) {
          return (
            <View style={[
              styles.brandCard,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }
            ]}>
              <Text style={[styles.brandName, { color: colors.text }]}>
                {entry.content}
              </Text>
            </View>
          );
        }
        break;
    }

    return null;
  };

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

  // Render content for Endorsement list
  const renderEndorsementContent = () => {
    if (!endorsementList) return null;

    if (!endorsementList.entries || endorsementList.entries.length === 0) {
      return (
        <View style={styles.listContentContainer}>
          <View style={[styles.placeholderContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              Your endorsement list is empty. Start adding items!
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.listContentContainer}>
        <View style={styles.brandsContainer}>
          {endorsementList.entries.map((entry, index) => (
            <View key={entry.id} style={styles.forYouItemRow}>
              <Text style={[styles.forYouItemNumber, { color: colors.textSecondary }]}>
                {index + 1}
              </Text>
              <View style={styles.forYouCardWrapper}>
                {renderListEntry(entry)}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render content for Aligned list
  const renderAlignedContent = () => {
    if (alignedItems.length === 0) return null;

    return (
      <View style={styles.listContentContainer}>
        <View style={styles.brandsContainer}>
          {alignedItems.map((product, index) => (
            <View key={product.id} style={styles.forYouItemRow}>
              <Text style={[styles.forYouItemNumber, { color: colors.textSecondary }]}>
                {index + 1}
              </Text>
              <View style={styles.forYouCardWrapper}>
                {renderBrandCard(product, 'support')}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render content for Unaligned list
  const renderUnalignedContent = () => {
    if (unalignedItems.length === 0) return null;

    return (
      <View style={styles.listContentContainer}>
        <View style={styles.brandsContainer}>
          {unalignedItems.map((product, index) => (
            <View key={product.id} style={styles.forYouItemRow}>
              <Text style={[styles.forYouItemNumber, { color: colors.textSecondary }]}>
                {index + 1}
              </Text>
              <View style={styles.forYouCardWrapper}>
                {renderBrandCard(product, 'avoid')}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render content for custom lists
  const renderCustomListContent = (list: UserList) => {
    if (!list.entries || list.entries.length === 0) {
      return (
        <View style={styles.listContentContainer}>
          <View style={[styles.placeholderContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              This list is empty
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.listContentContainer}>
        <View style={styles.brandsContainer}>
          {list.entries.map((entry, index) => (
            <View key={entry.id} style={styles.forYouItemRow}>
              <Text style={[styles.forYouItemNumber, { color: colors.textSecondary }]}>
                {index + 1}
              </Text>
              <View style={styles.forYouCardWrapper}>
                {renderListEntry(entry)}
              </View>
            </View>
          ))}
        </View>
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
          {expandedListId === 'endorsement' && renderEndorsementContent()}
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
          {expandedListId === 'aligned' && renderAlignedContent()}
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
          {expandedListId === 'unaligned' && renderUnalignedContent()}
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
            {expandedListId === list.id && renderCustomListContent(list)}
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
  // Brand card and item row styles from Home tab
  brandsContainer: {
    gap: 8,
  },
  forYouItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  forYouItemNumber: {
    fontSize: 12,
    fontWeight: '500',
    paddingTop: 20,
    minWidth: 20,
    textAlign: 'right',
    marginLeft: -4,
  },
  forYouCardWrapper: {
    flex: 1,
  },
  brandCard: {
    borderRadius: 10,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'visible',
    width: '100%',
  },
  brandCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    overflow: 'visible',
    borderRadius: 10,
  },
  brandLogoContainer: {
    width: 56,
    height: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    overflow: 'hidden',
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  brandCardContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  brandScoreContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandScore: {
    fontSize: 17,
    fontWeight: '700',
  },
  brandName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  brandCategory: {
    fontSize: 11,
    opacity: 0.7,
  },
  quickAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  placeholderContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  placeholderText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
