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
} from 'react-native';
import { useState, useEffect } from 'react';
import QRCode from 'react-native-qrcode-svg';
import MenuButton from '@/components/MenuButton';
import Colors, { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import BusinessProfileEditor from '@/components/BusinessProfileEditor';
import ValuCodeSettings from '@/components/ValuCodeSettings';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { height } = useWindowDimensions();

  const isBusiness = profile.accountType === 'business';

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
          <Text style={[styles.title, { color: colors.primary }]}>Profile</Text>
          <MenuButton />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
      >
        {isBusiness ? (
          /* Business Account UI */
          <>
            <BusinessProfileEditor />
            <ValuCodeSettings />

            {/* Business Info Section */}
            <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>About Your Business Profile</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Your brand profile helps customers discover your business and understand your values.
                Keep your information up-to-date to maximize visibility on the Valu platform.
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                By accepting valu codes, you attract value-aligned customers and gain insights into
                their priorities through your Data tab.
              </Text>
            </View>
          </>
        ) : (
          /* Individual Account UI */
          <>
            {/* Valu Code Section */}
            <View style={[styles.promoSection, { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.promoLabel, { color: colors.textSecondary }]}>Your Valu Code</Text>
              <Text style={[styles.promoCode, { color: colors.primary }]}>{profile.promoCode || 'VALU000000'}</Text>
              <Text style={[styles.promoDescription, { color: colors.textSecondary }]}>
                Use this code when you shop at locations and we will donate a percentage of each purchase to your selected organizations
              </Text>

              {/* QR Code - Inside the same box */}
              {qrValue && (
                <View style={styles.qrCodeSection}>
                  <View style={styles.qrDivider} />
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
                </View>
              )}
            </View>

            {/* Donation Counter Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Impact Dashboard</Text>
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
            </View>

            {/* Info Section */}
            <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>How Donations Work</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Every time you or someone using your Valu code makes a purchase, we donate a portion
                of the transaction to your selected organizations.
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                You can select up to 3 organizations to support. Donations are split equally among
                your chosen organizations.
              </Text>
            </View>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    flex: 1,
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
  qrLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  section: {
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
});
