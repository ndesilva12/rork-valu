/**
 * Business Payment Component
 *
 * Allows businesses to pay Stand for:
 * - Stand fees (2.5% of purchase amounts)
 * - Committed donations
 *
 * Cross-platform: Uses Stripe Payment Element on web, Payment Sheet on mobile
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { DollarSign, CreditCard } from 'lucide-react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/firebase';

// Platform-specific Stripe imports
let useStripe: any;
let useElements: any;
let PaymentElement: any;
let Elements: any;
let loadStripe: any;

if (Platform.OS === 'web') {
  // Web imports
  const webStripe = require('@stripe/react-stripe-js');
  useStripe = webStripe.useStripe;
  useElements = webStripe.useElements;
  PaymentElement = webStripe.PaymentElement;
  Elements = webStripe.Elements;
  const stripeJs = require('@stripe/stripe-js');
  loadStripe = stripeJs.loadStripe;
} else {
  // Mobile imports
  const mobileStripe = require('@stripe/stripe-react-native');
  useStripe = mobileStripe.useStripe;
}

type Props = {
  amountOwed: number;
  standFees: number;
  donationsOwed: number;
  businessId: string;
  businessName: string;
  colors: any;
};

// Web Payment Form Component (needs to be inside Elements with clientSecret)
const WebPaymentForm = Platform.OS === 'web'
  ? function WebPaymentFormComponent({
      colors,
      onComplete
    }: {
      colors: any;
      onComplete: () => void;
    }) {
      const stripe = useStripe();
      const elements = useElements();
      const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-complete',
        },
        redirect: 'if_required',
      });

      if (error) {
        Alert.alert('Payment Failed', error.message || 'Payment could not be processed');
      } else {
        Alert.alert(
          'Success',
          'Payment completed successfully! Your account will be updated shortly.'
        );
        onComplete();
      }
    } catch (error: any) {
      console.error('Web payment error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

      return (
        <View style={styles.paymentFormContainer}>
          <PaymentElement />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading || !stripe || !elements}
            style={[
              styles.payButton,
              { backgroundColor: colors.primary },
              (isLoading || !stripe || !elements) && styles.payButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <CreditCard size={20} color={colors.white} strokeWidth={2} />
            <Text style={[styles.payButtonText, { color: colors.white }]}>
              {isLoading ? 'Processing...' : 'Complete Payment'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  : () => null;

export default function BusinessPayment({
  amountOwed,
  standFees,
  donationsOwed,
  businessId,
  businessName,
  colors,
}: Props) {
  const stripe = Platform.OS === 'web' ? null : useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [stripePromise] = useState(() =>
    Platform.OS === 'web' ? loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '') : null
  );

  const initiatePayment = async () => {
    setIsLoading(true);

    try {
      // Get Firebase Functions instance
      const functions = getFunctions(app);

      // Call the Cloud Function to create a payment intent
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const result = await createPaymentIntent({
        amount: amountOwed,
        businessId,
        businessName,
        description: `Stand fees ($${standFees.toFixed(2)}) + Donations ($${donationsOwed.toFixed(2)})`,
      });

      const { clientSecret: secret } = result.data as { clientSecret: string };
      setClientSecret(secret);

      if (Platform.OS === 'web') {
        // Web: Show payment form inline
        setShowPaymentForm(true);
        setIsLoading(false);
      } else {
        // Mobile: Initialize and present payment sheet
        await handleMobilePayment(secret);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to initialize payment. Please ensure Cloud Functions are deployed.'
      );
      setIsLoading(false);
    }
  };

  const handleMobilePayment = async (secret: string) => {
    if (!stripe || Platform.OS === 'web') return;

    try {
      // Initialize payment sheet
      const { error: initError } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: secret,
        merchantDisplayName: 'Stand App',
        returnURL: 'stand://payment-complete',
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        setIsLoading(false);
        return;
      }

      // Present payment sheet
      const { error: presentError } = await stripe.presentPaymentSheet();

      if (presentError) {
        Alert.alert('Payment Cancelled', presentError.message);
      } else {
        Alert.alert(
          'Success',
          'Payment completed successfully! Your account will be updated shortly.'
        );
      }
    } catch (error: any) {
      console.error('Mobile payment error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setIsLoading(false);
      setClientSecret(null);
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
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

      {/* Web Payment Form */}
      {Platform.OS === 'web' && showPaymentForm && clientSecret && stripePromise ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <WebPaymentForm colors={colors} onComplete={handlePaymentComplete} />
        </Elements>
      ) : (
        <>
          {/* Payment Button (both platforms) */}
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
              {isLoading ? 'Loading...' : 'Pay Now'}
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
            {Platform.OS !== 'web' && (
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • Apple Pay / Google Pay (when available)
              </Text>
            )}
          </View>
        </>
      )}
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
  paymentFormContainer: {
    marginBottom: 16,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 16,
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
