/**
 * Admin Panel - Business Financials & Payments
 *
 * Manage business accounts, track amounts owed, and record payments
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
  Alert,
  Modal,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

// Admin email whitelist
const ADMIN_EMAILS = ['normancdesilva@gmail.com'];

type BusinessAccount = {
  id: string;
  name: string;
  email: string;
  totalRevenue: number;
  totalDiscountGiven: number;
  standFeesOwed: number; // 2.5% of purchase amounts
  totalOwed: number;
  transactionCount: number;
  lastTransaction?: any;
};

export default function AdminFinancials() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [businesses, setBusinesses] = useState<BusinessAccount[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessAccount | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [totalStats, setTotalStats] = useState({
    totalFeesOwed: 0,
    totalOwed: 0,
    businessCount: 0,
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
      loadBusinessFinancials();
    }
  }, [isAdmin]);

  useEffect(() => {
    // Filter businesses based on search query
    if (searchQuery) {
      const filtered = businesses.filter(
        (biz) =>
          biz.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          biz.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBusinesses(filtered);
    } else {
      setFilteredBusinesses(businesses);
    }
  }, [searchQuery, businesses]);

  const loadBusinessFinancials = async () => {
    try {
      setIsLoading(true);

      // Get all transactions
      const transactionsRef = collection(db, 'transactions');
      const q = query(transactionsRef, where('status', '==', 'completed'));
      const querySnapshot = await getDocs(q);

      // Aggregate by merchant
      const businessMap = new Map<string, BusinessAccount>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const merchantId = data.merchantId;

        if (!merchantId) return;

        if (businessMap.has(merchantId)) {
          const biz = businessMap.get(merchantId)!;
          biz.totalDiscountGiven += data.discountAmount || 0;
          biz.transactionCount += 1;
        } else {
          businessMap.set(merchantId, {
            id: merchantId,
            name: data.merchantName || 'Unknown',
            email: '', // Will fetch from user profile
            totalRevenue: 0,
            totalDiscountGiven: data.discountAmount || 0,
            standFeesOwed: 0,
            totalOwed: 0,
            transactionCount: 1,
            lastTransaction: data.createdAt,
          });
        }
      });

      // Calculate fees and totals
      let totalFeesOwed = 0;
      let totalRevenue = 0;

      // First pass: calculate total revenue per business
      const revenueMap = new Map<string, number>();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const merchantId = data.merchantId;
        if (!merchantId) return;

        const currentRevenue = revenueMap.get(merchantId) || 0;
        revenueMap.set(merchantId, currentRevenue + (data.purchaseAmount || 0));
      });

      const businessAccounts = Array.from(businessMap.values()).map((biz) => {
        const revenue = revenueMap.get(biz.id) || 0;
        const standFees = revenue * 0.025; // 2.5% of purchase amounts (not discounts)
        const totalOwed = standFees;

        totalFeesOwed += standFees;
        totalRevenue += revenue;

        return {
          ...biz,
          totalRevenue: revenue,
          standFeesOwed: standFees,
          totalOwed: totalOwed,
        };
      });

      // Sort by amount owed (descending)
      businessAccounts.sort((a, b) => b.totalOwed - a.totalOwed);

      setBusinesses(businessAccounts);
      setFilteredBusinesses(businessAccounts);
      setTotalStats({
        totalFeesOwed,
        totalOwed: totalFeesOwed,
        businessCount: businessAccounts.length,
      });
    } catch (error) {
      console.error('[AdminFinancials] Error loading business financials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openPaymentModal = (business: BusinessAccount) => {
    setSelectedBusiness(business);
    setPaymentAmount(business.totalOwed.toFixed(2));
    setPaymentNotes('');
    setPaymentModalVisible(true);
  };

  const recordPayment = async () => {
    if (!selectedBusiness || !paymentAmount) {
      Alert.alert('Error', 'Please enter a payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    setIsProcessing(true);

    try {
      // Record payment in payments collection
      const paymentId = `payment_${Date.now()}_${selectedBusiness.id}`;
      const paymentRef = doc(db, 'payments', paymentId);

      await setDoc(paymentRef, {
        paymentId,
        businessId: selectedBusiness.id,
        businessName: selectedBusiness.name,
        amount: amount,
        standFees: selectedBusiness.standFeesOwed,
        notes: paymentNotes,
        recordedBy: user?.primaryEmailAddress?.emailAddress,
        status: 'completed',
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', `Payment of $${amount.toFixed(2)} recorded for ${selectedBusiness.name}`);
      setPaymentModalVisible(false);

      // Reload data
      loadBusinessFinancials();
    } catch (error) {
      console.error('[AdminFinancials] Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString();
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
        <Text style={styles.title}>Business Financials</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Businesses</Text>
            <Text style={styles.statValue}>{totalStats.businessCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Upright Fees Owed</Text>
            <Text style={styles.statValue}>{formatCurrency(totalStats.totalFeesOwed)}</Text>
          </View>
          <View style={[styles.statCard, styles.totalCard]}>
            <Text style={styles.statLabel}>Total Owed</Text>
            <Text style={[styles.statValue, styles.totalValue]}>
              {formatCurrency(totalStats.totalOwed)}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by business name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Business List */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007bff" />
          </View>
        ) : (
          <View style={styles.businessList}>
            <Text style={styles.countText}>
              Showing {filteredBusinesses.length} of {businesses.length} businesses
            </Text>
            {filteredBusinesses.map((biz) => (
              <View key={biz.id} style={styles.businessCard}>
                <View style={styles.businessHeader}>
                  <View style={styles.businessInfo}>
                    <Text style={styles.businessName}>{biz.name}</Text>
                    <Text style={styles.businessEmail}>{biz.email || biz.id}</Text>
                  </View>
                  <Text style={styles.totalOwed}>{formatCurrency(biz.totalOwed)}</Text>
                </View>

                <View style={styles.businessDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transactions:</Text>
                    <Text style={styles.detailValue}>{biz.transactionCount}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Revenue:</Text>
                    <Text style={styles.detailValue}>{formatCurrency(biz.totalRevenue)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Discounts Given:</Text>
                    <Text style={styles.detailValue}>{formatCurrency(biz.totalDiscountGiven)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Upright Fees (2.5% of revenue):</Text>
                    <Text style={[styles.detailValue, styles.feeValue]}>
                      {formatCurrency(biz.standFeesOwed)}
                    </Text>
                  </View>

                  {biz.lastTransaction && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Last Transaction:</Text>
                      <Text style={styles.detailValue}>{formatDate(biz.lastTransaction)}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.paymentButton}
                  onPress={() => openPaymentModal(biz)}
                >
                  <Text style={styles.paymentButtonText}>Record Payment</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <Text style={styles.modalSubtitle}>{selectedBusiness?.name}</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Amount Owed:</Text>
              <Text style={styles.modalAmount}>
                {formatCurrency(selectedBusiness?.totalOwed || 0)}
              </Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Payment Amount:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Notes (optional):</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Payment method, check number, etc..."
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPaymentModalVisible(false)}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={recordPayment}
                disabled={isProcessing}
              >
                <Text style={styles.confirmButtonText}>
                  {isProcessing ? 'Processing...' : 'Record Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  totalCard: {
    backgroundColor: '#e8f5e9',
    minWidth: '100%',
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
  totalValue: {
    fontSize: 24,
    color: '#2e7d32',
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
  businessList: {
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
  businessCard: {
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
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessEmail: {
    fontSize: 12,
    color: '#999',
  },
  totalOwed: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  businessDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  feeValue: {
    color: '#007bff',
  },
  donationValue: {
    color: '#ff9800',
  },
  paymentButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4caf50',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
