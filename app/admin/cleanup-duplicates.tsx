/**
 * Admin Utility - Find and Clean Up Duplicate Brands
 *
 * Finds brands with duplicate names and allows manual cleanup
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface BrandData {
  id: string;
  name: string;
  category?: string;
  description?: string;
  website?: string;
}

interface DuplicateGroup {
  name: string;
  brands: BrandData[];
}

export default function CleanupDuplicates() {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    findDuplicates();
  }, []);

  const findDuplicates = async () => {
    try {
      setIsLoading(true);
      const brandsRef = collection(db, 'brands');
      const snapshot = await getDocs(brandsRef);

      // Group brands by name (case-insensitive)
      const brandsByName = new Map<string, BrandData[]>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const brand: BrandData = {
          id: doc.id,
          name: data.name || doc.id,
          category: data.category,
          description: data.description,
          website: data.website,
        };

        const normalizedName = brand.name.toLowerCase();
        const existing = brandsByName.get(normalizedName) || [];
        existing.push(brand);
        brandsByName.set(normalizedName, existing);
      });

      // Filter to only groups with duplicates
      const duplicateGroups: DuplicateGroup[] = [];
      brandsByName.forEach((brands, name) => {
        if (brands.length > 1) {
          duplicateGroups.push({
            name: brands[0].name, // Use original capitalization from first brand
            brands: brands.sort((a, b) => {
              // Sort so auto-created brands (with placeholder description) come last
              const aIsAuto = a.description?.includes('Auto-created') ? 1 : 0;
              const bIsAuto = b.description?.includes('Auto-created') ? 1 : 0;
              return aIsAuto - bIsAuto;
            }),
          });
        }
      });

      // Sort by name
      duplicateGroups.sort((a, b) => a.name.localeCompare(b.name));

      setDuplicates(duplicateGroups);
    } catch (error) {
      console.error('Error finding duplicates:', error);
      Alert.alert('Error', 'Failed to find duplicates');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBrand = async (brandId: string, brandName: string) => {
    const confirmMessage = `Are you sure you want to delete brand "${brandName}" (ID: ${brandId})?\n\nThis action cannot be undone.`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    } else {
      return new Promise<void>((resolve) => {
        Alert.alert(
          'Confirm Delete',
          confirmMessage,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await performDelete(brandId, brandName);
                resolve();
              },
            },
          ]
        );
      });
    }

    await performDelete(brandId, brandName);
  };

  const performDelete = async (brandId: string, brandName: string) => {
    try {
      setIsDeleting(true);
      const brandRef = doc(db, 'brands', brandId);
      await deleteDoc(brandRef);

      if (Platform.OS === 'web') {
        window.alert(`Brand "${brandName}" deleted successfully`);
      } else {
        Alert.alert('Success', `Brand "${brandName}" deleted successfully`);
      }

      // Refresh the list
      await findDuplicates();
    } catch (error) {
      console.error('Error deleting brand:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to delete brand');
      } else {
        Alert.alert('Error', 'Failed to delete brand');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const isAutoCreated = (brand: BrandData) => {
    return (
      brand.description?.includes('Auto-created') ||
      brand.category === 'Uncategorized'
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Finding duplicate brands...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cleanup Duplicate Brands</Text>
        <Text style={styles.subtitle}>
          Found {duplicates.length} duplicate groups ({duplicates.reduce((sum, g) => sum + g.brands.length, 0)} total brands)
        </Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📋 Instructions:</Text>
        <Text style={styles.instructionsText}>
          • Brands are grouped by name{'\n'}
          • <Text style={styles.bold}>Auto-created</Text> brands are marked with orange badge{'\n'}
          • Keep the <Text style={styles.bold}>complete brand</Text> with full details{'\n'}
          • Delete the <Text style={styles.bold}>auto-created duplicates</Text>{'\n'}
          • Auto-created brands usually have "Uncategorized" and placeholder description
        </Text>
      </View>

      {/* Duplicate Groups List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.listContainer}>
          {duplicates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>✅ No duplicates found!</Text>
              <Text style={styles.emptySubtext}>All brands have unique names.</Text>
            </View>
          ) : (
            duplicates.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.duplicateGroup}>
                <Text style={styles.groupName}>
                  {group.name} ({group.brands.length} duplicates)
                </Text>

                {group.brands.map((brand, brandIndex) => (
                  <View
                    key={brand.id}
                    style={[
                      styles.brandCard,
                      isAutoCreated(brand) && styles.autoCreatedCard,
                    ]}
                  >
                    <View style={styles.brandInfo}>
                      <View style={styles.brandHeader}>
                        <Text style={styles.brandName}>{brand.name}</Text>
                        {isAutoCreated(brand) && (
                          <View style={styles.autoCreatedBadge}>
                            <Text style={styles.autoCreatedBadgeText}>AUTO-CREATED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.brandId}>ID: {brand.id}</Text>
                      <Text style={styles.brandCategory}>Category: {brand.category || 'None'}</Text>
                      {brand.website && (
                        <Text style={styles.brandWebsite}>Website: {brand.website}</Text>
                      )}
                      {brand.description && (
                        <Text style={styles.brandDescription} numberOfLines={2}>
                          {brand.description}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                      onPress={() => deleteBrand(brand.id, brand.name)}
                      disabled={isDeleting}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={findDuplicates}
          disabled={isLoading || isDeleting}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  instructions: {
    padding: 16,
    backgroundColor: '#fff3cd',
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  duplicateGroup: {
    marginBottom: 24,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  brandCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  autoCreatedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    backgroundColor: '#fff8e1',
  },
  brandInfo: {
    flex: 1,
    marginRight: 12,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  autoCreatedBadge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoCreatedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  brandId: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  brandCategory: {
    fontSize: 12,
    color: '#007bff',
    marginBottom: 2,
  },
  brandWebsite: {
    fontSize: 12,
    color: '#28a745',
    marginBottom: 4,
  },
  brandDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#ccc',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  refreshButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
