import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, ChevronRight, Target, FolderOpen, MapPin, Fuel, Utensils, Coffee, ShoppingCart, Tv, Smartphone, Shield, Car, Laptop, Store, DollarSign, Shirt } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  PanResponder,
  Image,
} from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { MOCK_PRODUCTS } from '@/mocks/products';
import { Product } from '@/types';
import { useMemo, useState, useRef } from 'react';

type ViewMode = 'playbook' | 'browse' | 'map';

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
  const { profile, isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const [viewMode, setViewMode] = useState<ViewMode>('playbook');
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [showAllAligned, setShowAllAligned] = useState<boolean>(false);
  const [showAllLeast, setShowAllLeast] = useState<boolean>(false);


  const scrollViewRef = useRef<ScrollView>(null);

  const viewModes: ViewMode[] = ['playbook', 'browse', 'map'];
  
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

  const { topSupport, topAvoid, allSupport, allSupportFull, allAvoidFull, scoredBrands } = useMemo(() => {
    const supportedCauses = profile.causes.filter(c => c.type === 'support').map(c => c.id);
    const avoidedCauses = profile.causes.filter(c => c.type === 'avoid').map(c => c.id);
    
    const scored = MOCK_PRODUCTS.map(product => {
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
      
      const avgPosition = positionSum.length > 0 ? positionSum.reduce((a, b) => a + b, 0) / positionSum.length : 10;
      const alignmentStrength = Math.round((1 - ((avgPosition - 1) / 9)) * 50 + 50);
      
      return { 
        product, 
        totalSupportScore, 
        totalAvoidScore, 
        matchingValuesCount: matchingValues.size,
        matchingValues,
        alignmentStrength
      };
    });

    const allSupportSorted = scored
      .filter(s => s.totalSupportScore > s.totalAvoidScore && s.totalSupportScore > 0)
      .sort((a, b) => b.alignmentStrength - a.alignmentStrength);

    const allAvoidSorted = scored
      .filter(s => s.totalAvoidScore > s.totalSupportScore && s.totalAvoidScore > 0)
      .sort((a, b) => b.alignmentStrength - a.alignmentStrength);

    const scoredMap = new Map(scored.map(s => [s.product.id, s.alignmentStrength]));

    return { 
      topSupport: allSupportSorted.slice(0, 10).map(s => s.product), 
      topAvoid: allAvoidSorted.slice(0, 10).map(s => s.product),
      allSupport: allSupportSorted.map(s => s.product),
      allSupportFull: allSupportSorted.map(s => s.product),
      allAvoidFull: allAvoidSorted.map(s => s.product),
      scoredBrands: scoredMap
    };
  }, [profile.causes]);

  const categorizedBrands = useMemo(() => {
    const categorized = new Map<string, Product[]>();
    
    allSupport.forEach(product => {
      FOLDER_CATEGORIES.forEach(category => {
        const productCategory = product.category.toLowerCase();
        const productBrand = product.brand.toLowerCase();
        
        let match = false;
        
        if (category.id === 'gas' && (productCategory.includes('energy') || productCategory.includes('petroleum') || productBrand.includes('exxon') || productBrand.includes('chevron') || productBrand.includes('shell') || productBrand.includes('bp'))) {
          match = true;
        } else if (category.id === 'fast-food' && (productBrand.includes('mcdonald') || productBrand.includes('burger king') || productBrand.includes('wendy') || productBrand.includes('kfc') || productBrand.includes('taco') || productBrand.includes('subway') || productBrand.includes('chick-fil-a'))) {
          match = true;
        } else if (category.id === 'restaurants' && (productCategory.includes('food') || productCategory.includes('restaurant'))) {
          match = true;
        } else if (category.id === 'groceries' && (productBrand.includes('walmart') || productBrand.includes('target') || productBrand.includes('costco') || productBrand.includes('kroger') || productBrand.includes('whole foods') || productBrand.includes('publix'))) {
          match = true;
        } else if (category.id === 'streaming' && (productBrand.includes('netflix') || productBrand.includes('disney') || productBrand.includes('hulu') || productBrand.includes('spotify') || productBrand.includes('youtube') || productBrand.includes('amazon'))) {
          match = true;
        } else if (category.id === 'social-media' && (productBrand.includes('meta') || productBrand.includes('facebook') || productBrand.includes('instagram') || productBrand.includes('tiktok') || productBrand.includes('snapchat') || productBrand.includes('x') || productBrand.includes('twitter'))) {
          match = true;
        } else if (category.id === 'insurance' && (productCategory.includes('insurance') || productBrand.includes('state farm') || productBrand.includes('allstate') || productBrand.includes('progressive') || productBrand.includes('geico'))) {
          match = true;
        } else if (category.id === 'vehicles' && (productCategory.includes('auto') || productBrand.includes('tesla') || productBrand.includes('ford') || productBrand.includes('toyota') || productBrand.includes('honda') || productBrand.includes('chevrolet'))) {
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
          if (!existing.find(p => p.id === product.id)) {
            existing.push(product);
          }
        }
      });
    });
    
    return categorized;
  }, [allSupport]);

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/product/[id]',
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
        style={[styles.brandCard, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => handleProductPress(product)}
        activeOpacity={0.7}
      >
        <View style={styles.brandCardInner}>
          <View style={styles.brandLogoContainer}>
            <Image 
              source={{ uri: product.imageUrl }} 
              style={styles.brandLogo} 
              resizeMode="contain"
            />
          </View>
          <View style={styles.brandCardContent}>
            <Text style={[styles.brandName, { color: titleColor }]} numberOfLines={2}>{product.brand}</Text>
            <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>{product.category}</Text>
          </View>
          <View style={styles.brandScoreContainer}>
            <Text style={[styles.brandScore, { color: titleColor }]}>{alignmentScore}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };



  const renderViewModeSelector = () => (
    <View style={[styles.viewModeSelector, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'playbook' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setViewMode('playbook')}
        activeOpacity={0.7}
      >
        <Target size={18} color={viewMode === 'playbook' ? colors.white : colors.textSecondary} strokeWidth={2} />
        <Text style={[
          styles.viewModeText,
          { color: viewMode === 'playbook' ? colors.white : colors.textSecondary }
        ]}>Brands</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'browse' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setViewMode('browse')}
        activeOpacity={0.7}
      >
        <FolderOpen size={18} color={viewMode === 'browse' ? colors.white : colors.textSecondary} strokeWidth={2} />
        <Text style={[
          styles.viewModeText,
          { color: viewMode === 'browse' ? colors.white : colors.textSecondary }
        ]}>Browse</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'map' && { backgroundColor: colors.primary }
        ]}
        onPress={() => setViewMode('map')}
        activeOpacity={0.7}
      >
        <MapPin size={18} color={viewMode === 'map' ? colors.white : colors.textSecondary} strokeWidth={2} />
        <Text style={[
          styles.viewModeText,
          { color: viewMode === 'map' ? colors.white : colors.textSecondary }
        ]}>Map</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlaybookView = () => (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={colors.success} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Most Aligned Brands</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAllAligned(!showAllAligned)}
            activeOpacity={0.7}
          >
            <Text style={[styles.showAllButton, { color: colors.primary }]}>
              {showAllAligned ? 'Hide' : 'Show All'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {showAllAligned ? `All ${allSupportFull.length} brands that align with your values` : 'Top 5 brands that align with your values'}
        </Text>
        <View style={styles.brandsContainer}>
          {(showAllAligned ? allSupportFull : topSupport.slice(0, 5)).map((product) => renderBrandCard(product, 'support'))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeader}>
            <TrendingDown size={24} color={colors.danger} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Least Aligned Brands</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAllLeast(!showAllLeast)}
            activeOpacity={0.7}
          >
            <Text style={[styles.showAllButton, { color: colors.primary }]}>
              {showAllLeast ? 'Hide' : 'Show All'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {showAllLeast ? `All ${allAvoidFull.length} brands that do not align with your values` : 'Top 5 brands that do not align with your values'}
        </Text>
        <View style={styles.brandsContainer}>
          {(showAllLeast ? allAvoidFull : topAvoid.slice(0, 5)).map((product) => renderBrandCard(product, 'avoid'))}
        </View>
      </View>
    </>
  );

  const renderFoldersView = () => (
    <View style={styles.foldersContainer}>
      {FOLDER_CATEGORIES.map(category => {
        const brands = categorizedBrands.get(category.id) || [];
        const isExpanded = expandedFolder === category.id;
        
        if (brands.length === 0) return null;
        
        return (
          <View key={category.id} style={[styles.folderCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.folderHeader}
              onPress={() => setExpandedFolder(isExpanded ? null : category.id)}
              activeOpacity={0.7}
            >
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
                {brands.map(product => (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.folderBrandCard, { backgroundColor: colors.background }]}
                    onPress={() => handleProductPress(product)}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={{ uri: product.imageUrl }} 
                      style={styles.folderBrandImage} 
                      resizeMode="cover"
                    />
                    <View style={styles.folderBrandContent}>
                      <Text style={[styles.folderBrandName, { color: colors.text }]} numberOfLines={2}>{product.brand}</Text>
                      <Text style={[styles.folderBrandCategory, { color: colors.textSecondary }]} numberOfLines={1}>{product.category}</Text>
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









  const renderMapView = () => {
    return (
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
        <MapPin size={48} color={colors.textSecondary} strokeWidth={1.5} />
        <Text style={[styles.mapPlaceholderTitle, { color: colors.text }]}>Map Feature Coming Soon</Text>
        <Text style={[styles.mapPlaceholderText, { color: colors.textSecondary }]}>We&apos;re working on bringing interactive maps to help you discover aligned brands near you.</Text>
      </View>
    );
  };

  if (profile.causes.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.neutralLight }]}>
          <Target size={48} color={colors.textLight} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Set Your Values First</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Complete your profile to see personalized brand recommendations
        </Text>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/onboarding')}
          activeOpacity={0.7}
        >
          <Text style={[styles.emptyButtonText, { color: colors.white }]}>Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Playbook</Text>
        {clerkUser && (
          <View style={styles.userInfoContainer}>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {clerkUser.primaryEmailAddress?.emailAddress || clerkUser.username || 'User'}
            </Text>
          </View>
        )}
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]}
        {...panResponder.panHandlers}
      >

      {renderViewModeSelector()}

      {viewMode === 'playbook' && renderPlaybookView()}
      {viewMode === 'browse' && renderFoldersView()}
      {viewMode === 'map' && renderMapView()}

      {viewMode !== 'map' && (
        <TouchableOpacity
          style={[styles.searchPrompt, { 
            backgroundColor: isDarkMode ? colors.backgroundSecondary : colors.background,
            borderColor: isDarkMode ? colors.border : colors.primary
          }]}
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
  },
  webContent: {
    maxWidth: 768,
    alignSelf: 'center' as const,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    flex: 1,
  },
  headerLogo: {
    width: 32,
    height: 32,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  userEmail: {
    fontSize: 12,
    maxWidth: 150,
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
  searchPromptContent: {
  },
  searchPromptTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  searchPromptSubtitle: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 600,
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
  viewModeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
  },
  viewModeButton: {
    width: '33.33%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: '600' as const,
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
  folderBrandContent: {
  },
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
