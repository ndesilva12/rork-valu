import { useRouter } from 'expo-router';
import { Search as SearchIcon, TrendingUp, TrendingDown, Minus, ScanBarcode, X, Heart, MessageCircle, Share2, ExternalLink } from 'lucide-react-native';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
  Linking,
  Share as RNShare,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import MenuButton from '@/components/MenuButton';
import Colors, { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { searchProducts } from '@/mocks/products';
import { MOCK_PRODUCTS } from '@/mocks/products';
import { LOCAL_BUSINESSES } from '@/mocks/local-businesses';
import { Product } from '@/types';
import { lookupBarcode, findBrandInDatabase, getBrandProduct } from '@/mocks/barcode-products';
import { getLogoUrl } from '@/lib/logo';
import { AVAILABLE_VALUES } from '@/mocks/causes';
import { getBusinessesAcceptingDiscounts, BusinessUser } from '@/services/firebase/businessService';

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

export default function SearchScreen() {
  const router = useRouter();
  const { profile, addToSearchHistory, isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [firebaseBusinesses, setFirebaseBusinesses] = useState<BusinessUser[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedInfo, setScannedInfo] = useState<{productName: string; brandName: string; imageUrl?: string; notInDatabase: boolean} | null>(null);
  const [scanning, setScanning] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Fetch Firebase businesses on mount
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const businesses = await getBusinessesAcceptingDiscounts();
        setFirebaseBusinesses(businesses);
      } catch (error) {
        console.error('Error fetching businesses:', error);
      }
    };
    fetchBusinesses();
  }, []);

  // Responsive grid columns
  const numColumns = useMemo(() => width > 768 ? 3 : 2, [width]);

  // Explore feed state
  const [selectedPostProduct, setSelectedPostProduct] = useState<(Product & { matchingValues?: string[] }) | null>(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [interactions, setInteractions] = useState<Map<string, ProductInteraction>>(new Map());
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Calculate aligned products for Explore section
  const alignedProducts = useMemo(() => {
    if (!profile?.causes || !Array.isArray(profile.causes)) {
      return [];
    }

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

  const getAlignmentReason = useCallback((matchingValues: string[]) => {
    if (!matchingValues || matchingValues.length === 0) return null;
    const allValues = Object.values(AVAILABLE_VALUES).flat();
    const firstMatchingValue = allValues.find(v => v.id === matchingValues[0]);
    if (!firstMatchingValue) return null;
    return firstMatchingValue.name;
  }, []);

  const handleSearch = (text: string) => {
    try {
      setQuery(text);
      if (text.trim().length > 0) {
        const userCauseIds = profile?.causes ? profile.causes.map(c => c.id) : [];
        const productResults = searchProducts(text, userCauseIds);

        // Search Firebase businesses
        const businessResults = firebaseBusinesses
          .filter(business => {
            const searchLower = text.toLowerCase();
            return (
              business.businessInfo.name.toLowerCase().includes(searchLower) ||
              business.businessInfo.category.toLowerCase().includes(searchLower) ||
              business.businessInfo.location?.toLowerCase().includes(searchLower) ||
              business.businessInfo.description?.toLowerCase().includes(searchLower)
            );
          })
          .map(business => ({
            id: `firebase-business-${business.id}`,
            firebaseId: business.id, // Store original Firebase ID
            name: business.businessInfo.name,
            brand: business.businessInfo.name,
            category: business.businessInfo.category,
            description: business.businessInfo.description || '',
            alignmentScore: 75, // Neutral score for now
            exampleImageUrl: business.businessInfo.logoUrl,
            website: business.businessInfo.website,
            location: business.businessInfo.location,
            valueAlignments: [],
            keyReasons: [`Accepts Stand Discounts at ${business.businessInfo.name}`],
            moneyFlow: { company: business.businessInfo.name, shareholders: [], overallAlignment: 0 },
            relatedValues: [],
            isFirebaseBusiness: true, // Flag to identify Firebase businesses
          } as Product & { firebaseId: string; isFirebaseBusiness: boolean }));

        // Combine product results and business results
        const combinedResults = [...(productResults || []), ...businessResults];
        setResults(combinedResults);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error during search:', error);
      setResults([]);
    }
  };

  const handleProductPress = (product: Product | (Product & { firebaseId: string; isFirebaseBusiness: boolean })) => {
    if (query.trim().length > 0) {
      addToSearchHistory(query);
    }

    // Check if this is a Firebase business
    const fbBusiness = product as Product & { firebaseId?: string; isFirebaseBusiness?: boolean };
    if (fbBusiness.isFirebaseBusiness && fbBusiness.firebaseId) {
      router.push({
        pathname: '/business/[id]',
        params: { id: fbBusiness.firebaseId },
      });
    } else {
      router.push({
        pathname: '/brand/[id]',
        params: { id: product.id },
      });
    }
  };

  const handleGridCardPress = (product: Product & { matchingValues?: string[] }) => {
    setSelectedPostProduct(product);
    setPostModalVisible(true);
  };

  const handleOpenScanner = async () => {
    console.log('📷 Scanner button clicked');
    console.log('📷 Platform:', Platform.OS);
    console.log('📷 Permission status:', permission);
    console.log('📷 Request permission function:', typeof requestPermission);

    if (Platform.OS === 'web') {
      console.log('📷 Platform is web, showing alert');
      Alert.alert(
        'Scanner Not Available',
        'The barcode scanner is not available on web. Please use the mobile app to scan products.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!requestPermission) {
      console.error('📷 Camera permission hook not available');
      Alert.alert(
        'Camera Not Available',
        'Camera functionality is not available on this device.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('📷 Checking camera permission...');
    if (!permission?.granted) {
      console.log('📷 Permission not granted, requesting...');
      try {
        const result = await requestPermission();
        console.log('📷 Permission request result:', result);
        if (!result.granted) {
          console.log('📷 Permission denied, showing alert');
          Alert.alert(
            'Camera Permission Required',
            'Please allow camera access to scan barcodes',
            [{ text: 'OK' }]
          );
          return;
        }
      } catch (error) {
        console.error('📷 Error requesting permission:', error);
        Alert.alert(
          'Error',
          'Failed to request camera permission. Please check your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    console.log('📷 Opening scanner modal');
    setScannerVisible(true);
  };

  const handleCloseScanner = () => {
    setScannerVisible(false);
    setScannedProduct(null);
    setScannedInfo(null);
    setScanning(true);
    setLookingUp(false);
  };

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    if (!scanning || lookingUp) return;

    console.log('Barcode scanned:', data);
    setScanning(false);
    setLookingUp(true);

    try {
      const productInfo = await lookupBarcode(data);

      if (!productInfo) {
        Alert.alert(
          'Product Not Found',
          'This barcode was not found in our database. Try searching manually.',
          [
            { text: 'OK', onPress: () => handleCloseScanner() },
            { text: 'Scan Again', onPress: () => { setScanning(true); setLookingUp(false); } }
          ]
        );
        return;
      }

      const matchedBrand = findBrandInDatabase(productInfo.brandName);

      if (!matchedBrand) {
        setScannedInfo({
          productName: productInfo.productName,
          brandName: productInfo.brandName,
          imageUrl: productInfo.imageUrl,
          notInDatabase: true
        });
        return;
      }

      const product = getBrandProduct(matchedBrand);

      if (product) {
        setScannedProduct(product);
      } else {
        setScannedInfo({
          productName: productInfo.productName,
          brandName: matchedBrand,
          imageUrl: productInfo.imageUrl,
          notInDatabase: true
        });
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert(
        'Error',
        'Failed to process barcode. Please try again.',
        [
          { text: 'OK', onPress: () => handleCloseScanner() },
          { text: 'Retry', onPress: () => { setScanning(true); setLookingUp(false); } }
        ]
      );
    } finally {
      setLookingUp(false);
    }
  };

  const handleViewScannedProduct = () => {
    if (scannedProduct) {
      handleCloseScanner();
      router.push({
        pathname: '/brand/[id]',
        params: { id: scannedProduct.id },
      });
    }
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 70) return Colors.success;
    if (score >= 40) return Colors.neutral;
    return Colors.danger;
  };

  const getAlignmentIcon = (score: number) => {
    if (score >= 70) return TrendingUp;
    if (score >= 40) return Minus;
    return TrendingDown;
  };

  const getAlignmentLabel = (score: number) => {
    if (score >= 70) return 'Strongly Aligned';
    if (score >= 40) return 'Neutral';
    return 'Not Aligned';
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const alignmentColor = getAlignmentColor(item.alignmentScore);
    const AlignmentIcon = getAlignmentIcon(item.alignmentScore);
    const alignmentLabel = getAlignmentLabel(item.alignmentScore);

    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: getLogoUrl(item.website || '') }}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <View style={styles.productTitleContainer}>
              <Text style={[styles.productBrand, { color: colors.primary }]}>{item.brand}</Text>
              <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
            </View>
            <View style={[styles.scoreContainer, { backgroundColor: alignmentColor + '15' }]}>
              <AlignmentIcon size={16} color={alignmentColor} strokeWidth={2.5} />
              <Text style={[styles.scoreText, { color: alignmentColor }]}>
                {Math.abs(item.alignmentScore)}
              </Text>
            </View>
          </View>
          <View style={[styles.alignmentBadge, { backgroundColor: alignmentColor + '15' }]}>
            <Text style={[styles.alignmentText, { color: alignmentColor }]}>
              {alignmentLabel}
            </Text>
          </View>
          <Text style={[styles.keyReason, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.keyReasons[0]}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExploreCard = ({ item }: { item: Product & { matchingValues?: string[] } }) => {
    return (
      <TouchableOpacity
        style={[
          styles.exploreCard,
          { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }
        ]}
        onPress={() => handleGridCardPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: getLogoUrl(item.website || '') }}
          style={styles.exploreCardImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <View style={[styles.exploreCardOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
          <View style={[styles.exploreCardBadge, { backgroundColor: colors.success + '15' }]}>
            <Text style={[styles.exploreCardScore, { color: colors.success }]}>{item.alignmentScore}</Text>
          </View>
        </View>
        <View style={styles.exploreCardInfo}>
          <Text style={[styles.exploreCardBrand, { color: colors.text }]} numberOfLines={1}>
            {item.brand}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFullPost = () => {
    if (!selectedPostProduct) return null;

    const interaction = getProductInteraction(selectedPostProduct.id);
    const alignmentReason = getAlignmentReason(selectedPostProduct.matchingValues || []);

    return (
      <View style={[styles.postContainer, { backgroundColor: colors.background }]}>
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.brandInfo}
            onPress={() => {
              setPostModalVisible(false);
              handleProductPress(selectedPostProduct);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.brandAvatar, { backgroundColor: colors.backgroundSecondary }]}>
              <Image
                source={{ uri: getLogoUrl(selectedPostProduct.website || '') }}
                style={styles.brandAvatarImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            </View>
            <View style={styles.brandDetails}>
              <Text style={[styles.brandName, { color: colors.text }]}>{selectedPostProduct.brand}</Text>
              <Text style={[styles.brandCategory, { color: colors.textSecondary }]}>{selectedPostProduct.category}</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.postAlignmentBadge, { backgroundColor: colors.success + '15' }]}>
            <Text style={[styles.postAlignmentScore, { color: colors.success }]}>{selectedPostProduct.alignmentScore}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => {
            setPostModalVisible(false);
            handleProductPress(selectedPostProduct);
          }}
        >
          <Image
            source={{ uri: selectedPostProduct.exampleImageUrl || getLogoUrl(selectedPostProduct.website || '') }}
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
              onPress={() => handleLike(selectedPostProduct.id)}
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
              onPress={() => handleOpenComments(selectedPostProduct.id)}
              activeOpacity={0.7}
            >
              <MessageCircle size={28} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(selectedPostProduct)}
              activeOpacity={0.7}
            >
              <Share2 size={28} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.visitButton, { backgroundColor: colors.primary }]}
            onPress={() => handleVisitBrand(selectedPostProduct)}
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
            <Text style={[styles.postProductName, { color: colors.text }]}>
              <Text style={styles.brandNameBold}>{selectedPostProduct.brand}</Text> {selectedPostProduct.productDescription || selectedPostProduct.name}
            </Text>
          </View>
          {interaction.comments.length > 0 && (
            <TouchableOpacity
              onPress={() => handleOpenComments(selectedPostProduct.id)}
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
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.stickyHeader, { backgroundColor: colors.background, borderBottomColor: 'rgba(0, 0, 0, 0.05)' }]}>
        <View style={styles.header}>
          <Image
            source={isDarkMode ? require('@/assets/images/stand logo white.png') : require('@/assets/images/stand logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <MenuButton />
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.primaryLight }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: isDarkMode ? colors.backgroundSecondary : colors.white, borderColor: colors.primaryLight }]}>
          <SearchIcon size={20} color={colors.primaryLight} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products, brands..."
            placeholderTextColor={colors.textLight}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={handleOpenScanner}
            style={[styles.scanButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <ScanBarcode size={20} color={colors.white} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        </View>
      </View>

      {query.trim().length === 0 ? (
        !profile?.causes || profile.causes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight + '10' }]}>
              <SearchIcon size={48} color={colors.primaryLight} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Set Your Values First</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Complete your profile to see personalized product recommendations
            </Text>
          </View>
        ) : (
          <FlatList
            key={`explore-grid-${numColumns}`}
            data={alignedProducts}
            renderItem={renderExploreCard}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            contentContainerStyle={[styles.exploreGrid, { paddingBottom: 100 }]}
            columnWrapperStyle={styles.exploreRow}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.exploreHeader}>
                <Text style={[styles.exploreTitle, { color: colors.text }]}>Explore</Text>
                <Text style={[styles.exploreSubtitle, { color: colors.textSecondary }]}>
                  Brands aligned with your values
                </Text>
              </View>
            }
          />
        )
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Try searching for a different product or brand</Text>
        </View>
      ) : (
        <FlatList
          key="search-results"
          data={results}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Post Detail Modal */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={styles.postModalOverlay}>
          <View style={[styles.postModalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.postModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.postModalTitle, { color: colors.text }]}>Post</Text>
              <TouchableOpacity onPress={() => setPostModalVisible(false)} activeOpacity={0.7}>
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {renderFullPost()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
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

      {/* Barcode Scanner Modal */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={handleCloseScanner}
      >
        <View style={styles.scannerContainer}>
          {!scannedProduct && !scannedInfo ? (
            <>
              <CameraView
                style={styles.camera}
                facing={'back' as CameraType}
                onBarcodeScanned={handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: [
                    'qr',
                    'ean13',
                    'ean8',
                    'code128',
                    'code39',
                    'upc_a',
                    'upc_e',
                  ],
                }}
              >
                <View style={styles.scannerOverlay}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleCloseScanner}
                    activeOpacity={0.7}
                  >
                    <X size={24} color={colors.white} strokeWidth={2.5} />
                  </TouchableOpacity>

                  <View style={styles.scannerFrame}>
                    <View style={styles.scannerFrameCorner} />
                  </View>

                  <View style={styles.scannerTextContainer}>
                    <Text style={styles.scannerTitle}>
                      {lookingUp ? 'Looking Up Product...' : 'Scan Barcode'}
                    </Text>
                    <Text style={styles.scannerSubtitle}>
                      {lookingUp
                        ? 'Checking our database for brand information'
                        : 'Position the barcode within the frame'}
                    </Text>
                  </View>
                </View>
              </CameraView>
            </>
          ) : scannedProduct ? (
            <View style={[styles.resultContainer, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[styles.closeButton, styles.closeButtonResult]}
                onPress={handleCloseScanner}
                activeOpacity={0.7}
              >
                <X size={24} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={styles.resultContent}>
                <View style={[styles.successBadge, { backgroundColor: Colors.success + '15' }]}>
                  <ScanBarcode size={32} color={Colors.success} strokeWidth={2} />
                </View>

                <Text style={[styles.resultTitle, { color: colors.text }]}>Product Found!</Text>

                <Image
                  source={{ uri: getLogoUrl(scannedProduct.website || '') }}
                  style={styles.resultImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />

                <Text style={[styles.resultBrand, { color: colors.primary }]}>
                  {scannedProduct.brand}
                </Text>
                <Text style={[styles.resultName, { color: colors.text }]}>
                  {scannedProduct.name}
                </Text>

                <View style={styles.alignmentContainer}>
                  {(() => {
                    const alignmentColor = getAlignmentColor(scannedProduct.alignmentScore);
                    const AlignmentIcon = getAlignmentIcon(scannedProduct.alignmentScore);
                    const alignmentLabel = getAlignmentLabel(scannedProduct.alignmentScore);

                    return (
                      <>
                        <View style={[styles.alignmentScore, { backgroundColor: alignmentColor + '15' }]}>
                          <AlignmentIcon size={24} color={alignmentColor} strokeWidth={2.5} />
                          <Text style={[styles.alignmentScoreText, { color: alignmentColor }]}>
                            {Math.abs(scannedProduct.alignmentScore)}
                          </Text>
                        </View>
                        <Text style={[styles.alignmentLabel, { color: alignmentColor }]}>
                          {alignmentLabel}
                        </Text>
                      </>
                    );
                  })()}
                </View>

                <TouchableOpacity
                  style={[styles.viewDetailsButton, { backgroundColor: colors.primary }]}
                  onPress={handleViewScannedProduct}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.viewDetailsButtonText, { color: colors.white }]}>
                    View Details
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.scanAgainButton, { borderColor: colors.border }]}
                  onPress={() => {
                    setScannedProduct(null);
                    setScanning(true);
                    setLookingUp(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.scanAgainButtonText, { color: colors.text }]}>
                    Scan Another
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : scannedInfo ? (
            <View style={[styles.resultContainer, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[styles.closeButton, styles.closeButtonResult]}
                onPress={handleCloseScanner}
                activeOpacity={0.7}
              >
                <X size={24} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={styles.resultContent}>
                <View style={[styles.successBadge, { backgroundColor: Colors.success + '15' }]}>
                  <ScanBarcode size={32} color={Colors.success} strokeWidth={2} />
                </View>

                <Text style={[styles.resultTitle, { color: colors.text }]}>Product Scanned!</Text>

                {scannedInfo.imageUrl && (
                  <Image
                    source={{ uri: scannedInfo.imageUrl }}
                    style={styles.resultImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                )}

                <Text style={[styles.resultBrand, { color: colors.primary }]}>
                  {scannedInfo.brandName}
                </Text>
                <Text style={[styles.resultName, { color: colors.text }]}>
                  {scannedInfo.productName}
                </Text>

                <View style={[styles.notInDbBadge, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                  <Text style={[styles.notInDbText, { color: colors.warning }]}>
                    This brand is not in our values database yet
                  </Text>
                </View>

                <Text style={[styles.notInDbDescription, { color: colors.textSecondary }]}>
                  The barcode scanner is working correctly, but we don&apos;t have alignment information for this brand.
                </Text>

                <TouchableOpacity
                  style={[styles.scanAgainButton, { borderColor: colors.border, marginTop: 24 }]}
                  onPress={() => {
                    setScannedInfo(null);
                    setScanning(true);
                    setLookingUp(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.scanAgainButtonText, { color: colors.text }]}>
                    Scan Another Product
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');
// Responsive grid: 3 columns on desktop (>768px), 2 columns on mobile
const isDesktop = width > 768;
const numColumns = isDesktop ? 3 : 2;
const maxGridWidth = Math.min(width, 900); // Max 900px for 3-column layout
const cardWidth = (maxGridWidth - (numColumns + 1) * 3) / numColumns; // Account for gaps

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 8 : 56,
    paddingBottom: 12,
  },
  headerLogo: {
    width: 140,
    height: 41,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Explore Section
  exploreHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  exploreTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  exploreSubtitle: {
    fontSize: 14,
  },
  exploreGrid: {
    paddingHorizontal: 3,
    paddingTop: 0,
    alignSelf: 'center',
    maxWidth: 900,
    width: '100%',
  },
  exploreRow: {
    gap: 3,
  },
  exploreCard: {
    flex: 1,
    aspectRatio: 1,
    marginBottom: 3,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 0,
  },
  exploreCardImage: {
    width: '100%',
    height: '100%',
  },
  exploreCardOverlay: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
  },
  exploreCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exploreCardScore: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  exploreCardInfo: {
    padding: 8,
  },
  exploreCardBrand: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  exploreCardCategory: {
    fontSize: 11,
  },

  // Post Modal
  postModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  postModalContent: {
    minHeight: '70%',
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  postModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  postModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },

  // Full Post Styles
  postContainer: {
    paddingBottom: 16,
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
    fontSize: 13,
  },
  postAlignmentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  postAlignmentScore: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  postImage: {
    width: '100%',
    height: 400,
  },
  alignmentReasonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  alignmentReasonText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  visitButtonText: {
    fontSize: 15,
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
    marginBottom: 8,
  },
  postProductName: {
    fontSize: 14,
    lineHeight: 20,
  },
  brandNameBold: {
    fontWeight: '600' as const,
  },
  viewCommentsText: {
    fontSize: 14,
  },

  // Comments Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    maxHeight: 400,
  },
  commentItem: {
    padding: 16,
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
    padding: 32,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 80,
  },
  commentSubmitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  commentSubmitText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },

  // Empty State & Search Results
  emptyState: {
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
    fontSize: 20,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  productCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  productBrand: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  alignmentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  alignmentText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  keyReason: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Barcode Scanner
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    position: 'absolute' as const,
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonResult: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  scannerFrame: {
    position: 'absolute' as const,
    top: '30%',
    left: '10%',
    right: '10%',
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
  },
  scannerFrameCorner: {
    position: 'absolute' as const,
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00ff88',
    borderTopLeftRadius: 12,
  },
  scannerTextContainer: {
    position: 'absolute' as const,
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
  },
  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 24,
  },
  resultImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  resultBrand: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  resultName: {
    fontSize: 22,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 24,
  },
  alignmentContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  alignmentScore: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  alignmentScoreText: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  alignmentLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  viewDetailsButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  viewDetailsButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  scanAgainButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  scanAgainButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  notInDbBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 24,
    marginBottom: 12,
  },
  notInDbText: {
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  notInDbDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});
