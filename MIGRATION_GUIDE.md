# Migrating App from Mock Data to Google Sheets

This guide shows you the EXACT format your Google Sheets needs and how to migrate the app code.

---

## ⚡ IMPORTANT: Alignment Scores are Calculated Dynamically

**Alignment scores are NOT stored in Google Sheets.** They are calculated in real-time based on each user's selected values. The server calculates scores for all 764 brands when you request them, ensuring maximum performance.

---

## 📊 Part 1: Google Sheets Format (What Your Data Needs to Look Like)

### **Brands Sheet - Column Structure**

| Column | Field Name | Type | Example | Notes |
|--------|-----------|------|---------|-------|
| **A** | `id` | Text | `brand-apple` | Unique ID (lowercase-with-dashes) |
| **B** | `name` | Text | `Apple` | Brand name |
| **C** | *(skip)* | - | - | Leave empty or use for notes |
| **D** | `category` | Text | `Electronics` | Product category |
| **E** | `imageUrl` | URL | `https://logo.clearbit.com/apple.com` | Brand logo |
| **F** | `exampleImageUrl` | URL | `https://images.unsplash.com/...` | Example product image |
| **G** | `description` | Text | `Consumer electronics company` | Brand description |
| **H** | ~~`alignmentScore`~~ | ~~Number~~ | - | **SKIP THIS - scores calculated per user** |
| **I** | `keyReasons` | JSON Array | `["Privacy focused","Renewable energy"]` | Why aligned/unaligned |
| **J** | `relatedValues` | JSON Array | `["privacy","climate-change"]` | Related cause IDs |
| **K** | `website` | URL | `https://apple.com` | Brand website |
| **L** | `moneyFlowCompany` | Text | `Apple Inc.` | Company name for money flow |
| **M** | `shareholders` | JSON Array | See format below | Ownership structure |
| **N** | `valueAlignments` | JSON Array | See format below | **MOST IMPORTANT - used for scoring** |

---

### **JSON Format Examples**

#### **Column I: keyReasons** (Simple array of strings)
```json
["Privacy-focused design","Renewable energy commitment","Right to repair opposition"]
```

#### **Column J: relatedValues** (Array of cause IDs from Causes sheet)
```json
["privacy","climate-change","entrepreneurship"]
```

#### **Column M: shareholders** (Array of objects)
```json
[{"name":"Tim Cook","percentage":0.02,"alignment":"aligned","causes":["Privacy"]},{"name":"Vanguard","percentage":8.4,"alignment":"neutral","causes":[]},{"name":"BlackRock","percentage":6.8,"alignment":"neutral","causes":[]}]
```

**Fields:**
- `name`: Shareholder name
- `percentage`: Ownership percentage (0-100)
- `alignment`: `"aligned"`, `"neutral"`, or `"opposed"`
- `causes`: Array of causes they support

#### **Column N: valueAlignments** (Array of objects)
```json
[{"valueId":"privacy","position":1,"isSupport":true},{"valueId":"climate-change","position":2,"isSupport":true},{"valueId":"gun-rights","position":3,"isSupport":false}]
```

**Fields:**
- `valueId`: ID from Causes sheet
- `position`: 1-10 (1 = strongest connection, 10 = weakest)
- `isSupport`: `true` = brand supports this, `false` = brand opposes this

---

## 📋 Part 2: Complete Example Row

Here's a **complete, copy-paste ready example** for your Google Sheets:

### Row 2 (Apple Example):

