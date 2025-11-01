import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Share2, ExternalLink } from 'lucide-react-native';
import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Share as RNShare,
} from 'react-native';
import { Image } from 'expo-image';
import MenuButton from '@/components/MenuButton';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { MOCK_PRODUCTS } from '@/mocks/products';
import { LOCAL_BUSINESSES } from '@/mocks/local-businesses';
import { Product } from '@/types';
import { getLogoUrl } from '@/lib/logo';
import { AVAILABLE_VALUES } from '@/mocks/available-values';

interface Comment {
  id: string;
  userName: string;
  text: string;
  timestamp: Date;
}

interface ProductInteraction {
  productId: string;
  isLiked: boolean;
  comments: Comment[];
  likesCount: number;
}

export default function ShopScreen() {
  const router = useRouter();
  const { profile, isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const [interactions, setInteractions] = useState<Map<string, ProductInteraction>>(new Map());
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  
  const alignedProducts = useMemo(() => {
    const supportedCauses = profile.causes.filter(c => c.type === 'support').map(c => c.id);
    const avoidedCauses = profile.causes.filter(c => c.type === 'avoid').map(c => c.id);
    const totalUserValues = profile.causes.length;
    
    const allProducts = [...MOCK_PRODUCTS, ...LOCAL_BUSINESSES];
    
    const scored = allProducts.map(product => {
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
      
      const isPositivelyAligned = totalSupportScore > totalAvoidScore && totalSupportScore > 0;
      
      let alignmentStrength: number;
      if (isPositivelyAligned) {
        alignmentStrength = Math.round((1 - ((avgPosition - 1) / 10)) * 50 + 50);
      } else {
        alignmentStrength = Math.round(((avgPosition - 1) / 10) * 50);
      }
      
      return {
        product,
        totalSupportScore,
        totalAvoidScore,
        matchingValuesCount: matchingValues.size,
        matchingValues: Array.from(matchingValues),
        alignmentStrength,
        isPositivelyAligned
      };
    });

    const alignedSorted = scored
      .filter(s => s.isPositivelyAligned)
      .sort((a, b) => b.alignmentStrength - a.alignmentStrength)
      .map(s => ({ ...s.product, alignmentScore: s.alignmentStrength, matchingValues: s.matchingValues }));
    
    const shuffled: Product[] = [];
    const localItems = alignedSorted.filter(p => p.id.startsWith('local-'));
    const regularItems = alignedSorted.filter(p => !p.id.startsWith('local-'));
    
    const localInterval = regularItems.length > 0 ? Math.floor(regularItems.length / Math.max(localItems.length, 1)) : 1;
    
    let localIndex = 0;
    let regularIndex = 0;
    
    while (regularIndex < regularItems.length || localIndex < localItems.length) {
      for (let i = 0; i < localInterval && regularIndex < regularItems.length; i++) {
        shuffled.push(regularItems[regularIndex++]);
      }
      if (localIndex < localItems.length) {
        shuffled.push(localItems[localIndex++]);
      }
    }
    
    return shuffled.length > 0 ? shuffled : alignedSorted;
  }, [profile.causes]);

  const getProductInteraction = useCallback((productId: string): ProductInteraction => {
    return interactions.get(productId) || {
      productId,
      isLiked: false,
      comments: [],
      likesCount: Math.floor(Math.random() * 500) + 50
    };
  }, [interactions]);

  const handleLike = useCallback((productId: string) => {
    setInteractions(prev => {
      const newMap = new Map(prev);
      const interaction = getProductInteraction(productId);
      newMap.set(productId, {
        ...interaction,
        isLiked: !interaction.isLiked,
        likesCount: interaction.isLiked ? interaction.likesCount - 1 : interaction.likesCount + 1
      });
      return newMap;
    });
  }, [getProductInteraction]);

  const handleOpenComments = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setCommentModalVisible(true);
  }, []);

  const handleAddComment = useCallback(() => {
    if (!commentText.trim() || !selectedProductId) return;
    
    const userName = clerkUser?.firstName || clerkUser?.username || 'Anonymous';
    
    setInteractions(prev => {
      const newMap = new Map(prev);
      const interaction = getProductInteraction(selectedProductId);
      const newComment: Comment = {
        id: Date.now().toString(),
        userName,
        text: commentText.trim(),
        timestamp: new Date()
      };
      newMap.set(selectedProductId, {
        ...interaction,
        comments: [newComment, ...interaction.comments]
      });
      return newMap;
    });
    
    setCommentText('');
    setCommentModalVisible(false);
  }, [commentText, selectedProductId, clerkUser, getProductInteraction]);

  const handleShare = useCallback(async (product: Product) => {
    const url = `https://yourapp.com/product/${product.id}`;
    const message = `Check out ${product.name} by ${product.brand}! Alignment score: ${product.alignmentScore}`;
    
    try {
      if (Platform.OS === 'web') {
        const textToCopy = `${message}\n${url}`;
        
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          Alert.alert('Copied!', 'Link copied to clipboard');
        } catch (execError) {
          console.error('Copy fallback error:', execError);
          Alert.alert('Error', 'Unable to copy to clipboard');
        } finally {
          textArea.remove();
        }
      } else {
        await RNShare.share({
          message: `${message}\n${url}`,
          title: product.name,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, []);

  const handleVisitBrand = useCallback(async (product: Product) => {
    try {
      const websiteUrl = product.website || `https://${product.brand.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '')}.com`;
      const canOpen = await Linking.canOpenURL(websiteUrl);
      if (canOpen) {
        await Linking.openURL(websiteUrl);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  }, []);

  const handleProductPress = useCallback((product: Product) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: product.id },
    });
  }, [router]);

  const getAlignmentReason = useCallback((matchingValues: string[]) => {
    if (!matchingValues || matchingValues.length === 0) return null;

    // Get all values as a flat array
    const allValues = Object.values(AVAILABLE_VALUES).flat();

    // Get the first matching value name
    const firstMatchingValue = allValues.find(v => v.id === matchingValues[0]);
    if (!firstMatchingValue) return null;

    return firstMatchingValue.name;
  }, []);

  const renderProductPost = useCallback(({ item }: { item: Product & { matchingValues?: string[] } }) => {
    const interaction = getProductInteraction(item.id);
    const alignmentReason = getAlignmentReason(item.matchingValues || []);
    
    return (
      <View style={[styles.postContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.brandInfo}
            onPress={() => handleProductPress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.brandAvatar, { backgroundColor: colors.backgroundSecondary }]}>
              <Image
                source={{ uri: getLogoUrl(item.website || '') }}
                style={styles.brandAvatarImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            </View>
            <View style={styles.brandDetails}>
              <Text style={[styles.brandName, { color: colors.text }]}>{item.brand}</Text>
              <Text style={[styles.brandCategory, { color: colors.textSecondary }]}>{item.category}</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.alignmentBadge, { backgroundColor: colors.success + '15' }]}>
            <Text style={[styles.alignmentScore, { color: colors.success }]}>{item.alignmentScore}</Text>
          </View>
        </View>

        <TouchableOpacity 
          activeOpacity={0.95}
          onPress={() => handleProductPress(item)}
        >
          <Image
            source={{ uri: item.productImageUrl || getLogoUrl(item.website || '') }}
            style={styles.postImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        </TouchableOpacity>

        {alignmentReason && (
          <View style={styles.alignmentReasonContainer}>
            <Text style={[styles.alignmentReasonText, { color: colors.textSecondary }]}>
              You're seeing this because you align with <Text style={{ fontWeight: '600', color: colors.text }}>{alignmentReason}</Text>
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLike(item.id)}
              activeOpacity={0.7}
            >
              <Heart 
                size={28} 
                color={interaction.isLiked ? colors.danger : colors.text} 
                fill={interaction.isLiked ? colors.danger : 'none'}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleOpenComments(item.id)}
              activeOpacity={0.7}
            >
              <MessageCircle size={28} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleShare(item)}
              activeOpacity={0.7}
            >
              <Share2 size={28} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.visitButton, { backgroundColor: colors.primary }]}
            onPress={() => handleVisitBrand(item)}
            activeOpacity={0.8}
          >
            <ExternalLink size={18} color={colors.white} strokeWidth={2} />
            <Text style={[styles.visitButtonText, { color: colors.white }]}>Shop</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.postContent}>
          {interaction.likesCount > 0 && (
            <Text style={[styles.likesText, { color: colors.text }]}>
              {interaction.likesCount.toLocaleString()} {interaction.likesCount === 1 ? 'like' : 'likes'}
            </Text>
          )}
          <View style={styles.descriptionContainer}>
            <Text style={[styles.productName, { color: colors.text }]}>
              <Text style={styles.brandNameBold}>{item.brand}</Text> {item.productDescription || item.name}
            </Text>
          </View>
          {interaction.comments.length > 0 && (
            <TouchableOpacity 
              onPress={() => handleOpenComments(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewCommentsText, { color: colors.textSecondary }]}>
                View all {interaction.comments.length} {interaction.comments.length === 1 ? 'comment' : 'comments'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [colors, getProductInteraction, handleLike, handleOpenComments, handleShare, handleVisitBrand, handleProductPress]);

  if (profile.causes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Shop</Text>
          <MenuButton />
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.neutralLight }]}>
            <Heart size={48} color={colors.textLight} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Set Your Values First</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Complete your profile to see products from brands that align with your values
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/onboarding')}
            activeOpacity={0.7}
          >
            <Text style={[styles.emptyButtonText, { color: colors.white }]}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Shop</Text>
        <MenuButton />
      </View>

      <FlatList
        data={alignedProducts}
        renderItem={renderProductPost}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent, { paddingBottom: 100 }]}
      />

      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedProductId ? getProductInteraction(selectedProductId).comments : []}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.commentItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.commentUser, { color: colors.text }]}>{item.userName}</Text>
                  <Text style={[styles.commentText, { color: colors.text }]}>{item.text}</Text>
                  <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                    {item.timestamp.toLocaleString()}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Text style={[styles.emptyCommentsText, { color: colors.textSecondary }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
              style={styles.commentsList}
            />

            <View style={[styles.commentInputContainer, { backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.commentInput, { color: colors.text }]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textLight}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.commentSubmitButton,
                  { backgroundColor: commentText.trim() ? colors.primary : colors.neutralLight }
                ]}
                onPress={handleAddComment}
                disabled={!commentText.trim()}
                activeOpacity={0.7}
              >
                <Text style={[styles.commentSubmitText, { color: colors.white }]}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  postContainer: {
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  brandAvatarImage: {
    width: '100%',
    height: '100%',
  },
  brandDetails: {
    flex: 1,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  brandCategory: {
    fontSize: 12,
  },
  alignmentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  alignmentScore: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  postImage: {
    width: '100%',
    height: 400,
  },
  alignmentReasonContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: 12,
  },
  alignmentReasonText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    marginRight: 12,
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  visitButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  postContent: {
    paddingHorizontal: 16,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  descriptionContainer: {
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    lineHeight: 18,
  },
  brandNameBold: {
    fontWeight: '600' as const,
  },
  viewCommentsText: {
    fontSize: 14,
    marginTop: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  commentsList: {
    flex: 1,
  },
  commentItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
  },
  emptyComments: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  commentInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: 15,
    paddingVertical: 8,
  },
  commentSubmitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  commentSubmitText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
