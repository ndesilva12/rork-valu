# Using Google Sheets Data in Your App

This guide shows you how to use the new Google Sheets integration in your frontend code.

## Available API Endpoints

After setting up Google Sheets, you now have these tRPC endpoints available:

```typescript
// Get all causes/values
trpc.data.getCauses.useQuery()

// Get all products
trpc.data.getProducts.useQuery()

// Get all local businesses
trpc.data.getLocalBusinesses.useQuery()

// Search products
trpc.data.searchProducts.useQuery({
  query: "coffee",
  userCauses: ["environmentalism", "climate-change"]
})

// Get single product by ID
trpc.data.getProduct.useQuery({ id: "prod-001" })
```

---

## Migration Guide: From Mock Data to API

### Before (Using Mock Data):

```typescript
// Old way - importing mock data directly
import { MOCK_PRODUCTS } from '@/mocks/products';
import { AVAILABLE_VALUES } from '@/mocks/causes';
import { LOCAL_BUSINESSES } from '@/mocks/local-businesses';

function MyComponent() {
  const products = MOCK_PRODUCTS;
  const causes = AVAILABLE_VALUES;
  const businesses = LOCAL_BUSINESSES;

  return <View>...</View>;
}
```

### After (Using Google Sheets API):

```typescript
// New way - fetching from Google Sheets via tRPC
import { trpc } from '@/lib/trpc';

function MyComponent() {
  const { data: products, isLoading: productsLoading } = trpc.data.getProducts.useQuery();
  const { data: causes, isLoading: causesLoading } = trpc.data.getCauses.useQuery();
  const { data: businesses, isLoading: businessesLoading } = trpc.data.getLocalBusinesses.useQuery();

  if (productsLoading || causesLoading || businessesLoading) {
    return <ActivityIndicator />;
  }

  return <View>...</View>;
}
```

---

## Example: Updating the Onboarding Screen

**File: `app/onboarding.tsx`**

### Before:
```typescript
import { AVAILABLE_VALUES } from '@/mocks/causes';

export default function OnboardingScreen() {
  const values = AVAILABLE_VALUES;
  // ...rest of code
}
```

### After:
```typescript
import { trpc } from '@/lib/trpc';

export default function OnboardingScreen() {
  const { data: allCauses, isLoading } = trpc.data.getCauses.useQuery();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Transform flat array to grouped object (same format as AVAILABLE_VALUES)
  const values = allCauses?.reduce((acc, cause) => {
    if (!acc[cause.category]) {
      acc[cause.category] = [];
    }
    acc[cause.category].push(cause);
    return acc;
  }, {} as Record<CauseCategory, ValueItem[]>) || {};

  // ...rest of code remains the same
}
```

---

## Example: Updating the Search Screen

**File: `app/(tabs)/search.tsx`**

### Before:
```typescript
import { searchProducts } from '@/mocks/products';

function SearchTab() {
  const [query, setQuery] = useState('');
  const results = searchProducts(query, userCauses);
  // ...
}
```

### After:
```typescript
import { trpc } from '@/lib/trpc';

function SearchTab() {
  const [query, setQuery] = useState('');
  const { user } = useUser();
  const userCauseIds = user?.causes.map(c => c.id) || [];

  const { data: results = [], isLoading } = trpc.data.searchProducts.useQuery(
    { query, userCauses: userCauseIds },
    { enabled: query.length > 0 } // Only fetch when there's a query
  );

  // ...rest of code
}
```

---

## Example: Product Detail Screen

**File: `app/product/[id].tsx`**

### Before:
```typescript
import { MOCK_PRODUCTS } from '@/mocks/products';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const product = MOCK_PRODUCTS.find(p => p.id === id);
  // ...
}
```

### After:
```typescript
import { trpc } from '@/lib/trpc';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const { data: product, isLoading, error } = trpc.data.getProduct.useQuery(
    { id: id as string },
    { enabled: !!id }
  );

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error || !product) {
    return <Text>Product not found</Text>;
  }

  // ...rest of code remains the same
}
```

---

## Example: Home/Playbook Screen

