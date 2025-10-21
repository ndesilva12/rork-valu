import { Product } from '@/types';
import { generateProducts } from './generate-products';

export const MOCK_PRODUCTS: Product[] = generateProducts();

export function searchProducts(query: string, userCauses: string[]): Product[] {
  const lowerQuery = query.toLowerCase();
  
  const filtered = MOCK_PRODUCTS.filter(
    product =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.brand.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery)
  );

  return filtered.sort((a, b) => {
    const aRelevance = calculateRelevance(a, userCauses);
    const bRelevance = calculateRelevance(b, userCauses);
    return bRelevance - aRelevance;
  });
}

function calculateRelevance(product: Product, userCauses: string[]): number {
  if (userCauses.length === 0) return Math.abs(product.alignmentScore);
  
  const hasMatchingCause = product.relatedValues.some(v => userCauses.includes(v));
  
  if (hasMatchingCause) {
    return Math.abs(product.alignmentScore) + 100;
  }
  
  return Math.abs(product.alignmentScore);
}
