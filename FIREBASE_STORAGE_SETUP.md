# Firebase Storage Setup Instructions

## Problem
Image uploads are failing with `storage/unauthorized` error because Firebase Storage security rules need to be configured.

## Solution
Apply the storage rules in `storage.rules` to your Firebase project.

## Steps to Apply Storage Rules

### Option 1: Using Firebase Console (Recommended)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **stand-3cd5c**
3. Click on **Storage** in the left sidebar
4. Click on the **Rules** tab at the top
5. Copy the contents of `storage.rules` from this repository
6. Paste into the Firebase Console rules editor
7. Click **Publish** to apply the rules

### Option 2: Using Firebase CLI

If you have Firebase CLI installed:

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in this project (if not already done)
firebase init storage

# Deploy storage rules
firebase deploy --only storage
```

## What the Rules Do

The rules in `storage.rules` allow:

✅ **Public read access** to profile and business images (so they display on profiles)
✅ **Uploads up to 5MB** to profile-images/ and business-images/ folders
✅ **Only image files** (jpeg, jpg, png, gif, webp)
❌ **Blocks all other access** to other storage locations

## Security Notes

- These rules are permissive because the app uses Clerk authentication, not Firebase Auth
- The `request.auth` object is not available in Firebase Storage rules when using Clerk
- User IDs are embedded in filenames for traceability: `profile-{userId}-{timestamp}.{ext}`
- For production, consider integrating Clerk with Firebase Custom Auth Tokens for tighter security

## Testing

After applying the rules, test image uploads:

1. **Web**: Go to Settings → Profile → Upload profile image
2. **Mobile**: Open app → Settings → Profile → Upload profile image
3. **Business**: Switch to business account → Upload business logo

The upload should now work without the `storage/unauthorized` error!