**File: `app/(tabs)/home.tsx`**

### Before:
```typescript
import { MOCK_PRODUCTS } from '@/mocks/products';

export default function HomeScreen() {
  const products = MOCK_PRODUCTS;

  const alignedBrands = products.filter(p => p.alignmentScore > 0);
  const unalignedBrands = products.filter(p => p.alignmentScore < 0);
  // ...
}
```

### After:
```typescript
import { trpc } from '@/lib/trpc';

export default function HomeScreen() {
  const { data: products = [], isLoading } = trpc.data.getProducts.useQuery();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  const alignedBrands = products.filter(p => p.alignmentScore > 0);
  const unalignedBrands = products.filter(p => p.alignmentScore < 0);
  // ...rest of code remains the same
}
```

---

## Caching & Performance

The Google Sheets integration includes automatic caching:

- **Cache Duration**: 5 minutes
- **Automatic**: No configuration needed
- **Reduces API calls**: Same data won't be fetched twice within 5 minutes

### React Query Caching (Frontend)

tRPC uses React Query under the hood, which also provides caching:

```typescript
// Data is cached automatically
const { data } = trpc.data.getProducts.useQuery();

// Force refetch
const { data, refetch } = trpc.data.getProducts.useQuery();
await refetch();

// Configure cache time
const { data } = trpc.data.getProducts.useQuery(undefined, {
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});
```

---

## Error Handling

Always handle loading and error states:

```typescript
function MyComponent() {
  const { data, isLoading, error, refetch } = trpc.data.getProducts.useQuery();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return (
      <View>
        <Text>Error loading data: {error.message}</Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return <ProductList products={data} />;
}
```

---

## Testing Before Full Migration

You can test the integration alongside mock data:

```typescript
import { MOCK_PRODUCTS } from '@/mocks/products';
import { trpc } from '@/lib/trpc';

function MyComponent() {
  const { data: apiProducts } = trpc.data.getProducts.useQuery();

  // Use API data if available, otherwise fall back to mock data
  const products = apiProducts || MOCK_PRODUCTS;

  return <ProductList products={products} />;
}
```

---

## Common Patterns

### Loading State with Placeholder

```typescript
function ProductList() {
  const { data: products, isLoading } = trpc.data.getProducts.useQuery();

  return (
    <FlatList
      data={isLoading ? Array(5).fill({}) : products}
      renderItem={({ item }) =>
        isLoading ? <SkeletonCard /> : <ProductCard product={item} />
      }
    />
  );
}
```

### Conditional Fetching

```typescript
function ConditionalFetch() {
  const [enabled, setEnabled] = useState(false);

  const { data } = trpc.data.getProducts.useQuery(undefined, {
    enabled, // Only fetch when enabled is true
  });

  return <Button title="Load Products" onPress={() => setEnabled(true)} />;
}
```

### Prefetching Data

```typescript
import { trpc } from '@/lib/trpc';

function Navigation() {
  const utils = trpc.useUtils();

  // Prefetch products before navigating
  const handleNavigate = async () => {
    await utils.data.getProducts.prefetch();
    router.push('/products');
  };

  return <Button title="View Products" onPress={handleNavigate} />;
}
```

---

## Next Steps

1. Set up your Google Spreadsheet (see `GOOGLE_SHEETS_SETUP.md`)
2. Configure credentials (see `GOOGLE_API_SETUP.md`)
3. Test the API endpoints
4. Gradually migrate screens from mock data to API
5. Remove mock data imports once migration is complete

---

## Troubleshooting

### "GOOGLE_SPREADSHEET_ID not set"
- Add `GOOGLE_SPREADSHEET_ID` to your `.env` file

### "Failed to fetch causes from Google Sheets"
- Check that your Google Sheets is properly shared with the service account
- Verify sheet names match (case-sensitive)

### "The caller does not have permission"
- Make sure you shared the spreadsheet with the service account email
- Check that the service account has "Viewer" permissions

### Data is outdated
- Cache clears every 5 minutes automatically
- Force refresh by calling `refetch()` on the query

---

Ready to start migrating your screens! Let me know if you need help with any specific screen.
