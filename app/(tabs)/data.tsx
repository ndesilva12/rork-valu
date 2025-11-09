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
  Dimensions,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { ChevronDown, ChevronRight, Users, Receipt, TrendingDown, Heart, BarChart3, TrendingUp, DollarSign } from 'lucide-react-native';
import MenuButton from '@/components/MenuButton';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { aggregateBusinessTransactions } from '@/services/firebase/userService';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { PieChart, BarChart } from 'react-native-chart-kit';

type CollapsibleSection = 'customers' | 'transactions' | 'discounts' | 'donations' | 'customerMetrics';

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
  const [customerValues, setCustomerValues] = useState<Map<string, number>>(new Map());

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
      const customerIds = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        txns.push({ id: doc.id, ...data });

        // Aggregate customer data
        const customerId = data.customerId;
        customerIds.add(customerId);

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

      // Fetch customer profiles to get their selected causes/values
      const valuesMap = new Map<string, number>();
      const categoriesMap = new Map<string, number>(); // Track cause categories
      const uniqueCustomerIds = Array.from(customerIds);

      console.log('[DataScreen] 🔍 Fetching profiles for', uniqueCustomerIds.length, 'customers');

      for (const customerId of uniqueCustomerIds) {
        try {
          // Use the Clerk user ID as the document ID directly
          const userDocRef = doc(db, 'users', customerId);
          const userSnapshot = await getDoc(userDocRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            const causes = userData.causes || [];

            console.log(`[DataScreen] ✅ Found ${causes.length} causes for customer ${customerId}`);

            // Update customer map with user profile data
            if (customerMap.has(customerId)) {
              const customer = customerMap.get(customerId);
              customer.causes = causes;
              // Update email and name from user document if available
              customer.email = userData.email || customer.email || '';
              customer.name = userData.name || customer.name || 'Unknown';
              customer.location = userData.location || '';
              customer.bio = userData.bio || '';
            }

            // Count each cause and category
            causes.forEach((cause: any) => {
              const causeName = cause.name || cause;
              const causeCategory = cause.category || 'Other';

              // Count individual causes
              const currentCount = valuesMap.get(causeName) || 0;
              valuesMap.set(causeName, currentCount + 1);

              // Count categories
              const categoryCount = categoriesMap.get(causeCategory) || 0;
              categoriesMap.set(causeCategory, categoryCount + 1);
            });
          } else {
            console.log(`[DataScreen] ⚠️ No profile found for customer ${customerId}`);
          }
        } catch (error) {
          console.error(`[DataScreen] ❌ Error fetching profile for customer ${customerId}:`, error);
        }
      }

      setCustomerValues(valuesMap);
      setCustomers(customerMap);

      console.log('[DataScreen] 📊 Customer metrics:', {
        totalValues: valuesMap.size,
        totalCategories: categoriesMap.size,
        topValue: Array.from(valuesMap.entries()).sort((a, b) => b[1] - a[1])[0],
      });
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
              source={require('@/assets/images/upright logo white wide.png')}
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
            source={require('@/assets/images/upright logo white wide.png')}
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
                  <TouchableOpacity
                    key={customer.id}
                    style={[styles.dataRow, { borderBottomColor: colors.border }]}
                    onPress={() => router.push(`/customer-profile/${customer.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dataRowMain}>
                      <View style={styles.customerInfoColumn}>
                        <Text style={[styles.dataRowTitle, { color: colors.text }]}>
                          {customer.email || 'No email'}
                        </Text>
                        <Text style={[styles.customerNameSecondary, { color: colors.textSecondary }]}>
                          {customer.name}
                        </Text>
                      </View>
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

        {/* Customer Metrics Section */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('customerMetrics')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <BarChart3 size={24} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Metrics</Text>
            </View>
            <View style={styles.sectionHeaderRight}>
              <Text style={[styles.sectionMetric, { color: colors.primary }]}>
                {customerValues.size} values
              </Text>
              {expandedSection === 'customerMetrics' ? (
                <ChevronDown size={24} color={colors.text} strokeWidth={2} />
              ) : (
                <ChevronRight size={24} color={colors.text} strokeWidth={2} />
              )}
            </View>
          </TouchableOpacity>

          {expandedSection === 'customerMetrics' && (
            <View style={[styles.sectionContent, { borderTopColor: colors.border }]}>
              {customerValues.size === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No customer data yet. Complete a transaction to see insights!
                </Text>
              ) : (
                <>
                  {/* Key Metrics Cards */}
                  <View style={styles.metricsCardsContainer}>
                    <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
                      <Users size={20} color={colors.primary} strokeWidth={2} />
                      <Text style={[styles.metricCardValue, { color: colors.text }]}>
                        {customers.size}
                      </Text>
                      <Text style={[styles.metricCardLabel, { color: colors.textSecondary }]}>
                        Unique Customers
                      </Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
                      <TrendingUp size={20} color={colors.primary} strokeWidth={2} />
                      <Text style={[styles.metricCardValue, { color: colors.text }]}>
                        {customerValues.size}
                      </Text>
                      <Text style={[styles.metricCardLabel, { color: colors.textSecondary }]}>
                        Unique Values
                      </Text>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
                      <DollarSign size={20} color={colors.primary} strokeWidth={2} />
                      <Text style={[styles.metricCardValue, { color: colors.text }]}>
                        ${(businessMetrics.totalRevenue / customers.size || 0).toFixed(0)}
                      </Text>
                      <Text style={[styles.metricCardLabel, { color: colors.textSecondary }]}>
                        Avg Customer Value
                      </Text>
                    </View>
                  </View>

                  {/* Top Values Pie Chart */}
                  {customerValues.size > 0 && (
                    <View style={styles.chartContainer}>
                      <Text style={[styles.chartTitle, { color: colors.text }]}>
                        Top Customer Values
                      </Text>
                      <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                        Distribution of causes your customers care about
                      </Text>
                      <PieChart
                        data={Array.from(customerValues.entries())
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 8)
                          .map(([name, count], index) => ({
                            name: name.length > 20 ? name.substring(0, 17) + '...' : name,
                            population: count,
                            color: [
                              '#FF6384',
                              '#36A2EB',
                              '#FFCE56',
                              '#4BC0C0',
                              '#9966FF',
                              '#FF9F40',
                              '#FF6384',
                              '#C9CBCF',
                            ][index],
                            legendFontColor: isDarkMode ? '#F9FAFB' : '#111827',
                            legendFontSize: 12,
                          }))}
                        width={Dimensions.get('window').width - 64}
                        height={220}
                        chartConfig={{
                          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                          labelColor: (opacity = 1) => (isDarkMode ? `rgba(249, 250, 251, ${opacity})` : `rgba(17, 24, 39, ${opacity})`),
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                      />
                    </View>
                  )}

                  {/* Detailed Values List */}
                  <View style={styles.valuesListContainer}>
                    <Text style={[styles.chartTitle, { color: colors.text }]}>
                      All Customer Values
                    </Text>
                    <Text style={[styles.chartSubtitle, { color: colors.textSecondary, marginBottom: 12 }]}>
                      Complete breakdown of what matters to your customers
                    </Text>

                    {Array.from(customerValues.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([causeName, count], index) => {
                        const percentage = ((count / customers.size) * 100).toFixed(1);
                        const rank = index + 1;
                        return (
                          <View
                            key={causeName}
                            style={[styles.valueRow, { borderBottomColor: colors.border }]}
                          >
                            <View style={styles.valueRowWithRank}>
                              <View style={[styles.rankBadge, { backgroundColor: rank <= 3 ? colors.primary : colors.backgroundSecondary }]}>
                                <Text style={[styles.rankText, { color: rank <= 3 ? colors.white : colors.text }]}>
                                  #{rank}
                                </Text>
                              </View>
                              <View style={styles.valueRowLeft}>
                                <Text style={[styles.valueName, { color: colors.text }]}>
                                  {causeName}
                                </Text>
                                <View style={styles.valueBar}>
                                  <View
                                    style={[
                                      styles.valueBarFill,
                                      {
                                        backgroundColor: colors.primary,
                                        width: `${percentage}%`
                                      }
                                    ]}
                                  />
                                </View>
                              </View>
                            </View>
                            <View style={styles.valueRowRight}>
                              <Text style={[styles.valuePercentage, { color: colors.primary }]}>
                                {percentage}%
                              </Text>
                              <Text style={[styles.valueCount, { color: colors.textSecondary }]}>
                                {count} {count === 1 ? 'customer' : 'customers'}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                  </View>

                  {/* Insights */}
                  <View style={[styles.insightsContainer, { backgroundColor: colors.background }]}>
                    <Text style={[styles.chartTitle, { color: colors.text, marginBottom: 12 }]}>
                      💡 Key Insights
                    </Text>
                    {Array.from(customerValues.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([name, count], index) => {
                        const percentage = ((count / customers.size) * 100).toFixed(0);
                        return (
                          <View key={name} style={styles.insightRow}>
                            <Text style={[styles.insightBullet, { color: colors.primary }]}>•</Text>
                            <Text style={[styles.insightText, { color: colors.text }]}>
                              <Text style={{ fontWeight: '700' }}>{percentage}%</Text> of your customers care about{' '}
                              <Text style={{ fontWeight: '700' }}>{name}</Text>
                            </Text>
                          </View>
                        );
                      })}
                  </View>
                </>
              )}
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
    paddingTop: Platform.OS === 'web' ? 0 : 56,
    paddingBottom: 4,
  },
  headerLogo: {
    width: 189,
    height: 55.35,
    marginTop: 8,
    alignSelf: 'flex-start',
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
  customerInfoColumn: {
    flex: 1,
    gap: 4,
  },
  dataRowTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  customerNameSecondary: {
    fontSize: 13,
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
  sectionDescription: {
    fontSize: 13,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  valueRowLeft: {
    flex: 1,
  },
  valueName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  valueBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  valueBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  valueRowRight: {
    alignItems: 'flex-end',
  },
  valuePercentage: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  valueCount: {
    fontSize: 12,
  },
  // Customer Metrics Enhancements
  metricsCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricCardValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  metricCardLabel: {
    fontSize: 11,
    textAlign: 'center' as const,
  },
  chartContainer: {
    marginBottom: 24,
    paddingTop: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  valuesListContainer: {
    marginBottom: 24,
  },
  valueRowWithRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  insightsContainer: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  insightBullet: {
    fontSize: 20,
    lineHeight: 20,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
