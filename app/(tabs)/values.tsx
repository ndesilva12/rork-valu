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

  const supportCauses = profile.causes
    .filter(c => c.type === 'support')
    .sort((a, b) => a.name.localeCompare(b.name));
  const avoidCauses = profile.causes
    .filter(c => c.type === 'avoid')
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
      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Impact</Text>
        <View style={[styles.statsCard, { backgroundColor: 'transparent', borderColor: colors.primaryLight }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDarkMode ? colors.white : colors.primary }]}>{profile.causes.length}</Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? colors.white : colors.textSecondary }]}>Active Values</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDarkMode ? colors.white : colors.primary }]}>{profile.searchHistory.length}</Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? colors.white : colors.textSecondary }]}>Products Checked</Text>
          </View>
        </View>
      </View>

      {supportCauses.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Supporting</Text>
          <View style={styles.causesGrid}>
            {supportCauses.map(cause => (
              <TouchableOpacity
                key={cause.id}
                style={[styles.causeCard, styles.supportCard, { borderColor: colors.success, backgroundColor: colors.backgroundSecondary }]}
                onPress={() => router.push(`/value/${cause.id}`)}
                activeOpacity={0.7}
              >
                <Text style={[styles.causeName, { color: colors.success }]}>{cause.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {avoidCauses.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Opposing</Text>
          <View style={styles.causesGrid}>
            {avoidCauses.map(cause => (
              <TouchableOpacity
                key={cause.id}
                style={[styles.causeCard, styles.avoidCard, { borderColor: colors.danger, backgroundColor: colors.backgroundSecondary }]}
                onPress={() => router.push(`/value/${cause.id}`)}
                activeOpacity={0.7}
              >
                <Text style={[styles.causeName, { color: colors.danger }]}>{cause.name}</Text>
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
  /* trailing line fix */
