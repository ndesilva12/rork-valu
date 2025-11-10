import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ArrowLeft,
  Target,
  FolderOpen,
  MapPin,
  Fuel,
  Utensils,
  Coffee,
  ShoppingCart,
  Tv,
  Smartphone,
  Shield,
  Car,
  Laptop,
  Store,
  DollarSign,
  Shirt,
  X,
  Plus,
  List,
  Trash2,
  Edit,
  Search,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  PanResponder,
  StatusBar,
  Alert,
  Modal,
  Dimensions,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import { Image } from 'expo-image';
import MenuButton from '@/components/MenuButton';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Product } from '@/types';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { trpc } from '@/lib/trpc';
import { LOCAL_BUSINESSES } from '@/mocks/local-businesses';
import { getLogoUrl } from '@/lib/logo';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { getAllUserBusinesses, calculateAlignmentScore, normalizeScores, isBusinessWithinRange, BusinessUser } from '@/services/firebase/businessService';
import BusinessMapView from '@/components/BusinessMapView';
import { UserList, ListEntry, ValueListMode } from '@/types/library';
import { getUserLists, createList, deleteList, addEntryToList, removeEntryFromList } from '@/services/firebase/listService';

type MainView = 'forYou' | 'myLibrary' | 'local';
type ForYouSubsection = 'aligned' | 'unaligned' | 'news';
type LocalDistanceOption = 1 | 5 | 10 | 50 | 100 | null;

type FolderCategory = {
  id: string;
  name: string;
  Icon: LucideIcon;
};

