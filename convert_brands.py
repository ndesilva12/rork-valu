#!/usr/bin/env python3
"""
Convert brands.csv to brands.json with proper structure for money flow visualization
"""
import csv
import json
import sys

def parse_csv_to_json(csv_path, json_path):
    brands = []

    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            # Skip empty rows
            if not row.get('id') or not row.get('name'):
                continue

            # Build affiliates array
            affiliates = []
            for i in range(1, 6):
                affiliate_name = row.get(f'affiliate{i}', '').strip()
                affiliate_value = row.get(f'$affiliate{i}', '').strip()
                if affiliate_name:
                    affiliates.append({
                        'name': affiliate_name,
                        'relationship': affiliate_value if affiliate_value else 'Undisclosed'
                    })

            # Build ownership array
            ownership = []
            for i in range(1, 6):
                owner_name = row.get(f'ownership{i}', '').strip()
                if owner_name:
                    ownership.append({
                        'name': owner_name,
                        'relationship': row.get(f'ownership{i}', '').split('(')[1].split(')')[0] if '(' in owner_name else owner_name.split('(~')[-1].replace(')', '') if '(~' in owner_name else 'Undisclosed'
                    })

            # Parse ownership more carefully
            ownership = []
            for i in range(1, 6):
                owner_data = row.get(f'ownership{i}', '').strip()
                if owner_data:
                    # Try to parse "Name (~percentage%)" format
                    if '(~' in owner_data:
                        parts = owner_data.split('(~')
                        name = parts[0].strip()
                        relationship = '~' + parts[1].replace(')', '').strip()
                    elif '(' in owner_data and ')' in owner_data:
                        parts = owner_data.rsplit('(', 1)
                        name = parts[0].strip()
                        relationship = parts[1].replace(')', '').strip()
                    else:
                        name = owner_data
                        relationship = 'Undisclosed'

                    ownership.append({
                        'name': name,
                        'relationship': relationship
                    })

            # Build partnerships array
            partnerships = []
            for i in range(1, 6):
                partnership_data = row.get(f'Partnership{i}', '').strip()
                if partnership_data:
                    # Parse "Partner Name (Description/Year)" format
                    if '(' in partnership_data and ')' in partnership_data:
                        parts = partnership_data.rsplit('(', 1)
                        name = parts[0].strip()
                        relationship = parts[1].replace(')', '').strip()
                    else:
                        name = partnership_data
                        relationship = 'Partnership'

                    partnerships.append({
                        'name': name,
                        'relationship': relationship
                    })

            # Build the brand object
            brand = {
                'id': row.get('id', '').strip(),
                'name': row.get('name', '').strip(),
                'category': row.get('category', '').strip(),
                'description': row.get('description', '').strip(),
                'website': row.get('website', '').strip(),
                'affiliates': affiliates,
                'ownership': ownership,
                'ownershipSources': row.get('ownership Sources', '').strip(),
                'partnerships': partnerships,
                'partnershipSources': row.get('Partnership Sources', '').strip(),
                'location': row.get('Headquarters Location', '').strip(),
                # Note: latitude and longitude would need geocoding - skipping for now
                # They can be added later via a geocoding service
            }

            brands.append(brand)

    # Write to JSON file
    with open(json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(brands, jsonfile, indent=2, ensure_ascii=False)

    print(f"✓ Converted {len(brands)} brands from {csv_path} to {json_path}")
    return brands

if __name__ == '__main__':
    csv_path = '/home/user/rork-valu/data-src/brands.csv'
    json_path = '/home/user/rork-valu/data/brands.json'

    try:
        brands = parse_csv_to_json(csv_path, json_path)
        print(f"\nSample brand entry:")
        print(json.dumps(brands[0], indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
