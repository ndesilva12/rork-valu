import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import MenuButton from '@/components/MenuButton';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import ActivitySection from '@/components/ActivitySection';
import BusinessActivitySection from '@/components/BusinessActivitySection';
import { useState } from 'react';

type TimeFrame = 'week' | 'month' | 'year';

export default function DataScreen() {
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  // Shared timeframe state for individual accounts
  const [timeframe, setTimeframe] = useState<TimeFrame>('month');

  const isBusiness = profile.accountType === 'business';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.stickyHeaderContainer, { backgroundColor: colors.background, borderBottomColor: 'rgba(0, 0, 0, 0.05)' }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.primary }]}>Data</Text>
          <MenuButton />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
      >
        {/* Show BusinessActivitySection for business accounts, ActivitySection for individuals */}
        {isBusiness ? (
          <BusinessActivitySection />
        ) : (
          <ActivitySection timeframe={timeframe} onTimeframeChange={setTimeframe} />
        )}

        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>How it works</Text>
          {isBusiness ? (
            <>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                The data above shows insights from customers who have used valu codes at your business.
                See which values resonate most with your customer base and track total revenue from
                value-aligned shoppers.
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                The percentages represent how many of your valu code customers share each value. This
                helps you understand your customer demographics and their priorities.
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                We analyze where your money flows when you purchase products - from the company to its
                shareholders and beneficiaries. We then match these entities against your selected values
                to provide alignment scores.
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Connect your bank account to see personalized spending insights and track how your
                purchases align with your values over time.
              </Text>
            </>
          )}
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
  infoSection: {
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
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
