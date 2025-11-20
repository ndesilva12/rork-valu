/**
 * Admin Panel - Incomplete Brands Management
 *
 * Tool for managing auto-created brands that need completion
 * Shows brands created from value alignments that lack full details
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
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { X, CheckCircle, Edit2, Trash2, AlertCircle, ExternalLink } from 'lucide-react-native';

interface BrandData {
  id: string;
  name: string;
  category: string;
  description?: string;
  website?: string;
  location?: string;
  status?: 'auto-created' | 'in-progress' | 'verified';
  createdFrom?: string[]; // Which values reference this brand
  affiliates?: any[];
  partnerships?: any[];
  ownership?: any[];
}

interface ValueReference {
  valueId: string;
  valueName: string;
  type: 'aligned' | 'unaligned';
}

export default function IncompleteBrandsManagement() {
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [allValues, setAllValues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'auto-created' | 'in-progress' | 'verified'>('auto-created');
  const [valueReferences, setValueReferences] = useState<Record<string, ValueReference[]>>({});

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<'auto-created' | 'in-progress' | 'verified'>('in-progress');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load all brands
      const brandsRef = collection(db, 'brands');
      const brandsSnapshot = await getDocs(brandsRef);

      // Load all values to find references
      const valuesRef = collection(db, 'values');
      const valuesSnapshot = await getDocs(valuesRef);

      const loadedValues = valuesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.id,
        aligned: doc.data().aligned || [],
        unaligned: doc.data().unaligned || [],
      }));
      setAllValues(loadedValues);

      // Build brand references map (which values reference each brand)
      const references: Record<string, ValueReference[]> = {};

      loadedValues.forEach(value => {
        // Check aligned brands
        (value.aligned || []).forEach((brandName: string) => {
          const normalizedName = brandName.toLowerCase();
          if (!references[normalizedName]) {
            references[normalizedName] = [];
          }
          references[normalizedName].push({
            valueId: value.id,
            valueName: value.name,
            type: 'aligned',
          });
        });

        // Check unaligned brands
        (value.unaligned || []).forEach((brandName: string) => {
          const normalizedName = brandName.toLowerCase();
          if (!references[normalizedName]) {
            references[normalizedName] = [];
          }
          references[normalizedName].push({
            valueId: value.id,
            valueName: value.name,
            type: 'unaligned',
          });
        });
      });
      setValueReferences(references);

      // Load brands and mark incomplete ones
      const loadedBrands: BrandData[] = brandsSnapshot.docs.map((doc) => {
        const data = doc.data();

        // Check if brand is incomplete
        const hasNoMoneyFlow =
          (!data.affiliates || data.affiliates.length === 0) &&
          (!data.partnerships || data.partnerships.length === 0) &&
          (!data.ownership || data.ownership.length === 0);

        const hasMinimalData =
          (!data.website || data.website.trim() === '') &&
          (!data.location || data.location.trim() === '') &&
          (data.description === 'Auto-created from value alignment. Please update with full details.' ||
           !data.description || data.description.trim() === '');

        const isIncomplete = hasNoMoneyFlow && hasMinimalData;

        // Determine status
        let status = data.status || 'verified';
        if (isIncomplete && !data.status) {
          status = 'auto-created';
        }

        return {
          id: doc.id,
          name: data.name || doc.id,
          category: data.category || 'Uncategorized',
          description: data.description || '',
          website: data.website || '',
          location: data.location || '',
          status: status as any,
          affiliates: data.affiliates || [],
          partnerships: data.partnerships || [],
          ownership: data.ownership || [],
        };
      });

      setBrands(loadedBrands);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load brands from Firebase');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (brand: BrandData) => {
    setEditingBrand(brand);
    setFormName(brand.name);
    setFormCategory(brand.category || '');
    setFormDescription(brand.description || '');
    setFormWebsite(brand.website || '');
    setFormLocation(brand.location || '');
    setFormStatus(brand.status || 'in-progress');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);
  };

  const handleSave = async () => {
    if (!editingBrand || !formName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      const brandRef = doc(db, 'brands', editingBrand.id);

      await updateDoc(brandRef, {
        name: formName.trim(),
        category: formCategory.trim() || 'Uncategorized',
        description: formDescription.trim(),
        website: formWebsite.trim(),
        location: formLocation.trim(),
        status: formStatus,
      });

      Alert.alert('Success', `Brand "${formName}" updated successfully!`);
      closeModal();
      loadData();
    } catch (error) {
      console.error('Error saving brand:', error);
      Alert.alert('Error', 'Failed to save brand');
    }
  };

  const handleMarkAsVerified = async (brand: BrandData) => {
    try {
      const brandRef = doc(db, 'brands', brand.id);
      await updateDoc(brandRef, { status: 'verified' });
      Alert.alert('Success', `${brand.name} marked as verified!`);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = async (brand: BrandData) => {
    const refs = valueReferences[brand.name.toLowerCase()] || [];

    if (refs.length > 0) {
      Alert.alert(
        'Cannot Delete',
        `This brand is referenced by ${refs.length} value(s):\n\n${refs.map(r => `• ${r.valueName} (${r.type})`).join('\n')}\n\nPlease remove it from those values first.`
      );
      return;
    }

    Alert.alert(
      'Delete Brand',
      `Are you sure you want to delete "${brand.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const brandRef = doc(db, 'brands', brand.id);
              await deleteDoc(brandRef);
              Alert.alert('Success', 'Brand deleted');
              loadData();
            } catch (error) {
              console.error('Error deleting brand:', error);
              Alert.alert('Error', 'Failed to delete brand');
            }
          },
        },
      ]
    );
  };

  const filteredBrands = brands.filter(brand => {
    // Status filter
    if (filterStatus !== 'all' && brand.status !== filterStatus) {
      return false;
    }

    // Search filter
    const matchesSearch =
      brand.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'auto-created': return '#dc3545';
      case 'in-progress': return '#ffc107';
      case 'verified': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'auto-created': return AlertCircle;
      case 'in-progress': return Edit2;
      case 'verified': return CheckCircle;
      default: return AlertCircle;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading incomplete brands...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Incomplete Brands</Text>
          <Text style={styles.subtitle}>
            Manage auto-created brands that need completion
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {brands.filter(b => b.status === 'auto-created').length}
            </Text>
            <Text style={styles.statLabel}>Auto-Created</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {brands.filter(b => b.status === 'in-progress').length}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {brands.filter(b => b.status === 'verified').length}
            </Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search brands..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Status Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Filter:</Text>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
              All ({brands.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'auto-created' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('auto-created')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'auto-created' && styles.filterButtonTextActive]}>
              Auto-Created ({brands.filter(b => b.status === 'auto-created').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'in-progress' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('in-progress')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'in-progress' && styles.filterButtonTextActive]}>
              In Progress ({brands.filter(b => b.status === 'in-progress').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'verified' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('verified')}
          >
            <Text style={[styles.filterButtonText, filterStatus === 'verified' && styles.filterButtonTextActive]}>
              Verified ({brands.filter(b => b.status === 'verified').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Count */}
        <Text style={styles.resultsText}>
          Showing {filteredBrands.length} brands
        </Text>

        {/* Brands List */}
        {filteredBrands.map((brand) => {
          const StatusIcon = getStatusIcon(brand.status);
          const refs = valueReferences[brand.name.toLowerCase()] || [];

          return (
            <View key={brand.id} style={styles.brandCard}>
              <View style={styles.brandHeader}>
                <View style={styles.brandInfo}>
                  <Text style={styles.brandName}>{brand.name}</Text>
                  <Text style={styles.brandCategory}>{brand.category}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(brand.status) }]}>
                    <StatusIcon size={12} color="#fff" strokeWidth={2} />
                    <Text style={styles.statusText}>{brand.status || 'unknown'}</Text>
                  </View>
                </View>
              </View>

              {/* Brand Details */}
              <View style={styles.brandDetails}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>
                  {brand.description || <Text style={styles.emptyValue}>Not set</Text>}
                </Text>

                <Text style={styles.detailLabel}>Website:</Text>
                <Text style={styles.detailValue}>
                  {brand.website || <Text style={styles.emptyValue}>Not set</Text>}
                </Text>

                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>
                  {brand.location || <Text style={styles.emptyValue}>Not set</Text>}
                </Text>

                {refs.length > 0 && (
                  <>
                    <Text style={styles.detailLabel}>Referenced by {refs.length} value(s):</Text>
                    {refs.map((ref, idx) => (
                      <Text key={idx} style={styles.referenceText}>
                        • {ref.valueName} ({ref.type})
                      </Text>
                    ))}
                  </>
                )}
              </View>

              {/* Actions */}
              <View style={styles.brandActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(brand)}
                >
                  <Edit2 size={16} color="#007bff" strokeWidth={2} />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>

                {brand.status !== 'verified' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.verifyButton]}
                    onPress={() => handleMarkAsVerified(brand)}
                  >
                    <CheckCircle size={16} color="#28a745" strokeWidth={2} />
                    <Text style={[styles.actionButtonText, { color: '#28a745' }]}>Mark Verified</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(brand)}
                >
                  <Trash2 size={16} color="#dc3545" strokeWidth={2} />
                  <Text style={[styles.actionButtonText, { color: '#dc3545' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredBrands.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No brands found matching your filters
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Brand</Text>
                  <TouchableOpacity onPress={closeModal}>
                    <X size={24} color="#333" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={styles.label}>Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="Brand name"
                  />

                  <Text style={styles.label}>Category</Text>
                  <TextInput
                    style={styles.input}
                    value={formCategory}
                    onChangeText={setFormCategory}
                    placeholder="e.g., Food & Beverage, Technology"
                  />

                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formDescription}
                    onChangeText={setFormDescription}
                    placeholder="Brief description"
                    multiline
                    numberOfLines={3}
                  />

                  <Text style={styles.label}>Website</Text>
                  <TextInput
                    style={styles.input}
                    value={formWebsite}
                    onChangeText={setFormWebsite}
                    placeholder="https://example.com"
                    autoCapitalize="none"
                  />

                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={formLocation}
                    onChangeText={setFormLocation}
                    placeholder="City, State, Country"
                  />

                  <Text style={styles.label}>Status</Text>
                  <View style={styles.statusButtons}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        formStatus === 'auto-created' && styles.statusButtonActive
                      ]}
                      onPress={() => setFormStatus('auto-created')}
                    >
                      <Text style={styles.statusButtonText}>Auto-Created</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        formStatus === 'in-progress' && styles.statusButtonActive
                      ]}
                      onPress={() => setFormStatus('in-progress')}
                    >
                      <Text style={styles.statusButtonText}>In Progress</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        formStatus === 'verified' && styles.statusButtonActive
                      ]}
                      onPress={() => setFormStatus('verified')}
                    >
                      <Text style={styles.statusButtonText}>Verified</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
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
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  brandCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 4,
  },
  brandCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  brandDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  emptyValue: {
    fontStyle: 'italic',
    color: '#999',
  },
  referenceText: {
    fontSize: 12,
    color: '#007bff',
  },
  brandActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  verifyButton: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  deleteButton: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#007bff',
    fontWeight: '500',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 12,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  statusButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#007bff',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
