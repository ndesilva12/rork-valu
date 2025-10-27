# Value-Brand Matrix Approach (RECOMMENDED)

## 🎯 The Better Way: Matrix Sheet

Instead of adding JSON to each brand row, use a **separate matrix sheet** where each row is a value and columns list the aligned/unaligned brands.

---

## 📊 Matrix Sheet Structure

Create a new sheet called **"Value-Brand-Matrix"** with this structure:

| Column | Field | Example |
|--------|-------|---------|
| **A** | valueId | `privacy` |
| **B** | valueName | `Privacy` |
| **C-L** | aligned1 through aligned10 | Brand IDs in rank order |
| **M-V** | unaligned1 through unaligned10 | Brand IDs in rank order |

### **Complete Column List:**

| Column | Field | Description |
|--------|-------|-------------|
| A | valueId | Value ID (matches Causes sheet) |
| B | valueName | Value display name |
| C | aligned1 | #1 most aligned brand ID |
| D | aligned2 | #2 most aligned brand ID |
| E | aligned3 | #3 most aligned brand ID |
| F | aligned4 | #4 most aligned brand ID |
| G | aligned5 | #5 most aligned brand ID |
| H | aligned6 | #6 most aligned brand ID |
| I | aligned7 | #7 most aligned brand ID |
| J | aligned8 | #8 most aligned brand ID |
| K | aligned9 | #9 most aligned brand ID |
| L | aligned10 | #10 most aligned brand ID |
| M | unaligned1 | #1 most opposed brand ID |
| N | unaligned2 | #2 most opposed brand ID |
| O | unaligned3 | #3 most opposed brand ID |
| P | unaligned4 | #4 most opposed brand ID |
| Q | unaligned5 | #5 most opposed brand ID |
| R | unaligned6 | #6 most opposed brand ID |
| S | unaligned7 | #7 most opposed brand ID |
| T | unaligned8 | #8 most opposed brand ID |
| U | unaligned9 | #9 most opposed brand ID |
| V | unaligned10 | #10 most opposed brand ID |

---

## 📝 Example Rows

### **Row 2: Privacy**

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| privacy | Privacy | signal | protonmail | apple | duckduckgo | brave | tutanota | mozilla | telegram | wickr | session | meta | tiktok | google | amazon | microsoft | twitter | linkedin | snapchat | instagram | whatsapp |

### **Row 3: Climate Change**

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| climate-change | Climate Change | patagonia | tesla | beyond-meat | allbirds | seventh-generation | grove-collaborative | blueland | etsy | reformation | thred-up | exxonmobil | chevron | shell | bp | conocophillips | marathon-petroleum | valero | phillips66 | devon-energy | occidental |

### **Row 4: Workers' Rights**

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| workers-rights | Workers' Rights | costco | patagonia | ben-jerrys | new-belgium | king-arthur | bob-red-mill | clif-bar | eileen-fisher | greyston-bakery | equal-exchange | amazon | walmart | uber | doordash | instacart | lyft | shein | fast-fashion-co | gig-platform-x | anti-union-retailer |

---

## ✅ Advantages of Matrix Approach

### **1. Much Easier Data Entry**
- Work one value at a time (one row)
- See all 20 brands for a value in one view
- Copy-paste from your original Rork data
- No JSON formatting needed!

### **2. Easy Validation**
- Visual inspection (just look at each row)
- Each row should have exactly 20 brand IDs
- No complex JSON to debug

### **3. Easy Maintenance**
- Want to change privacy rankings? Edit one row
- Want to add a new value? Add one row
- Want to swap brand positions? Just reorder cells

### **4. Matches Your Original Data**
If you already have this format from Rork, you can paste it directly!

---

## 🔧 Backend Implementation

The backend will:

1. **Fetch matrix from Google Sheets**
2. **Transform into valueAlignments** for each brand
3. **Calculate scores** using existing algorithm

### **Example Transformation:**

**From Matrix Sheet (Privacy row):**
```
valueId: privacy
aligned1: signal
aligned2: protonmail
aligned3: apple
...
unaligned1: meta
unaligned2: tiktok
...
```

**Transforms to Brand Objects:**

**Signal brand:**
```json
{
  "valueAlignments": [
    {"valueId": "privacy", "position": 1, "isSupport": true}
  ]
}
```

**Apple brand:**
```json
{
  "valueAlignments": [
    {"valueId": "privacy", "position": 3, "isSupport": true}
  ]
}
```

**Meta brand:**
```json
{
  "valueAlignments": [
    {"valueId": "privacy", "position": 1, "isSupport": false}
  ]
}
```

---

## 📋 Step-by-Step Setup

