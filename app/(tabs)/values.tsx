import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import MenuButton from '@/components/MenuButton';
import Colors, { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function ValuesScreen() {
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const supportValues = profile.values
    .filter(v => v.type === 'support')
    .sort((a, b) => a.name.localeCompare(b.name));
  const avoidValues = profile.values
    .filter(v => v.type === 'avoid')
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.stickyHeaderContainer, { backgroundColor: colors.background, borderBottomColor: 'rgba(0, 0, 0, 0.05)' }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.primary }]}>Values</Text>
          <MenuButton />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content]}
      >
        {/* ValuCode Section */}
        <View style={[styles.valuCodeSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.primary }]}>
          <Text style={[styles.valuCodeTitle, { color: colors.text }]}>Your Code</Text>
          <Text style={[styles.valuCode, { color: colors.primary }]}>{profile.valuCode || 'Loading...'}</Text>
          <Text style={[styles.valuCodeDescription, { color: colors.textSecondary }]}>
            This is your Valu Code. Use this everywhere you spend and we will match $1 for every transaction and contribute it to the charities and organizations you select below.
          </Text>
          <TouchableOpacity
            style={[styles.selectOrganizationsButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/select-organizations' as any)}
            activeOpacity={0.8}
          >
            <Text style={[styles.selectOrganizationsButtonText, { color: colors.white }]}>
              {(profile.selectedOrganizations?.length || 0) > 0
                ? 'Edit Organizations'
                : 'Select Organizations'}
            </Text>
          </TouchableOpacity>

          {/* Display Selected Organizations */}
          {(profile.selectedOrganizations?.length || 0) > 0 && (
            <View style={styles.selectedOrganizationsContainer}>
              <Text style={[styles.selectedOrganizationsTitle, { color: colors.text }]}>
                Your Selected Organizations ({profile.selectedOrganizations?.length || 0}/3)
              </Text>
              <View style={styles.organizationsGrid}>
                {profile.selectedOrganizations?.map((org) => (
                  <View
                    key={org.id}
                    style={[styles.organizationCard, { backgroundColor: colors.background, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.organizationName, { color: colors.primary }]}>{org.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Impact</Text>
          <View style={[styles.statsCard, { backgroundColor: 'transparent', borderColor: colors.primaryLight }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: isDarkMode ? colors.white : colors.primary }]}>{profile.values.length}</Text>
              <Text style={[styles.statLabel, { color: isDarkMode ? colors.white : colors.textSecondary }]}>Active Values</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: isDarkMode ? colors.white : colors.primary }]}>{profile.searchHistory.length}</Text>
              <Text style={[styles.statLabel, { color: isDarkMode ? colors.white : colors.textSecondary }]}>Products Checked</Text>
            </View>
          </View>
        </View>

        {supportValues.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Supporting</Text>
            <View style={styles.causesGrid}>
              {supportValues.map(value => (
                <TouchableOpacity
                  key={value.id}
                  style={[styles.causeCard, styles.supportCard, { borderColor: colors.success, backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => router.push(`/value/${value.id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.causeName, { color: colors.success }]}>{value.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {avoidValues.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Opposing</Text>
            <View style={styles.causesGrid}>
              {avoidValues.map(value => (
                <TouchableOpacity
                  key={value.id}
                  style={[styles.causeCard, styles.avoidCard, { borderColor: colors.danger, backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => router.push(`/value/${value.id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.causeName, { color: colors.danger }]}>{value.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]} key="info-section">
          <Text style={[styles.infoTitle, { color: colors.text }]}>How it works</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            We analyze where your money flows when you purchase products - from the company to its
            shareholders and beneficiaries. We then match these entities against your selected values
            to provide alignment scores.
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Products are scored from -100 (strongly opposed) to +100 (strongly aligned) based on
            public records, donations, and stated positions.
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  causesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  causeCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  supportCard: {
    borderColor: Colors.success,
  },
  avoidCard: {
    borderColor: Colors.danger,
  },
  causeName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  avoidText: {
    color: Colors.danger,
  },
  valuCodeSection: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  valuCodeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  valuCode: {
    fontSize: 36,
    fontWeight: '700' as const,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  valuCodeDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  selectOrganizationsButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectOrganizationsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  selectedOrganizationsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedOrganizationsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  organizationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  organizationCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  organizationName: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: Colors.primaryLight + '08',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  infoSection: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
});
