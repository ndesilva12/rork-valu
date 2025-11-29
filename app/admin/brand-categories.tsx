/**
 * Admin Panel - Brand Categories
 *
 * Efficiently categorize brands using predefined categories
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ChevronLeft, Search, Check, X, Filter } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { getLogoUrl } from '@/lib/logo';

// Predefined categories for brands
const BRAND_CATEGORIES = [
  { id: 'technology', label: 'Technology', color: '#3B82F6' },
  { id: 'retail', label: 'Retail', color: '#10B981' },
  { id: 'food_beverage', label: 'Food & Beverage', color: '#F59E0B' },
  { id: 'finance', label: 'Finance', color: '#6366F1' },
  { id: 'automotive', label: 'Automotive', color: '#EF4444' },
  { id: 'entertainment', label: 'Entertainment', color: '#EC4899' },
  { id: 'health_wellness', label: 'Health & Wellness', color: '#14B8A6' },
  { id: 'fashion', label: 'Fashion', color: '#8B5CF6' },
  { id: 'travel', label: 'Travel', color: '#06B6D4' },
  { id: 'other', label: 'Other', color: '#6B7280' },
];

interface BrandData {
  id: string;
  name: string;
  category: string;
  website?: string;
  exampleImageUrl?: string;
}

export default function BrandCategoriesAdmin() {
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'uncategorized' | 'categorized'>('uncategorized');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savingBrandId, setSavingBrandId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, categorized: 0, uncategorized: 0 });

  // Load brands from Firebase
  const loadBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const brandsRef = collection(db, 'brands');
      const q = query(brandsRef, orderBy('name'));
      const snapshot = await getDocs(q);

      const brandsData: BrandData[] = [];
      let categorized = 0;
      let uncategorized = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const brand: BrandData = {
          id: doc.id,
          name: data.name || doc.id,
          category: data.category || '',
          website: data.website,
          exampleImageUrl: data.exampleImageUrl,
        };
        brandsData.push(brand);

        // Check if brand has a valid category (not empty and matches one of our predefined ones)
        const hasValidCategory = brand.category &&
          BRAND_CATEGORIES.some(c =>
            c.id === brand.category.toLowerCase().replace(/[&\s]+/g, '_') ||
            c.label.toLowerCase() === brand.category.toLowerCase()
          );

        if (hasValidCategory) {
          categorized++;
        } else {
          uncategorized++;
        }
      });

      setBrands(brandsData);
      setStats({
        total: brandsData.length,
        categorized,
        uncategorized,
      });
    } catch (error) {
      console.error('[BrandCategories] Error loading brands:', error);
      Alert.alert('Error', 'Failed to load brands');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Check if a brand has a valid category
  const hasValidCategory = (brand: BrandData): boolean => {
    if (!brand.category) return false;
    return BRAND_CATEGORIES.some(c =>
      c.id === brand.category.toLowerCase().replace(/[&\s]+/g, '_') ||
      c.label.toLowerCase() === brand.category.toLowerCase()
    );
  };

  // Get normalized category for a brand
  const getNormalizedCategory = (category: string): string | null => {
    if (!category) return null;
    const found = BRAND_CATEGORIES.find(c =>
      c.id === category.toLowerCase().replace(/[&\s]+/g, '_') ||
      c.label.toLowerCase() === category.toLowerCase()
    );
    return found?.id || null;
  };

  // Filter brands based on search and filter mode
  const filteredBrands = brands.filter(brand => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!brand.name.toLowerCase().includes(query) &&
          !brand.category?.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Category filter mode
    if (filterMode === 'uncategorized') {
      return !hasValidCategory(brand);
    } else if (filterMode === 'categorized') {
      return hasValidCategory(brand);
    }

    // Selected category filter
    if (selectedCategory) {
      return getNormalizedCategory(brand.category) === selectedCategory;
    }

    return true;
  });

  // Save category for a brand
  const saveCategory = async (brandId: string, categoryId: string) => {
    setSavingBrandId(brandId);
    try {
      const category = BRAND_CATEGORIES.find(c => c.id === categoryId);
      if (!category) return;

      const brandRef = doc(db, 'brands', brandId);
      await updateDoc(brandRef, {
        category: category.label, // Store the display label
      });

      // Update local state
      setBrands(prev => prev.map(b =>
        b.id === brandId ? { ...b, category: category.label } : b
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        categorized: prev.categorized + 1,
        uncategorized: prev.uncategorized - 1,
      }));
    } catch (error) {
      console.error('[BrandCategories] Error saving category:', error);
      Alert.alert('Error', 'Failed to save category');
    } finally {
      setSavingBrandId(null);
    }
  };

  // Clear category for a brand
  const clearCategory = async (brandId: string) => {
    setSavingBrandId(brandId);
    try {
      const brandRef = doc(db, 'brands', brandId);
      await updateDoc(brandRef, {
        category: '',
      });

      // Update local state
      setBrands(prev => prev.map(b =>
        b.id === brandId ? { ...b, category: '' } : b
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        categorized: prev.categorized - 1,
        uncategorized: prev.uncategorized + 1,
      }));
    } catch (error) {
      console.error('[BrandCategories] Error clearing category:', error);
      Alert.alert('Error', 'Failed to clear category');
    } finally {
      setSavingBrandId(null);
    }
  };

  // Get logo URL for a brand
  const getBrandLogo = (brand: BrandData): string | null => {
    if (brand.exampleImageUrl) return brand.exampleImageUrl;
    if (brand.website) return getLogoUrl(brand.website);
    return null;
  };

  // Render a single brand row
  const renderBrandRow = (brand: BrandData) => {
    const logoUrl = getBrandLogo(brand);
    const currentCategory = getNormalizedCategory(brand.category);
    const isSaving = savingBrandId === brand.id;

    return (
      <View key={brand.id} style={styles.brandRow}>
        {/* Brand Info */}
        <View style={styles.brandInfo}>
          {logoUrl ? (
            <ExpoImage
              source={{ uri: logoUrl }}
              style={styles.brandLogo}
              contentFit="contain"
            />
          ) : (
            <View style={[styles.brandLogo, styles.brandLogoPlaceholder]}>
              <Text style={styles.brandLogoText}>
                {brand.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.brandDetails}>
            <Text style={styles.brandName} numberOfLines={1}>
              {brand.name}
            </Text>
            {brand.category && !hasValidCategory(brand) && (
              <Text style={styles.brandOldCategory} numberOfLines={1}>
                Current: {brand.category}
              </Text>
            )}
          </View>
        </View>

        {/* Category Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryButtons}
          contentContainerStyle={styles.categoryButtonsContent}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <>
              {BRAND_CATEGORIES.map((cat) => {
                const isSelected = currentCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      isSelected && { backgroundColor: cat.color },
                    ]}
                    onPress={() => saveCategory(brand.id, cat.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                    {isSelected && (
                      <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                );
              })}
              {currentCategory && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => clearCategory(brand.id)}
                  activeOpacity={0.7}
                >
                  <X size={16} color="#EF4444" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading brands...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={28} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Brand Categories</Text>
          <Text style={styles.subtitle}>
            {stats.categorized} categorized / {stats.uncategorized} uncategorized
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadBrands}
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search brands..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterMode === 'uncategorized' && styles.filterTabActive,
          ]}
          onPress={() => {
            setFilterMode('uncategorized');
            setSelectedCategory(null);
          }}
        >
          <Text
            style={[
              styles.filterTabText,
              filterMode === 'uncategorized' && styles.filterTabTextActive,
            ]}
          >
            Uncategorized ({stats.uncategorized})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterMode === 'categorized' && styles.filterTabActive,
          ]}
          onPress={() => {
            setFilterMode('categorized');
            setSelectedCategory(null);
          }}
        >
          <Text
            style={[
              styles.filterTabText,
              filterMode === 'categorized' && styles.filterTabTextActive,
            ]}
          >
            Categorized ({stats.categorized})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterMode === 'all' && styles.filterTabActive,
          ]}
          onPress={() => {
            setFilterMode('all');
            setSelectedCategory(null);
          }}
        >
          <Text
            style={[
              styles.filterTabText,
              filterMode === 'all' && styles.filterTabTextActive,
            ]}
          >
            All ({stats.total})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter (when viewing all) */}
      {filterMode === 'all' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilterScroll}
          contentContainerStyle={styles.categoryFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryFilterChip,
              !selectedCategory && styles.categoryFilterChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryFilterText,
                !selectedCategory && styles.categoryFilterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {BRAND_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryFilterChip,
                selectedCategory === cat.id && { backgroundColor: cat.color },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === cat.id && styles.categoryFilterTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Brand List */}
      <ScrollView style={styles.brandList}>
        {filteredBrands.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'No brands match your search'
                : filterMode === 'uncategorized'
                ? 'All brands are categorized!'
                : 'No brands found'}
            </Text>
          </View>
        ) : (
          filteredBrands.map(renderBrandRow)
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  categoryFilterScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryFilterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryFilterChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
  },
  brandList: {
    flex: 1,
  },
  brandRow: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  brandLogoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  brandDetails: {
    flex: 1,
    marginLeft: 12,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  brandOldCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  categoryButtons: {
    flexGrow: 0,
  },
  categoryButtonsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  clearButton: {
    padding: 6,
    marginLeft: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
