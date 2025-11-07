/**
 * Admin Panel - Values Management
 *
 * Full CRUD operations for values/causes collection in Firebase
 * Uses aligned1-10 and unaligned1-10 format as stored in Firebase
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
  aligned?: string[]; // Array of aligned brand names
  unaligned?: string[]; // Array of unaligned brand names
}

export default function ValuesManagement() {
  const [values, setValues] = useState<ValueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [editingValue, setEditingValue] = useState<ValueData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state - comma-separated strings for easy editing
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [alignedText, setAlignedText] = useState(''); // Comma-separated brand names
  const [unalignedText, setUnalignedText] = useState(''); // Comma-separated brand names

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

        // Handle new array format (after migration)
        let aligned = data.aligned || [];
        let unaligned = data.unaligned || [];

        // Handle old format (before migration) - convert numbered fields to arrays
        if (aligned.length === 0) {
          const oldAligned = [];
          for (let i = 1; i <= 10; i++) {
            if (data[`aligned${i}`]) oldAligned.push(data[`aligned${i}`]);
          }
          if (oldAligned.length > 0) aligned = oldAligned;
        }

        if (unaligned.length === 0) {
          const oldUnaligned = [];
          for (let i = 1; i <= 10; i++) {
            if (data[`unaligned${i}`]) oldUnaligned.push(data[`unaligned${i}`]);
          }
          if (oldUnaligned.length > 0) unaligned = oldUnaligned;
        }

        return {
          id: doc.id,
          name: data.name || doc.id,
          category: data.category,
          aligned,
          unaligned,
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
    setAlignedText('');
    setUnalignedText('');
    setShowModal(true);
  };

  const openEditModal = (value: ValueData) => {
    setEditingValue(value);
    setFormId(value.id);
    setFormName(value.name);
    setFormCategory(value.category || '');

    // Convert arrays to comma-separated strings
    setAlignedText(value.aligned?.join(', ') || '');
    setUnalignedText(value.unaligned?.join(', ') || '');

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
      // Parse comma-separated strings into arrays
      const aligned = alignedText
        .split(',')
        .map(brand => brand.trim())
        .filter(brand => brand.length > 0);

      const unaligned = unalignedText
        .split(',')
        .map(brand => brand.trim())
        .filter(brand => brand.length > 0);

      const valueData: any = {
        id: formId.trim(),
        name: formName.trim(),
        aligned,
        unaligned,
      };

      if (formCategory.trim()) {
        valueData.category = formCategory.trim();
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
          const valueData: any = {};

          headers.forEach((header, index) => {
            if (values[index]) {
              valueData[header] = values[index];
            }
          });

          if (!valueData.id || !valueData.name) {
            errorCount++;
            continue;
          }

          // Parse aligned and unaligned as comma-separated strings if present
          const aligned = valueData.aligned ? valueData.aligned.split(';').map((b: string) => b.trim()).filter((b: string) => b) : [];
          const unaligned = valueData.unaligned ? valueData.unaligned.split(';').map((b: string) => b.trim()).filter((b: string) => b) : [];

          const valueRef = doc(db, 'values', valueData.id);
          await setDoc(valueRef, {
            name: valueData.name,
            category: valueData.category || '',
            aligned,
            unaligned,
          });

          successCount++;
        } catch (err) {
          console.error('Error creating value:', err);
          errorCount++;
        }
      }

      Alert.alert(
        'Bulk Create Complete',
        `Successfully created ${successCount} values. ${errorCount} errors.`
      );

      setShowBulkModal(false);
      setBulkData('');
      loadValues();
    } catch (error) {
      console.error('Error in bulk create:', error);
      Alert.alert('Error', 'Failed to bulk create values');
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

  // Helper functions for displaying aligned/unaligned brands
  const countAligned = (value: ValueData) => value.aligned?.length || 0;
  const countUnaligned = (value: ValueData) => value.unaligned?.length || 0;
  const getAlignedList = (value: ValueData) => value.aligned || [];
  const getUnalignedList = (value: ValueData) => value.unaligned || [];

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
        <TouchableOpacity style={styles.bulkButton} onPress={() => setShowBulkModal(true)}>
          <Text style={styles.bulkButtonText}>Bulk Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Value</Text>
        </TouchableOpacity>
      </View>

      {/* Values List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.listContainer}>
          {filteredValues.map((value) => {
            const alignedBrands = getAlignedList(value);
            const unalignedBrands = getUnalignedList(value);

            return (
              <View key={value.id} style={styles.valueCard}>
                <View style={styles.valueHeader}>
                  <View style={styles.valueInfo}>
                    <Text style={styles.valueName}>{value.name}</Text>
                    <Text style={styles.valueId}>ID: {value.id}</Text>
                    {value.category && <Text style={styles.valueCategory}>Category: {value.category}</Text>}
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
                    <Text style={styles.detailLabel}>Aligned ({countAligned(value)}):</Text>
                    <Text style={styles.detailText}>
                      {alignedBrands.length > 0
                        ? alignedBrands.slice(0, 5).join(', ') +
                          (alignedBrands.length > 5 ? '...' : '')
                        : 'None'}
                    </Text>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Unaligned ({countUnaligned(value)}):</Text>
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
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
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

              <Text style={styles.label}>Category (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., ideology, religion, social_issue"
                value={formCategory}
                onChangeText={setFormCategory}
                autoCapitalize="none"
              />

              <Text style={styles.sectionTitle}>Aligned Brands</Text>
              <Text style={styles.helpText}>
                Enter brand names separated by commas (e.g., "Apple, Nike, Amazon")
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Brand1, Brand2, Brand3, ..."
                value={alignedText}
                onChangeText={setAlignedText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.sectionTitle}>Unaligned Brands</Text>
              <Text style={styles.helpText}>
                Enter brand names separated by commas (e.g., "Nike, Adidas, Starbucks")
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Brand1, Brand2, Brand3, ..."
                value={unalignedText}
                onChangeText={setUnalignedText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
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
        </View>
      </Modal>

      {/* Bulk Create Modal */}
      <Modal visible={showBulkModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Bulk Create Values</Text>
              <Text style={styles.helpText}>
                Paste CSV data below. First row must be headers.
                {'\n\n'}
                <Text style={styles.boldText}>Format:</Text> id,name,category,aligned,unaligned
                {'\n'}
                <Text style={styles.boldText}>All Available Fields:</Text>
                {'\n'}• id (required): lowercase, hyphenated identifier (e.g., "gun-rights")
                {'\n'}• name (required): display name (e.g., "Gun Rights")
                {'\n'}• category (optional): e.g., "ideology", "religion", "social_issue"
                {'\n'}• aligned (optional): brands supporting this value, separated by semicolons (;)
                {'\n'}• unaligned (optional): brands opposing this value, separated by semicolons (;)
                {'\n\n'}
                <Text style={styles.boldText}>Basic Example:</Text>
                {'\n'}id,name,category
                {'\n'}gun-rights,Gun Rights,ideology
                {'\n\n'}
                <Text style={styles.boldText}>Full Example with Brand Alignments:</Text>
                {'\n'}id,name,category,aligned,unaligned
                {'\n'}gun-rights,Gun Rights,ideology,Smith & Wesson;Glock;Cabela's,Dick's Sporting Goods;REI
                {'\n'}environmental-protection,Environmental Protection,social_issue,Patagonia;Ben & Jerry's;Seventh Generation,ExxonMobil;Shell
              </Text>

              <TextInput
                style={[styles.textArea, styles.bulkTextArea]}
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
    fontFamily: 'monospace',
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
  },
  valueCategory: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 2,
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
  modalScrollContent: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
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
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  boldText: {
    fontWeight: '600',
    color: '#333',
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
