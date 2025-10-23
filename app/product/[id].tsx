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
} from 'react-native';
import { Image } from 'expo-image';
import { lightColors, darkColors } from '@/constants/colors';
import { MOCK_PRODUCTS } from '@/mocks/products';
import { AVAILABLE_VALUES } from '@/mocks/causes';
import { useUser } from '@/contexts/UserContext';
import { useRef, useMemo, useState, useCallback } from 'react';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const product = MOCK_PRODUCTS.find(p => p.id === id);
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

  const supportedCauses = profile.causes.filter(c => c.type === 'support').map(c => c.id);
  const avoidedCauses = profile.causes.filter(c => c.type === 'avoid').map(c => c.id);

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
    const totalUserValues = profile.causes.length;
    let totalSupportScore = 0;
    let totalAvoidScore = 0;
    const matchingValues = new Set<string>();
    const positionSum: number[] = [];
    
    product.valueAlignments.forEach(alignment => {
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
  }, [product, supportedCauses, avoidedCauses, profile.causes.length]);

  const alignmentColor = alignmentData.isAligned ? colors.success : colors.danger;
  const AlignmentIcon = alignmentData.isAligned ? TrendingUp : TrendingDown;
  const alignmentLabel = alignmentData.isAligned ? 'Aligned' : 'Not Aligned';

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>Product not found</Text>
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
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          ),
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
          <View style={styles.header}>
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

          <Text style={[styles.brandDescription, { color: colors.textSecondary }]}>
            A leading innovator in sustainable products, committed to reducing environmental impact through innovative design and ethical manufacturing practices.
          </Text>

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
            
            <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
              <View style={[styles.companyHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.companyName, { color: colors.text }]}>{product.moneyFlow.company}</Text>
              </View>
              
              <View style={styles.shareholdersContainer}>
                <Text style={[styles.shareholdersTitle, { color: colors.textSecondary }]}>Top Stakeholders</Text>
                {[
                  { name: 'Vanguard Group', percentage: 8.2, alignment: 'aligned' as const },
                  { name: 'BlackRock', percentage: 7.5, alignment: 'neutral' as const },
                  { name: 'State Street Corporation', percentage: 4.8, alignment: 'aligned' as const },
                  { name: 'Fidelity Investments', percentage: 3.9, alignment: 'neutral' as const },
                  { name: 'Capital Research', percentage: 2.6, alignment: 'opposed' as const },
                ].map((stakeholder, index) => {
                  const shColor =
                    stakeholder.alignment === 'aligned'
                      ? colors.success
                      : stakeholder.alignment === 'opposed'
                      ? colors.danger
                      : colors.neutral;

                  return (
                    <View key={`stakeholder-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.shareholderInfo}>
                        <Text style={[styles.shareholderName, { color: colors.text }]}>{stakeholder.name}</Text>
                        <Text style={[styles.shareholderPercentage, { color: colors.textSecondary }]}>
                          {stakeholder.percentage}% stake
                        </Text>
                      </View>
                      <View style={[styles.alignmentDot, { backgroundColor: shColor }]} />
                    </View>
                  );
                })}
              </View>

              <View style={[styles.shareholdersContainer, { marginTop: 24 }]}>
                <Text style={[styles.shareholdersTitle, { color: colors.textSecondary }]}>Endorsements</Text>
                {[
                  { name: 'Sierra Club', type: 'Environmental Organization', alignment: 'aligned' as const },
                  { name: 'Fair Trade USA', type: 'Certification Body', alignment: 'aligned' as const },
                  { name: 'B Corporation', type: 'Business Certification', alignment: 'aligned' as const },
                  { name: 'Green America', type: 'Environmental Nonprofit', alignment: 'aligned' as const },
                  { name: 'EcoWatch', type: 'Media & Watchdog', alignment: 'neutral' as const },
                ].map((endorsement, index) => {
                  const shColor = endorsement.alignment === 'aligned'
                      ? colors.success
                      : colors.neutral;

                  return (
                    <View key={`endorsement-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.shareholderInfo}>
                        <Text style={[styles.shareholderName, { color: colors.text }]}>{endorsement.name}</Text>
                        <Text style={[styles.shareholderPercentage, { color: colors.textSecondary }]}>
                          {endorsement.type}
                        </Text>
                      </View>
                      <View style={[styles.alignmentDot, { backgroundColor: shColor }]} />
                    </View>
                  );
                })}
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
                    sortBy === 'latest' && { backgroundColor: colors.primary + '15' }
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
                    sortBy === 'popular' && { backgroundColor: colors.primary + '15' }
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
  alignmentLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  alignmentDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
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
  },
  errorText: {
    fontSize: 18,
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

});
