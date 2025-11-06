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
  Modal,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Info, X as XIcon } from 'lucide-react-native';
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
  const [showInfoModal, setShowInfoModal] = useState(false);

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
      >
        {/* CODE SECTION */}
        {isBusiness ? (
          /* Business Code: Value Code Settings */
          <>
            <ValueCodeSettings />

            {/* Business Info Section */}
            <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>About Stand Discounts</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                By accepting Stand discounts, you attract value-aligned customers and gain insights into
                their priorities through your Data tab.
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Set your discount percentage and we'll handle the rest. Customers will be able to
                use their codes at checkout.
              </Text>
            </View>
          </>
        ) : (
          /* Individual Code: Value Code & QR Generator */
          <>
            {/* Value Code Section */}
            <View style={[styles.promoSection, { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.promoLabel, { color: colors.textSecondary }]}>Your Value Code</Text>
              <Text style={[styles.promoCode, { color: colors.primary }]}>{profile.promoCode || 'VALU000000'}</Text>
              <Text style={[styles.promoDescription, { color: colors.textSecondary }]}>
                Use this code when you shop at locations and we will donate a percentage of each purchase to your selected organizations
              </Text>

              {/* QR Code Toggle Section */}
              {qrValue && (
                <View style={styles.qrCodeSection}>
                  <View style={styles.qrDivider} />
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

              {/* How Your Code Works - Clickable Text */}
              <TouchableOpacity onPress={() => setShowInfoModal(true)} activeOpacity={0.7} style={styles.howItWorksButton}>
                <Text style={[styles.howItWorksText, { color: colors.primary }]}>
                  How Your Code Works
                </Text>
              </TouchableOpacity>
            </View>

            {/* Businesses Accepting Stand Discounts */}
            <BusinessesAcceptingDiscounts />
          </>
        )}

        {/* DONATE SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isBusiness ? 'Donation Contributions' : 'Impact Dashboard'}
          </Text>

          {isBusiness ? (
            /* Business Donate: Donation Contributions */
            <>
              <View style={[styles.donationCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.donationAmountContainer}>
                  <Text style={[styles.donationLabel, { color: colors.textSecondary }]}>Total Donated Through Stand</Text>
                  <Text style={[styles.donationAmount, { color: colors.primary }]}>
                    ${businessDonationAmount.toFixed(2)}
                  </Text>
                </View>

                <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>
                    How Business Donations Work
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    When customers use their Value codes at your business, a portion of each transaction
                    is donated to causes they support.
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    These donations are automatically processed and distributed to charitable organizations
                    selected by your customers.
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Track your total contribution here and see how your business is making a positive impact
                    in your community.
                  </Text>
                </View>
              </View>

              {/* Business Impact Section */}
              <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Your Impact</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  By accepting Value codes, your business helps facilitate charitable giving while building
                  loyalty with value-aligned customers. Every transaction makes a difference!
                </Text>
              </View>
            </>
          ) : (
            /* Individual Donate: Donation Tracking & Charity Selection */
            <>
              <View style={[styles.donationCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.donationAmountContainer}>
                  <Text style={[styles.donationLabel, { color: colors.textSecondary }]}>Donated on Your Behalf</Text>
                  <Text style={[styles.donationAmount, { color: colors.primary }]}>
                    ${donationAmount.toFixed(2)}
                  </Text>
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

              {/* Info Section */}
              <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>How Donations Work</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Every time you use your Value code, a portion of the transaction is donated to your
                  selected organizations.
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  You can select up to 3 organizations to support. Donations are split equally among
                  your chosen organizations.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>How Your Code Works</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)} activeOpacity={0.7}>
                <XIcon size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                Every time you use your Value code at participating businesses, you'll receive a discount
                and help support the causes you care about through automatic donations.
              </Text>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                Use the Donate section below to select which organizations receive your donation contributions.
              </Text>
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
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
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
  howItWorksText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
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
  donationLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalContent: {
    maxHeight: 400,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
});
