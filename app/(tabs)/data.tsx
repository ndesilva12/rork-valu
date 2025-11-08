import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronDown, ChevronRight, Users, Receipt, TrendingDown, Heart } from 'lucide-react-native';
import MenuButton from '@/components/MenuButton';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { aggregateBusinessTransactions } from '@/services/firebase/userService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

type CollapsibleSection = 'customers' | 'transactions' | 'discounts' | 'donations';

export default function DataScreen() {
  const { profile, isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const [expandedSection, setExpandedSection] = useState<CollapsibleSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [businessMetrics, setBusinessMetrics] = useState({
    totalDonated: 0,
    totalDiscountGiven: 0,
    transactionCount: 0,
    totalRevenue: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Map<string, any>>(new Map());

  // Load business data - refreshes when screen comes into focus
  const loadBusinessData = useCallback(async () => {
    if (!clerkUser) return;

    try {
      setIsLoading(true);

      // Get aggregated metrics
      const metrics = await aggregateBusinessTransactions(clerkUser.id);
      setBusinessMetrics(metrics);

      // Get all transactions
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('merchantId', '==', clerkUser.id),
        where('status', '==', 'completed')
      );
      const querySnapshot = await getDocs(q);

      const txns: any[] = [];
      const customerMap = new Map<string, any>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        txns.push({ id: doc.id, ...data });

        // Aggregate customer data
        const customerId = data.customerId;
        if (customerMap.has(customerId)) {
          const customer = customerMap.get(customerId);
          customer.transactionCount += 1;
          customer.totalSpent += data.purchaseAmount || 0;
          customer.totalSaved += data.discountAmount || 0;
        } else {
          customerMap.set(customerId, {
            id: customerId,
            name: data.customerName || 'Unknown',
            email: data.customerEmail || '',
            transactionCount: 1,
            totalSpent: data.purchaseAmount || 0,
            totalSaved: data.discountAmount || 0,
            lastTransaction: data.createdAt,
          });
        }
      });

      setTransactions(txns);
      setCustomers(customerMap);
      console.log('[DataScreen] ✅ Business data loaded:', {
        transactions: txns.length,
        customers: customerMap.size,
        metrics
      });
    } catch (error) {
      console.error('[DataScreen] ❌ Error loading business data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBusinessData();
    }, [loadBusinessData])
  );

  const toggleSection = (section: CollapsibleSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString();
  };

  const customersList = Array.from(customers.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent
  );

  const avgTransactionValue =
    businessMetrics.transactionCount > 0
      ? businessMetrics.totalRevenue / businessMetrics.transactionCount
      : 0;
  const avgDiscountPerTransaction =
    businessMetrics.transactionCount > 0
      ? businessMetrics.totalDiscountGiven / businessMetrics.transactionCount
      : 0;
  const avgDonationPerTransaction =
    businessMetrics.transactionCount > 0
      ? businessMetrics.totalDonated / businessMetrics.transactionCount
      : 0;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View style={[styles.stickyHeaderContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <Image
              source={isDarkMode ? require('@/assets/images/stand logo white.png') : require('@/assets/images/stand logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <MenuButton />
          </View>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading business data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.stickyHeaderContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Image
            source={isDarkMode ? require('@/assets/images/stand logo white.png') : require('@/assets/images/stand logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <MenuButton />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Customers Section */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('customers')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Users size={24} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Customers</Text>
            </View>
            <View style={styles.sectionHeaderRight}>
              <Text style={[styles.sectionMetric, { color: colors.primary }]}>
                {customers.size}
              </Text>
              {expandedSection === 'customers' ? (
                <ChevronDown size={24} color={colors.text} strokeWidth={2} />
              ) : (
                <ChevronRight size={24} color={colors.text} strokeWidth={2} />
              )}
            </View>
          </TouchableOpacity>

          {expandedSection === 'customers' && (
            <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
              {customersList.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No customers yet
                </Text>
              ) : (
                customersList.map((customer) => (
                  <View
                    key={customer.id}
                    style={[styles.dataRow, { borderBottomColor: colors.border }]}
                  >
                    <View style={styles.dataRowMain}>
                      <Text style={[styles.dataRowTitle, { color: colors.text }]}>
                        {customer.name}
                      </Text>
                      <Text style={[styles.dataRowValue, { color: colors.primary }]}>
                        {formatCurrency(customer.totalSpent)}
                      </Text>
                    </View>
                    <View style={styles.dataRowDetails}>
                      <Text style={[styles.dataRowDetail, { color: colors.textSecondary }]}>
                        {customer.transactionCount} transaction{customer.transactionCount !== 1 ? 's' : ''}
                      </Text>
                      <Text style={[styles.dataRowDetail, { color: colors.textSecondary }]}>
                        Saved: {formatCurrency(customer.totalSaved)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Transactions Section */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('transactions')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Receipt size={24} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Transactions</Text>
            </View>
            <View style={styles.sectionHeaderRight}>
              <Text style={[styles.sectionMetric, { color: colors.primary }]}>
                {businessMetrics.transactionCount}
              </Text>
              {expandedSection === 'transactions' ? (
                <ChevronDown size={24} color={colors.text} strokeWidth={2} />
              ) : (
                <ChevronRight size={24} color={colors.text} strokeWidth={2} />
              )}
            </View>
          </TouchableOpacity>

          {expandedSection === 'transactions' && (
            <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Total Revenue
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(businessMetrics.totalRevenue)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Average Transaction
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(avgTransactionValue)}
                </Text>
              </View>

              {transactions.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No transactions yet
                </Text>
              ) : (
                <View style={styles.transactionsList}>
                  {transactions
                    .sort((a, b) => {
                      const aTime = a.createdAt?.toDate?.() || new Date(0);
                      const bTime = b.createdAt?.toDate?.() || new Date(0);
                      return bTime.getTime() - aTime.getTime();
                    })
                    .slice(0, 10)
                    .map((txn) => (
                      <View
                        key={txn.id}
                        style={[styles.dataRow, { borderBottomColor: colors.border }]}
                      >
                        <View style={styles.dataRowMain}>
                          <Text style={[styles.dataRowTitle, { color: colors.text }]}>
                            {txn.customerName || 'Unknown'}
                          </Text>
                          <Text style={[styles.dataRowValue, { color: colors.primary }]}>
                            {formatCurrency(txn.purchaseAmount || 0)}
                          </Text>
                        </View>
                        <View style={styles.dataRowDetails}>
                          <Text style={[styles.dataRowDetail, { color: colors.textSecondary }]}>
                            {formatDate(txn.createdAt)}
                          </Text>
                          <Text style={[styles.dataRowDetail, { color: colors.textSecondary }]}>
                            Discount: {formatCurrency(txn.discountAmount || 0)} | Donation: {formatCurrency(txn.donationAmount || 0)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  {transactions.length > 10 && (
                    <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                      + {transactions.length - 10} more transactions
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Discount Metrics Section */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('discounts')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <TrendingDown size={24} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Discounts</Text>
            </View>
            <View style={styles.sectionHeaderRight}>
              <Text style={[styles.sectionMetric, { color: colors.primary }]}>
                {formatCurrency(businessMetrics.totalDiscountGiven)}
              </Text>
              {expandedSection === 'discounts' ? (
                <ChevronDown size={24} color={colors.text} strokeWidth={2} />
              ) : (
                <ChevronRight size={24} color={colors.text} strokeWidth={2} />
              )}
            </View>
          </TouchableOpacity>

          {expandedSection === 'discounts' && (
            <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Total Discounts Given
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(businessMetrics.totalDiscountGiven)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Average per Transaction
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(avgDiscountPerTransaction)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Current Discount %
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {profile.businessInfo?.customerDiscountPercent || 0}%
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Discount Rate
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {businessMetrics.totalRevenue > 0
                    ? ((businessMetrics.totalDiscountGiven / businessMetrics.totalRevenue) * 100).toFixed(1)
                    : '0'}
                  %
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Donation Metrics Section */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('donations')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Heart size={24} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Donations</Text>
            </View>
            <View style={styles.sectionHeaderRight}>
              <Text style={[styles.sectionMetric, { color: colors.primary }]}>
                {formatCurrency(businessMetrics.totalDonated)}
              </Text>
              {expandedSection === 'donations' ? (
                <ChevronDown size={24} color={colors.text} strokeWidth={2} />
              ) : (
                <ChevronRight size={24} color={colors.text} strokeWidth={2} />
              )}
            </View>
          </TouchableOpacity>

          {expandedSection === 'donations' && (
            <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Total Donated
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(businessMetrics.totalDonated)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Average per Transaction
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(avgDonationPerTransaction)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Current Donation %
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {profile.businessInfo?.donationPercent || 0}%
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Donation Rate
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {businessMetrics.totalRevenue > 0
                    ? ((businessMetrics.totalDonated / businessMetrics.totalRevenue) * 100).toFixed(1)
                    : '0'}
                  %
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Tax Benefit (Est.)
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(businessMetrics.totalDonated * 0.21)}
                </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
  },
  headerLogo: {
    width: 140,
    height: 41,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  sectionMetric: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  sectionContent: {
    borderTopWidth: 1,
    padding: 20,
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  dataRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dataRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dataRowTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
  dataRowValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  dataRowDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dataRowDetail: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  transactionsList: {
    marginTop: 8,
  },
  moreText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
    fontStyle: 'italic' as const,
  },
});
