# Stripe Integration Guide for Stand App

## Overview

This guide will help you integrate Stripe for business-to-business (B2B) payments where businesses pay Stand for:
1. **Stand Fees**: 2.5% of all discount transactions
2. **Donations**: Full donation amounts committed during transactions

## Why Stripe?

- ✅ **ACH Transfers**: Lower fees (0.8%, capped at $5) perfect for B2B
- ✅ **Easy Integration**: Well-documented React Native SDK
- ✅ **Payment Methods**: Credit cards, debit cards, ACH, and more
- ✅ **Automated Billing**: Can set up recurring invoices
- ✅ **Dashboard**: Great admin interface to track payments
- ✅ **Webhooks**: Automatic payment confirmation

## Phase 1: Setup Stripe Account

### 1. Create Stripe Account
```bash
# Visit https://dashboard.stripe.com/register
# Sign up with your business email
```

### 2. Get API Keys
```bash
# Navigate to: Dashboard → Developers → API keys
# Copy:
# - Publishable key (starts with pk_test_...)
# - Secret key (starts with sk_test_...)
```

### 3. Install Stripe Dependencies
```bash
cd Stand-App
npm install @stripe/stripe-react-native
npm install stripe  # For backend/Cloud Functions
```

## Phase 2: Environment Setup

### 1. Add Stripe Keys to Environment
Create or update `.env`:
```env
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# App URL
EXPO_PUBLIC_APP_URL=https://standing.vercel.app
```

### 2. Add to .gitignore
Ensure `.env` is in `.gitignore` to keep secrets safe

## Phase 3: Backend Setup (Firebase Cloud Functions)

### 1. Initialize Firebase Functions
```bash
cd Stand-App
firebase init functions
# Select TypeScript
# Install dependencies
```

### 2. Create Payment Intent Function
File: `functions/src/index.ts`
```typescript
import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

// Create payment intent for business payment
export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, businessId, businessName, description } = data;

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        businessId,
        businessName,
        description,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create payment intent');
  }
});

// Webhook to handle payment confirmation
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = functions.config().stripe.webhook_secret;

  try {
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Record payment in Firestore
      const admin = require('firebase-admin');
      const db = admin.firestore();

      await db.collection('payments').doc(paymentIntent.id).set({
        paymentId: paymentIntent.id,
        businessId: paymentIntent.metadata.businessId,
        businessName: paymentIntent.metadata.businessName,
        amount: paymentIntent.amount / 100,
        status: 'completed',
        stripePaymentIntentId: paymentIntent.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
```

### 3. Deploy Functions
```bash
firebase deploy --only functions
```

### 4. Set Stripe Config in Firebase
```bash
firebase functions:config:set stripe.secret_key="sk_test_your_key"
firebase functions:config:set stripe.webhook_secret="whsec_your_webhook_secret"
```

## Phase 4: Frontend Integration

### 1. Setup Stripe Provider
File: `app/_layout.tsx`
```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

export default function RootLayout() {
  return (
    <StripeProvider
      publishableKey={process.env.STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.stand.app" // For Apple Pay
    >
      {/* Your existing layout */}
    </StripeProvider>
  );
}
```

### 2. Create Business Payment Component
File: `components/BusinessPayment.tsx`
```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

type Props = {
  amountOwed: number;
  businessId: string;
  businessName: string;
};

export default function BusinessPayment({ amountOwed, businessId, businessName }: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = async () => {
    setIsLoading(true);

    try {
      // Call Cloud Function to create payment intent
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const result = await createPaymentIntent({
        amount: amountOwed,
        businessId,
        businessName,
        description: 'Stand fees and donations',
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
        Alert.alert('Success', 'Payment completed successfully!');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
        Amount Owed: ${amountOwed.toFixed(2)}
      </Text>
      <TouchableOpacity
        onPress={initiatePayment}
        disabled={isLoading}
        style={{
          backgroundColor: '#4caf50',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
          {isLoading ? 'Processing...' : 'Pay Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Phase 5: Add to Business Money Tab

File: `app/(tabs)/money.tsx` (for business accounts)
```typescript
import BusinessPayment from '@/components/BusinessPayment';

// In your business money tab, add:
{isBusiness && (
  <View style={styles.paymentSection}>
    <Text style={styles.sectionTitle}>Make Payment to Stand</Text>
    <BusinessPayment
      amountOwed={/* Calculate from businessInfo */}
      businessId={clerkUser.id}
      businessName={profile.businessInfo?.name || 'Your Business'}
    />
  </View>
)}
```

## Phase 6: Testing

### 1. Use Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### 2. Test Webhooks Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:5001/stand-3cd5c/us-central1/stripeWebhook
```

## Phase 7: Production Setup

### 1. Switch to Live Keys
- Get live API keys from Stripe Dashboard
- Update Firebase config with live keys
- Update .env with live publishable key

### 2. Setup Webhooks
- Go to Stripe Dashboard → Developers → Webhooks
- Add endpoint: `https://us-central1-stand-3cd5c.cloudfunctions.net/stripeWebhook`
- Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 3. Enable ACH for Lower Fees
- Go to Stripe Dashboard → Settings → Payment Methods
- Enable ACH Direct Debit
- Businesses will see ACH option (0.8% fee vs 2.9% for cards)

## Alternative: Stripe Invoicing

For simpler B2B payments, consider Stripe Invoicing:

```typescript
// Create invoice instead of payment intent
const invoice = await stripe.invoices.create({
  customer: customerId,
  collection_method: 'send_invoice',
  days_until_due: 30,
  metadata: {
    businessId,
    month: '2024-01',
  },
});

// Add line items
await stripe.invoiceItems.create({
  customer: customerId,
  invoice: invoice.id,
  amount: standFees * 100,
  currency: 'usd',
  description: 'Stand Fees (2.5% of discounts)',
});

// Send invoice
await stripe.invoices.sendInvoice(invoice.id);
```

## Cost Comparison

| Method | Fee | Best For |
|--------|-----|----------|
| **ACH** | 0.8% (cap $5) | Large payments, patient businesses |
| **Cards** | 2.9% + $0.30 | Instant payments, convenience |
| **Invoicing** | Same as above | Monthly billing, NET-30 terms |

## Security Checklist

- [ ] Never commit secret keys to git
- [ ] Use environment variables for all keys
- [ ] Validate webhook signatures
- [ ] Implement proper auth checks in Cloud Functions
- [ ] Use HTTPS only
- [ ] Log all payment attempts for auditing
- [ ] Test error handling thoroughly

## Next Steps

1. **Deploy Firebase rules** for payments collection (already done in codebase)
2. **Create Stripe account** and get API keys
3. **Set up Cloud Functions** for payment processing
4. **Test with test cards** in development
5. **Add payment UI** to business money tab
6. **Go live** with production keys

## Support Resources

- Stripe Docs: https://stripe.com/docs
- Stripe React Native: https://github.com/stripe/stripe-react-native
- Firebase Functions: https://firebase.google.com/docs/functions
- Test Cards: https://stripe.com/docs/testing

## Questions?

The current implementation includes:
- ✅ Admin panel to view all transactions
- ✅ Admin panel to track amounts owed by businesses
- ✅ Admin panel to manually record payments
- ⏳ Business-side payment initiation (needs Stripe setup)
- ⏳ Automated payment processing (needs Cloud Functions)
