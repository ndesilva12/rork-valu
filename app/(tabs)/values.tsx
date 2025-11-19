import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
  TextInput,
} from 'react-native';
import { ChevronRight, ChevronDown, ChevronUp, Heart, Building2, Users, Globe, Shield, User as UserIcon, Plus, List, Tag, X, Trophy } from 'lucide-react-native';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import MenuButton from '@/components/MenuButton';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { CauseCategory, Cause } from '@/types';
import { UserList, ListEntry, ValueListMode } from '@/types/library';
import { getUserLists, addEntryToList, createList } from '@/services/firebase/listService';
import { useFocusEffect } from '@react-navigation/native';

const CATEGORY_ICONS: Record<string, any> = {
  social_issue: Heart,
  religion: Building2,
  ideology: Users,
  corporation: Building2,
  nation: Globe,
  organization: Shield,
  person: UserIcon,
  sports: Trophy,
  lifestyle: Heart,
};

const CATEGORY_LABELS: Record<string, string> = {
  social_issue: 'Social Issues',
  religion: 'Religion',
  ideology: 'Ideology',
  corporation: 'Corporations',
  nation: 'Places',
  nations: 'Places',
  places: 'Places', // Handle all variations
  organization: 'Organizations',
  person: 'People',
  people: 'People', // Handle both "person" and "people"
  sports: 'Sports',
  lifestyle: 'Lifestyle',
};

// Normalize category names to handle case variations and synonyms
const normalizeCategory = (category: string): string => {
  const lower = category.toLowerCase().trim();

  // Handle synonyms and variations
  if (lower === 'person' || lower === 'people') return 'person';
  if (lower === 'social_issue' || lower === 'social issues') return 'social_issue';
  if (lower === 'nation' || lower === 'nations' || lower === 'places') return 'nation';

  return lower;
};

// Define category display order
const CATEGORY_ORDER = [
  'ideology',
  'social_issue',
  'person',
  'lifestyle',
  'nation',
  'religion',
  'organization',
  'sports',
];

// Helper to get category icon, with fallback
const getCategoryIcon = (category: string) => {
  const normalized = normalizeCategory(category);
  return CATEGORY_ICONS[normalized] || Tag;
};

