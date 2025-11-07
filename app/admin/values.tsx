/**
 * Admin Panel - Values Management
 *
 * Full CRUD operations for values/causes collection in Firebase
 * Uses aligned1-10 and unaligned1-10 field structure
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
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface ValueData {
  id: string;
  name: string;
  category?: string;
  aligned1?: string;
  aligned2?: string;
  aligned3?: string;
  aligned4?: string;
  aligned5?: string;
  aligned6?: string;
  aligned7?: string;
  aligned8?: string;
  aligned9?: string;
  aligned10?: string;
  unaligned1?: string;
  unaligned2?: string;
  unaligned3?: string;
  unaligned4?: string;
  unaligned5?: string;
  unaligned6?: string;
  unaligned7?: string;
  unaligned8?: string;
  unaligned9?: string;
  unaligned10?: string;
}

export default function ValuesManagement() {
  const [values, setValues] = useState<ValueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingValue, setEditingValue] = useState<ValueData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state - now includes category and all 20 brand fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formAligned, setFormAligned] = useState<string[]>(Array(10).fill(''));
  const [formUnaligned, setFormUnaligned] = useState<string[]>(Array(10).fill(''));

  useEffect(() => {
    loadValues();
  }, []);

  const loadValues = async () => {
    try {
      setIsLoading(true);
      const valuesRef = collection(db, 'values');
      const snapshot = await getDocs(valuesRef);

      const loadedValues: ValueData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || doc.id,
          category: data.category || '',
          aligned1: data.aligned1 || '',
          aligned2: data.aligned2 || '',
          aligned3: data.aligned3 || '',
          aligned4: data.aligned4 || '',
          aligned5: data.aligned5 || '',
          aligned6: data.aligned6 || '',
          aligned7: data.aligned7 || '',
          aligned8: data.aligned8 || '',
          aligned9: data.aligned9 || '',
          aligned10: data.aligned10 || '',
          unaligned1: data.unaligned1 || '',
          unaligned2: data.unaligned2 || '',
          unaligned3: data.unaligned3 || '',
          unaligned4: data.unaligned4 || '',
          unaligned5: data.unaligned5 || '',
          unaligned6: data.unaligned6 || '',
          unaligned7: data.unaligned7 || '',
          unaligned8: data.unaligned8 || '',
          unaligned9: data.unaligned9 || '',
          unaligned10: data.unaligned10 || '',
        };
      });

      setValues(loadedValues);
    } catch (error) {
      console.error('Error loading values:', error);
      Alert.alert('Error', 'Failed to load values from Firebase');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingValue(null);
    setFormId('');
    setFormName('');
    setFormCategory('');
    setFormAligned(Array(10).fill(''));
    setFormUnaligned(Array(10).fill(''));
    setShowModal(true);
  };

  const openEditModal = (value: ValueData) => {
    setEditingValue(value);
    setFormId(value.id);
    setFormName(value.name);
    setFormCategory(value.category || '');

    // Load aligned brands
    const aligned = [];
    for (let i = 1; i <= 10; i++) {
      const key = `aligned${i}` as keyof ValueData;
      aligned.push(value[key] || '');
    }
    setFormAligned(aligned);

    // Load unaligned brands
    const unaligned = [];
    for (let i = 1; i <= 10; i++) {
      const key = `unaligned${i}` as keyof ValueData;
      unaligned.push(value[key] || '');
    }
    setFormUnaligned(unaligned);

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingValue(null);
  };

  const handleSave = async () => {
    if (!formId.trim() || !formName.trim()) {
      Alert.alert('Error', 'ID and Name are required');
      return;
    }

    try {
      // Build the value data object with aligned1-10 and unaligned1-10 fields
      const valueData: any = {
        id: formId.trim(),
        name: formName.trim(),
        category: formCategory.trim() || 'general',
      };

      // Add aligned brands (only non-empty ones)
      for (let i = 0; i < 10; i++) {
        const brand = formAligned[i]?.trim();
        if (brand) {
          valueData[`aligned${i + 1}`] = brand;
        }
      }

      // Add unaligned brands (only non-empty ones)
      for (let i = 0; i < 10; i++) {
        const brand = formUnaligned[i]?.trim();
        if (brand) {
          valueData[`unaligned${i + 1}`] = brand;
        }
      }

      const valueRef = doc(db, 'values', valueData.id);
      await setDoc(valueRef, valueData);

      Alert.alert(
        'Success',
        `Value "${valueData.name}" ${editingValue ? 'updated' : 'created'} successfully`
      );

      closeModal();
      loadValues();
    } catch (error) {
      console.error('Error saving value:', error);
      Alert.alert('Error', 'Failed to save value');
    }
  };

  const handleDelete = (value: ValueData) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${value.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const valueRef = doc(db, 'values', value.id);
              await deleteDoc(valueRef);
              Alert.alert('Success', `Value "${value.name}" deleted successfully`);
              loadValues();
            } catch (error) {
              console.error('Error deleting value:', error);
              Alert.alert('Error', 'Failed to delete value');
            }
          },
        },
      ]
    );
  };

  const filteredValues = values.filter(
    (value) =>
      value.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      value.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get all aligned brands for a value
  const getAlignedBrands = (value: ValueData): string[] => {
    const brands = [];
    for (let i = 1; i <= 10; i++) {
      const key = `aligned${i}` as keyof ValueData;
      const brand = value[key];
      if (brand) brands.push(brand);
    }
    return brands;
  };

  // Helper to get all unaligned brands for a value
  const getUnalignedBrands = (value: ValueData): string[] => {
    const brands = [];
    for (let i = 1; i <= 10; i++) {
      const key = `unaligned${i}` as keyof ValueData;
      const brand = value[key];
      if (brand) brands.push(brand);
    }
    return brands;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading values...</Text>
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
        <Text style={styles.title}>Values Management</Text>
        <Text style={styles.subtitle}>{values.length} values in database</Text>
      </View>

      {/* Actions Bar */}
      <View style={styles.actionsBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search values..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Value</Text>
        </TouchableOpacity>
      </View>

      {/* Values List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.listContainer}>
          {filteredValues.map((value) => {
            const alignedBrands = getAlignedBrands(value);
            const unalignedBrands = getUnalignedBrands(value);

            return (
              <View key={value.id} style={styles.valueCard}>
                <View style={styles.valueHeader}>
                  <View style={styles.valueInfo}>
                    <Text style={styles.valueName}>{value.name}</Text>
                    <Text style={styles.valueId}>ID: {value.id}</Text>
                    {value.category && (
                      <Text style={styles.valueCategory}>Category: {value.category}</Text>
                    )}
                  </View>
                  <View style={styles.valueActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(value)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(value)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.valueDetails}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Aligned Brands ({alignedBrands.length}/10):</Text>
                    <Text style={styles.detailText}>
                      {alignedBrands.length > 0
                        ? alignedBrands.slice(0, 5).join(', ') +
                          (alignedBrands.length > 5 ? '...' : '')
                        : 'None'}
                    </Text>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Unaligned Brands ({unalignedBrands.length}/10):</Text>
                    <Text style={styles.detailText}>
                      {unalignedBrands.length > 0
                        ? unalignedBrands.slice(0, 5).join(', ') +
                          (unalignedBrands.length > 5 ? '...' : '')
                        : 'None'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingValue ? 'Edit Value' : 'Add New Value'}
              </Text>

              <Text style={styles.label}>ID (lowercase, hyphenated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., gun-rights"
                value={formId}
                onChangeText={setFormId}
                editable={!editingValue}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Gun Rights"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., ideology, social, environmental"
                value={formCategory}
                onChangeText={setFormCategory}
              />

              <Text style={styles.sectionHeader}>Aligned Brands (Top 10)</Text>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <View key={`aligned-${i}`} style={styles.brandInputRow}>
                  <Text style={styles.brandLabel}>{i + 1}.</Text>
                  <TextInput
                    style={styles.brandInput}
                    placeholder={`Aligned brand #${i + 1}`}
                    value={formAligned[i]}
                    onChangeText={(text) => {
                      const newAligned = [...formAligned];
                      newAligned[i] = text;
                      setFormAligned(newAligned);
                    }}
                  />
                </View>
              ))}

              <Text style={styles.sectionHeader}>Unaligned Brands (Top 10)</Text>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <View key={`unaligned-${i}`} style={styles.brandInputRow}>
                  <Text style={styles.brandLabel}>{i + 1}.</Text>
                  <TextInput
                    style={styles.brandInput}
                    placeholder={`Unaligned brand #${i + 1}`}
                    value={formUnaligned[i]}
                    onChangeText={(text) => {
                      const newUnaligned = [...formUnaligned];
                      newUnaligned[i] = text;
                      setFormUnaligned(newUnaligned);
                    }}
                  />
                </View>
              ))}

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
        </View>
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
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  valueCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  valueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  valueInfo: {
    flex: 1,
  },
  valueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  valueId: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  valueCategory: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  valueActions: {
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
  valueDetails: {
    gap: 8,
  },
  detailSection: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  brandInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  brandLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 24,
  },
  brandInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
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
