/**
 * Admin Panel - Brands Management
 *
 * Full CRUD operations for brands collection in Firebase
 * Includes money flow sections: affiliates, partnerships, ownership
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, setDoc, deleteDoc, query, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Affiliate {
  name: string;
  relationship: string;
}

interface Partnership {
  name: string;
  relationship: string;
}

interface Ownership {
  name: string;
  relationship: string;
}

interface BrandData {
  id: string;
  name: string;
  category: string;
  description?: string;
  website?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  affiliates?: Affiliate[];
  partnerships?: Partnership[];
  ownership?: Ownership[];
  ownershipSources?: string;
}

export default function BrandsManagement() {
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [editingBrand, setEditingBrand] = useState<BrandData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formAffiliates, setFormAffiliates] = useState('');
  const [formPartnerships, setFormPartnerships] = useState('');
  const [formOwnership, setFormOwnership] = useState('');
  const [formOwnershipSources, setFormOwnershipSources] = useState('');

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setIsLoading(true);
      const brandsRef = collection(db, 'brands');
      const snapshot = await getDocs(brandsRef);

      const loadedBrands: BrandData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || doc.id,
          category: data.category || '',
          description: data.description || '',
          website: data.website || '',
          location: data.location || '',
          latitude: data.latitude,
          longitude: data.longitude,
          affiliates: data.affiliates || [],
          partnerships: data.partnerships || [],
          ownership: data.ownership || [],
          ownershipSources: data.ownershipSources || '',
        };
      });

      setBrands(loadedBrands);
    } catch (error) {
      console.error('Error loading brands:', error);
      Alert.alert('Error', 'Failed to load brands from Firebase');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBrand(null);
    setFormId('');
    setFormName('');
    setFormCategory('');
    setFormDescription('');
    setFormWebsite('');
    setFormLocation('');
    setFormAffiliates('');
    setFormPartnerships('');
    setFormOwnership('');
    setFormOwnershipSources('');
    setShowModal(true);
  };

  const openEditModal = (brand: BrandData) => {
    setEditingBrand(brand);
    setFormId(brand.id);
    setFormName(brand.name);
    setFormCategory(brand.category);
    setFormDescription(brand.description || '');
    setFormWebsite(brand.website || '');
    setFormLocation(brand.location || '');

    // Format money flow sections
    setFormAffiliates(
      brand.affiliates?.map((a) => `${a.name}|${a.relationship}`).join('\n') || ''
    );
    setFormPartnerships(
      brand.partnerships?.map((p) => `${p.name}|${p.relationship}`).join('\n') || ''
    );
    setFormOwnership(
      brand.ownership?.map((o) => `${o.name}|${o.relationship}`).join('\n') || ''
    );
    setFormOwnershipSources(brand.ownershipSources || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);
  };

  const parseMoneyFlowSection = (text: string): { name: string; relationship: string }[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => {
        const [name, relationship] = line.split('|').map((s) => s.trim());
        return { name: name || '', relationship: relationship || '' };
      })
      .filter((item) => item.name);
  };

  const handleSave = async () => {
    if (!formId.trim() || !formName.trim()) {
      Alert.alert('Error', 'ID and Name are required');
      return;
    }

    try {
      const brandData: BrandData = {
        id: formId.trim(),
        name: formName.trim(),
        category: formCategory.trim(),
        description: formDescription.trim(),
        website: formWebsite.trim(),
        location: formLocation.trim(),
        affiliates: parseMoneyFlowSection(formAffiliates),
        partnerships: parseMoneyFlowSection(formPartnerships),
        ownership: parseMoneyFlowSection(formOwnership),
        ownershipSources: formOwnershipSources.trim(),
      };

      const brandRef = doc(db, 'brands', brandData.id);
      await setDoc(brandRef, {
        name: brandData.name,
        category: brandData.category,
        description: brandData.description,
        website: brandData.website,
        location: brandData.location,
        affiliates: brandData.affiliates,
        partnerships: brandData.partnerships,
        ownership: brandData.ownership,
        ownershipSources: brandData.ownershipSources,
      });

      // Clear the DataContext cache so changes are visible immediately
      await AsyncStorage.removeItem('@brands_cache');
      await AsyncStorage.removeItem('@data_cache_timestamp');
      console.log('[BrandsAdmin] Cleared brands cache after save');

      Alert.alert(
        'Success',
        `Brand "${brandData.name}" ${editingBrand ? 'updated' : 'created'} successfully`
      );

      closeModal();
      loadBrands();
    } catch (error) {
      console.error('Error saving brand:', error);
      Alert.alert('Error', 'Failed to save brand');
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkData.trim()) {
      Alert.alert('Error', 'Please enter CSV data');
      return;
    }

    try {
      const lines = bulkData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
          const values = lines[i].split(',').map(v => v.trim());
          const brandData: any = {};

          headers.forEach((header, index) => {
            if (values[index]) {
              brandData[header] = values[index];
            }
          });

          if (!brandData.id || !brandData.name) {
            errorCount++;
            continue;
          }

          // Parse money flow fields if present
          const parseMoneyFlowField = (field: string): { name: string; relationship: string }[] => {
            if (!field) return [];
            return field.split(';').map(entry => {
              const [name, relationship] = entry.split('|').map(s => s.trim());
              return { name: name || '', relationship: relationship || '' };
            }).filter(item => item.name);
          };

          const affiliates = parseMoneyFlowField(brandData.affiliates || '');
          const partnerships = parseMoneyFlowField(brandData.partnerships || '');
          const ownership = parseMoneyFlowField(brandData.ownership || '');

          const brandRef = doc(db, 'brands', brandData.id);
          await setDoc(brandRef, {
            name: brandData.name,
            category: brandData.category || '',
            description: brandData.description || '',
            website: brandData.website || '',
            location: brandData.location || '',
            affiliates,
            partnerships,
            ownership,
            ownershipSources: brandData.ownershipSources || '',
          });

          successCount++;
        } catch (err) {
          console.error('Error creating brand:', err);
          errorCount++;
        }
      }

      // Clear cache
      await AsyncStorage.removeItem('@brands_cache');
      await AsyncStorage.removeItem('@data_cache_timestamp');

      Alert.alert(
        'Bulk Create Complete',
        `Successfully created ${successCount} brands. ${errorCount} errors.`
      );

      setShowBulkModal(false);
      setBulkData('');
      loadBrands();
    } catch (error) {
      console.error('Error in bulk create:', error);
      Alert.alert('Error', 'Failed to bulk create brands');
    }
  };

  const handleDelete = (brand: BrandData) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${brand.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const brandRef = doc(db, 'brands', brand.id);
              await deleteDoc(brandRef);

              // Clear the DataContext cache
              await AsyncStorage.removeItem('@brands_cache');
              await AsyncStorage.removeItem('@data_cache_timestamp');
              console.log('[BrandsAdmin] Cleared brands cache after delete');

              Alert.alert('Success', `Brand "${brand.name}" deleted successfully`);
              loadBrands();
            } catch (error) {
              console.error('Error deleting brand:', error);
              Alert.alert('Error', 'Failed to delete brand');
            }
          },
        },
      ]
    );
  };

  const filteredBrands = brands.filter(
    (brand) =>
      brand.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedBrands = filteredBrands.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading brands...</Text>
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
        <Text style={styles.title}>Brands Management</Text>
        <Text style={styles.subtitle}>
          {brands.length} brands in database ({filteredBrands.length} filtered)
        </Text>
      </View>

      {/* Actions Bar */}
      <View style={styles.actionsBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search brands..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setCurrentPage(0);
          }}
        />
        <TouchableOpacity style={styles.bulkButton} onPress={() => setShowBulkModal(true)}>
          <Text style={styles.bulkButtonText}>Bulk Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Brand</Text>
        </TouchableOpacity>
      </View>

      {/* Brands List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.listContainer}>
          {paginatedBrands.map((brand) => (
            <View key={brand.id} style={styles.brandCard}>
              <View style={styles.brandHeader}>
                <View style={styles.brandInfo}>
                  <Text style={styles.brandName}>{brand.name}</Text>
                  <Text style={styles.brandCategory}>{brand.category}</Text>
                  <Text style={styles.brandId}>ID: {brand.id}</Text>
                </View>
                <View style={styles.brandActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(brand)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(brand)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Money Flow Summary */}
              <View style={styles.moneyFlowSummary}>
                <Text style={styles.moneyFlowLabel}>Money Flow:</Text>
                <Text style={styles.moneyFlowText}>
                  {brand.affiliates?.length || 0} affiliates, {brand.partnerships?.length || 0}{' '}
                  partnerships, {brand.ownership?.length || 0} ownership
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, currentPage === 0 && styles.pageButtonDisabled]}
              onPress={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <Text style={styles.pageButtonText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.pageInfo}>
              Page {currentPage + 1} of {totalPages}
            </Text>
            <TouchableOpacity
              style={[
                styles.pageButton,
                currentPage === totalPages - 1 && styles.pageButtonDisabled,
              ]}
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
            >
              <Text style={styles.pageButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </Text>

              <Text style={styles.label}>ID (will be used as document ID)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Apple"
                value={formId}
                onChangeText={setFormId}
                editable={!editingBrand}
              />

              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Apple"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.label}>Category *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Electronics"
                value={formCategory}
                onChangeText={setFormCategory}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brand description"
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com"
                value={formWebsite}
                onChangeText={setFormWebsite}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="City, State, Country"
                value={formLocation}
                onChangeText={setFormLocation}
              />

              <Text style={styles.sectionTitle}>💰 Money Flow Sections</Text>

              <Text style={styles.label}>
                Affiliates (one per line: Name|Relationship)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Taylor Swift|Multi-million&#10;LeBron James|$5M endorsement"
                value={formAffiliates}
                onChangeText={setFormAffiliates}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>
                Partnerships (one per line: Name|Relationship)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="TSMC|Silicon Supply Chain/2010&#10;Foxconn|Manufacturing/2005"
                value={formPartnerships}
                onChangeText={setFormPartnerships}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>
                Ownership (one per line: Name|Relationship)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Vanguard Group|~9.5%&#10;BlackRock|~7.2%"
                value={formOwnership}
                onChangeText={setFormOwnership}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Ownership Sources (citations)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="HQ: Official site; Stakes: Q3 2025 13F filings via SEC/Yahoo Finance"
                value={formOwnershipSources}
                onChangeText={setFormOwnershipSources}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Bulk Create Modal */}
      <Modal visible={showBulkModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Bulk Create Brands</Text>
              <Text style={styles.helpText}>
                Paste CSV data below. First row must be headers.
                {'\n\n'}
                <Text style={styles.boldText}>Basic Format:</Text> id,name,category,description,website,location
                {'\n'}
                <Text style={styles.boldText}>All Available Fields:</Text> id,name,category,description,website,location,affiliates,partnerships,ownership,ownershipSources
                {'\n\n'}
                <Text style={styles.boldText}>Field Details:</Text>
                {'\n'}• affiliates, partnerships, ownership: Use semicolons (;) to separate entries, pipe (|) for name|relationship
                {'\n'}• Example: "Taylor Swift|$5M endorsement;LeBron James|Brand Ambassador"
                {'\n\n'}
                <Text style={styles.boldText}>Basic Example:</Text>
                {'\n'}id,name,category,description,website,location
                {'\n'}Apple,Apple Inc.,Technology,Electronics manufacturer,https://apple.com,Cupertino CA
                {'\n\n'}
                <Text style={styles.boldText}>Full Example with Money Flow:</Text>
                {'\n'}id,name,category,description,website,location,affiliates,partnerships,ownership,ownershipSources
                {'\n'}Nike,Nike Inc.,Sportswear,Athletic apparel,https://nike.com,Beaverton OR,LeBron James|Athlete Endorser;Serena Williams|Brand Ambassador,Apple|Tech Partnership/2016;NBA|League Partner/2015,Vanguard|~8%;BlackRock|~6%,Stakes from Q3 2025 SEC filings
              </Text>

              <TextInput
                style={[styles.input, styles.bulkTextArea]}
                placeholder="Paste CSV data here..."
                value={bulkData}
                onChangeText={setBulkData}
                multiline
                numberOfLines={15}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowBulkModal(false);
                    setBulkData('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleBulkCreate}>
                  <Text style={styles.saveButtonText}>Create All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  actionsBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  bulkButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  bulkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bulkTextArea: {
    height: 300,
    paddingTop: 12,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  brandCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  brandCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  brandId: {
    fontSize: 12,
    color: '#888',
  },
  brandActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  moneyFlowSummary: {
    flexDirection: 'row',
    gap: 8,
  },
  moneyFlowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  moneyFlowText: {
    fontSize: 13,
    color: '#666',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  pageButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pageButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
