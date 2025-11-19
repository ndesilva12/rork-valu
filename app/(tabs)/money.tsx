import { useRouter } from 'expo-router';
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
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import MenuButton from '@/components/MenuButton';
import Colors, { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import ValueCodeSettings from '@/components/ValueCodeSettings';
import BusinessesAcceptingDiscounts from '@/components/BusinessesAcceptingDiscounts';
import BusinessPayment from '@/components/BusinessPayment';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { ChevronDown, ChevronRight, Users, Receipt, TrendingUp, DollarSign, Percent } from 'lucide-react-native';
import { aggregateBusinessTransactions } from '@/services/firebase/userService';

export default function DiscountScreen() {
  const router = useRouter();
  const { profile, isDarkMode, refreshTransactionTotals, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const isBusiness = profile.accountType === 'business';

  // Business financial state
  const [businessFinancials, setBusinessFinancials] = useState({
    totalRevenue: 0,
    standFees: 0,
    totalOwed: 0,
    isLoading: true,
  });

  // Business data state
  const [expandedDataSection, setExpandedDataSection] = useState<'metrics' | 'customers' | 'transactions' | 'discounts' | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [businessMetrics, setBusinessMetrics] = useState({
    totalDiscountGiven: 0,
    transactionCount: 0,
    totalRevenue: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Map<string, any>>(new Map());

  // Load business data
  const loadBusinessData = useCallback(async () => {
    if (!isBusiness || !clerkUser) return;

    setIsLoadingData(true);
    try {
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

      // Also calculate financials
      let totalRevenue = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalRevenue += data.purchaseAmount || 0;
      });

      const standFees = totalRevenue * 0.025;
      const totalOwed = standFees;

      setBusinessFinancials({
        totalRevenue,
        standFees,
        totalOwed,
        isLoading: false,
      });
    } catch (error) {
      console.error('[Money] Error loading business data:', error);
      setBusinessFinancials((prev) => ({ ...prev, isLoading: false }));
    } finally {
      setIsLoadingData(false);
    }
  }, [isBusiness, clerkUser]);

  // Load data when component mounts or comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshTransactionTotals();
      if (isBusiness) {
        loadBusinessData();
      }
    }, [isBusiness])
    // Note: loadBusinessData and refreshTransactionTotals are stable callbacks, don't need in deps
  );

  const toggleDataSection = (section: 'metrics' | 'customers' | 'transactions' | 'discounts') => {
    setExpandedDataSection(expandedDataSection === section ? null : section);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString();
  };

  const customersList = Array.from(customers.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent
  );

  const totalSavings = profile.totalSavings || 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.stickyHeaderContainer, { backgroundColor: colors.background, borderBottomColor: 'rgba(0, 0, 0, 0.05)' }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Image
            source={require('@/assets/images/endorsed.png')}
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
        {isBusiness ? (
          /* Business View */
          <>
            {/* DATA SECTION */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Data</Text>

            {isLoadingData ? (
              <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading business data...
                </Text>
              </View>
            ) : (
              <>
                {/* Customer Metrics Section */}
                <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => toggleDataSection('metrics')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <TrendingUp size={24} color={colors.primary} strokeWidth={2} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Metrics</Text>
                    </View>
                    <View style={styles.sectionHeaderRight}>
                      {expandedDataSection === 'metrics' ? (
                        <ChevronDown size={24} color={colors.text} strokeWidth={2} />
                      ) : (
                        <ChevronRight size={24} color={colors.text} strokeWidth={2} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {expandedDataSection === 'metrics' && (
                    <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
                      <View style={styles.metricsGrid}>
                        <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
                          <DollarSign size={20} color={colors.primary} strokeWidth={2} />
                          <Text style={[styles.metricValue, { color: colors.text }]}>
                            {formatCurrency(businessMetrics.totalRevenue)}
                          </Text>
                          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                            Total Revenue
                          </Text>
                        </View>

                        <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
                          <Percent size={20} color={colors.success} strokeWidth={2} />
                          <Text style={[styles.metricValue, { color: colors.text }]}>
                            {formatCurrency(businessMetrics.totalDiscountGiven)}
                          </Text>
                          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                            Total Discounts
                          </Text>
                        </View>

                        <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
                          <Receipt size={20} color={colors.primary} strokeWidth={2} />
                          <Text style={[styles.metricValue, { color: colors.text }]}>
                            {businessMetrics.transactionCount}
                          </Text>
                          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                            Transactions
                          </Text>
                        </View>

                        <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
                          <Users size={20} color={colors.primary} strokeWidth={2} />
                          <Text style={[styles.metricValue, { color: colors.text }]}>
                            {customers.size}
                          </Text>
                          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                            Customers
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {/* Customers Section */}
                <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => toggleDataSection('customers')}
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
                      {expandedDataSection === 'customers' ? (
                        <ChevronDown size={24} color={colors.text} strokeWidth={2} />
                      ) : (
                        <ChevronRight size={24} color={colors.text} strokeWidth={2} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {expandedDataSection === 'customers' && (
                    <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
                      {customersList.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                          No customers yet
                        </Text>
                      ) : (
                        customersList.map((customer) => (
                          <TouchableOpacity
                            key={customer.id}
                            style={[styles.dataRow, { borderBottomColor: colors.border }]}
                            onPress={() => router.push(`/customer-profile/${customer.id}`)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.dataRowMain}>
                              <Text style={[styles.dataRowTitle, { color: colors.text }]}>
                                {customer.name || customer.email || 'Unknown'}
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
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </View>

                {/* Transactions Section */}
                <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => toggleDataSection('transactions')}
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
                      {expandedDataSection === 'transactions' ? (
                        <ChevronDown size={24} color={colors.text} strokeWidth={2} />
                      ) : (
                        <ChevronRight size={24} color={colors.text} strokeWidth={2} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {expandedDataSection === 'transactions' && (
                    <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
                      {transactions.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                          No transactions yet
                        </Text>
                      ) : (
                        transactions
                          .sort((a, b) => {
                            const aTime = a.createdAt?.toDate?.() || new Date(0);
                            const bTime = b.createdAt?.toDate?.() || new Date(0);
                            return bTime.getTime() - aTime.getTime();
                          })
                          .slice(0, 10)
                          .map((txn) => {
                            const customer = customers.get(txn.customerId);
                            const displayName = customer?.name || txn.customerEmail || 'Unknown';

                            return (
                              <View
                                key={txn.id}
                                style={[styles.dataRow, { borderBottomColor: colors.border }]}
                              >
                                <View style={styles.dataRowMain}>
                                  <Text style={[styles.dataRowTitle, { color: colors.text }]}>
                                    {displayName}
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
                                    Discount: {formatCurrency(txn.discountAmount || 0)}
                                  </Text>
                                </View>
                              </View>
                            );
                          })
                      )}
                      {transactions.length > 10 && (
                        <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                          + {transactions.length - 10} more transactions
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Discounts Section */}
                <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => toggleDataSection('discounts')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <Percent size={24} color={colors.primary} strokeWidth={2} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Discounts</Text>
                    </View>
                    <View style={styles.sectionHeaderRight}>
                      {expandedDataSection === 'discounts' ? (
                        <ChevronDown size={24} color={colors.text} strokeWidth={2} />
                      ) : (
                        <ChevronRight size={24} color={colors.text} strokeWidth={2} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {expandedDataSection === 'discounts' && (
                    <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
                      <View style={styles.discountsBreakdown}>
                        <View style={[styles.discountSummaryCard, { backgroundColor: colors.background }]}>
                          <Text style={[styles.discountSummaryLabel, { color: colors.textSecondary }]}>
                            Total Discounts Given
                          </Text>
                          <Text style={[styles.discountSummaryValue, { color: colors.success }]}>
                            {formatCurrency(businessMetrics.totalDiscountGiven)}
                          </Text>
                        </View>

                        <View style={[styles.discountSummaryCard, { backgroundColor: colors.background }]}>
                          <Text style={[styles.discountSummaryLabel, { color: colors.textSecondary }]}>
                            Average Discount %
                          </Text>
                          <Text style={[styles.discountSummaryValue, { color: colors.primary }]}>
                            {businessMetrics.totalRevenue > 0
                              ? ((businessMetrics.totalDiscountGiven / businessMetrics.totalRevenue) * 100).toFixed(1)
                              : '0.0'}%
                          </Text>
                        </View>
                      </View>

                      {transactions.length > 0 && (
                        <>
                          <Text style={[styles.discountListHeader, { color: colors.text }]}>
                            Recent Discounts
                          </Text>
                          {transactions
                            .filter(txn => txn.discountAmount > 0)
                            .sort((a, b) => {
                              const aTime = a.createdAt?.toDate?.() || new Date(0);
                              const bTime = b.createdAt?.toDate?.() || new Date(0);
                              return bTime.getTime() - aTime.getTime();
                            })
                            .slice(0, 10)
                            .map((txn) => {
                              const customer = customers.get(txn.customerId);
                              const displayName = customer?.name || txn.customerEmail || 'Unknown';

                              return (
                                <View
                                  key={txn.id}
                                  style={[styles.dataRow, { borderBottomColor: colors.border }]}
                                >
                                  <View style={styles.dataRowMain}>
                                    <Text style={[styles.dataRowTitle, { color: colors.text }]}>
                                      {displayName}
                                    </Text>
                                    <Text style={[styles.dataRowValue, { color: colors.success }]}>
                                      -{formatCurrency(txn.discountAmount || 0)}
                                    </Text>
                                  </View>
                                  <View style={styles.dataRowDetails}>
                                    <Text style={[styles.dataRowDetail, { color: colors.textSecondary }]}>
                                      {formatDate(txn.createdAt)}
                                    </Text>
                                    <Text style={[styles.dataRowDetail, { color: colors.textSecondary }]}>
                                      {txn.discountPercent}% off {formatCurrency(txn.purchaseAmount || 0)}
                                    </Text>
                                  </View>
                                </View>
                              );
                            })}
                          {transactions.filter(txn => txn.discountAmount > 0).length === 0 && (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                              No discounts given yet
                            </Text>
                          )}
                        </>
                      )}
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Business Code: Value Code Settings */}
            <ValueCodeSettings />

            {/* Business Payment Section */}
            <BusinessPayment
              amountOwed={businessFinancials.totalOwed}
              standFees={businessFinancials.standFees}
              businessId={clerkUser?.id || ''}
              businessName={profile.businessInfo?.name || 'Your Business'}
              colors={colors}
            />
          </>
        ) : (
          /* Individual View */
          /* Individual Code: Value Code & QR Generator */
          <>
            {/* Promo Code Section */}
            <View style={[styles.promoSection, { borderColor: colors.primary, backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.promoLabel, { color: colors.textSecondary }]}>Your Promo Code</Text>
              <Text style={[styles.promoCode, { color: colors.primary }]}>{profile.promoCode || 'UP00000'}</Text>

              {/* Get Discount Code Button */}
              <TouchableOpacity
                style={[styles.discountButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/customer-discount')}
                activeOpacity={0.8}
              >
                <Text style={styles.discountButtonText}>Generate Code</Text>
                <Text style={styles.discountButtonSubtext}>
                  Show this QR code to participating merchants
                </Text>
              </TouchableOpacity>

              {/* Impact Dashboard Content */}
              <View style={styles.impactDashboardSection}>
                <View style={styles.qrDivider} />

                {/* Savings Counter */}
                <View style={styles.donationAmountContainer}>
                  <Text style={[styles.donationLabel, { color: colors.textSecondary }]}>Total Savings</Text>
                  <Text style={[styles.donationAmount, { color: colors.primary }]}>
                    ${totalSavings.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Businesses Accepting Upright Discounts */}
            <BusinessesAcceptingDiscounts />
          </>
        )}

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 0 : 56,
    paddingBottom: 4,
  },
  headerLogo: {
    width: 161,
    height: 47,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  promoSection: {
    borderWidth: 3,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  promoLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promoCode: {
    fontSize: 36,
    fontWeight: '700' as const,
    marginBottom: 12,
    letterSpacing: 2,
  },
  promoDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  discountButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  discountButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  discountButtonSubtext: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  qrDivider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginBottom: 20,
  },
  impactDashboardSection: {
    marginTop: 20,
  },
  section: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  donationCard: {
    borderRadius: 16,
    padding: 20,
  },
  donationAmountContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  countersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  counterItem: {
    alignItems: 'center',
    flex: 1,
  },
  counterDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 16,
  },
  donationLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center' as const,
  },
  donationAmount: {
    fontSize: 42,
    fontWeight: '700' as const,
  },
  charitiesInfoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  charitiesInfoText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  selectCharitiesButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectCharitiesButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  selectedCharitiesList: {
    gap: 12,
  },
  charityItem: {
    padding: 16,
    borderRadius: 12,
  },
  charityName: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  charityCategory: {
    fontSize: 13,
    opacity: 0.7,
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
  },
  // Data Section Styles
  sectionHeading: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 16,
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
  moreText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
    fontStyle: 'italic' as const,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  // Metrics Grid Styles
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center' as const,
  },
  // Discounts Section Styles
  discountsBreakdown: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  discountSummaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  discountSummaryLabel: {
    fontSize: 12,
    textAlign: 'center' as const,
    fontWeight: '600' as const,
  },
  discountSummaryValue: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  discountListHeader: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
});