| Column | Value |
|--------|-------|
| **A (id)** | `brand-apple` |
| **B (name)** | `Apple` |
| **C** | *(leave empty)* |
| **D (category)** | `Electronics` |
| **E (imageUrl)** | `https://logo.clearbit.com/apple.com` |
| **F (exampleImageUrl)** | `https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800` |
| **G (description)** | `Consumer electronics company known for iPhone, Mac, and privacy focus` |
| **H (alignmentScore)** | `68` |
| **I (keyReasons)** | `["Privacy-focused design","Renewable energy commitment","Right to repair opposition"]` |
| **J (relatedValues)** | `["privacy","climate-change","entrepreneurship"]` |
| **K (website)** | `https://apple.com` |
| **L (moneyFlowCompany)** | `Apple Inc.` |
| **M (shareholders)** | `[{"name":"Tim Cook","percentage":0.02,"alignment":"aligned","causes":["Privacy"]},{"name":"Vanguard","percentage":8.4,"alignment":"neutral","causes":[]},{"name":"BlackRock","percentage":6.8,"alignment":"neutral","causes":[]}]` |
| **N (valueAlignments)** | `[{"valueId":"privacy","position":1,"isSupport":true},{"valueId":"climate-change","position":2,"isSupport":true},{"valueId":"gun-rights","position":8,"isSupport":false}]` |

### Row 3 (Patagonia Example - Highly Aligned):

| Column | Value |
|--------|-------|
| **A** | `brand-patagonia` |
| **B** | `Patagonia` |
| **C** | *(empty)* |
| **D** | `Apparel` |
| **E** | `https://logo.clearbit.com/patagonia.com` |
| **F** | `https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800` |
| **G** | `Sustainable outdoor clothing company, certified B-Corp` |
| **H** | `92` |
| **I** | `["Environmental activism","Fair trade certified","B-Corp certified","1% for the Planet","Anti-consumerism campaigns"]` |
| **J** | `["environmentalism","climate-change","veganism"]` |
| **K** | `https://patagonia.com` |
| **L** | `Patagonia Inc.` |
| **M** | `[{"name":"Yvon Chouinard (Founder)","percentage":100,"alignment":"aligned","causes":["Environmental Protection","Climate Action"]}]` |
| **N** | `[{"valueId":"environmentalism","position":1,"isSupport":true},{"valueId":"climate-change","position":1,"isSupport":true},{"valueId":"veganism","position":3,"isSupport":true}]` |

### Row 4 (ExxonMobil Example - Unaligned):

| Column | Value |
|--------|-------|
| **A** | `brand-exxonmobil` |
| **B** | `ExxonMobil` |
| **C** | *(empty)* |
| **D** | `Energy` |
| **E** | `https://logo.clearbit.com/exxonmobil.com` |
| **F** | `https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800` |
| **G** | `Multinational oil and gas corporation` |
| **H** | `-85` |
| **I** | `["Major fossil fuel producer","Climate change denial history","Large carbon emissions","Lobbying against climate policy"]` |
| **J** | `["climate-change","environmentalism"]` |
| **K** | `https://corporate.exxonmobil.com` |
| **L** | `Exxon Mobil Corporation` |
| **M** | `[{"name":"Vanguard Group","percentage":8.1,"alignment":"neutral","causes":[]},{"name":"BlackRock","percentage":6.7,"alignment":"neutral","causes":[]}]` |
| **N** | `[{"valueId":"climate-change","position":1,"isSupport":false},{"valueId":"environmentalism","position":1,"isSupport":false}]` |

---

## 🔧 Part 3: Code Changes (Making App Use Google Sheets)

### **How Scoring Works Now**

The new system calculates alignment scores **on the server** based on each user's causes:

1. User selects their causes/values in the app
2. App sends causes to server via `getScoredBrands` endpoint
3. Server fetches brands from Google Sheets (cached 5 min)
4. Server calculates alignment scores for all 764 brands
5. Server returns pre-scored brands sorted by alignment

**Performance:** First load calculates all brands (~500ms for 764 brands), subsequent loads use cache (instant).

---

### **Current State (Using Mock Data)**

Example from `app/(tabs)/home.tsx`:

```typescript
import { MOCK_PRODUCTS } from '@/mocks/products';

export default function HomeScreen() {
  const { profile } = useUser();

  // Client-side scoring calculation
  const scored = MOCK_PRODUCTS.map(product => {
    // 50+ lines of alignment calculation logic
    return { product, alignmentStrength };
  });

  const alignedBrands = scored.filter(s => s.isAligned);
  return <BrandList brands={alignedBrands} />;
}
```

