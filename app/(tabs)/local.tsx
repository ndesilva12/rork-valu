import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, Target, FolderOpen, MapPin } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  PanResponder,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'expo-safe-area-context';
import MenuButton from '@/components/MenuButton';
import { useUser } from '@/contexts/UserContext';
import { LOCAL_BUSINESSES } from '@/mocks/local-businesses';
import { Product } from '@/types';
import { useMemo, useState, useRef } from 'react';

type ViewMode = 'playbook' | 'browse' | 'map';

const localColors = {
  primary: '#84CC16',
  primaryLight: '#A3E635',
  success: '#84CC16',
  successLight: '#A3E635',
  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  white: '#FFFFFF',
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  neutralLight: '#D1D5DB',
  warning: '#F59E0B',
};

const localDarkColors = {
  primary: '#84CC16',
  primaryLight: '#A3E635',
  success: '#84CC16',
  successLight: '#A3E635',
  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  white: '#FFFFFF',
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textLight: '#64748B',
  border: '#334155',
  neutralLight: '#475569',
  warning: '#F59E0B',
};

export default function LocalScreen() {
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? localDarkColors : localColors;
  const [viewMode, setViewMode] = useState<ViewMode>('playbook');
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

  const { topSupport, topAvoid, allSupportFull, allAvoidFull, scoredBrands } = useMemo(() => {
    const supportedCauses = profile.causes.filter(c => c.type === 'support').map(c => c.id);
    const avoidedCauses = profile.causes.filter(c => c.type === 'avoid').map(c => c.id);
    const totalUserValues = profile.causes.length;
    
    const scored = LOCAL_BUSINESSES.map(business => {
      let totalSupportScore = 0;
      let totalAvoidScore = 0;
      const matchingValues = new Set<string>();
      const positionSum: number[] = [];
      
      business.valueAlignments.forEach(alignment => {
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
      
      const isNegativelyAligned = totalAvoidScore > totalSupportScore && totalAvoidScore > 0;
      
      let alignmentStrength: number;
      if (isNegativelyAligned) {
        alignmentStrength = Math.round(((avgPosition - 1) / 10) * 50);
      } else {
        alignmentStrength = Math.round((1 - ((avgPosition - 1) / 10)) * 50 + 50);
      }
      
      return { 
        product: business, 
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
      .sort((a, b) => a.alignmentStrength - b.alignmentStrength);

    const scoredMap = new Map(scored.map(s => [s.product.id, s.alignmentStrength]));

    return { 
      topSupport: allSupportSorted.slice(0, 10).map(s => s.product), 
      topAvoid: allAvoidSorted.slice(0, 10).map(s => s.product),
      allSupportFull: allSupportSorted.map(s => s.product),
      allAvoidFull: allAvoidSorted.map(s => s.product),
      scoredBrands: scoredMap
    };
  }, [profile.causes]);

  const handleBusinessPress = (business: Product) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: business.id },
    });
  };

  const renderBusinessCard = (business: Product, type: 'support' | 'avoid') => {
    const isSupport = type === 'support';
    const titleColor = isSupport ? colors.success : colors.danger;
    const alignmentScore = scoredBrands.get(business.id) || 0;
    
    return (
      <TouchableOpacity 
        key={business.id} 
        style={[
          styles.brandCard,
          { backgroundColor: isDarkMode ? colors.backgroundSecondary : 'rgba(0, 0, 0, 0.06)' }
        ]}
        onPress={() => handleBusinessPress(business)}
        activeOpacity={0.7}
      >
        <View style={styles.brandCardInner}>
          <View style={styles.brandLogoContainer}>
            <Image 
              source={{ uri: business.imageUrl }} 
              style={styles.brandLogo} 
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>
          <View style={styles.brandCardContent}>
            <Text style={[styles.brandName, { color: titleColor }]} numberOfLines={2}>{business.brand}</Text>
            <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>{business.category}</Text>
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
        ]}>Businesses</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Aligned Businesses</Text>
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
          {showAllAligned ? `All ${allSupportFull.length} local businesses that align with your values` : 'Top 5 local businesses that align with your values'}
        </Text>
        <View style={styles.brandsContainer}>
          {(showAllAligned ? allSupportFull : topSupport.slice(0, 5)).map((business) => renderBusinessCard(business, 'support'))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeader}>
            <TrendingDown size={24} color={colors.danger} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Unaligned Businesses</Text>
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
          {showAllLeast ? `All ${allAvoidFull.length} local businesses that do not align with your values` : 'Top 5 local businesses that do not align with your values'}
        </Text>
        <View style={styles.brandsContainer}>
          {(showAllLeast ? allAvoidFull : topAvoid.slice(0, 5)).map((business) => renderBusinessCard(business, 'avoid'))}
        </View>
      </View>
    </>
  );

  const renderBrowseView = () => (
    <View style={styles.browsePlaceholder}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight + '10' }]}>
        <FolderOpen size={48} color={colors.primaryLight} strokeWidth={1.5} />
      </View>
      <Text style={[styles.browsePlaceholderTitle, { color: colors.text }]}>Browse by Category</Text>
      <Text style={[styles.browsePlaceholderText, { color: colors.textSecondary }]}>
        Category browsing for local businesses coming soon.
      </Text>
    </View>
  );

  const renderMapView = () => {
    return (
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
        <MapPin size={48} color={colors.textSecondary} strokeWidth={1.5} />
        <Text style={[styles.mapPlaceholderTitle, { color: colors.text }]}>Map Feature Coming Soon</Text>
        <Text style={[styles.mapPlaceholderText, { color: colors.textSecondary }]}>
          We&apos;re working on bringing interactive maps to help you discover aligned local businesses near you in Wellesley, MA.
        </Text>
      </View>
    );
  };

  if (profile.causes.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Local</Text>
          <MenuButton />
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.neutralLight }]}>
            <Target size={48} color={colors.textLight} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Set Your Values First</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Complete your profile to see personalized local business recommendations
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/onboarding')}
            activeOpacity={0.7}
          >
            <Text style={[styles.emptyButtonText, { color: colors.white }]}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.stickyHeaderContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Local</Text>
          <MenuButton />
        </View>
        {renderViewModeSelector()}
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]}
        {...panResponder.panHandlers}
      >
        {viewMode === 'playbook' && renderPlaybookView()}
        {viewMode === 'browse' && renderBrowseView()}
        {viewMode === 'map' && renderMapView()}
      </ScrollView>
    </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    flex: 1,
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
  viewModeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 12,
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
    fontSize: 15,
    fontWeight: '600' as const,
  },
  mapPlaceholder: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
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
  browsePlaceholder: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  browsePlaceholderTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  browsePlaceholderText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
