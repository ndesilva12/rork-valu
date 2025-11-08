# Stripe Payment Integration Testing Guide

This guide will help you test the complete Stripe payment flow in your Stand app.

## Prerequisites

✅ Firebase Functions deployed (createPaymentIntent & stripeWebhook)
✅ Stripe webhook configured and active
✅ GitHub Secrets set (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
✅ App running on your device/emulator

---

## Test Scenario: Business Pays Stand Fees + Donations

### Setup

1. **Create Test Transaction Data**
   - Sign in as a **customer** account
   - Go to a business that offers Stand discounts
   - Complete a transaction (e.g., $100 purchase with 10% discount)
   - This will create fees and donations owed by the business

2. **Sign Out and Sign In as Business**
   - Sign out from customer account
   - Sign in with the **business account** that accepted the discount

---

## Testing Steps

### 1. Navigate to Money Tab

- Open the app
- Go to the **Money tab** (bottom navigation)
- You should see the **"Payment Due to Stand"** section

**Expected Display:**
```
Payment Due to Stand
├─ Stand Fees (2.5% of sales): $X.XX
├─ Donations Committed: $X.XX
└─ Total Due: $X.XX
```

**✓ Checkpoint**: Verify the amounts are calculated correctly
- Stand Fees = 2.5% of total purchase amounts
- Donations = Sum of all donations from transactions
- Total = Stand Fees + Donations

---

### 2. Initiate Payment

- Click the **"Pay Now"** button
- The button should show "Processing..." briefly

**What Happens:**
1. App calls Firebase Cloud Function `createPaymentIntent`
2. Function creates a Stripe Payment Intent
3. Function returns `clientSecret` to the app
4. App initializes Stripe Payment Sheet

**✓ Checkpoint**: No error alerts appear

---

### 3. Stripe Payment Sheet Opens

You should see the Stripe Payment Sheet modal with:
- Payment amount displayed
- Card input fields
- ACH/Bank account option (if enabled)

**What to Look For:**
- Clean, professional UI
- Correct amount shown
- "Stand App" as merchant name

---

### 4. Enter Test Payment Information

Use **Stripe test cards** for testing:

#### Test Card 1: Successful Payment
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/26)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

#### Test Card 2: Declined Payment
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

#### Test Card 3: Requires Authentication (3D Secure)
```
Card Number: 4000 0025 0000 3155
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Start with Test Card 1** (successful payment)

---

### 5. Complete Payment

- Click **"Pay"** or **"Confirm"** button
- Wait for processing (usually 2-5 seconds)

**What Happens Behind the Scenes:**
1. Stripe processes the payment
2. If successful, Stripe sends webhook to your Cloud Function
3. Cloud Function receives `payment_intent.succeeded` event
4. Function records payment in Firestore `payments` collection
5. Payment details saved with fees, net amount, etc.

---

### 6. Success Confirmation

**Expected:**
- Success alert appears: "Payment completed successfully! Your account will be updated shortly."
- Payment Sheet closes
- You're back on the Money tab

**✓ Checkpoint**: Success alert is shown (not error)

---

### 7. Verify Payment in Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/project/stand-3cd5c/firestore)
2. Navigate to **Firestore Database**
3. Find the **`payments`** collection
4. Look for the newest document (payment intent ID)

**Expected Fields:**
```javascript
{
  paymentIntentId: "pi_xxxxxxxxxxxxx",
  businessId: "user_xxxxx",
  businessName: "Your Business Name",
  userId: "user_xxxxx",
  amount: 25.50,  // In dollars
  stripeFee: 1.04,  // Stripe's fee
  netAmount: 24.46,  // Amount minus Stripe fee
  status: "succeeded",
  paymentMethod: "card",
  createdAt: [Timestamp],
  processedAt: [Timestamp]
}
```

**✓ Checkpoint**: Payment record exists with correct data

---

### 8. Verify Payment in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/payments)
2. Look for the payment (top of the list)
3. Click on it to see details

**Expected:**
- Status: **Succeeded**
- Amount: Correct total
- Description: "Stand fees ($X.XX) + Donations ($X.XX)"
- Metadata contains: `businessId`, `businessName`, `userId`

**✓ Checkpoint**: Payment visible in Stripe with correct metadata

---

### 9. Verify Webhook Delivery

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click on your webhook endpoint
3. Click the **"Events"** tab
4. Find the recent `payment_intent.succeeded` event

**Expected:**
- Event status: **Succeeded** (green checkmark)
- Response code: `200`
- Event delivered successfully

**✓ Checkpoint**: Webhook event shows successful delivery

---

### 10. Check Cloud Function Logs

1. Go to [Firebase Console](https://console.firebase.google.com/project/stand-3cd5c/functions)
2. Click **Functions**
3. Click on **`stripeWebhook`**
4. Click **Logs** tab

**Look For:**
```
Payment recorded successfully
  paymentIntentId: pi_xxxxxxxxxxxxx
  businessId: user_xxxxx
  amount: 25.50
