# Google Sheets Integration for Valu App

This integration allows you to manage your app's product data, values/causes, and local business information in Google Sheets instead of hardcoded mock data files.

## Why Use Google Sheets?

✅ **Easy Collaboration** - Multiple people can edit data
✅ **No App Updates** - Change data without rebuilding the app
✅ **Scalable** - Add thousands of products easily
✅ **Familiar Interface** - Use spreadsheets, not code
✅ **Free** - Google Sheets is free with generous limits
✅ **Automatic Caching** - Built-in caching reduces API calls

---

## Quick Start (5 Minutes)

### 1. Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet: "Valu App Database"
3. Create 3 tabs: `Causes`, `Products`, `Local Businesses`
4. Add column headers (see structure below)
5. Add a few test rows

**Minimum Viable Setup - Products Sheet:**

| id | name | brand | category | imageUrl | productImageUrl | productDescription | alignmentScore | keyReasons | relatedValues | website |
|----|------|-------|----------|----------|-----------------|-------------------|----------------|------------|---------------|---------|
| test-1 | iPhone 15 | Apple | Electronics | https://logo.clearbit.com/apple.com | https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800 | Latest smartphone | 68 | ["Privacy focused"] | ["privacy"] | https://apple.com |

### 2. Make Sheet Public

1. Click **Share** button (top right)
2. Change "Restricted" to "Anyone with the link"
3. Set permission to **Viewer**
4. Copy the **Spreadsheet ID** from URL:
   ```
   https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit
                                             ^^^^^^^^^^^^^^^^^^
                                             This is your ID
   ```

### 3. Add to Environment Variables

Create/edit `.env` file in your project root:

```bash
# Add your Spreadsheet ID
GOOGLE_SPREADSHEET_ID=1A2B3C4D5E6F7G8H9I0J

# For public sheets, you need an API key (get from Google Cloud Console)
GOOGLE_SHEETS_API_KEY=AIzaSy...your_api_key_here

# Optional: Custom sheet names (defaults shown)
SHEET_NAME_CAUSES=Causes
SHEET_NAME_PRODUCTS=Products
SHEET_NAME_LOCAL_BUSINESSES=Local Businesses
```

### 4. Test the Integration

Run the test script:

```bash
npm run test-sheets
```

If successful, you'll see:
```
🎉 Test Complete!
✅ Your Google Sheets integration is working correctly!
```

### 5. Use in Your App

The data is now automatically available via tRPC:

```typescript
import { trpc } from '@/lib/trpc';

function MyComponent() {
  const { data: products } = trpc.data.getProducts.useQuery();
  const { data: causes } = trpc.data.getCauses.useQuery();

  return <ProductList products={products} />;
}
```

---

## Complete Documentation

### 📚 Setup Guides

1. **[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)**
   → Detailed guide on creating and structuring your Google Sheets

2. **[GOOGLE_API_SETUP.md](./GOOGLE_API_SETUP.md)**
   → How to set up Google API credentials (Service Account method)

3. **[GOOGLE_SHEETS_USAGE.md](./GOOGLE_SHEETS_USAGE.md)**
   → Code examples and migration guide for using the API in your app

---

## Sheet Structure Reference

### Causes/Values Sheet

| Column | Type | Required | Example |
|--------|------|----------|---------|
| A: id | Text | ✅ | `climate-change` |
| B: name | Text | ✅ | `Climate Change` |
| C: category | Text | ✅ | `social_issue` |
| D: description | Text | ❌ | `Environmental sustainability` |
| E: imageUrl | Text | ❌ | `https://...` |

**Categories:** `ideology`, `person`, `social_issue`, `religion`, `nation`, `organization`, `corporation`

### Products Sheet

| Column | Type | Required | Example |
|--------|------|----------|---------|
| A: id | Text | ✅ | `prod-001` |
| B: name | Text | ✅ | `iPhone 15 Pro` |
| C: brand | Text | ✅ | `Apple` |
| D: category | Text | ❌ | `Electronics` |
| E: imageUrl | Text | ❌ | `https://logo.clearbit.com/apple.com` |
| F: productImageUrl | Text | ❌ | `https://images.unsplash.com/...` |
| G: productDescription | Text | ❌ | `Latest smartphone` |
| H: alignmentScore | Number | ✅ | `68` (between -100 and +100) |
| I: keyReasons | JSON Array | ❌ | `["Privacy focused","Renewable energy"]` |
| J: relatedValues | JSON Array | ❌ | `["privacy","climate-change"]` |
| K: website | Text | ❌ | `https://apple.com` |
| L: moneyFlowCompany | Text | ❌ | `Apple Inc.` |
| M: shareholders | JSON Array | ❌ | See detailed format below |
| N: valueAlignments | JSON Array | ❌ | See detailed format below |

**JSON Formats:**

**keyReasons:**
```json
["Reason 1", "Reason 2", "Reason 3"]
```

**relatedValues:**
```json
["value-id-1", "value-id-2"]
```

**shareholders:**
```json
[
  {"name":"Tim Cook","percentage":0.02,"alignment":"aligned","causes":["Privacy"]},
  {"name":"Vanguard","percentage":8.4,"alignment":"neutral","causes":[]}
]
```

**valueAlignments:**
```json
[
  {"valueId":"privacy","position":1,"isSupport":true},
  {"valueId":"gun-rights","position":8,"isSupport":false}
]
```

---

## Available API Endpoints

Your backend now exposes these tRPC endpoints:

