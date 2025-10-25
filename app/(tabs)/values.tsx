import { useRouter } from 'expo-router';
import { Copy, Check } from 'lucide-react-native';
import { useState } from 'react';
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
import * as Clipboard from 'expo-clipboard';
import MenuButton from '@/components/MenuButton';
import Colors, { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (profile.valuCode) {
      await Clipboard.setStringAsync(profile.valuCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (Platform.OS === 'web') {
        Alert.alert('Copied!', 'ValuCode copied to clipboard');
      }
    }
  };

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
        {/* ValuCode Section */}
        <View style={[styles.valuCodeSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.primary }]}>
          <Text style={[styles.valuCodeTitle, { color: colors.text }]}>Your Code</Text>

          {/* ValuCode with Copy Button */}
          <View style={styles.codeContainer}>
            <Text style={[styles.valuCode, { color: colors.primary }]}>{profile.valuCode || 'Loading...'}</Text>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: copied ? colors.success : colors.primary }]}
              onPress={handleCopyCode}
              activeOpacity={0.7}
            >
              {copied ? (
                <Check size={20} color={colors.white} strokeWidth={2.5} />
              ) : (
                <Copy size={20} color={colors.white} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>

          {/* Balance Counter */}
          <View style={styles.balanceContainer}>
            <Text style={[styles.balanceAmount, { color: colors.primary }]}>$0.00</Text>
            <Text style={[styles.balanceSubtext, { color: colors.textSecondary }]}>
              total contributed to your organizations
            </Text>
          </View>

          <Text style={[styles.valuCodeDescription, { color: colors.textSecondary }]}>
            This is your Valu Code. Use this everywhere you spend and we will match $1 for every transaction and contribute it to the charities and organizations you select below.
          </Text>
        </View>

        {/* Organizations Section - Outside ValuCode Box */}
        <View style={styles.organizationsSection}>
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

          {/* Display Selected Organizations - Stacked Vertically Centered */}
          {(profile.selectedOrganizations?.length || 0) > 0 && (
            <View style={styles.selectedOrganizationsContainer}>
              <Text style={[styles.selectedOrganizationsTitle, { color: colors.text }]}>
                Your Selected Organizations ({profile.selectedOrganizations?.length || 0}/3)
              </Text>
              <View style={styles.organizationsStack}>
                {profile.selectedOrganizations?.map((org) => (
                  <View
                    key={org.id}
                    style={[styles.organizationCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.primary }]}
                  >
                    <Text style={[styles.organizationName, { color: colors.primary }]}>{org.name}</Text>
                    {org.description && (
                      <Text style={[styles.organizationDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {org.description}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
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
    paddingBottom: 40,
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
  valuCodeSection: {
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
  },
  valuCodeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  valuCode: {
    fontSize: 36,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  copyButton: {
    padding: 10,
    borderRadius: 8,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  balanceSubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  valuCodeDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  organizationsSection: {
    marginBottom: 24,
  },
  selectOrganizationsButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  selectOrganizationsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  selectedOrganizationsContainer: {
    alignItems: 'center',
  },
  selectedOrganizationsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 16,
    textAlign: 'center',
  },
  organizationsStack: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  organizationCard: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginBottom: 4,
  },
  organizationDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
