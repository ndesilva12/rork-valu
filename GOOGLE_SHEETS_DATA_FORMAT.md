# Google Sheets Data Format Guide

This guide explains **exactly how to format your Google Sheets data** for the Valu app, with focus on the critical `valueAlignments` column.

---

## 🎯 Understanding Dynamic Alignment Scoring

### **Key Concept: No Static Scores**

**Alignment scores are NOT stored** - they're calculated in real-time for each user based on:
1. Which values/causes the user cares about
2. How the brand aligns with those specific values
3. The brand's position (1-10) on each value

### **Example: How Scoring Works**

**User A** cares about: Privacy, Climate Change
**User B** cares about: Gun Rights, Immigration

**Apple Inc.** has these alignments:
```json
[
  {"valueId": "privacy", "position": 1, "isSupport": true},
  {"valueId": "climate-change", "position": 2, "isSupport": true},
  {"valueId": "gun-rights", "position": 8, "isSupport": false}
]
```

**Result:**
- **User A** sees Apple with alignment score **~95** (strongly aligned with privacy & climate)
- **User B** sees Apple with alignment score **~30** (weakly opposed to gun rights)

---

## 📊 Column Structure

### **Required Columns**

| Column | Field | Must Have? | Example |
|--------|-------|-----------|---------|
| A | id | ✅ Required | `apple-inc` |
| B | name | ✅ Required | `Apple Inc.` |
| N | valueAlignments | ✅ Required | See format below |

### **Recommended Columns**

| Column | Field | Recommended? | Example |
|--------|-------|-------------|---------|
| D | category | ⭐ Yes | `Technology` |
| E | imageUrl | ⭐ Yes | `https://logo.clearbit.com/apple.com` |
| I | keyReasons | ⭐ Yes | `["Privacy focused"]` |
| J | relatedValues | ⭐ Yes | `["privacy","climate-change"]` |

### **Optional Columns**

| Column | Field | Optional | Example |
|--------|-------|----------|---------|
| F | exampleImageUrl | Optional | Product image URL |
| G | description | Optional | Brand description |
| K | website | Optional | `https://apple.com` |
| L | moneyFlowCompany | Optional | `Apple Inc.` |
| M | shareholders | Optional | JSON array |

### **Deprecated Columns**

| Column | Field | Status | Notes |
|--------|-------|--------|-------|
| H | alignmentScore | ❌ Deprecated | Scores calculated dynamically - leave empty |

---

## 🔑 Critical: Column N (valueAlignments)

This is the **MOST IMPORTANT** column - it determines how brands are scored for each user.

### **Format**

JSON array of objects with this structure:

```json
[
  {"valueId": "value-name", "position": 1-10, "isSupport": true/false}
]
```

### **Field Definitions**

| Field | Type | Range | Meaning |
|-------|------|-------|---------|
| `valueId` | string | Must match Causes sheet | Which value/cause this relates to |
| `position` | number | 1-10 | How important this value is to the brand |
| `isSupport` | boolean | true/false | Does brand support (true) or oppose (false) this value? |

### **Position Scale**

| Position | Meaning | Examples |
|----------|---------|----------|
| 1 | Core brand identity | Apple's privacy focus, Patagonia's environmentalism |
| 2-3 | Major priority | Secondary mission values |
| 4-6 | Moderate position | Stated values but not primary focus |
| 7-9 | Weak stance | Occasional mentions or minor actions |
| 10 | Minimal involvement | Rarely discussed or acted upon |

---

## 📝 How to Populate valueAlignments

### **Step 1: Research the Brand**

For each brand, research:
- What values do they **actively promote**?
- What values do they **actively oppose**?
- What's their **ranking** of importance? (Look at: mission statements, annual reports, public statements, actions)

### **Step 2: List Top 5-10 Values**

Pick the 5-10 most relevant values. Don't try to include everything.

### **Step 3: Rank by Importance**

Assign position 1-10 based on how central this value is to the brand's identity/actions.

### **Step 4: Determine Support vs Opposition**

- `isSupport: true` = Brand actively supports this value
- `isSupport: false` = Brand actively opposes this value

---

## 📋 Complete Examples

### **Example 1: Apple Inc.**

**Research findings:**
- Privacy is core to brand identity (position 1, support)
- Renewable energy major initiative (position 2, support)
- Labor practices improved but ongoing issues (position 5, support)
- Opposes right to repair legislation (position 3, oppose)

