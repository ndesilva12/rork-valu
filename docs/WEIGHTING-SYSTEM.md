# Value Weighting System

The Stand App now supports **weighted alignment scoring**, allowing you to fine-tune which values matter most when calculating alignment between users and businesses.

## Overview

By default, all values are weighted equally (weight = 1.0). This means a match or conflict on "Abortion" has the same impact as "Taylor Swift" in the alignment score.

With weighting, you can:
- Make **social issues** count twice as much as celebrity opinions
- Make **gun rights** 3x more important than other values
- Reduce the impact of **person** category to 50% importance
- Quickly adjust entire categories or individual values

## How It Works

### Current Scoring Algorithm

The alignment score is calculated based on **overlapping positions** (where both user and business have a stance):

```
Score = (weighted_matches / (weighted_matches + weighted_conflicts)) * 100
```

**Without weighting:**
- User supports: Gun Rights, Climate Change, LGBTQ+
- Business supports: Gun Rights, Climate Change
- Business avoids: LGBTQ+
- Result: 2 matches + 1 conflict = 66.67 score

**With weighting (social_issue = 2.0):**
- Gun Rights match: 2.0 points (weighted)
- Climate Change match: 2.0 points (weighted)
- LGBTQ+ conflict: 2.0 points (weighted)
- Result: 4.0 / (4.0 + 2.0) = 66.67 score (same, all same category)

**With weighting (Gun Rights = 3.0, others = 1.0):**
- Gun Rights match: 3.0 points
- Climate Change match: 1.0 points
- LGBTQ+ conflict: 1.0 points
- Result: 4.0 / (4.0 + 1.0) = 80 score (Gun Rights match weighted heavily)

## Configuration

All weights are configured in: `config/valueWeights.ts`

### 1. Category Weights

Adjust entire categories at once:

```typescript
export const CATEGORY_WEIGHTS: Record<CauseCategory, number> = {
  social_issue: 2.0,  // Social issues count 2x
  ideology: 1.5,      // Ideologies count 1.5x
  religion: 1.5,      // Religion counts 1.5x
  person: 0.5,        // Celebrities count half
  nation: 1.0,        // Standard weight
  organization: 1.0,  // Standard weight
  corporation: 1.0,   // Standard weight
};
```

### 2. Individual Value Weights

Override specific values:

```typescript
export const INDIVIDUAL_WEIGHTS: Record<string, number> = {
  'abortion': 3.0,        // Abortion 3x as important
  'gun-rights': 3.0,      // Gun rights 3x as important
  'climate-change': 2.0,  // Climate 2x as important
  'donald-trump': 0.3,    // Trump opinions barely matter
  'taylor-swift': 0.1,    // Celebrity opinions very low
};
```

**Priority:** Individual weights override category weights.

## Usage Examples

### Example 1: Focus on Social Issues

Make social issues matter most, reduce celebrity influence:

```typescript
CATEGORY_WEIGHTS.social_issue = 2.0;
CATEGORY_WEIGHTS.person = 0.3;
```

**Result:** Matching on "Abortion" counts 6.7x more than matching on "Elon Musk" (2.0 vs 0.3).

### Example 2: Hot Button Issues

Make specific controversial issues extremely important:

```typescript
INDIVIDUAL_WEIGHTS['abortion'] = 5.0;
INDIVIDUAL_WEIGHTS['gun-rights'] = 5.0;
INDIVIDUAL_WEIGHTS['climate-change'] = 4.0;
```

**Result:** These three issues dominate the score. If users match on these, they'll score high even with conflicts elsewhere.

### Example 3: De-emphasize Celebrities

Make people/celebrity matches barely matter:

```typescript
CATEGORY_WEIGHTS.person = 0.2;
```

**Result:** All person-related matches/conflicts count at 20% importance.

### Example 4: State Pride

Make geographic alignment matter more:

```typescript
CATEGORY_WEIGHTS.nation = 2.0;

// Or specific states:
INDIVIDUAL_WEIGHTS['massachusetts'] = 3.0;
INDIVIDUAL_WEIGHTS['texas'] = 3.0;
```

## Preset Configurations

The system includes preset functions for common scenarios:

```typescript
import {
  applyFocusSocialIssues,
  applyFocusPeople,
  applyFocusBeliefs,
  applyEqualWeights
} from '@/config/valueWeights';

// Apply preset
applyFocusSocialIssues();

// Reset to equal
applyEqualWeights();
```

### Available Presets:

1. **`applyFocusSocialIssues()`**
   - Social issues: 2.0x
   - People: 0.5x
   - Use case: Policy-focused matching

2. **`applyFocusPeople()`**
   - People: 1.5x
   - Organizations: 1.5x
   - Social issues: 0.8x
   - Use case: Influencer/celebrity-focused matching

3. **`applyFocusBeliefs()`**
   - Ideology: 2.0x
   - Religion: 2.0x
   - People: 0.5x
   - Use case: Core values matching

4. **`applyEqualWeights()`**
   - Resets everything to 1.0

## Current Configuration

**As of now, all weights are set to 1.0 (equal importance).**

To adjust:
1. Edit `config/valueWeights.ts`
2. Change `CATEGORY_WEIGHTS` or `INDIVIDUAL_WEIGHTS`
3. Save - changes take effect immediately (no restart needed)

## Testing Weight Changes

To test different weight configurations:

1. **Check current scores** for a few user/business pairs
2. **Adjust weights** in `config/valueWeights.ts`
3. **Reload the app** (weights are imported at runtime)
4. **Compare new scores** for same pairs

### Example Test:

```typescript
// Before (all 1.0):
// User A + Business B = Score 65

// After (social_issue = 2.0):
CATEGORY_WEIGHTS.social_issue = 2.0;
// User A + Business B = Score 72 (if they match on social issues)
```

## Best Practices

### Start Conservative
- Begin with small adjustments (1.5x or 0.5x)
- Test with real user data
- Avoid extreme weights (10.0) unless intentional

### Balance Categories
- If you increase one category, consider decreasing another
- Total weight doesn't matter (it's a ratio), but balance improves interpretation

### Document Changes
- Add comments explaining why specific weights were chosen
- Track weight changes over time
- A/B test different configurations

### Monitor Impact
- Check alignment score distributions before/after
- Ensure scores still range from 0-100 appropriately
- Watch for unintended consequences (all scores bunching up)

## Technical Details

### Weight Resolution Priority

1. **Individual weight** (if specified in `INDIVIDUAL_WEIGHTS`)
2. **Category weight** (from `CATEGORY_WEIGHTS`)
3. **Default weight** (1.0)

### Score Calculation

```typescript
// For each overlapping value:
const weight = getValueWeight(valueId, category);

if (match) {
  weightedMatches += weight;
} else if (conflict) {
  weightedConflicts += weight;
}

// Final score:
score = (weightedMatches / (weightedMatches + weightedConflicts)) * 100
```

### Edge Cases

- **No overlaps:** Returns 50 (neutral) regardless of weights
- **All weights 0:** Would return NaN, but this is prevented by default weight
- **Negative weights:** Possible but not recommended (inverts scoring logic)

## Future Enhancements

Potential additions:
- **User-configurable weights** (let users set their own priorities)
- **Dynamic weights** based on context (location-based, time-based)
- **Machine learning** to determine optimal weights
- **Admin UI** for adjusting weights without code changes

## Questions?

The weighting system is designed to be simple and intuitive:
- Higher number = more important
- Lower number = less important
- 1.0 = standard importance

Experiment with different configurations to find what works best for your use case!
