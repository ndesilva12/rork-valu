import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { generateMockValueCodeCustomers, calculateCustomerStats } from '@/mocks/value-code-customers';

interface Purchase {
  id: string;
  date: string;
  amount: number;
  discount: number;
  items: string[];
}

export default function BusinessActivitySection() {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [valuesExpanded, setValuesExpanded] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerValuesExpanded, setCustomerValuesExpanded] = useState(false);
  const { isDarkMode, profile } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  // Get business discount percentage (default to 10% if not set)
  const discountPercent = profile.businessInfo?.valueCodeDiscount || 10;

  // Generate mock customers (in real app, this would come from API)
  const customers = useMemo(() => {
    return generateMockValueCodeCustomers(25, discountPercent);
  }, [discountPercent]);

  const stats = useMemo(() => {
    return calculateCustomerStats(customers);
  }, [customers]);

  // Generate mock purchases for a customer
  const generateCustomerPurchases = (customer: any): Purchase[] => {
    const purchases: Purchase[] = [];
    const numPurchases = Math.floor(Math.random() * 8) + 3; // 3-10 purchases

    for (let i = 0; i < numPurchases; i++) {
      const amount = Math.random() * 150 + 20; // $20-$170
      const discount = amount * (discountPercent / 200); // Half of discount percent goes to customer
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Last 90 days

      purchases.push({
        id: `purchase-${i}`,
        date: date.toLocaleDateString(),
        amount,
        discount,
        items: [`Item ${i + 1}`, `Product ${Math.floor(Math.random() * 100)}`]
      });
    }

    return purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerValuesExpanded(false); // Reset expansion state
    setCustomerModalVisible(true);
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Value Code Activity</Text>
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
          <View style={styles.profileHeader}>
            <View style={styles.profileHeaderText}>
              <Text style={[styles.profileTitle, { color: colors.text }]}>
                Top Customer Values
              </Text>
              <Text style={[styles.profileSubtitle, { color: colors.textSecondary }]}>
                Values most shared by your value code customers
              </Text>
            </View>
            {stats.topValues.length > 5 && (
              <TouchableOpacity onPress={() => setValuesExpanded(!valuesExpanded)} activeOpacity={0.7}>
                <Text style={[styles.showAllButton, { color: colors.primary }]}>
                  {valuesExpanded ? 'Hide All' : 'Show All Values'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.valuesList}>
            {stats.topValues.slice(0, valuesExpanded ? undefined : 5).map((value, index) => (
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
            <View style={styles.customerScroll}>
              {customers.map((customer) => (
                <TouchableOpacity
                  key={customer.id}
                  style={[styles.customerItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleViewCustomer(customer)}
                  activeOpacity={0.7}
                >
                  <View style={styles.customerHeader}>
                    <Text style={[styles.customerName, { color: colors.primary }]}>
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
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </View>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Modal
          visible={customerModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCustomerModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Customer Details
                </Text>
                <TouchableOpacity
                  onPress={() => setCustomerModalVisible(false)}
                  style={styles.modalClose}
                  activeOpacity={0.7}
                >
                  <X size={24} color={colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Customer Info Section */}
                <View style={styles.modalSection}>
                  <Text style={[styles.customerDetailName, { color: colors.text }]}>
                    {selectedCustomer.name}
                  </Text>

                  <View style={styles.customerDetailStats}>
                    <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.statValue, { color: colors.primary }]}>
                        ${selectedCustomer.totalSpent.toFixed(2)}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Total Spent
                      </Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.statValue, { color: colors.danger }]}>
                        ${selectedCustomer.totalDiscounted.toFixed(2)}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Total Saved
                      </Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {selectedCustomer.values.length}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Values
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Customer Values Section */}
                <View style={styles.modalSection}>
                  <View style={styles.modalSectionHeader}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>
                      Customer Values
                    </Text>
                    {selectedCustomer.values.length > 8 && (
                      <TouchableOpacity onPress={() => setCustomerValuesExpanded(!customerValuesExpanded)} activeOpacity={0.7}>
                        <Text style={[styles.expandButtonText, { color: colors.primary }]}>
                          {customerValuesExpanded ? 'Hide' : 'Show All'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.valueChips}>
                    {selectedCustomer.values.slice(0, customerValuesExpanded ? undefined : 8).map((value: any) => (
                      <View
                        key={value.id}
                        style={[styles.valueChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                      >
                        <Text style={[styles.valueChipText, { color: colors.primary }]}>
                          {value.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Purchase History Section */}
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>
                    Purchase History
                  </Text>
                  {generateCustomerPurchases(selectedCustomer).map((purchase) => (
                    <View
                      key={purchase.id}
                      style={[styles.purchaseItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                    >
                      <View style={styles.purchaseHeader}>
                        <Text style={[styles.purchaseDate, { color: colors.textSecondary }]}>
                          {purchase.date}
                        </Text>
                        <Text style={[styles.purchaseAmount, { color: colors.text }]}>
                          ${purchase.amount.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.purchaseDetails}>
                        <Text style={[styles.purchaseItems, { color: colors.textSecondary }]}>
                          {purchase.items.join(', ')}
                        </Text>
                        <Text style={[styles.purchaseDiscount, { color: colors.primary }]}>
                          Value Code: -${purchase.discount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 13,
  },
  showAllButton: {
    fontSize: 14,
    fontWeight: '600' as const,
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
    // Container for customer list items
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
  // Customer Detail Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalClose: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerDetailName: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  customerDetailStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  valueChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  valueChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  valueChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  purchaseItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  purchaseDate: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  purchaseAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  purchaseDetails: {
    gap: 4,
  },
  purchaseItems: {
    fontSize: 13,
    marginBottom: 4,
  },
  purchaseDiscount: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
