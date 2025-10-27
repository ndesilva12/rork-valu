import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, ThumbsUp } from 'lucide-react-native';
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
  FlatList,
  Modal,
} from 'react-native';
Add ActivityIndicator, after Modal,:

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
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { lightColors, darkColors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useUser } from '@/contexts/UserContext';
import { useRef, useMemo, useState, useCallback } from 'react';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  // Fetch brand data from Google Sheets via tRPC
  const { data: product, isLoading, error } = trpc.data.getBrand.useQuery(
    { id: id || '' },
    { enabled: !!id }
  );
  const scrollViewRef = useRef<ScrollView>(null);

  interface Review {
    id: string;
    userName: string;
    rating: number;
    text: string;
    timestamp: Date;
    likes: number;
    userLiked: boolean;
  }

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

  const { data: causes = [] } = trpc.data.getCauses.useQuery();
  const allValues = (Array.isArray(causes) ? causes : []).map(v => ({ id: v.id, name: v.name }));
  // The original code used: Object.values(AVAILABLE_VALUES).flat()
  // To preserve the same access pattern, create a flat array:
  const ALL_VALUES_FLAT = allValues; // array of {id, name}
  
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

  // Safe fallback if profile or profile.causes is undefined
  const profileCauses = Array.isArray(profile?.causes) ? profile.causes : [];
  const supportedCauses = profileCauses.filter(c => c.type === 'support').map(c => c.id);
  const avoidedCauses = profileCauses.filter(c => c.type === 'avoid').map(c => c.id);

  const alignmentData = useMemo(() => {
    if (!product) {
      return {
        isAligned: false,
        matchingValues: [],
        avgPosition: 0,
        totalSupportScore: 0,
        totalAvoidScore: 0,
        alignmentStrength: 0
      };
    }
    const totalUserValues = profileCauses.length;
    let totalSupportScore = 0;
    let totalAvoidScore = 0;
    const matchingValues = new Set<string>();
    const positionSum: number[] = [];
    
    const valueAlignments = Array.isArray(product?.valueAlignments) ? product.valueAlignments : [];
    valueAlignments.forEach((alignment) => {
      const isUserSupporting = supportedCauses.includes(alignment.valueId);
      const isUserAvoiding = avoidedCauses.includes(alignment.valueId);
      
      if (!isUserSupporting && !isUserAvoiding) return;
      
      matchingValues.add(alignment.valueId);
      positionSum.push(alignment.position);
      
      const score = alignment.isSupport ? (100 - alignment.position * 5) : -(100 - alignment.position * 5);
      
      if (isUserSupporting) {
        if (score > 0) {
          totalSupportScore += score;
        } else {
          totalAvoidScore += Math.abs(score);
        }
      }
      
      if (isUserAvoiding) {
        if (score < 0) {
          totalSupportScore += Math.abs(score);
        } else {
          totalAvoidScore += score;
        }
      }
    });

    const valuesWhereNotAppears = totalUserValues - matchingValues.size;
    const totalPositionSum = positionSum.reduce((a, b) => a + b, 0) + (valuesWhereNotAppears * 11);
    const avgPosition = totalUserValues > 0 ? totalPositionSum / totalUserValues : 11;
    
    const isAligned = totalSupportScore > totalAvoidScore && totalSupportScore > 0;
    
    let alignmentStrength: number;
    if (isAligned) {
      alignmentStrength = Math.round((1 - ((avgPosition - 1) / 10)) * 50 + 50);
    } else {
      alignmentStrength = Math.round(((avgPosition - 1) / 10) * 50);
    }
    
    return {
      isAligned,
      matchingValues: Array.from(matchingValues),
      avgPosition: Math.round(avgPosition * 10) / 10,
      totalSupportScore,
      totalAvoidScore,
      alignmentStrength
    };
  }, [product, supportedCauses, avoidedCauses, profileCauses.length]);

  const alignmentColor = alignmentData.isAligned ? colors.success : colors.danger;
  const AlignmentIcon = alignmentData.isAligned ? TrendingUp : TrendingDown;
  const alignmentLabel = alignmentData.isAligned ? 'Aligned' : 'Not Aligned';

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.errorText, { color: colors.text }]}>Loading brand details...</Text>
        </View>
      </View>
    );
  }

  // Error or not found state
  if (error || !product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error ? 'Error loading brand' : 'Brand not found'}
          </Text>
          {error && (
            <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
              {error.message || 'Please check your connection and try again'}
            </Text>
          )}
        </View>
      </View>
    );
  }

  const handleShopPress = async () => {
    try {
      const websiteUrl = product.website || `https://${product.brand.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '')}.com`;
      const canOpen = await Linking.canOpenURL(websiteUrl);
      if (canOpen) {
        await Linking.openURL(websiteUrl);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

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

  const handleSocialPress = async (platform: 'x' | 'instagram' | 'facebook') => {
    try {
      const brandSlug = product.brand.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '');
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
            source={{ uri: product.imageUrl }} 
            style={styles.heroImage} 
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <TouchableOpacity
            style={[styles.visitButton, { backgroundColor: colors.primary }]}
            onPress={handleShopPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.visitButtonText, { color: colors.white }]}>Visit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          {/* custom header: back button now inside the centered content */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.backgroundSecondary, marginRight: 12 }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.category, { color: colors.primary }]}>{product.category}</Text>
            </View>
            <View style={[styles.scoreCircle, { borderColor: alignmentColor, backgroundColor: colors.backgroundSecondary }]}>
              <AlignmentIcon size={24} color={alignmentColor} strokeWidth={2.5} />
              <Text style={[styles.scoreNumber, { color: alignmentColor }]}>
                {alignmentData.alignmentStrength}
              </Text>
            </View>
          </View>

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

          {product.description && (
            <Text style={[styles.brandDescription, { color: colors.textSecondary }]}>
              {product.description}
            </Text>
          )}

          <View style={[styles.alignmentCard, { backgroundColor: alignmentColor + '15' }]}>
            <Text style={[styles.alignmentLabel, { color: alignmentColor }]}>
              {alignmentLabel}
            </Text>
            <Text style={[styles.alignmentDescription, { color: colors.textSecondary }]}>
              Based on your selected values and where your money flows
            </Text>
            {alignmentData.matchingValues.length > 0 && (
              <View style={styles.valueTagsContainer}>
                {alignmentData.matchingValues.map((valueId) => {
                   const value = ALL_VALUES_FLAT.find(v => v.id === valueId);
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
            
            <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
              <View style={[styles.companyHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.companyName, { color: colors.text }]}>{product.moneyFlow.company}</Text>
              </View>

              {/* Affiliates / Commitment table header */}
              <View style={styles.moneyFlowTableHeader}>
                <Text style={[styles.tableHeaderLeft, { color: colors.textSecondary }]}>Affiliates</Text>
                <Text style={[styles.tableHeaderRight, { color: colors.textSecondary }]}>Commitment</Text>
              </View>

              {/* Render exactly 5 rows populated from product.moneyFlow.affiliates (G/H, I/J, K/L, M/N, O/P) */}
              <View style={styles.affiliatesContainer}>
                {(() => {
                  const affiliates = (product.moneyFlow && (product.moneyFlow as any).affiliates) || [];
                  // Always render five rows for consistent layout
                  return Array.from({ length: 5 }).map((_, i) => {
                    const a = affiliates[i];
                    const name = a && a.name ? a.name : '—';
                    const commitment = a && a.commitment ? a.commitment : '—';

                    return (
                      <View key={`affiliate-row-${i}`} style={[styles.affiliateRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.affiliateLeft}>
                          <Text style={[styles.affiliateName, { color: colors.text }]} numberOfLines={1}>
                            {name}
                          </Text>
                        </View>
                        <View style={styles.affiliateRight}>
                          <Text style={[styles.affiliateCommitment, { color: colors.textSecondary }]} numberOfLines={1}>
                            {commitment}
                          </Text>
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>

              {/* Optional: show shareholders under the affiliates table if present */}
              <View style={[styles.shareholdersContainer, { marginTop: 12 }]}>
                <Text style={[styles.shareholdersTitle, { color: colors.textSecondary }]}>Top Stakeholders</Text>

                {(product.moneyFlow.shareholders || []).length > 0 ? (
                  (product.moneyFlow.shareholders || []).map((stakeholder: any, index: number) => {
                    const shColor =
                      stakeholder.alignment === 'aligned'
                        ? colors.success
                        : stakeholder.alignment === 'opposed'
                        ? colors.danger
                        : colors.neutral;

                    // Convert fractional percentages (0.02 -> 2.00) if used in sheet
                    const rawPct = stakeholder.percentage ?? 0;
                    const percentage =
                      typeof rawPct === 'number' && rawPct <= 1 ? Math.round(rawPct * 100 * 100) / 100 : rawPct;

                    return (
                      <View key={`stakeholder-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                        <View style={styles.shareholderInfo}>
                          <Text style={[styles.shareholderName, { color: colors.text }]}>{stakeholder.name}</Text>
                          <Text style={[styles.shareholderPercentage, { color: colors.textSecondary }]}>
                            {percentage}% stake
                          </Text>
                        </View>
                        <View style={[styles.alignmentDot, { backgroundColor: shColor }]} />
                      </View>
                    );
                  })
                ) : (
                  <Text style={[styles.noShareholdersText, { color: colors.textSecondary }]}>No stakeholders listed</Text>
                )}
              </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImageContainer: {
    position: 'relative',
    height: 220,
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  visitButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  visitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  category: {
    fontSize: 15,
    fontWeight: '600' as const,
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
  alignmentCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alignmentLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  alignmentDescription: {
    fontSize: 13,
  },
  valueTagsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  valueTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  valueTagText: {
    fontSize: 13,
    fontWeight: '600',
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
    padding: 0,
    borderWidth: 1,
    overflow: 'hidden',
  },
  companyHeader: {
    padding: 12,
    borderBottomWidth: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  moneyFlowTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableHeaderLeft: { flex: 1, fontSize: 13, fontWeight: '600' },
  tableHeaderRight: { width: 140, textAlign: 'right', fontSize: 13, fontWeight: '600' },

  affiliatesContainer: {},
  affiliateRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  affiliateLeft: { flex: 1, paddingRight: 8 },
  affiliateRight: { width: 140, alignItems: 'flex-end' },
  affiliateName: { fontSize: 14 },
  affiliateCommitment: { fontSize: 13 },

  shareholdersContainer: { paddingTop: 12, paddingHorizontal: 12, paddingBottom: 12 },
  shareholdersTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  shareholderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  shareholderInfo: { flex: 1 },
  shareholderName: { fontSize: 14, fontWeight: '600' },
  shareholderPercentage: { fontSize: 12, marginTop: 2 },
  alignmentDot: { width: 12, height: 12, borderRadius: 6, marginLeft: 8 },

  noShareholdersText: { fontSize: 13, fontStyle: 'italic', paddingHorizontal: 12, paddingVertical: 8, color: '#6b7280' },

  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sortButtons: { flexDirection: 'row', gap: 8 },
  sortButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'transparent' },
  sortButtonText: { fontSize: 13, fontWeight: '600' },
  addReviewCard: { borderRadius: 12, padding: 12 },
  addReviewTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  ratingSelector: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  starIcon: { fontSize: 22 },
  reviewInput: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    minHeight: 60,
  },
  submitReviewButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  submitReviewText: { fontWeight: '700' },
  reviewCard: { borderRadius: 12, padding: 12, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewUserInfo: {},
  reviewUserName: { fontSize: 14, fontWeight: '700' },
  reviewRating: { flexDirection: 'row' },
  reviewStar: { color: '#f59e0b' },
  reviewDate: { fontSize: 12 },
  reviewText: { fontSize: 14, marginBottom: 8 },
  reviewLikeButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewLikes: { marginLeft: 6 },

   errorContainer: { alignItems: 'center', padding: 40 },
  errorText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  errorSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
});
