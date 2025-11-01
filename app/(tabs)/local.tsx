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
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function ValuesScreen() {
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const supportCauses = (profile.causes || [])
    .filter(c => c.type === 'support')
    .sort((a, b) => a.name.localeCompare(b.name));
  const avoidCauses = (profile.causes || [])
    .filter(c => c.type === 'avoid')
    .sort((a, b) => a.name.localeCompare(b.name));

  const allCauses = [...supportCauses, ...avoidCauses];

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
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
      >
        {allCauses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Values Selected</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add values in your profile to see them here
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Values
            </Text>
            <View style={styles.valuesGrid}>
              {allCauses.map(cause => (
                <TouchableOpacity
                  key={cause.id}
                  style={[
                    styles.valueChip,
                    {
                      backgroundColor: cause.type === 'support' ? colors.success + '20' : colors.danger + '20',
                      borderColor: cause.type === 'support' ? colors.success : colors.danger,
                    }
                  ]}
                  onPress={() => router.push(`/value/${cause.id}`)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.valueChipText,
                      { color: cause.type === 'support' ? colors.success : colors.danger }
                    ]}
                    numberOfLines={2}
                  >
                    {cause.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About Your Values</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Tap any value to see brands that align with it. Green values represent causes you support,
            while red values represent causes you avoid.
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your values help us recommend products and brands that match your beliefs and priorities.
          </Text>
        </View>
      </ScrollView>
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
    marginBottom: 16,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  valueChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
    maxWidth: '48%',
  },
  valueChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
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
