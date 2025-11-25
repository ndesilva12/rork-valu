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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, setDoc, deleteDoc, query, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pickAndUploadImage } from '@/lib/imageUpload';
import { getLogoUrl } from '@/lib/logo';
import { Upload } from 'lucide-react-native';

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
  exampleImageUrl?: string; // Logo/profile image
  coverImageUrl?: string; // Cover/banner image
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
  const [showEmptyOnly, setShowEmptyOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
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
          exampleImageUrl: data.exampleImageUrl || '',
          coverImageUrl: data.coverImageUrl || '',
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
    setFormLogoUrl('');
    setFormCoverUrl('');
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
    setFormLogoUrl(brand.exampleImageUrl || '');
    setFormCoverUrl(brand.coverImageUrl || '');

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
        exampleImageUrl: formLogoUrl.trim(),
        coverImageUrl: formCoverUrl.trim(),
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
        exampleImageUrl: brandData.exampleImageUrl,
        coverImageUrl: brandData.coverImageUrl,
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

  // Parse CSV line handling quoted fields (e.g., "New York, NY, USA")
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleBulkCreate = async () => {
    if (!bulkData.trim()) {
      Alert.alert('Error', 'Please enter CSV data');
      return;
    }

    try {
      const lines = bulkData.trim().split('\n');
      const headers = parseCSVLine(lines[0]);
      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
          const values = parseCSVLine(lines[i]);
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

          // Parse numbered columns for affiliates, partnerships, ownership
          // Supports: affiliate1_name, affiliate1_relationship, affiliate2_name, etc.
          const parseNumberedFields = (prefix: string): { name: string; relationship: string }[] => {
            const results: { name: string; relationship: string }[] = [];
            for (let n = 1; n <= 10; n++) {
              const name = brandData[`${prefix}${n}_name`];
              const relationship = brandData[`${prefix}${n}_relationship`] || '';
              if (name) {
                results.push({ name, relationship });
              }
            }
            return results;
          };

          // Also support legacy format (semicolon/pipe separated)
          const parseLegacyField = (field: string): { name: string; relationship: string }[] => {
            if (!field) return [];
            return field.split(';').map(entry => {
              const [name, relationship] = entry.split('|').map(s => s.trim());
              return { name: name || '', relationship: relationship || '' };
            }).filter(item => item.name);
          };

          // Try numbered columns first, fall back to legacy format
          let affiliates = parseNumberedFields('affiliate');
          if (affiliates.length === 0 && brandData.affiliates) {
            affiliates = parseLegacyField(brandData.affiliates);
          }

          let partnerships = parseNumberedFields('partnership');
          if (partnerships.length === 0 && brandData.partnerships) {
            partnerships = parseLegacyField(brandData.partnerships);
          }

          let ownership = parseNumberedFields('owner');
          if (ownership.length === 0 && brandData.ownership) {
            ownership = parseLegacyField(brandData.ownership);
          }

          const brandRef = doc(db, 'brands', brandData.id);

          // Generate logo URL from website using logo.dev API
          const logoUrl = brandData.website ? getLogoUrl(brandData.website) : '';

          await setDoc(brandRef, {
            name: brandData.name,
            category: brandData.category || '',
            description: brandData.description || '',
            website: brandData.website || '',
            location: brandData.location || '',
            exampleImageUrl: logoUrl,
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

  // Helper to check if a brand has no data
  const isBrandEmpty = (brand: BrandData): boolean => {
    const hasNoMoneyFlow =
      (!brand.affiliates || brand.affiliates.length === 0) &&
      (!brand.partnerships || brand.partnerships.length === 0) &&
      (!brand.ownership || brand.ownership.length === 0);

    const hasNoBasicData =
      (!brand.website || brand.website.trim() === '') &&
      (!brand.description || brand.description.trim() === '') &&
      (!brand.location || brand.location.trim() === '');

    return hasNoMoneyFlow && hasNoBasicData;
  };

  const filteredBrands = brands.filter(
    (brand) => {
      // Search filter
      const matchesSearch =
        brand.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Empty filter
      if (showEmptyOnly) {
        return matchesSearch && isBrandEmpty(brand);
      }

      return matchesSearch;
    }
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
        <TouchableOpacity
          style={[styles.filterButton, showEmptyOnly && styles.filterButtonActive]}
          onPress={() => {
            setShowEmptyOnly(!showEmptyOnly);
            setCurrentPage(0);
          }}
        >
          <Text style={[styles.filterButtonText, showEmptyOnly && styles.filterButtonTextActive]}>
            {showEmptyOnly ? '✓ Empty Only' : 'Show Empty'}
          </Text>
        </TouchableOpacity>
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
          {paginatedBrands.map((brand) => {
            const isEmpty = isBrandEmpty(brand);
            return (
              <View key={brand.id} style={styles.brandCard}>
                <View style={styles.brandHeader}>
                  <View style={styles.brandInfo}>
                    <View style={styles.brandNameRow}>
                      <Text style={styles.brandName}>{brand.name}</Text>
                      {isEmpty && (
                        <View style={styles.emptyBadge}>
                          <Text style={styles.emptyBadgeText}>EMPTY</Text>
                        </View>
                      )}
                    </View>
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

                {/* Data Summary */}
                {isEmpty && (
                  <View style={styles.dataSummary}>
                    <Text style={styles.dataSummaryText}>
                      ⚠️ No data: Missing website, description, location, and money flow
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
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

              <Text style={styles.sectionTitle}>🖼️ Images</Text>

              <Text style={styles.label}>Logo / Profile Image</Text>
              <View style={styles.imageInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="https://example.com/logo.png"
                  value={formLogoUrl}
                  onChangeText={setFormLogoUrl}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.uploadButton, logoUploading && styles.uploadButtonDisabled]}
                  onPress={async () => {
                    if (!formId.trim()) {
                      Alert.alert('ID Required', 'Please enter a Brand ID first');
                      return;
                    }
                    setLogoUploading(true);
                    try {
                      const url = await pickAndUploadImage(formId.trim(), 'business', [1, 1]);
                      if (url) setFormLogoUrl(url);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to upload image');
                    }
                    setLogoUploading(false);
                  }}
                  disabled={logoUploading}
                >
                  {logoUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Upload size={16} color="#fff" strokeWidth={2} />
                      <Text style={styles.uploadButtonText}>Upload</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              {formLogoUrl ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: formLogoUrl }} style={styles.previewImageSmall} />
                </View>
              ) : null}

              <Text style={styles.label}>Cover / Banner Image</Text>
              <View style={styles.imageInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="https://example.com/cover.png"
                  value={formCoverUrl}
                  onChangeText={setFormCoverUrl}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.uploadButton, coverUploading && styles.uploadButtonDisabled]}
                  onPress={async () => {
                    if (!formId.trim()) {
                      Alert.alert('ID Required', 'Please enter a Brand ID first');
                      return;
                    }
                    setCoverUploading(true);
                    try {
                      const url = await pickAndUploadImage(formId.trim(), 'cover', [16, 9]);
                      if (url) setFormCoverUrl(url);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to upload image');
                    }
                    setCoverUploading(false);
                  }}
                  disabled={coverUploading}
                >
                  {coverUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Upload size={16} color="#fff" strokeWidth={2} />
                      <Text style={styles.uploadButtonText}>Upload</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              {formCoverUrl ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: formCoverUrl }} style={styles.previewImageWide} />
                </View>
              ) : null}

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
                <Text style={styles.boldText}>Basic Columns:</Text> id, name, category, description, website, location
                {'\n\n'}
                <Text style={styles.boldText}>Spreadsheet-Friendly Format (Recommended):</Text>
                {'\n'}Use numbered columns for relationships - easy to build in Excel/Sheets:
                {'\n'}• affiliate1_name, affiliate1_relationship, affiliate2_name, affiliate2_relationship, ...
                {'\n'}• partnership1_name, partnership1_relationship, partnership2_name, ...
                {'\n'}• owner1_name, owner1_relationship, owner2_name, ...
                {'\n'}(Supports up to 10 of each type)
                {'\n\n'}
                <Text style={styles.boldText}>Example Headers:</Text>
                {'\n'}id,name,category,website,affiliate1_name,affiliate1_relationship,owner1_name,owner1_relationship
                {'\n\n'}
                <Text style={styles.boldText}>Example Row:</Text>
                {'\n'}Nike,Nike Inc.,Sportswear,https://nike.com,LeBron James,Athlete Endorser,Vanguard,~8%
                {'\n\n'}
                <Text style={styles.boldText}>Also Supports Legacy Format:</Text>
                {'\n'}affiliates,partnerships,ownership columns with semicolons (;) and pipes (|)
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
  filterButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6c757d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#ffc107',
    borderColor: '#ffc107',
  },
  filterButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#000',
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
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
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
  dataSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dataSummaryText: {
    fontSize: 13,
    color: '#dc3545',
    fontStyle: 'italic',
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
  imageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#28a745',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreview: {
    marginTop: 8,
    alignItems: 'center',
  },
  previewImageSmall: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  previewImageWide: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
});
