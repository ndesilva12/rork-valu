import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
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
  ChevronDown,
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
} from 'react-native';
import { Image } from 'expo-image';
import MenuButton from '@/components/MenuButton';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { Product } from '@/types';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { trpc } from '@/lib/trpc';
import { LOCAL_BUSINESSES } from '@/mocks/local-businesses';
import { getLogoUrl } from '@/lib/logo';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { getAllUserBusinesses, calculateAlignmentScore, isBusinessWithinRange, BusinessUser } from '@/services/firebase/businessService';

type ViewMode = 'playbook' | 'browse';
type LocalDistanceOption = 1 | 5 | 10 | 25 | 50 | 100;

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
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const [viewMode, setViewMode] = useState<ViewMode>('playbook');
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [showAllAligned, setShowAllAligned] = useState<boolean>(false);
  const [showAllLeast, setShowAllLeast] = useState<boolean>(false);
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [localDistance, setLocalDistance] = useState<LocalDistanceOption>(100);
  const [userBusinesses, setUserBusinesses] = useState<BusinessUser[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch brands, local businesses, and values matrix from local data via tRPC
  const { data: brands, isLoading, error } = trpc.data.getBrands.useQuery();
  const { data: localBusinesses } = trpc.data.getLocalBusinesses.useQuery();
  const { data: valuesMatrix } = trpc.data.getValuesMatrix.useQuery();

  const viewModes: ViewMode[] = ['playbook', 'browse'];

  // Request location permission and get user's location
  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to filter brands by distance.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please try again.');
    }
  };

  // Fetch user businesses and request location when "local" mode is selected
  useEffect(() => {
    if (isLocalMode) {
      // Request location permission
      requestLocation();

      // Fetch all user businesses
      const fetchUserBusinesses = async () => {
        try {
          console.log('[Home] Fetching user businesses for local mode');
          const businesses = await getAllUserBusinesses();
          console.log('[Home] Fetched user businesses:', businesses.length);
          setUserBusinesses(businesses);
        } catch (error) {
          console.error('[Home] Error fetching user businesses:', error);
          Alert.alert('Error', 'Could not load local businesses. Please try again.');
        }
      };

      fetchUserBusinesses();
    }
  }, [isLocalMode]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentIndex = viewModes.indexOf(viewMode);

        if (gestureState.dx < -100 && currentIndex < viewModes.length - 1) {
          setViewMode(viewModes[currentIndex + 1]);
        } else if (gestureState.dx > 100 && currentIndex > 0) {
          setViewMode(viewModes[currentIndex - 1]);
        }
      },
    })
  ).current;

  const { topSupport, topAvoid, allSupport, allSupportFull, allAvoidFull, scoredBrands, brandDistances } = useMemo(() => {
    // Combine brands from CSV and local businesses
    const csvBrands = brands || [];
    const localBizList = localBusinesses || [];

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
  }, [profile.causes, brands, localBusinesses, valuesMatrix]);

  // Compute local businesses when "local" mode is active
  const localBusinessData = useMemo(() => {
    if (!isLocalMode || !userLocation || userBusinesses.length === 0) {
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

    // Score each business based on alignment with user's values
    const scoredBusinesses = userBusinesses.map((business) => {
      const alignmentScore = calculateAlignmentScore(profile.causes, business.causes || []);

      // Check if business is within range
      const rangeResult = isBusinessWithinRange(business, userLocation.latitude, userLocation.longitude, localDistance);

      return {
        business,
        alignmentScore,
        distance: rangeResult.closestDistance,
        closestLocation: rangeResult.closestLocation,
        isWithinRange: rangeResult.isWithinRange,
      };
    });

    // Filter by distance
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
  }, [isLocalMode, userLocation, userBusinesses, profile.causes, localDistance]);

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
    const titleColor = isSupport ? '#22C55E' : '#EF4444';
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
    const titleColor = isAligned ? '#22C55E' : '#EF4444';
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
        </View>
      </TouchableOpacity>
    );
  };

  const localDistanceOptions: LocalDistanceOption[] = [100, 50, 25, 10, 5, 1];

  const renderViewModeSelector = () => (
    <View style={styles.selectionRow}>
      <View style={[styles.viewModeSelector, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'playbook' && { backgroundColor: colors.primary }]}
          onPress={() => setViewMode('playbook')}
          activeOpacity={0.7}
        >
          <Target size={18} color={viewMode === 'playbook' ? colors.white : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.viewModeText, { color: viewMode === 'playbook' ? colors.white : colors.textSecondary }]}>
            Brands
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'browse' && { backgroundColor: colors.primary }]}
          onPress={() => setViewMode('browse')}
          activeOpacity={0.7}
        >
          <FolderOpen size={18} color={viewMode === 'browse' ? colors.white : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.viewModeText, { color: viewMode === 'browse' ? colors.white : colors.textSecondary }]}>
            Browse
          </Text>
        </TouchableOpacity>
      </View>

      {/* Local Toggle Button */}
      <View style={styles.localButtonContainer}>
        <TouchableOpacity
          style={[
            styles.localButton,
            {
              backgroundColor: isLocalMode ? colors.primary : colors.backgroundSecondary,
              borderColor: isLocalMode ? colors.primary : colors.border,
              borderTopRightRadius: isLocalMode ? 0 : 10,
              borderBottomRightRadius: isLocalMode ? 0 : 10,
            }
          ]}
          onPress={() => {
            setIsLocalMode(!isLocalMode);
            setShowDistanceDropdown(false);
          }}
          activeOpacity={0.7}
        >
          <MapPin size={16} color={isLocalMode ? colors.white : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.localButtonText, { color: isLocalMode ? colors.white : colors.text }]}>
            Local
          </Text>
        </TouchableOpacity>

        {/* Distance Dropdown Arrow */}
        {isLocalMode && (
          <TouchableOpacity
            style={[styles.distanceArrow, { backgroundColor: colors.background, borderColor: colors.primary }]}
            onPress={() => setShowDistanceDropdown(!showDistanceDropdown)}
            activeOpacity={0.7}
          >
            <ChevronDown size={20} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Distance Options Dropdown */}
        {showDistanceDropdown && isLocalMode && (
          <View style={[styles.distanceDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <ScrollView style={styles.distanceDropdownScroll} nestedScrollEnabled>
              {localDistanceOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.distanceOption,
                    localDistance === option && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    setLocalDistance(option);
                    setShowDistanceDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.distanceOptionText,
                      { color: colors.text },
                      localDistance === option && { color: colors.white, fontWeight: '600' },
                    ]}
                  >
                    {option} mile{option !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );

  const renderPlaybookView = () => {
    // Show local businesses when "local" mode is active
    if (isLocalMode) {
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
                  No aligned businesses found within {localDistance} mile{localDistance !== 1 ? 's' : ''}
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
                  No unaligned businesses found within {localDistance} mile{localDistance !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        </>
      );
    }

    // Show regular brands when not in "local" mode
    return (
      <>
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={24} color={colors.success} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Aligned Brands</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAllAligned(!showAllAligned)} activeOpacity={0.7}>
              <Text style={[styles.showAllButton, { color: colors.primary }]}>{showAllAligned ? 'Hide' : 'Show All'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.brandsContainer}>
            {(showAllAligned ? allSupportFull : topSupport.slice(0, 5)).map((product) => renderBrandCard(product, 'support'))}
          </View>
        </View>

        <View style={[styles.section, { marginTop: 4, marginBottom: 14 }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <TrendingDown size={24} color={colors.danger} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Unaligned Brands</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAllLeast(!showAllLeast)} activeOpacity={0.7}>
              <Text style={[styles.showAllButton, { color: colors.primary }]}>{showAllLeast ? 'Hide' : 'Show All'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.brandsContainer}>
            {(showAllLeast ? allAvoidFull : topAvoid.slice(0, 5)).map((product) => renderBrandCard(product, 'avoid'))}
          </View>
        </View>
      </>
    );
  };

  const renderFoldersView = () => {
    // Show local businesses when "local" mode is active
    if (isLocalMode) {
      const { alignedBusinesses, unalignedBusinesses } = localBusinessData;
      const allLocalBusinesses = [...alignedBusinesses, ...unalignedBusinesses];

      // Group local businesses by category
      const categorizedLocalBusinesses = new Map<string, typeof allLocalBusinesses>();

      allLocalBusinesses.forEach((bizData) => {
        const category = bizData.business.businessInfo.category;
        if (!categorizedLocalBusinesses.has(category)) {
          categorizedLocalBusinesses.set(category, []);
        }
        categorizedLocalBusinesses.get(category)!.push(bizData);
      });

      if (allLocalBusinesses.length === 0) {
        return (
          <View style={styles.foldersContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No local businesses found within {localDistance} mile{localDistance !== 1 ? 's' : ''}
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.foldersContainer}>
          {Array.from(categorizedLocalBusinesses.entries()).map(([category, businesses]) => {
            const isExpanded = expandedFolder === category;

            return (
              <View key={category} style={[styles.folderCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.folderHeader} onPress={() => setExpandedFolder(isExpanded ? null : category)} activeOpacity={0.7}>
                  <View style={styles.folderHeaderLeft}>
                    <View style={[styles.folderIconContainer, { backgroundColor: colors.primaryLight + '15' }]}>
                      <Store size={24} color={isDarkMode ? colors.white : colors.primary} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={[styles.folderName, { color: colors.text }]}>{category}</Text>
                      <Text style={[styles.folderCount, { color: colors.textSecondary }]}>{businesses.length} business{businesses.length !== 1 ? 'es' : ''}</Text>
                    </View>
                  </View>
                  <ChevronRight
                    size={20}
                    color={colors.textSecondary}
                    strokeWidth={2}
                    style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.folderContent}>
                    {businesses.map((bizData) => {
                      const isAligned = bizData.alignmentScore >= 50;
                      const scoreColor = isAligned ? colors.success : colors.danger;
                      const Icon = isAligned ? TrendingUp : TrendingDown;

                      return (
                        <TouchableOpacity
                          key={bizData.business.id}
                          style={[styles.folderBrandCard, { backgroundColor: colors.background }]}
                          onPress={() => handleBusinessPress(bizData.business.id)}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{
                              uri: bizData.business.businessInfo.logoUrl
                                ? bizData.business.businessInfo.logoUrl
                                : getLogoUrl(bizData.business.businessInfo.website || '')
                            }}
                            style={styles.folderBrandImage}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
                          />
                          <View style={styles.folderBrandContent}>
                            <Text style={[styles.folderBrandName, { color: colors.text }]} numberOfLines={2}>
                              {bizData.business.businessInfo.name}
                            </Text>
                            <Text style={[styles.folderBrandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                              {bizData.distance !== undefined ? `${formatDistance(bizData.distance)} away` : bizData.business.businessInfo.category}
                            </Text>
                          </View>
                          <View style={[styles.folderBrandBadge, { backgroundColor: isAligned ? colors.successLight : colors.dangerLight }]}>
                            <Icon size={12} color={scoreColor} strokeWidth={2.5} />
                            <Text style={[styles.folderBrandScore, { color: scoreColor }]}>{bizData.alignmentScore}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      );
    }

    // Show regular brands when not in "local" mode
    return (
      <View style={styles.foldersContainer}>
        {FOLDER_CATEGORIES.map((category) => {
          const brands = categorizedBrands.get(category.id) || [];
          const isExpanded = expandedFolder === category.id;

          if (brands.length === 0) return null;

          return (
            <View key={category.id} style={[styles.folderCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <TouchableOpacity style={styles.folderHeader} onPress={() => setExpandedFolder(isExpanded ? null : category.id)} activeOpacity={0.7}>
                <View style={styles.folderHeaderLeft}>
                  <View style={[styles.folderIconContainer, { backgroundColor: colors.primaryLight + '15' }]}>
                    <category.Icon size={24} color={isDarkMode ? colors.white : colors.primary} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={[styles.folderName, { color: colors.text }]}>{category.name}</Text>
                    <Text style={[styles.folderCount, { color: colors.textSecondary }]}>{brands.length} brands</Text>
                  </View>
                </View>
                <ChevronRight
                  size={20}
                  color={colors.textSecondary}
                  strokeWidth={2}
                  style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.folderContent}>
                  {brands.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.folderBrandCard, { backgroundColor: colors.background }]}
                      onPress={() => handleProductPress(product)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: getLogoUrl(product.website || '') }}
                        style={styles.folderBrandImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                      <View style={styles.folderBrandContent}>
                        <Text style={[styles.folderBrandName, { color: colors.text }]} numberOfLines={2}>
                          {product.name}
                        </Text>
                        <Text style={[styles.folderBrandCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                          {product.category}
                        </Text>
                      </View>
                      <View style={[styles.folderBrandBadge, { backgroundColor: colors.successLight }]}>
                        <TrendingUp size={12} color={colors.success} strokeWidth={2.5} />
                        <Text style={[styles.folderBrandScore, { color: colors.success }]}>{Math.abs(product.alignmentScore)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
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
            source={isDarkMode ? require('@/assets/images/stand logo white.png') : require('@/assets/images/stand logo.png')}
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
            source={isDarkMode ? require('@/assets/images/stand logo white.png') : require('@/assets/images/stand logo.png')}
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
            source={isDarkMode ? require('@/assets/images/stand logo white.png') : require('@/assets/images/stand logo.png')}
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
            source={isDarkMode ? require('@/assets/images/stand logo white.png') : require('@/assets/images/stand logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <MenuButton />
        </View>
        {renderViewModeSelector()}
      </View>
      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent, { paddingBottom: 100 }]}>
        {viewMode === 'playbook' && renderPlaybookView()}
        {viewMode === 'browse' && renderFoldersView()}

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
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
  },
  headerLogo: {
    width: 140,
    height: 41,
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
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 10,
    zIndex: 100,
  },
  viewModeSelector: {
    flex: 2,
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewModeText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  localButtonContainer: {
    position: 'relative' as const,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    zIndex: 101,
  },
  localButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  localButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  distanceArrow: {
    marginLeft: -1,
    paddingHorizontal: 10,
    paddingVertical: 13,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceDropdown: {
    position: 'absolute' as const,
    top: 48,
    right: 0,
    width: 160,
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 99999,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  distanceDropdownScroll: {
    maxHeight: 300,
  },
  distanceOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  distanceOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
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
    justifyContent: 'flex-end',
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
});
