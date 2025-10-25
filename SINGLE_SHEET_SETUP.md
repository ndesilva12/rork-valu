# Value-Brand Matrix: Single Sheet Setup

## ✅ The Smart Approach: One Sheet for Everything

Your existing matrix already combines:
- **Causes/Values data** (columns A-C)
- **Brand alignments** (columns D onwards)

This eliminates the need for separate Causes and Value-Brand-Matrix sheets!

---

## 📊 Sheet Structure

**Sheet Name:** `Value-Brand-Matrix`

| Column | Field | Description |
|--------|-------|-------------|
| **A** | id | Value ID (e.g., `libertarian`, `privacy`, `elon-musk`) |
| **B** | name | Value display name (e.g., `Libertarian`, `Privacy`, `Elon Musk`) |
| **C** | category | Category type: `ideology`, `social_issue`, `religion`, `nation`, `organization`, `person` |
| **D** | aligned1 | #1 most aligned brand ID |
| **E** | aligned2 | #2 most aligned brand ID |
| **F** | aligned3 | #3 most aligned brand ID |
| **G** | aligned4 | #4 most aligned brand ID |
| **H** | aligned5 | #5 most aligned brand ID |
| **I** | aligned6 | #6 most aligned brand ID |
| **J** | aligned7 | #7 most aligned brand ID |
| **K** | aligned8 | #8 most aligned brand ID |
| **L** | aligned9 | #9 most aligned brand ID |
| **M** | aligned10 | #10 most aligned brand ID |
| **N** | unaligned1 | #1 most opposed brand ID |
| **O** | unaligned2 | #2 most opposed brand ID |
| **P** | unaligned3 | #3 most opposed brand ID |
| **Q** | unaligned4 | #4 most opposed brand ID |
| **R** | unaligned5 | #5 most opposed brand ID |
| **S** | unaligned6 | #6 most opposed brand ID |
| **T** | unaligned7 | #7 most opposed brand ID |
| **U** | unaligned8 | #8 most opposed brand ID |
| **V** | unaligned9 | #9 most opposed brand ID |
| **W** | unaligned10 | #10 most opposed brand ID |

---

## 📋 Example Rows (From Your Data)

### Row 2: Libertarian Ideology
```
id: libertarian
name: Libertarian
category: ideology
aligned1: Uber
aligned2: Airbnb
aligned3: Coinbase
... (through aligned10: Proton)
unaligned1: BlackRock
unaligned2: Vanguard
... (through unaligned10: Walmart)
```

### Row 3: Conservative Ideology
```
id: conservative
name: Conservative
category: ideology
aligned1: Hobby Lobby
aligned2: Chick-fil-A
aligned3: MyPillow
... (through aligned10: Uber)
unaligned1: The Walt Disney Company
unaligned2: Nike
... (through unaligned10: CBS)
```

### Row 41: Abortion Social Issue
```
id: abortion
name: Abortion
category: social_issue
aligned1: Apple
aligned2: Amazon
aligned3: Alphabet
... (through aligned10: Netflix)
unaligned1: Chick-fil-A
unaligned2: Hobby Lobby
... (through unaligned10: Target)
```

---

## 🔧 Backend Processing

The backend automatically:

1. **Fetches the sheet** from Google Sheets
2. **Extracts causes** from columns A-C
3. **Extracts alignments** from columns D-W
4. **Builds valueAlignments** for each brand

**Example transformation:**

**From your matrix (Privacy row):**
```
id: privacy
aligned1: Proton
aligned2: Signal
aligned3: DuckDuckGo
unaligned1: Alphabet
unaligned2: Meta
unaligned3: Amazon
```

**Becomes:**

**Proton brand:**
```json
{
  "valueAlignments": [
    {"valueId": "privacy", "position": 1, "isSupport": true}
  ]
}
```

**Alphabet brand:**
```json
{
  "valueAlignments": [
    {"valueId": "privacy", "position": 1, "isSupport": false}
  ]
}
```

---

## ✅ Setup Steps

### Step 1: Upload Your Matrix

You already have the data! Just:

1. Open your Google Sheets spreadsheet
2. Create/rename a sheet to: **`Value-Brand-Matrix`**
3. Paste your existing data (the one you showed me)
4. Make sure header row is:
   ```
   id | name | category | aligned1 | aligned2 | ... | aligned10 | unaligned1 | ... | unaligned10
   ```

### Step 2: Update .env

Add/update in your `.env` file:

```bash
SHEET_NAME_VALUE_MATRIX=Value-Brand-Matrix
```

### Step 3: Test

```bash
npm run test-sheets
```

Should show:
- ✅ Fetched X causes from Value-Brand-Matrix sheet
- ✅ Fetched Y brands from Brands sheet
- ✅ Built valueAlignments for Z brands from matrix

### Step 4: Validate

```bash
npm run validate-matrix
```

Checks:
- ✅ Each value has exactly 10 aligned brands
- ✅ Each value has exactly 10 unaligned brands
- ⚠️ Warnings for any incomplete values

---

## 📊 Your Current Data

Looking at your matrix, you have:

**Values Count:** ~69 values (libertarian, conservative, liberal, socialism, etc.)
**Categories:**
- Ideologies: libertarian, conservative, liberal, socialism, feminism, etc.
- Social Issues: abortion, gun-rights, climate-change, lgbtq, privacy, etc.
- Religions: christians, muslims, judaism, buddhism
- Nations: china, russia, israel, france, italy, japan, various US states
- Organizations: nba, nfl, mlb, nhl, clinton-foundation, aclu, hollywood, wall-street, silicon-valley
- People: elon-musk, lebron-james, taylor-swift, joe-rogan, donald-trump, bernie-sanders, etc.

**Brand Coverage:** Each value appears to have 10 aligned + 10 unaligned brands ✅

---

## 🎯 Data Quality Notes

From your matrix, I notice:

### ✅ Good Structure
- Clear categories (ideology, social_issue, religion, nation, organization, person)
- Consistent naming (lowercase-with-hyphens for IDs)
- Full coverage (10+10 for each value)

### ⚠️ Potential Issues to Check

1. **Duplicate Brands Across Columns**
   - Example: "libertarian" row has SpaceX, PayPal, etc. in BOTH aligned AND unaligned columns
   - Should a brand appear in both? (Usually no)

2. **Brand ID Format**
   - Some brands use full names: "Sturm, Ruger & Co."
   - Others use IDs: "apple", "meta"
   - **Important:** These need to match brand IDs in your Brands sheet exactly

3. **Validation Recommended**
   - Run `npm run validate-matrix` to catch:
     - Brand IDs that don't exist in Brands sheet
     - Duplicate brands in same row
     - Missing positions

---

## 🚀 Next Steps

1. **Upload this matrix** to Google Sheets as "Value-Brand-Matrix" sheet
2. **Ensure brand IDs match** your Brands sheet (lowercase, no spaces)
3. **Run validation** to catch any issues
4. **Test integration** with test-sheets script

---

## ❓ FAQ

**Q: Do I still need a separate Causes sheet?**
**A:** No! The Value-Brand-Matrix sheet serves both purposes now.

**Q: What if a brand appears in multiple values?**
**A:** That's expected! Apple can be aligned for privacy, unaligned for right-to-repair, etc.

**Q: Can I have fewer than 10 aligned/unaligned for a value?**
**A:** Technically yes, but users who select only that value won't see a full list. Validation will warn you.

**Q: What happens if a brand ID in the matrix doesn't exist in Brands sheet?**
**A:** The system will skip that brand and log a warning. Validation script will catch it.

---

**Your data looks great! Ready to upload and test!** 🎯
