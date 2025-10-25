# Value-Centric Data Entry Guide

## 🎯 Critical Requirement

**Each value MUST have exactly:**
- **10 aligned brands** (positions 1-10, where 1 = strongest support)
- **10 unaligned brands** (positions 1-10, where 1 = strongest opposition)

This ensures that if a user selects only ONE value, they still see a full set of 10 aligned and 10 unaligned brands.

---

## 📋 Data Entry Process (Value-First Approach)

### **Step 1: Work Value-by-Value**

Instead of filling out brands one-by-one, work through each value:

1. Pick one value (e.g., "Privacy")
2. Find the top 10 brands that **support** privacy (rank 1-10)
3. Find the top 10 brands that **oppose** privacy (rank 1-10)
4. Add these alignments to each brand's row
5. Move to next value

### **Step 2: For Each Value, Create Two Lists**

**Example: Privacy**

**Top 10 Supporters (Aligned):**
1. Signal (position 1 - strongest)
2. ProtonMail (position 2)
3. Apple (position 3)
4. DuckDuckGo (position 4)
5. Brave (position 5)
6. Tutanota (position 6)
7. Mozilla (position 7)
8. Telegram (position 8)
9. Wickr (position 9)
10. Session (position 10 - weakest aligned)

**Top 10 Opponents (Unaligned):**
1. Meta/Facebook (position 1 - strongest opposition)
2. TikTok (position 2)
3. Google (position 3)
4. Amazon (position 4)
5. Microsoft (position 5)
6. Twitter/X (position 6)
7. LinkedIn (position 7)
8. Snapchat (position 8)
9. Instagram (position 9)
10. WhatsApp (position 10 - weakest opposition)

### **Step 3: Add to Each Brand's valueAlignments**

Now for each brand in your lists, add the value alignment to Column N:

**Signal (Column N):**
```json
[
  {"valueId":"privacy","position":1,"isSupport":true}
]
```

**Meta/Facebook (Column N):**
```json
[
  {"valueId":"privacy","position":1,"isSupport":false}
]
```

**Apple (Column N):**
```json
[
  {"valueId":"privacy","position":3,"isSupport":true}
]
```

### **Step 4: Repeat for All Values**

Go through each value in your Causes sheet and repeat this process.

**After processing multiple values, a brand might look like:**

**Apple (Column N):**
```json
[
  {"valueId":"privacy","position":3,"isSupport":true},
  {"valueId":"climate-change","position":5,"isSupport":true},
  {"valueId":"workers-rights","position":7,"isSupport":true},
  {"valueId":"right-to-repair","position":2,"isSupport":false}
]
```

This means:
- Apple is #3 privacy supporter (among privacy's top 10)
- Apple is #5 climate supporter (among climate's top 10)
- Apple is #7 workers' rights supporter (among workers' rights top 10)
- Apple is #2 right-to-repair opponent (among right-to-repair's top 10)

---

## 📊 Recommended Workflow

### **Create a Planning Spreadsheet**

Use a separate Google Sheet or Excel file to plan before entering data:

**Sheet 1: Privacy**
| Rank | Aligned Brand | Notes | Unaligned Brand | Notes |
|------|---------------|-------|-----------------|-------|
| 1 | Signal | End-to-end encryption core | Meta/Facebook | Data collection business model |
| 2 | ProtonMail | Zero-access encryption | TikTok | Extensive data harvesting |
| 3 | Apple | Privacy marketing focus | Google | Ad-based revenue |
| 4 | DuckDuckGo | No tracking search | Amazon | Surveillance capitalism |
| 5 | Brave | Privacy-first browser | Microsoft | Data collection practices |
| 6 | Tutanota | Encrypted email | Twitter/X | User tracking |
| 7 | Mozilla | Privacy advocacy | LinkedIn | Data broker practices |
| 8 | Telegram | Secret chats | Snapchat | Location tracking |
| 9 | Wickr | Secure messaging | Instagram | Ad targeting |
| 10 | Session | Decentralized messaging | WhatsApp | Metadata collection |

**Sheet 2: Climate Change**
| Rank | Aligned Brand | Notes | Unaligned Brand | Notes |
|------|---------------|-------|-----------------|-------|
| 1 | Patagonia | 1% for Planet, activism | ExxonMobil | Fossil fuel production |
| 2 | Tesla | Electric vehicles | Chevron | Oil & gas |
| 3 | Beyond Meat | Plant-based protein | Shell | Petroleum |
| 4 | Allbirds | Carbon-neutral shoes | BP | Fossil fuels |
| 5 | Seventh Generation | Sustainable products | ConocoPhillips | Oil drilling |
| ... | ... | ... | ... | ... |

---

## 🔢 Example: Complete Value Coverage

Let's say you have 97 values in your Causes sheet. For each value:

**Value 1: Privacy**
- 10 aligned brands (positions 1-10)
- 10 unaligned brands (positions 1-10)
- **Total: 20 brands have privacy in their valueAlignments**

**Value 2: Climate Change**
- 10 aligned brands (positions 1-10)
- 10 unaligned brands (positions 1-10)
- **Total: 20 brands have climate-change in their valueAlignments**

**... and so on for all 97 values**

