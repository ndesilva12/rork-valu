import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import MenuButton from '@/components/MenuButton';
import Colors, { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const handleSelectCharities = () => {
    // TODO: Implement charity selection page/modal
    Alert.alert(
      'Select Charities',
      'Charity selection will be available soon. You can select up to 3 organizations to receive donations on your behalf.',
      [{ text: 'OK' }]
    );
  };

  const selectedCharitiesCount = profile.selectedCharities?.length || 0;
  const donationAmount = profile.donationAmount || 0;

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
        contentContainerStyle={[styles.content]}
      >
        {/* Promo Code Section */}
        <View style={[styles.promoSection, { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.promoLabel, { color: colors.textSecondary }]}>Your Promo Code</Text>
          <Text style={[styles.promoCode, { color: colors.primary }]}>{profile.promoCode || 'VALU000000'}</Text>
          <Text style={[styles.promoDescription, { color: colors.textSecondary }]}>
            Share this code with friends and earn rewards on every purchase
          </Text>
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
                {selectedCharitiesCount === 0
                  ? 'No charities selected yet'
                  : selectedCharitiesCount === 1
                  ? '1 charity selected'
                  : `${selectedCharitiesCount} charities selected`}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.selectCharitiesButton, { backgroundColor: colors.primary }]}
              onPress={handleSelectCharities}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectCharitiesButtonText, { color: colors.white }]}>
                {selectedCharitiesCount === 0 ? 'Select Charities' : 'Manage Charities'}
              </Text>
            </TouchableOpacity>

            {selectedCharitiesCount > 0 && profile.selectedCharities && (
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
            Every time you or someone using your promo code makes a purchase, we donate a portion
            of the transaction to your selected charities.
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            You can select up to 3 organizations to support. Donations are split equally among
            your chosen charities.
          </Text>
        </View>
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
