/**
 * Business Payment Component
 *
 * Allows businesses to pay Stand for:
 * - Stand fees (2.5% of purchase amounts)
 * - Committed donations
 *
 * Uses Stripe Payment Sheet for secure payment processing
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { DollarSign, CreditCard } from 'lucide-react-native';

type Props = {
  amountOwed: number;
  standFees: number;
  donationsOwed: number;
  businessId: string;
  businessName: string;
  colors: any;
};

export default function BusinessPayment({
  amountOwed,
  standFees,
  donationsOwed,
  businessId,
  businessName,
  colors,
}: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = async () => {
    setIsLoading(true);

    try {
      // TODO: This will call a Cloud Function once Firebase Functions are set up
      // For now, show a message that the feature is coming soon
      Alert.alert(
        'Payment Processing Coming Soon',
        `Once Stripe Cloud Functions are deployed, you'll be able to pay:\n\n` +
          `Stand Fees: $${standFees.toFixed(2)}\n` +
          `Donations: $${donationsOwed.toFixed(2)}\n` +
          `Total: $${amountOwed.toFixed(2)}\n\n` +
          `Payment methods will include:\n` +
          `• ACH Direct Debit (0.8% fee)\n` +
          `• Credit/Debit Cards (2.9% + $0.30)\n\n` +
          `See STRIPE_INTEGRATION.md for setup instructions.`,
        [{ text: 'OK' }]
      );

      /*
      // UNCOMMENT THIS ONCE CLOUD FUNCTIONS ARE DEPLOYED:

      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const result = await createPaymentIntent({
        amount: amountOwed,
        businessId,
        businessName,
        description: `Stand fees ($${standFees.toFixed(2)}) + Donations ($${donationsOwed.toFixed(2)})`,
      });

      const { clientSecret } = result.data as { clientSecret: string };

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Stand App',
        returnURL: 'stand://payment-complete',
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        setIsLoading(false);
        return;
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert('Payment Cancelled', presentError.message);
      } else {
        Alert.alert(
          'Success',
          'Payment completed successfully! Your account will be updated shortly.'
        );
      }
      */
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (amountOwed <= 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.noDueContainer}>
          <DollarSign size={48} color={colors.success} strokeWidth={2} />
          <Text style={[styles.noDueTitle, { color: colors.text }]}>All Paid Up!</Text>
          <Text style={[styles.noDueText, { color: colors.textSecondary }]}>
            You don't owe any fees or donations at this time.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.header}>
        <DollarSign size={24} color={colors.primary} strokeWidth={2} />
        <Text style={[styles.title, { color: colors.text }]}>Payment Due to Stand</Text>
      </View>

      {/* Breakdown */}
      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
            Stand Fees (2.5% of sales):
          </Text>
          <Text style={[styles.breakdownValue, { color: colors.text }]}>
            ${standFees.toFixed(2)}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
            Donations Committed:
          </Text>
          <Text style={[styles.breakdownValue, { color: colors.text }]}>
            ${donationsOwed.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total Due:</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            ${amountOwed.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Payment Button */}
      <TouchableOpacity
        onPress={initiatePayment}
        disabled={isLoading}
        style={[
          styles.payButton,
          { backgroundColor: colors.primary },
          isLoading && styles.payButtonDisabled,
        ]}
        activeOpacity={0.7}
      >
        <CreditCard size={20} color={colors.white} strokeWidth={2} />
        <Text style={[styles.payButtonText, { color: colors.white }]}>
          {isLoading ? 'Processing...' : 'Pay Now'}
        </Text>
      </TouchableOpacity>

      {/* Payment Methods Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          Accepted Payment Methods:
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          • ACH Direct Debit (0.8% fee, 3-5 business days)
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          • Credit/Debit Cards (2.9% + $0.30, instant)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  breakdown: {
    marginBottom: 20,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 15,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoContainer: {
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    marginBottom: 4,
  },
  noDueContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noDueTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  noDueText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
