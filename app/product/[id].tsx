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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import type { Brand } from '@/types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  // Query the backend for this brand (which pulls Google Sheets)
  const { data: product, isLoading, error } = trpc.data.getBrand.useQuery(
    { id: String(id || '') },
    { enabled: !!id }
  );

  // Fetch causes so the UI can look up value names (safe default to [])
  const { data: causes = [] } = trpc.data.getCauses.useQuery();

  // Build flat values array (compat with previous AVAILABLE_VALUES usage)
  const ALL_VALUES_FLAT = useMemo(() => {
    if (!Array.isArray(causes)) return [];
    return causes.map((c: any) => ({ id: c.id, name: c.name }));
  }, [causes]);

  const scrollViewRef = useRef<ScrollView>(null);

  // Safe arrays from profile and product so .filter/.map won't throw
  const profileCauses = Array.isArray(profile?.causes) ? profile.causes : [];
  const supportedCauses = profileCauses.filter((c) => c.type === 'support').map((c) => c.id);
  const avoidedCauses = profileCauses.filter((c) => c.type === 'avoid').map((c) => c.id);

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
      userLiked: false,
    },
    {
      id: '2',
      userName: 'Mike T.',
      rating: 4,
      text: 'Good company overall. A bit pricey but worth it for the ethical practices.',
      timestamp: new Date('2024-01-20'),
      likes: 15,
      userLiked: false,
    },
  ]);

  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [reviewText, setReviewText] = useState('');
  const [userRating, setUserRating] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dx > 100) {
          router.back();
        }
      },
    })
  ).current;

  // Alignment calculation — safe guarded
  const alignmentData = useMemo(() => {
    if (!product) {
      return {
        isAligned: false,
        matchingValues: [] as string[],
        avgPosition: 0,
        totalSupportScore: 0,
        totalAvoidScore: 0,
        alignmentStrength: 0,
      };
    }

    const totalUserValues = profileCauses.length;
    let totalSupportScore = 0;
    let totalAvoidScore = 0;
    const matchingValues = new Set<string>();
    const positionSum: number[] = [];

    const valueAlignments = Array.isArray(product.valueAlignments) ? product.valueAlignments : [];

    valueAlignments.forEach((alignment: any) => {
      const isUserSupporting = supportedCauses.includes(alignment.valueId);
      const isUserAvoiding = avoidedCauses.includes(alignment.valueId);

      if (!isUserSupporting && !isUserAvoiding) return;

      matchingValues.add(alignment.valueId);
      positionSum.push(alignment.position);

      const score = alignment.isSupport ? 100 - alignment.position * 5 : -(100 - alignment.position * 5);

      if (isUserSupporting) {
        if (score > 0) totalSupportScore += score;
        else totalAvoidScore += Math.abs(score);
      }

      if (isUserAvoiding) {
        if (score < 0) totalSupportScore += Math.abs(score);
        else totalAvoidScore += score;
      }
    });

    const valuesWhereNotAppears = totalUserValues - matchingValues.size;
    const totalPositionSum = positionSum.reduce((a, b) => a + b, 0) + valuesWhereNotAppears * 11;
    const avgPosition = totalUserValues > 0 ? totalPositionSum / totalUserValues : 11;

    const isAligned = totalSupportScore > totalAvoidScore && totalSupportScore > 0;

    let alignmentStrength: number;
    if (isAligned) {
      alignmentStrength = Math.round((1 - (avgPosition - 1) / 10) * 50 + 50);
    } else {
      alignmentStrength = Math.round(((avgPosition - 1) / 10) * 50);
    }

    return {
      isAligned,
      matchingValues: Array.from(matchingValues),
      avgPosition: Math.round(avgPosition * 10) / 10,
      totalSupportScore,
      totalAvoidScore,
      alignmentStrength,
    };
  }, [product, supportedCauses, avoidedCauses, profileCauses.length]);

  const alignmentColor = alignmentData.isAligned ? colors.success : colors.danger;
  const AlignmentIcon = alignmentData.isAligned ? TrendingUp : TrendingDown;
  const alignmentLabel = alignmentData.isAligned ? 'Aligned' : 'Not Aligned';

  // Debug: log the product result once (helps if still blank)
  useEffect(() => {
    console.log('product (getBrand) result:', { product, isLoading, error });
  }, [product, isLoading, error]);

  // Loading and error handling for backend query
  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error?.message ? `Error: ${error.message}` : 'Brand not found'}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Safe accessors
  const affiliates = Array.isArray((product as any)?.moneyFlow?.affiliates) ? (product as any).moneyFlow.affiliates : [];
  const shareholders = Array.isArray((product as any)?.moneyFlow?.shareholders) ? (product as any).moneyFlow.shareholders : [];

  // Compatibility fallback for older mock shape
  const brandNameForUrls = (product as any).brand || product.name || '';

  const handleShopPress = async () => {
    try {
      const websiteUrl = product.website || `https://${brandNameForUrls.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '')}.com`;
      const canOpen = await Linking.canOpenURL(websiteUrl);
      if (canOpen) await Linking.openURL(websiteUrl);
    } catch (err) {
      console.error('Error opening URL:', err);
    }
  };

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    if (sortBy === 'latest') sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    else sorted.sort((a, b) => b.likes - a.likes);
    return sorted;
  }, [reviews, sortBy]);

  const handleLikeReview = useCallback((reviewId: string) => {
    setReviews((prev) =>
      prev.map((review) => {
        if (review.id === reviewId) {
          return {
            ...review,
            userLiked: !review.userLiked,
            likes: review.userLiked ? review.likes - 1 : review.likes + 1,
          };
        }
        return review;
      })
    );
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
      userLiked: false,
    };

    setReviews((prev) => [newReview, ...prev]);
    setReviewText('');
    setUserRating(0);
  }, [reviewText, userRating, clerkUser]);

  const handleSocialPress = async (platform: 'x' | 'instagram' | 'facebook') => {
    try {
      const brandSlug = brandNameForUrls.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '');
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
      if (canOpen) await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening social URL:', error);
    }
  };

  const handleShopNavigation = (productId: string) => {
    router.push(`/product/${encodeURIComponent(productId)}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={Platform.OS === 'web' ? styles.webContent : undefined}
        showsVerticalScrollIndicator={false}
        {...panResponder.panHandlers}
      >
        <View style={styles.heroImageContainer}>
          <Image source={{ uri: product.imageUrl }} style={styles.heroImage} contentFit="cover" transition={200} cachePolicy="memory-disk" />
          <TouchableOpacity style={[styles.visitButton, { backgroundColor: colors.primary }]} onPress={handleShopPress} activeOpacity={0.7}>
            <Text style={[styles.visitButtonText, { color: colors.white }]}>Visit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.backgroundSecondary, marginRight: 12 }]} onPress={() => router.back()} activeOpacity={0.7}>
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.category, { color: colors.primary }]}>{product.category}</Text>
            </View>

            <View style={[styles.scoreCircle, { borderColor: alignmentColor, backgroundColor: colors.backgroundSecondary }]}>
              <AlignmentIcon size={20} color={alignmentColor} strokeWidth={2} />
              <Text style={[styles.scoreNumber, { color: alignmentColor }]}>{alignmentData.alignmentStrength}</Text>
            </View>
          </View>

          <View style={styles.socialLinksContainer}>
            <TouchableOpacity style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]} onPress={() => handleSocialPress('x')} activeOpacity={0.7}>
              <Text style={[styles.socialButtonText, { color: colors.text }]}>𝕏</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]} onPress={() => handleSocialPress('instagram')} activeOpacity={0.7}>
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]} onPress={() => handleSocialPress('facebook')} activeOpacity={0.7}>
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.brandDescription, { color: colors.textSecondary }]}>{product.description || 'No description provided.'}</Text>

          <View style={[styles.alignmentCard, { backgroundColor: alignmentColor + '15' }]}>
            <Text style={[styles.alignmentLabel, { color: alignmentColor }]}>{alignmentLabel}</Text>
            <Text style={[styles.alignmentDescription, { color: colors.textSecondary }]}>Based on your selected values and where your money flows</Text>

            {alignmentData.matchingValues.length > 0 && (
              <View style={styles.valueTagsContainer}>
                {alignmentData.matchingValues.map((valueId) => {
                  const value = ALL_VALUES_FLAT.find((v: any) => v.id === valueId);
                  if (!value) return null;
                  const userCause = profileCauses.find((c: any) => c.id === valueId);
                  if (!userCause) return null;
                  const tagColor = userCause.type === 'support' ? colors.success : colors.danger;
                  return (
                    <TouchableOpacity key={valueId} style={[styles.valueTag, { backgroundColor: tagColor + '15' }]} onPress={() => router.push(`/value/${valueId}`)} activeOpacity={0.7}>
                      <Text style={[styles.valueTagText, { color: tagColor }]}>{value.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Money Flow */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Money Flow</Text>

            <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
              <View style={[styles.companyHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.companyName, { color: colors.text }]}>{(product.moneyFlow && product.moneyFlow.company) || product.name}</Text>
                <Text style={[styles.companyDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {product.description || 'No description provided.'}
                </Text>
              </View>

              <View style={styles.moneyFlowTableHeader}>
                <Text style={[styles.tableHeaderLeft, { color: colors.textSecondary }]}>Affiliates</Text>
                <Text style={[styles.tableHeaderRight, { color: colors.textSecondary }]}>Commitment</Text>
              </View>

              <View style={styles.affiliatesContainer}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const a = affiliates[i];
                  const name = a && a.name ? a.name : '—';
                  const commitment = a && (a.amount || a.commitment) ? (a.amount || a.commitment) : '—';
                  return (
                    <View key={`affiliate-row-${i}`} style={[styles.affiliateRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.affiliateLeft}>
                        <Text style={[styles.affiliateName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                      </View>
                      <View style={styles.affiliateRight}>
                        <Text style={[styles.affiliateCommitment, { color: colors.textSecondary }]} numberOfLines={1}>{commitment}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={[styles.shareholdersContainer, { marginTop: 12 }]}>
                <Text style={[styles.shareholdersTitle, { color: colors.textSecondary }]}>Top Stakeholders</Text>

                {shareholders.length > 0 ? (
                  shareholders.map((stakeholder: any, index: number) => {
                    const shColor = stakeholder.alignment === 'aligned' ? colors.success : stakeholder.alignment === 'opposed' ? colors.danger : colors.neutral;
                    const rawPct = stakeholder.percentage ?? 0;
                    const percentage = typeof rawPct === 'number' && rawPct <= 1 ? Math.round(rawPct * 100 * 100) / 100 : rawPct;
                    return (
                      <View key={`stakeholder-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                        <View style={styles.shareholderInfo}>
                          <Text style={[styles.shareholderName, { color: colors.text }]}>{stakeholder.name}</Text>
                          <Text style={[styles.shareholderPercentage, { color: colors.textSecondary }]}>{percentage}% stake</Text>
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

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity style={[styles.sortButton, sortBy === 'latest' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary }]} onPress={() => setSortBy('latest')} activeOpacity={0.7}>
                  <Text style={[styles.sortButtonText, { color: sortBy === 'latest' ? colors.primary : colors.textSecondary }]}>Latest</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sortButton, sortBy === 'popular' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary }]} onPress={() => setSortBy('popular')} activeOpacity={0.7}>
                  <Text style={[styles.sortButtonText, { color: sortBy === 'popular' ? colors.primary : colors.textSecondary }]}>Popular</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.addReviewCard, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.addReviewTitle, { color: colors.text }]}>Share Your Experience</Text>
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setUserRating(star)} activeOpacity={0.7}>
                    <Text style={styles.starIcon}>{star <= userRating ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.reviewInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="Write your review..." placeholderTextColor={colors.textSecondary} value={reviewText} onChangeText={setReviewText} multiline numberOfLines={3} />
              <TouchableOpacity style={[styles.submitReviewButton, { backgroundColor: reviewText.trim() && userRating > 0 ? colors.primary : colors.neutralLight }]} onPress={handleSubmitReview} disabled={!reviewText.trim() || userRating === 0} activeOpacity={0.7}>
                <Text style={[styles.submitReviewText, { color: colors.white }]}>Post Review</Text>
              </TouchableOpacity>
            </View>

            {sortedReviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUserInfo}>
                    <Text style={[styles.reviewUserName, { color: colors.text }]}>{review.userName}</Text>
                    <View style={styles.reviewRating}>{[...Array(review.rating)].map((_, i) => (<Text key={i} style={styles.reviewStar}>★</Text>))}</View>
                  </View>
                  <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>{review.timestamp.toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.reviewText, { color: colors.text }]}>{review.text}</Text>
                <TouchableOpacity style={styles.reviewLikeButton} onPress={() => handleLikeReview(review.id)} activeOpacity={0.7}>
                  <ThumbsUp size={16} color={review.userLiked ? colors.primary : colors.textSecondary} fill={review.userLiked ? colors.primary : 'none'} strokeWidth={2} />
                  <Text style={[styles.reviewLikes, { color: review.userLiked ? colors.primary : colors.textSecondary }]}>{review.likes}</Text>
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
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  webContent: { maxWidth: 768, alignSelf: 'center' as const, width: '100%' },
  backButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroImageContainer: { position: 'relative', height: 220, marginBottom: 16 },
  heroImage: { width: '100%', height: '100%', borderRadius: 12 },
  visitButton: { position: 'absolute', right: 12, bottom: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  visitButtonText: { color: '#ffffff', fontWeight: '600' },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titleContainer: { flex: 1, marginRight: 16 },
  productName: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  category: { fontSize: 15, fontWeight: '600' },
  socialLinksContainer: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  socialButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: { fontSize: 13, fontWeight: '600' },
  brandDescription: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  alignmentCard: { borderRadius: 12, padding: 12, marginBottom: 16 },
  alignmentLabel: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  alignmentDescription: { fontSize: 13 },
  valueTagsContainer: { marginTop: 8, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  valueTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  valueTagText: { fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  moneyFlowCard: { borderRadius: 16, padding: 0, borderWidth: 1, overflow: 'hidden' },
  companyHeader: { padding: 12, borderBottomWidth: 1 },
  companyName: { fontSize: 18, fontWeight: '700' },
  companyDescription: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  moneyFlowTableHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  tableHeaderLeft: { flex: 1, fontSize: 13, fontWeight: '600' },
  tableHeaderRight: { width: 140, textAlign: 'right', fontSize: 13, fontWeight: '600' },
  affiliatesContainer: {},
  affiliateRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center', borderBottomWidth: 1 },
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
  noShareholdersText: { fontSize: 13, fontStyle: 'italic', paddingHorizontal: 12, paddingVertical: 8 },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sortButtons: { flexDirection: 'row', gap: 8 },
  sortButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'transparent' },
  sortButtonText: { fontSize: 13, fontWeight: '600' },
  addReviewCard: { borderRadius: 12, padding: 12 },
  addReviewTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  ratingSelector: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  starIcon: { fontSize: 22 },
  reviewInput: { borderRadius: 8, padding: 10, marginBottom: 10, minHeight: 60 },
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
  scoreCircle: { width: 58, height: 58, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  scoreNumber: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  errorContainer: { alignItems: 'center', padding: 40 },
  errorText: { color: '#ef4444' },
});