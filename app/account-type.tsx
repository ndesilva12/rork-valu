import { useRouter } from 'expo-router';
import { User, Building2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { AccountType } from '@/types';

export default function AccountTypeScreen() {
  const router = useRouter();
  const { isDarkMode, setAccountType } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const [selectedType, setSelectedType] = useState<AccountType>('individual');

  const handleContinue = async () => {
    await setAccountType(selectedType);

    if (selectedType === 'business') {
      // Navigate to business info setup
      router.push('/business-setup');
    } else {
      // Navigate directly to value selection
      router.push('/onboarding');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ohh0oqrvnuowj1apebwt9' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Choose Account Type
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select how you'll be using Valu
          </Text>
        </View>

        {/* Account Type Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: selectedType === 'individual' ? colors.primary : colors.border,
                borderWidth: selectedType === 'individual' ? 2 : 1,
              }
            ]}
            onPress={() => setSelectedType('individual')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <User size={32} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              Individual
            </Text>
            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
              Shop with your values and track spending alignment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: selectedType === 'business' ? colors.primary : colors.border,
                borderWidth: selectedType === 'business' ? 2 : 1,
              }
            ]}
            onPress={() => setSelectedType('business')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Building2 size={32} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              Business
            </Text>
            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
              Create your brand profile and connect with value-aligned customers
            </Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueButtonText, { color: colors.white }]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 180,
    height: 52,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
    flex: 1,
  },
  optionCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
