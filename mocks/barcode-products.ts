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
  return brand
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchBrand(scannedBrand: string, dbBrand: string): boolean {
  const normalized1 = normalizeBrandName(scannedBrand);
  const normalized2 = normalizeBrandName(dbBrand);
  
  if (normalized1 === normalized2) return true;
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  
  return words1.some(w1 => words2.some(w2 => w1 === w2 && w1.length > 3));
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
