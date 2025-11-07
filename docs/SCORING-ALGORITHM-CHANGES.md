# Alignment Scoring Algorithm - Before & After Examples

## 🔴 OLD Algorithm Problem

**Gave +1 point when only ONE party had an opinion** - This inflated scores!

## ✅ NEW Algorithm Solution

**ONLY counts values where BOTH have opinions** - Focuses on actual alignment/conflict

---

## Example 1: Truly Opposite Accounts

### User Profile:
- **Supports:** Gun Rights, Pro-Life, Lower Taxes, School Choice
- **Avoids:** Climate Action, Universal Healthcare, LGBTQ+ Rights, Immigration Reform

### Business Profile:
- **Supports:** Climate Action, Universal Healthcare, LGBTQ+ Rights, Immigration Reform
- **Avoids:** Gun Rights, Pro-Life, Lower Taxes, School Choice

### Scoring:

**OLD Algorithm:**
- Gun Rights: Conflict (-2)
- Pro-Life: Conflict (-2)
- Lower Taxes: Conflict (-2)
- School Choice: Conflict (-2)
- Climate Action: Conflict (-2)
- Universal Healthcare: Conflict (-2)
- LGBTQ+ Rights: Conflict (-2)
- Immigration Reform: Conflict (-2)
- **Total:** -16 points / 16 max = 0 points → **50 + (0/16 * 50) = Score: 50** ❌

Wait, that doesn't seem right either with the old algorithm. Let me recalculate...

Actually with old algorithm:
- 8 conflicts at -2 each = -16 points
- Max possible = 8 comparisons * 2 = 16
- Net = -16
- Score = 50 + (-16/16 * 50) = 50 - 50 = 0 ✅

**NEW Algorithm:**
- Gun Rights: Conflict
- Pro-Life: Conflict
- Lower Taxes: Conflict
- School Choice: Conflict
- Climate Action: Conflict
- Universal Healthcare: Conflict
- LGBTQ+ Rights: Conflict
- Immigration Reform: Conflict
- **Matches:** 0, **Conflicts:** 8
- **Score:** (0 / 8) * 100 = **0** ✅

---

## Example 2: The Problematic Case (This is what you reported!)

### User Profile:
- **Supports:** Gun Rights, Pro-Life, Lower Taxes
- **Avoids:** Climate Action, Universal Healthcare

### Business Profile:
- **Supports:** Climate Action, Universal Healthcare, LGBTQ+ Rights, Diversity Initiatives, Green Energy
- **Avoids:** Gun Rights, Lower Taxes

### Overlapping Positions:
- Gun Rights: User supports, Biz avoids = CONFLICT
- Pro-Life: User supports, Biz neutral = (old: +1, new: IGNORED)
- Lower Taxes: User supports, Biz avoids = CONFLICT
- Climate Action: User avoids, Biz supports = CONFLICT
- Universal Healthcare: User avoids, Biz supports = CONFLICT
- LGBTQ+ Rights: User neutral, Biz supports = (old: +1, new: IGNORED)
- Diversity: User neutral, Biz supports = (old: +1, new: IGNORED)
- Green Energy: User neutral, Biz supports = (old: +1, new: IGNORED)

**OLD Algorithm:**
- Conflicts: 4 values * -2 = -8 points
- One-sided: 4 values * +1 = +4 points
- Net: -8 + 4 = -4 points
- Max possible: 8 comparisons * 2 = 16
- Score: 50 + (-4/16 * 50) = 50 - 12.5 = **37.5 → 38** ❌ (Still pretty low actually)

Wait, let me think about this more carefully. The issue might be different than I thought. Let me consider a case where they have FEWER overlaps:

### Actually Problematic Case:

### User Profile:
- **Supports:** Gun Rights
- **Avoids:** (nothing)

### Business Profile:
- **Supports:** Climate Action, Universal Healthcare, LGBTQ+ Rights, Diversity, Green Energy, Education Funding
- **Avoids:** (nothing)