**valueAlignments:**
```json
[
  {"valueId":"privacy","position":1,"isSupport":true},
  {"valueId":"climate-change","position":2,"isSupport":true},
  {"valueId":"right-to-repair","position":3,"isSupport":false},
  {"valueId":"workers-rights","position":5,"isSupport":true}
]
```

---

### **Example 2: Patagonia**

**Research findings:**
- Environmental activism is #1 priority
- Climate action is #1 priority (tied)
- Fair trade certified (position 2)
- Anti-consumerism campaigns (position 2)
- Worker treatment is important (position 3)

**valueAlignments:**
```json
[
  {"valueId":"environmentalism","position":1,"isSupport":true},
  {"valueId":"climate-change","position":1,"isSupport":true},
  {"valueId":"fair-trade","position":2,"isSupport":true},
  {"valueId":"anti-consumerism","position":2,"isSupport":true},
  {"valueId":"workers-rights","position":3,"isSupport":true}
]
```

---

### **Example 3: ExxonMobil**

**Research findings:**
- Fossil fuel production is core business (position 1, opposes climate action)
- History of climate denial (position 1, opposes climate science)
- Large political lobbying (position 2, opposes environmental regulation)

**valueAlignments:**
```json
[
  {"valueId":"climate-change","position":1,"isSupport":false},
  {"valueId":"environmental-protection","position":1,"isSupport":false},
  {"valueId":"renewable-energy","position":2,"isSupport":false}
]
```

---

### **Example 4: Chick-fil-A**

**Research findings:**
- Christian values central to brand (position 1, support)
- Historically opposed LGBTQ+ rights (position 2, oppose)
- Charitable giving (position 2, support)
- Family-focused messaging (position 3, support)

**valueAlignments:**
```json
[
  {"valueId":"christianity","position":1,"isSupport":true},
  {"valueId":"lgbtq-rights","position":2,"isSupport":false},
  {"valueId":"charity","position":2,"isSupport":true},
  {"valueId":"family-values","position":3,"isSupport":true}
]
```

---

## 💡 Tips for Efficient Data Entry

### **Start Small**

Don't try to add all 764 brands at once. Start with:
1. Top 10 most popular brands
2. Test the scoring algorithm
3. Add more brands gradually

### **Focus on Key Values**

You don't need to list every possible value. Focus on:
- 5-10 most important values per brand
- Values that users actually care about
- Values where brand has clear stance

### **Use Templates**

Create templates for common brand types:

**Tech Company Template:**
```json
[
  {"valueId":"privacy","position":X,"isSupport":true/false},
  {"valueId":"workers-rights","position":X,"isSupport":true/false},
  {"valueId":"climate-change","position":X,"isSupport":true/false},
  {"valueId":"innovation","position":X,"isSupport":true}
]
```

**Energy Company Template:**
```json
[
  {"valueId":"climate-change","position":X,"isSupport":true/false},
  {"valueId":"environmental-protection","position":X,"isSupport":true/false},
  {"valueId":"renewable-energy","position":X,"isSupport":true/false}
]
```

### **Batch Similar Brands**

Group similar brands and use similar structures:
- All oil companies: Similar patterns around climate/environment
- All tech companies: Similar patterns around privacy/data
- All fast food: Similar patterns around health/workers

---

## 🔍 Validation Checklist

Before finalizing your data, check:

- [ ] All valueId values match IDs from your Causes sheet
- [ ] All positions are between 1-10
- [ ] All isSupport values are true or false (not strings)
- [ ] JSON is valid (use https://jsonlint.com/)
- [ ] No trailing commas
- [ ] Quotes are straight ("") not curly ("")
- [ ] At least 3-5 value alignments per brand

---

## 🚀 Testing Your Data

After adding data:

1. **Test fetch:**
   ```bash
   npm run test-sheets
   ```

2. **Check for errors:**
   - "Failed to parse JSON" → Fix JSON syntax
   - No brands showing → Check required columns (A, B)

3. **Test scoring:**
   - Run app
   - Select some values
   - See if brands appear in aligned/unaligned sections

---

## 📞 Need Help?

Common issues:

| Issue | Solution |
|-------|----------|
| "Failed to parse JSON" | Use JSON validator, check quotes/commas |
| No scores showing | Check that valueAlignments has valid data |
| Wrong scores | Verify positions (1-10) and isSupport (true/false) |
| valueId not recognized | Make sure it matches Causes sheet exactly |

---

**Ready to populate your data? Start with 5 brands and test!** 🎯
