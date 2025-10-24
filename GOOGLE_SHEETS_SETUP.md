# Google Sheets Database Setup Guide

This guide will help you create and configure Google Sheets to serve as the data backend for the Valu app.

## Overview

You'll create **3 separate Google Sheets** (can be in one Spreadsheet as different tabs):
1. **Causes/Values** - Available values users can support or avoid
2. **Products** - Product database with alignment information
3. **Local Businesses** - Local business listings

---

## Step 1: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet called "Valu App Database"
3. Create three tabs: "Causes", "Products", "Local Businesses"

---

## Step 2: Set Up Each Sheet

### Sheet 1: Causes (Values)

**Columns:**
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| A: id | Text | Unique identifier (lowercase, hyphenated) | `climate-change` |
| B: name | Text | Display name | `Climate Change` |
| C: category | Text | One of: ideology, person, social_issue, religion, nation, organization, corporation | `social_issue` |
| D: description | Text | Optional description | `Supporting environmental sustainability` |
| E: imageUrl | Text | Optional image URL | `https://...` |

**Example rows:**
```
id                    | name              | category      | description                    | imageUrl
climate-change        | Climate Change    | social_issue  | Environmental sustainability   |
lgbtq                 | LGBTQ             | social_issue  | LGBTQ+ rights and equality     |
elon-musk             | Elon Musk         | person        | CEO of Tesla and SpaceX        |
conservative          | Conservative      | ideology      | Conservative political values  |
```

**To populate:** Copy data from `/mocks/causes.ts` into this sheet

---

### Sheet 2: Products

**Columns:**
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| A: id | Text | Unique product ID | `prod-001` |
| B: name | Text | Product name | `iPhone 15 Pro` |
| C: brand | Text | Brand name | `Apple` |
| D: category | Text | Product category | `Electronics` |
| E: imageUrl | Text | Brand logo URL | `https://logo.clearbit.com/apple.com` |
| F: productImageUrl | Text | Product image URL | `https://images.unsplash.com/...` |
| G: productDescription | Text | Product description | `Latest smartphone with A17 Pro chip` |
| H: alignmentScore | Number | -100 to +100 | `75` |
| I: keyReasons | Text | JSON array of strings | `["Supports renewable energy","Privacy focused"]` |
| J: relatedValues | Text | JSON array of value IDs | `["climate-change","privacy","entrepreneurship"]` |
| K: website | Text | Product/brand website | `https://apple.com` |
| L: moneyFlowCompany | Text | Company name | `Apple Inc.` |
| M: shareholders | Text | JSON array (see format below) | See below |
| N: valueAlignments | Text | JSON array (see format below) | See below |

**Shareholders format (Column M):**
```json
[
  {"name":"Tim Cook","percentage":15,"alignment":"aligned","causes":["Privacy","Innovation"]},
  {"name":"Vanguard Group","percentage":8,"alignment":"neutral","causes":[]}
]
```

**Value Alignments format (Column N):**
```json
[
  {"valueId":"climate-change","position":2,"isSupport":true},
  {"valueId":"privacy","position":1,"isSupport":true}
]
```

**Example row:**
```
id: prod-apple-001
name: iPhone 15 Pro
brand: Apple
category: Electronics
imageUrl: https://logo.clearbit.com/apple.com
productImageUrl: https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800
productDescription: Latest smartphone with A17 Pro chip
alignmentScore: 68
keyReasons: ["Privacy-focused design","Renewable energy commitment","Right to repair opposition"]
relatedValues: ["privacy","climate-change","entrepreneurship"]
website: https://apple.com
moneyFlowCompany: Apple Inc.
shareholders: [{"name":"Tim Cook","percentage":0.02,"alignment":"aligned","causes":["Privacy"]},{"name":"Vanguard","percentage":8.4,"alignment":"neutral","causes":[]},{"name":"BlackRock","percentage":6.8,"alignment":"neutral","causes":[]}]
valueAlignments: [{"valueId":"privacy","position":1,"isSupport":true},{"valueId":"climate-change","position":2,"isSupport":true},{"valueId":"gun-rights","position":3,"isSupport":false}]
```

