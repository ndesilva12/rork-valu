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
  Alert,
  Pressable,
  Share,
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
  GripVertical,
  Edit,
  Trash2,
  Share2,
} from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { UserList, ListEntry } from '@/types/library';
import { useLibrary } from '@/contexts/LibraryContext';
import EndorsedBadge from '@/components/EndorsedBadge';
import { getLogoUrl } from '@/lib/logo';
import { Product } from '@/types';
import { BusinessUser, calculateAlignmentScore } from '@/services/firebase/businessService';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import { updateListMetadata } from '@/services/firebase/listService';

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
  const router = useRouter();

  // Local state for independent expansion in each location
  const [localExpandedListId, setLocalExpandedListId] = useState<string | null>(null);
  const [localSelectedListId, setLocalSelectedListId] = useState<string | null>(null);
  const [activeListOptionsId, setActiveListOptionsId] = useState<string | null>(null);
  const [activeItemOptionsId, setActiveItemOptionsId] = useState<string | null>(null);

  // Pagination state for each list
  const [endorsementLoadCount, setEndorsementLoadCount] = useState(10);
  const [alignedLoadCount, setAlignedLoadCount] = useState(10);
  const [unalignedLoadCount, setUnalignedLoadCount] = useState(10);
  const [customListLoadCounts, setCustomListLoadCounts] = useState<Record<string, number>>({});

  // Mode-based permissions
  const canEdit = mode === 'edit';
  const canInteract = mode !== 'preview'; // Can add/share in view mode
  const canBrowse = true; // All modes can expand/collapse to browse

  // Use props if provided, otherwise use context
  const endorsementList = propsEndorsementList !== undefined ? propsEndorsementList : library.state.endorsementList;
  const userLists = propsUserLists !== undefined ? propsUserLists : library.state.userLists;

  // Use context state for edit mode, local state for preview/view modes
  const expandedListId = mode === 'edit' ? library.state.expandedListId : localExpandedListId;
  const selectedListId = mode === 'edit' ? library.state.selectedListId : localSelectedListId;

  const toggleListExpansion = (listId: string) => {
    if (!canBrowse) return;

    if (mode === 'edit') {
      // Home tab uses context
      library.toggleListExpansion(listId);
      library.setSelectedList(listId);
    } else {
      // Profile/User profile use local state
      setLocalSelectedListId(listId);
      if (localExpandedListId === listId) {
        setLocalExpandedListId(null);
      } else {
        setLocalExpandedListId(listId);
      }
    }
  };

  // Filter out endorsement list from custom lists
  const customLists = userLists.filter(list => list.id !== endorsementList?.id);

  // Share handlers
  const handleShareList = async (list: UserList) => {
    try {
      const message = `Check out my list "${list.name}" on Upright Money!\n${list.description || ''}`;
      await Share.share({
        message,
        title: list.name,
      });
    } catch (error) {
      console.error('Error sharing list:', error);
    }
  };

  const handleShareItem = async (entry: ListEntry) => {
    try {
      let message = '';
      let title = '';

      switch (entry.type) {
        case 'brand':
          const brandName = (entry as any).brandName || (entry as any).name || 'Brand';
          title = brandName;
          message = `Check out ${brandName} on Upright Money!`;
          break;
        case 'business':
          const businessName = (entry as any).businessName || (entry as any).name || 'Business';
          title = businessName;
          message = `Check out ${businessName} on Upright Money!`;
          break;
        case 'value':
          const valueName = (entry as any).valueName || (entry as any).name || 'Value';
          title = valueName;
          message = `I value ${valueName}`;
          break;
        case 'link':
          const linkTitle = (entry as any).title || (entry as any).name || 'Link';
          title = linkTitle;
          message = `${linkTitle}\n${(entry as any).url}`;
          break;
        case 'text':
          const textContent = (entry as any).content || (entry as any).text || '';
          title = 'Shared Note';
          message = textContent;
          break;
      }

      await Share.share({
        message,
        title,
      });
    } catch (error) {
      console.error('Error sharing item:', error);
    }
  };

  // Privacy toggle handler
  const handleTogglePrivacy = async (listId: string, currentStatus: boolean) => {
    try {
      await updateListMetadata(listId, { isPublic: !currentStatus });
      // Reload lists to reflect the change
      if (currentUserId) {
        await library.loadUserLists(currentUserId, true);
      }
    } catch (error) {
      console.error('Error toggling privacy:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to update privacy setting. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to update privacy setting. Please try again.');
      }
    }
  };

  // Add to Library handler
  const handleAddToLibrary = async (entry: ListEntry) => {
    // Get available lists (user's own lists from context)
    const availableLists = [
      ...(endorsementList ? [endorsementList] : []),
      ...customLists,
    ];

    if (availableLists.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('You need to create a list first.');
      } else {
        Alert.alert('No Lists', 'You need to create a list first.');
      }
      return;
    }

    // Show list selection
    if (Platform.OS === 'web') {
      const listNames = availableLists.map((l, i) => `${i + 1}. ${l.name}`).join('\n');
      const selection = window.prompt(`Add to which list?\n\n${listNames}\n\nEnter number (1-${availableLists.length}):`);

      if (selection) {
        const index = parseInt(selection) - 1;
        if (index >= 0 && index < availableLists.length) {
          const selectedList = availableLists[index];
          try {
            await library.addEntry(selectedList.id, entry);
            window.alert(`Added to "${selectedList.name}"`);
          } catch (error: any) {
            window.alert(error.message || 'Failed to add item');
          }
        }
      }
    } else {
      // For native, create action sheet options
      Alert.alert(
        'Add to Library',
        'Select a list:',
        [
          ...availableLists.map(list => ({
            text: list.name,
            onPress: async () => {
              try {
                await library.addEntry(list.id, entry);
                Alert.alert('Success', `Added to "${list.name}"`);
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to add item');
              }
            },
          })),
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  // Edit list handler
  const handleEditList = (list: UserList) => {
    if (Platform.OS === 'web') {
      const newName = window.prompt('List name:', list.name);
      if (newName !== null && newName.trim() !== '') {
        const newDescription = window.prompt('Description (optional):', list.description || '');
        updateListMetadata(list.id, {
          name: newName.trim(),
          description: newDescription?.trim() || '',
        }).then(() => {
          if (currentUserId) {
            library.loadUserLists(currentUserId, true);
          }
        }).catch(error => {
          console.error('Error updating list:', error);
          window.alert('Failed to update list. Please try again.');
        });
      }
    } else {
      // For native, use Alert with multiple prompts
      Alert.prompt(
        'Edit List',
        'Enter new name:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Next',
            onPress: (newName) => {
              if (newName && newName.trim() !== '') {
                Alert.prompt(
                  'Edit List',
                  'Enter description (optional):',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Save',
                      onPress: (newDescription) => {
                        updateListMetadata(list.id, {
                          name: newName.trim(),
                          description: newDescription?.trim() || '',
                        }).then(() => {
                          if (currentUserId) {
                            library.loadUserLists(currentUserId, true);
                          }
                        }).catch(error => {
                          console.error('Error updating list:', error);
                          Alert.alert('Error', 'Failed to update list. Please try again.');
                        });
                      },
                    },
                  ],
                  'plain-text',
                  list.description || ''
                );
              }
            },
          },
        ],
        'plain-text',
        list.name
      );
    }
  };

  // Render brand card with score (for Product type)
  const renderBrandCard = (product: Product, type: 'support' | 'avoid') => {
    const isSupport = type === 'support';
    const alignmentScore = scoredBrands.get(product.id);
    const scoreColor = alignmentScore !== undefined
      ? (alignmentScore >= 50 ? colors.primary : colors.danger)
      : colors.textSecondary;

    return (
      <TouchableOpacity
        style={[
          styles.brandCard,
          { backgroundColor: isDarkMode ? colors.backgroundSecondary : 'rgba(0, 0, 0, 0.06)' },
        ]}
        onPress={() => {
          router.push({
            pathname: '/brand/[id]',
            params: { id: product.id },
          });
        }}
        activeOpacity={0.7}
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
            <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={2}>
              {product.name || 'Unknown Brand'}
            </Text>
            {product.category && (
              <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                {product.category}
              </Text>
            )}
          </View>
          {alignmentScore !== undefined && (
            <View style={styles.brandScoreContainer}>
              <Text style={[styles.brandScore, { color: scoreColor }]}>{alignmentScore}</Text>
            </View>
          )}
          {(mode === 'edit' || mode === 'view') && (
            <TouchableOpacity
              style={[styles.quickAddButton, { backgroundColor: colors.background }]}
              onPress={(e) => {
                e.stopPropagation();
                setActiveItemOptionsId(product.id);
              }}
              activeOpacity={0.7}
            >
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <MoreVertical size={18} color={colors.textSecondary} strokeWidth={2} />
              </View>
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
          if (brand) {
            // Brand found - render with full data and score
            return renderBrandCard(brand, 'support');
          }

          // Brand not in aligned/unaligned arrays - render using entry data
          // Get brand name from multiple possible fields
          const brandName = (entry as any).brandName || (entry as any).name || 'Unknown Brand';
          const brandCategory = (entry as any).brandCategory || (entry as any).category;
          const logoUrl = (entry as any).logoUrl || getLogoUrl((entry as any).website || '');

          return (
            <TouchableOpacity
              style={[
                styles.brandCard,
                { backgroundColor: isDarkMode ? colors.backgroundSecondary : 'rgba(0, 0, 0, 0.06)' },
              ]}
              onPress={() => {
                router.push({
                  pathname: '/brand/[id]',
                  params: { id: entry.brandId },
                });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.brandCardInner}>
                <View style={styles.brandLogoContainer}>
                  <Image
                    source={{ uri: logoUrl }}
                    style={styles.brandLogo}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </View>
                <View style={styles.brandCardContent}>
                  <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={2}>
                    {brandName}
                  </Text>
                  {brandCategory && (
                    <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                      {brandCategory}
                    </Text>
                  )}
                </View>
                {(mode === 'edit' || mode === 'view') && (
                  <TouchableOpacity
                    style={[styles.quickAddButton, { backgroundColor: colors.background }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setActiveItemOptionsId(entry.brandId);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ transform: [{ rotate: '90deg' }] }}>
                      <MoreVertical size={18} color={colors.textSecondary} strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }
        break;

      case 'business':
        if ('businessId' in entry) {
          // Calculate score only if we have the data
          const businessData = userBusinesses.find(b => b.id === entry.businessId);
          const causes = userCauses || profile?.causes || [];
          let alignmentScore: number | null = null;
          let scoreColor = colors.textSecondary;

          if (businessData && causes.length > 0) {
            const rawScore = calculateAlignmentScore(causes, businessData.causes || []);
            alignmentScore = Math.round(50 + (rawScore * 0.8));
            alignmentScore = Math.max(10, Math.min(90, alignmentScore));
            const isAligned = alignmentScore >= 50;
            scoreColor = isAligned ? colors.primary : colors.danger;
          }

          // Get business name from multiple possible fields
          const businessName = (entry as any).businessName || (entry as any).name || 'Unknown Business';
          const businessCategory = (entry as any).businessCategory || (entry as any).category;
          const logoUrl = (entry as any).logoUrl || getLogoUrl((entry as any).website || '');

          return (
            <TouchableOpacity
              style={[
                styles.brandCard,
                { backgroundColor: isDarkMode ? colors.backgroundSecondary : 'rgba(0, 0, 0, 0.06)' },
              ]}
              onPress={() => {
                router.push({
                  pathname: '/business/[id]',
                  params: { id: entry.businessId },
                });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.brandCardInner}>
                <View style={styles.brandLogoContainer}>
                  <Image
                    source={{ uri: logoUrl }}
                    style={styles.brandLogo}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </View>
                <View style={styles.brandCardContent}>
                  <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={2}>
                    {businessName}
                  </Text>
                  {businessCategory && (
                    <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                      {businessCategory}
                    </Text>
                  )}
                </View>
                {alignmentScore !== null && (
                  <View style={styles.brandScoreContainer}>
                    <Text style={[styles.brandScore, { color: scoreColor }]}>{alignmentScore}</Text>
                  </View>
                )}
                {(mode === 'edit' || mode === 'view') && (
                  <TouchableOpacity
                    style={[styles.quickAddButton, { backgroundColor: colors.background }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setActiveItemOptionsId(entry.businessId);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ transform: [{ rotate: '90deg' }] }}>
                      <MoreVertical size={18} color={colors.textSecondary} strokeWidth={2} />
                    </View>
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
          const iconColor = isSupport ? colors.primary : colors.danger;
          const valueName = (entry as any).valueName || (entry as any).name || 'Unknown Value';

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
                  <Target size={32} color={iconColor} strokeWidth={2} />
                </View>
                <View style={styles.brandCardContent}>
                  <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={2}>
                    {valueName}
                  </Text>
                  <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                    {entry.mode === 'maxPain' ? 'Avoid' : 'Support'}
                  </Text>
                </View>
                {(mode === 'edit' || mode === 'view') && (
                  <TouchableOpacity
                    style={[styles.quickAddButton, { backgroundColor: colors.background }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setActiveItemOptionsId(entry.valueId);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ transform: [{ rotate: '90deg' }] }}>
                      <MoreVertical size={18} color={colors.textSecondary} strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }
        break;

      case 'link':
        if ('url' in entry) {
          const linkTitle = (entry as any).title || (entry as any).name || 'Link';
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
              <View style={styles.brandCardInner}>
                <View style={styles.brandCardContent}>
                  <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>
                    {linkTitle}
                  </Text>
                  {(entry as any).description && (
                    <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={2}>
                      {(entry as any).description}
                    </Text>
                  )}
                </View>
                <ExternalLink size={16} color={colors.textSecondary} strokeWidth={2} />
                {(mode === 'edit' || mode === 'view') && (
                  <TouchableOpacity
                    style={[styles.quickAddButton, { backgroundColor: colors.background }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setActiveItemOptionsId(entry.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ transform: [{ rotate: '90deg' }] }}>
                      <MoreVertical size={18} color={colors.textSecondary} strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }
        break;

      case 'text':
        if ('content' in entry) {
          const textContent = (entry as any).content || (entry as any).text || 'No content';
          return (
            <View style={[
              styles.brandCard,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }
            ]}>
              <View style={styles.brandCardInner}>
                <View style={styles.brandCardContent}>
                  <Text style={[styles.brandName, { color: colors.text }]}>
                    {textContent}
                  </Text>
                </View>
                {(mode === 'edit' || mode === 'view') && (
                  <TouchableOpacity
                    style={[styles.quickAddButton, { backgroundColor: colors.background }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setActiveItemOptionsId(entry.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ transform: [{ rotate: '90deg' }] }}>
                      <MoreVertical size={18} color={colors.textSecondary} strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
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
                            {Platform.OS !== 'web' && <Text style={[styles.privacyText, { color: colors.primary }]} numberOfLines={1}>Public</Text>}
                          </>
                        ) : (
                          <>
                            <Lock size={12} color={colors.textSecondary} strokeWidth={2} />
                            {Platform.OS !== 'web' && <Text style={[styles.privacyText, { color: colors.textSecondary }]} numberOfLines={1}>Private</Text>}
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
          {canEdit && (
            <TouchableOpacity
              style={styles.listHeaderOptionsButton}
              onPress={() => {
                setActiveListOptionsId(isOptionsOpen ? null : listId);
              }}
              activeOpacity={0.7}
            >
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <MoreVertical size={20} color={colors.textSecondary} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Options dropdown - only in edit mode */}
        {canEdit && isOptionsOpen && (
          <View style={[styles.listOptionsDropdown, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            {(() => {
              // Determine which options to show based on list type
              const isEndorsementList = listId === 'endorsement';
              const isSystemList = listId === 'aligned' || listId === 'unaligned';
              const currentList = isEndorsementList ? endorsementList : userLists.find(l => l.id === listId);

              const canReorder = !isSystemList;
              const canEditMeta = !isSystemList;
              const canRemove = !isEndorsementList && !isSystemList;
              const canTogglePrivacy = isPublic !== undefined;

              return (
                <>
                  {canReorder && (
                    <TouchableOpacity
                      style={styles.listOptionItem}
                      onPress={() => {
                        setActiveListOptionsId(null);
                        // TODO: Enable reorder mode
                        console.log('Reorder mode for list:', listId);
                      }}
                      activeOpacity={0.7}
                    >
                      <GripVertical size={16} color={colors.text} strokeWidth={2} />
                      <Text style={[styles.listOptionText, { color: colors.text }]}>Reorder</Text>
                    </TouchableOpacity>
                  )}

                  {canEditMeta && currentList && (
                    <TouchableOpacity
                      style={styles.listOptionItem}
                      onPress={() => {
                        setActiveListOptionsId(null);
                        handleEditList(currentList);
                      }}
                      activeOpacity={0.7}
                    >
                      <Edit size={16} color={colors.text} strokeWidth={2} />
                      <Text style={[styles.listOptionText, { color: colors.text }]}>Edit</Text>
                    </TouchableOpacity>
                  )}

                  {currentList && (
                    <TouchableOpacity
                      style={styles.listOptionItem}
                      onPress={() => {
                        setActiveListOptionsId(null);
                        handleShareList(currentList);
                      }}
                      activeOpacity={0.7}
                    >
                      <Share2 size={16} color={colors.text} strokeWidth={2} />
                      <Text style={[styles.listOptionText, { color: colors.text }]}>Share</Text>
                    </TouchableOpacity>
                  )}

                  {canTogglePrivacy && (
                    <TouchableOpacity
                      style={styles.listOptionItem}
                      onPress={() => {
                        setActiveListOptionsId(null);
                        handleTogglePrivacy(listId, isPublic || false);
                      }}
                      activeOpacity={0.7}
                    >
                      {isPublic ? (
                        <>
                          <Lock size={16} color={colors.text} strokeWidth={2} />
                          <Text style={[styles.listOptionText, { color: colors.text }]}>Make Private</Text>
                        </>
                      ) : (
                        <>
                          <Globe size={16} color={colors.text} strokeWidth={2} />
                          <Text style={[styles.listOptionText, { color: colors.text }]}>Make Public</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {canRemove && currentList && (
                    <TouchableOpacity
                      style={styles.listOptionItem}
                      onPress={() => {
                        setActiveListOptionsId(null);
                        if (Platform.OS === 'web') {
                          if (window.confirm(`Are you sure you want to delete "${currentList.name}"? This cannot be undone.`)) {
                            library.removeList(currentList.id);
                          }
                        } else {
                          Alert.alert(
                            'Delete List',
                            `Are you sure you want to delete "${currentList.name}"? This cannot be undone.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => library.removeList(currentList.id) },
                            ]
                          );
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                      <Text style={[styles.listOptionText, { color: '#EF4444', fontWeight: '700' }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}
          </View>
        )}
      </View>
    );
  };

  // Helper to render item options menu
  const renderItemOptionsMenu = (itemId: string, entry: ListEntry, listId: string) => {
    const isOpen = activeItemOptionsId === itemId;
    if (!isOpen) return null;

    const canRemove = canEdit;
    const canShare = true;
    const canAddToLibrary = mode === 'view';

    return (
      <View style={[styles.itemOptionsDropdown, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
        {canAddToLibrary && (
          <TouchableOpacity
            style={styles.listOptionItem}
            onPress={() => {
              setActiveItemOptionsId(null);
              handleAddToLibrary(entry);
            }}
            activeOpacity={0.7}
          >
            <Plus size={16} color={colors.text} strokeWidth={2} />
            <Text style={[styles.listOptionText, { color: colors.text }]}>Add to Library</Text>
          </TouchableOpacity>
        )}
        {canShare && (
          <TouchableOpacity
            style={styles.listOptionItem}
            onPress={() => {
              setActiveItemOptionsId(null);
              handleShareItem(entry);
            }}
            activeOpacity={0.7}
          >
            <Share2 size={16} color={colors.text} strokeWidth={2} />
            <Text style={[styles.listOptionText, { color: colors.text }]}>Share</Text>
          </TouchableOpacity>
        )}
        {canRemove && (
          <TouchableOpacity
            style={styles.listOptionItem}
            onPress={() => {
              setActiveItemOptionsId(null);
              // Remove item from list
              library.removeEntry(listId, entry.id);
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color="#EF4444" strokeWidth={2} />
            <Text style={[styles.listOptionText, { color: '#EF4444', fontWeight: '700' }]}>Remove</Text>
          </TouchableOpacity>
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
          {endorsementList.entries.slice(0, endorsementLoadCount).map((entry, index) => {
            const itemId = entry.brandId || entry.businessId || entry.valueId || entry.id;
            return (
              <View key={entry.id}>
                <View style={styles.forYouItemRow}>
                  <Text style={[styles.forYouItemNumber, { color: colors.textSecondary }]}>
                    {index + 1}
                  </Text>
                  <View style={styles.forYouCardWrapper}>
                    {renderListEntry(entry)}
                  </View>
                </View>
                {renderItemOptionsMenu(itemId, entry, endorsementList.id)}
              </View>
            );
          })}
          {endorsementLoadCount < endorsementList.entries.length && (
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setEndorsementLoadCount(endorsementLoadCount + 10)}
              activeOpacity={0.7}
            >
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                Load More ({endorsementList.entries.length - endorsementLoadCount} remaining)
              </Text>
            </TouchableOpacity>
          )}
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
          {alignedItems.slice(0, alignedLoadCount).map((product, index) => (
            <View key={product.id} style={styles.forYouItemRow}>
              <Text style={[styles.forYouItemNumber, { color: colors.textSecondary }]}>
                {index + 1}
              </Text>
              <View style={styles.forYouCardWrapper}>
                {renderBrandCard(product, 'support')}
              </View>
            </View>
          ))}
          {alignedLoadCount < alignedItems.length && (
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setAlignedLoadCount(alignedLoadCount + 10)}
              activeOpacity={0.7}
            >
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                Load More ({alignedItems.length - alignedLoadCount} remaining)
              </Text>
            </TouchableOpacity>
          )}
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
          {unalignedItems.slice(0, unalignedLoadCount).map((product, index) => (
            <View key={product.id} style={styles.forYouItemRow}>
              <Text style={[styles.forYouItemNumber, { color: colors.textSecondary }]}>
                {index + 1}
              </Text>
              <View style={styles.forYouCardWrapper}>
                {renderBrandCard(product, 'avoid')}
              </View>
            </View>
          ))}
          {unalignedLoadCount < unalignedItems.length && (
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setUnalignedLoadCount(unalignedLoadCount + 10)}
              activeOpacity={0.7}
            >
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                Load More ({unalignedItems.length - unalignedLoadCount} remaining)
              </Text>
            </TouchableOpacity>
          )}
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

    const loadCount = customListLoadCounts[list.id] || 10;

    return (
      <View style={styles.listContentContainer}>
        <View style={styles.brandsContainer}>
          {list.entries.slice(0, loadCount).map((entry, index) => {
            const itemId = entry.brandId || entry.businessId || entry.valueId || entry.id;
            return (
              <View key={entry.id}>
                <View style={styles.forYouItemRow}>
                  <Text style={[styles.forYouItemNumber, { color: colors.textSecondary }]}>
                    {index + 1}
                  </Text>
                  <View style={styles.forYouCardWrapper}>
                    {renderListEntry(entry)}
                  </View>
                </View>
                {renderItemOptionsMenu(itemId, entry, list.id)}
              </View>
            );
          })}
          {loadCount < list.entries.length && (
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setCustomListLoadCounts({ ...customListLoadCounts, [list.id]: loadCount + 10 })}
              activeOpacity={0.7}
            >
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                Load More ({list.entries.length - loadCount} remaining)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Close all menus when clicking outside
  const handlePressOutside = () => {
    if (activeListOptionsId !== null) {
      setActiveListOptionsId(null);
    }
    if (activeItemOptionsId !== null) {
      setActiveItemOptionsId(null);
    }
  };

  return (
    <Pressable style={styles.libraryDirectory} onPress={handlePressOutside}>
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
    </Pressable>
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
    paddingHorizontal: Platform.OS === 'web' ? 2 : 8,
    marginHorizontal: Platform.OS === 'web' ? 4 : 16,
    marginVertical: 3,
  },
  listContentContainer: {
    marginHorizontal: Platform.OS === 'web' ? 8 : 16,
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
    position: 'absolute',
    top: 42,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 999,
    zIndex: 999999,
  },
  itemOptionsDropdown: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
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
  loadMoreButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
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
