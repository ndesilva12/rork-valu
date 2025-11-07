/**
 * Admin Panel - Values Management
 *
 * Full CRUD operations for values/causes collection in Firebase
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
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface ValueData {
  id: string;
  name: string;
  support: string[];
  oppose: string[];
}

export default function ValuesManagement() {
  const [values, setValues] = useState<ValueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingValue, setEditingValue] = useState<ValueData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formSupport, setFormSupport] = useState('');
  const [formOppose, setFormOppose] = useState('');

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
          support: data.support || [],
          oppose: data.oppose || [],
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
    setFormSupport('');
    setFormOppose('');
    setShowModal(true);
  };

  const openEditModal = (value: ValueData) => {
    setEditingValue(value);
    setFormId(value.id);
    setFormName(value.name);
    setFormSupport(value.support.join(', '));
    setFormOppose(value.oppose.join(', '));
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
      const valueData: ValueData = {
        id: formId.trim(),
        name: formName.trim(),
        support: formSupport
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s),
        oppose: formOppose
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s),
      };

      const valueRef = doc(db, 'values', valueData.id);
      await setDoc(valueRef, {
        name: valueData.name,
        support: valueData.support,
        oppose: valueData.oppose,
      });

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
          {filteredValues.map((value) => (
            <View key={value.id} style={styles.valueCard}>
              <View style={styles.valueHeader}>
                <View style={styles.valueInfo}>
                  <Text style={styles.valueName}>{value.name}</Text>
                  <Text style={styles.valueId}>ID: {value.id}</Text>
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
                  <Text style={styles.detailLabel}>Support ({value.support.length}):</Text>
                  <Text style={styles.detailText}>
                    {value.support.length > 0
                      ? value.support.slice(0, 5).join(', ') +
                        (value.support.length > 5 ? '...' : '')
                      : 'None'}
                  </Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Oppose ({value.oppose.length}):</Text>
                  <Text style={styles.detailText}>
                    {value.oppose.length > 0
                      ? value.oppose.slice(0, 5).join(', ') +
                        (value.oppose.length > 5 ? '...' : '')
                      : 'None'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
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

            <Text style={styles.label}>Support (comma-separated brand names)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brand1, Brand2, Brand3"
              value={formSupport}
              onChangeText={setFormSupport}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Oppose (comma-separated brand names)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brand1, Brand2, Brand3"
              value={formOppose}
              onChangeText={setFormOppose}
              multiline
              numberOfLines={4}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxHeight: '90%',
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