### **New State (Using Google Sheets with Server-Side Scoring)**

```typescript
import { trpc } from '@/lib/trpc';
import { ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const { profile } = useUser();

  // Fetch brands with pre-calculated scores from server
  const { data, isLoading } = trpc.data.getScoredBrands.useQuery({
    userCauses: profile.causes,
    filter: 'all', // or 'aligned' or 'unaligned'
  });

  if (isLoading) {
    return <ActivityIndicator size="large" />;
  }

  // Brands already scored and sorted!
  const alignedBrands = data?.alignedBrands || [];
  const unalignedBrands = data?.unalignedBrands || [];

  return <BrandList brands={alignedBrands} />;
}
```

**Benefits:**
- ✅ No client-side calculation needed
- ✅ Scores calculated once on server (fast)
- ✅ Results cached for 5 minutes
- ✅ All screens get same scored brands
- ✅ Works great with 764 brands

---

## 📱 Part 4: Migration Checklist

### Step 1: Format Your Google Sheets Data ✅

In your Google Sheets "Brands" tab:
- [ ] **Column N (valueAlignments)** - MOST IMPORTANT! Format as JSON array
- [ ] Column I (keyReasons) uses JSON array format: `["Reason 1","Reason 2"]`
- [ ] Column J (relatedValues) uses JSON array format: `["value-id-1","value-id-2"]`
- [ ] All required columns (A, B, N) are filled
- [ ] **IGNORE Column H** - alignment scores are calculated dynamically

### Step 2: Test Data Fetch

Run this to verify data is loading correctly:
```bash
npm run test-sheets
```

Should show brands loading from Google Sheets.

### Step 3: Update One Screen as Test

Pick ONE screen to migrate first (I recommend the Home screen):

**File: `app/(tabs)/home.tsx`**

Change this:
```typescript
import { MOCK_PRODUCTS } from '@/mocks/products';

const scored = MOCK_PRODUCTS.map(product => {
  // Alignment calculation logic...
});
```

To this:
```typescript
import { trpc } from '@/lib/trpc';
const { profile } = useUser();

const { data, isLoading } = trpc.data.getScoredBrands.useQuery({
  userCauses: profile.causes,
});

// Use data.alignedBrands and data.unalignedBrands
```

### Step 4: Run Your App

```bash
npm start
```

Navigate to the Home tab and see if brands load from Google Sheets!

### Step 5: Migrate Remaining Screens

Once one screen works, update these files:
- [ ] `app/(tabs)/search.tsx`
- [ ] `app/(tabs)/local.tsx`
- [ ] `app/(tabs)/shop.tsx`
- [ ] `app/product/[id].tsx`
- [ ] `app/onboarding.tsx`

---

## 🎯 Quick Start: Test with Minimal Data

**Want to test RIGHT NOW before cleaning all your data?**

Just add **ONE properly formatted row** to test:

1. In your Google Sheets, Row 2, add:
   - **A**: `test-brand`
   - **B**: `Test Brand`
   - **D**: `Technology`
   - **I**: `["Great brand","Trustworthy"]`
   - **J**: `["privacy"]`
   - **N**: `[{"valueId":"privacy","position":1,"isSupport":true}]`

2. Run test:
   ```bash
   npm run test-sheets
   ```

3. Should show "Test Brand" loading successfully!

---

## ❓ Questions?

**Q: Do I need ALL columns filled?**
A: Minimum required: **A (id)**, **B (name)**, **N (valueAlignments)**. Others are optional but recommended.

**Q: What if I don't have shareholder data?**
A: Leave Column M empty or use: `[]`

**Q: Can I test with just a few brands?**
A: YES! Start with 3-5 properly formatted brands and test.

**Q: Why isn't Column H (alignmentScore) needed?**
A: Alignment scores are calculated dynamically per user. Each user sees different scores based on their selected causes. The server calculates this using the `valueAlignments` data in Column N.

---

**Ready to migrate? Let me know which screen you want to update first and I'll help you!** 🚀
