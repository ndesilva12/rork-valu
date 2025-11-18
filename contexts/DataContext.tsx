/**
 * DataContext - Manages brands and values from Firebase
 *
 * Loads data client-side (like UserContext does for users)
 * No backend/serverless timeout issues
 */
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Brand } from '@/types';
import {
  getBrandsFromFirebase,
  getValuesFromFirebase,
  getValuesMatrix,
  ValueData,
} from '@/services/firebase/dataService';

const BRANDS_CACHE_KEY = '@brands_cache';
const VALUES_CACHE_KEY = '@values_cache';
const CACHE_TIMESTAMP_KEY = '@data_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const [DataProvider, useData] = createContextHook(() => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [values, setValues] = useState<ValueData[]>([]);
  const [valuesMatrix, setValuesMatrix] = useState<Record<string, { support: string[]; oppose: string[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Firebase (with AsyncStorage cache)
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      console.log(`[DataContext] 🔄 Loading brands and values... (forceRefresh: ${forceRefresh})`);
      setIsLoading(true);
      setError(null);

      // If force refresh, clear the cache first
      if (forceRefresh) {
        console.log('[DataContext] 🗑️ Force refresh: Clearing cache...');
        await Promise.all([
          AsyncStorage.removeItem(BRANDS_CACHE_KEY),
          AsyncStorage.removeItem(VALUES_CACHE_KEY),
          AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY),
        ]);
      }

      // Check cache timestamp
      const cacheTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      const now = Date.now();
      const isCacheValid = cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION;

      if (!forceRefresh && isCacheValid) {
        // Try to load from cache first
        console.log('[DataContext] 📦 Loading from cache...');
        const [cachedBrands, cachedValues] = await Promise.all([
          AsyncStorage.getItem(BRANDS_CACHE_KEY),
          AsyncStorage.getItem(VALUES_CACHE_KEY),
        ]);

        if (cachedBrands && cachedValues) {
          const parsedBrands = JSON.parse(cachedBrands);
          const parsedValues = JSON.parse(cachedValues);

          setBrands(parsedBrands);
          setValues(parsedValues);

          // Build values matrix from cached values
          const matrix: Record<string, { support: string[]; oppose: string[] }> = {};
          parsedValues.forEach((value: ValueData) => {
            matrix[value.id] = {
              support: value.support,
              oppose: value.oppose,
            };
          });
          setValuesMatrix(matrix);

          console.log('[DataContext] ✅ Loaded from cache:', parsedBrands.length, 'brands,', parsedValues.length, 'values');
          setIsLoading(false);
          return;
        }
      }

      // Load from Firebase
      console.log('[DataContext] 🔥 Loading from Firebase...');
      const [firebaseBrands, firebaseValues] = await Promise.all([
        getBrandsFromFirebase(),
        getValuesFromFirebase(),
      ]);

      // Update state
      setBrands(firebaseBrands);
      setValues(firebaseValues);

      // Build values matrix
      const matrix: Record<string, { support: string[]; oppose: string[] }> = {};
      firebaseValues.forEach((value) => {
        matrix[value.id] = {
          support: value.support,
          oppose: value.oppose,
        };
      });
      setValuesMatrix(matrix);

      // Cache the data
      await Promise.all([
        AsyncStorage.setItem(BRANDS_CACHE_KEY, JSON.stringify(firebaseBrands)),
        AsyncStorage.setItem(VALUES_CACHE_KEY, JSON.stringify(firebaseValues)),
        AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString()),
      ]);

      console.log('[DataContext] ✅ Loaded from Firebase:', firebaseBrands.length, 'brands,', firebaseValues.length, 'values');
      setIsLoading(false);
    } catch (err) {
      console.error('[DataContext] ❌ Error loading data:', err);
      setError('Failed to load data from Firebase');
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search brands by query
  const searchBrands = useCallback(
    (query: string, userCauses: string[] = []): Brand[] => {
      const lowerQuery = query.toLowerCase();

      const filtered = brands.filter(
        (brand) =>
          brand.name.toLowerCase().includes(lowerQuery) ||
          brand.category.toLowerCase().includes(lowerQuery)
      );

      // Sort by relevance to user's causes
      return filtered.sort((a, b) => {
        const aRelevance = calculateRelevance(a, userCauses);
        const bRelevance = calculateRelevance(b, userCauses);
        return bRelevance - aRelevance;
      });
    },
    [brands]
  );

  // Calculate brand relevance to user causes
  const calculateRelevance = (brand: Brand, userCauses: string[]): number => {
    // All brands now have a score of 50
    const baseScore = 50;

    if (userCauses.length === 0) return baseScore;

    const hasMatchingCause = brand.relatedValues.some((v) => userCauses.includes(v));

    if (hasMatchingCause) {
      return baseScore + 100;
    }

    return baseScore;
  };

  // Get brand by ID (exact match only)
  const getBrandById = useCallback(
    (brandId: string): Brand | undefined => {
      return brands.find((b) => b.id === brandId);
    },
    [brands]
  );

  // Get brand by name (for fallback when ID doesn't match)
  const getBrandByName = useCallback(
    (brandName: string): Brand | undefined => {
      return brands.find((b) => b.name.toLowerCase() === brandName.toLowerCase());
    },
    [brands]
  );

  // Refresh data from Firebase
  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  return {
    brands,
    values,
    valuesMatrix,
    isLoading,
    error,
    searchBrands,
    getBrandById,
    getBrandByName,
    refresh,
  };
});
