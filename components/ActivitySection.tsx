import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

type TimeFrame = 'week' | 'month' | 'year';

interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  percentAligned: number;
  percentUnaligned: number;
}

interface ValueSpending {
  valueName: string;
  amount: number;
  percentage: number;
}

interface SpendingData {
  aligned: number;
  opposed: number;
  neutral: number;
  totalAmount: number;
  alignedAmount: number;
  opposedAmount: number;
  neutralAmount: number;
  transactions: Transaction[];
  valueSpending: ValueSpending[];
}

// Mock data generator based on timeframe
const generateMockData = (timeframe: TimeFrame, userValues: { name: string; type: string }[]): SpendingData => {
  const baseMultiplier = timeframe === 'week' ? 1 : timeframe === 'month' ? 4.3 : 52;

  // Generate realistic percentages
  const aligned = 45 + Math.random() * 15; // 45-60%
  const opposed = 15 + Math.random() * 10; // 15-25%
  const neutral = 100 - aligned - opposed;

  const totalAmount = (250 + Math.random() * 150) * baseMultiplier;
  const alignedAmount = (totalAmount * aligned) / 100;
  const opposedAmount = (totalAmount * opposed) / 100;
  const neutralAmount = (totalAmount * neutral) / 100;

  // Generate mock transactions
  const merchants = [
    'Whole Foods Market',
    'Patagonia',
    'Local Coffee Shop',
    'Amazon',
    'Target',
    'Trader Joe\'s',
    'Starbucks',
    'Nike',
    'Apple Store',
    'Farmers Market',
    'REI',
    'Fast Fashion Co',
    'Gas Station',
    'Restaurant',
    'Bookstore',
  ];

  const numTransactions = timeframe === 'week' ? 8 : timeframe === 'month' ? 25 : 150;
  const transactions: Transaction[] = [];

  const now = new Date();
  for (let i = 0; i < numTransactions; i++) {
    const daysAgo = timeframe === 'week' ? i : timeframe === 'month' ? i * 1.2 : i * 2.4;
    const transactionDate = new Date(now);
    transactionDate.setDate(transactionDate.getDate() - Math.floor(daysAgo));

    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const amount = 10 + Math.random() * 150;

    // Vary alignment based on merchant
    let percentAligned, percentUnaligned;
    if (merchant.includes('Whole Foods') || merchant.includes('Patagonia') || merchant.includes('Local') || merchant.includes('Farmers')) {
      percentAligned = 70 + Math.random() * 25;
      percentUnaligned = Math.random() * 10;
    } else if (merchant.includes('Fast Fashion') || merchant.includes('Gas')) {
      percentAligned = Math.random() * 15;
      percentUnaligned = 60 + Math.random() * 30;
    } else {
      percentAligned = 20 + Math.random() * 40;
      percentUnaligned = 10 + Math.random() * 30;
    }

    transactions.push({
      id: `txn-${i}`,
      date: transactionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      merchant,
      amount: Math.round(amount * 100) / 100,
      percentAligned: Math.round(percentAligned),
      percentUnaligned: Math.round(percentUnaligned),
    });
  }

  // Generate spending per value
  const supportValues = userValues.filter(v => v.type === 'support');
  const valueSpending: ValueSpending[] = supportValues.map((value) => {
    // Distribute aligned spending across values with some randomness
    const basePercentage = alignedAmount / supportValues.length;
    const variance = basePercentage * (0.3 + Math.random() * 0.4); // 30-70% variance
    const amount = basePercentage + (Math.random() > 0.5 ? variance : -variance);
    const percentage = (amount / totalAmount) * 100;

    return {
      valueName: value.name,
      amount: Math.max(0, Math.round(amount * 100) / 100),
      percentage: Math.max(0, Math.round(percentage * 10) / 10),
    };
  });

  return {
    aligned: Math.round(aligned * 10) / 10,
    opposed: Math.round(opposed * 10) / 10,
    neutral: Math.round(neutral * 10) / 10,
    totalAmount: Math.round(totalAmount * 100) / 100,
    alignedAmount: Math.round(alignedAmount * 100) / 100,
    opposedAmount: Math.round(opposedAmount * 100) / 100,
    neutralAmount: Math.round(neutralAmount * 100) / 100,
    transactions,
    valueSpending,
  };
};

interface ActivitySectionProps {
  timeframe?: TimeFrame;
  onTimeframeChange?: (timeframe: TimeFrame) => void;
}