### **Step 1: Create Matrix Sheet**

1. In your Google Sheets, create a new sheet named **"Value-Brand-Matrix"**
2. Add header row:
   ```
   A: valueId
   B: valueName
   C-L: aligned1 through aligned10
   M-V: unaligned1 through unaligned10
   ```

### **Step 2: Populate Data**

For each value (each row):

1. **Column A**: Value ID from Causes sheet
2. **Column B**: Value display name
3. **Columns C-L**: Top 10 aligned brand IDs (in rank order)
4. **Columns M-V**: Top 10 unaligned brand IDs (in rank order)

**Example Row (Privacy):**
```
A: privacy
B: Privacy
C: signal (best privacy)
D: protonmail
E: apple
F: duckduckgo
G: brave
H: tutanota
I: mozilla
J: telegram
K: wickr
L: session (10th best privacy)
M: meta (worst privacy)
N: tiktok
O: google
P: amazon
Q: microsoft
R: twitter
S: linkedin
T: snapchat
U: instagram
V: whatsapp (10th worst privacy)
```

### **Step 3: Validation**

Run validation script:
```bash
npm run validate-matrix
```

Checks:
- ✅ Each row has exactly 20 brand IDs
- ✅ All brand IDs exist in Brands sheet
- ✅ No duplicate brand IDs in a row
- ✅ All value IDs match Causes sheet

---

## 🚀 Migration from Current Approach

If you've already started with valueAlignments in Brand rows:

**Option A: Export to Matrix**
1. Run script to extract existing data into matrix format
2. Export to CSV
3. Import into new Matrix sheet

**Option B: Start Fresh**
1. Create Matrix sheet
2. Populate from your original Rork data
3. Ignore valueAlignments column in Brands sheet

---

## 💡 Tips for Matrix Data Entry

### **1. Use Data Validation**

In Google Sheets, add data validation to columns C-V:
- Source: Brand IDs from Brands sheet (Column A)
- Shows dropdown of valid brand IDs
- Prevents typos!

### **2. Color Code Status**

Use conditional formatting:
- **Green**: Row complete (20 brands)
- **Yellow**: Row partial (< 20 brands)
- **Red**: Row empty

### **3. Template Row**

Create a template at the top:
```
Row 1 (Header): valueId, valueName, aligned1, aligned2, ...
Row 2 (Template): [VALUE_ID], [VALUE_NAME], [BRAND], [BRAND], ...
Row 3 (Start here): privacy, Privacy, signal, protonmail, ...
```

### **4. Batch Similar Values**

Group related values together in adjacent rows:
- Rows 3-10: Environmental values
- Rows 11-20: Social justice values
- Rows 21-30: Economic values
- etc.

Makes it easier to find similar brands across related values.

---

## 🔍 Example: Complete Matrix Sheet

**First 5 rows:**

| valueId | valueName | aligned1 | aligned2 | aligned3 | ... | aligned10 | unaligned1 | unaligned2 | ... | unaligned10 |
|---------|-----------|----------|----------|----------|-----|-----------|------------|------------|-----|-------------|
| privacy | Privacy | signal | protonmail | apple | ... | session | meta | tiktok | ... | whatsapp |
| climate-change | Climate Change | patagonia | tesla | beyond-meat | ... | thred-up | exxonmobil | chevron | ... | occidental |
| workers-rights | Workers' Rights | costco | patagonia | ben-jerrys | ... | equal-exchange | amazon | walmart | ... | anti-union-co |
| lgbtq-rights | LGBTQ+ Rights | ben-jerrys | patagonia | starbucks | ... | doc-martens | hobby-lobby | chick-fil-a | ... | conservative-co |
| gun-rights | Gun Rights | cabelas | bass-pro | glock-store | ... | rural-king | rei | patagonia | ... | liberal-brand |

Notice:
- Each row = one value
- Each value has exactly 20 brand IDs
- Rankings visible at a glance
- Easy to edit and maintain

---

## ❓ FAQ

**Q: Can I copy-paste from Excel/CSV?**
**A:** Yes! Just make sure columns align correctly.

**Q: What if a brand ID doesn't exist in Brands sheet?**
**A:** Validation script will catch it and show error.

**Q: Can brands appear in multiple values?**
**A:** Yes! Apple can be aligned for privacy and climate, unaligned for right-to-repair.

**Q: Do I need to fill valueAlignments column in Brands sheet?**
**A:** No! Backend will build it from the matrix.

**Q: Can I have fewer than 10 aligned or unaligned for a value?**
**A:** Technically yes, but validation will warn you. Users who select only that value won't see a full list.

---

**This approach is MUCH simpler! Ready to set it up?** 🎯