**Result:**
- Total brand-value relationships: 97 values × 20 brands = **1,940 alignments**
- Many brands will appear across multiple values
- Example: Apple might be in privacy (aligned #3), climate (aligned #5), workers-rights (aligned #7), right-to-repair (unaligned #2)

---

## ✅ Data Validation Checklist

After completing data entry, verify:

### **For Each Value:**
- [ ] Exactly 10 brands have `isSupport: true` for this valueId
- [ ] Positions 1-10 are used exactly once for aligned brands
- [ ] Exactly 10 brands have `isSupport: false` for this valueId
- [ ] Positions 1-10 are used exactly once for unaligned brands
- [ ] No duplicate positions (two brands can't both be position 5 aligned)

### **For Each Brand:**
- [ ] valueAlignments is valid JSON
- [ ] Each valueId appears only once in the array
- [ ] Positions are 1-10
- [ ] isSupport is true or false (boolean)

---

## 🛠️ Validation Script

I'll create a script you can run to validate your data follows the 10+10 rule:

```bash
npm run validate-value-data
```

This will check:
- ✅ Each value has exactly 10 aligned brands
- ✅ Each value has exactly 10 unaligned brands
- ✅ Positions 1-10 are properly distributed
- ✅ No duplicate positions per value
- ⚠️ Warning if any value is missing brands

---

## 💡 Tips for Efficient Data Entry

### **1. Start with Most Important Values**

Don't try to do all 97 values at once. Prioritize:
- Most commonly selected values
- Most polarizing values (clear aligned/unaligned brands)
- Values with obvious brand examples

### **2. Research Sources**

For each value, research:
- **Corporate reports:** CSR reports, sustainability reports, DEI reports
- **Third-party ratings:** B-Corp, Fair Trade, Climate Pledge
- **News/controversies:** Major scandals or achievements
- **Certifications:** Organic, Carbon Neutral, etc.
- **Advocacy groups:** Which brands do they endorse/boycott?

### **3. Use Templates by Industry**

Create templates for common patterns:

**Privacy Value Template:**
- Aligned: Privacy-focused tech, encrypted messaging, VPN services
- Unaligned: Ad-tech, social media, data brokers

**Climate Value Template:**
- Aligned: Renewable energy, electric vehicles, carbon-neutral brands
- Unaligned: Fossil fuel companies, high-emission industries

**Workers Rights Template:**
- Aligned: Fair Trade certified, unionized companies, B-Corps
- Unaligned: Fast fashion, gig economy platforms, union-busting companies

### **4. Batch Similar Values**

Group related values and research together:
- Environmental values: Climate change, environmental protection, renewable energy
- Social justice: LGBTQ+ rights, racial justice, gender equality
- Economic: Workers' rights, fair trade, income equality
- Political: Gun rights, immigration, healthcare

---

## 📋 Step-by-Step Example

Let's walk through entering data for "Privacy" value:

### **Research Phase**

1. **Aligned brands research:**
   - Signal: End-to-end encryption by default
   - ProtonMail: Zero-access encryption
   - Apple: "Privacy is a human right" campaigns
   - DuckDuckGo: No tracking business model
   - ... (research 6 more)

2. **Unaligned brands research:**
   - Meta: Cambridge Analytica scandal, ad targeting
   - TikTok: Extensive data collection
   - Google: Ad-based business model
   - Amazon: Alexa privacy concerns
   - ... (research 6 more)

### **Ranking Phase**

Rank each list 1-10 based on:
- Strength of position (how central to business model?)
- Consistency (do they always align or just sometimes?)
- Impact (how much influence do they have?)
- Authenticity (genuine or greenwashing?)

### **Data Entry Phase**

For each of the 20 brands, find their row in Google Sheets:

**Signal (Row X, Column N):**
```json
[{"valueId":"privacy","position":1,"isSupport":true}]
```

**Meta (Row Y, Column N):**
```json
[{"valueId":"privacy","position":1,"isSupport":false}]
```

... repeat for all 20 brands

### **Validation Phase**

Check:
- ✅ 10 brands with privacy + isSupport:true
- ✅ 10 brands with privacy + isSupport:false
- ✅ Positions 1-10 used once each for aligned
- ✅ Positions 1-10 used once each for unaligned

---

## 🚨 Common Mistakes to Avoid

### **Mistake 1: Not Using All Positions**

❌ **Wrong:**
```
Aligned: 5 brands at position 1, 3 brands at position 5, 2 brands at position 10
```

✅ **Correct:**
```
Aligned: 1 brand at each position from 1-10
```

### **Mistake 2: Duplicate Positions**

❌ **Wrong:**
```json
// Brand A
{"valueId":"privacy","position":3,"isSupport":true}

// Brand B
{"valueId":"privacy","position":3,"isSupport":true}
```

✅ **Correct:**
```json
// Brand A
{"valueId":"privacy","position":3,"isSupport":true}

// Brand B
{"valueId":"privacy","position":4,"isSupport":true}
```

### **Mistake 3: Missing Values**

If you have 97 values, you need 97 × 20 = 1,940 total alignments. Missing even one value means users who select only that value won't see any brands!

---

## 📈 Progress Tracking

Track your progress:

```
Values Completed: __ / 97

Top Priority Values:
[ ] Privacy (20 brands)
[ ] Climate Change (20 brands)
[ ] Workers' Rights (20 brands)
[ ] LGBTQ+ Rights (20 brands)
[ ] Racial Justice (20 brands)

Medium Priority:
[ ] Gun Rights (20 brands)
[ ] Immigration (20 brands)
...

Low Priority:
[ ] ... (20 brands each)
```

---

## 🎯 Quick Start: Test with One Value

Want to test the system before doing all 97 values?

**Pick ONE value (e.g., "privacy") and populate its 20 brands:**

1. Find top 10 privacy supporters
2. Find top 10 privacy opponents
3. Add alignments to those 20 brands' Column N
4. Run validation script
5. Test in app: Select ONLY privacy value, should see 10 aligned + 10 unaligned

If this works, continue with remaining 96 values!

---

**Ready to start? Begin with your most important value!** 🚀
