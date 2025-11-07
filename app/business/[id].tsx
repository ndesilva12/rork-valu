import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, MapPin, Navigation, Percent, X } from 'lucide-react-native';
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
  const { profile, isDarkMode } = useUser();
  const { values } = useData();
  const colors = isDarkMode ? darkColors : lightColors;
  const scrollViewRef = useRef<ScrollView>(null);

  const [business, setBusiness] = useState<BusinessUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<{ imageUrl: string; caption: string } | null>(null);

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

  if (business && business.causes && business.causes.length > 0) {
    // Calculate alignment score
    const allValueIds = values.map(v => v.id);
    const alignmentScore = calculateAlignmentScore(profile.causes, business.causes, allValueIds);
    const isAligned = alignmentScore >= 50;

    // Find matching values
    const matchingValues = new Set<string>();
    const userSupportSet = new Set(profile.causes.filter(c => c.type === 'support').map(c => c.id));
    const userAvoidSet = new Set(profile.causes.filter(c => c.type === 'avoid').map(c => c.id));
    const bizSupportSet = new Set(business.causes.filter(c => c.type === 'support').map(c => c.id));
    const bizAvoidSet = new Set(business.causes.filter(c => c.type === 'avoid').map(c => c.id));

    // Get all unique value IDs from both users
    const allValueIds = new Set([...userSupportSet, ...userAvoidSet, ...bizSupportSet, ...bizAvoidSet]);

    allValueIds.forEach(valueId => {
      const userSupports = userSupportSet.has(valueId);
      const userAvoids = userAvoidSet.has(valueId);
      const bizSupports = bizSupportSet.has(valueId);
      const bizAvoids = bizAvoidSet.has(valueId);

      // If they match on this value (both support or both avoid or conflicting)
      if ((userSupports && bizSupports) || (userAvoids && bizAvoids) ||
          (userSupports && bizAvoids) || (userAvoids && bizSupports)) {
        matchingValues.add(valueId);
      }
    });

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
            {/* Logo on the left */}
            <Image
              source={{ uri: logoSource }}
              style={styles.headerLogo}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              placeholder={{ blurhash: 'LGF5?xoffQj[~qoffQof?bofj[ay' }}
            />

            <View style={styles.titleContainer}>
              <Text style={[styles.brandName, { color: colors.text }]}>{business.businessInfo.name}</Text>
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

          {/* Stand Discount Section */}
          {business.businessInfo.acceptsStandDiscounts && (
            <View style={[styles.standDiscountSection, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.discountHeader}>
                <Percent size={20} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.discountHeaderText, { color: colors.text }]}>Stand Discount</Text>
              </View>
              <View style={[styles.discountCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                <View style={styles.discountRow}>
                  <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>Acceptance Method:</Text>
                  <Text style={[styles.discountValue, { color: colors.primary }]}>
                    {(business.businessInfo.acceptsQRCode ?? true) && (business.businessInfo.acceptsValueCode ?? true)
                      ? 'QR Code / Value Code'
                      : (business.businessInfo.acceptsQRCode ?? true) ? 'QR Code' : 'Value Code'}
                  </Text>
                </View>
                <View style={styles.discountRow}>
                  <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>Discount %:</Text>
                  <Text style={[styles.discountValue, { color: colors.primary }]}>
                    {(business.businessInfo.customerDiscountPercent || 0).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.discountRow}>
                  <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>Donation %:</Text>
                  <Text style={[styles.discountValue, { color: colors.primary }]}>
                    {(business.businessInfo.donationPercent || 0).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={[styles.alignmentCard, { backgroundColor: alignmentColor + '15' }]}>
            <View style={styles.alignmentLabelRow}>
              <Text style={[styles.alignmentLabel, { color: alignmentColor }]}>
                {alignmentLabel}
              </Text>
              <Text style={[styles.alignmentDescription, { color: colors.textSecondary }]}>
                {' '}based on your values:
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
    top: 16,
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
  brandName: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 6,
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
});
