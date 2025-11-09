import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useEffect, useState } from 'react';
import MenuButton from '@/components/MenuButton';
import Colors, { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import ValueCodeSettings from '@/components/ValueCodeSettings';
import BusinessesAcceptingDiscounts from '@/components/BusinessesAcceptingDiscounts';
import BusinessPayment from '@/components/BusinessPayment';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

export default function DiscountScreen() {
  const router = useRouter();
  const { profile, isDarkMode, refreshTransactionTotals, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const isBusiness = profile.accountType === 'business';

  // Business financial state
  const [businessFinancials, setBusinessFinancials] = useState({
    totalRevenue: 0,
    totalDonations: 0,
    standFees: 0,
    totalOwed: 0,
    isLoading: true,
  });

  // Load business financial data
  const loadBusinessFinancials = async () => {
    if (!isBusiness || !clerkUser) return;

    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('merchantId', '==', clerkUser.id),
        where('status', '==', 'completed')
      );

      const querySnapshot = await getDocs(q);
      let totalRevenue = 0;
      let totalDonations = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalRevenue += data.purchaseAmount || 0;
        totalDonations += data.donationAmount || 0;
      });

      const standFees = (totalRevenue + totalDonations) * 0.025; // 2.5% of purchase amounts + donations
      const totalOwed = standFees + totalDonations;

      setBusinessFinancials({
        totalRevenue,
        totalDonations,
        standFees,
        totalOwed,
        isLoading: false,
      });
    } catch (error) {
      console.error('[Money] Error loading business financials:', error);
      setBusinessFinancials((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Refresh transaction totals when component mounts
  useEffect(() => {
    refreshTransactionTotals();
    if (isBusiness) {
      loadBusinessFinancials();
    }
  }, [isBusiness]);

  const handleSelectCharities = () => {
    router.push('/select-charities');
  };

  const selectedOrganizationsCount = profile.selectedCharities?.length || 0;
  const donationAmount = profile.donationAmount || 0;
  const totalSavings = profile.totalSavings || 0;
  const businessDonationAmount = profile.businessInfo?.totalDonated || 0;

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

            {/* Business Payment Section */}
            <BusinessPayment
              amountOwed={businessFinancials.totalOwed}
              standFees={businessFinancials.standFees}
              donationsOwed={businessFinancials.totalDonations}
              businessId={clerkUser?.id || ''}
              businessName={profile.businessInfo?.name || 'Your Business'}
              colors={colors}
            />
          </>
        ) : (
          /* Individual Code: Value Code & QR Generator */
          <>
            {/* Promo Code Section */}
            <View style={[styles.promoSection, { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.promoLabel, { color: colors.textSecondary }]}>Your Promo Code</Text>
              <Text style={[styles.promoCode, { color: colors.primary }]}>{profile.promoCode || 'STAND00000'}</Text>

              {/* Get Discount Code Button */}
              <TouchableOpacity
                style={[styles.discountButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/customer-discount')}
                activeOpacity={0.8}
              >
                <Text style={styles.discountButtonText}>🎟️ Get Discount Code</Text>
                <Text style={styles.discountButtonSubtext}>
                  Show this QR code to participating merchants
                </Text>
              </TouchableOpacity>

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
    paddingTop: Platform.OS === 'web' ? 8 : 56,
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
  discountButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  discountButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  discountButtonSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  qrDivider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginBottom: 20,
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