---

### Sheet 3: Local Businesses

**Same structure as Products sheet** - Local businesses use the same Product type

**Example rows:**
```
id: local-blue-ginger
name: Blue Ginger
brand: Blue Ginger
category: Restaurant
imageUrl: https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400
productImageUrl: https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800
productDescription: Asian Fusion Tasting Menu - Innovative dishes
alignmentScore: 85
keyReasons: ["Locally owned","Sources from local farms","Environmental sustainability"]
relatedValues: ["environmentalism","entrepreneurship","personal-health"]
website: https://ming.com/blue-ginger
moneyFlowCompany: Blue Ginger
shareholders: [{"name":"Ming Tsai (Chef/Owner)","percentage":100,"alignment":"aligned","causes":["Environmental Sustainability","Local Sourcing"]}]
valueAlignments: [{"valueId":"environmentalism","position":1,"isSupport":true}]
```

---

## Step 3: Make Sheets Publicly Readable

### Option A: Public Link (Easiest)
1. Click "Share" button (top right)
2. Change "Restricted" to "Anyone with the link"
3. Set permission to "Viewer"
4. Copy the spreadsheet ID from URL

### Option B: Service Account (Recommended for Production)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable Google Sheets API
4. Create a Service Account
5. Download JSON key file
6. Share your spreadsheet with the service account email (viewer access)

**For now, use Option A to get started quickly!**

---

## Step 4: Get Your Spreadsheet ID

From your Google Sheets URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
                                          ^^^^^^^^^^^^^^
```

Copy the `SPREADSHEET_ID_HERE` part.

---

## Step 5: Add to .env File

Add these to your `.env` file:

```bash
# Google Sheets Integration
GOOGLE_SHEETS_API_KEY=your_api_key_here  # Optional for public sheets
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here

# Sheet names (if different from defaults)
SHEET_NAME_CAUSES=Causes
SHEET_NAME_PRODUCTS=Products
SHEET_NAME_LOCAL_BUSINESSES=Local Businesses
```

---

## Step 6: Data Migration

I'll help you migrate your existing mock data to the sheets. You can either:

1. **Manual copy-paste**: Open the mock files and copy data to sheets
2. **Export script**: I can create a script to export your mock data to CSV, which you can import to Sheets
3. **API script**: I can create a script that directly writes to Sheets via API

Let me know which you prefer!

---

## Quick Start: Minimum Viable Sheet

To test the integration quickly, create just the **Products** sheet with these 3 example rows:

| id | name | brand | category | imageUrl | productImageUrl | productDescription | alignmentScore | keyReasons | relatedValues | website |
|----|------|-------|----------|----------|----------------|-------------------|----------------|-----------|---------------|---------|
| test-1 | iPhone 15 | Apple | Electronics | https://logo.clearbit.com/apple.com | https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800 | Latest smartphone | 68 | ["Privacy focused","Renewable energy"] | ["privacy","climate-change"] | https://apple.com |
| test-2 | Model 3 | Tesla | Automotive | https://logo.clearbit.com/tesla.com | https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800 | Electric vehicle | 55 | ["Electric vehicle","Controversial leadership"] | ["climate-change","elon-musk"] | https://tesla.com |
| test-3 | Patagonia Jacket | Patagonia | Apparel | https://logo.clearbit.com/patagonia.com | https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800 | Sustainable outdoor wear | 92 | ["Environmental activism","Fair trade","B-Corp certified"] | ["environmentalism","climate-change"] | https://patagonia.com |

Leave the complex JSON columns (shareholders, valueAlignments) empty for now - we'll add those later!

---

## Next Steps

Once you've created the spreadsheet:
1. Share the Spreadsheet ID with me
2. I'll set up the backend integration
3. Test data fetching
4. Migrate all mock data

Let me know when you're ready to proceed!
