# Google Sheets API Setup (Service Account Method)

This guide walks you through setting up Google Sheets API access using a service account for secure, programmatic access.

## Why Service Account?

- ✅ Secure - No public access needed
- ✅ Production-ready
- ✅ No API key limits
- ✅ Better for team environments

## Step-by-Step Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `valu-app` (or any name you prefer)
4. Click **Create**
5. Wait for project creation (takes ~30 seconds)

### 2. Enable Google Sheets API

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click on **Google Sheets API**
4. Click **Enable**
5. Wait for API to be enabled

### 3. Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in details:
   - **Service account name**: `valu-sheets-reader`
   - **Service account ID**: Auto-generated (or customize)
   - **Description**: `Service account for reading Valu app data from Google Sheets`
4. Click **Create and Continue**
5. **Grant access** (optional): Skip this step, click **Continue**
6. **Grant users access** (optional): Skip this step, click **Done**

### 4. Create Service Account Key

1. In the **Service Accounts** list, click on the account you just created
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create**
6. A JSON file will download to your computer (e.g., `valu-app-1234567890.json`)

**⚠️ IMPORTANT: Keep this file secure! It contains credentials to access your Google Sheets.**

### 5. Share Your Google Sheet with Service Account

1. Open the downloaded JSON file
2. Find the `client_email` field (looks like: `valu-sheets-reader@valu-app.iam.gserviceaccount.com`)
3. Copy this email address
4. Open your Google Spreadsheet
5. Click **Share** button (top right)
6. Paste the service account email
7. Set permission to **Viewer**
8. Uncheck "Notify people" (it's a service account, not a real person)
9. Click **Share**

### 6. Add Credentials to Your Project

#### Method A: Using JSON File Directly

1. Create a folder in your project: `/home/user/rork-valu/secrets/`
2. Move the downloaded JSON file there: `secrets/google-service-account.json`
3. Add to `.gitignore`:
   ```
   secrets/
   *.json
   ```
4. Add to your `.env`:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_FILE=./secrets/google-service-account.json
   ```

#### Method B: Using Environment Variables (Recommended for Deployment)

1. Open the downloaded JSON file
2. Copy the entire contents
3. Add to your `.env` as a single line:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"valu-app",...}'
   ```

   Or use base64 encoding:
   ```bash
   # On Mac/Linux
   cat google-service-account.json | base64

   # Then in .env:
   GOOGLE_SERVICE_ACCOUNT_BASE64=<paste_base64_here>
   ```

### 7. Add Spreadsheet ID to .env

Get your Spreadsheet ID from the URL:
```
https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit
                                          ^^^^^^^^^^^^^^^^^^
                                          This is your ID
```

Add to `.env`:
```bash
GOOGLE_SPREADSHEET_ID=1A2B3C4D5E6F7G8H9I0J
```

### 8. Complete .env Configuration

Your final `.env` should include:

```bash
# Existing Clerk credentials
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google Sheets Integration
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here

# Choose ONE of these methods:
# Method A: JSON file path
GOOGLE_SERVICE_ACCOUNT_FILE=./secrets/google-service-account.json

# OR Method B: Inline JSON (for deployment)
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Optional: Custom sheet names
SHEET_NAME_CAUSES=Causes
SHEET_NAME_PRODUCTS=Products
SHEET_NAME_LOCAL_BUSINESSES=Local Businesses
```

---

## Testing Your Setup

After completing setup, I'll create a test script that:
1. Connects to your Google Sheet
2. Reads data from each tab
3. Verifies the structure
4. Reports any issues

---

## Security Best Practices

### ✅ DO:
- Store JSON file in `secrets/` folder
- Add `secrets/` to `.gitignore`
- Use environment variables for deployment
- Keep service account permissions to "Viewer" only
- Rotate keys periodically (every 90 days recommended)

### ❌ DON'T:
- Commit JSON file to git
- Share JSON file publicly
- Give service account more permissions than needed
- Use the same service account across multiple projects

---

## Alternative: Public Sheets + API Key (Quick Start)

If you want to test quickly without service accounts:

1. Make your spreadsheet public (anyone with link can view)
2. Get a Google Sheets API key:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the API key
3. Add to `.env`:
   ```bash
   GOOGLE_SHEETS_API_KEY=AIzaSy...
   GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
   ```

**Note**: API keys have rate limits (100 requests per 100 seconds per user)

---

## Troubleshooting

### Error: "The caller does not have permission"
- Make sure you shared the sheet with the service account email
- Check that the email in the JSON matches the email you shared with

### Error: "Unable to parse range"
- Check that your sheet names match exactly (case-sensitive)
- Verify sheet names in `.env` match tabs in your spreadsheet

### Error: "Invalid grant"
- Service account JSON might be corrupted
- Re-download the JSON file and try again

---

## Next Steps

Once you've completed this setup:
1. Let me know which method you chose (service account or API key)
2. Confirm your Spreadsheet ID
3. I'll build the backend integration

Ready to proceed!
