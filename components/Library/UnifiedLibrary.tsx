/**
 * UnifiedLibrary Component
 * EXACTLY matches Home tab's library visual appearance
 * Functionality controlled by mode prop
 */
import React, { useState, useEffect } from 'react';
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
  Modal,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import {
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  GripVertical,
  User,
  Globe,
  Lock,
  MoreVertical,
  Target,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Share2,
  UserPlus,
  List as ListIcon,
} from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { UserList, ListEntry } from '@/types/library';
import { useLibrary } from '@/contexts/LibraryContext';
import { useData } from '@/contexts/DataContext';
import EndorsedBadge from '@/components/EndorsedBadge';
import { getLogoUrl } from '@/lib/logo';
import { Product } from '@/types';
import { BusinessUser } from '@/services/firebase/businessService';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import { updateListMetadata, copyListToLibrary } from '@/services/firebase/listService';
import { followEntity, unfollowEntity, isFollowing as checkIsFollowing } from '@/services/firebase/followService';
import AddToLibraryModal from '@/components/AddToLibraryModal';
import EditListModal from '@/components/EditListModal';
import ShareOptionsModal from '@/components/ShareOptionsModal';
import ItemOptionsModal from '@/components/ItemOptionsModal';
import ConfirmModal from '@/components/ConfirmModal';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { reorderListEntries } from '@/services/firebase/listService';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const { brands } = useData();

  // Use context's expandedListId for persistent state across navigation
  const openedListId = library.state.expandedListId;
  const [activeListOptionsId, setActiveListOptionsId] = useState<string | null>(null);
  const [showAddToLibraryModal, setShowAddToLibraryModal] = useState(false);
  const [selectedItemToAdd, setSelectedItemToAdd] = useState<ListEntry | null>(null);

  // Edit List Modal state
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [editingList, setEditingList] = useState<UserList | null>(null);

  // Share Options Modal state
  const [showShareOptionsModal, setShowShareOptionsModal] = useState(false);
  const [sharingItem, setSharingItem] = useState<{type: 'list' | 'entry', data: UserList | ListEntry} | null>(null);

  // Item Options Modal state
  const [showItemOptionsModal, setShowItemOptionsModal] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState<ListEntry | null>(null);
  const [isFollowingSelectedItem, setIsFollowingSelectedItem] = useState(false);
  const [checkingFollowStatus, setCheckingFollowStatus] = useState(false);

  // Confirm Modal state (for copying lists and deleting)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDanger?: boolean;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Pagination state for each list
  const [endorsementLoadCount, setEndorsementLoadCount] = useState(10);
  const [alignedLoadCount, setAlignedLoadCount] = useState(10);
  const [unalignedLoadCount, setUnalignedLoadCount] = useState(10);
  const [customListLoadCounts, setCustomListLoadCounts] = useState<Record<string, number>>({});

  // Detect larger screens for responsive text display
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  // Reorder mode state
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderingListId, setReorderingListId] = useState<string | null>(null);
  const [localEntries, setLocalEntries] = useState<ListEntry[]>([]);

  // Drag-and-drop sensors for list reordering (desktop only)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Drag only after moving 8px (prevents accidental drags)
      },
    })
  );

  // Mode-based permissions
  const canEdit = mode === 'edit';
  const canInteract = mode !== 'preview'; // Can add/share in view mode
  const canBrowse = true; // All modes can expand/collapse to browse

  // Use props if provided, otherwise use context
  const endorsementList = propsEndorsementList !== undefined ? propsEndorsementList : library.state.endorsementList;
  const userLists = propsUserLists !== undefined ? propsUserLists : library.state.userLists;

  // Navigate into a list (replaces expand/collapse)
  const handleListClick = (listId: string) => {
    if (!canBrowse) return;
    library.setExpandedList(listId);
  };

  // Navigate back to list overview
  const handleBackToLibrary = () => {
    library.setExpandedList(null);
  };

  // Filter out endorsement list from custom lists
  const customLists = userLists.filter(list => list.id !== endorsementList?.id);

  // Check follow status when item is selected for options modal
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!selectedItemForOptions || !currentUserId) {
        setIsFollowingSelectedItem(false);
        setCheckingFollowStatus(false);
        return;
      }

      const canFollow = selectedItemForOptions.type === 'brand' || selectedItemForOptions.type === 'business';
      if (!canFollow) {
        setIsFollowingSelectedItem(false);
        setCheckingFollowStatus(false);
        return;
      }

      const accountId = selectedItemForOptions.type === 'brand'
        ? (selectedItemForOptions as any).brandId
        : (selectedItemForOptions as any).businessId;

      if (!accountId) {
        setIsFollowingSelectedItem(false);
        setCheckingFollowStatus(false);
        return;
      }

      try {
        setCheckingFollowStatus(true);
        const following = await checkIsFollowing(currentUserId, accountId, selectedItemForOptions.type as 'brand' | 'business');
        setIsFollowingSelectedItem(following);
      } catch (error) {
        console.error('[UnifiedLibrary] Error checking follow status:', error);
        setIsFollowingSelectedItem(false);
      } finally {
        setCheckingFollowStatus(false);
      }
    };

    checkFollowStatus();
  }, [selectedItemForOptions, currentUserId]);

  // Share handlers - Open ShareOptionsModal first
  const handleShareList = (list: UserList) => {
    setSharingItem({ type: 'list', data: list });
    setShowShareOptionsModal(true);
  };

  // Generate share URL for lists
  const getListShareUrl = (list: UserList): string => {
    if (Platform.OS === 'web') {
      return `${window.location.origin}/list/${list.id}`;
    }
    // For mobile, use a deep link format (can be updated with actual deep link scheme)
    return `uprightmoney://list/${list.id}`;
  };

  const getItemShareUrl = (entry: ListEntry): string => {
    if (entry.type === 'brand') {
      const brandId = (entry as any).brandId;
      if (Platform.OS === 'web') {
        return `${window.location.origin}/brand/${brandId}`;
      }
      return `uprightmoney://brand/${brandId}`;
    } else if (entry.type === 'business') {
      const businessId = (entry as any).businessId;
      if (Platform.OS === 'web') {
        return `${window.location.origin}/business/${businessId}`;
      }
      return `uprightmoney://business/${businessId}`;
    }
    // For other types (value, link, text), no URL
    return '';
  };

  const performShareList = async (list: UserList) => {
    try {
      const message = `Check out my list "${list.name}" on Endorse Money!\n${list.description || ''}`;
      await Share.share({
        message,
        title: list.name,
      });
    } catch (error) {
      console.error('Error sharing list:', error);
    }
  };

  const handleShareItem = (entry: ListEntry) => {
    setSharingItem({ type: 'entry', data: entry });
    setShowShareOptionsModal(true);
  };

  const handleFollow = async (entry: ListEntry, isCurrentlyFollowing: boolean) => {
    if (!currentUserId) {
      Alert.alert('Error', 'You must be logged in to follow');
      return;
    }

    const accountId = (entry.type === 'brand' ? (entry as any).brandId : (entry as any).businessId) as string;
    const accountType = entry.type as 'brand' | 'business';
    const accountName = (entry as any).brandName || (entry as any).businessName || (entry as any).name || 'Account';

    if (!accountId) {
      console.error('[UnifiedLibrary] No account ID found for entry:', entry);
      Alert.alert('Error', 'Cannot follow this item');
      return;
    }

    try {
      if (isCurrentlyFollowing) {
        await unfollowEntity(currentUserId, accountId, accountType);
        Alert.alert('Success', `Unfollowed ${accountName}`);
      } else {
        await followEntity(currentUserId, accountId, accountType);
        Alert.alert('Success', `Now following ${accountName}`);
      }

      // Force refresh to update UI
      if (currentUserId) {
        await library.loadUserLists(currentUserId, true);
      }
    } catch (error) {
      console.error('[UnifiedLibrary] Error following/unfollowing:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  };

  const performShareItem = async (entry: ListEntry) => {
    try {
      let message = '';
      let title = '';

      switch (entry.type) {
        case 'brand':
          const brandName = (entry as any).brandName || (entry as any).name || 'Brand';
          title = brandName;
          message = `Check out ${brandName} on Endorse Money!`;
          break;
        case 'business':
          const businessName = (entry as any).businessName || (entry as any).name || 'Business';
          title = businessName;
          message = `Check out ${businessName} on Endorse Money!`;
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

  // Edit List handler - Open EditListModal
  const handleEditList = (list: UserList) => {
    setEditingList(list);
    setShowEditListModal(true);
  };

  const performEditList = async (name: string, description: string) => {
    if (!editingList) return;

    try {
      await updateListMetadata(editingList.id, {
        name,
        description,
      });
      // Reload lists to reflect the change
      if (currentUserId) {
        await library.loadUserLists(currentUserId, true);
      }
    } catch (error) {
      console.error('Error updating list:', error);
      Alert.alert('Error', 'Failed to update list. Please try again.');
    }
  };

  // ===== Reorder Handlers =====

  // Move item up in the list (mobile)
  const handleMoveUp = (index: number) => {
    if (index === 0) return; // Already at top
    const newEntries = [...localEntries];
    [newEntries[index - 1], newEntries[index]] = [newEntries[index], newEntries[index - 1]];
    setLocalEntries(newEntries);
  };

  // Move item down in the list (mobile)
  const handleMoveDown = (index: number) => {
    if (index === localEntries.length - 1) return; // Already at bottom
    const newEntries = [...localEntries];
    [newEntries[index], newEntries[index + 1]] = [newEntries[index + 1], newEntries[index]];
    setLocalEntries(newEntries);
  };

  // Handle drag end (desktop)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localEntries.findIndex((entry) => entry.id === active.id);
    const newIndex = localEntries.findIndex((entry) => entry.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newEntries = arrayMove(localEntries, oldIndex, newIndex);
    setLocalEntries(newEntries);
  };

  // Save reordered entries to Firebase
  const handleSaveReorder = async () => {
    if (!reorderingListId) return;

    try {
      await reorderListEntries(reorderingListId, localEntries);

      // Reload lists to reflect changes
      if (currentUserId) {
        await library.loadUserLists(currentUserId, true);
      }

      setIsReorderMode(false);
      setReorderingListId(null);
      setLocalEntries([]);
      Alert.alert('Success', 'List reordered successfully!');
    } catch (error) {
      console.error('[UnifiedLibrary] Error reordering list:', error);
      Alert.alert('Error', 'Failed to save new order. Please try again.');
    }
  };

  // Cancel reordering
  const handleCancelReorder = () => {
    setIsReorderMode(false);
    setReorderingListId(null);
    setLocalEntries([]);
  };

  // Privacy toggle handler
  const handleTogglePrivacy = async (listId: string, currentStatus: boolean) => {
    try {
      // Handle aligned/unaligned system lists differently
      if (listId === 'aligned' || listId === 'unaligned') {
        if (!currentUserId) return;

        // Update user profile field
        const userRef = doc(db, 'users', currentUserId);
        const fieldName = listId === 'aligned' ? 'alignedListPublic' : 'unalignedListPublic';
        await updateDoc(userRef, {
          [fieldName]: !currentStatus
        });

        // Reload lists to reflect the change
        await library.loadUserLists(currentUserId, true);
      } else {
        // Handle regular user lists
        await updateListMetadata(listId, { isPublic: !currentStatus });
        // Reload lists to reflect the change
        if (currentUserId) {
          await library.loadUserLists(currentUserId, true);
        }
      }

      // Show success feedback
      const newStatus = !currentStatus ? 'Public' : 'Private';
      if (Platform.OS === 'web') {
        // Brief success message on web
        console.log(`List is now ${newStatus}`);
      } else {
        Alert.alert('Success', `List is now ${newStatus}`);
      }
    } catch (error) {
      console.error('Error toggling privacy:', error);
      Alert.alert('Error', 'Failed to update privacy setting. Please try again.');
    }
  };

  // Check if an item is already endorsed
  const isItemEndorsed = (entry: ListEntry): boolean => {
    if (!endorsementList?.entries) return false;

    const itemId = entry.brandId || entry.businessId || entry.valueId;
    if (!itemId) return false;

    return endorsementList.entries.filter(e => e).some(e => {
      const endorsedId = e.brandId || e.businessId || e.valueId;
      return endorsedId === itemId;
    });
  };

  // Add to Library handler - directly adds to endorsement list
  const handleAddToLibrary = async (entry: ListEntry) => {
    if (!endorsementList?.id) {
      Alert.alert('Error', 'Endorsement list not found');
      return;
    }

    try {
      await library.addEntry(endorsementList.id, entry);

      // Force refresh library to show the new entry immediately
      if (currentUserId) {
        await library.loadUserLists(currentUserId, true);
      }

      const itemName = getItemName(entry);
      Alert.alert('Success', `${itemName} endorsed!`);
      setShowItemOptionsModal(false);
      setSelectedItemForOptions(null);
    } catch (error: any) {
      console.error('Error endorsing item:', error);
      Alert.alert('Error', error?.message || 'Failed to endorse item');
    }
  };

  // Remove from endorsement list handler
  const handleRemoveFromLibrary = async (entry: ListEntry) => {
    if (!endorsementList?.id) {
      Alert.alert('Error', 'Endorsement list not found');
      return;
    }

    try {
      // Find the entry in the endorsement list
      const itemId = entry.brandId || entry.businessId || entry.valueId;
      const endorsedEntry = endorsementList.entries.filter(e => e).find(e => {
        const endorsedId = e.brandId || e.businessId || e.valueId;
        return endorsedId === itemId;
      });

      if (!endorsedEntry) {
        Alert.alert('Error', 'Item not found in endorsement list');
        return;
      }

      await library.removeEntry(endorsementList.id, endorsedEntry.id);

      // Force refresh library to show the removal immediately
      if (currentUserId) {
        await library.loadUserLists(currentUserId, true);
      }

      const itemName = getItemName(entry);
      Alert.alert('Success', `${itemName} unendorsed!`);
      setShowItemOptionsModal(false);
      setSelectedItemForOptions(null);
    } catch (error: any) {
      console.error('Error unendorsing item:', error);
      Alert.alert('Error', error?.message || 'Failed to unendorse item');
    }
  };

  const handleSelectList = async (listId: string) => {
    if (!selectedItemToAdd) return;

    try {
      await library.addEntry(listId, selectedItemToAdd);

      // Force refresh library to show the new entry immediately
      if (currentUserId) {
        await library.loadUserLists(currentUserId, true);
      }

      const listName = library.state.userLists.find(l => l.id === listId)?.name ||
                       library.state.endorsementList?.name || 'list';
      Alert.alert('Success', `Added to "${listName}"`);
    } catch (error: any) {
      throw error; // Let modal handle it
    }
  };

  const handleCreateNewList = async (listName: string) => {
    if (!currentUserId || !selectedItemToAdd) return;

    try {
      const newList = await library.createNewList(currentUserId, listName.trim());
      await library.addEntry(newList.id, selectedItemToAdd);
      Alert.alert('Success', `Created "${listName}" and added item`);
    } catch (error: any) {
      throw error; // Let modal handle it
    }
  };

  const getAddToLibraryLists = () => {
    const myEndorsementList = library.state.endorsementList;
    const myCustomLists = library.state.userLists.filter(list => list.id !== myEndorsementList?.id);

    // Only show lists that the current user owns (created) AND not copied from others
    // Lists with originalListId are copies from other users and should not be modifiable
    const ownedEndorsementList = myEndorsementList && myEndorsementList.userId === currentUserId && !myEndorsementList.originalListId ? myEndorsementList : null;
    const ownedCustomLists = myCustomLists.filter(list => list.userId === currentUserId && !list.originalListId);

    return [
      ...(ownedEndorsementList ? [ownedEndorsementList] : []),
      ...ownedCustomLists,
    ];
  };

  const getItemName = (entry: ListEntry): string => {
    switch (entry.type) {
      case 'brand':
        return (entry as any).brandName || (entry as any).name || 'Brand';
      case 'business':
        return (entry as any).businessName || (entry as any).name || 'Business';
      case 'value':
        return (entry as any).valueName || (entry as any).name || 'Value';
      case 'link':
        return (entry as any).title || (entry as any).name || 'Link';
      case 'text':
        return 'Note';
      default:
        return 'Item';
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
      <View style={{ position: 'relative' }}>
        <TouchableOpacity
          style={[
            styles.brandCard,
            { backgroundColor: 'transparent' },
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
            <Text style={[styles.brandName, { color: colors.white }]} numberOfLines={2}>
              {product.name || 'Unknown Brand'}
            </Text>
            <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.category || 'Uncategorized'}
            </Text>
          </View>
          <View style={styles.brandScoreContainer}>
            <Text style={[styles.brandScore, { color: scoreColor }]}>
              {alignmentScore !== undefined ? alignmentScore : 50}
            </Text>
          </View>
          {(mode === 'edit' || mode === 'view') && (
            <TouchableOpacity
              style={[styles.quickAddButton, { backgroundColor: colors.background }]}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedItemForOptions({
                  type: 'brand',
                  id: product.id,
                  brandId: product.id,
                  brandName: product.name || 'Unknown Brand',
                  brandCategory: product.category,
                  website: product.website,
                  logoUrl: getLogoUrl(product.website || ''),
                  createdAt: new Date()
                } as ListEntry);
                setShowItemOptionsModal(true);
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
      </View>
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

          // Brand not in aligned/unaligned arrays (middle-scoring brands)
          // Look up full brand data from Firebase brands array
          let fullBrand = brands.find(b => b.id === entry.brandId);

          // If not found by ID, try to find by website (for brands that may have been updated)
          if (!fullBrand && entry.website) {
            fullBrand = brands.find(b => b.website && b.website.toLowerCase() === entry.website?.toLowerCase());
          }

          // If not found by website, try to find by name (case-insensitive)
          if (!fullBrand && entry.brandName) {
            fullBrand = brands.find(b => b.name.toLowerCase() === entry.brandName.toLowerCase());
          }

          // Use data from fullBrand if found, otherwise use stored entry data
          const brandName = fullBrand?.name || entry.brandName || 'Unknown Brand';
          const brandCategory = fullBrand?.category || entry.brandCategory || 'Uncategorized';
          const website = fullBrand?.website || entry.website || '';
          const logoUrl = entry.logoUrl || getLogoUrl(website);
          const alignmentScore = scoredBrands.get(entry.brandId) || 50;
          const scoreColor = alignmentScore >= 50 ? colors.primary : colors.danger;

          // Use fullBrand.id if found, otherwise use entry.brandId for navigation
          const navigationId = fullBrand?.id || entry.brandId;

          return (
            <TouchableOpacity
              style={[
                styles.brandCard,
                { backgroundColor: 'transparent' },
              ]}
              onPress={() => {
                router.push({
                  pathname: '/brand/[id]',
                  params: { id: navigationId },
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
                  <Text style={[styles.brandName, { color: colors.white }]} numberOfLines={2}>
                    {brandName}
                  </Text>
                  <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                    {brandCategory}
                  </Text>
                </View>
                <View style={styles.brandScoreContainer}>
                  <Text style={[styles.brandScore, { color: scoreColor }]}>
                    {alignmentScore}
                  </Text>
                </View>
                {(mode === 'edit' || mode === 'view') && (
                  <TouchableOpacity
                    style={[styles.quickAddButton, { backgroundColor: colors.background }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedItemForOptions(entry);
                      setShowItemOptionsModal(true);
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
          // Get business score from scoredBrands map
          const alignmentScore = scoredBrands.get(entry.businessId) || 50;
          const scoreColor = alignmentScore >= 50 ? colors.primary : colors.danger;

          // Get business name from multiple possible fields
          const businessName = (entry as any).businessName || (entry as any).name || 'Unknown Business';
          const businessCategory = (entry as any).businessCategory || (entry as any).category;
          const logoUrl = (entry as any).logoUrl || getLogoUrl((entry as any).website || '');

          return (
            <TouchableOpacity
              style={[
                styles.brandCard,
                { backgroundColor: 'transparent' },
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
                  <Text style={[styles.brandName, { color: colors.white }]} numberOfLines={2}>
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
                      setSelectedItemForOptions(entry);
                      setShowItemOptionsModal(true);
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
              { backgroundColor: 'transparent' },
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
                  <Text style={[styles.brandName, { color: colors.white }]} numberOfLines={2}>
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
                      setSelectedItemForOptions(entry);
                      setShowItemOptionsModal(true);
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
                { backgroundColor: 'transparent', borderColor: 'transparent' }
              ]}
              onPress={() => canInteract && Linking.openURL(entry.url)}
              activeOpacity={0.7}
              disabled={!canInteract}
            >
              <View style={styles.brandCardInner}>
                <View style={styles.brandCardContent}>
                  <Text style={[styles.brandName, { color: colors.white }]} numberOfLines={1}>
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
                      setSelectedItemForOptions(entry);
                      setShowItemOptionsModal(true);
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
              { backgroundColor: 'transparent', borderColor: 'transparent' }
            ]}>
              <View style={styles.brandCardInner}>
                <View style={styles.brandCardContent}>
                  <Text style={[styles.brandName, { color: colors.white }]}>
                    {textContent}
                  </Text>
                </View>
                {(mode === 'edit' || mode === 'view') && (
                  <TouchableOpacity
                    style={[styles.quickAddButton, { backgroundColor: colors.background }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedItemForOptions(entry);
                      setShowItemOptionsModal(true);
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
  // Render list card for navigation (overview mode)
  const renderListCard = (
    listId: string,
    title: string,
    itemCount: number,
    isEndorsed: boolean = false,
    attribution?: string,
    description?: string,
    isPublic?: boolean,
    creatorProfileImage?: string,
    useAppIcon?: boolean
  ) => {
    const isOptionsOpen = activeListOptionsId === listId;

    return (
      <View style={{ position: 'relative', overflow: 'visible', zIndex: isOptionsOpen ? 9999 : 1 }}>
        <TouchableOpacity
          style={styles.collapsibleListHeader}
          onPress={() => handleListClick(listId)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {/* Profile Image */}
          <View style={[styles.listProfileImageContainer, { backgroundColor: 'transparent', borderColor: colors.border }]}>
            {useAppIcon ? (
              <Image
                source={require('@/assets/images/endo12.png')}
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

          <View style={styles.collapsibleListHeaderContent}>
            <View style={styles.collapsibleListInfo}>
              <View style={styles.collapsibleListTitleRow}>
                <Text style={[styles.collapsibleListTitle, { color: colors.text }]} numberOfLines={1}>
                  {title}
                </Text>
                {isEndorsed && <EndorsedBadge isDarkMode={isDarkMode} size="small" showText={isLargeScreen} />}
              </View>
              <View style={styles.collapsibleListMeta}>
                <Text style={[styles.collapsibleListCount, { color: colors.textSecondary }]}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Text>
                {isPublic !== undefined && (
                  <View style={styles.privacyIndicator}>
                    {isPublic ? (
                      <>
                        <Globe size={14} color={colors.primary} strokeWidth={2} />
                        {isLargeScreen && <Text style={[styles.privacyText, { color: colors.primary }]}>Public</Text>}
                      </>
                    ) : (
                      <>
                        <Lock size={14} color={colors.textSecondary} strokeWidth={2} />
                        {isLargeScreen && <Text style={[styles.privacyText, { color: colors.textSecondary }]}>Private</Text>}
                      </>
                    )}
                  </View>
                )}
              </View>
              {description && (
                <Text style={[styles.collapsibleListDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {description}
                </Text>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </View>
        </TouchableOpacity>

        {/* Options dropdown - show in edit mode AND view mode */}
        {(canEdit || mode === 'view') && isOptionsOpen && (
          <View style={[styles.listOptionsDropdown, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            {(() => {
              // Determine which options to show based on list type
              const isEndorsementList = listId === 'endorsement';
              const isSystemList = listId === 'aligned' || listId === 'unaligned';
              const currentList = isEndorsementList ? endorsementList : userLists.find(l => l.id === listId);
              const isCopiedList = currentList?.originalListId !== undefined; // List was copied from another user

              const canEditMeta = !isSystemList && !isCopiedList && canEdit;
              // Allow removing copied lists - users should be able to remove lists they've added to their library
              const canRemove = !isEndorsementList && !isSystemList && canEdit;
              // REMOVED: Privacy toggle removed from all lists
              const canTogglePrivacy = false;
              const canCopyList = mode === 'view'; // Only in view mode (other users)

              return (
                <>
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

                  {canCopyList && currentList && (
                    <TouchableOpacity
                      style={styles.listOptionItem}
                      onPress={() => {
                        setActiveListOptionsId(null);
                        if (!currentUserId) {
                          Alert.alert('Error', 'You must be logged in to copy lists');
                          return;
                        }

                        // Show confirmation modal
                        setConfirmModalData({
                          title: 'Add to Your Library',
                          message: `Add "${currentList.name}" to your library? This will create a live reference that updates when the original author modifies it.`,
                          onConfirm: async () => {
                            setIsConfirmLoading(true);
                            try {
                              // Create a reference list (NOT a copy) - no entries are duplicated
                              // This list will display the original list's current data
                              const newList = await library.createNewList(
                                currentUserId,
                                currentList.name,
                                currentList.description,
                                profile?.userDetails?.name, // Current user as creator (who added it)
                                false, // not endorsed
                                currentList.id, // original list ID - this makes it a reference
                                currentList.creatorName || currentList.userId, // original creator
                                profile?.userDetails?.profileImage, // current user's image
                                currentList.creatorImage // original creator's image
                              );

                              // DO NOT copy entries - this is a live reference, not a snapshot
                              // Entries will be fetched from the original list when displayed

                              setShowConfirmModal(false);
                              setConfirmModalData(null);
                              Alert.alert('Success', `Added "${currentList.name}" to your library. This list will update automatically when the original author makes changes.`);
                            } catch (error: any) {
                              console.error('Error adding list reference:', error);
                              Alert.alert('Error', error.message || 'Failed to add list');
                            } finally {
                              setIsConfirmLoading(false);
                            }
                          },
                        });
                        setShowConfirmModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Plus size={16} color={colors.text} strokeWidth={2} />
                      <Text style={[styles.listOptionText, { color: colors.text }]}>Add to My Library</Text>
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
                        setConfirmModalData({
                          title: 'Delete List',
                          message: `Are you sure you want to delete "${currentList.name}"? This cannot be undone.`,
                          onConfirm: () => {
                            library.removeList(currentList.id);
                            setShowConfirmModal(false);
                            setConfirmModalData(null);
                          },
                          confirmText: 'Delete',
                          isDanger: true,
                        });
                        setShowConfirmModal(true);
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

    // Determine if we're in reorder mode for this list
    const isReordering = isReorderMode && reorderingListId === 'endorsement';
    const entriesToDisplay = isReordering ? localEntries : endorsementList.entries;

    // Render Save/Cancel buttons when in reorder mode
    const renderReorderControls = () => {
      if (!isReordering) return null;

      return (
        <View style={[styles.reorderControls, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Text style={[styles.reorderTitle, { color: colors.text }]}>
            {isLargeScreen ? 'Drag items to reorder' : 'Use arrows to reorder'}
          </Text>
          <View style={styles.reorderButtons}>
            <TouchableOpacity
              style={[styles.reorderButton, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancelReorder}
              activeOpacity={0.7}
            >
              <Text style={[styles.reorderButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reorderButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveReorder}
              activeOpacity={0.7}
            >
              <Text style={[styles.reorderButtonText, { color: colors.white }]}>Save Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    // Render entry with reorder controls
    const renderEntryWithControls = (entry: ListEntry, index: number) => {
      const isFirst = index === 0;
      const isLast = index === entriesToDisplay.length - 1;

      if (isReordering) {
        // Mobile: Show up/down arrows
        if (!isLargeScreen) {
          return (
            <View style={styles.reorderEntryRow}>
              <View style={styles.reorderControls}>
                <TouchableOpacity
                  style={[styles.reorderArrowButton, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => handleMoveUp(index)}
                  disabled={isFirst}
                  activeOpacity={0.7}
                >
                  <ArrowUp size={20} color={isFirst ? colors.textSecondary : colors.text} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reorderArrowButton, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => handleMoveDown(index)}
                  disabled={isLast}
                  activeOpacity={0.7}
                >
                  <ArrowDown size={20} color={isLast ? colors.textSecondary : colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <View style={styles.forYouItemRow}>
                <Text style={[styles.forYouItemNumber, { color: colors.textSecondary }]}>
                  {index + 1}
                </Text>
                <View style={styles.forYouCardWrapper}>
                  {renderListEntry(entry)}
                </View>
              </View>
            </View>
          );
        }
        // Desktop: Show drag handle
        else {
          const SortableEntry = () => {
            const {
              attributes,
              listeners,
              setNodeRef,
              transform,
              transition,
            } = useSortable({ id: entry.id });

            const style = {
              transform: CSS.Transform.toString(transform),
              transition,
            };

            return (
              <View ref={setNodeRef} style={[styles.reorderEntryRow, style]}>
                <TouchableOpacity
                  {...attributes}
                  {...listeners}
                  style={[styles.dragHandle, { backgroundColor: colors.backgroundSecondary }]}
                  activeOpacity={0.7}
                >
                  <GripVertical size={20} color={colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
                <View style={styles.forYouItemRow}>
                  <Text style={[styles.forYouItemNumber, { color: colors.textSecondary }]}>
                    {index + 1}
                  </Text>
                  <View style={styles.forYouCardWrapper}>
                    {renderListEntry(entry)}
                  </View>
                </View>
              </View>
            );
          };

          return <SortableEntry key={entry.id} />;
        }
      }

      // Normal (non-reorder) mode
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
        </View>
      );
    };

    const entriesContent = entriesToDisplay
      .filter(entry => entry != null)
      .slice(0, endorsementLoadCount)
      .map((entry, index) => renderEntryWithControls(entry, index));

    // Wrap with DndContext for desktop drag-and-drop
    const contentWithDnd = isReordering && isLargeScreen ? (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localEntries.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {entriesContent}
        </SortableContext>
      </DndContext>
    ) : entriesContent;

    return (
      <View style={styles.listContentContainer}>
        {renderReorderControls()}
        <View style={styles.brandsContainer}>
          {contentWithDnd}
          {!isReordering && endorsementLoadCount < endorsementList.entries.length && (
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
          {list.entries
            .filter(entry => entry != null) // Filter out null/undefined entries
            .slice(0, loadCount)
            .map((entry, index) => {
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

  // Render list detail header (when inside a list)
  const renderListDetailHeader = (
    listId: string,
    title: string,
    itemCount: number,
    isEndorsed: boolean = false,
    attribution?: string,
    description?: string,
    isPublic?: boolean,
    creatorProfileImage?: string,
    useAppIcon?: boolean
  ) => {
    const isOptionsOpen = activeListOptionsId === listId;

    return (
      <View style={{ marginBottom: 20 }}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLibrary}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.primary} strokeWidth={2} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>Library</Text>
        </TouchableOpacity>

        {/* List header card */}
        <View style={styles.listDetailHeader}>
          {/* Profile Image */}
          <View style={[styles.listDetailImageContainer, { backgroundColor: 'transparent', borderColor: colors.border }]}>
            {useAppIcon ? (
              <Image
                source={require('@/assets/images/endo12.png')}
                style={styles.listDetailImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : creatorProfileImage ? (
              <Image
                source={{ uri: creatorProfileImage }}
                style={styles.listDetailImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <User size={48} color={colors.textSecondary} strokeWidth={2} />
            )}
          </View>

          <View style={styles.listDetailInfo}>
            <View style={styles.listDetailTitleRow}>
              <Text style={[styles.listDetailTitle, { color: colors.text }]}>
                {title}
              </Text>
              {isEndorsed && <EndorsedBadge isDarkMode={isDarkMode} size="medium" showText={true} />}
            </View>

            <Text style={[styles.listDetailCount, { color: colors.textSecondary }]}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>

            {isPublic !== undefined && (
              <View style={[styles.privacyIndicator, { marginTop: 8 }]}>
                {isPublic ? (
                  <>
                    <Globe size={16} color={colors.primary} strokeWidth={2} />
                    <Text style={[styles.privacyText, { color: colors.primary, fontSize: 14 }]}>Public</Text>
                  </>
                ) : (
                  <>
                    <Lock size={16} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.privacyText, { color: colors.textSecondary, fontSize: 14 }]}>Private</Text>
                  </>
                )}
              </View>
            )}

            {attribution && (
              <Text style={[styles.listDetailAttribution, { color: colors.textSecondary }]}>
                {attribution}
              </Text>
            )}

            {description && (
              <Text style={[styles.listDetailDescription, { color: colors.text }]}>
                {description}
              </Text>
            )}
          </View>

          {/* Action Menu Button */}
          {(canEdit || mode === 'view') && (
            <TouchableOpacity
              style={styles.listDetailOptionsButton}
              onPress={() => setActiveListOptionsId(isOptionsOpen ? null : listId)}
              activeOpacity={0.7}
            >
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <MoreVertical size={24} color={colors.textSecondary} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Options dropdown */}
        {(canEdit || mode === 'view') && isOptionsOpen && (
          <View style={[styles.listOptionsDropdown, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, top: 60, right: 16 }]}>
            {(() => {
              const isEndorsementList = listId === 'endorsement';
              const isSystemList = listId === 'aligned' || listId === 'unaligned';
              const currentList = isEndorsementList ? endorsementList : userLists.find(l => l.id === listId);
              const isCopiedList = currentList?.originalListId !== undefined;

              const canEditMeta = !isSystemList && !isCopiedList && canEdit;
              const canRemove = !isEndorsementList && !isSystemList && canEdit;
              // REMOVED: Privacy toggle removed from all lists
              const canTogglePrivacy = false;
              const canCopyList = mode === 'view';

              return (
                <>
                  {/* Reorder button - only for endorsement list */}
                  {canEdit && currentList && currentList.entries && currentList.entries.length > 1 && (
                    <TouchableOpacity
                      style={styles.listOptionItem}
                      onPress={() => {
                        setActiveListOptionsId(null);
                        setIsReorderMode(true);
                        setReorderingListId(listId);
                        setLocalEntries([...currentList.entries]);
                      }}
                      activeOpacity={0.7}
                    >
                      <ListIcon size={16} color={colors.text} strokeWidth={2} />
                      <Text style={[styles.listOptionText, { color: colors.text }]}>Reorder</Text>
                    </TouchableOpacity>
                  )}

                  {(currentList || isSystemList) && (
                    <TouchableOpacity
                      style={styles.listOptionItem}
                      onPress={() => {
                        setActiveListOptionsId(null);
                        if (isSystemList) {
                          // Create a mock list object for system lists
                          const systemListName = listId === 'aligned' ? 'Aligned' : 'Unaligned';
                          const systemListDescription = listId === 'aligned'
                            ? 'Brands and businesses aligned with your values'
                            : 'Brands and businesses not aligned with your values';
                          const mockList = {
                            id: listId,
                            name: systemListName,
                            description: systemListDescription,
                            isPublic: false, // System lists are always private
                          } as UserList;
                          handleShareList(mockList);
                        } else if (currentList) {
                          handleShareList(currentList);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Share2 size={16} color={colors.text} strokeWidth={2} />
                      <Text style={[styles.listOptionText, { color: colors.text }]}>Share</Text>
                    </TouchableOpacity>
                  )}

                  {canCopyList && currentList && (
                    <TouchableOpacity
                      style={styles.listOptionItem}
                      onPress={() => {
                        setActiveListOptionsId(null);
                        if (!currentUserId) {
                          Alert.alert('Error', 'You must be logged in to copy lists');
                          return;
                        }

                        // Show confirmation modal
                        setConfirmModalData({
                          title: 'Add to Your Library',
                          message: `Add "${currentList.name}" to your library? This will create a live reference that updates when the original author modifies it.`,
                          onConfirm: async () => {
                            setIsConfirmLoading(true);
                            try {
                              const userName = profile?.userName || 'User';
                              const profileImageUrl = profile?.userDetails?.profileImage;
                              await copyListToLibrary(currentList.id, currentUserId, userName, profileImageUrl);

                              // Wait for Firestore propagation
                              await new Promise(resolve => setTimeout(resolve, 500));

                              // Reload lists to show the newly copied list
                              if (currentUserId) {
                                await library.loadUserLists(currentUserId, true);
                              }

                              Alert.alert('Success', `"${currentList.name}" added to your library!`);
                              setShowConfirmModal(false);
                              setConfirmModalData(null);
                            } catch (error: any) {
                              console.error('Error copying list:', error);
                              Alert.alert('Error', error?.message || 'Failed to copy list');
                            } finally {
                              setIsConfirmLoading(false);
                            }
                          },
                          confirmText: 'Add to Library',
                          isDanger: false,
                        });
                        setShowConfirmModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <UserPlus size={16} color={colors.text} strokeWidth={2} />
                      <Text style={[styles.listOptionText, { color: colors.text }]}>Add to Library</Text>
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
                        setConfirmModalData({
                          title: 'Delete List',
                          message: `Are you sure you want to delete "${currentList.name}"? This cannot be undone.`,
                          onConfirm: () => {
                            library.removeList(currentList.id);
                            setShowConfirmModal(false);
                            setConfirmModalData(null);
                            handleBackToLibrary(); // Go back to library after deleting
                          },
                          confirmText: 'Delete',
                          isDanger: true,
                        });
                        setShowConfirmModal(true);
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

  // Render library overview (all list cards)
  const renderLibraryOverview = () => {
    // Determine if viewing own profile
    const isOwnProfile = !viewingUserId || currentUserId === viewingUserId;
    // Use "Endorsements" for own profile, user name for others
    const endorsementTitle = isOwnProfile ? 'Endorsements' : (endorsementList?.name || 'Endorsements');

    return (
      <>
        {/* 1. Endorsement List - Always first, pinned */}
        {endorsementList && (
          <View style={[styles.individualListContainer, {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          }]}>
            {renderListCard(
              'endorsement',
              endorsementTitle,
              endorsementList.entries?.length || 0,
              true,
              `Endorsed by ${endorsementList.creatorName || 'you'}`,
              endorsementList.description,
              true, // Always public
              profileImage
            )}
          </View>
        )}

        {/* 2. Aligned List */}
        {alignedItems.length > 0 && (
          <View style={[styles.individualListContainer, {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          }]}>
            {renderListCard(
              'aligned',
              'Aligned',
              alignedItems.length,
              false,
              undefined,
              'Brands and businesses aligned with your values',
              false, // Always private
              undefined,
              true
            )}
          </View>
        )}

        {/* 3. Unaligned List */}
        {unalignedItems.length > 0 && (
          <View style={[styles.individualListContainer, {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          }]}>
            {renderListCard(
              'unaligned',
              'Unaligned',
              unalignedItems.length,
              false,
              undefined,
              'Brands and businesses not aligned with your values',
              false, // Always private
              undefined,
              true
            )}
          </View>
        )}

        {/* 4. Custom Lists */}
        {customLists.map(list => {
          const attribution = list.originalCreatorName
            ? `Originally created by ${list.originalCreatorName}`
            : list.creatorName
            ? `Created by ${list.creatorName}`
            : undefined;

          const listProfileImage = list.originalCreatorImage || list.creatorImage || profileImage;

          return (
            <React.Fragment key={list.id}>
              {renderListCard(
                list.id,
                list.name,
                list.entries.length,
                false,
                attribution,
                list.description,
                list.isPublic,
                listProfileImage
              )}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  // Render list detail view (single list with items)
  const renderListDetailView = () => {
    if (!openedListId) return null;

    // Get list data based on openedListId
    let title = '';
    let itemCount = 0;
    let isEndorsed = false;
    let attribution = '';
    let description = '';
    let isPublic: boolean | undefined = undefined;
    let creatorImage: string | undefined = undefined;
    let useAppIcon = false;
    let renderContent = null;

    if (openedListId === 'endorsement' && endorsementList) {
      // Determine if viewing own profile
      const isOwnProfile = !viewingUserId || currentUserId === viewingUserId;
      // Use "Endorsements" for own profile, user name for others
      title = isOwnProfile ? 'Endorsements' : endorsementList.name;
      itemCount = endorsementList.entries?.length || 0;
      isEndorsed = true;
      attribution = `Endorsed by ${endorsementList.creatorName || 'you'}`;
      description = endorsementList.description || '';
      isPublic = endorsementList.isPublic;
      creatorImage = profileImage;
      renderContent = renderEndorsementContent();
    } else if (openedListId === 'aligned') {
      title = 'Aligned';
      itemCount = alignedItems.length;
      description = 'Brands and businesses aligned with your values';
      isPublic = false;
      useAppIcon = true;
      renderContent = renderAlignedContent();
    } else if (openedListId === 'unaligned') {
      title = 'Unaligned';
      itemCount = unalignedItems.length;
      description = 'Brands and businesses not aligned with your values';
      isPublic = false;
      useAppIcon = true;
      renderContent = renderUnalignedContent();
    } else {
      // Custom list
      const list = userLists.find(l => l.id === openedListId);
      if (list) {
        title = list.name;
        itemCount = list.entries.length;
        attribution = list.originalCreatorName
          ? `Originally created by ${list.originalCreatorName}`
          : list.creatorName
          ? `Created by ${list.creatorName}`
          : '';
        description = list.description || '';
        isPublic = list.isPublic;
        creatorImage = list.originalCreatorImage || list.creatorImage || profileImage;
        renderContent = renderCustomListContent(list);
      }
    }

    return (
      <>
        {renderListDetailHeader(
          openedListId,
          title,
          itemCount,
          isEndorsed,
          attribution,
          description,
          isPublic,
          creatorImage,
          useAppIcon
        )}
        {renderContent}
      </>
    );
  };

  // Check if any menu is open (only list options dropdown now, items use modal)
  const isAnyMenuOpen = activeListOptionsId !== null;

  // Close all menus
  const closeAllMenus = () => {
    setActiveListOptionsId(null);
  };

  return (
    <View style={styles.libraryDirectory}>
      {/* Backdrop to close menus when clicking outside */}
      {isAnyMenuOpen && (
        <Pressable
          style={styles.menuBackdrop}
          onPress={closeAllMenus}
        />
      )}

      {/* Add to Library Modal */}
      <AddToLibraryModal
        visible={showAddToLibraryModal}
        onClose={() => {
          setShowAddToLibraryModal(false);
          setSelectedItemToAdd(null);
        }}
        availableLists={getAddToLibraryLists()}
        onSelectList={handleSelectList}
        onCreateNewList={handleCreateNewList}
        itemName={selectedItemToAdd ? getItemName(selectedItemToAdd) : undefined}
        isDarkMode={isDarkMode}
      />

      {/* Conditional render: overview or detail view */}
      {openedListId ? renderListDetailView() : renderLibraryOverview()}

      {/* Modals */}
      <AddToLibraryModal
        visible={showAddToLibraryModal}
        onClose={() => setShowAddToLibraryModal(false)}
        availableLists={getAddToLibraryLists()}
        onSelectList={handleSelectList}
        onCreateNewList={handleCreateNewList}
        itemName={selectedItemToAdd ? getItemName(selectedItemToAdd) : ''}
        isDarkMode={isDarkMode}
      />

      <EditListModal
        visible={showEditListModal}
        onClose={() => {
          setShowEditListModal(false);
          setEditingList(null);
        }}
        onSave={performEditList}
        initialName={editingList?.name || ''}
        initialDescription={editingList?.description || ''}
        isDarkMode={isDarkMode}
      />

      <ShareOptionsModal
        visible={showShareOptionsModal}
        onClose={() => {
          setShowShareOptionsModal(false);
          setSharingItem(null);
        }}
        onShare={async () => {
          if (sharingItem) {
            if (sharingItem.type === 'list') {
              await performShareList(sharingItem.data as UserList);
            } else {
              await performShareItem(sharingItem.data as ListEntry);
            }
          }
        }}
        shareUrl={
          sharingItem?.type === 'list'
            ? getListShareUrl(sharingItem.data as UserList)
            : sharingItem?.type === 'entry'
            ? getItemShareUrl(sharingItem.data as ListEntry)
            : undefined
        }
        isDarkMode={isDarkMode}
      />

      <ItemOptionsModal
        visible={showItemOptionsModal}
        onClose={() => {
          setShowItemOptionsModal(false);
          setSelectedItemForOptions(null);
        }}
        options={(() => {
          if (!selectedItemForOptions) return [];

          const options = [];
          const canFollow = selectedItemForOptions.type === 'brand' || selectedItemForOptions.type === 'business';
          const isEndorsed = isItemEndorsed(selectedItemForOptions);

          // Endorse/Unendorse option (adds to or removes from endorsement list)
          if (isEndorsed) {
            options.push({
              icon: UserPlus,
              label: 'Unendorse',
              onPress: () => handleRemoveFromLibrary(selectedItemForOptions),
              isDanger: true,
            });
          } else {
            options.push({
              icon: UserPlus,
              label: 'Endorse',
              onPress: () => handleAddToLibrary(selectedItemForOptions),
            });
          }

          // Follow/Unfollow option (for brands and businesses)
          if (canFollow) {
            options.push({
              icon: UserPlus,
              label: isFollowingSelectedItem ? 'Unfollow' : 'Follow',
              onPress: () => handleFollow(selectedItemForOptions, isFollowingSelectedItem),
            });
          }

          // Share option (always available)
          options.push({
            icon: Share2,
            label: 'Share',
            onPress: () => handleShareItem(selectedItemForOptions),
          });

          return options;
        })()}
        itemName={selectedItemForOptions ? getItemName(selectedItemForOptions) : undefined}
        isDarkMode={isDarkMode}
      />

      <ConfirmModal
        visible={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmModalData(null);
          setIsConfirmLoading(false);
        }}
        onConfirm={() => {
          if (confirmModalData) {
            confirmModalData.onConfirm();
          }
        }}
        title={confirmModalData?.title || ''}
        message={confirmModalData?.message || ''}
        confirmText={confirmModalData?.confirmText || 'Confirm'}
        cancelText="Cancel"
        isDarkMode={isDarkMode}
        isLoading={isConfirmLoading}
        isDanger={confirmModalData?.isDanger}
      />
    </View>
  );
}

// EXACT copy of Home tab styles
const styles = StyleSheet.create({
  libraryDirectory: {
    flex: 1,
  },
  individualListContainer: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    overflow: 'hidden',
  },
  menuBackdrop: {
    position: Platform.OS === 'web' ? 'fixed' as any : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  individualListContainer: {
    marginHorizontal: 0,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 0,
    overflow: 'hidden',
    minHeight: 64,
  },
  collapsibleListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
    paddingHorizontal: 0,
    paddingRight: 12,
    marginHorizontal: 0,
    marginVertical: 0,
    minHeight: 64,
    backgroundColor: 'transparent',
  },
  listContentContainer: {
    marginHorizontal: Platform.OS === 'web' ? 2 : 8,
    marginBottom: 8,
  },
  pinnedListHeader: {
    // No special styling for pinned headers
  },
  collapsibleListHeaderContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  listProfileImageContainer: {
    width: 64,
    height: 64,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 99999,
    zIndex: 99999999,
    opacity: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  itemOptionsDropdown: {
    position: 'absolute',
    right: 16,
    top: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 99999,
    zIndex: 99999999,
    opacity: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      },
    }),
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
    borderRadius: 0,
    height: 64,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'visible',
    width: '100%',
    backgroundColor: 'transparent',
  },
  brandCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    overflow: 'visible',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  brandLogoContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
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
  // List detail view styles
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  listDetailHeader: {
    flexDirection: 'row',
    padding: Platform.OS === 'web' ? 8 : 20,
    borderRadius: 0,
    borderWidth: 0,
    gap: 16,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  listDetailImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 0,
    borderWidth: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listDetailImage: {
    width: '100%',
    height: '100%',
  },
  listDetailInfo: {
    flex: 1,
    gap: 6,
  },
  listDetailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  listDetailTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  listDetailCount: {
    fontSize: 15,
    fontWeight: '500',
  },
  listDetailAttribution: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  listDetailDescription: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 4,
  },
  listDetailOptionsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  // Reorder styles
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  reorderTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  reorderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reorderButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reorderEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reorderArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});
