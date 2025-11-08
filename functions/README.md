# Stand App - Firebase Cloud Functions

This directory contains Firebase Cloud Functions for handling Stripe payment processing.

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `functions` directory:

```bash
cp .env.example .env
```

Then add your actual Stripe keys:
- `STRIPE_SECRET_KEY`: Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
- `STRIPE_WEBHOOK_SECRET`: Your webhook signing secret (get this after creating the webhook in Stripe Dashboard)

**IMPORTANT**: Never commit your `.env` file! It's already in `.gitignore`.

### 3. Build TypeScript

```bash
npm run build
```

## Deployment

### Deploy to Firebase

```bash
# Make sure you're in the functions directory
cd functions

# Deploy all functions
npm run deploy

# Or deploy a specific function
firebase deploy --only functions:createPaymentIntent
firebase deploy --only functions:stripeWebhook
```

### Set Environment Variables in Firebase

Firebase Functions need environment variables set in the cloud:

```bash
firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY"
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET"
```

## Functions

### `createPaymentIntent`

**Type**: HTTPS Callable Function
**Purpose**: Creates a Stripe Payment Intent when a business wants to pay Stand fees + donations

**Called from**: `components/BusinessPayment.tsx`

**Parameters**:
- `amount`: Total amount to charge (in dollars, will be converted to cents)
- `businessId`: Clerk user ID of the business
- `businessName`: Name of the business
- `description`: Payment description

**Returns**:
- `clientSecret`: Used to initialize Stripe Payment Sheet
- `paymentIntentId`: Stripe payment intent ID

### `stripeWebhook`

**Type**: HTTPS Request Function
**Purpose**: Receives webhook events from Stripe to confirm payment status

**Handles**:
- `payment_intent.succeeded`: Records successful payment in Firestore
- `payment_intent.payment_failed`: Records failed payment attempt

**Webhook URL**: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/stripeWebhook`

## Testing Locally

### Start Emulator

```bash
npm run serve
```

This will:
1. Build TypeScript
2. Start Firebase Functions emulator
3. Make functions available at `http://localhost:5001`

### Test Payment Intent Creation

You can test the function locally using the Firebase shell or by calling it from your app pointed at the emulator.

## Stripe Test Cards

Use these test cards in development:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

Any future expiry date and any 3-digit CVC will work.

## Monitoring

View function logs in Firebase Console or via CLI:

```bash
npm run logs
```

## Security Notes

1. **Never expose secret keys**: Secret keys should ONLY exist in Cloud Functions, never in the app
2. **Verify webhook signatures**: The webhook handler verifies Stripe signatures to prevent tampering
3. **Authenticate callable functions**: The `createPaymentIntent` function requires user authentication
4. **Use test mode**: Always test with Stripe test keys before going live
