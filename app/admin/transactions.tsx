/**
 * Admin Panel - All Transactions View
 *
 * View and manage all transactions across all businesses
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';

// Admin email whitelist
const ADMIN_EMAILS = ['normancdesilva@gmail.com'];

export default function AdminTransactions() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalDiscounts: 0,
    totalDonations: 0,
    standFees: 0,
  });

  useEffect(() => {
    // Check if user is admin
    if (user?.primaryEmailAddress?.emailAddress) {
      const email = user.primaryEmailAddress.emailAddress;
      setIsAdmin(ADMIN_EMAILS.includes(email));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadTransactions();
    }
  }, [isAdmin]);

  useEffect(() => {
    // Filter transactions based on search query
    if (searchQuery) {
      const filtered = transactions.filter(
        (txn) =>
          txn.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          txn.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          txn.merchantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          txn.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [searchQuery, transactions]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const transactionsRef = collection(db, 'transactions');
      const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(500));
      const querySnapshot = await getDocs(q);

      const txns: any[] = [];
      let totalRevenue = 0;
      let totalDiscounts = 0;
      let totalDonations = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        txns.push({ id: doc.id, ...data });

        totalRevenue += data.purchaseAmount || 0;
        totalDiscounts += data.discountAmount || 0;
        totalDonations += data.donationAmount || 0;
      });

      const standFees = totalRevenue * 0.025; // 2.5% of purchase amounts (not discounts)

      setTransactions(txns);
      setFilteredTransactions(txns);
      setTotalStats({
        totalRevenue,
        totalDiscounts,
        totalDonations,
        standFees,
      });
    } catch (error) {
      console.error('[AdminTransactions] Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleString();
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>
            You don't have permission to access this page.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Transactions</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statValue}>{formatCurrency(totalStats.totalRevenue)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Discounts</Text>
            <Text style={styles.statValue}>{formatCurrency(totalStats.totalDiscounts)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Donations</Text>
            <Text style={styles.statValue}>{formatCurrency(totalStats.totalDonations)}</Text>
          </View>
          <View style={[styles.statCard, styles.standFeeCard]}>
            <Text style={styles.statLabel}>Stand Fees (2.5%)</Text>
            <Text style={[styles.statValue, styles.standFeeValue]}>
              {formatCurrency(totalStats.standFees)}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer, merchant, or transaction ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Transactions List */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        ) : (
          <View style={styles.transactionsList}>
            <Text style={styles.countText}>
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </Text>
            {filteredTransactions.map((txn) => (
              <View key={txn.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionId}>
                    {txn.transactionId?.substring(0, 16)}...
                  </Text>
                  <Text style={styles.transactionDate}>{formatDate(txn.createdAt)}</Text>
                </View>

                <View style={styles.transactionRow}>
                  <Text style={styles.label}>Customer:</Text>
                  <Text style={styles.value}>
                    {txn.customerName} ({txn.customerEmail})
                  </Text>
                </View>

                <View style={styles.transactionRow}>
                  <Text style={styles.label}>Merchant:</Text>
                  <Text style={styles.value}>{txn.merchantName}</Text>
                </View>

                <View style={styles.transactionRow}>
                  <Text style={styles.label}>Purchase Amount:</Text>
                  <Text style={styles.value}>{formatCurrency(txn.purchaseAmount)}</Text>
                </View>

                <View style={styles.transactionRow}>
                  <Text style={styles.label}>Discount ({txn.discountPercent}%):</Text>
                  <Text style={[styles.value, styles.discountValue]}>
                    -{formatCurrency(txn.discountAmount)}
                  </Text>
                </View>

                <View style={styles.transactionRow}>
                  <Text style={styles.label}>Donation ({txn.donationPercent}%):</Text>
                  <Text style={[styles.value, styles.donationValue]}>
                    {formatCurrency(txn.donationAmount)}
                  </Text>
                </View>

                <View style={styles.transactionRow}>
                  <Text style={styles.label}>Stand Fee (2.5% of purchase):</Text>
                  <Text style={[styles.value, styles.feeValue]}>
                    {formatCurrency(txn.purchaseAmount * 0.025)}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{txn.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  standFeeCard: {
    backgroundColor: '#e3f2fd',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  standFeeValue: {
    color: '#007bff',
  },
  searchContainer: {
    padding: 16,
    paddingTop: 0,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  transactionsList: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'monospace',
  },
  transactionDate: {
    fontSize: 11,
    color: '#999',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  discountValue: {
    color: '#4caf50',
  },
  donationValue: {
    color: '#ff9800',
  },
  feeValue: {
    color: '#007bff',
  },
  statusBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