```

**✓ Checkpoint**: No errors in function logs

---

## Test Different Scenarios

### Test 2: Declined Card

Repeat steps 1-6 but use **Test Card 2** (4000 0000 0000 0002)

**Expected:**
- Payment fails
- Error alert: "Your card was declined"
- No payment record in Firestore
- Firestore should have a record with `status: "failed"`

**✓ Checkpoint**: Failed payments are handled gracefully

---

### Test 3: 3D Secure Authentication

Repeat steps 1-6 but use **Test Card 3** (4000 0025 0000 3155)

**Expected:**
- Additional authentication modal appears
- You can complete or fail authentication
- If completed: Payment succeeds
- If failed: Payment fails gracefully

**✓ Checkpoint**: 3D Secure flow works correctly

---

### Test 4: No Amount Owed

1. Clear all fees/donations (or use business with no transactions)
2. Go to Money tab

**Expected:**
- See "All Paid Up!" message
- Green checkmark icon
- "You don't owe any fees or donations at this time"
- No payment button

**✓ Checkpoint**: Zero-balance state displays correctly

---

## Common Issues & Solutions

### Issue 1: "Failed to process payment. Please ensure Cloud Functions are deployed."

**Solution:**
- Check Firebase Functions are deployed (Firebase Console → Functions)
- Verify functions are in `us-central1` region
- Check function logs for errors

### Issue 2: "Missing or insufficient permissions"

**Solution:**
- Verify user is authenticated (signed in)
- Check Firebase security rules allow the operation
- Ensure Cloud Function has proper IAM permissions

### Issue 3: Payment succeeds but no Firestore record

**Solution:**
- Check webhook is configured correctly
- Verify webhook secret is set in GitHub Secrets
- Check webhook logs in Stripe Dashboard
- Look for errors in Cloud Function logs

### Issue 4: "Invalid API key provided"

**Solution:**
- Verify `STRIPE_SECRET_KEY` in GitHub Secrets
- Check it starts with `sk_live_` or `sk_test_`
- Redeploy functions after updating secret

### Issue 5: Amount calculated incorrectly

**Solution:**
- Stand Fees should be 2.5% of **purchase amounts** (not discounts)
- Check transaction records in Firestore
- Verify calculation logic in app/(tabs)/money.tsx

---

## Production Testing Checklist

Before going live with real payments:

- [ ] All test scenarios pass
- [ ] Webhook events deliver successfully
- [ ] Payment records save to Firestore correctly
- [ ] Error handling works for declined cards
- [ ] 3D Secure authentication works
- [ ] Zero-balance state displays correctly
- [ ] Stripe Dashboard shows correct metadata
- [ ] Cloud Function logs show no errors
- [ ] Switch to **live mode** Stripe keys:
  - [ ] Update `STRIPE_SECRET_KEY` to `sk_live_...`
  - [ ] Update `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `pk_live_...`
  - [ ] Create new webhook in Stripe **live mode**
  - [ ] Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
  - [ ] Redeploy functions with live keys

---

## Monitoring in Production

### Daily Checks:
1. Check Firestore `payments` collection for new payments
2. Verify amounts match in Stripe Dashboard
3. Monitor Cloud Function logs for errors
4. Check webhook delivery success rate

### Weekly Checks:
1. Review failed payments and retry if needed
2. Verify Stripe fees match expectations
3. Check for any unusual patterns or errors

---

## Support Resources

- **Firebase Console**: https://console.firebase.google.com/project/stand-3cd5c
- **Stripe Dashboard**: https://dashboard.stripe.com/
- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Firebase Functions Logs**: Firebase Console → Functions → [Function Name] → Logs
- **Stripe Webhook Events**: Stripe Dashboard → Developers → Webhooks → [Endpoint] → Events

---

## Success Criteria

✅ Payment button appears with correct amounts
✅ Stripe Payment Sheet opens successfully
✅ Test payment completes without errors
✅ Success message shown to user
✅ Payment saved to Firestore with all fields
✅ Payment visible in Stripe Dashboard
✅ Webhook delivered successfully (200 response)
✅ No errors in Cloud Function logs
✅ Declined payments handled gracefully
✅ Zero-balance state works correctly

---

🎉 **If all checkpoints pass, your Stripe integration is working perfectly!**
