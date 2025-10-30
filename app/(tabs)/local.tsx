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
import { useState } from 'react';
import MenuButton from '@/components/MenuButton';
import Colors, { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import ActivitySection from '@/components/ActivitySection';

// Generate mock spending data for a value
const generateValueSpending = (valueName: string, totalSpending: number): { amount: number; percentage: number } => {
  // Different values get different spending amounts with some randomness
  const basePercentage = 8 + Math.random() * 12; // 8-20% of total
  const amount = (totalSpending * basePercentage) / 100;
  return {
    amount: Math.round(amount * 100) / 100,
    percentage: Math.round(basePercentage * 10) / 10,
  };
};

export default function ValuesScreen() {
  const router = useRouter();
  const { profile, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  // Mock total spending (would come from Activity section in real implementation)
  const totalSpending = 1200 + Math.random() * 500;

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
        <ActivitySection />

        {supportCauses.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Supporting</Text>
            <View style={styles.valuesList}>
              {supportCauses.map(cause => {
                const spending = generateValueSpending(cause.name, totalSpending);
                return (
                  <TouchableOpacity
                    key={cause.id}
                    style={[styles.valueRow, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => router.push(`/value/${cause.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.valueNameBox, { borderColor: colors.primary }]}>
                      <Text style={[styles.valueNameText, { color: colors.primary }]} numberOfLines={1}>
                        {cause.name}
                      </Text>
                    </View>
                    <View style={styles.valueSpendingInfo}>
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

        {avoidCauses.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Opposing</Text>
            <View style={styles.valuesList}>
              {avoidCauses.map(cause => {
                const spending = generateValueSpending(cause.name, totalSpending);
                return (
                  <TouchableOpacity
                    key={cause.id}
                    style={[styles.valueRow, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => router.push(`/value/${cause.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.valueNameBox, { borderColor: '#9CA3AF' }]}>
                      <Text style={[styles.valueNameText, { color: '#9CA3AF' }]} numberOfLines={1}>
                        {cause.name}
                      </Text>
                    </View>
                    <View style={styles.valueSpendingInfo}>
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
  valuesList: {
    gap: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  valueNameBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    flex: 1,
  },
  valueNameText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  valueSpendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  valueSpendingAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  valueSpendingPercent: {
    fontSize: 14,
    fontWeight: '600' as const,
    minWidth: 50,
    textAlign: 'right',
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
