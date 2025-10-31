import { ValuCodeCustomer } from '@/types';
import { AVAILABLE_VALUES } from './causes';

/**
 * Generate mock valu code customer data for business accounts
 * This simulates customers who have used valu codes at the business
 */

const CUSTOMER_FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Sofia', 'Jackson', 'Avery',
  'Sebastian', 'Ella', 'Jack', 'Scarlett', 'Aiden', 'Grace', 'Owen', 'Chloe',
];

const CUSTOMER_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
];

/**
 * Generate a realistic customer name
 */
function generateCustomerName(): string {
  const firstName = CUSTOMER_FIRST_NAMES[Math.floor(Math.random() * CUSTOMER_FIRST_NAMES.length)];
  const lastName = CUSTOMER_LAST_NAMES[Math.floor(Math.random() * CUSTOMER_LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Generate a random date within the last N days
 */
function generateRecentDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

/**
 * Select random values for a customer, weighted towards certain popular values
 */
function generateCustomerValues(count: number = 5): string[] {
  // Get available value IDs by flattening the AVAILABLE_VALUES object
  const allValueIds = Object.values(AVAILABLE_VALUES)
    .flat()
    .map(v => v.id);

  // Shuffle and take the first 'count' values
  const shuffled = [...allValueIds].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Generate mock valu code customers with realistic spending patterns
 * @param count - Number of customers to generate
 * @param discountPercent - The business's valu code discount percentage
 * @returns Array of mock ValuCodeCustomer objects
 */
export function generateMockValuCodeCustomers(
  count: number = 25,
  discountPercent: number = 10
): ValuCodeCustomer[] {
  const customers: ValuCodeCustomer[] = [];

  for (let i = 0; i < count; i++) {
    // Generate realistic spending amounts
    // Most customers spend between $50-$500, with some high spenders
    const isHighSpender = Math.random() > 0.85; // 15% are high spenders
    const baseSpending = isHighSpender
      ? 500 + Math.random() * 1500 // $500-$2000
      : 50 + Math.random() * 450;  // $50-$500

    const totalSpent = Math.round(baseSpending * 100) / 100;
    const totalDiscounted = Math.round((totalSpent * discountPercent / 100) * 100) / 100;

    // Number of values varies between 3-10
    const valueCount = 3 + Math.floor(Math.random() * 8);
    const values = generateCustomerValues(valueCount);

    // Last purchase within last 90 days, weighted towards recent
    const daysAgo = Math.random() > 0.7 ? 30 : 90; // 70% purchased within last 30 days

    customers.push({
      id: `customer-${i + 1}`,
      name: generateCustomerName(),
      totalSpent,
      totalDiscounted,
      values,
      lastPurchaseDate: generateRecentDate(daysAgo),
    });
  }

  // Sort by total spent descending
  return customers.sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Calculate aggregate statistics from valu code customers
 */
export interface CustomerStats {
  totalCustomers: number;
  totalRevenue: number;
  totalDiscounted: number;
  averageSpending: number;
  topValues: Array<{ valueId: string; valueName: string; count: number; percentage: number }>;
}

export function calculateCustomerStats(
  customers: ValuCodeCustomer[]
): CustomerStats {
  if (customers.length === 0) {
    return {
      totalCustomers: 0,
      totalRevenue: 0,
      totalDiscounted: 0,
      averageSpending: 0,
      topValues: [],
    };
  }

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalDiscounted = customers.reduce((sum, c) => sum + c.totalDiscounted, 0);
  const averageSpending = totalRevenue / customers.length;

  // Count value occurrences
  const valueCount = new Map<string, number>();
  customers.forEach(customer => {
    customer.values.forEach(valueId => {
      valueCount.set(valueId, (valueCount.get(valueId) || 0) + 1);
    });
  });

  // Convert to sorted array with percentages
  // Flatten AVAILABLE_VALUES to search through all values
  const allValues = Object.values(AVAILABLE_VALUES).flat();

  const topValues = Array.from(valueCount.entries())
    .map(([valueId, count]) => {
      const value = allValues.find(v => v.id === valueId);
      return {
        valueId,
        valueName: value?.name || valueId,
        count,
        percentage: Math.round((count / customers.length) * 100),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 values

  return {
    totalCustomers: customers.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalDiscounted: Math.round(totalDiscounted * 100) / 100,
    averageSpending: Math.round(averageSpending * 100) / 100,
    topValues,
  };
}
