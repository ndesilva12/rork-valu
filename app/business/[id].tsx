import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, MapPin, Navigation, Percent, X, Plus, ChevronRight, List, UserPlus } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  PanResponder,
  Modal,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { Image } from 'expo-image';
import { lightColors, darkColors } from '@/constants/colors';
import { AVAILABLE_VALUES } from '@/mocks/causes';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { BusinessInfo, Cause } from '@/types';
import { getLogoUrl } from '@/lib/logo';
import { calculateAlignmentScore } from '@/services/firebase/businessService';
import { getUserLists, addEntryToList } from '@/services/firebase/listService';

interface BusinessUser {
  id: string;
  email?: string;
  fullName?: string;
  businessInfo: BusinessInfo;
  causes?: Cause[];
}

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, isDarkMode, clerkUser } = useUser();
  const { values } = useData();
  const colors = isDarkMode ? darkColors : lightColors;
  const scrollViewRef = useRef<ScrollView>(null);

  const [business, setBusiness] = useState<BusinessUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<{ imageUrl: string; caption: string } | null>(null);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [userLists, setUserLists] = useState<any[]>([]);
  const [businessOwnerLists, setBusinessOwnerLists] = useState<any[]>([]);
  const [loadingBusinessLists, setLoadingBusinessLists] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.accountType === 'business' && data.businessInfo) {
            setBusiness({
              id: docSnap.id,
              email: data.email,
              fullName: data.fullName,
              businessInfo: data.businessInfo as BusinessInfo,
              causes: data.causes || [],
            });
          }
        }
      } catch (error) {
        console.error('Error fetching business:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [id]);

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

  const loadUserLists = async () => {
    if (!clerkUser?.id) return;
    try {
      const lists = await getUserLists(clerkUser.id);
      setUserLists(lists);
    } catch (error) {
      console.error('[BusinessDetail] Error loading user lists:', error);
    }
  };

  // Load business owner's lists to display their brands & businesses
  const loadBusinessOwnerLists = async () => {
    if (!id) return;
    try {
      setLoadingBusinessLists(true);
      const lists = await getUserLists(id as string);
      setBusinessOwnerLists(lists);
    } catch (error) {
      console.error('[BusinessDetail] Error loading business owner lists:', error);
    } finally {
      setLoadingBusinessLists(false);
    }
  };

  // Helper to extract all brands and businesses from business owner's lists
  const extractBrandsAndBusinesses = () => {
    const brands: { name: string; listName: string }[] = [];
    const businesses: { name: string; listName: string }[] = [];

    businessOwnerLists.forEach(list => {
      list.entries.forEach((entry: any) => {
        if (entry.type === 'brand' && entry.brandName && entry.brandId) {
          brands.push({
            name: entry.brandName,
            listName: list.name
          });
        } else if (entry.type === 'business' && entry.businessId) {
          businesses.push({
            name: entry.businessName || entry.name || 'Unknown Business',
            listName: list.name
          });
        }
      });
    });

    return { brands, businesses };
  };

  const handleAddToList = async (listId: string) => {
    if (!business || !clerkUser?.id) return;

    try {
      await addEntryToList(listId, {
        type: 'business',
        businessId: business.id,
        name: business.businessInfo.name,
        website: business.businessInfo.website || '',
        logoUrl: getLogoUrl(business.businessInfo.website || ''),
      });
      setShowAddToListModal(false);
      Alert.alert('Success', `Added ${business.businessInfo.name} to your list`);
    } catch (error) {
      console.error('[BusinessDetail] Error adding to list:', error);
      Alert.alert('Error', 'Could not add to list. Please try again.');
    }
  };

  const handleOpenAddModal = async () => {
    if (userLists.length === 0) {
      await loadUserLists();
    }
    setShowAddToListModal(true);
  };

  const handleFollow = async () => {
    if (!business) return;

    // TODO: Implement follow/unfollow functionality
    console.log('Follow clicked:', { businessId: business.id, businessName: business.businessInfo.name });

    // TODO: Call followService to add/remove follow
    // TODO: Update UI to show followed state

    if (Platform.OS === 'web') {
      window.alert(`Follow functionality will be implemented soon!\nBusiness: ${business.businessInfo.name}`);
    } else {
      Alert.alert('Coming Soon', `Follow functionality will be implemented soon!\nBusiness: ${business.businessInfo.name}`);
    }
  };

  useEffect(() => {
    loadUserLists();
  }, [clerkUser?.id]);

  useEffect(() => {
    loadBusinessOwnerLists();
  }, [id]);

  const handleShopPress = async () => {
    if (!business?.businessInfo.website) return;
    try {
      const websiteUrl = business.businessInfo.website.startsWith('http')
        ? business.businessInfo.website
        : `https://${business.businessInfo.website}`;
      const canOpen = await Linking.canOpenURL(websiteUrl);
      if (canOpen) {
        await Linking.openURL(websiteUrl);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const handleSocialPress = async (platform: 'x' | 'instagram' | 'facebook' | 'linkedin' | 'yelp' | 'youtube') => {
    if (!business) return;
    try {
      const socialMedia = business.businessInfo.socialMedia;
      let url = '';

      switch (platform) {
        case 'x':
          url = socialMedia?.twitter ? `https://x.com/${socialMedia.twitter}` : '';
          break;
        case 'instagram':
          url = socialMedia?.instagram ? `https://instagram.com/${socialMedia.instagram}` : '';
          break;
        case 'facebook':
          url = socialMedia?.facebook ? `https://facebook.com/${socialMedia.facebook}` : '';
          break;
        case 'linkedin':
          url = socialMedia?.linkedin
            ? (socialMedia.linkedin.startsWith('http') ? socialMedia.linkedin : `https://${socialMedia.linkedin}`)
            : '';
          break;
        case 'yelp':
          url = socialMedia?.yelp
            ? (socialMedia.yelp.startsWith('http') ? socialMedia.yelp : `https://${socialMedia.yelp}`)
            : '';
          break;
        case 'youtube':
          url = socialMedia?.youtube
            ? (socialMedia.youtube.startsWith('http') ? socialMedia.youtube : `https://${socialMedia.youtube}`)
            : '';
          break;
      }

      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        }
      }
    } catch (error) {
      console.error('Error opening social URL:', error);
    }
  };

  const handleViewOnMap = async () => {
    if (!business) return;

    // Get the primary location or first location
    let latitude: number | undefined;
    let longitude: number | undefined;
    let address: string | undefined;

    if (business.businessInfo.locations && business.businessInfo.locations.length > 0) {
      const primaryLocation = business.businessInfo.locations.find(loc => loc.isPrimary) || business.businessInfo.locations[0];
      latitude = primaryLocation.latitude;
      longitude = primaryLocation.longitude;
      address = primaryLocation.address;
    } else if (business.businessInfo.latitude && business.businessInfo.longitude) {
      latitude = business.businessInfo.latitude;
      longitude = business.businessInfo.longitude;
      address = business.businessInfo.location;
    }

    if (!latitude || !longitude) {
      return;
    }

    try {
      // Create Google Maps URL with coordinates
      const label = encodeURIComponent(business.businessInfo.name);
      const url = Platform.select({
        ios: `maps:0,0?q=${latitude},${longitude}(${label})`,
        android: `geo:0,0?q=${latitude},${longitude}(${label})`,
        default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      });

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  // Calculate alignment data
  let alignmentData = {
    isAligned: false,
    matchingValues: [] as string[],
    alignmentStrength: 50
  };

  if (business && profile.causes && profile.causes.length > 0) {
    // Calculate raw alignment score using the same method as list views
    const rawScore = calculateAlignmentScore(profile.causes, business.causes || []);

    // Create sets for matching values calculation
    const userSupportSet = new Set(profile.causes.filter(c => c.type === 'support').map(c => c.id));
    const userAvoidSet = new Set(profile.causes.filter(c => c.type === 'avoid').map(c => c.id));
    const bizCauses = business.causes || [];
    const bizSupportSet = new Set(bizCauses.filter(c => c.type === 'support').map(c => c.id));
    const bizAvoidSet = new Set(bizCauses.filter(c => c.type === 'avoid').map(c => c.id));

    // Get all unique value IDs
    const allValueIds = new Set([...userSupportSet, ...userAvoidSet, ...bizSupportSet, ...bizAvoidSet]);

    // Find matching/conflicting values for display
    const matchingValues = new Set<string>();
    allValueIds.forEach(valueId => {
      const userHasPosition = userSupportSet.has(valueId) || userAvoidSet.has(valueId);
      const bizHasPosition = bizSupportSet.has(valueId) || bizAvoidSet.has(valueId);
      if (userHasPosition && bizHasPosition) {
        matchingValues.add(valueId);
      }
    });

    // Map raw score to 10-90 range
    // Raw scores typically range from -50 to +50, map this to 10-90
    // Negative scores (conflicts) -> 10-49, Positive scores (matches) -> 51-90
    let alignmentScore = 50; // Default neutral

    if (rawScore !== 0) {
      // Map rawScore (-50 to +50) to alignment score (10 to 90)
      // Formula: score = 50 + (rawScore * 0.8)
      alignmentScore = Math.round(50 + (rawScore * 0.8));
      alignmentScore = Math.max(10, Math.min(90, alignmentScore));
    }

    const isAligned = alignmentScore >= 50;

    alignmentData = {
      isAligned,
      matchingValues: Array.from(matchingValues),
      alignmentStrength: alignmentScore
    };
  }

  const alignmentColor = alignmentData.isAligned ? colors.success : colors.danger;
  const AlignmentIcon = alignmentData.isAligned ? TrendingUp : TrendingDown;
  const alignmentLabel = alignmentData.isAligned ? 'Aligned' : 'Not Aligned';

  // Get primary location
  const getPrimaryLocation = () => {
    if (business?.businessInfo.locations && business.businessInfo.locations.length > 0) {
      const primary = business.businessInfo.locations.find(loc => loc.isPrimary);
      return primary?.address || business.businessInfo.locations[0].address;
    }
    return business?.businessInfo.location;
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Loading business...</Text>
        </View>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>Business not found</Text>
        </View>
      </View>
    );
  }

  // Use cover image for hero, otherwise fall back to logo
  const coverSource = business.businessInfo.coverImageUrl || business.businessInfo.logoUrl || getLogoUrl(business.businessInfo.website || '');
  const logoSource = business.businessInfo.logoUrl || getLogoUrl(business.businessInfo.website || '');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            source={{ uri: coverSource }}
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

          {business.businessInfo.website && (
            <TouchableOpacity
              style={[styles.visitButton, { backgroundColor: colors.primary }]}
              onPress={handleShopPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.visitButtonText, { color: colors.white }]}>Visit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {/* Header with logo, business info, and score */}
          <View style={styles.header}>
            <Image
              source={{ uri: logoSource }}
              style={styles.headerLogo}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              placeholder={{ blurhash: 'LGF5?xoffQj[~qoffQof?bofj[ay' }}
            />

            <View style={styles.titleContainer}>
              <View style={styles.brandNameRow}>
                <Text style={[styles.brandName, { color: colors.text }]}>{business.businessInfo.name}</Text>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={[styles.followButton, { backgroundColor: colors.background }]}
                    onPress={handleFollow}
                    activeOpacity={0.7}
                  >
                    <UserPlus size={18} color={colors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addToListButton, { backgroundColor: colors.background }]}
                    onPress={handleOpenAddModal}
                    activeOpacity={0.7}
                  >
                    <Plus size={18} color={colors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.category, { color: colors.primary }]}>{business.businessInfo.category}</Text>
              {getPrimaryLocation() && (
                <View style={styles.locationRow}>
                  <MapPin size={14} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    {getPrimaryLocation()}
                  </Text>
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

          {business.businessInfo.description && (
            <Text style={[styles.brandDescription, { color: colors.textSecondary }]}>
              {business.businessInfo.description}
            </Text>
          )}

          <View style={styles.socialLinksContainer}>
            {business.businessInfo.socialMedia?.twitter && (
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                onPress={() => handleSocialPress('x')}
                activeOpacity={0.7}
              >
                <Text style={[styles.socialButtonText, { color: colors.text }]}>𝕏</Text>
              </TouchableOpacity>
            )}
            {business.businessInfo.socialMedia?.instagram && (
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                onPress={() => handleSocialPress('instagram')}
                activeOpacity={0.7}
              >
                <Text style={[styles.socialButtonText, { color: colors.text }]}>Instagram</Text>
              </TouchableOpacity>
            )}
            {business.businessInfo.socialMedia?.facebook && (
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                onPress={() => handleSocialPress('facebook')}
                activeOpacity={0.7}
              >
                <Text style={[styles.socialButtonText, { color: colors.text }]}>Facebook</Text>
              </TouchableOpacity>
            )}
            {business.businessInfo.socialMedia?.linkedin && (
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                onPress={() => handleSocialPress('linkedin')}
                activeOpacity={0.7}
              >
                <Text style={[styles.socialButtonText, { color: colors.text }]}>LinkedIn</Text>
              </TouchableOpacity>
            )}
            {business.businessInfo.socialMedia?.yelp && (
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                onPress={() => handleSocialPress('yelp')}
                activeOpacity={0.7}
              >
                <Text style={[styles.socialButtonText, { color: colors.text }]}>Yelp</Text>
              </TouchableOpacity>
            )}
            {business.businessInfo.socialMedia?.youtube && (
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                onPress={() => handleSocialPress('youtube')}
                activeOpacity={0.7}
              >
                <Text style={[styles.socialButtonText, { color: colors.text }]}>YouTube</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* View on Map Button */}
          {((business.businessInfo.locations && business.businessInfo.locations.length > 0) ||
            (business.businessInfo.latitude && business.businessInfo.longitude)) && (
            <TouchableOpacity
              style={[styles.mapButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={handleViewOnMap}
              activeOpacity={0.7}
            >
              <Navigation size={20} color={colors.white} strokeWidth={2} />
              <Text style={[styles.mapButtonText, { color: colors.white }]}>View on Map</Text>
            </TouchableOpacity>
          )}

          {/* Upright Discount Section */}
          {business.businessInfo.acceptsStandDiscounts && (
            <View style={[styles.standDiscountSection, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.discountHeader}>
                <Percent size={20} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.discountHeaderText, { color: colors.text }]}>Upright Discount</Text>
              </View>
              <View style={[styles.discountCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                <View style={styles.discountRow}>
                  <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>Discount %:</Text>
                  <Text style={[styles.discountValue, { color: colors.primary }]}>
                    {(business.businessInfo.customerDiscountPercent || 0).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          )}

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

          {/* Gallery Images Section */}
          {business.businessInfo.galleryImages && business.businessInfo.galleryImages.length > 0 && (
            <View style={styles.gallerySection}>
              <View style={styles.galleryGrid}>
                {business.businessInfo.galleryImages.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.galleryCard, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => setSelectedGalleryImage(item)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.galleryCardImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={150}
                      placeholder={{ blurhash: 'LGF5?xoffQj[~qoffQof?bofj[ay' }}
                    />
                    {item.caption ? (
                      <View style={[styles.galleryCaptionOverlay, { backgroundColor: colors.background + 'DD' }]}>
                        <Text style={[styles.galleryCaptionText, { color: colors.text }]} numberOfLines={2}>
                          {item.caption}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Brands & Businesses Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Brands & Businesses</Text>

            <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.success }]}>
              {loadingBusinessLists ? (
                <View style={styles.shareholdersContainer}>
                  <Text style={[styles.noDataText, { color: colors.textSecondary }]}>Loading...</Text>
                </View>
              ) : (() => {
                const { brands, businesses } = extractBrandsAndBusinesses();
                const hasData = brands.length > 0 || businesses.length > 0;

                if (!hasData) {
                  return (
                    <View style={styles.shareholdersContainer}>
                      <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                        No brands or businesses in lists
                      </Text>
                    </View>
                  );
                }

                // Helper function to get display name for list
                const getListDisplayName = (listName: string) => {
                  // If list name is "My List" or matches the business owner's name, show business name
                  if (listName === 'My List' || listName === business?.fullName || listName === business?.businessInfo.name) {
                    return business?.businessInfo.name || listName;
                  }
                  return listName;
                };

                return (
                  <View style={styles.shareholdersContainer}>
                    {brands.length > 0 && (
                      <>
                        <View style={[styles.subsectionHeader, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.subsectionTitle, { color: colors.text }]}>Brands ({brands.length})</Text>
                        </View>
                        {brands.map((brand, index) => (
                          <View key={`brand-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                            <View style={styles.tableRow}>
                              <Text style={[styles.affiliateName, { color: colors.text }]}>{brand.name}</Text>
                              <Text style={[styles.affiliateRelationship, { color: colors.textSecondary }]}>
                                {getListDisplayName(brand.listName)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </>
                    )}

                    {businesses.length > 0 && (
                      <>
                        <View style={[styles.subsectionHeader, { borderBottomColor: colors.border, marginTop: brands.length > 0 ? 16 : 0 }]}>
                          <Text style={[styles.subsectionTitle, { color: colors.text }]}>Businesses ({businesses.length})</Text>
                        </View>
                        {businesses.map((biz, index) => (
                          <View key={`business-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                            <View style={styles.tableRow}>
                              <Text style={[styles.affiliateName, { color: colors.text }]}>{biz.name}</Text>
                              <Text style={[styles.affiliateRelationship, { color: colors.textSecondary }]}>
                                {getListDisplayName(biz.listName)}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                );
              })()}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Money Flow</Text>

            {/* Ownership Section */}
            <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary, marginBottom: 16 }]}>
              <View style={[styles.subsectionHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>Ownership</Text>
              </View>

              {business.businessInfo.ownership && business.businessInfo.ownership.length > 0 ? (
                <View style={styles.shareholdersContainer}>
                  {business.businessInfo.ownership.map((owner, index) => (
                    <View key={`owner-${index}`} style={[styles.shareholderItem, { borderBottomColor: colors.border }]}>
                      <View style={styles.tableRow}>
                        <Text style={[styles.affiliateName, { color: colors.text }]}>{owner.name}</Text>
                        <Text style={[styles.affiliateRelationship, { color: colors.textSecondary }]}>
                          {owner.relationship}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {business.businessInfo.ownershipSources && (
                    <View style={[styles.sourcesContainer, { borderTopColor: colors.border }]}>
                      <Text style={[styles.sourcesLabel, { color: colors.text }]}>Sources:</Text>
                      <Text style={[styles.sourcesText, { color: colors.textSecondary }]}>
                        {business.businessInfo.ownershipSources}
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

              {business.businessInfo.affiliates && business.businessInfo.affiliates.length > 0 ? (
                <View style={styles.shareholdersContainer}>
                  {business.businessInfo.affiliates.map((affiliate, index) => (
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

              {business.businessInfo.partnerships && business.businessInfo.partnerships.length > 0 ? (
                <View style={styles.shareholdersContainer}>
                  {business.businessInfo.partnerships.map((partnership, index) => (
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
        </View>
      </ScrollView>

      {/* Gallery Image Modal */}
      <Modal
        visible={selectedGalleryImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedGalleryImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setSelectedGalleryImage(null)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: colors.background }]}
                onPress={() => setSelectedGalleryImage(null)}
                activeOpacity={0.7}
              >
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>

              {selectedGalleryImage && (
                <>
                  <Image
                    source={{ uri: selectedGalleryImage.imageUrl }}
                    style={styles.modalImage}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    transition={200}
                    placeholder={{ blurhash: 'LGF5?xoffQj[~qoffQof?bofj[ay' }}
                  />
                  {selectedGalleryImage.caption ? (
                    <View style={[styles.modalCaptionContainer, { backgroundColor: colors.background }]}>
                      <Text style={[styles.modalCaptionText, { color: colors.text }]}>
                        {selectedGalleryImage.caption}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Add to List Modal */}
      <Modal
        visible={showAddToListModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddToListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowAddToListModal(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={[styles.quickAddModalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add to List</Text>
              <TouchableOpacity onPress={() => setShowAddToListModal(false)}>
                <X size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={[styles.quickAddItemName, { color: colors.primary }]}>
                {business?.businessInfo.name}
              </Text>

              <Text style={[styles.modalLabel, { color: colors.text, marginTop: 16 }]}>
                Select a list:
              </Text>

              {userLists.length === 0 ? (
                <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>
                  You don't have any lists yet. Create one on the Playbook tab!
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
                      <View style={[styles.listIconContainer, { backgroundColor: colors.primary + '20' }]}>
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
            </ScrollView>
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
  headerLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700' as const,
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  followButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToListButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  standDiscountSection: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  discountHeaderText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  discountCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  discountValue: {
    fontSize: 16,
    fontWeight: '700' as const,
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
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  // Gallery Styles
  gallerySection: {
    marginTop: 16,
    marginBottom: 8,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  galleryCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryCardImage: {
    width: '100%',
    height: '100%',
  },
  galleryCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  galleryCaptionText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  modalCaptionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCaptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickAddModalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    marginHorizontal: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickAddItemName: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginTop: 8,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  emptyListText: {
    fontSize: 14,
    textAlign: 'center' as const,
    padding: 20,
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
    fontSize: 13,
    color: '#666',
  },
});
