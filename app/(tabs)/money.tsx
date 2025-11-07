import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
import QRCode from 'react-native-qrcode-svg';
import MenuButton from '@/components/MenuButton';
import Colors, { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import ValueCodeSettings from '@/components/ValueCodeSettings';
import BusinessesAcceptingDiscounts from '@/components/BusinessesAcceptingDiscounts';

export default function DiscountScreen() {
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { height } = useWindowDimensions();

  const isBusiness = profile.accountType === 'business';
  const [showQRCode, setShowQRCode] = useState(false);

  // Generate a random QR code value that changes on each render
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    // Generate random string for QR code
    const randomString = `VALU-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setQrValue(randomString);
  }, []);

  const handleSelectCharities = () => {
    router.push('/select-charities');
  };

  const selectedOrganizationsCount = profile.selectedCharities?.length || 0;
  const donationAmount = profile.donationAmount || 0;
  const totalSavings = profile.totalSavings || 0;
  const businessDonationAmount = profile.businessInfo?.totalDonated || 0;

  // Calculate QR code size (max 50% of scroll area height, maintain 1:1 ratio)
  const maxQRSize = Math.min(height * 0.5, 300); // Max 50% of height or 300px
  const qrSize = Math.min(maxQRSize, 250); // Constrain to reasonable size

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.stickyHeaderContainer, { backgroundColor: colors.background, borderBottomColor: 'rgba(0, 0, 0, 0.05)' }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Image
            source={isDarkMode ? require('@/assets/images/stand logo white.png') : require('@/assets/images/stand logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <MenuButton />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* CODE SECTION */}
        {isBusiness ? (
          /* Business Code: Value Code Settings */
          <>
            <ValueCodeSettings />
          </>
        ) : (
          /* Individual Code: Value Code & QR Generator */
          <>
            {/* Promo Code Section */}
            <View style={[styles.promoSection, { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.promoLabel, { color: colors.textSecondary }]}>Your Promo Code</Text>
              <Text style={[styles.promoCode, { color: colors.primary }]}>{profile.promoCode || 'STAND00000'}</Text>

              {/* QR Code Toggle Section - Moved directly beneath promo code */}
              {qrValue && (
                <View style={styles.qrCodeSection}>
                  {!showQRCode ? (
                    <TouchableOpacity
                      style={[styles.generateQRButton, { backgroundColor: colors.primary }]}
                      onPress={() => setShowQRCode(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.generateQRButtonText, { color: colors.white }]}>
                        Generate QR Code
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <View style={[styles.qrCodeContainer, { width: qrSize, height: qrSize }]}>
                        <QRCode
                          value={qrValue}
                          size={qrSize - 32}
                          color="#000000"
                          backgroundColor="#ffffff"
                        />
                      </View>
                      <Text style={[styles.qrSubtitle, { color: colors.textSecondary }]}>
                        Present this at checkout for discount and donation credit
                      </Text>
                      <TouchableOpacity
                        style={[styles.closeQRButton, { borderColor: colors.border }]}
                        onPress={() => setShowQRCode(false)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.closeQRButtonText, { color: colors.text }]}>
                          Close
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* Explainer Text */}
              <Text style={[styles.promoDescription, { color: colors.textSecondary }]}>
                Use these codes at participating locations to receive discounts and accumulate donations to your chosen organizations.
              </Text>

              {/* Impact Dashboard Content */}
              <View style={styles.impactDashboardSection}>
                <View style={styles.qrDivider} />

                {/* Two Counters Side by Side */}
                <View style={styles.countersRow}>
                  <View style={styles.counterItem}>
                    <Text style={[styles.donationLabel, { color: colors.textSecondary }]}>Savings</Text>
                    <Text style={[styles.donationAmount, { color: colors.primary }]}>
                      ${totalSavings.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.counterDivider} />
                  <View style={styles.counterItem}>
                    <Text style={[styles.donationLabel, { color: colors.textSecondary }]}>Donated</Text>
                    <Text style={[styles.donationAmount, { color: colors.primary }]}>
                      ${donationAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.charitiesInfoContainer}>
                  <Text style={[styles.charitiesInfoText, { color: colors.textSecondary }]}>
                    {selectedOrganizationsCount === 0
                      ? 'No organizations selected yet'
                      : selectedOrganizationsCount === 1
                      ? '1 organization selected'
                      : `${selectedOrganizationsCount} organizations selected`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.selectCharitiesButton, { backgroundColor: colors.primary }]}
                  onPress={handleSelectCharities}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectCharitiesButtonText, { color: colors.white }]}>
                    {selectedOrganizationsCount === 0 ? 'Select Organizations' : 'Manage Organizations'}
                  </Text>
                </TouchableOpacity>

                {selectedOrganizationsCount > 0 && profile.selectedCharities && (
                  <View style={styles.selectedCharitiesList}>
                    {profile.selectedCharities.map((charity) => (
                      <View key={charity.id} style={[styles.charityItem, { backgroundColor: colors.background }]}>
                        <Text style={[styles.charityName, { color: colors.text }]}>{charity.name}</Text>
                        <Text style={[styles.charityCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                          {charity.category}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Businesses Accepting Stand Discounts */}
            <BusinessesAcceptingDiscounts />
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  stickyHeaderContainer: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
  },
  headerLogo: {
    width: 140,
    height: 41,
  },
  promoSection: {
    borderWidth: 3,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  promoLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promoCode: {
    fontSize: 36,
    fontWeight: '700' as const,
    marginBottom: 12,
    letterSpacing: 2,
  },
  promoDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  qrCodeSection: {
    marginTop: 24,
    alignItems: 'center',
    width: '100%',
  },
  qrDivider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginBottom: 20,
  },
  qrCodeContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
  generateQRButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  generateQRButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  closeQRButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
  },
  closeQRButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  howItWorksButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  impactDashboardSection: {
    marginTop: 20,
  },
  section: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  donationCard: {
    borderRadius: 16,
    padding: 20,
  },
  donationAmountContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  countersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  counterItem: {
    alignItems: 'center',
    flex: 1,
  },
  counterDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
  donationLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center' as const,
  },
  donationAmount: {
    fontSize: 42,
    fontWeight: '700' as const,
  },
  charitiesInfoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  charitiesInfoText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  selectCharitiesButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectCharitiesButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  selectedCharitiesList: {
    gap: 12,
  },
  charityItem: {
    padding: 16,
    borderRadius: 12,
  },
  charityName: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  charityCategory: {
    fontSize: 13,
    opacity: 0.7,
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
  },
});
