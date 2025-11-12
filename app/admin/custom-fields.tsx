/**
 * Admin Panel - Custom Fields Management
 *
 * Create and manage custom fields for all collections
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
import {
  getAllCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  CustomField,
  FieldType,
  CollectionType,
} from '@/services/firebase/customFieldsService';
import { Picker } from '@react-native-picker/picker';

export default function CustomFieldsManagement() {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<CollectionType | 'all'>('all');

  // Form state
  const [formCollection, setFormCollection] = useState<CollectionType>('users');
  const [formFieldName, setFormFieldName] = useState('');
  const [formFieldLabel, setFormFieldLabel] = useState('');
  const [formFieldType, setFormFieldType] = useState<FieldType>('string');
  const [formRequired, setFormRequired] = useState(false);
  const [formDefaultValue, setFormDefaultValue] = useState('');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    try {
      setIsLoading(true);
      const fields = await getAllCustomFields();
      setCustomFields(fields);
    } catch (error) {
      console.error('Error loading custom fields:', error);
      Alert.alert('Error', 'Failed to load custom fields');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingField(null);
    setFormCollection('users');
    setFormFieldName('');
    setFormFieldLabel('');
    setFormFieldType('string');
    setFormRequired(false);
    setFormDefaultValue('');
    setFormDescription('');
    setShowModal(true);
  };

  const openEditModal = (field: CustomField) => {
    setEditingField(field);
    setFormCollection(field.collection);
    setFormFieldName(field.fieldName);
    setFormFieldLabel(field.fieldLabel);
    setFormFieldType(field.fieldType);
    setFormRequired(field.required);
    setFormDefaultValue(field.defaultValue || '');
    setFormDescription(field.description || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingField(null);
  };

  const handleSave = async () => {
    if (!formFieldName || !formFieldLabel) {
      Alert.alert('Error', 'Field name and label are required');
      return;
    }

    // Validate field name (must be a valid Firestore field name)
    const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!fieldNameRegex.test(formFieldName)) {
      Alert.alert(
        'Invalid Field Name',
        'Field name must start with a letter or underscore and contain only letters, numbers, and underscores'
      );
      return;
    }

    try {
      if (editingField) {
        // Update existing field
        await updateCustomField(editingField.id, {
          collection: formCollection,
          fieldName: formFieldName,
          fieldLabel: formFieldLabel,
          fieldType: formFieldType,
          required: formRequired,
          defaultValue: formDefaultValue,
          description: formDescription,
        });
        Alert.alert('Success', 'Custom field updated successfully');
      } else {
        // Create new field
        await createCustomField({
          collection: formCollection,
          fieldName: formFieldName,
          fieldLabel: formFieldLabel,
          fieldType: formFieldType,
          required: formRequired,
          defaultValue: formDefaultValue,
          description: formDescription,
        });
        Alert.alert('Success', 'Custom field created successfully');
      }

      closeModal();
      loadCustomFields();
    } catch (error) {
      console.error('Error saving custom field:', error);
      Alert.alert('Error', 'Failed to save custom field');
    }
  };

  const handleDelete = (field: CustomField) => {
    Alert.alert(
      'Delete Custom Field',
      `Are you sure you want to delete "${field.fieldLabel}"? This will not remove the data from existing documents, but the field will no longer be managed as a custom field.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomField(field.id);
              Alert.alert('Success', 'Custom field deleted');
              loadCustomFields();
            } catch (error) {
              console.error('Error deleting custom field:', error);
              Alert.alert('Error', 'Failed to delete custom field');
            }
          },
        },
      ]
    );
  };

  const filteredFields =
    selectedCollection === 'all'
      ? customFields
      : customFields.filter((field) => field.collection === selectedCollection);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading custom fields...</Text>
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
        <Text style={styles.title}>Custom Fields Management</Text>
        <Text style={styles.subtitle}>
          Create custom fields for users, businesses, brands, and transactions
        </Text>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Collection:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedCollection}
              onValueChange={(value) => setSelectedCollection(value as CollectionType | 'all')}
              style={styles.picker}
            >
              <Picker.Item label="All Collections" value="all" />
              <Picker.Item label="Users" value="users" />
              <Picker.Item label="Businesses" value="businesses" />
              <Picker.Item label="Brands" value="brands" />
              <Picker.Item label="Transactions" value="transactions" />
            </Picker>
          </View>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
          <Text style={styles.createButtonText}>+ Create Field</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Fields List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.listContainer}>
          {filteredFields.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {selectedCollection === 'all'
                  ? 'No custom fields created yet'
                  : `No custom fields for ${selectedCollection}`}
              </Text>
            </View>
          ) : (
            filteredFields.map((field) => (
              <View key={field.id} style={styles.fieldCard}>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldInfo}>
                    <View style={styles.fieldTitleRow}>
                      <Text style={styles.fieldLabel}>{field.fieldLabel}</Text>
                      <View style={[styles.badge, getBadgeStyle(field.collection)]}>
                        <Text style={styles.badgeText}>{field.collection}</Text>
                      </View>
                    </View>
                    <Text style={styles.fieldName}>fieldName: {field.fieldName}</Text>
                    <Text style={styles.fieldType}>
                      Type: {field.fieldType} {field.required && '• Required'}
                    </Text>
                    {field.description && (
                      <Text style={styles.fieldDescription}>{field.description}</Text>
                    )}
                    {field.defaultValue && (
                      <Text style={styles.fieldDefault}>Default: {field.defaultValue}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.fieldActions}>
                  <TouchableOpacity
                    style={styles.editFieldButton}
                    onPress={() => openEditModal(field)}
                  >
                    <Text style={styles.editFieldButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteFieldButton}
                    onPress={() => handleDelete(field)}
                  >
                    <Text style={styles.deleteFieldButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
              </Text>

              <Text style={styles.label}>Collection *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formCollection}
                  onValueChange={(value) => setFormCollection(value as CollectionType)}
                  style={styles.picker}
                >
                  <Picker.Item label="Users" value="users" />
                  <Picker.Item label="Businesses" value="businesses" />
                  <Picker.Item label="Brands" value="brands" />
                  <Picker.Item label="Transactions" value="transactions" />
                </Picker>
              </View>

              <Text style={styles.label}>Field Name * (e.g., customField1)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., customField1, loyaltyPoints, membershipTier"
                value={formFieldName}
                onChangeText={setFormFieldName}
                autoCapitalize="none"
              />
              <Text style={styles.helpText}>
                Must start with a letter or underscore. Only letters, numbers, and underscores
                allowed.
              </Text>

              <Text style={styles.label}>Field Label * (Display Name)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Loyalty Points, Membership Tier"
                value={formFieldLabel}
                onChangeText={setFormFieldLabel}
              />

              <Text style={styles.label}>Field Type *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formFieldType}
                  onValueChange={(value) => setFormFieldType(value as FieldType)}
                  style={styles.picker}
                >
                  <Picker.Item label="Text (String)" value="string" />
                  <Picker.Item label="Number" value="number" />
                  <Picker.Item label="True/False (Boolean)" value="boolean" />
                  <Picker.Item label="Date" value="date" />
                  <Picker.Item label="URL" value="url" />
                  <Picker.Item label="Email" value="email" />
                  <Picker.Item label="Phone" value="phone" />
                  <Picker.Item label="Text Area (Long Text)" value="textarea" />
                </Picker>
              </View>

              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormRequired(!formRequired)}
                >
                  <View
                    style={[styles.checkboxBox, formRequired && styles.checkboxBoxChecked]}
                  >
                    {formRequired && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Required Field</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Default Value (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Default value for this field"
                value={formDefaultValue}
                onChangeText={setFormDefaultValue}
              />

              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What is this field for?"
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>
                    {editingField ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function getBadgeStyle(collection: CollectionType) {
  switch (collection) {
    case 'users':
      return { backgroundColor: '#007bff' };
    case 'businesses':
      return { backgroundColor: '#28a745' };
    case 'brands':
      return { backgroundColor: '#ffc107' };
    case 'transactions':
      return { backgroundColor: '#dc3545' };
    default:
      return { backgroundColor: '#6c757d' };
  }
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginRight: 8,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  createButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  fieldCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldHeader: {
    marginBottom: 12,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fieldName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  fieldType: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  fieldDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  fieldDefault: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 4,
  },
  fieldActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editFieldButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  editFieldButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteFieldButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteFieldButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginBottom: 8,
  },
  checkboxRow: {
    marginVertical: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#555',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 14,
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
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
