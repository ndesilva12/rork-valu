# Data Source Files

This directory contains the CSV source files for the Valu app's brand and values data.

## Files

### `brands.csv`
Contains brand information with the following columns:
- `id`: Unique brand identifier
- `name`: Brand name
- `category`: Brand category (e.g., "Technology", "Apparel & Footwear")
- `imageUrl`: URL to brand logo
- `description`: Brief description of the brand
- `website`: Brand website URL
- `affiliate1`, `$affiliate1`, `affiliate2`, `$affiliate2`, etc.: Up to 5 affiliates and their relationships

### `values.csv`
Contains the values matrix mapping brands to values with the following columns:
- `id`: Value identifier (e.g., "climate-change", "liberal", "conservative")
- `name`: Value display name
- `type`: Either "support" or "oppose"
- `brandName`: The brand name that supports or opposes this value

## Converting to JSON

After updating the CSV files, run the converter to generate JSON files:

```bash
node scripts/csv-to-json.mjs
```

This will generate:
- `data/brands.json`: Brand data used by the app
- `data/values.json`: Values matrix used for scoring

## Data Format Examples

### brands.csv
```csv
id,name,category,imageUrl,description,website,affiliate1,$affiliate1,affiliate2,$affiliate2
1,Nike,Apparel,https://logo.clearbit.com/nike.com,Athletic company,https://nike.com,LeBron James,Brand Ambassador,Colin Kaepernick,Sponsorship
```

### values.csv
```csv
id,name,type,brandName
climate-change,Climate Change,support,Tesla
climate-change,Climate Change,oppose,ExxonMobil
liberal,Liberal,support,Nike
```