const FOLDER_CATEGORIES: FolderCategory[] = [
  { id: 'gas', name: 'Gas & Energy', Icon: Fuel },
  { id: 'fast-food', name: 'Fast Food', Icon: Coffee },
  { id: 'restaurants', name: 'Restaurants', Icon: Utensils },
  { id: 'groceries', name: 'Groceries', Icon: ShoppingCart },
  { id: 'streaming', name: 'Streaming', Icon: Tv },
  { id: 'social-media', name: 'Social Media', Icon: Smartphone },
  { id: 'insurance', name: 'Insurance', Icon: Shield },
  { id: 'vehicles', name: 'Vehicles', Icon: Car },
  { id: 'technology', name: 'Technology', Icon: Laptop },
  { id: 'retail', name: 'Retail', Icon: Store },
  { id: 'financial', name: 'Financial Services', Icon: DollarSign },
  { id: 'fashion', name: 'Fashion', Icon: Shirt },
];

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile, isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const [mainView, setMainView] = useState<MainView>('forYou');
  const [forYouSubsection, setForYouSubsection] = useState<ForYouSubsection>('aligned');
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [showAllAligned, setShowAllAligned] = useState<boolean>(false);
  const [showAllLeast, setShowAllLeast] = useState<boolean>(false);
  const [alignedLoadCount, setAlignedLoadCount] = useState<number>(10);
  const [unalignedLoadCount, setUnalignedLoadCount] = useState<number>(10);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [localDistance, setLocalDistance] = useState<LocalDistanceOption>(null);
  const [userBusinesses, setUserBusinesses] = useState<BusinessUser[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);

  // Library state
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [libraryView, setLibraryView] = useState<'overview' | 'detail'>('overview');
  const [selectedList, setSelectedList] = useState<UserList | 'browse' | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  // Quick-add state
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddItem, setQuickAddItem] = useState<{type: 'brand' | 'business' | 'value', id: string, name: string} | null>(null);
  const [selectedValueMode, setSelectedValueMode] = useState<ValueListMode | null>(null);
  const [showValueModeModal, setShowValueModeModal] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch brands and values from Firebase via DataContext
  const { brands, values, valuesMatrix, isLoading, error } = useData();

  // Request location permission and get user's location
  const requestLocation = async () => {
    try {
      console.log('[Home] Requesting location...');

      // Check if permission is already granted
      let { status } = await Location.getForegroundPermissionsAsync();
      console.log('[Home] Current permission status:', status);

      // If not granted, request permission
      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
        console.log('[Home] Permission request result:', status);
      }

      if (status !== 'granted') {
        console.log('[Home] ❌ Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to filter brands by distance.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('[Home] ✅ Permission granted, getting location...');
      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(newLocation);
      console.log('[Home] ✅ Got location:', newLocation);
    } catch (error) {
      console.error('[Home] ❌ Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please try again.');
    }
  };

  // Fetch user businesses and request location when "local" mode is selected
  // Fetch user businesses on mount
  useEffect(() => {
    const fetchUserBusinesses = async () => {
      try {
        console.log('[Home] Fetching user businesses');
        const businesses = await getAllUserBusinesses();
        console.log('[Home] Fetched user businesses:', businesses.length);
        setUserBusinesses(businesses);
      } catch (error) {
        console.error('[Home] Error fetching user businesses:', error);
      }
    };

    fetchUserBusinesses();
  }, []);

  // Request location when local view is activated
  useEffect(() => {
    if (mainView === 'local') {
      requestLocation();
    }
  }, [mainView]);

  // Reopen map if returning from business detail page
  useEffect(() => {
    if (params.fromMap === 'true') {
      // Clear the parameter and reopen the map
      router.setParams({ fromMap: undefined });
      setShowMapModal(true);
      // Ensure local view is active
      if (mainView !== 'local') {
        setMainView('local');
      }
    }
  }, [params.fromMap]);

  // Fetch user lists when library view is activated
  useEffect(() => {
    if (mainView === 'myLibrary' && clerkUser?.id) {
      loadUserLists();
    }
    // Reset to overview when leaving library
    if (mainView !== 'myLibrary') {
      setLibraryView('overview');
      setSelectedList(null);
    }
  }, [mainView, clerkUser?.id]);

  const loadUserLists = async () => {
    if (!clerkUser?.id) return;

    setIsLoadingLists(true);
    try {
      const lists = await getUserLists(clerkUser.id);
      setUserLists(lists);
    } catch (error) {
      console.error('[Home] Error loading user lists:', error);
      Alert.alert('Error', 'Could not load your lists. Please try again.');
    } finally {
      setIsLoadingLists(false);
    }
  };

  const { topSupport, topAvoid, allSupport, allSupportFull, allAvoidFull, scoredBrands, brandDistances } = useMemo(() => {
    // Combine brands from CSV and user businesses
    const csvBrands = brands || [];
    const localBizList = userBusinesses || [];

    // Filter local businesses to only include those with >50% value overlap with user
    const userValueIds = new Set(profile.causes.map(c => c.id));
    const filteredLocalBiz = localBizList.filter((biz: any) => {
      if (!biz.values || biz.values.length === 0 || userValueIds.size === 0) return false;
      const bizValueIds = new Set(biz.values.map((v: any) => v.id));
      const overlapCount = Array.from(userValueIds).filter(id => bizValueIds.has(id)).length;
      const overlapPercentage = (overlapCount / userValueIds.size) * 100;
      return overlapPercentage > 50;
    });

    const currentBrands = [...csvBrands, ...filteredLocalBiz];

    if (!currentBrands || currentBrands.length === 0 || !valuesMatrix) {
      console.log('[Home] Missing data:', {
        hasBrands: !!currentBrands,
        brandsCount: currentBrands?.length || 0,
        localBizCount: filteredLocalBiz.length,
        hasValuesMatrix: !!valuesMatrix,
        valuesCount: valuesMatrix ? Object.keys(valuesMatrix).length : 0
      });
      return {
        topSupport: [],
        topAvoid: [],
        allSupport: [],
        allSupportFull: [],
        allAvoidFull: [],
        scoredBrands: new Map(),
        brandDistances: new Map(),
      };
    }

    const supportedCauses = profile.causes.filter((c) => c.type === 'support').map((c) => c.id);
    const avoidedCauses = profile.causes.filter((c) => c.type === 'avoid').map((c) => c.id);
    const allUserCauses = [...supportedCauses, ...avoidedCauses];

    console.log('[Home] Scoring brands:', {
      totalBrands: currentBrands.length,
      userCauses: allUserCauses,
      supportedCauses,
      avoidedCauses,
      sampleBrandNames: currentBrands.slice(0, 5).map(b => b.name),
      sampleValueIds: Object.keys(valuesMatrix).slice(0, 5)
    });

    // Score each brand based on position in the values matrix
    const scored = currentBrands.map((product) => {
      const brandName = product.name;
      let totalSupportScore = 0;
      let totalAvoidScore = 0;

      // Collect positions for this brand across ALL user's selected values
      const alignedPositions: number[] = [];
      const unalignedPositions: number[] = [];

      // Check EACH user cause to find the brand's position
      allUserCauses.forEach((causeId) => {
        const causeData = valuesMatrix[causeId];
        if (!causeData) {
          // If cause data doesn't exist, treat as position 11 (not found)
          alignedPositions.push(11);
          return;
        }

        // Find position in support list (1-10, or 11 if not found)
        const supportIndex = causeData.support?.indexOf(brandName);
        const supportPosition = supportIndex !== undefined && supportIndex >= 0
          ? supportIndex + 1 // Convert to 1-indexed
          : 11; // Not in top 10

        // Find position in oppose list (1-10, or 11 if not found)
        const opposeIndex = causeData.oppose?.indexOf(brandName);
        const opposePosition = opposeIndex !== undefined && opposeIndex >= 0
          ? opposeIndex + 1 // Convert to 1-indexed
          : 11; // Not in top 10

        // If user supports this cause
        if (supportedCauses.includes(causeId)) {
          // Good if brand is in support list, bad if in oppose list
          if (supportPosition <= 10) {
            alignedPositions.push(supportPosition);
            totalSupportScore += 100;
            // For unaligned calculation, this value doesn't apply (brand is good here)
            unalignedPositions.push(11);
          } else if (opposePosition <= 10) {
            unalignedPositions.push(opposePosition);
            totalAvoidScore += 100;
            // For aligned calculation, this value doesn't apply (brand is bad here)
            alignedPositions.push(11);
          } else {
            // Brand doesn't appear in either list for this value
            alignedPositions.push(11);
            unalignedPositions.push(11);
          }
        }

        // If user avoids this cause
        if (avoidedCauses.includes(causeId)) {
          // Good if brand is in oppose list, bad if in support list
          if (opposePosition <= 10) {
            alignedPositions.push(opposePosition);
            totalSupportScore += 100;
            // For unaligned calculation, this value doesn't apply (brand is good here)
            unalignedPositions.push(11);
          } else if (supportPosition <= 10) {
            unalignedPositions.push(supportPosition);
            totalAvoidScore += 100;
            // For aligned calculation, this value doesn't apply (brand is bad here)
            alignedPositions.push(11);
          } else {
            // Brand doesn't appear in either list for this value
            alignedPositions.push(11);
            unalignedPositions.push(11);
          }
        }
      });

      // Calculate alignment strength based on average position across ALL values
      let alignmentStrength = 50; // Neutral default

      if (totalSupportScore > totalAvoidScore && totalSupportScore > 0) {
        // Aligned brand: calculate score based on average position
        const avgPosition = alignedPositions.reduce((sum, pos) => sum + pos, 0) / alignedPositions.length;
        // Map position to score: position 1 = 100, position 11 = 50
        // Formula: score = 100 - ((avgPosition - 1) / 10) * 50
        alignmentStrength = Math.round(100 - ((avgPosition - 1) / 10) * 50);
      } else if (totalAvoidScore > totalSupportScore && totalAvoidScore > 0) {
        // Unaligned brand: calculate score based on average position
        const avgPosition = unalignedPositions.reduce((sum, pos) => sum + pos, 0) / unalignedPositions.length;
        // Map position to score: position 1 = 0, position 11 = 50
        // Formula: score = ((avgPosition - 1) / 10) * 50
        alignmentStrength = Math.round(((avgPosition - 1) / 10) * 50);
      }

      return {
        product,
        totalSupportScore,
        totalAvoidScore,
        alignmentStrength,
        matchingValuesCount: alignedPositions.length + unalignedPositions.length,
      };
    });

    // Sort brands into support and avoid categories BY ALIGNMENT STRENGTH
    const allSupportSorted = scored
      .filter((s) => s.totalSupportScore > s.totalAvoidScore && s.totalSupportScore > 0)
      .sort((a, b) => b.alignmentStrength - a.alignmentStrength); // Sort by score, not count!

    const allAvoidSorted = scored
      .filter((s) => s.totalAvoidScore > s.totalSupportScore && s.totalAvoidScore > 0)
      .sort((a, b) => a.alignmentStrength - b.alignmentStrength); // Lowest score first for unaligned

    console.log('[Home] Scoring results:', {
      alignedCount: allSupportSorted.length,
      unalignedCount: allAvoidSorted.length,
      topAligned: allSupportSorted.slice(0, 3).map(s => ({ name: s.product.name, score: s.alignmentStrength })),
      topUnaligned: allAvoidSorted.slice(0, 3).map(s => ({ name: s.product.name, score: s.alignmentStrength }))
    });

    const scoredMap = new Map(scored.map((s) => [s.product.id, s.alignmentStrength]));

    return {
      topSupport: allSupportSorted.slice(0, 10).map((s) => s.product),
      topAvoid: allAvoidSorted.slice(0, 10).map((s) => s.product),
      allSupport: allSupportSorted.map((s) => s.product),
      allSupportFull: allSupportSorted.map((s) => s.product),
      allAvoidFull: allAvoidSorted.map((s) => s.product),
      scoredBrands: scoredMap,
    };
  }, [profile.causes, brands, userBusinesses, valuesMatrix]);

  // Compute local businesses when "local" view is active
  const localBusinessData = useMemo(() => {
    if (mainView !== 'local' || !userLocation || userBusinesses.length === 0) {
      return {
        alignedBusinesses: [],
        unalignedBusinesses: [],
      };
    }

    console.log('[Home] Computing local business scores:', {
      businessCount: userBusinesses.length,
      userCausesCount: profile.causes.length,
      localDistance,
      userLocation,
    });

    // Calculate raw scores for all businesses
    const businessesWithRawScores = userBusinesses.map((business) => {
      const rawScore = calculateAlignmentScore(profile.causes, business.causes || []);

      // Only check distance if a filter is selected, otherwise show all
      let rangeResult;
      if (localDistance === null) {
        // No distance filter - calculate distance but consider all businesses in range
        const tempResult = isBusinessWithinRange(business, userLocation.latitude, userLocation.longitude, 999999);
        rangeResult = {
          ...tempResult,
          isWithinRange: true, // All businesses are "in range" when no filter is applied
        };
      } else {
        rangeResult = isBusinessWithinRange(business, userLocation.latitude, userLocation.longitude, localDistance);
      }

      return {
        business,
        rawScore,
        distance: rangeResult.closestDistance,
        closestLocation: rangeResult.closestLocation,
        isWithinRange: rangeResult.isWithinRange,
      };
    });

    // Normalize scores to 10-90 range with bell curve distribution
    const rawScores = businessesWithRawScores.map(b => b.rawScore);
    const normalizedScores = normalizeScores(rawScores);

    // Map normalized scores back to businesses
    const scoredBusinesses = businessesWithRawScores.map((b, index) => ({
      ...b,
      alignmentScore: normalizedScores[index],
    }));

    // Filter by distance (all will be in range if localDistance is null)
    const businessesInRange = scoredBusinesses.filter((b) => b.isWithinRange);

    // Split into aligned (≥50) and unaligned (<50)
    const aligned = businessesInRange
      .filter((b) => b.alignmentScore >= 50)
      .sort((a, b) => b.alignmentScore - a.alignmentScore); // Highest score first

    const unaligned = businessesInRange
      .filter((b) => b.alignmentScore < 50)
      .sort((a, b) => a.alignmentScore - b.alignmentScore); // Lowest score first

    console.log('[Home] Local business results:', {
      totalBusinesses: userBusinesses.length,
      inRange: businessesInRange.length,
      aligned: aligned.length,
      unaligned: unaligned.length,
      topAligned: aligned.slice(0, 3).map(b => ({ name: b.business.businessInfo.name, score: b.alignmentScore, distance: b.distance })),
      topUnaligned: unaligned.slice(0, 3).map(b => ({ name: b.business.businessInfo.name, score: b.alignmentScore, distance: b.distance })),
    });

    return {
      alignedBusinesses: aligned,
      unalignedBusinesses: unaligned,
    };
  }, [mainView, userLocation, userBusinesses, profile.causes, localDistance]);

  const categorizedBrands = useMemo(() => {
    const categorized = new Map<string, Product[]>();

    allSupport.forEach((product) => {
      FOLDER_CATEGORIES.forEach((category) => {
        const productCategory = product.category.toLowerCase();
        const productBrand = product.name.toLowerCase();

        let match = false;

        if (
          category.id === 'gas' &&
          (productCategory.includes('energy') ||
            productCategory.includes('petroleum') ||
            productBrand.includes('exxon') ||
            productBrand.includes('chevron') ||
            productBrand.includes('shell') ||
            productBrand.includes('bp'))
        ) {
          match = true;
        } else if (
          category.id === 'fast-food' &&
          (productBrand.includes('mcdonald') ||
            productBrand.includes('burger king') ||
            productBrand.includes('wendy') ||
            productBrand.includes('kfc') ||
            productBrand.includes('taco') ||
            productBrand.includes('subway') ||
            productBrand.includes('chick-fil-a'))
        ) {
          match = true;
        } else if (category.id === 'restaurants' && (productCategory.includes('food') || productCategory.includes('restaurant'))) {
          match = true;
        } else if (
          category.id === 'groceries' &&
          (productBrand.includes('walmart') ||
            productBrand.includes('target') ||
            productBrand.includes('costco') ||
            productBrand.includes('kroger') ||
            productBrand.includes('whole foods') ||
            productBrand.includes('publix'))
        ) {
          match = true;
        } else if (
          category.id === 'streaming' &&
          (productBrand.includes('netflix') ||
            productBrand.includes('disney') ||
            productBrand.includes('hulu') ||
            productBrand.includes('spotify') ||
            productBrand.includes('youtube') ||
            productBrand.includes('amazon'))
        ) {
          match = true;
        } else if (
          category.id === 'social-media' &&
            (productBrand.includes('meta') ||
            productBrand.includes('facebook') ||
            productBrand.includes('instagram') ||
            productBrand.includes('tiktok') ||
            productBrand.includes('snapchat') ||
            productBrand.includes('x') ||
            productBrand.includes('twitter'))
        ) {
    match = true;
  } else if (
    category.id === 'insurance' &&
    (productCategory.includes('insurance') ||
      productBrand.includes('state farm') ||
      productBrand.includes('allstate') ||
      productBrand.includes('progressive') ||
      productBrand.includes('geico'))
  ) {
    match = true;
  } else if (
    category.id === 'vehicles' &&
    (productCategory.includes('auto') ||
      productBrand.includes('tesla') ||
      productBrand.includes('ford') ||
      productBrand.includes('toyota') ||
      productBrand.includes('honda') ||
      productBrand.includes('chevrolet'))
  ) {
    match = true;
  } else if (category.id === 'technology' && productCategory.includes('tech')) {
    match = true;
  } else if (category.id === 'retail' && (productCategory.includes('retail') || productCategory.includes('store'))) {
    match = true;
  } else if (category.id === 'financial' && productCategory.includes('financial')) {
    match = true;
  } else if (category.id === 'fashion' && productCategory.includes('fashion')) {
    match = true;
  }

        if (match) {
          if (!categorized.has(category.id)) {
            categorized.set(category.id, []);
          }
          const existing = categorized.get(category.id)!;
          if (!existing.find((p) => p.id === product.id)) {
            existing.push(product);
          }
        }
      });
    });

    return categorized;
  }, [allSupport]);

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/brand/[id]',
      params: { id: product.id },
    });
  };

  const renderBrandCard = (product: Product, type: 'support' | 'avoid') => {
    const isSupport = type === 'support';
    const titleColor = isSupport ? colors.primaryLight : colors.danger;
    const alignmentScore = scoredBrands.get(product.id) || 0;

    return (
      <TouchableOpacity
        key={product.id}
        style={[
          styles.brandCard,
          { backgroundColor: isDarkMode ? colors.backgroundSecondary : 'rgba(0, 0, 0, 0.06)' },
        ]}
        onPress={() => handleProductPress(product)}
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
          <TouchableOpacity
            style={[styles.quickAddButton, { backgroundColor: colors.background }]}
            onPress={(e) => {
              e.stopPropagation();
              handleQuickAdd('brand', product.id, product.name);
            }}
            activeOpacity={0.7}
          >
            <Plus size={18} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const handleBusinessPress = (businessId: string) => {
    router.push({
      pathname: '/business/[id]',
      params: { id: businessId },
    });
  };

  const renderLocalBusinessCard = (
    businessData: { business: BusinessUser; alignmentScore: number; distance?: number; closestLocation?: string },
    type: 'aligned' | 'unaligned'
  ) => {
    const isAligned = type === 'aligned';
    const titleColor = isAligned ? colors.primaryLight : colors.danger;
    const { business, alignmentScore, distance, closestLocation } = businessData;

    return (
      <TouchableOpacity
        key={business.id}
        style={[
          styles.brandCard,
          { backgroundColor: isDarkMode ? colors.backgroundSecondary : 'rgba(0, 0, 0, 0.06)' },
        ]}
        onPress={() => handleBusinessPress(business.id)}
        activeOpacity={0.7}
      >
        <View style={styles.brandCardInner}>
          <View style={styles.brandLogoContainer}>
            <Image
              source={{ uri: business.businessInfo.logoUrl ? business.businessInfo.logoUrl : getLogoUrl(business.businessInfo.website || '') }}
              style={styles.brandLogo}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>
          <View style={styles.brandCardContent}>
            <Text style={[styles.brandName, { color: titleColor }]} numberOfLines={2}>
              {business.businessInfo.name}
            </Text>
            <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
              {business.businessInfo.category}
            </Text>
            {distance !== undefined && (
              <View style={styles.distanceContainer}>
                <MapPin size={12} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                  {formatDistance(distance)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.brandScoreContainer}>
            <Text style={[styles.brandScore, { color: titleColor }]}>{alignmentScore}</Text>
          </View>
          <TouchableOpacity
            style={[styles.quickAddButton, { backgroundColor: colors.background }]}
            onPress={(e) => {
              e.stopPropagation();
              handleQuickAdd('business', business.id, business.businessInfo.name);
            }}
            activeOpacity={0.7}
          >
            <Plus size={18} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const localDistanceOptions: LocalDistanceOption[] = [100, 50, 10, 5, 1];

  const renderMainViewSelector = () => (
    <>
      {/* Main View Selector - Three Views */}
      <View style={styles.mainViewRow}>
        <View style={[styles.mainViewSelector, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.mainViewButton, mainView === 'forYou' && { backgroundColor: colors.primary }]}
            onPress={() => setMainView('forYou')}
            activeOpacity={0.7}
          >
            <Text style={[styles.mainViewText, { color: mainView === 'forYou' ? colors.white : colors.textSecondary }]}>
              For You
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainViewButton, mainView === 'myLibrary' && { backgroundColor: colors.primary }]}
            onPress={() => setMainView('myLibrary')}
            activeOpacity={0.7}
          >
            <Text style={[styles.mainViewText, { color: mainView === 'myLibrary' ? colors.white : colors.textSecondary }]}>
              My Library
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainViewButton, mainView === 'local' && { backgroundColor: colors.primary }]}
            onPress={() => {
              setMainView('local');
              // Reset to "all" (no filter) when switching to Local view
              setLocalDistance(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.mainViewText, { color: mainView === 'local' ? colors.white : colors.textSecondary }]}>
              Local
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* For You Subsection Selector */}
      {mainView === 'forYou' && (
        <View style={styles.subsectionRow}>
          <TouchableOpacity
            style={[
              styles.subsectionButton,
              forYouSubsection === 'aligned' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setForYouSubsection('aligned')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.subsectionText,
                { color: forYouSubsection === 'aligned' ? colors.text : colors.textSecondary },
                forYouSubsection === 'aligned' && styles.subsectionTextActive,
              ]}
            >
              Aligned
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subsectionButton,
              forYouSubsection === 'unaligned' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setForYouSubsection('unaligned')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.subsectionText,
                { color: forYouSubsection === 'unaligned' ? colors.text : colors.textSecondary },
                forYouSubsection === 'unaligned' && styles.subsectionTextActive,
              ]}
            >
              Unaligned
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subsectionButton,
              forYouSubsection === 'news' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setForYouSubsection('news')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.subsectionText,
                { color: forYouSubsection === 'news' ? colors.text : colors.textSecondary },
                forYouSubsection === 'news' && styles.subsectionTextActive,
              ]}
            >
              News
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Distance Filter Row - Shows when Local view is selected */}
      {mainView === 'local' && (
        <View style={styles.distanceFilterRow}>
          <View style={styles.distanceOptionsContainer}>
            {localDistanceOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.distanceFilterButton,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  localDistance === option && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setLocalDistance(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.distanceFilterText,
                    { color: colors.text },
                    localDistance === option && { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  {option} mi
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.mapFilterButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowMapModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.mapFilterButtonText, { color: colors.white }]}>Map</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderForYouView = () => {
    // Aligned subsection
    if (forYouSubsection === 'aligned') {
      return (
        <View style={styles.section}>
          <View style={styles.brandsContainer}>
            {allSupportFull.slice(0, alignedLoadCount).map((product) => renderBrandCard(product, 'support'))}
            {alignedLoadCount < allSupportFull.length && (
              <TouchableOpacity
                style={[styles.loadMoreButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setAlignedLoadCount(alignedLoadCount + 10)}
                activeOpacity={0.7}
              >
                <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                  Load More ({allSupportFull.length - alignedLoadCount} remaining)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // Unaligned subsection
    if (forYouSubsection === 'unaligned') {
      return (
        <View style={styles.section}>
          <View style={styles.brandsContainer}>
            {allAvoidFull.slice(0, unalignedLoadCount).map((product) => renderBrandCard(product, 'avoid'))}
            {unalignedLoadCount < allAvoidFull.length && (
              <TouchableOpacity
                style={[styles.loadMoreButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setUnalignedLoadCount(unalignedLoadCount + 10)}
                activeOpacity={0.7}
              >
                <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                  Load More ({allAvoidFull.length - unalignedLoadCount} remaining)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // News subsection
    if (forYouSubsection === 'news') {
      return (
        <View style={styles.section}>
          <View style={[styles.placeholderContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              News feed coming soon! This will show X posts about aligned and unaligned brands.
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderLocalView = () => {
    const { alignedBusinesses, unalignedBusinesses } = localBusinessData;

    return (
      <>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={24} color={colors.success} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Aligned Businesses</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAllAligned(!showAllAligned)} activeOpacity={0.7}>
              <Text style={[styles.showAllButton, { color: colors.primary }]}>{showAllAligned ? 'Hide' : 'Show All'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.brandsContainer}>
            {alignedBusinesses.length > 0 ? (
              (showAllAligned ? alignedBusinesses : alignedBusinesses.slice(0, 5)).map((biz) => renderLocalBusinessCard(biz, 'aligned'))
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {localDistance === null
                  ? 'No aligned businesses found'
                  : `No aligned businesses found within ${localDistance} mile${localDistance !== 1 ? 's' : ''}`}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { marginTop: 4, marginBottom: 14 }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <TrendingDown size={24} color={colors.danger} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Unaligned Businesses</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAllLeast(!showAllLeast)} activeOpacity={0.7}>
              <Text style={[styles.showAllButton, { color: colors.primary }]}>{showAllLeast ? 'Hide' : 'Show All'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.brandsContainer}>
            {unalignedBusinesses.length > 0 ? (
              (showAllLeast ? unalignedBusinesses : unalignedBusinesses.slice(0, 5)).map((biz) => renderLocalBusinessCard(biz, 'unaligned'))
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {localDistance === null
                  ? 'No unaligned businesses found'
                  : `No unaligned businesses found within ${localDistance} mile${localDistance !== 1 ? 's' : ''}`}
              </Text>
            )}
          </View>
        </View>
      </>
    );
  };

  // Library handler functions
  const handleCreateList = async () => {
    console.log('[Home] handleCreateList called');
    console.log('[Home] newListName:', newListName);
    console.log('[Home] clerkUser.id:', clerkUser?.id);

    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    if (!clerkUser?.id) {
      Alert.alert('Error', 'You must be logged in to create a list');
      return;
    }

    try {
      console.log('[Home] Creating list...');
      await createList(clerkUser.id, newListName.trim(), newListDescription.trim());
      setNewListName('');
      setNewListDescription('');
      setShowCreateListModal(false);
      await loadUserLists();
      Alert.alert('Success', 'List created successfully!');
    } catch (error) {
      console.error('[Home] Error creating list:', error);
      Alert.alert('Error', 'Could not create list. Please try again.');
    }
  };

  const handleDeleteList = async (listId: string) => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteList(listId);
              await loadUserLists();
              Alert.alert('Success', 'List deleted successfully');
            } catch (error) {
              console.error('[Home] Error deleting list:', error);
              Alert.alert('Error', 'Could not delete list. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleOpenList = (list: UserList | 'browse') => {
    setSelectedList(list);
    setLibraryView('detail');
  };

  const handleBackToLibrary = () => {
    setLibraryView('overview');
    setSelectedList(null);
  };

  // Quick-add handler functions
  const handleQuickAdd = async (type: 'brand' | 'business' | 'value', id: string, name: string) => {
    // Load lists if not already loaded
    if (userLists.length === 0 && clerkUser?.id) {
      try {
        const lists = await getUserLists(clerkUser.id);
        setUserLists(lists);
      } catch (error) {
        console.error('[Home] Error loading lists for quick-add:', error);
      }
    }

    // For values, show mode selection first
    if (type === 'value') {
      setQuickAddItem({ type, id, name });
      setShowValueModeModal(true);
    } else {
      // For brands and businesses, go straight to list selection
      setQuickAddItem({ type, id, name });
      setShowQuickAddModal(true);
    }
  };

  const handleValueModeSelected = (mode: ValueListMode) => {
    setSelectedValueMode(mode);
    setShowValueModeModal(false);
    setShowQuickAddModal(true);
  };

  const handleAddToList = async (listId: string) => {
    if (!quickAddItem) return;

    try {
      let entry: Omit<ListEntry, 'id' | 'createdAt'>;

      if (quickAddItem.type === 'brand') {
        entry = {
          type: 'brand',
          brandId: quickAddItem.id,
          brandName: quickAddItem.name,
        };
      } else if (quickAddItem.type === 'business') {
        entry = {
          type: 'business',
          businessId: quickAddItem.id,
          businessName: quickAddItem.name,
        };
      } else if (quickAddItem.type === 'value') {
        if (!selectedValueMode) {
          Alert.alert('Error', 'Please select Max Pain or Max Benefit');
          return;
        }
        entry = {
          type: 'value',
          valueId: quickAddItem.id,
          valueName: quickAddItem.name,
          mode: selectedValueMode,
        };
      } else {
        return;
      }

      await addEntryToList(listId, entry);
      setShowQuickAddModal(false);
      setQuickAddItem(null);
      setSelectedValueMode(null);
      Alert.alert('Success', `Added ${quickAddItem.name} to list!`);

      // Reload lists if in library view
      if (mainView === 'myLibrary') {
        await loadUserLists();
      }
    } catch (error) {
      console.error('[Home] Error adding to list:', error);
      Alert.alert('Error', 'Could not add item to list. Please try again.');
    }
  };

  const handleCreateAndAddToList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    if (!clerkUser?.id || !quickAddItem) return;

    try {
      const listId = await createList(clerkUser.id, newListName.trim(), newListDescription.trim());

      // Add the item to the new list
      let entry: Omit<ListEntry, 'id' | 'createdAt'>;

      if (quickAddItem.type === 'brand') {
        entry = {
          type: 'brand',
          brandId: quickAddItem.id,
          brandName: quickAddItem.name,
        };
      } else if (quickAddItem.type === 'business') {
        entry = {
          type: 'business',
          businessId: quickAddItem.id,
          businessName: quickAddItem.name,
        };
      } else if (quickAddItem.type === 'value') {
        if (!selectedValueMode) {
          Alert.alert('Error', 'Please select Max Pain or Max Benefit');
          return;
        }
        entry = {
          type: 'value',
          valueId: quickAddItem.id,
          valueName: quickAddItem.name,
          mode: selectedValueMode,
        };
      } else {
        return;
      }

      await addEntryToList(listId, entry);

      // Clean up state
      setNewListName('');
      setNewListDescription('');
      setShowQuickAddModal(false);
      setQuickAddItem(null);
      setSelectedValueMode(null);
      await loadUserLists();

      Alert.alert('Success', `Created list and added ${quickAddItem.name}!`);
    } catch (error) {
      console.error('[Home] Error creating list and adding item:', error);
      Alert.alert('Error', 'Could not create list. Please try again.');
    }
  };

  const renderListDetailView = () => {
    if (!selectedList) return null;

    // Browse list - show categories with aligned brands
    if (selectedList === 'browse') {
      return (
        <View style={styles.section}>
          <View style={styles.listDetailHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLibrary}
              activeOpacity={0.7}
            >
              <ArrowLeft
                size={24}
                color={colors.primary}
                strokeWidth={2}
              />
              <Text style={[styles.backButtonText, { color: colors.primary }]}>Library</Text>
            </TouchableOpacity>
            <Text style={[styles.listDetailTitle, { color: colors.text }]}>Browse</Text>
          </View>

          <ScrollView style={styles.listDetailContent}>
            {FOLDER_CATEGORIES.map((category) => {
              const categoryBrands = categorizedBrands.get(category.id) || [];
              if (categoryBrands.length === 0) return null;

              return (
                <View key={category.id} style={styles.browseCategory}>
                  <View style={styles.browseCategoryHeader}>
                    <View style={[styles.browseCategoryIcon, { backgroundColor: colors.primaryLight + '20' }]}>
                      <category.Icon size={20} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={[styles.browseCategoryTitle, { color: colors.text }]}>
                      {category.name}
                    </Text>
                    <Text style={[styles.browseCategoryCount, { color: colors.textSecondary }]}>
                      {categoryBrands.length}
                    </Text>
                  </View>
                  <View style={styles.brandsContainer}>
                    {categoryBrands.slice(0, 5).map((product) => renderBrandCard(product, 'support'))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    // User list detail
    const list = selectedList as UserList;
    return (
      <View style={styles.section}>
        <View style={styles.listDetailHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLibrary}
            activeOpacity={0.7}
          >
            <ArrowLeft
              size={24}
              color={colors.primary}
              strokeWidth={2}
            />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Library</Text>
          </TouchableOpacity>
          <Text style={[styles.listDetailTitle, { color: colors.text }]}>{list.name}</Text>
          {list.description && (
            <Text style={[styles.listDetailDescription, { color: colors.textSecondary }]}>
              {list.description}
            </Text>
          )}
        </View>

        <ScrollView style={styles.listDetailContent}>
          {list.entries.length === 0 ? (
            <View style={[styles.placeholderContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                No items in this list yet. Use the + button on brands, businesses, or values to add them here.
              </Text>
            </View>
          ) : (
            <View style={styles.listEntriesContainer}>
              {list.entries.map((entry) => (
                <View key={entry.id} style={[styles.listEntryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <View style={styles.listEntryContent}>
                    <Text style={[styles.listEntryType, { color: colors.textSecondary }]}>
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                    </Text>
                    <Text style={[styles.listEntryName, { color: colors.text }]}>
                      {'brandName' in entry ? entry.brandName :
                       'businessName' in entry ? entry.businessName :
                       'valueName' in entry ? entry.valueName :
                       'title' in entry ? entry.title : 'Text'}
                    </Text>
                    {entry.type === 'value' && 'mode' in entry && (
                      <Text style={[styles.listEntryMode, { color: entry.mode === 'maxPain' ? colors.danger : colors.success }]}>
                        {entry.mode === 'maxPain' ? 'Max Pain' : 'Max Benefit'}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderMyLibraryView = () => {
    // If viewing a list detail, show that instead
    if (libraryView === 'detail') {
      return renderListDetailView();
    }

    // Otherwise show the library overview
    if (isLoadingLists) {
      return (
        <View style={styles.section}>
          <View style={[styles.placeholderContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              Loading your lists...
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.createListButtonSmall, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateListModal(true)}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.white} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.listsContainer}>
          {/* Browse List - Always at top */}
          <TouchableOpacity
            style={[styles.listCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={() => handleOpenList('browse')}
            activeOpacity={0.7}
          >
            <View style={styles.listCardContent}>
              <View style={styles.listCardHeader}>
                <View style={[styles.listIconContainer, { backgroundColor: colors.primaryLight + '20' }]}>
                  <FolderOpen size={20} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.listCardInfo}>
                  <Text style={[styles.listCardTitle, { color: colors.text }]} numberOfLines={1}>
                    Browse
                  </Text>
                  <Text style={[styles.listCardCount, { color: colors.textSecondary }]}>
                    All categories • {allSupport.length} aligned brands
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
              </View>
            </View>
          </TouchableOpacity>

          {/* User Lists */}
          {userLists.length === 0 ? (
            <View style={[styles.placeholderContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <List size={48} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.placeholderTitle, { color: colors.text }]}>No Custom Lists Yet</Text>
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                Create custom lists to organize brands, businesses, values, links, and notes.
              </Text>
            </View>
          ) : (
            userLists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={[styles.listCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={() => handleOpenList(list)}
                activeOpacity={0.7}
              >
                <View style={styles.listCardContent}>
                  <View style={styles.listCardHeader}>
                    <View style={[styles.listIconContainer, { backgroundColor: colors.primaryLight + '20' }]}>
                      <List size={20} color={colors.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.listCardInfo}>
                      <Text style={[styles.listCardTitle, { color: colors.text }]} numberOfLines={1}>
                        {list.name}
                      </Text>
                      <Text style={[styles.listCardCount, { color: colors.textSecondary }]}>
                        {list.entries.length} {list.entries.length === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                  </View>
                  {list.description && (
                    <Text style={[styles.listCardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {list.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderMapView = () => {
    // Simple OpenStreetMap iframe embed — SSR-safe and dependency-free
    const defaultLat = 37.7749;
    const defaultLng = 122.4194; // <--- note: corrected to 122.4194 for marker/center; original file had -122.4194 in some versions
    const bbox = `${defaultLng - 0.05},${defaultLat - 0.03},${defaultLng + 0.05},${defaultLat + 0.03}`;
    const marker = `${defaultLat}%2C${defaultLng}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;

    return (
      <View style={{ marginBottom: 16 }}>
        {/* @ts-ignore */}
        <iframe
          title="map"
          src={src}
          style={{
            border: 0,
            width: '100%',
            height: 420,
            borderRadius: 12,
            overflow: 'hidden',
          }}
          loading="lazy"
        />
      </View>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Image
            source={require('@/assets/images/upright dark B1.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <MenuButton />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Loading brands...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Image
            source={require('@/assets/images/upright dark B1.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <MenuButton />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Error loading brands</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {error.message || 'Please try again later'}
          </Text>
        </View>
      </View>
    );
  }

  if (profile.causes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Image
            source={require('@/assets/images/upright dark B1.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <MenuButton />
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.neutralLight }]}>
            <Target size={48} color={colors.textLight} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Set Your Values First</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Complete your profile to see personalized brand recommendations
          </Text>
          <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/onboarding')} activeOpacity={0.7}>
            <Text style={[styles.emptyButtonText, { color: colors.white }]}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={[styles.stickyHeaderContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Image
            source={require('@/assets/images/upright dark B1.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <MenuButton />
        </View>
        {renderMainViewSelector()}
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {mainView === 'forYou' && renderForYouView()}
        {mainView === 'myLibrary' && renderMyLibraryView()}
        {mainView === 'local' && renderLocalView()}

        {(
          <TouchableOpacity
            style={[
              styles.searchPrompt,
              {
                backgroundColor: isDarkMode ? colors.backgroundSecondary : colors.background,
                borderColor: isDarkMode ? colors.border : colors.primary,
              },
            ]}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.7}
          >
            <View style={styles.searchPromptContent}>
              <Text style={[styles.searchPromptTitle, { color: isDarkMode ? colors.white : colors.primary }]}>Looking for something specific?</Text>
              <Text style={[styles.searchPromptSubtitle, { color: isDarkMode ? colors.white : colors.textSecondary }]}>Search our database of products</Text>
            </View>
            <ChevronRight size={24} color={isDarkMode ? colors.white : colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Create List Modal */}
      <Modal
        visible={showCreateListModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateListModal(false);
          setNewListName('');
          setNewListDescription('');
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowCreateListModal(false);
              setNewListName('');
              setNewListDescription('');
            }}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <Pressable
            style={[styles.createListModalContainer, { backgroundColor: colors.background }]}
            onPress={() => {}}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create New List</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateListModal(false);
                  setNewListName('');
                  setNewListDescription('');
                }}
              >
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.modalLabel, { color: colors.text }]}>List Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter list name"
                placeholderTextColor={colors.textSecondary}
                value={newListName}
                onChangeText={setNewListName}
                autoFocus
              />

              <Text style={[styles.modalLabel, { color: colors.text }]}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalTextArea, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter list description"
                placeholderTextColor={colors.textSecondary}
                value={newListDescription}
                onChangeText={setNewListDescription}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  console.log('[Home] Create List button pressed!');
                  handleCreateList();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>Create List</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Modal>

      {/* Value Mode Selection Modal */}
      <Modal
        visible={showValueModeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowValueModeModal(false);
          setQuickAddItem(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowValueModeModal(false);
              setQuickAddItem(null);
            }}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <Pressable
            style={[styles.quickAddModalContainer, { backgroundColor: colors.background }]}
            onPress={() => {}}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add Value: {quickAddItem?.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowValueModeModal(false);
                  setQuickAddItem(null);
                }}
              >
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.modalLabel, { color: colors.text }]}>
                Choose how to add this value:
              </Text>

              <TouchableOpacity
                style={[styles.valueModeButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={() => handleValueModeSelected('maxPain')}
                activeOpacity={0.7}
              >
                <View style={styles.valueModeContent}>
                  <Text style={[styles.valueModeTitle, { color: colors.danger }]}>Max Pain</Text>
                  <Text style={[styles.valueModeDescription, { color: colors.textSecondary }]}>
                    Add brands that are unaligned with this value
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.valueModeButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={() => handleValueModeSelected('maxBenefit')}
                activeOpacity={0.7}
              >
                <View style={styles.valueModeContent}>
                  <Text style={[styles.valueModeTitle, { color: colors.success }]}>Max Benefit</Text>
                  <Text style={[styles.valueModeDescription, { color: colors.textSecondary }]}>
                    Add brands that are aligned with this value
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Modal>

      {/* Quick Add Modal - Choose List */}
      <Modal
        visible={showQuickAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowQuickAddModal(false);
          setQuickAddItem(null);
          setSelectedValueMode(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowQuickAddModal(false);
              setQuickAddItem(null);
              setSelectedValueMode(null);
            }}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <Pressable
            style={[styles.quickAddModalContainer, { backgroundColor: colors.background }]}
            onPress={() => {}}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add to List
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowQuickAddModal(false);
                  setQuickAddItem(null);
                  setSelectedValueMode(null);
                }}
              >
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={[styles.quickAddItemName, { color: colors.primary }]}>
                {quickAddItem?.name}
                {quickAddItem?.type === 'value' && selectedValueMode && (
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {' '}({selectedValueMode === 'maxPain' ? 'Max Pain' : 'Max Benefit'})
                  </Text>
                )}
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

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMapModal(false)}
      >
        <TouchableOpacity
          style={styles.mapModalOverlay}
          activeOpacity={1}
          onPress={() => setShowMapModal(false)}
        >
          <View
            style={[styles.mapModalContainer, { backgroundColor: colors.background }]}
          >
            {/* Header with close button */}
            <View style={[styles.mapModalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <Text style={[styles.mapModalTitle, { color: colors.text }]}>
                {localDistance === null
                  ? 'All Local Businesses'
                  : `Local Businesses (${localDistance} mile${localDistance !== 1 ? 's' : ''})`}
              </Text>
              <TouchableOpacity
                style={[styles.mapModalCloseButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowMapModal(false)}
                activeOpacity={0.7}
              >
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

          {/* Map */}
          <View style={styles.mapModalContent}>
            {userLocation && localBusinessData.alignedBusinesses.length + localBusinessData.unalignedBusinesses.length > 0 ? (
              <BusinessMapView
                businesses={[...localBusinessData.alignedBusinesses, ...localBusinessData.unalignedBusinesses]}
                userLocation={userLocation}
                distanceRadius={localDistance || 999999}
                onBusinessPress={(businessId) => {
                  setShowMapModal(false);
                  router.push({
                    pathname: '/business/[id]',
                    params: { id: businessId, fromMap: 'true' },
                  });
                }}
              />
            ) : (
              <View style={styles.mapModalEmpty}>
                <MapPin size={48} color={colors.textSecondary} strokeWidth={1.5} />
                <Text style={[styles.mapModalEmptyText, { color: colors.text }]}>
                  {!userLocation
                    ? 'Location access required to view map'
                    : 'No businesses found in this area'}
                </Text>
                {!userLocation && (
                  <TouchableOpacity
                    style={[styles.mapModalEmptyButton, { backgroundColor: colors.primary }]}
                    onPress={requestLocation}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.mapModalEmptyButtonText, { color: colors.white }]}>
                      Enable Location
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Detect mobile screen size for responsive map modal
const { width: screenWidth } = Dimensions.get('window');
const isMobileScreen = screenWidth < 768; // Mobile if width < 768px

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
  },
  webContent: {
    maxWidth: 768,
    alignSelf: 'center' as const,
    width: '100%',
  },
  stickyHeaderContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    position: 'relative' as const,
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
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  section: {
    marginBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  showAllButton: {
    fontSize: 14,
    fontWeight: '600' as const,
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
  emptyText: {
    fontSize: 15,
    textAlign: 'center' as const,
    paddingVertical: 32,
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  productsContainer: {
    gap: 12,
  },
  productCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'row',
    height: 100,
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productContent: {
    padding: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    marginRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  scorebadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  valueTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxHeight: 32,
    overflow: 'hidden',
  },
  valueTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 110,
  },
  valueTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  emptySection: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  searchPrompt: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    marginTop: 32,
    marginBottom: 16,
  },
  searchPromptContent: {},
  searchPromptTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  searchPromptSubtitle: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  mainViewRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 10,
  },
  mainViewSelector: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
  },
  mainViewButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  mainViewText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  subsectionRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
    justifyContent: 'space-evenly',
  },
  subsectionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subsectionButtonActive: {
    borderBottomWidth: 2,
  },
  subsectionText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  subsectionTextActive: {
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
  },
  placeholderContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 15,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  distanceFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 6,
  },
  distanceOptionsContainer: {
    flexDirection: 'row',
    gap: 5,
    flex: 1,
  },
  distanceFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceFilterText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  mapFilterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  mapFilterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  compactSection: {
    marginBottom: 24,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  compactHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactHeaderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  compactImage: {
    width: '100%',
    height: 80,
  },
  compactContent: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactBrand: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
  },
  compactScore: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  brandsContainer: {
    gap: 10,
  },
  brandCard: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 64,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  brandCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  brandLogoContainer: {
    width: 64,
    height: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  brandCardContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  brandScoreContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandScore: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  brandCategory: {
    fontSize: 12,
    opacity: 0.7,
  },
  foldersContainer: {
    gap: 12,
  },
  folderCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  folderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  folderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderName: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  folderCount: {
    fontSize: 12,
  },
  folderContent: {
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  folderBrandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  folderBrandImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  folderBrandContent: {},
  folderBrandName: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  folderBrandCategory: {
    fontSize: 11,
  },
  folderBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  folderBrandScore: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  mapPlaceholder: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  mapWebContainer: {
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 24,
  fontWeight: '700' as const,
  marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  mapIframeContainer: {
    width: '100%',
    height: 500,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  mapLocationText: {
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  mapButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  mapContainer: {
    height: 500,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
  filterCount: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: '700' as const,
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  filterOptionCount: {
    fontSize: 14,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapLegend: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legendDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  legendCount: {
    fontSize: 11,
    marginTop: 4,
  },
  webView: {
    flex: 1,
  },
  mapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: isMobileScreen ? 'flex-start' : 'center',
    alignItems: isMobileScreen ? 'stretch' : 'center',
    padding: isMobileScreen ? 0 : 16,
  },
  mapModalContainer: {
    width: isMobileScreen ? '100%' : '90%',
    height: isMobileScreen ? '100%' : '87.5%',
    borderRadius: isMobileScreen ? 0 : 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: isMobileScreen ? (Platform.OS === 'ios' ? 48 : 16) : 16, // Safe area for mobile
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  mapModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  mapModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapModalContent: {
    flex: 1,
  },
  mapModalEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  mapModalEmptyText: {
    fontSize: 16,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  mapModalEmptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  mapModalEmptyButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  // Library styles
  listsContainer: {
    gap: 12,
    marginTop: 12,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listCardContent: {
    padding: 16,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCardInfo: {
    flex: 1,
  },
  listCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  listCardCount: {
    fontSize: 13,
  },
  listCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  createListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  createListButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  createListButtonSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  createListModalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
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
  modalLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  // Quick-add styles
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
  quickAddModalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  valueModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  valueModeContent: {
    flex: 1,
  },
  valueModeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  valueModeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickAddItemName: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginTop: 8,
  },
  quickAddListsContainer: {
    gap: 8,
    marginTop: 8,
  },
  quickAddListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  quickAddListInfo: {
    flex: 1,
  },
  quickAddListName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  quickAddListCount: {
    fontSize: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyListText: {
    fontSize: 14,
    textAlign: 'center' as const,
    paddingVertical: 16,
    lineHeight: 20,
  },
  // List detail view styles
  listDetailHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  listDetailTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  listDetailDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  listDetailContent: {
    flex: 1,
  },
  listEntriesContainer: {
    gap: 10,
  },
  listEntryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  listEntryContent: {
    gap: 4,
  },
  listEntryType: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  listEntryName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  listEntryMode: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  // Browse list styles
  browseCategory: {
    marginBottom: 24,
  },
  browseCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  browseCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseCategoryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    flex: 1,
  },
  browseCategoryCount: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
