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
  Modal,
  Alert,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, getDocs, orderBy, limit, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
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

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editedPurchaseAmount, setEditedPurchaseAmount] = useState('');
  const [editedDonationAmount, setEditedDonationAmount] = useState('');
  const [editedDiscountAmount, setEditedDiscountAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  const openEditModal = (transaction: any) => {
    setSelectedTransaction(transaction);
    setEditedPurchaseAmount(transaction.purchaseAmount?.toString() || '0');
    setEditedDonationAmount(transaction.donationAmount?.toString() || '0');
    setEditedDiscountAmount(transaction.discountAmount?.toString() || '0');
    setEditNotes('');
    setEditModalVisible(true);
  };

  const saveTransactionEdit = async () => {
    if (!selectedTransaction || !editNotes.trim()) {
      Alert.alert('Error', 'Please provide a reason for editing this transaction');
      return;
    }

    const newPurchaseAmount = parseFloat(editedPurchaseAmount);
    const newDonationAmount = parseFloat(editedDonationAmount);
    const newDiscountAmount = parseFloat(editedDiscountAmount);

    if (isNaN(newPurchaseAmount) || isNaN(newDonationAmount) || isNaN(newDiscountAmount)) {
      Alert.alert('Error', 'Please enter valid amounts');
      return;
    }

    if (newPurchaseAmount < 0 || newDonationAmount < 0 || newDiscountAmount < 0) {
      Alert.alert('Error', 'Amounts cannot be negative');
      return;
    }

    setIsUpdating(true);

    try {
      const transactionRef = doc(db, 'transactions', selectedTransaction.id);

      // Create edit history entry
      const editHistory = {
        editedAt: serverTimestamp(),
        editedBy: user?.primaryEmailAddress?.emailAddress,
        reason: editNotes,
        originalValues: {
          purchaseAmount: selectedTransaction.purchaseAmount,
          donationAmount: selectedTransaction.donationAmount,
          discountAmount: selectedTransaction.discountAmount,
        },
        newValues: {
          purchaseAmount: newPurchaseAmount,
          donationAmount: newDonationAmount,
          discountAmount: newDiscountAmount,
        },
      };

      // Update transaction with new values and add to edit history
      await updateDoc(transactionRef, {
        purchaseAmount: newPurchaseAmount,
        donationAmount: newDonationAmount,
        discountAmount: newDiscountAmount,
        editHistory: arrayUnion(editHistory),
        lastEditedAt: serverTimestamp(),
        lastEditedBy: user?.primaryEmailAddress?.emailAddress,
      });

      Alert.alert('Success', 'Transaction updated successfully');
      setEditModalVisible(false);

      // Reload transactions
      loadTransactions();
    } catch (error) {
      console.error('[AdminTransactions] Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    } finally {
      setIsUpdating(false);
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

                {txn.editHistory && txn.editHistory.length > 0 && (
                  <View style={styles.editBadge}>
                    <Text style={styles.editBadgeText}>
                      ✏️ Edited {txn.editHistory.length} time{txn.editHistory.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(txn)}
                >
                  <Text style={styles.editButtonText}>Edit Transaction</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Transaction Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Transaction</Text>
            <Text style={styles.modalSubtitle}>
              {selectedTransaction?.transactionId?.substring(0, 16)}...
            </Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Purchase Amount ($):</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                value={editedPurchaseAmount}
                onChangeText={setEditedPurchaseAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Donation Amount ($):</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                value={editedDonationAmount}
                onChangeText={setEditedDonationAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Discount Amount ($):</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                value={editedDiscountAmount}
                onChangeText={setEditedDiscountAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Reason for Edit (Required):</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Explain why this transaction is being edited..."
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {selectedTransaction?.editHistory && selectedTransaction.editHistory.length > 0 && (
              <View style={styles.editHistorySection}>
                <Text style={styles.editHistoryTitle}>Edit History:</Text>
                {selectedTransaction.editHistory.map((edit: any, index: number) => (
                  <View key={index} style={styles.editHistoryItem}>
                    <Text style={styles.editHistoryText}>
                      {edit.editedBy} - {edit.reason}
                    </Text>
                    <Text style={styles.editHistoryDetails}>
                      Purchase: ${edit.originalValues.purchaseAmount} → ${edit.newValues.purchaseAmount}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={isUpdating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveTransactionEdit}
                disabled={isUpdating}
              >
                <Text style={styles.confirmButtonText}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
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
  editBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#ff9800',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  editBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  editButton: {
    marginTop: 12,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
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
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    fontFamily: 'monospace',
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
  editHistorySection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  editHistoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  editHistoryItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  editHistoryText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  editHistoryDetails: {
    fontSize: 11,
    color: '#999',
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
    backgroundColor: '#007bff',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
