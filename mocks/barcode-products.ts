import { MOCK_PRODUCTS } from './products';
import productsData from './products-data.json';

export interface BarcodeProductInfo {
  productName: string;
  brandName: string;
  imageUrl?: string;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProductInfo | null> {
  try {
    console.log('🔍 Looking up barcode:', barcode);
    
    const response = await fetch(
      `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=ngjwwqztwz7ruj29emgvbfubtdmqea`
    );
    
    console.log('📡 API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Barcode Lookup API error:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('📦 API Response data:', JSON.stringify(data, null, 2));
    
    if (!data.products || data.products.length === 0) {
      console.log('⚠️ Product not found in Barcode Lookup');
      return null;
    }
    
    const product = data.products[0];
    console.log('✅ Found product:', {
      title: product.title,
      brand: product.brand,
      manufacturer: product.manufacturer,
      product_name: product.product_name
    });
    
    return {
      productName: product.title || product.product_name || 'Unknown Product',
      brandName: product.brand || product.manufacturer || 'Unknown Brand',
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined,
    };
  } catch (error) {
    console.error('💥 Error looking up barcode:', error);
    return null;
  }
}

function normalizeBrandName(brand: string): string {
  let normalized = brand.toLowerCase();

  // Remove leading articles first
  normalized = normalized.replace(/^(the|a|an)\s+/i, '');

  // Remove special characters but keep spaces
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');

  // Remove common company suffixes (after special chars are gone)
  const suffixes = [
    'company', 'companies', 'corporation', 'corp', 'incorporated', 'inc',
    'limited', 'ltd', 'llc', 'plc', 'group', 'international',
    'global', 'brands', 'holdings', 'enterprises', 'industries', 'co'
  ];

  // Remove suffixes at the end (more flexible matching)
  for (const suffix of suffixes) {
    const regex = new RegExp(`\\s+${suffix}(\\s+|$)`, 'gi');
    normalized = normalized.replace(regex, ' ');
  }

  // Clean up extra spaces and trim
  normalized = normalized
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

function matchBrand(scannedBrand: string, dbBrand: string): boolean {
  const normalized1 = normalizeBrandName(scannedBrand);
  const normalized2 = normalizeBrandName(dbBrand);

  console.log('🔍 Comparing brands:', {
    scanned: scannedBrand,
    db: dbBrand,
    normalized1,
    normalized2
  });

  // Exact match after normalization
  if (normalized1 === normalized2) {
    console.log('✅ Exact match found');
    return true;
  }

  // Substring match
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    console.log('✅ Substring match found');
    return true;
  }

  // Word-based match - check if significant words overlap
  const words1 = normalized1.split(' ').filter(w => w.length > 3);
  const words2 = normalized2.split(' ').filter(w => w.length > 3);

  // If at least 2 significant words match, or 1 word matches and it's the primary word
  const matchingWords = words1.filter(w1 => words2.includes(w1));

  if (matchingWords.length >= 2) {
    console.log('✅ Multiple word match found:', matchingWords);
    return true;
  }

  if (matchingWords.length === 1 && (matchingWords[0] === words1[0] || matchingWords[0] === words2[0])) {
    console.log('✅ Primary word match found:', matchingWords[0]);
    return true;
  }

  console.log('❌ No match found');
  return false;
}

export function findBrandInDatabase(brandName: string): string | null {
  const normalizedBrand = normalizeBrandName(brandName);
  console.log('🔎 Searching for brand:', normalizedBrand);
  
  const allBrands = new Set<string>();
  Object.values(productsData).forEach((value: any) => {
    if (value.support) value.support.forEach((b: string) => allBrands.add(b));
    if (value.oppose) value.oppose.forEach((b: string) => allBrands.add(b));
  });
  
  console.log('📚 Total brands in database:', allBrands.size);
  console.log('📋 Sample brands:', Array.from(allBrands).slice(0, 10));
  
  for (const brand of allBrands) {
    if (matchBrand(brandName, brand)) {
      console.log('✅ Found match:', brand);
      return brand;
    }
  }
  
  console.log('❌ No brand match found for:', brandName);
  return null;
}

export function getBrandProduct(brandName: string): any {
  const product = MOCK_PRODUCTS.find(
    p => normalizeBrandName(p.brand) === normalizeBrandName(brandName)
  );
  
  return product || null;
}
