import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { generateMockValuCodeCustomers, calculateCustomerStats } from '@/mocks/valu-code-customers';

export default function BusinessActivitySection() {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const { isDarkMode, profile } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  // Get business discount percentage (default to 10% if not set)
  const discountPercent = profile.businessInfo?.valuCodeDiscount || 10;

  // Generate mock customers (in real app, this would come from API)
  const customers = useMemo(() => {
    return generateMockValuCodeCustomers(25, discountPercent);
  }, [discountPercent]);

  const stats = useMemo(() => {
    return calculateCustomerStats(customers);
  }, [customers]);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Valu Code Activity</Text>
      <View style={[styles.card, { backgroundColor: 'transparent', borderColor: colors.primaryLight }]}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Customer Insights</Text>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Total Customers */}
          <View style={[styles.metricCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>
              {stats.totalCustomers}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Total Customers
            </Text>
          </View>

          {/* Total Revenue */}
          <View style={[styles.metricCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              ${stats.totalRevenue.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Total Revenue
            </Text>
          </View>

          {/* Total Discounted */}
          <View style={[styles.metricCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.metricValue, { color: colors.danger }]}>
              ${stats.totalDiscounted.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Total Discounted
            </Text>
          </View>

          {/* Average Spending */}
          <View style={[styles.metricCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              ${stats.averageSpending.toFixed(0)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Avg. per Customer
            </Text>
          </View>
        </View>

        {/* Average Customer Profile */}
        <View style={styles.profileSection}>
          <Text style={[styles.profileTitle, { color: colors.text }]}>
            Top Customer Values
          </Text>
          <Text style={[styles.profileSubtitle, { color: colors.textSecondary }]}>
            Values most shared by your valu code customers
          </Text>

          <View style={styles.valuesList}>
            {stats.topValues.slice(0, 5).map((value, index) => (
              <View
                key={value.valueId}
                style={[styles.valueRow, { backgroundColor: colors.backgroundSecondary }]}
              >
                <View style={styles.valueInfo}>
                  <Text style={[styles.valueName, { color: colors.text }]}>
                    {value.valueName}
                  </Text>
                  <View style={styles.valueBar}>
                    <View
                      style={[
                        styles.valueBarFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${value.percentage}%`,
                        }
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.valuePercentage, { color: colors.primary }]}>
                  {value.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* View Details Toggle */}
        <TouchableOpacity
          style={[styles.detailsButton, { borderColor: colors.border }]}
          onPress={() => setDetailsExpanded(!detailsExpanded)}
          activeOpacity={0.7}
        >
          <Text style={[styles.detailsButtonText, { color: colors.primary }]}>
            {detailsExpanded ? 'Hide Customer List' : 'View Customer List'}
          </Text>
        </TouchableOpacity>

        {/* Expandable Customer List */}
        {detailsExpanded && (
          <View style={[styles.customerList, { borderTopColor: colors.border }]}>
            <Text style={[styles.customerListTitle, { color: colors.text }]}>
              Recent Customers ({customers.length})
            </Text>
            <ScrollView style={styles.customerScroll} nestedScrollEnabled>
              {customers.map((customer) => (
                <View
                  key={customer.id}
                  style={[styles.customerItem, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.customerHeader}>
                    <Text style={[styles.customerName, { color: colors.text }]}>
                      {customer.name}
                    </Text>
                    <Text style={[styles.customerAmount, { color: colors.text }]}>
                      ${customer.totalSpent.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.customerMeta}>
                    <Text style={[styles.customerValues, { color: colors.textSecondary }]}>
                      {customer.values.length} values
                    </Text>
                    <Text style={[styles.customerDiscount, { color: colors.danger }]}>
                      Saved ${customer.totalDiscounted.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  // Profile Section
  profileSection: {
    marginBottom: 24,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  valuesList: {
    gap: 10,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  valueInfo: {
    flex: 1,
  },
  valueName: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  valueBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  valueBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  valuePercentage: {
    fontSize: 16,
    fontWeight: '700' as const,
    minWidth: 45,
    textAlign: 'right',
  },
  // Details Button
  detailsButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  // Customer List
  customerList: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginTop: 20,
  },
  customerListTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  customerScroll: {
    maxHeight: 400,
  },
  customerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  customerAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  customerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerValues: {
    fontSize: 12,
  },
  customerDiscount: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
});
