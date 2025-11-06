import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Globe, Facebook, Instagram, Twitter, Linkedin, Percent } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { BusinessInfo } from '@/types';

interface BusinessUser {
  id: string;
  email?: string;
  fullName?: string;
  businessInfo: BusinessInfo;
}

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const [business, setBusiness] = useState<BusinessUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Business not found</Text>
        </View>
      </View>
    );
  }

  const acceptsQR = business.businessInfo.acceptsQRCode ?? true;
  const acceptsValue = business.businessInfo.acceptsValueCode ?? true;
  const acceptanceMethod = acceptsQR && acceptsValue
    ? 'QR Code / Value Code'
    : acceptsQR ? 'QR Code' : 'Value Code';

  const discount = business.businessInfo.valueCodeDiscount || 0;
  const customerDiscount = business.businessInfo.customerDiscountPercent || 0;
  const donationPercent = business.businessInfo.donationPercent || 0;

  const handleOpenWebsite = (url?: string) => {
    if (!url) return;
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formattedUrl);
  };

  const handleOpenSocial = (platform: string, handle?: string) => {
    if (!handle) return;
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://facebook.com/${handle}`;
        break;
      case 'instagram':
        url = `https://instagram.com/${handle}`;
        break;
      case 'twitter':
        url = `https://twitter.com/${handle}`;
        break;
      case 'linkedin':
        url = `https://linkedin.com/company/${handle}`;
        break;
    }
    if (url) Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {business.businessInfo.name}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Business Header Card */}
        <View style={[styles.businessHeaderCard, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.logoAndInfo}>
            {business.businessInfo.logoUrl ? (
              <Image
                source={{ uri: business.businessInfo.logoUrl }}
                style={[styles.logo, { borderColor: colors.border }]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.logoPlaceholderText, { color: colors.textSecondary }]}>
                  {business.businessInfo.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.headerInfo}>
              <Text style={[styles.businessName, { color: colors.text }]}>{business.businessInfo.name}</Text>
              <Text style={[styles.businessCategory, { color: colors.textSecondary }]}>
                {business.businessInfo.category}
              </Text>
              {business.businessInfo.location && (
                <View style={styles.locationRow}>
                  <MapPin size={14} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    {business.businessInfo.location}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        {business.businessInfo.description && (
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {business.businessInfo.description}
            </Text>
          </View>
        )}

        {/* Stand Discount Info */}
        {business.businessInfo.acceptsStandDiscounts && (
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.discountHeader}>
              <Percent size={20} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Stand Discount</Text>
            </View>
            <View style={[styles.discountCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
              <View style={styles.discountRow}>
                <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>Acceptance Method:</Text>
                <Text style={[styles.discountValue, { color: colors.primary }]}>{acceptanceMethod}</Text>
              </View>
              <View style={styles.discountRow}>
                <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>Total Discount:</Text>
                <Text style={[styles.discountValue, { color: colors.primary }]}>{discount.toFixed(1)}%</Text>
              </View>
              <View style={styles.discountBreakdown}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Customer receives:</Text>
                  <Text style={[styles.breakdownValue, { color: colors.text }]}>{customerDiscount.toFixed(1)}%</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Donated to charity:</Text>
                  <Text style={[styles.breakdownValue, { color: colors.text }]}>{donationPercent.toFixed(1)}%</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Contact & Links */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact & Links</Text>

          {business.businessInfo.website && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => handleOpenWebsite(business.businessInfo.website)}
              activeOpacity={0.7}
            >
              <Globe size={20} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.contactText, { color: colors.primary }]} numberOfLines={1}>
                {business.businessInfo.website}
              </Text>
            </TouchableOpacity>
          )}

          {business.businessInfo.socialMedia && (
            <View style={styles.socialMediaGrid}>
              {business.businessInfo.socialMedia.facebook && (
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => handleOpenSocial('facebook', business.businessInfo.socialMedia?.facebook)}
                  activeOpacity={0.7}
                >
                  <Facebook size={20} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.socialText, { color: colors.text }]}>Facebook</Text>
                </TouchableOpacity>
              )}
              {business.businessInfo.socialMedia.instagram && (
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => handleOpenSocial('instagram', business.businessInfo.socialMedia?.instagram)}
                  activeOpacity={0.7}
                >
                  <Instagram size={20} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.socialText, { color: colors.text }]}>Instagram</Text>
                </TouchableOpacity>
              )}
              {business.businessInfo.socialMedia.twitter && (
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => handleOpenSocial('twitter', business.businessInfo.socialMedia?.twitter)}
                  activeOpacity={0.7}
                >
                  <Twitter size={20} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.socialText, { color: colors.text }]}>Twitter/X</Text>
                </TouchableOpacity>
              )}
              {business.businessInfo.socialMedia.linkedin && (
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => handleOpenSocial('linkedin', business.businessInfo.socialMedia?.linkedin)}
                  activeOpacity={0.7}
                >
                  <Linkedin size={20} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.socialText, { color: colors.text }]}>LinkedIn</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Money Flow Section */}
        {(business.businessInfo.ownership || business.businessInfo.affiliates || business.businessInfo.partnerships) && (
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Money Flow</Text>

            {/* Ownership */}
            {business.businessInfo.ownership && business.businessInfo.ownership.length > 0 && (
              <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                <Text style={[styles.moneyFlowTitle, { color: colors.text }]}>OWNERSHIP</Text>
                {business.businessInfo.ownership.map((owner, index) => (
                  <View key={`owner-${index}`} style={styles.moneyFlowRow}>
                    <Text style={[styles.moneyFlowName, { color: colors.text }]}>{owner.name}</Text>
                    <Text style={[styles.moneyFlowRelationship, { color: colors.textSecondary }]}>
                      {owner.relationship}
                    </Text>
                  </View>
                ))}
                {business.businessInfo.ownershipSources && (
                  <Text style={[styles.sources, { color: colors.textSecondary }]}>
                    Sources: {business.businessInfo.ownershipSources}
                  </Text>
                )}
              </View>
            )}

            {/* Affiliates */}
            {business.businessInfo.affiliates && business.businessInfo.affiliates.length > 0 && (
              <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                <Text style={[styles.moneyFlowTitle, { color: colors.text }]}>AFFILIATES</Text>
                {business.businessInfo.affiliates.map((affiliate, index) => (
                  <View key={`affiliate-${index}`} style={styles.moneyFlowRow}>
                    <Text style={[styles.moneyFlowName, { color: colors.text }]}>{affiliate.name}</Text>
                    <Text style={[styles.moneyFlowRelationship, { color: colors.textSecondary }]}>
                      {affiliate.relationship}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Partnerships */}
            {business.businessInfo.partnerships && business.businessInfo.partnerships.length > 0 && (
              <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                <Text style={[styles.moneyFlowTitle, { color: colors.text }]}>PARTNERSHIPS</Text>
                {business.businessInfo.partnerships.map((partnership, index) => (
                  <View key={`partnership-${index}`} style={styles.moneyFlowRow}>
                    <Text style={[styles.moneyFlowName, { color: colors.text }]}>{partnership.name}</Text>
                    <Text style={[styles.moneyFlowRelationship, { color: colors.textSecondary }]}>
                      {partnership.relationship}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  businessHeaderCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  logoAndInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  businessCategory: {
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  discountCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  discountBreakdown: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  contactText: {
    fontSize: 15,
    flex: 1,
    textDecorationLine: 'underline',
  },
  socialMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    minWidth: '45%',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  moneyFlowCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  moneyFlowTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  moneyFlowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  moneyFlowName: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'center' as const,
  },
  moneyFlowRelationship: {
    fontSize: 13,
    flex: 1,
    textAlign: 'center' as const,
  },
  sources: {
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic' as const,
  },
});
