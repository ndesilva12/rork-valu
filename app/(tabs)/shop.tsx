import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import MenuButton from '@/components/MenuButton';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import ActivitySection from '@/components/ActivitySection';
import BusinessActivitySection from '@/components/BusinessActivitySection';
import { useState, useMemo } from 'react';

type TimeFrame = 'week' | 'month' | 'year';

// Generate mock spending data for a value based on timeframe
const generateValueSpending = (valueName: string, timeframe: TimeFrame): { amount: number; percentage: number } => {
  // Different timeframes have different base amounts
  const baseMultiplier = timeframe === 'week' ? 1 : timeframe === 'month' ? 4.3 : 52;
  const totalSpending = (250 + Math.random() * 150) * baseMultiplier;

  // Different values get different spending percentages
  const basePercentage = 8 + Math.random() * 12; // 8-20% of total
  const amount = (totalSpending * basePercentage) / 100;
  return {
    amount: Math.round(amount * 100) / 100,
    percentage: Math.round(basePercentage * 10) / 10,
  };
};

export default function DataScreen() {
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  // Shared timeframe state for individual accounts
  const [timeframe, setTimeframe] = useState<TimeFrame>('month');

  const isBusiness = profile.accountType === 'business';

  // Get user's values for spending breakdown
  const userCauses = useMemo(() => {
    return (profile.causes || []).sort((a, b) => a.name.localeCompare(b.name));
  }, [profile.causes]);

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

        {/* Values Spending Section - only for individual accounts */}
        {!isBusiness && userCauses.length > 0 && (
          <View style={styles.valuesSection}>
            <Text style={[styles.valuesSectionTitle, { color: colors.text }]}>
              Spending by Value
            </Text>
            <View style={styles.valuesListContainer}>
              {userCauses.map(cause => {
                const spending = generateValueSpending(cause.name, timeframe);
                const isSupport = cause.type === 'support';
                const valueColor = isSupport ? colors.success : colors.danger;
                return (
                  <TouchableOpacity
                    key={cause.id}
                    style={[styles.valueSpendingRow, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => router.push(`/value/${cause.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.valueNameBox, { borderColor: valueColor }]}>
                      <Text style={[styles.valueNameText, { color: valueColor }]} numberOfLines={1}>
                        {cause.name}
                      </Text>
                    </View>
                    <View style={styles.valueSpendingRight}>
                      <Text style={[styles.valueSpendingAmount, { color: colors.text }]}>
                        ${spending.amount.toFixed(0)}
                      </Text>
                      <Text style={[styles.valueSpendingPercent, { color: colors.textSecondary }]}>
                        {spending.percentage}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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
  valuesSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  valuesSectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  valuesListContainer: {
    gap: 12,
  },
  valueSpendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  valueNameBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignSelf: 'flex-start',
  },
  valueNameText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  valueSpendingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  valueSpendingAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    minWidth: 80,
    textAlign: 'right',
  },
  valueSpendingPercent: {
    fontSize: 15,
    fontWeight: '600' as const,
    minWidth: 50,
    textAlign: 'right',
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
