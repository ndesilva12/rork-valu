import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { MOCK_PRODUCTS } from '@/mocks/products';
import { AVAILABLE_VALUES } from '@/mocks/causes';
import { useUser } from '@/contexts/UserContext';
import { useRef, useMemo } from 'react';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const product = MOCK_PRODUCTS.find(p => p.id === id);
  const scrollViewRef = useRef<ScrollView>(null);

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
    const alignmentStrength = Math.round((1 - ((avgPosition - 1) / 10)) * 50 + 50);

    const isAligned = totalSupportScore > totalAvoidScore && totalSupportScore > 0;
    
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
            resizeMode="cover"
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
              <Text style={[styles.brand, { color: colors.primary }]}>{product.brand}</Text>
              <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.category, { color: colors.textSecondary }]}>{product.category}</Text>
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

          <View style={[styles.alignmentCard, { backgroundColor: alignmentColor + '15' }]}>
            <Text style={[styles.alignmentLabel, { color: alignmentColor }]}>
              {alignmentLabel}
            </Text>
            <Text style={[styles.alignmentDescription, { color: colors.textSecondary }]}>
              Based on your selected values and where your money flows
            </Text>
          </View>

          {alignmentData.matchingValues.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Related Values</Text>
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
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Reasons</Text>
            {product.keyReasons.map((reason, index) => (
              <View key={`reason-${index}-${reason.substring(0, 20)}`} style={styles.reasonItem}>
                <View style={[styles.reasonBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.reasonText, { color: colors.text }]}>{reason}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Money Flow</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Where your money goes when you buy from {product.brand}
            </Text>
            
            <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
              <View style={[styles.companyHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.companyName, { color: colors.text }]}>{product.moneyFlow.company}</Text>
              </View>
              
              <View style={styles.shareholdersContainer}>
                <Text style={[styles.shareholdersTitle, { color: colors.textSecondary }]}>Major Shareholders</Text>
                {product.moneyFlow.shareholders.map((shareholder, index) => {
                  const shColor =
                    shareholder.alignment === 'aligned'
                      ? colors.success
                      : shareholder.alignment === 'opposed'
                      ? colors.danger
                      : colors.neutral;

                  return (
                    <View key={`shareholder-${product.id}-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.shareholderInfo}>
                        <Text style={[styles.shareholderName, { color: colors.text }]}>{shareholder.name}</Text>
                        <Text style={[styles.shareholderPercentage, { color: colors.textSecondary }]}>
                          {shareholder.percentage}% ownership
                        </Text>
                      </View>
                      <View style={[styles.alignmentDot, { backgroundColor: shColor }]} />
                    </View>
                  );
                })}
              </View>
            </View>
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
    height: 300,
    position: 'relative' as const,
  },
  heroImage: {
    width: '100%',
    height: 300,
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
  brand: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  productName: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    gap: 10,
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
    marginBottom: 32,
  },
  alignmentLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  alignmentDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reasonBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
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
    gap: 10,
  },
  valueTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  valueTagText: {
    fontSize: 14,
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

});
