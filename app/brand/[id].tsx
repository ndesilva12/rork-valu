import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, ThumbsUp, MapPin, Plus, List, ChevronRight, X } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  Linking,
  Platform,
  TextInput,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { lightColors, darkColors } from '@/constants/colors';
import { AVAILABLE_VALUES } from '@/mocks/causes';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { getLogoUrl } from '@/lib/logo';
import { UserList, ListEntry, ValueListMode } from '@/types/library';
import { getUserLists, createList, addEntryToList } from '@/services/firebase/listService';

export default function BrandDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { profile, isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const scrollViewRef = useRef<ScrollView>(null);

  console.log('[BrandDetail] Loading brand with ID:', id, 'Name:', name);

  // Load brand data from DataContext (client-side, no Edge Function issues)
  const { getBrandById, getBrandByName, valuesMatrix, isLoading: dataLoading, refresh } = useData();

  // Force refresh data when component mounts to get latest from Firebase
  useEffect(() => {
    console.log('[BrandDetail] Component mounted, force refreshing data from Firebase for brand:', id);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id, not refresh

  // Try to find brand by ID first, then by name if provided
  let brand = id ? getBrandById(id as string) : undefined;
  if (!brand && name) {
    console.log('[BrandDetail] Brand not found by ID, trying by name:', name);
    brand = getBrandByName(name as string);
  }

  const isLoading = dataLoading;
  const error = !isLoading && !brand ? { message: 'Brand not found' } : null;

  console.log('[BrandDetail] Query state:', {
    id,
    isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    hasBrand: !!brand,
    brandName: brand?.name,
    hasValuesMatrix: !!valuesMatrix
  });

  // Debug: Log money flow data
  if (brand) {
    console.log('[BrandDetail] Money Flow Data:', {
      hasOwnership: !!brand.ownership,
      ownershipLength: brand.ownership?.length || 0,
      ownership: brand.ownership,
      hasAffiliates: !!brand.affiliates,
      affiliatesLength: brand.affiliates?.length || 0,
      affiliates: brand.affiliates,
      hasPartnerships: !!brand.partnerships,
      partnershipsLength: brand.partnerships?.length || 0,
      partnerships: brand.partnerships,
      ownershipSources: brand.ownershipSources,
    });
  }

  interface Review {
    id: string;
    userName: string;
    rating: number;
    text: string;
    timestamp: Date;
    likes: number;
    userLiked: boolean;
  }

  // Quick-add state
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      userName: 'Sarah M.',
      rating: 5,
      text: 'Love this brand! They really walk the talk when it comes to their values. High quality products too.',
      timestamp: new Date('2024-01-15'),
      likes: 24,
      userLiked: false
    },
    {
      id: '2',
      userName: 'Mike T.',
      rating: 4,
      text: 'Good company overall. A bit pricey but worth it for the ethical practices.',
      timestamp: new Date('2024-01-20'),
      likes: 15,
      userLiked: false
    },
    {
      id: '3',
      userName: 'Jessica R.',
      rating: 5,
      text: 'Finally a brand that aligns with my values! Customer service is excellent too.',
      timestamp: new Date('2024-01-10'),
      likes: 42,
      userLiked: false
    },
    {
      id: '4',
      userName: 'David L.',
      rating: 3,
      text: 'Decent brand but could do more in certain areas. Still better than most alternatives.',
      timestamp: new Date('2024-01-22'),
      likes: 8,
      userLiked: false
    },
    {
      id: '5',
      userName: 'Emily K.',
      rating: 5,
      text: 'Outstanding commitment to sustainability! Will definitely purchase again.',
      timestamp: new Date('2024-01-18'),
      likes: 31,
      userLiked: false
    },
  ]);

  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [reviewText, setReviewText] = useState('');
  const [userRating, setUserRating] = useState(0);

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

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    if (sortBy === 'latest') {
      sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } else {
      sorted.sort((a, b) => b.likes - a.likes);
    }
    return sorted;
  }, [reviews, sortBy]);

  const handleLikeReview = useCallback((reviewId: string) => {
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          userLiked: !review.userLiked,
          likes: review.userLiked ? review.likes - 1 : review.likes + 1
        };
      }
      return review;
    }));
  }, []);

  const handleSubmitReview = useCallback(() => {
    if (!reviewText.trim() || userRating === 0) return;

    const newReview: Review = {
      id: Date.now().toString(),
      userName: clerkUser?.firstName || clerkUser?.username || 'Anonymous',
      rating: userRating,
      text: reviewText.trim(),
      timestamp: new Date(),
      likes: 0,
      userLiked: false
    };

    setReviews(prev => [newReview, ...prev]);
    setReviewText('');
    setUserRating(0);
  }, [reviewText, userRating, clerkUser]);

  const handleShopPress = async () => {
    if (!brand) return;
    try {
      const websiteUrl = brand.website || `https://${brand?.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '')}.com`;
      const canOpen = await Linking.canOpenURL(websiteUrl);
      if (canOpen) {
        await Linking.openURL(websiteUrl);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const handleSocialPress = async (platform: 'x' | 'instagram' | 'facebook') => {
    if (!brand) return;
    try {
      const brandSlug = brand?.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '');
      let url = '';

      switch (platform) {
        case 'x':
          url = `https://x.com/${brandSlug}`;
          break;
        case 'instagram':
          url = `https://instagram.com/${brandSlug}`;
          break;
        case 'facebook':
          url = `https://facebook.com/${brandSlug}`;
          break;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening social URL:', error);
    }
  };

  // Quick-add handlers
  const handleQuickAdd = async () => {
    if (!clerkUser?.id) {
      Alert.alert('Error', 'You must be logged in to add to lists');
      return;
    }

    try {
      const lists = await getUserLists(clerkUser.id);
      setUserLists(lists);
      setShowQuickAddModal(true);
    } catch (error) {
      console.error('[BrandDetail] Error loading lists:', error);
      Alert.alert('Error', 'Could not load your lists. Please try again.');
    }
  };

  const handleAddToList = async (listId: string) => {
    if (!brand) return;

    try {
      const entry: Omit<ListEntry, 'id' | 'createdAt'> = {
        type: 'brand',
        brandId: brand.id,
        brandName: brand.name,
      };

      await addEntryToList(listId, entry);
      setShowQuickAddModal(false);
      Alert.alert('Success', `Added ${brand.name} to list!`);
    } catch (error) {
      console.error('[BrandDetail] Error adding to list:', error);
      Alert.alert('Error', 'Could not add to list. Please try again.');
    }
  };

  const handleCreateAndAddToList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    if (!clerkUser?.id || !brand) return;

    try {
      const listId = await createList(clerkUser.id, newListName.trim(), newListDescription.trim());

      const entry: Omit<ListEntry, 'id' | 'createdAt'> = {
        type: 'brand',
        brandId: brand.id,
        brandName: brand.name,
      };

      await addEntryToList(listId, entry);

      setNewListName('');
      setNewListDescription('');
      setShowQuickAddModal(false);
      Alert.alert('Success', `Created list and added ${brand.name}!`);
    } catch (error) {
      console.error('[BrandDetail] Error creating list:', error);
      Alert.alert('Error', 'Could not create list. Please try again.');
    }
  };

  // Calculate alignment data without useMemo to avoid infinite re-render
  // Early return for loading/missing data
  if (!brand || !valuesMatrix) {
    var alignmentData = {
      isAligned: false,
      matchingValues: [],
      avgPosition: 0,
      totalSupportScore: 0,
      totalAvoidScore: 0,
      alignmentStrength: 50
    };
  } else {
    // Calculate causes
    const supportedCauses = profile.causes.filter(c => c.type === 'support').map(c => c.id);
    const avoidedCauses = profile.causes.filter(c => c.type === 'avoid').map(c => c.id);
    const allUserCauses = [...supportedCauses, ...avoidedCauses];

    const brandName = brand?.name;
    let totalSupportScore = 0;
    let totalAvoidScore = 0;
    const matchingValues = new Set<string>();

    // Collect positions for this brand across all user's selected values
    const alignedPositions: number[] = [];
    const unalignedPositions: number[] = [];

    // Check EACH user cause to find the brand's position
    allUserCauses.forEach((causeId) => {
      const causeData = valuesMatrix[causeId];
      if (!causeData) {
        // If cause data doesn't exist, treat as position 11 (not found)
        alignedPositions.push(11);
        unalignedPositions.push(11);
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
          matchingValues.add(causeId);
          alignedPositions.push(supportPosition);
          totalSupportScore += 100;
          // For unaligned calculation, this value doesn't apply (brand is good here)
          unalignedPositions.push(11);
        } else if (opposePosition <= 10) {
          matchingValues.add(causeId);
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
          matchingValues.add(causeId);
          alignedPositions.push(opposePosition);
          totalSupportScore += 100;
          // For unaligned calculation, this value doesn't apply (brand is good here)
          unalignedPositions.push(11);
        } else if (supportPosition <= 10) {
          matchingValues.add(causeId);
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
    let avgPosition = 11;

    if (totalSupportScore > totalAvoidScore && totalSupportScore > 0) {
      // Aligned brand: calculate score based on average position
      avgPosition = alignedPositions.reduce((sum, pos) => sum + pos, 0) / alignedPositions.length;
      // Map position to score: position 1 = 100, position 11 = 50
      // Formula: score = 100 - ((avgPosition - 1) / 10) * 50
      alignmentStrength = Math.round(100 - ((avgPosition - 1) / 10) * 50);
    } else if (totalAvoidScore > totalSupportScore && totalAvoidScore > 0) {
      // Unaligned brand: calculate score based on average position
      avgPosition = unalignedPositions.reduce((sum, pos) => sum + pos, 0) / unalignedPositions.length;
      // Map position to score: position 1 = 0, position 11 = 50
      // Formula: score = ((avgPosition - 1) / 10) * 50
      alignmentStrength = Math.round(((avgPosition - 1) / 10) * 50);
    }

    const isAligned = totalSupportScore > totalAvoidScore && totalSupportScore > 0;

    var alignmentData = {
      isAligned,
      matchingValues: Array.from(matchingValues),
      avgPosition: Math.round(avgPosition * 10) / 10,
      totalSupportScore,
      totalAvoidScore,
      alignmentStrength
    };
  }

  const alignmentColor = alignmentData.isAligned ? colors.success : colors.danger;
  const AlignmentIcon = alignmentData.isAligned ? TrendingUp : TrendingDown;
  const alignmentLabel = alignmentData.isAligned ? 'Aligned' : 'Not Aligned';

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Loading brand...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>Error loading brand</Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            {error.message || 'Please try again later'}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.white} strokeWidth={2} />
            <Text style={[styles.backButtonText, { color: colors.white }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!brand) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>Brand not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.white} strokeWidth={2} />
            <Text style={[styles.backButtonText, { color: colors.white }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hide the navigation header and render our own header inside the page so it respects centered max-width */}
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={Platform.OS === 'web' ? styles.webContent : undefined}
        showsVerticalScrollIndicator={false}
        {...panResponder.panHandlers}
      >
        <View style={styles.heroImageContainer}>
          <Image
            source={{ uri: getLogoUrl(brand.website || '') }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            priority="high"
            placeholder={{ blurhash: 'LGF5?xoffQj[~qoffQof?bofj[ay' }}
          />
          {/* Back button on top left of cover photo */}
          <TouchableOpacity
            style={[styles.backButtonOverlay, { backgroundColor: colors.backgroundSecondary + 'DD' }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.visitButton, { backgroundColor: colors.primary }]}
            onPress={handleShopPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.visitButtonText, { color: colors.white }]}>Visit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Logo with centered add button underneath */}
          <View style={styles.headerLogoSection}>
            <Image
              source={{ uri: getLogoUrl(brand.website || '') }}
              style={styles.headerLogo}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              placeholder={{ blurhash: 'LGF5?xoffQj[~qoffQof?bofj[ay' }}
            />
            <TouchableOpacity
              style={[styles.addToListButtonBelow, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleQuickAdd}
              activeOpacity={0.7}
            >
              <Plus size={18} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Header with brand info and score */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.brandName, { color: colors.text }]}>{brand?.name}</Text>
              <Text style={[styles.category, { color: colors.primary }]}>{brand.category}</Text>
              {brand.location && (
                <View style={styles.locationRow}>
                  <MapPin size={14} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>{brand.location}</Text>
                </View>
              )}
            </View>
            <View style={[styles.scoreCircle, { borderColor: alignmentColor, backgroundColor: colors.backgroundSecondary }]}>
              <AlignmentIcon size={24} color={alignmentColor} strokeWidth={2.5} />
              <Text style={[styles.scoreNumber, { color: alignmentColor }]}>
                {alignmentData.alignmentStrength}
              </Text>
            </View>
          </View>

          {brand.description && (
            <Text style={[styles.brandDescription, { color: colors.textSecondary }]}>
              {brand.description}
            </Text>
          )}

          <View style={styles.socialLinksContainer}>
            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
              onPress={() => handleSocialPress('x')}
              activeOpacity={0.7}
            >
              <Text style={[styles.socialButtonText, { color: colors.text }]}>𝕏</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
              onPress={() => handleSocialPress('instagram')}
              activeOpacity={0.7}
            >
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
              onPress={() => handleSocialPress('facebook')}
              activeOpacity={0.7}
            >
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.alignmentCard, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.alignmentLabelRow}>
              <Text style={[styles.alignmentLabel, { color: colors.text }]}>
                Why
              </Text>
            </View>
            {alignmentData.matchingValues.length > 0 && (
              <View style={styles.valueTagsContainer}>
                {alignmentData.matchingValues.map((valueId) => {
                    const allValues = Object.values(AVAILABLE_VALUES).flat();
                    const value = allValues.find(v => v.id === valueId);
                    if (!value) return null;
                    
                    const userCause = profile.causes.find(c => c.id === valueId);
                    if (!userCause) return null;
                    
                    const tagColor = userCause.type === 'support' ? colors.success : colors.danger;
                    
                    return (
                      <TouchableOpacity
                        key={valueId}
                        style={[styles.valueTag, { backgroundColor: tagColor + '15' }]}
                        onPress={() => router.push(`/value/${valueId}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.valueTagText, { color: tagColor }]}>
                          {value.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Money Flow</Text>

            {/* Ownership Section */}
            <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary, marginBottom: 16 }]}>
              <View style={[styles.subsectionHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>Ownership</Text>
              </View>

              {brand.ownership && brand.ownership.length > 0 ? (
                <View style={styles.shareholdersContainer}>
                  {brand.ownership.map((owner, index) => (
                    <View key={`owner-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.tableRow}>
                        <Text style={[styles.affiliateName, { color: colors.text }]}>{owner.name}</Text>
                        <Text style={[styles.affiliateRelationship, { color: colors.textSecondary }]}>
                          {owner.relationship}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {brand.ownershipSources && (
                    <View style={[styles.sourcesContainer, { borderTopColor: colors.border }]}>
                      <Text style={[styles.sourcesLabel, { color: colors.text }]}>Sources:</Text>
                      <Text style={[styles.sourcesText, { color: colors.textSecondary }]}>
                        {brand.ownershipSources}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.shareholdersContainer}>
                  <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                    No ownership data available
                  </Text>
                </View>
              )}
            </View>

            {/* Affiliates Section */}
            <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary, marginBottom: 16 }]}>
              <View style={[styles.subsectionHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>Affiliates</Text>
              </View>

              {brand.affiliates && brand.affiliates.length > 0 ? (
                <View style={styles.shareholdersContainer}>
                  {brand.affiliates.map((affiliate, index) => (
                    <View key={`affiliate-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.tableRow}>
                        <Text style={[styles.affiliateName, { color: colors.text }]}>{affiliate.name}</Text>
                        <Text style={[styles.affiliateRelationship, { color: colors.textSecondary }]}>
                          {affiliate.relationship}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.shareholdersContainer}>
                  <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                    No affiliates data available
                  </Text>
                </View>
              )}
            </View>

            {/* Partnerships Section */}
            <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
              <View style={[styles.subsectionHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>Partnerships</Text>
              </View>

              {brand.partnerships && brand.partnerships.length > 0 ? (
                <View style={styles.shareholdersContainer}>
                  {brand.partnerships.map((partnership, index) => (
                    <View key={`partnership-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.tableRow}>
                        <Text style={[styles.affiliateName, { color: colors.text }]}>{partnership.name}</Text>
                        <Text style={[styles.affiliateRelationship, { color: colors.textSecondary }]}>
                          {partnership.relationship}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.shareholdersContainer}>
                  <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                    No partnerships data available
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    // Outline style when active: transparent background + border
                    sortBy === 'latest' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary }
                  ]}
                  onPress={() => setSortBy('latest')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.sortButtonText,
                    { color: sortBy === 'latest' ? colors.primary : colors.textSecondary }
                  ]}>Latest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    // Outline style when active: transparent background + border
                    sortBy === 'popular' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary }
                  ]}
                  onPress={() => setSortBy('popular')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.sortButtonText,
                    { color: sortBy === 'popular' ? colors.primary : colors.textSecondary }
                  ]}>Popular</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.addReviewCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.addReviewTitle, { color: colors.text }]}>Share Your Experience</Text>
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setUserRating(star)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.starIcon}>
                      {star <= userRating ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[
                  styles.reviewInput,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
                ]}
                placeholder="Write your review..."
                placeholderTextColor={colors.textSecondary}
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[
                  styles.submitReviewButton,
                  { backgroundColor: reviewText.trim() && userRating > 0 ? colors.primary : colors.neutralLight }
                ]}
                onPress={handleSubmitReview}
                disabled={!reviewText.trim() || userRating === 0}
                activeOpacity={0.7}
              >
                <Text style={[styles.submitReviewText, { color: colors.white }]}>Post Review</Text>
              </TouchableOpacity>
            </View>

            {sortedReviews.map(review => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUserInfo}>
                    <Text style={[styles.reviewUserName, { color: colors.text }]}>{review.userName}</Text>
                    <View style={styles.reviewRating}>
                      {[...Array(review.rating)].map((_, i) => (
                        <Text key={i} style={styles.reviewStar}>★</Text>
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                    {review.timestamp.toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.reviewText, { color: colors.text }]}>{review.text}</Text>
                <TouchableOpacity
                  style={styles.reviewLikeButton}
                  onPress={() => handleLikeReview(review.id)}
                  activeOpacity={0.7}
                >
                  <ThumbsUp 
                    size={16} 
                    color={review.userLiked ? colors.primary : colors.textSecondary}
                    fill={review.userLiked ? colors.primary : 'none'}
                    strokeWidth={2}
                  />
                  <Text style={[
                    styles.reviewLikes,
                    { color: review.userLiked ? colors.primary : colors.textSecondary }
                  ]}>
                    {review.likes}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Quick Add Modal */}
      <Modal
        visible={showQuickAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowQuickAddModal(false);
          setNewListName('');
          setNewListDescription('');
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowQuickAddModal(false);
              setNewListName('');
              setNewListDescription('');
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
                  setNewListName('');
                  setNewListDescription('');
                }}
              >
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={[styles.quickAddItemName, { color: colors.primary }]}>
                {brand?.name}
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
  webContent: {
    maxWidth: 768,
    alignSelf: 'center' as const,
    width: '100%',
  },
  backButtonOverlay: {
    position: 'absolute' as const,
    bottom: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative' as const,
  },
  heroImage: {
    width: '100%',
    height: 150,
  },
  visitButton: {
    position: 'absolute' as const,
    right: 16,
    bottom: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  visitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  headerLogoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  addToListButtonBelow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },

  brandName: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  category: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  brandDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  alignmentCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  alignmentLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  alignmentLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  alignmentDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  moneyFlowCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  companyHeader: {
    paddingBottom: 16,
    borderBottomWidth: 2,
    marginBottom: 16,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  subsectionHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  shareholdersContainer: {},
  shareholdersTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  shareholderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sourcesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sourcesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  sourcesText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic' as const,
  },
  shareholderInfo: {
    flex: 1,
  },
  shareholderName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  shareholderPercentage: {
    fontSize: 13,
  },
  alignmentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '700' as const,
    flex: 1,
    textAlign: 'center' as const,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  affiliateName: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'center' as const,
  },
  affiliateRelationship: {
    fontSize: 13,
    flex: 1,
    textAlign: 'center' as const,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center' as const,
    paddingVertical: 24,
  },
  valueTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  valueTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  valueTagText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    // default transparent border so switching to outlined active state doesn't shift layout
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  addReviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addReviewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  ratingSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starIcon: {
    fontSize: 28,
    color: '#FFD700',
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top' as const,
    marginBottom: 12,
  },
  submitReviewButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitReviewText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewStar: {
    fontSize: 14,
    color: '#FFD700',
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewLikes: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  // Quick-add styles
  badgeAndButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToListButtonHeader: {
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
  quickAddModalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
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
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    height: 80,
    textAlignVertical: 'top' as const,
    marginBottom: 16,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
