import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  PanResponder,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import productsData from '../../mocks/products-data.json';
import { generateProducts } from '../../mocks/generate-products';
import { useRef } from 'react';
import { getLogoUrl } from '@/lib/logo';
import { AVAILABLE_VALUES } from '@/mocks/causes';

interface ValueDriver {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'behavior';
  description: string;
  reason: string;
  imageUrl: string;
  websiteUrl?: string;
}




export default function ValueDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && width >= 768;

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

  // First check if the value is in user's selected causes
  let userCause = profile.causes.find(c => c.id === id);
  let isSelected = !!userCause;

  // If not found in user's causes, check AVAILABLE_VALUES
  if (!userCause) {
    // Search through all categories in AVAILABLE_VALUES
    for (const category of Object.values(AVAILABLE_VALUES)) {
      const found = category.find(v => v.id === id);
      if (found) {
        // Convert to the format expected by the rest of the component
        userCause = {
          id: found.id,
          name: found.name,
          category: found.category,
          description: found.description,
          type: undefined, // Not selected, so no type
        };
        break;
      }
    }
  }

  // If still not found, show error
  if (!userCause) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Value not found</Text>
      </View>
    );
  }

  const isSupporting = userCause.type === 'support';
  const isAvoiding = userCause.type === 'avoid';

  const getWebsiteUrl = (brandName: string): string => {
    const domain = brandName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .replace(/corporation|company|inc|group|brands?|industries|systems|technologies|platforms?$/gi, '');
    return `https://${domain}.com`;
  };

  const getDriversFromProducts = () => {
    const valueData = (productsData as Record<string, { support: string[]; oppose: string[] }>)[id];
    
    if (!valueData) {
      return { supports: [], opposes: [] };
    }

    const allProducts = generateProducts();

    const supports = valueData.support.map((brandName, index) => {
      const product = allProducts.find(p => p.name === brandName);
      const productId = (product?.id && product.id.trim()) ? product.id : '';
      const websiteUrl = product?.website || getWebsiteUrl(brandName);
      return {
        id: productId || `${id}-support-${brandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${index}`,
        name: brandName,
        type: 'brand' as 'brand' | 'product' | 'behavior',
        description: product?.brand || brandName,
        reason: `Directly supports ${userCause.name}`,
        position: index + 1,
        imageUrl: getLogoUrl(websiteUrl),
        websiteUrl,
      };
    });

    const opposes = valueData.oppose.map((brandName, index) => {
      const product = allProducts.find(p => p.name === brandName);
      const productId = (product?.id && product.id.trim()) ? product.id : '';
      const websiteUrl = product?.website || getWebsiteUrl(brandName);
      return {
        id: productId || `${id}-oppose-${brandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${index}`,
        name: brandName,
        type: 'brand' as 'brand' | 'product' | 'behavior',
        description: product?.brand || brandName,
        reason: `Opposes ${userCause.name}`,
        position: index + 1,
        imageUrl: getLogoUrl(websiteUrl),
        websiteUrl,
      };
    });

    return {
      supports,
      opposes,
    };
  };

  const drivers = getDriversFromProducts();

  const handleShopPress = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: userCause.name,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, isLargeScreen && styles.scrollContentCentered]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.contentWrapper, isLargeScreen && styles.contentWrapperConstrained]}>
        <View style={styles.header}>
          {isSelected && (
            <View style={[
              styles.badge,
              isSupporting ? styles.supportBadge : styles.avoidBadge
            ]}>
              <Text style={[
                styles.badgeText,
                isSupporting ? { color: colors.success } : { color: colors.danger }
              ]}>
                {isSupporting ? 'Supporting' : 'Opposing'}
              </Text>
            </View>
          )}
          <Text style={[styles.title, { color: colors.text }]}>{userCause.name}</Text>
          {userCause.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>{userCause.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={colors.primaryLight} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Supports This Value</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Products, brands, and behaviors that align with {userCause.name.toLowerCase()}
          </Text>
          {drivers.supports.length > 0 ? (
            <View style={styles.driversContainer}>
              {drivers.supports.map((driver, index) => (
                <TouchableOpacity
                  key={`${id}-support-${driver.name}-${index}`}
                  style={[styles.driverCard, styles.supportingCard, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => {
                    // Always pass brand name so we can find it even if ID doesn't match
                    router.push(`/brand/${driver.id}?name=${encodeURIComponent(driver.name)}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.leftContent}>
                      {driver.imageUrl ? (
                        <Image source={{ uri: driver.imageUrl }} style={styles.brandLogo} />
                      ) : null}
                      <View style={styles.brandInfo}>
                        <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>{driver.name}</Text>
                        <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>{driver.description}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.shopButton, { backgroundColor: colors.primaryLight }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleShopPress(driver.websiteUrl || '');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.shopButtonText, { color: colors.white }]}>Shop</Text>
                      <ExternalLink size={14} color={colors.white} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No products found that support this value yet</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingDown size={24} color={colors.danger} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Opposes This Value</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Products, brands, and behaviors that work against {userCause.name.toLowerCase()}
          </Text>
          {drivers.opposes.length > 0 ? (
            <View style={styles.driversContainer}>
              {drivers.opposes.map((driver, index) => (
                <TouchableOpacity
                  key={`${id}-oppose-${driver.name}-${index}`}
                  style={[styles.driverCard, styles.opposingCard, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => {
                    // Always pass brand name so we can find it even if ID doesn't match
                    router.push(`/brand/${driver.id}?name=${encodeURIComponent(driver.name)}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.leftContent}>
                      {driver.imageUrl ? (
                        <Image source={{ uri: driver.imageUrl }} style={styles.brandLogo} />
                      ) : null}
                      <View style={styles.brandInfo}>
                        <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>{driver.name}</Text>
                        <Text style={[styles.brandCategory, { color: colors.textSecondary }]} numberOfLines={1}>{driver.description}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.shopButton, { backgroundColor: colors.danger }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleShopPress(driver.websiteUrl || '');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.shopButtonText, { color: colors.white }]}>Shop</Text>
                      <ExternalLink size={14} color={colors.white} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No products found that oppose this value yet</Text>
            </View>
          )}
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
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentCentered: {
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    padding: 20,
  },
  contentWrapperConstrained: {
    maxWidth: '50%',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    marginBottom: 32,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  supportBadge: {
    backgroundColor: '#EFF6FF',
  },
  avoidBadge: {
    backgroundColor: '#FFD6E8',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  supportBadgeText: {},
  avoidBadgeText: {},
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
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
  driversContainer: {
    gap: 12,
  },
  driverCard: {
    borderRadius: 12,
    padding: 14,
  },
  supportingCard: {},
  opposingCard: {},
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  brandInfo: {
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 3,
  },
  brandCategory: {
    fontSize: 13,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
