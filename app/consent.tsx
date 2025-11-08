import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { CheckSquare, Square } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function ConsentScreen() {
  const router = useRouter();
  const { isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const [isChecked, setIsChecked] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const userName = clerkUser?.firstName || clerkUser?.username || clerkUser?.emailAddresses?.[0]?.emailAddress || 'User';

  const handleProceed = () => {
    if (isChecked) {
      // Store consent in user profile (you may want to save this to backend)
      // Proceed to values selection (onboarding)
      router.replace('/onboarding');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && styles.webContent]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ohh0oqrvnuowj1apebwt9' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Personalized Code Generation and Vendor Sharing Consent
        </Text>

        <View style={[styles.consentBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Text style={[styles.introText, { color: colors.text }]}>
            By checking the box below and proceeding, you acknowledge and agree to the following:
          </Text>

          <Text style={[styles.bodyText, { color: colors.text }]}>
            I authorize <Text style={styles.bold}>Valu Corp</Text> (the "Company"), operator of the <Text style={styles.bold}>Valu App</Text> application (the "App"), to generate a personalized code for my use in shopping and making payments with participating vendors and companies. This code may be used to identify me and apply discounts or other benefits.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>I understand that:</Text>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                To enable discounts or personalized offers, the Company will share my basic information (such as name, contact details, and relevant beliefs or preferences provided during sign-up) with the vendors where I use the code.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                The Company may also share insights derived from my spending habits and behavior (obtained from my connected bank account or App usage) with these vendors to facilitate tailored offers, or with other third parties for analytical or marketing purposes, in accordance with the Company's{' '}
                <Text
                  style={{ color: colors.primary, textDecorationLine: 'underline' }}
                  onPress={() => router.push('/privacy-policy')}
                >
                  Privacy Policy & Terms of Service
                </Text>.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                This sharing is necessary for the code's functionality and to provide value through vendor partnerships.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                I can stop using the code or request deletion of shared data by contacting the Company, though this may affect ongoing discounts or features.
              </Text>
            </View>
          </View>

          <Text style={[styles.bodyText, { color: colors.text }]}>
            I have read and understand the Company's{' '}
            <Text
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
              onPress={() => router.push('/privacy-policy')}
            >
              Privacy Policy & Terms of Service
            </Text>, and I consent to the generation of the code and the associated data sharing as described above.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkboxContainer, { backgroundColor: colors.backgroundSecondary, borderColor: isChecked ? colors.primary : colors.border }]}
          onPress={() => setIsChecked(!isChecked)}
          activeOpacity={0.7}
        >
          <View style={styles.checkboxRow}>
            {isChecked ? (
              <CheckSquare size={24} color={colors.primary} strokeWidth={2} />
            ) : (
              <Square size={24} color={colors.textSecondary} strokeWidth={2} />
            )}
            <Text style={[styles.checkboxText, { color: colors.text }]}>
              I consent to generating the personalized code and the associated data sharing.
            </Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.metaInfo, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            <Text style={styles.metaLabel}>Date: </Text>
            {currentDate}
          </Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            <Text style={styles.metaLabel}>User: </Text>
            {userName}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.proceedButton,
            { backgroundColor: isChecked ? colors.primary : colors.neutral },
            !isChecked && { opacity: 0.5 },
          ]}
          onPress={handleProceed}
          disabled={!isChecked}
          activeOpacity={0.7}
        >
          <Text style={[styles.proceedButtonText, { color: colors.white }]}>
            Proceed
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  webContent: {
    maxWidth: 768,
    alignSelf: 'center' as const,
    width: '100%',
  },
  logoContainer: {
    width: 200,
    height: 80,
    alignSelf: 'center',
    marginBottom: 24,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },
  consentBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '600' as const,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  bold: {
    fontWeight: '700' as const,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 12,
    marginTop: 8,
  },
  bulletList: {
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  checkboxContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  metaInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  metaText: {
    fontSize: 13,
    marginBottom: 6,
  },
  metaLabel: {
    fontWeight: '600' as const,
  },
  proceedButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
