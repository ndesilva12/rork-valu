import { useRouter, Stack } from 'expo-router';
import { Settings, Moon, Sun, RefreshCw, LogOut } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors, { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useClerk } from '@clerk/clerk-expo';

export default function ValuesScreen() {
  const router = useRouter();
  const { profile, resetProfile, isDarkMode, toggleDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { signOut } = useClerk();

  const supportCauses = profile.causes
    .filter(c => c.type === 'support')
    .sort((a, b) => a.name.localeCompare(b.name));
  const avoidCauses = profile.causes
    .filter(c => c.type === 'avoid')
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleUpdate = () => {
    router.push('/onboarding');
  };

  const handleReset = async () => {
    await resetProfile();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/sign-in');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Values</Text>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.actionSection}>
        <View style={[styles.settingsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.settingItem} onPress={handleUpdate} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Settings size={20} color={colors.primary} strokeWidth={2} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Update My Values</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Modify your preferences</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.settingItem} onPress={handleReset} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <RefreshCw size={20} color={colors.textSecondary} strokeWidth={2} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.textSecondary }]}>Reset All Values</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Clear all selections</Text>
              </View>
            </View>
          </TouchableOpacity>
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

      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Impact</Text>
        <View style={[styles.statsCard, { backgroundColor: colors.primaryLight + '08', borderColor: colors.primaryLight }]}>
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

      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
        
        <View style={[styles.settingsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          {clerkUser && (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.white }]}>
                      {clerkUser.firstName?.charAt(0) || clerkUser.emailAddresses[0].emailAddress.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      {clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}` : 'User'}
                    </Text>
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                      {clerkUser.emailAddresses[0].emailAddress}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />
            </>
          )}

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              {isDarkMode ? (
                <Moon size={20} color={colors.primary} strokeWidth={2} />
              ) : (
                <Sun size={20} color={colors.primary} strokeWidth={2} />
              )}
              <View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Switch to {isDarkMode ? 'light' : 'dark'} theme</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.neutralLight, true: colors.primaryLight }}
              thumbColor={colors.white}
            />
          </View>

          <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <LogOut size={20} color={colors.danger} strokeWidth={2} />
              <View>
                <Text style={[styles.settingTitle, { color: colors.danger }]}>Sign Out</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Log out of your account</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: 24,
    marginTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  headerLogo: {
    width: 32,
    height: 32,
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
    marginBottom: 32,
  },
  statsCard: {
    backgroundColor: Colors.primaryLight + '08',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  actionSection: {
    marginBottom: 32,
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  settingDivider: {
    height: 1,
    marginLeft: 48,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
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