export default function ActivitySection({ timeframe: externalTimeframe, onTimeframeChange }: ActivitySectionProps = {}) {
  const [internalTimeframe, setInternalTimeframe] = useState<TimeFrame>('month');
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const { isDarkMode, profile } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  // Use external timeframe if provided, otherwise use internal state
  const timeframe = externalTimeframe || internalTimeframe;
  const setTimeframe = (tf: TimeFrame) => {
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    } else {
      setInternalTimeframe(tf);
    }
  };

  // Get user's values
  const userValues = profile.causes || [];

  // Generate data based on timeframe
  const data = generateMockData(timeframe, userValues);

  const timeframes: { value: TimeFrame; label: string }[] = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  return (
    <View style={styles.statsSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity</Text>
      <View style={[styles.statsCard, { backgroundColor: 'transparent', borderColor: colors.primaryLight }]}>
        {/* Spending Title */}
        <Text style={[styles.spendingTitle, { color: colors.text }]}>your spending:</Text>

        {/* Timeline Filter */}
        <View style={styles.timelineContainer}>
          {timeframes.map((tf) => (
            <TouchableOpacity
              key={tf.value}
              style={[
                styles.timelineButton,
                timeframe === tf.value && [styles.timelineButtonActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setTimeframe(tf.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timelineButtonText,
                  { color: colors.textSecondary },
                  timeframe === tf.value && { color: colors.white, fontWeight: '700' },
                ]}
              >
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Percentages above bar */}
        <View style={styles.percentageRow}>
          <View style={[styles.percentageItem, { flex: data.aligned }]}>
            <Text style={[styles.percentageText, { color: colors.primary }]}>
              {data.aligned}%
            </Text>
          </View>
          <View style={[styles.percentageItem, { flex: data.neutral }]}>
            <Text style={[styles.percentageText, { color: colors.textSecondary }]}>
              {data.neutral}%
            </Text>
          </View>
          <View style={[styles.percentageItem, { flex: data.opposed }]}>
            <Text style={[styles.percentageText, { color: colors.textSecondary }]}>
              {data.opposed}%
            </Text>
          </View>
        </View>

        {/* Horizontal Bar */}
        <View style={styles.barContainer}>
          <View
            style={[
              styles.barSegment,
              styles.barAligned,
              { flex: data.aligned, backgroundColor: colors.primary },
            ]}
          />
          <View
            style={[
              styles.barSegment,
              styles.barNeutral,
              { flex: data.neutral, backgroundColor: isDarkMode ? '#1A2332' : '#F5F6F7' },
            ]}
          />
          <View
            style={[
              styles.barSegment,
              styles.barOpposed,
              { flex: data.opposed, backgroundColor: '#6B7280' },
            ]}
          />
        </View>

        {/* Dollar amounts below bar */}
        <View style={styles.amountRow}>
          <View style={[styles.amountItem, { flex: data.aligned }]}>
            <Text style={[styles.amountText, { color: colors.textSecondary }]}>
              ${data.alignedAmount.toFixed(0)}
            </Text>
          </View>
          <View style={[styles.amountItem, { flex: data.neutral }]}>
            <Text style={[styles.amountText, { color: colors.textSecondary }]}>
              ${data.neutralAmount.toFixed(0)}
            </Text>
          </View>
          <View style={[styles.amountItem, { flex: data.opposed }]}>
            <Text style={[styles.amountText, { color: colors.textSecondary }]}>
              ${data.opposedAmount.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Labels */}
        <View style={styles.labelRow}>
          <View style={[styles.labelItem, { flex: data.aligned }]}>
            <Text style={[styles.labelText, { color: colors.textSecondary }]} numberOfLines={1}>
              Aligned
            </Text>
          </View>
          <View style={[styles.labelItem, { flex: data.neutral }]}>
            <Text style={[styles.labelText, { color: colors.textSecondary }]} numberOfLines={1}>
              Neutral
            </Text>
          </View>
          <View style={[styles.labelItem, { flex: data.opposed }]}>
            <Text style={[styles.labelText, { color: colors.textSecondary }]} numberOfLines={1}>
              Unaligned
            </Text>
          </View>
        </View>

        {/* Bank Management Buttons */}
        <View style={styles.bankButtonsContainer}>
          <TouchableOpacity
            style={[styles.bankButton, { backgroundColor: isDarkMode ? '#1F2937' : '#E5E7EB' }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.bankButtonText, { color: colors.textSecondary }]}>
              Disconnect Bank
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bankButton, { backgroundColor: isDarkMode ? '#1F2937' : '#E5E7EB' }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.bankButtonText, { color: colors.textSecondary }]}>
              Add Bank
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Details Toggle */}
        <TouchableOpacity
          style={styles.detailsToggle}
          onPress={() => setDetailsExpanded(!detailsExpanded)}
          activeOpacity={0.7}
        >
          <Text style={[styles.detailsToggleText, { color: colors.primary }]}>
            {detailsExpanded ? 'Hide Details' : 'View Details'}
          </Text>
          <Text style={[styles.detailsToggleIcon, { color: colors.primary }]}>
            {detailsExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>

        {/* Expandable Details */}
        {detailsExpanded && (
          <View style={[styles.detailsContainer, { borderTopColor: colors.border }]}>
            <Text style={[styles.detailsTitle, { color: colors.text }]}>
              Recent Transactions
            </Text>
            {data.transactions.slice(0, 15).map((transaction) => (
              <View key={transaction.id} style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
                <View style={styles.transactionHeader}>
                  <Text style={[styles.merchantName, { color: colors.text }]} numberOfLines={1}>
                    {transaction.merchant}
                  </Text>
                  <Text style={[styles.transactionAmount, { color: colors.text }]}>
                    ${transaction.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.transactionMeta}>
                  <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                    {transaction.date}
                  </Text>
                  <View style={styles.alignmentBadges}>
                    {transaction.percentAligned > 0 && (
                      <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>
                          {transaction.percentAligned}% aligned
                        </Text>
                      </View>
                    )}
                    {transaction.percentUnaligned > 0 && (
                      <View style={[styles.badge, { backgroundColor: '#9CA3AF' + '20' }]}>
                        <Text style={[styles.badgeText, { color: '#9CA3AF' }]}>
                          {transaction.percentUnaligned}% unaligned
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  spendingTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
    textTransform: 'lowercase' as const,
  },
  timelineContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  timelineButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timelineButtonActive: {
    // backgroundColor set dynamically
  },
  timelineButtonText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  percentageRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 2,
  },
  percentageItem: {
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  barContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 12,
    overflow: 'hidden',
    gap: 2,
  },
  barSegment: {
    // flex set dynamically
  },
  barAligned: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  barNeutral: {
    // middle segment
  },
  barOpposed: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  amountRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 4,
    gap: 2,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 2,
  },
  labelItem: {
    alignItems: 'center',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  bankButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  bankButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bankButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  detailsToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  detailsToggleIcon: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  detailsContainer: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 4,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  transactionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
    marginRight: 12,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    fontSize: 12,
  },
  alignmentBadges: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
});
