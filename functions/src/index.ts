/**
 * Stand App - Firebase Cloud Functions
 *
 * Handles payment processing with Stripe for business-to-Stand payments
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key || '', {
  apiVersion: '2023-10-16',
});

const db = admin.firestore();

/**
 * Creates a Stripe Payment Intent for business payments
 *
 * Called from the app when a business wants to pay Stand fees + donations
 */
export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  const {
    amount,
    businessId,
    businessName,
    description,
  } = data;

  // Validate inputs
  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Amount must be greater than 0'
    );
  }

  if (!businessId || !businessName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Business information is required'
    );
  }

  // Verify that the business exists in Firestore
  try {
    const businessDoc = await db.collection('users').doc(businessId).get();
    if (!businessDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Business account not found'
      );
    }
  } catch (error) {
    functions.logger.error('Error verifying business:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to verify business account'
    );
  }

  try {
    // Get business email for receipt
    const businessDoc = await db.collection('users').doc(businessId).get();
    const businessData = businessDoc.data();
    const receipt_email = businessData?.email || undefined;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description: description || `Payment from ${businessName}`,
      receipt_email,
      metadata: {
        businessId,
        businessName,
        userId: context.auth?.uid || businessId,
      },
      // Enable payment methods
      automatic_payment_methods: {
        enabled: true,
      },
    });

    functions.logger.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      businessId,
      amount,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    functions.logger.error('Error creating payment intent', {
      error: error.message,
      businessId,
    });

    throw new functions.https.HttpsError(
      'internal',
      'Failed to create payment intent',
      error.message
    );
  }
});

/**
 * Stripe Webhook Handler
 *
 * Handles payment confirmation events from Stripe
 * Records successful payments in Firestore
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || functions.config().stripe?.webhook_secret || '';

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      webhookSecret
    );
  } catch (error: any) {
    functions.logger.error('Webhook signature verification failed', {
      error: error.message,
    });
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }

      default:
        functions.logger.info('Unhandled event type', { type: event.type });
    }

    res.json({ received: true });
  } catch (error: any) {
    functions.logger.error('Error processing webhook', {
      error: error.message,
      eventType: event.type,
    });
    res.status(500).send('Webhook processing failed');
  }
});

/**
 * Handles successful payment confirmation
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const {
    id,
    amount,
    metadata,
  } = paymentIntent;

  const { businessId, businessName, userId } = metadata;

  // Fetch the latest charge to get fee information
  let stripeFee = 0;
  let paymentMethod = 'unknown';

  try {
    if (paymentIntent.latest_charge) {
      const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
      if (charge.balance_transaction) {
        const balanceTransaction = await stripe.balanceTransactions.retrieve(
          charge.balance_transaction as string
        );
        stripeFee = balanceTransaction.fee;
      }
      paymentMethod = charge.payment_method_details?.type || 'unknown';
    }
  } catch (error: any) {
    functions.logger.warn('Could not retrieve charge details', { error: error.message });
  }

  // Record payment in Firestore
  const paymentRef = db.collection('payments').doc(id);

  await paymentRef.set({
    paymentIntentId: id,
    businessId,
    businessName,
    userId,
    amount: amount / 100, // Convert from cents to dollars
    stripeFee: stripeFee / 100,
    netAmount: (amount - stripeFee) / 100,
    status: 'succeeded',
    paymentMethod,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info('Payment recorded successfully', {
    paymentIntentId: id,
    businessId,
    amount: amount / 100,
  });

  // TODO: Update business account balance
  // TODO: Send confirmation email to business
}

/**
 * Handles failed payment
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const {
    id,
    amount,
    metadata,
    last_payment_error,
  } = paymentIntent;

  const { businessId, businessName } = metadata;

  // Record failed payment attempt
  const paymentRef = db.collection('payments').doc(id);

  await paymentRef.set({
    paymentIntentId: id,
    businessId,
    businessName,
    amount: amount / 100,
    status: 'failed',
    errorMessage: last_payment_error?.message || 'Unknown error',
    errorCode: last_payment_error?.code || 'unknown',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    failedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.warn('Payment failed', {
    paymentIntentId: id,
    businessId,
    error: last_payment_error?.message,
  });

  // TODO: Send notification to business about failed payment
}
