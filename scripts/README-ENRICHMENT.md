# Business Data Enrichment Tool

This tool takes a list of business names and uses Google Places API to automatically fetch complete information including addresses, phone numbers, websites, and geolocation data.

## 📋 What You Have

- **Input File**: `wellesley-businesses-raw.json` - 230+ businesses from Wellesley, MA
- **Enrichment Script**: `enrich-businesses.js` - Fetches complete data from Google Places API
- **Output**: `wellesley-businesses-enriched.csv` - Ready for Firebase import

## 🔑 Step 1: Get a Google Places API Key

### Create Google Cloud Project (5 minutes)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create a new project** (or select existing):
   - Click "Select a project" at top
   - Click "NEW PROJECT"
   - Name it: "Stand App Business Import"
   - Click "CREATE"

3. **Enable Places API**:
   - In the search bar, type "Places API"
   - Click "Places API"
   - Click "ENABLE"

4. **Create API Key**:
   - Go to "Credentials" (left sidebar)
   - Click "CREATE CREDENTIALS" → "API key"
   - Copy the API key (you'll need this!)
   - *Optional*: Click "RESTRICT KEY" to limit usage to Places API only

5. **Enable Billing** (Required but has free tier):
   - Google gives $200/month free credit
   - Each place search costs ~$0.017
   - 230 businesses = ~$4
   - You won't be charged if under $200/month

### 💰 Cost Breakdown
- **Text Search**: $0.032 per request
- **Place Details**: $0.017 per request
- **230 businesses** = 230 searches + 230 details = **~$11**
- **Your free credit**: $200/month
- **Actual cost to you**: $0

## 🚀 Step 2: Run the Enrichment Script

### Test with 5 businesses first (Recommended)

```bash
# Navigate to scripts directory
cd /home/user/Stand-App/scripts

# Set your API key (replace with your actual key)
export GOOGLE_PLACES_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Run test with first 5 businesses
node enrich-businesses-test.js

# Check the output
cat wellesley-businesses-enriched-test.csv
```

### Run full enrichment (230 businesses)

```bash
# Make sure API key is set
export GOOGLE_PLACES_API_KEY="your-key-here"

# Run full enrichment (takes ~2-3 minutes)
node enrich-businesses.js

# Check results
cat wellesley-businesses-enriched.csv
```

## 📊 Step 3: Review the Output

The enriched CSV will have these columns:
- `businessName` - Official name from Google
- `category` - Original category from your list
- `address` - Full street address
- `city` - Wellesley
- `state` - MA
- `zipCode` - 5-digit zip
- `latitude` - For map placement
- `longitude` - For map placement
- `phone` - Phone number (if available)
- `website` - Website URL (if available)
- `placeId` - Google Place ID
- `rating` - Current Google rating
- `reviewCount` - Number of reviews
- `status` - success | partial | not_found | error

### Status Meanings:
- ✅ **success**: Complete data retrieved
- ⚠️ **partial**: Found but missing some details
- ❌ **not_found**: Google couldn't find this business
- ❌ **error**: API error occurred

### Manual Fixes for "not_found" Entries:

Some businesses might not be found because:
- Business name doesn't match Google's records exactly
- Business is very new
- Business closed
- Typo in business name

**How to fix:**
1. Open `wellesley-businesses-enriched.csv`
2. Find rows with `status=not_found`
3. Search manually on Google Maps
4. Add the correct address and coordinates
5. Change status to `manual`

## 🔄 Step 4: Import to Firebase

Once the CSV is ready:

```bash
# Run the Firebase import tool (we'll build this next)
npm run import-businesses
```

Or use the admin web interface (coming next!).

## 🛠️ Troubleshooting

### "API Key not set" error
```bash
# Make sure you exported the key
export GOOGLE_PLACES_API_KEY="your-key-here"

# Verify it's set
echo $GOOGLE_PLACES_API_KEY
```

### "REQUEST_DENIED" error
- Your API key needs billing enabled
- Make sure Places API is enabled in Google Cloud Console

### "OVER_QUERY_LIMIT" error
- You've hit the rate limit
- Wait a few minutes and try again
- Or increase the `DELAY_BETWEEN_REQUESTS` in the script

### Some businesses not found
- Normal! Google doesn't have everything
- Review and manually add these later
- Or try searching with a slightly different name

## 📝 Next Steps

1. ✅ Run test enrichment (5 businesses)
2. ✅ Review test results
3. ✅ Run full enrichment (230 businesses)
4. 📋 Review and fix any "not_found" entries
5. 🔥 Import to Firebase using admin tool
6. 🗺️ Verify businesses appear on map
7. 🎯 Set up claiming flow for business owners

## 💡 Tips

- **Start small**: Test with 5-10 businesses first
- **Check accuracy**: Review a few random entries in the CSV
- **Save your API key**: Store it securely for future batches
- **Monitor costs**: Check Google Cloud billing dashboard
- **Rate limits**: Script has 200ms delay between requests (built-in)

## 🎉 Success Metrics

Expected results for 230 Wellesley businesses:
- ✅ 90-95% success rate (~210 businesses)
- ⚠️ 5-8% partial data (~10-15 businesses)
- ❌ 2-5% not found (~5-10 businesses)

The not-found ones are usually very small/new businesses or have name discrepancies.
