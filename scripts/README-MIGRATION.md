# Money Flow Data Migration

This script converts old Firebase money flow format to the new array format.

## Why migrate?

Currently, the app converts data on every load (763 brands × every page view = wasteful). A one-time migration is much more efficient.

## Old vs New Format

**Old format (individual fields):**
```
affiliate1: "Doug McMillon"
$affiliate1: "$50M (CEO stake)"
Partnership1: "OpenAI (ChatGPT Shopping/2025)"
ownership1: "Walton Family (~46%)"
```

**New format (arrays):**
```javascript
affiliates: [
  {name: "Doug McMillon", relationship: "$50M (CEO stake)"}
]
partnerships: [
  {name: "OpenAI", relationship: "ChatGPT Shopping/2025"}
]
ownership: [
  {name: "Walton Family", relationship: "~46%"}
]
```

## How to Run

### Prerequisites

1. Make sure you have the Firebase environment variables set in `.env`
2. Install tsx if not already installed: `npm install -g tsx`

### Run the migration

```bash
npx tsx scripts/migrate-money-flow.ts
```

### What it does

1. Reads all brands from Firebase
2. For each brand:
   - Checks if already migrated (skips if so)
   - Converts `affiliate1`-`affiliate20` + `$affiliate1`-`$affiliate20` → `affiliates` array
   - Converts `Partnership1`-`Partnership20` → `partnerships` array
   - Converts `ownership1`-`ownership20` → `ownership` array
   - Converts `ownership Sources` → `ownershipSources`
   - Deletes old numbered fields
3. Shows progress and summary

### Expected output

```
🚀 Starting money flow migration...

📊 Found 763 brands to process

🔄 Walmart:
   - Converting 5 affiliates
   - Converting 5 partnerships
   - Converting 5 ownership entries
   ✅ Migrated successfully

⏭️  Apple: Already migrated (has affiliates array)

...

==================================================
📈 Migration Summary:
   ✅ Migrated: 700
   ⏭️  Skipped: 63
   ❌ Errors: 0
   📊 Total: 763
==================================================

🎉 Migration completed successfully!
💡 Next step: Remove conversion code from dataService.ts
```

## After Migration

Once all brands are migrated, you can:

1. Remove the conversion logic from `services/firebase/dataService.ts`
2. The app will be faster (no conversion on every load)
3. All data will be in consistent format

## Safety

- The script is **idempotent** - safe to run multiple times
- Already-migrated brands are skipped
- No data is deleted until new format is successfully written
- Old fields are only deleted after successful migration