// Helper to get category label, with fallback to capitalized category name
const getCategoryLabel = (category: string) => {
  const normalized = normalizeCategory(category);
  if (CATEGORY_LABELS[normalized]) return CATEGORY_LABELS[normalized];
  // Capitalize and format the category name (e.g., "sports" -> "Sports", "social_issue" -> "Social Issue")
  return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

interface LocalValueState {
  id: string;
  name: string;
  category: string;
  type: 'support' | 'avoid';
  description?: string;
}

export default function ValuesScreen() {
  const router = useRouter();
  const { profile, isDarkMode, removeCauses, toggleCauseType, clerkUser, addCauses } = useUser();
  const { brands, valuesMatrix, values: firebaseValues } = useData();
  const colors = isDarkMode ? darkColors : lightColors;
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Local state to track changes before persisting
  const [localChanges, setLocalChanges] = useState<Map<string, LocalValueState | null>>(new Map());
  const hasUnsavedChanges = useRef(false);

  // Value action modal state
  const [showValueActionModal, setShowValueActionModal] = useState(false);
  const [selectedValueForAction, setSelectedValueForAction] = useState<{
    id: string;
    name: string;
    category: string;
    description?: string;
    currentState: 'support' | 'avoid' | 'unselected';
  } | null>(null);

  // Quick-add state
  const [showModeSelectionModal, setShowModeSelectionModal] = useState(false);
  const [showListSelectionModal, setShowListSelectionModal] = useState(false);
  const [selectedValue, setSelectedValue] = useState<Cause | null>(null);
  const [selectedMode, setSelectedMode] = useState<ValueListMode | null>(null);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  // Transform Firebase values into the format expected by the UI
  // Dynamically build categories based on what's in Firebase, using NORMALIZED categories
  const availableValues = useMemo(() => {
    const valuesByCategory: Record<string, any[]> = {};

    firebaseValues.forEach(value => {
      // Normalize the category to handle case variations and synonyms
      const normalizedCategory = normalizeCategory(value.category || 'other');

      // Initialize category array if it doesn't exist
      if (!valuesByCategory[normalizedCategory]) {
        valuesByCategory[normalizedCategory] = [];
      }

      valuesByCategory[normalizedCategory].push({
        id: value.id,
        name: value.name,
        category: normalizedCategory,
      });
    });

    return valuesByCategory;
  }, [firebaseValues]);

  const supportCauses = (profile.causes || [])
    .filter(c => c.type === 'support')
    .sort((a, b) => a.name.localeCompare(b.name));
  const avoidCauses = (profile.causes || [])
    .filter(c => c.type === 'avoid')
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get all selected value IDs
  const selectedValueIds = new Set((profile.causes || []).map(c => c.id));

  // Get unselected values by category (dynamically based on what's in Firebase)
  const unselectedValuesByCategory: Record<string, any[]> = {};

  // Populate unselected values from Firebase for all categories
  Object.keys(availableValues).forEach(category => {
    const values = availableValues[category] || [];
    unselectedValuesByCategory[category] = values.filter(v => !selectedValueIds.has(v.id));
  });

  // Get categories in the specified order, then add any additional categories alphabetically
  const allCategories = Object.keys(unselectedValuesByCategory);
  const knownCategories = CATEGORY_ORDER.filter(cat => allCategories.includes(cat));
  const unknownCategories = allCategories.filter(cat => !CATEGORY_ORDER.includes(cat)).sort();
  const sortedCategories = [...knownCategories, ...unknownCategories];

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleUpdateValues = () => {
    router.push('/onboarding');
  };

  const handleResetValues = () => {
    const isBusiness = profile.accountType === 'business';
    const minValues = isBusiness ? 3 : 5;

    Alert.alert(
      'Reset All Values',
      `Are you sure you want to reset all your values? You will be redirected to select at least ${minValues} new values.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            // Remove all causes and redirect to onboarding
            const allCauseIds = (profile.causes || []).map(c => c.id);
            await removeCauses(allCauseIds);
            router.replace('/onboarding');
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Get the current state of a value (local changes take priority over profile)
  const getValueState = (valueId: string): 'unselected' | 'support' | 'avoid' => {
    // Check local changes first
    if (localChanges.has(valueId)) {
      const localState = localChanges.get(valueId);
      if (localState === null) return 'unselected';
      return localState.type;
    }

    // Fall back to profile state
    const profileCause = profile.causes.find(c => c.id === valueId);
    if (!profileCause) return 'unselected';
    return profileCause.type;
  };

  // Save all pending changes when leaving the tab
  const savePendingChanges = async () => {
    if (!hasUnsavedChanges.current || localChanges.size === 0) return;

    try {
      const isBusiness = profile.accountType === 'business';
      const minValues = isBusiness ? 3 : 5;

      // Build the final list of causes
      const finalCauses: Cause[] = [];
      const removedCauseIds: string[] = [];

      // Start with existing profile causes
      profile.causes.forEach(cause => {
        if (localChanges.has(cause.id)) {
          const localState = localChanges.get(cause.id);
          if (localState !== null) {
            // Value was modified
            finalCauses.push({
              id: cause.id,
              name: cause.name,
              category: cause.category,
              type: localState.type,
              description: cause.description,
            });
          } else {
            // Value was removed
            removedCauseIds.push(cause.id);
          }
        } else {
          // Value unchanged
          finalCauses.push(cause);
        }
      });

      // Add newly selected values
      localChanges.forEach((localState, valueId) => {
        if (localState !== null && !profile.causes.find(c => c.id === valueId)) {
          finalCauses.push({
            id: localState.id,
            name: localState.name,
            category: localState.category as CauseCategory,
            type: localState.type,
            description: localState.description,
          });
        }
      });

      // Check minimum values requirement
      if (finalCauses.length < minValues) {
        console.log('[Values] Cannot save - below minimum values:', finalCauses.length, 'minimum:', minValues);
        return;
      }

      // Remove causes that were unselected
      if (removedCauseIds.length > 0) {
        await removeCauses(removedCauseIds);
      }

      // Update/add all causes
      await addCauses(finalCauses);

      // Clear local changes
      setLocalChanges(new Map());
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error('[Values] Error saving changes:', error);
    }
  };

  // Save changes when navigating away from the tab
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // This runs when the component is about to be unfocused
        if (hasUnsavedChanges.current) {
          savePendingChanges();
        }
      };
    }, [localChanges, profile.causes])
  );

  const handleValueTap = (valueId: string, valueName: string, valueCategory: string, description?: string) => {
    console.log('[Values] Value tapped:', valueName);
    const currentState = getValueState(valueId);

    setSelectedValueForAction({
      id: valueId,
      name: valueName,
      category: valueCategory,
      description,
      currentState,
    });
    setShowValueActionModal(true);
  };

  const handleValueAction = (action: 'view' | 'aligned' | 'unaligned' | 'deselect') => {
    if (!selectedValueForAction) return;

    const { id, name, category, description } = selectedValueForAction;
    const isBusiness = profile.accountType === 'business';
    const minValues = isBusiness ? 3 : 5;

    if (action === 'view') {
      setShowValueActionModal(false);
      router.push(`/value/${id}`);
      return;
    }

    if (action === 'deselect') {
      // Calculate projected total
      const currentTotal = profile.causes.length;
      const changesAddingValues = Array.from(localChanges.values()).filter(
        v => v !== null && !profile.causes.find(c => c.id === v.id)
      ).length;
      const changesRemovingValues = Array.from(localChanges.entries()).filter(
        ([valueId, v]) => v === null && profile.causes.find(c => c.id === valueId)
      ).length;
      const projectedTotal = currentTotal + changesAddingValues - changesRemovingValues;
      const wouldBeTotal = projectedTotal - 1;

      if (wouldBeTotal < minValues) {
        Alert.alert(
          'Minimum Values Required',
          `${isBusiness ? 'Business accounts' : 'You'} must maintain at least ${minValues} selected values.`,
          [{ text: 'OK' }]
        );
        return;
      }

      setLocalChanges(prev => {
        const next = new Map(prev);
        next.set(id, null);
        return next;
      });
      hasUnsavedChanges.current = true;
      setShowValueActionModal(false);
      return;
    }

    if (action === 'aligned') {
      setLocalChanges(prev => {
        const next = new Map(prev);
        next.set(id, {
          id,
          name,
          category,
          type: 'support',
          description,
        });
        return next;
      });
      hasUnsavedChanges.current = true;
      setShowValueActionModal(false);
      return;
    }

    if (action === 'unaligned') {
      setLocalChanges(prev => {
        const next = new Map(prev);
        next.set(id, {
          id,
          name,
          category,
          type: 'avoid',
          description,
        });
        return next;
      });
      hasUnsavedChanges.current = true;
      setShowValueActionModal(false);
      return;
    }
  };

  // Quick-add handlers
  const handleQuickAdd = async (cause: Cause) => {
    if (!clerkUser?.id) {
      Alert.alert('Error', 'You must be logged in to add to lists');
      return;
    }

    setSelectedValue(cause);
    setShowModeSelectionModal(true);
  };

  const handleModeSelection = async (mode: ValueListMode) => {
    setSelectedMode(mode);
    setShowModeSelectionModal(false);

    // Preset list name and description based on value and mode
    if (selectedValue) {
      const painOrBenefit = mode === 'max_pain' ? 'Pain' : 'Benefit';
      const presetName = `${selectedValue.name} Max ${painOrBenefit}`;
      const presetDescription = `A list of brands and businesses that will inflict maximum financial ${painOrBenefit.toLowerCase()} to ${selectedValue.name}.`;
      setNewListName(presetName);
      setNewListDescription(presetDescription);
    }

    try {
      const lists = await getUserLists(clerkUser!.id);
      setUserLists(lists);
      setShowListSelectionModal(true);
    } catch (error) {
      console.error('[Values] Error loading lists:', error);
      Alert.alert('Error', 'Could not load your lists. Please try again.');
    }
  };

  const handleAddToList = async (listId: string) => {
    if (!selectedValue || !selectedMode) return;

    try {
      // Add the top brands for this value instead of the value card
      const causeData = valuesMatrix[selectedValue.id];
      if (!causeData) {
        Alert.alert('Error', 'Value data not found');
        return;
      }

      const brandList = selectedMode === 'maxBenefit' ? causeData.support : causeData.avoid;
      if (!brandList || brandList.length === 0) {
        Alert.alert('Error', 'No brands found for this value');
        return;
      }

      // Add top 10 brands (or all if less than 10)
      const brandsToAdd = brandList.slice(0, 10);
      let addedCount = 0;

      for (const brandName of brandsToAdd) {
        const brand = brands?.find(b => b.name === brandName);
        if (brand) {
          const brandEntry: Omit<ListEntry, 'id' | 'createdAt'> = {
            type: 'brand',
            brandId: brand.id,
            brandName: brand.name,
            website: brand.website,
          };
          await addEntryToList(listId, brandEntry);
          addedCount++;
        }
      }

      setShowListSelectionModal(false);
      setSelectedValue(null);
      setSelectedMode(null);
      Alert.alert('Success', `Added ${addedCount} brands from ${selectedValue.name} to list!`);
    } catch (error) {
      console.error('[Values] Error adding to list:', error);
      Alert.alert('Error', 'Could not add to list. Please try again.');
    }
  };

  const handleCreateAndAddToList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    if (!clerkUser?.id || !selectedValue || !selectedMode) return;

    try {
      const listId = await createList(clerkUser.id, newListName.trim(), newListDescription.trim());

      // Add the top brands for this value instead of the value card
      const causeData = valuesMatrix[selectedValue.id];
      if (!causeData) {
        Alert.alert('Error', 'Value data not found');
        return;
      }

      const brandList = selectedMode === 'maxBenefit' ? causeData.support : causeData.avoid;
      if (!brandList || brandList.length === 0) {
        Alert.alert('Error', 'No brands found for this value');
        return;
      }

      // Add top 10 brands (or all if less than 10)
      const brandsToAdd = brandList.slice(0, 10);
      let addedCount = 0;

      for (const brandName of brandsToAdd) {
        const brand = brands?.find(b => b.name === brandName);
        if (brand) {
          const brandEntry: Omit<ListEntry, 'id' | 'createdAt'> = {
            type: 'brand',
            brandId: brand.id,
            brandName: brand.name,
            website: brand.website,
          };
          await addEntryToList(listId, brandEntry);
          addedCount++;
        }
      }

      setNewListName('');
      setNewListDescription('');
      setShowListSelectionModal(false);
      setSelectedValue(null);
      setSelectedMode(null);
      Alert.alert('Success', `Created list and added ${addedCount} brands from ${selectedValue.name}!`);
    } catch (error) {
      console.error('[Values] Error creating list:', error);
      Alert.alert('Error', 'Could not create list. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.stickyHeaderContainer, { backgroundColor: colors.background, borderBottomColor: 'rgba(0, 0, 0, 0.05)' }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Image
            source={require('@/assets/images/endo1.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <MenuButton />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleUpdateValues}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, { color: colors.white }]}>
              Update All Values
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton, { borderColor: colors.danger }]}
            onPress={handleResetValues}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, { color: colors.danger }]}>
              Reset All Values
            </Text>
          </TouchableOpacity>
        </View>

        {supportCauses.length === 0 && avoidCauses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Values Selected</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap "Update All Values" to add values
            </Text>
          </View>
        ) : (
          <>
            {supportCauses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Aligned
                </Text>
                <View style={styles.valuesGrid}>
                  {supportCauses.map(cause => {
                    const currentState = getValueState(cause.id);
                    return (
                      <TouchableOpacity
                        key={cause.id}
                        style={[
                          styles.valueChip,
                          currentState === 'support' && { backgroundColor: colors.success, borderColor: colors.success },
                          currentState === 'avoid' && { backgroundColor: colors.danger, borderColor: colors.danger },
                          currentState === 'unselected' && { backgroundColor: 'transparent', borderColor: colors.neutral, borderWidth: 1.5 }
                        ]}
                        onPress={() => handleValueTap(cause.id, cause.name, cause.category, cause.description)}
                        onLongPress={() => router.push(`/value/${cause.id}`)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.valueChipText,
                            currentState === 'support' && { color: colors.white },
                            currentState === 'avoid' && { color: colors.white },
                            currentState === 'unselected' && { color: colors.neutral, fontWeight: '500' as const }
                          ]}
                          numberOfLines={1}
                        >
                          {cause.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {avoidCauses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Unaligned
                </Text>
                <View style={styles.valuesGrid}>
                  {avoidCauses.map(cause => {
                    const currentState = getValueState(cause.id);
                    return (
                      <TouchableOpacity
                        key={cause.id}
                        style={[
                          styles.valueChip,
                          currentState === 'support' && { backgroundColor: colors.success, borderColor: colors.success },
                          currentState === 'avoid' && { backgroundColor: colors.danger, borderColor: colors.danger },
                          currentState === 'unselected' && { backgroundColor: 'transparent', borderColor: colors.neutral, borderWidth: 1.5 }
                        ]}
                        onPress={() => handleValueTap(cause.id, cause.name, cause.category, cause.description)}
                        onLongPress={() => router.push(`/value/${cause.id}`)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.valueChipText,
                            currentState === 'support' && { color: colors.white },
                            currentState === 'avoid' && { color: colors.white },
                            currentState === 'unselected' && { color: colors.neutral, fontWeight: '500' as const }
                          ]}
                          numberOfLines={1}
                        >
                          {cause.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* Unselected Values Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Unselected Values
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Tap to select or cycle values. Long press to explore brands.
          </Text>

          {sortedCategories.map((category) => {
            const values = unselectedValuesByCategory[category];
            if (!values || values.length === 0) return null;

            const Icon = getCategoryIcon(category);
            const isExpanded = expandedCategories.has(category as CauseCategory);
            const displayedValues = isExpanded ? values : values.slice(0, 10);
            const hasMore = values.length > 10;

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Icon size={18} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    {getCategoryLabel(category)}
                  </Text>
                </View>
                <View style={styles.valuesGrid}>
                  {displayedValues.map(value => {
                    const currentState = getValueState(value.id);
                    return (
                      <TouchableOpacity
                        key={value.id}
                        style={[
                          styles.valueChip,
                          currentState === 'unselected' && styles.unselectedValueChip,
                          currentState === 'unselected' && { borderColor: colors.neutral, backgroundColor: 'transparent' },
                          currentState === 'support' && { backgroundColor: colors.success, borderColor: colors.success },
                          currentState === 'avoid' && { backgroundColor: colors.danger, borderColor: colors.danger }
                        ]}
                        onPress={() => handleValueTap(value.id, value.name, value.category)}
                        onLongPress={() => router.push(`/value/${value.id}`)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.valueChipText,
                            currentState === 'unselected' && styles.unselectedValueText,
                            currentState === 'unselected' && { color: colors.neutral },
                            currentState === 'support' && { color: colors.white },
                            currentState === 'avoid' && { color: colors.white }
                          ]}
                          numberOfLines={1}
                        >
                          {value.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {hasMore && (
                  <TouchableOpacity
                    style={[styles.showMoreButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                    onPress={() => toggleCategoryExpanded(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.showMoreText, { color: colors.textSecondary }]}>
                      {isExpanded ? 'Show Less' : `Show ${values.length - 10} More`}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={16} color={colors.textSecondary} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About Your Values</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Tap values to cycle through: Aligned (green) → Unaligned (red) → Unselected (grey). Long press to see brands associated with each value.
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your values help us recommend products and brands that match your beliefs and priorities.
          </Text>
        </View>
      </ScrollView>

      {/* Max Pain/Max Benefit Selection Modal */}
      <Modal
        visible={showModeSelectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModeSelectionModal(false);
          setSelectedValue(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowModeSelectionModal(false);
              setSelectedValue(null);
            }}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <Pressable
            style={[styles.modeSelectionModalContainer, { backgroundColor: colors.background }]}
            onPress={() => {}}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select List Mode
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModeSelectionModal(false);
                  setSelectedValue(null);
                }}
              >
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.quickAddItemName, { color: colors.primary }]}>
                {selectedValue?.name}
              </Text>

              <Text style={[styles.modeSelectionDescription, { color: colors.textSecondary }]}>
                Choose how you want to add this value to your list:
              </Text>

              <View style={styles.modeButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modeButton, { backgroundColor: colors.success }]}
                  onPress={() => handleModeSelection('maxBenefit')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modeButtonTitle, { color: colors.white }]}>
                    Max Benefit
                  </Text>
                  <Text style={[styles.modeButtonDescription, { color: colors.white }]}>
                    Add brands aligned with this value
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeButton, { backgroundColor: colors.danger }]}
                  onPress={() => handleModeSelection('maxPain')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modeButtonTitle, { color: colors.white }]}>
                    Max Pain
                  </Text>
                  <Text style={[styles.modeButtonDescription, { color: colors.white }]}>
                    Add brands unaligned with this value
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </Modal>

      {/* List Selection Modal */}
      <Modal
        visible={showListSelectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowListSelectionModal(false);
          setSelectedValue(null);
          setSelectedMode(null);
          setNewListName('');
          setNewListDescription('');
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowListSelectionModal(false);
              setSelectedValue(null);
              setSelectedMode(null);
              setNewListName('');
              setNewListDescription('');
            }}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <Pressable
            style={[styles.listSelectionModalContainer, { backgroundColor: colors.background }]}
            onPress={() => {}}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add to List
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowListSelectionModal(false);
                  setSelectedValue(null);
                  setSelectedMode(null);
                  setNewListName('');
                  setNewListDescription('');
                }}
              >
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              <Text style={[styles.quickAddItemName, { color: colors.primary }]}>
                {selectedValue?.name}
              </Text>
              <Text style={[styles.modeIndicator, { color: selectedMode === 'maxBenefit' ? colors.success : colors.danger }]}>
                {selectedMode === 'maxBenefit' ? 'Max Benefit Mode' : 'Max Pain Mode'}
              </Text>

              <Text style={[styles.modalLabel, { color: colors.text, marginTop: 16 }]}>
                Select a list:
              </Text>

              {userLists.length === 0 ? (
                <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>
                  You don't have any lists yet. Create one below!
                </Text>
              ) : (
                <View style={styles.quickAddListsContainer}>
                  {userLists.map((list) => (
                    <TouchableOpacity
                      key={list.id}
                      style={[styles.quickAddListItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                      onPress={() => handleAddToList(list.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.listIconContainer, { backgroundColor: colors.primaryLight + '20' }]}>
                        <List size={18} color={colors.primary} strokeWidth={2} />
                      </View>
                      <View style={styles.quickAddListInfo}>
                        <Text style={[styles.quickAddListName, { color: colors.text }]} numberOfLines={1}>
                          {list.name}
                        </Text>
                        <Text style={[styles.quickAddListCount, { color: colors.textSecondary }]}>
                          {list.entries.length} {list.entries.length === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateAndAddToList}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>
                  Create List
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </View>
      </Modal>

      {/* Value Action Modal */}
      <Modal
        visible={showValueActionModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowValueActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowValueActionModal(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <Pressable
            style={[styles.valueActionModalContainer, { backgroundColor: colors.background }]}
            onPress={() => {}}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedValueForAction?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowValueActionModal(false)}>
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.valueActionContent}>
              <Text style={[styles.valueActionCurrentState, { color: colors.textSecondary }]}>
                Currently: {selectedValueForAction?.currentState === 'support' ? 'Aligned' : selectedValueForAction?.currentState === 'avoid' ? 'Unaligned' : 'Unselected'}
              </Text>

              <TouchableOpacity
                style={[styles.valueActionButton, { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border }]}
                onPress={() => handleValueAction('view')}
                activeOpacity={0.7}
              >
                <Text style={[styles.valueActionButtonText, { color: colors.black }]}>
                  View Value
                </Text>
              </TouchableOpacity>

              {selectedValueForAction?.currentState === 'support' && (
                <>
                  <TouchableOpacity
                    style={[styles.valueActionButton, { backgroundColor: colors.danger }]}
                    onPress={() => handleValueAction('unaligned')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.valueActionButtonText, { color: colors.white }]}>
                      Unaligned
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.valueActionButton, { backgroundColor: colors.neutral }]}
                    onPress={() => handleValueAction('deselect')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.valueActionButtonText, { color: colors.white }]}>
                      Deselect
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {selectedValueForAction?.currentState === 'avoid' && (
                <>
                  <TouchableOpacity
                    style={[styles.valueActionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleValueAction('aligned')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.valueActionButtonText, { color: colors.white }]}>
                      Aligned
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.valueActionButton, { backgroundColor: colors.neutral }]}
                    onPress={() => handleValueAction('deselect')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.valueActionButtonText, { color: colors.white }]}>
                      Deselect
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {selectedValueForAction?.currentState === 'unselected' && (
                <>
                  <TouchableOpacity
                    style={[styles.valueActionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleValueAction('aligned')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.valueActionButtonText, { color: colors.white }]}>
                      Aligned
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.valueActionButton, { backgroundColor: colors.danger }]}
                    onPress={() => handleValueAction('unaligned')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.valueActionButtonText, { color: colors.white }]}>
                      Unaligned
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  stickyHeaderContainer: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 0 : 56,
    paddingBottom: 4,
  },
  headerLogo: {
    width: 161,
    height: 47,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  valuesList: {
    gap: 12,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  valueItemContainer: {
    position: 'relative',
    minWidth: 0,
    flexDirection: 'column',
  },
  valueItemContainerFull: {
    width: '100%',
  },
  valueChipWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unselectedValueChip: {
    borderWidth: 1.5,
  },
  valueChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  unselectedValueText: {
    fontWeight: '500' as const,
  },
  valueChipActions: {
    position: 'absolute',
    right: 4,
    top: 4,
    flexDirection: 'row',
    gap: 2,
  },
  chipActionButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  unselectedValueRow: {
    opacity: 0.9,
  },
  valueNameBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignSelf: 'flex-start',
  },
  unselectedValueNameBox: {
    borderWidth: 1.5,
  },
  valueNameText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  valueRowContainer: {
    marginBottom: 0,
  },
  editButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  addActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  cycleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cycleButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  removeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  addTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addTypeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  // Quick-add styles
  valueRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAddButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: 60,
  },
  modeSelectionModalContainer: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  listSelectionModalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalContent: {
    padding: 20,
  },
  modalScrollContent: {
    padding: 20,
  },
  quickAddItemName: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  modeSelectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  modeButtonsContainer: {
    gap: 12,
  },
  modeButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeButtonTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  modeButtonDescription: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  modeIndicator: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  emptyListText: {
    fontSize: 14,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  quickAddListsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  quickAddListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  listIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddListInfo: {
    flex: 1,
  },
  quickAddListName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  quickAddListCount: {
    fontSize: 13,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  modalInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  modalTextArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  modalButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  valueActionModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '100%',
  },
  valueActionContent: {
    gap: 12,
  },
  valueActionCurrentState: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  valueActionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  valueActionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  valueActionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