```typescript
// Get all causes/values
trpc.data.getCauses.useQuery()

// Get all products
trpc.data.getProducts.useQuery()

// Get all local businesses
trpc.data.getLocalBusinesses.useQuery()

// Search products (with user cause relevance)
trpc.data.searchProducts.useQuery({
  query: "coffee",
  userCauses: ["environmentalism"]
})

// Get single product by ID
trpc.data.getProduct.useQuery({ id: "prod-001" })
```

---

## Caching

The integration includes **two layers of caching**:

1. **Backend Cache** (5 minutes)
   - Reduces Google Sheets API calls
   - Shared across all users
   - Automatic refresh

2. **Frontend Cache** (React Query)
   - Client-side caching
   - Configurable stale time
   - Automatic background refetching

**Result:** Most requests never hit Google Sheets API!

---

## Migration from Mock Data

### Before:
```typescript
import { MOCK_PRODUCTS } from '@/mocks/products';

const products = MOCK_PRODUCTS;
```

### After:
```typescript
import { trpc } from '@/lib/trpc';

const { data: products = [] } = trpc.data.getProducts.useQuery();
```

See [GOOGLE_SHEETS_USAGE.md](./GOOGLE_SHEETS_USAGE.md) for detailed migration examples.

---

## Testing Your Setup

### Run the Test Script

```bash
npm run test-sheets
```

This will:
- ✅ Check environment variables
- ✅ Test Google Sheets connection
- ✅ Fetch causes, products, and local businesses
- ✅ Validate data structure
- ✅ Show sample data

### Manual Testing

```bash
# Start your backend
npm run start

# In another terminal, test an endpoint
curl http://localhost:8081/api/trpc/data.getProducts
```

---

## Troubleshooting

### ❌ "GOOGLE_SPREADSHEET_ID not set"

**Solution:** Add to `.env`:
```bash
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
```

### ❌ "The caller does not have permission"

**Solutions:**
1. Make sure your sheet is public (if using API key)
2. Share sheet with service account email (if using service account)
3. Check that service account has "Viewer" permissions

### ❌ "Unable to parse range"

**Solution:** Check sheet names in `.env` match exactly (case-sensitive):
```bash
SHEET_NAME_CAUSES=Causes
SHEET_NAME_PRODUCTS=Products
SHEET_NAME_LOCAL_BUSINESSES=Local Businesses
```

### ❌ Data is outdated

**Solutions:**
1. Wait 5 minutes for cache to expire
2. Restart your backend server
3. Call `refetch()` on the frontend query

### ❌ JSON parse errors

**Solution:** Make sure JSON columns are valid JSON:
```json
["item1", "item2"]  ✅ Correct
['item1', 'item2']  ❌ Wrong (use double quotes)
[item1, item2]      ❌ Wrong (missing quotes)
```

---

## Production Deployment

### For Vercel/Netlify/Other Hosting:

1. Use **Service Account JSON** method (not file path)
2. Add environment variables in hosting dashboard:
   ```bash
   GOOGLE_SPREADSHEET_ID=your_id
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```
3. **Or** use base64 encoding:
   ```bash
   cat google-service-account.json | base64
   # Add result as GOOGLE_SERVICE_ACCOUNT_BASE64
   ```

### Security Best Practices:

- ✅ Use service account (not API key) for production
- ✅ Never commit `.env` or JSON files to git
- ✅ Rotate service account keys every 90 days
- ✅ Set service account to "Viewer" only (not Editor)
- ✅ Use environment variables for all credentials

---

## Advanced Usage

### Prefetching Data

```typescript
const utils = trpc.useUtils();

// Prefetch before navigating
await utils.data.getProducts.prefetch();
router.push('/products');
```

### Custom Cache Times

```typescript
const { data } = trpc.data.getProducts.useQuery(undefined, {
  staleTime: 10 * 60 * 1000,  // 10 minutes
  cacheTime: 30 * 60 * 1000,  // 30 minutes
});
```

### Manual Refetch

```typescript
const { data, refetch } = trpc.data.getProducts.useQuery();

// Force refresh
await refetch();
```

---

## File Structure

```
/home/user/rork-valu/
├── backend/
│   └── services/
│       └── google-sheets.ts          # Main integration service
├── backend/trpc/routes/data/
│   ├── get-causes/route.ts           # Causes endpoint
│   ├── get-products/route.ts         # Products endpoint
│   ├── get-local-businesses/route.ts # Local businesses endpoint
│   ├── search-products/route.ts      # Product search endpoint
│   └── get-product/route.ts          # Single product endpoint
├── scripts/
│   └── test-sheets-integration.ts    # Test script
├── GOOGLE_SHEETS_SETUP.md            # Sheet structure guide
├── GOOGLE_API_SETUP.md               # API credentials guide
├── GOOGLE_SHEETS_USAGE.md            # Frontend usage guide
└── GOOGLE_SHEETS_README.md           # This file
```

---

## Support & Resources

- **Google Sheets API Docs:** https://developers.google.com/sheets/api
- **tRPC Docs:** https://trpc.io
- **React Query Docs:** https://tanstack.com/query/latest

---

## Next Steps

1. ✅ Create your Google Spreadsheet
2. ✅ Add environment variables
3. ✅ Run `npm run test-sheets` to verify
4. ✅ Populate your sheets with data
5. ✅ Update frontend code to use new endpoints
6. ✅ Remove mock data imports
7. ✅ Deploy to production

---

## Questions?

If you run into any issues:
1. Check the troubleshooting section above
2. Run `npm run test-sheets` for diagnostics
3. Review the detailed guides linked in this README

Happy building! 🎉
