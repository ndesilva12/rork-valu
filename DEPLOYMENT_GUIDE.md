# Firebase Functions Deployment Guide (No Terminal Required!)

This guide walks you through deploying Firebase Functions using GitHub Actions - no terminal or VS Code needed!

## 📋 What You Need

You'll set up 3 GitHub Secrets so the automated deployment can work:
1. `FIREBASE_TOKEN` - Authentication for Firebase deployment
2. `STRIPE_SECRET_KEY` - Your Stripe secret key (you already have this!)
3. `STRIPE_WEBHOOK_SECRET` - Webhook secret from Stripe (get this after first deployment)

---

## Step 1: Get Firebase Service Account Key

### Option A: Using Firebase Console (Recommended - No Terminal!)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **stand-3cd5c**
3. Click the **Settings gear icon** (⚙️) → **Project settings**
4. Go to the **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** - a JSON file will download
7. **IMPORTANT**: Keep this file secure! It has full access to your Firebase project

### Option B: Using Firebase CLI Token (If you have terminal access)

```bash
firebase login:ci
```

This will give you a token. Use this token for the `FIREBASE_TOKEN` secret.

---

## Step 2: Add GitHub Secrets

1. Go to your GitHub repository: https://github.com/ndesilva12/Stand-App
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret** button

Add these 3 secrets:

### Secret 1: FIREBASE_TOKEN

**If using Service Account (Option A from Step 1):**
- Name: `FIREBASE_TOKEN`
- Value: Open the JSON file you downloaded and **copy the entire contents** (all the JSON)
- Click **Add secret**

**If using CLI Token (Option B from Step 1):**
- Name: `FIREBASE_TOKEN`
- Value: Paste the token from `firebase login:ci`
- Click **Add secret**

### Secret 2: STRIPE_SECRET_KEY

- Name: `STRIPE_SECRET_KEY`
- Value: Paste your Stripe secret key (starts with `sk_live_` or `sk_test_`)
  - **You have this key** - it was provided earlier in the setup
  - Get it from [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → API Keys → Secret key
- Click **Add secret**

### Secret 3: STRIPE_WEBHOOK_SECRET (Skip for now, add after Step 4)

- Name: `STRIPE_WEBHOOK_SECRET`
- Value: Leave empty for now - you'll get this after creating the webhook
- Click **Add secret**

---

## Step 3: Trigger Deployment

Now that secrets are configured, deploy your functions:

### Option A: Push to GitHub (Automatic)

The workflow automatically runs when you push code to `main` or any `claude/*` branch. Your functions are already committed, so:

1. Make sure all your code is pushed to GitHub
2. The workflow will run automatically
3. Go to **Actions** tab in GitHub to watch the deployment

### Option B: Manual Trigger

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Click **Deploy Firebase Functions** (left sidebar)
4. Click **Run workflow** dropdown
5. Select your branch
6. Click **Run workflow** button

The deployment will start! You can watch the progress in real-time.

---

## Step 4: Get Your Function URLs

After deployment succeeds:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **stand-3cd5c**
3. Click **Functions** in left sidebar
4. You'll see your deployed functions:
   - `createPaymentIntent` (callable function - no URL needed)
   - `stripeWebhook` (HTTPS function - copy this URL!)

The webhook URL will look like:
```
https://us-central1-stand-3cd5c.cloudfunctions.net/stripeWebhook
```

**Copy this URL** - you'll need it for Step 5!

---

## Step 5: Configure Stripe Webhook

Now tell Stripe where to send payment events:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click **Developers** (top right) → **Webhooks**
3. Click **Add endpoint** button
4. Paste your webhook URL from Step 4:
   ```
   https://us-central1-stand-3cd5c.cloudfunctions.net/stripeWebhook
   ```
5. Under "Events to send", click **Select events**
6. Select these events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
7. Click **Add events** → **Add endpoint**

8. **Important**: After creating the webhook:
   - Click on the webhook you just created
   - Find the **Signing secret** (starts with `whsec_`)
   - Click **Reveal** to see it
   - **Copy this secret**

---

## Step 6: Add Webhook Secret to GitHub

1. Go back to GitHub → Settings → Secrets and variables → Actions
2. Click on **STRIPE_WEBHOOK_SECRET** (or add it if you skipped earlier)
3. Click **Update secret**
4. Paste the webhook secret from Step 5 (starts with `whsec_`)
5. Click **Update secret**

---

## Step 7: Redeploy with Webhook Secret

Now that the webhook secret is configured, redeploy:

1. Go to GitHub → **Actions** tab
2. Click **Deploy Firebase Functions**
3. Click **Run workflow**
4. Select your branch → **Run workflow**

This redeploys the functions with the complete webhook configuration!

---

## ✅ Verification

After deployment completes:

### Test the Payment Flow:

1. Open your Stand app as a business account
2. Go to the **Money** tab
3. You should see the payment section
4. Click **Pay Now**
5. Try a test payment with Stripe test card: `4242 4242 4242 4242`
6. Check Firebase Console → Firestore → `payments` collection
7. You should see the payment record!

### Check Function Logs:

1. Firebase Console → **Functions**
2. Click on a function name
3. Click **Logs** tab
4. You'll see execution logs, errors, etc.

---

## 🔒 Security Notes

✅ Your Stripe secret key is stored securely in GitHub Secrets (encrypted)
✅ It's never exposed in code or logs
✅ The `.env` file is never committed to git
✅ Webhooks verify signatures to prevent tampering

---

## 🆘 Troubleshooting

### "Deployment failed" in GitHub Actions

1. Check the Actions tab for error details
2. Common issues:
   - Wrong Firebase project ID
   - Invalid service account key
   - Missing secrets

### "Function not found" when testing payment

- Wait 1-2 minutes after deployment
- Functions need to "warm up" on first call
- Check Firebase Console → Functions to verify they're deployed

### Webhook not receiving events

- Verify webhook URL is correct
- Check Events tab in Stripe Dashboard
- Make sure you selected the right events
- Verify webhook secret is added to GitHub Secrets

---

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 🎉 You're Done!

Once deployed, your payment processing is fully automated:
1. Business clicks "Pay Now" → Creates payment intent
2. Payment succeeds → Webhook notifies your function
3. Function records payment in Firestore
4. Business sees confirmation!
