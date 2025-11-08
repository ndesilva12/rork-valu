/**
 * Customer Profile View
 *
 * Allows businesses to view detailed customer information including:
 * - Basic customer info (email, name)
 * - Customer's values/causes
 * - Transaction history with this business
 * - Statistics (total spent, total saved, etc.)
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, DollarSign, TrendingUp, Receipt } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';

export default function CustomerProfileScreen() {
  const { id: customerId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDarkMode, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const [isLoading, setIsLoading] = useState(true);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalSaved: 0,
    transactionCount: 0,
    avgTransactionValue: 0,
  });

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    if (!customerId || !clerkUser) return;

    try {
      setIsLoading(true);

      // Load customer profile from users collection
      const userDocRef = doc(db, 'users', customerId as string);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        setCustomerProfile(userSnapshot.data());
      }

      // Load transactions for this customer with this business
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('customerId', '==', customerId),
        where('merchantId', '==', clerkUser.id),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const txns: any[] = [];
      let totalSpent = 0;
      let totalSaved = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        txns.push({ id: doc.id, ...data });
        totalSpent += data.purchaseAmount || 0;
        totalSaved += data.discountAmount || 0;
      });

      setTransactions(txns);
      setStats({
        totalSpent,
        totalSaved,
        transactionCount: txns.length,
        avgTransactionValue: txns.length > 0 ? totalSpent / txns.length : 0,
      });
    } catch (error) {
      console.error('[CustomerProfile] Error loading customer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString();
  };

  // Get customer name from transactions if not in profile
  const customerName = customerProfile?.name ||
    (transactions.length > 0 ? transactions[0].customerName : 'Unknown');
  const customerEmail = customerProfile?.email ||
    (transactions.length > 0 ? transactions[0].customerEmail : 'No email');

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Customer Profile',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading customer profile...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Customer Profile',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Customer Header */}
        <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.white }]}>
              {customerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.customerName, { color: colors.text }]}>
            {customerName}
          </Text>
          <Text style={[styles.customerEmail, { color: colors.textSecondary }]}>
            {customerEmail}
          </Text>
          {customerProfile?.location && (
            <Text style={[styles.customerLocation, { color: colors.textSecondary }]}>
              📍 {typeof customerProfile.location === 'string'
                    ? customerProfile.location
                    : customerProfile.location?.city || 'Location unavailable'}
            </Text>
          )}
          {customerProfile?.bio && (
            <Text style={[styles.customerBio, { color: colors.text }]}>
              {customerProfile.bio}
            </Text>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <DollarSign size={24} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatCurrency(stats.totalSpent)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Spent
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <TrendingUp size={24} color={colors.success} strokeWidth={2} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatCurrency(stats.totalSaved)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Saved
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Receipt size={24} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats.transactionCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Transactions
            </Text>
          </View>
        </View>

        {/* Customer Values/Causes */}
        {customerProfile?.causes && customerProfile.causes.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <Heart size={20} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Values & Causes
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              What this customer cares about
            </Text>
            <View style={styles.valuesColumns}>
              {/* Aligned Values Column (Left) */}
              <View style={styles.valuesColumn}>
                <Text style={[styles.columnHeader, { color: colors.success }]}>
                  ✓ Aligned Values
                </Text>
                {customerProfile.causes
                  .filter((cause: any) => cause.type === 'support')
                  .map((cause: any, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.causeChip,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.success,
                        },
                      ]}
                    >
                      <Text style={[styles.causeText, { color: colors.success }]}>
                        {cause.name}
                      </Text>
                      <Text style={[styles.causeCategory, { color: colors.textSecondary }]}>
                        {cause.category || ''}
                      </Text>
                    </View>
                  ))}
                {customerProfile.causes.filter((cause: any) => cause.type === 'support').length === 0 && (
                  <Text style={[styles.emptyColumnText, { color: colors.textSecondary }]}>
                    None
                  </Text>
                )}
              </View>

              {/* Unaligned Values Column (Right) */}
              <View style={styles.valuesColumn}>
                <Text style={[styles.columnHeader, { color: colors.danger }]}>
                  ✗ Unaligned Values
                </Text>
                {customerProfile.causes
                  .filter((cause: any) => cause.type === 'avoid')
                  .map((cause: any, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.causeChip,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.danger,
                        },
                      ]}
                    >
                      <Text style={[styles.causeText, { color: colors.danger }]}>
                        {cause.name}
                      </Text>
                      <Text style={[styles.causeCategory, { color: colors.textSecondary }]}>
                        {cause.category || ''}
                      </Text>
                    </View>
                  ))}
                {customerProfile.causes.filter((cause: any) => cause.type === 'avoid').length === 0 && (
                  <Text style={[styles.emptyColumnText, { color: colors.textSecondary }]}>
                    None
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Transaction History */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.sectionHeader}>
            <Receipt size={20} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Transaction History
            </Text>
          </View>
          {transactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No transactions yet
            </Text>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((txn) => (
                <View
                  key={txn.id}
                  style={[styles.transactionCard, { backgroundColor: colors.background }]}
                >
                  <View style={styles.transactionHeader}>
                    <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                      {formatDate(txn.createdAt)}
                    </Text>
                    <Text style={[styles.transactionAmount, { color: colors.primary }]}>
                      {formatCurrency(txn.purchaseAmount)}
                    </Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionDetail, { color: colors.textSecondary }]}>
                      Discount: {formatCurrency(txn.discountAmount)} ({txn.discountPercent}%)
                    </Text>
                    <Text style={[styles.transactionDetail, { color: colors.textSecondary }]}>
                      Donation: {formatCurrency(txn.donationAmount)} ({txn.donationPercent}%)
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Customer Insights */}
        {stats.transactionCount > 0 && (
          <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Insights
              </Text>
            </View>
            <View style={styles.insightsList}>
              <View style={styles.insightRow}>
                <Text style={[styles.insightBullet, { color: colors.primary }]}>•</Text>
                <Text style={[styles.insightText, { color: colors.text }]}>
                  Average transaction value: <Text style={{ fontWeight: '700' }}>{formatCurrency(stats.avgTransactionValue)}</Text>
                </Text>
              </View>
              <View style={styles.insightRow}>
                <Text style={[styles.insightBullet, { color: colors.primary }]}>•</Text>
                <Text style={[styles.insightText, { color: colors.text }]}>
                  Saved <Text style={{ fontWeight: '700' }}>{((stats.totalSaved / stats.totalSpent) * 100).toFixed(1)}%</Text> on purchases
                </Text>
              </View>
              {customerProfile?.causes && (
                <View style={styles.insightRow}>
                  <Text style={[styles.insightBullet, { color: colors.primary }]}>•</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    Cares about <Text style={{ fontWeight: '700' }}>{customerProfile.causes.length}</Text> causes/values
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: 4,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  customerEmail: {
    fontSize: 16,
  },
  customerLocation: {
    fontSize: 14,
    marginTop: 4,
  },
  customerBio: {
    fontSize: 15,
    marginTop: 12,
    lineHeight: 22,
    textAlign: 'center' as const,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center' as const,
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  valuesColumns: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 12,
  },
  valuesColumn: {
    flex: 1,
  },
  columnHeader: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  emptyColumnText: {
    fontSize: 14,
    fontStyle: 'italic' as const,
    marginTop: 8,
  },
  causesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  causeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: '45%',
  },
  causeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  causeCategory: {
    fontSize: 11,
    textTransform: 'capitalize' as const,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    padding: 16,
    borderRadius: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  transactionDetails: {
    gap: 4,
  },
  transactionDetail: {
    fontSize: 13,
  },
  insightsList: {
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
  emptyText: {
    fontSize: 14,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
});