**OLD Algorithm:**
- Gun Rights: User supports, Biz neutral = +1 point
- Climate Action: User neutral, Biz supports = +1 point
- Universal Healthcare: User neutral, Biz supports = +1 point
- LGBTQ+ Rights: User neutral, Biz supports = +1 point
- Diversity: User neutral, Biz supports = +1 point
- Green Energy: User neutral, Biz supports = +1 point
- Education: User neutral, Biz supports = +1 point
- **Total:** 7 positive points, 0 negative
- Max possible: 7 comparisons * 2 = 14
- Score: 50 + (7/14 * 50) = 50 + 25 = **75** ❌ HIGH SCORE!

**NEW Algorithm:**
- Gun Rights: User has position, Biz neutral = IGNORED
- Climate Action: User neutral, Biz has position = IGNORED
- Universal Healthcare: User neutral, Biz has position = IGNORED
- LGBTQ+ Rights: User neutral, Biz has position = IGNORED
- Diversity: User neutral, Biz has position = IGNORED
- Green Energy: User neutral, Biz has position = IGNORED
- Education: User neutral, Biz has position = IGNORED
- **Matches:** 0, **Conflicts:** 0, **Total comparisons:** 0
- **Score:** 50 (neutral - no overlap) ✅ CORRECT!

---

## Example 3: Good Alignment

### User Profile:
- **Supports:** Climate Action, Universal Healthcare, LGBTQ+ Rights
- **Avoids:** Gun Rights, Lower Taxes

### Business Profile:
- **Supports:** Climate Action, Universal Healthcare, LGBTQ+ Rights, Green Energy
- **Avoids:** Gun Rights, Lower Taxes, Fossil Fuels

**Overlapping Positions:**
- Climate Action: Both support = MATCH ✅
- Universal Healthcare: Both support = MATCH ✅
- LGBTQ+ Rights: Both support = MATCH ✅
- Gun Rights: Both avoid = MATCH ✅
- Lower Taxes: Both avoid = MATCH ✅
- Green Energy: User neutral, Biz supports = IGNORED
- Fossil Fuels: User neutral, Biz avoids = IGNORED

**OLD Algorithm:**
- 5 matches * +2 = +10 points
- 2 one-sided * +1 = +2 points
- Total: +12 points / 14 max = 85.7 → **86** ✅

**NEW Algorithm:**
- **Matches:** 5, **Conflicts:** 0
- **Score:** (5 / 5) * 100 = **100** ✅ PERFECT!

---

## Example 4: Mixed Bag

### User Profile:
- **Supports:** Gun Rights, Climate Action, Universal Healthcare
- **Avoids:** Abortion Rights

### Business Profile:
- **Supports:** Climate Action, Universal Healthcare, Abortion Rights
- **Avoids:** Gun Rights

**Overlapping Positions:**
- Gun Rights: User supports, Biz avoids = CONFLICT ❌
- Climate Action: Both support = MATCH ✅
- Universal Healthcare: Both support = MATCH ✅
- Abortion Rights: User avoids, Biz supports = CONFLICT ❌

**OLD Algorithm:**
- 2 matches * +2 = +4 points
- 2 conflicts * -2 = -4 points
- Net: 0 / 8 max = 0
- Score: 50 + 0 = **50** ✅

**NEW Algorithm:**
- **Matches:** 2, **Conflicts:** 2
- **Score:** (2 / 4) * 100 = **50** ✅

---

## Summary of Changes

### OLD Algorithm Issues:
1. ✅ Gave +1 for "one sided" positions
2. ✅ This made accounts with many non-overlapping selections score HIGH
3. ✅ Example: 75 score when they had ZERO actual overlap!

### NEW Algorithm Fixes:
1. ✅ IGNORES values where only one party has an opinion
2. ✅ ONLY scores actual overlaps (both have positions)
3. ✅ Score = % of matches out of all overlaps
4. ✅ No overlap at all = 50 (neutral)
5. ✅ All matches = 100
6. ✅ All conflicts = 0
7. ✅ 50/50 mix = 50

### Expected Score Ranges Now:
- **90-100:** Very strong alignment (most overlaps match)
- **70-89:** Good alignment (more matches than conflicts)
- **51-69:** Slight alignment (a bit more matches)
- **50:** Neutral (no overlap, or equal matches/conflicts)
- **31-49:** Slight misalignment (more conflicts)
- **11-30:** Poor alignment (mostly conflicts)
- **0-10:** Complete opposition (almost all conflicts)

The "eye test" should now match the scores much better!
