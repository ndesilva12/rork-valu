import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink, Plus, X, List } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  PanResponder,
  Platform,
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import productsData from '../../mocks/products-data.json';
import { generateProducts } from '../../mocks/generate-products';
import { useRef, useState } from 'react';
import { getLogoUrl } from '@/lib/logo';
import { AVAILABLE_VALUES } from '@/mocks/causes';
import { UserList, ListEntry, ValueListMode } from '@/types/library';
import { getUserLists, addEntryToList, createList } from '@/services/firebase/listService';

interface ValueDriver {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'behavior';
  description: string;
  reason: string;
  imageUrl: string;
  websiteUrl?: string;
}




export default function ValueDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && width >= 768;

  // Quick-add state
  const [showModeSelectionModal, setShowModeSelectionModal] = useState(false);
  const [showListSelectionModal, setShowListSelectionModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ValueListMode | null>(null);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [quickAddBrandId, setQuickAddBrandId] = useState<string | null>(null);
  const [quickAddBrandName, setQuickAddBrandName] = useState<string | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 100) {
          router.back();
        }
      },
    })
  ).current;

  // First check if the value is in user's selected causes
  let userCause = profile.causes.find(c => c.id === id);
  let isSelected = !!userCause;

  // If not found in user's causes, check AVAILABLE_VALUES
  if (!userCause) {
    // Search through all categories in AVAILABLE_VALUES
    for (const category of Object.values(AVAILABLE_VALUES)) {
      const found = category.find(v => v.id === id);
      if (found) {
        // Convert to the format expected by the rest of the component
        userCause = {
          id: found.id,
          name: found.name,
          category: found.category,
          description: found.description,
          type: undefined, // Not selected, so no type
        };
        break;
      }
    }
  }

  // If still not found, show error
  if (!userCause) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Value not found</Text>
      </View>
    );
  }

  const isSupporting = userCause.type === 'support';
  const isAvoiding = userCause.type === 'avoid';

  const getWebsiteUrl = (brandName: string): string => {
    const domain = brandName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .replace(/corporation|company|inc|group|brands?|industries|systems|technologies|platforms?$/gi, '');
    return `https://${domain}.com`;
  };

  const getDriversFromProducts = () => {
    const valueData = (productsData as Record<string, { support: string[]; oppose: string[] }>)[id];
    
    if (!valueData) {
      return { supports: [], opposes: [] };
    }

    const allProducts = generateProducts();

    const supports = valueData.support.map((brandName, index) => {
      const product = allProducts.find(p => p.name === brandName);
      const productId = (product?.id && product.id.trim()) ? product.id : '';
      const websiteUrl = product?.website || getWebsiteUrl(brandName);
      return {
        id: productId || `${id}-support-${brandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${index}`,
        name: brandName,
        type: 'brand' as 'brand' | 'product' | 'behavior',
        description: product?.brand || brandName,
        reason: `Directly supports ${userCause.name}`,
        position: index + 1,
        imageUrl: getLogoUrl(websiteUrl),
        websiteUrl,
      };
    });

    const opposes = valueData.oppose.map((brandName, index) => {
      const product = allProducts.find(p => p.name === brandName);
      const productId = (product?.id && product.id.trim()) ? product.id : '';
      const websiteUrl = product?.website || getWebsiteUrl(brandName);
      return {
        id: productId || `${id}-oppose-${brandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${index}`,
        name: brandName,
        type: 'brand' as 'brand' | 'product' | 'behavior',
        description: product?.brand || brandName,
        reason: `Opposes ${userCause.name}`,
        position: index + 1,
        imageUrl: getLogoUrl(websiteUrl),
        websiteUrl,
      };
    });

    return {
      supports,
      opposes,
    };
  };

  const drivers = getDriversFromProducts();

  const handleShopPress = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  // Quick-add handlers
  const handleQuickAddValue = async () => {
    if (!profile.id) {
      Alert.alert('Error', 'You must be logged in to add to lists');
      return;
    }

    setQuickAddBrandId(null);
    setQuickAddBrandName(null);
    setShowModeSelectionModal(true);
  };

  const handleQuickAddBrand = async (brandId: string, brandName: string) => {
    if (!profile.id) {
      Alert.alert('Error', 'You must be logged in to add to lists');
      return;
    }

    try {
      const lists = await getUserLists(profile.id);
      setUserLists(lists);
      setQuickAddBrandId(brandId);
      setQuickAddBrandName(brandName);
      setShowListSelectionModal(true);
    } catch (error) {
      console.error('[ValueDetail] Error loading lists:', error);
      Alert.alert('Error', 'Could not load your lists. Please try again.');
    }
  };

  const handleModeSelection = async (mode: ValueListMode) => {
    setSelectedMode(mode);
    setShowModeSelectionModal(false);

    try {
      const lists = await getUserLists(profile.id);
      setUserLists(lists);
      setShowListSelectionModal(true);
    } catch (error) {
      console.error('[ValueDetail] Error loading lists:', error);
      Alert.alert('Error', 'Could not load your lists. Please try again.');
    }
  };

  const handleAddToList = async (listId: string) => {
    // If adding a brand
    if (quickAddBrandId && quickAddBrandName) {
      try {
        const entry: Omit<ListEntry, 'id' | 'createdAt'> = {
          type: 'brand',
          brandId: quickAddBrandId,
          brandName: quickAddBrandName,
        };

        await addEntryToList(listId, entry);
        setShowListSelectionModal(false);
        setQuickAddBrandId(null);
        setQuickAddBrandName(null);
        Alert.alert('Success', `Added ${quickAddBrandName} to list!`);
      } catch (error) {
        console.error('[ValueDetail] Error adding brand to list:', error);
        Alert.alert('Error', 'Could not add to list. Please try again.');
      }
    }
    // If adding a value
    else if (selectedMode && userCause) {
      try {
        const entry: Omit<ListEntry, 'id' | 'createdAt'> = {
          type: 'value',
          valueId: userCause.id,
          valueName: userCause.name,
          mode: selectedMode,
        };

        await addEntryToList(listId, entry);
        setShowListSelectionModal(false);
        setSelectedMode(null);
        Alert.alert('Success', `Added ${userCause.name} to list!`);
      } catch (error) {
        console.error('[ValueDetail] Error adding value to list:', error);
        Alert.alert('Error', 'Could not add to list. Please try again.');
      }
    }
  };

  const handleCreateAndAddToList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    if (!profile.id) return;

    try {
      const listId = await createList(profile.id, newListName.trim(), newListDescription.trim());

      // If adding a brand
      if (quickAddBrandId && quickAddBrandName) {
        const entry: Omit<ListEntry, 'id' | 'createdAt'> = {
          type: 'brand',
          brandId: quickAddBrandId,
          brandName: quickAddBrandName,
        };

        await addEntryToList(listId, entry);

        setNewListName('');
        setNewListDescription('');
        setShowListSelectionModal(false);
        setQuickAddBrandId(null);
        setQuickAddBrandName(null);
        Alert.alert('Success', `Created list and added ${quickAddBrandName}!`);
      }
      // If adding a value
      else if (selectedMode && userCause) {
        const entry: Omit<ListEntry, 'id' | 'createdAt'> = {
          type: 'value',
          valueId: userCause.id,
          valueName: userCause.name,
          mode: selectedMode,
        };

        await addEntryToList(listId, entry);

        setNewListName('');
        setNewListDescription('');
        setShowListSelectionModal(false);
        setSelectedMode(null);
        Alert.alert('Success', `Created list and added ${userCause.name}!`);
      }
    } catch (error) {
      console.error('[ValueDetail] Error creating list:', error);
      Alert.alert('Error', 'Could not create list. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: userCause.name,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleQuickAddValue}
              style={[styles.headerAddButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Plus size={20} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, isLargeScreen && styles.scrollContentCentered]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.contentWrapper, isLargeScreen && styles.contentWrapperConstrained]}>
        <View style={styles.header}>
          {isSelected && (
            <View style={[
              styles.badge,
              isSupporting ? styles.supportBadge : styles.avoidBadge
            ]}>
              <Text style={[
                styles.badgeText,
                isSupporting ? { color: colors.success } : { color: colors.danger }
              ]}>
                {isSupporting ? 'Supporting' : 'Opposing'}
              </Text>
            </View>
          )}
          <Text style={[styles.title, { color: colors.text }]}>{userCause.name}</Text>
          {userCause.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>{userCause.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={colors.primaryLight} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Supports This Value</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Products, brands, and behaviors that align with {userCause.name.toLowerCase()}
          </Text>
          {drivers.supports.length > 0 ? (
            <View style={styles.driversContainer}>
              {drivers.supports.map((driver, index) => (
                <TouchableOpacity
                  key={`${id}-support-${driver.name}-${index}`}
                  style={[styles.driverCard, styles.supportingCard, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => {
                    // Always pass brand name so we can find it even if ID doesn't match
                    router.push(`/brand/${driver.id}?name=${encodeURIComponent(driver.name)}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.leftContent}>
                      {driver.imageUrl ? (
                        <Image source={{ uri: driver.imageUrl }} style={styles.brandLogo} />
                      ) : null}
                      <View style={styles.brandInfo}>
                        <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>{driver.name}</Text>
                        <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>{driver.description}</Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.addBrandButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleQuickAddBrand(driver.id, driver.name);
                        }}
                        activeOpacity={0.7}
                      >
                        <Plus size={18} color={colors.primary} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.shopButton, { backgroundColor: colors.primaryLight }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleShopPress(driver.websiteUrl || '');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.shopButtonText, { color: colors.white }]}>Shop</Text>
                        <ExternalLink size={14} color={colors.white} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No products found that support this value yet</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingDown size={24} color={colors.danger} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Opposes This Value</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Products, brands, and behaviors that work against {userCause.name.toLowerCase()}
          </Text>
          {drivers.opposes.length > 0 ? (
            <View style={styles.driversContainer}>
              {drivers.opposes.map((driver, index) => (
                <TouchableOpacity
                  key={`${id}-oppose-${driver.name}-${index}`}
                  style={[styles.driverCard, styles.opposingCard, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => {
                    // Always pass brand name so we can find it even if ID doesn't match
                    router.push(`/brand/${driver.id}?name=${encodeURIComponent(driver.name)}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.leftContent}>
                      {driver.imageUrl ? (
                        <Image source={{ uri: driver.imageUrl }} style={styles.brandLogo} />
                      ) : null}
                      <View style={styles.brandInfo}>
                        <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>{driver.name}</Text>
                        <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>{driver.description}</Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.addBrandButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleQuickAddBrand(driver.id, driver.name);
                        }}
                        activeOpacity={0.7}
                      >
                        <Plus size={18} color={colors.primary} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.shopButton, { backgroundColor: colors.danger }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleShopPress(driver.websiteUrl || '');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.shopButtonText, { color: colors.white }]}>Shop</Text>
                        <ExternalLink size={14} color={colors.white} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No products found that oppose this value yet</Text>
            </View>
          )}
        </View>
        </View>
      </ScrollView>

      {/* Max Pain/Max Benefit Selection Modal */}
      <Modal
        visible={showModeSelectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModeSelectionModal(false);
          setSelectedMode(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowModeSelectionModal(false);
              setSelectedMode(null);
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
                  setSelectedMode(null);
                }}
              >
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.quickAddItemName, { color: colors.primary }]}>
                {userCause?.name}
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
          setSelectedMode(null);
          setQuickAddBrandId(null);
          setQuickAddBrandName(null);
          setNewListName('');
          setNewListDescription('');
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowListSelectionModal(false);
              setSelectedMode(null);
              setQuickAddBrandId(null);
              setQuickAddBrandName(null);
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
                  setSelectedMode(null);
                  setQuickAddBrandId(null);
                  setQuickAddBrandName(null);
                  setNewListName('');
                  setNewListDescription('');
                }}
              >
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              <Text style={[styles.quickAddItemName, { color: colors.primary }]}>
                {quickAddBrandName || userCause?.name}
              </Text>
              {selectedMode && (
                <Text style={[styles.modeIndicator, { color: selectedMode === 'maxBenefit' ? colors.success : colors.danger }]}>
                  {selectedMode === 'maxBenefit' ? 'Max Benefit Mode' : 'Max Pain Mode'}
                </Text>
              )}

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
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>

              <Text style={[styles.modalLabel, { color: colors.text }]}>Create new list:</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                placeholder="List name"
                placeholderTextColor={colors.textSecondary}
                value={newListName}
                onChangeText={setNewListName}
              />

              <TextInput
                style={[styles.modalTextArea, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textSecondary}
                value={newListDescription}
                onChangeText={setNewListDescription}
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateAndAddToList}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>
                  Create List & Add Item
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentCentered: {
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    padding: 20,
  },
  contentWrapperConstrained: {
    maxWidth: '50%',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    marginBottom: 32,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  supportBadge: {
    backgroundColor: '#EFF6FF',
  },
  avoidBadge: {
    backgroundColor: '#FFD6E8',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  supportBadgeText: {},
  avoidBadgeText: {},
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  driversContainer: {
    gap: 12,
  },
  driverCard: {
    borderRadius: 12,
    padding: 14,
  },
  supportingCard: {},
  opposingCard: {},
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  brandInfo: {
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 3,
  },
  brandCategory: {
    fontSize: 13,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Quick-add styles
  headerAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 16,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBrandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
});
