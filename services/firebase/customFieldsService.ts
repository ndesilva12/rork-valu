import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'url' | 'email' | 'phone' | 'textarea';
export type CollectionType = 'users' | 'businesses' | 'brands' | 'transactions';

export interface CustomField {
  id: string;
  collection: CollectionType;
  fieldName: string;
  fieldLabel: string;
  fieldType: FieldType;
  required: boolean;
  defaultValue?: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Create a new custom field
 */
export async function createCustomField(field: Omit<CustomField, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    console.log('[CustomFields] Creating new custom field:', field);

    // Generate a unique ID
    const customFieldsRef = collection(db, 'customFields');
    const newFieldRef = doc(customFieldsRef);

    const fieldData = {
      ...field,
      id: newFieldRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newFieldRef, fieldData);

    console.log('[CustomFields] ✅ Custom field created:', newFieldRef.id);
    return newFieldRef.id;
  } catch (error) {
    console.error('[CustomFields] ❌ Error creating custom field:', error);
    throw error;
  }
}

/**
 * Get all custom fields for a specific collection
 */
export async function getCustomFields(collectionType: CollectionType): Promise<CustomField[]> {
  try {
    console.log('[CustomFields] Fetching custom fields for:', collectionType);

    const customFieldsRef = collection(db, 'customFields');
    const q = query(customFieldsRef, where('collection', '==', collectionType));
    const snapshot = await getDocs(q);

    const fields: CustomField[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as CustomField));

    console.log('[CustomFields] ✅ Found', fields.length, 'custom fields');
    return fields;
  } catch (error) {
    console.error('[CustomFields] ❌ Error fetching custom fields:', error);
    throw error;
  }
}

/**
 * Get all custom fields across all collections
 */
export async function getAllCustomFields(): Promise<CustomField[]> {
  try {
    console.log('[CustomFields] Fetching all custom fields');

    const customFieldsRef = collection(db, 'customFields');
    const snapshot = await getDocs(customFieldsRef);

    const fields: CustomField[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as CustomField));

    console.log('[CustomFields] ✅ Found', fields.length, 'total custom fields');
    return fields;
  } catch (error) {
    console.error('[CustomFields] ❌ Error fetching all custom fields:', error);
    throw error;
  }
}

/**
 * Update a custom field
 */
export async function updateCustomField(
  fieldId: string,
  updates: Partial<Omit<CustomField, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    console.log('[CustomFields] Updating custom field:', fieldId);

    const fieldRef = doc(db, 'customFields', fieldId);
    await setDoc(
      fieldRef,
      {
        ...updates,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('[CustomFields] ✅ Custom field updated');
  } catch (error) {
    console.error('[CustomFields] ❌ Error updating custom field:', error);
    throw error;
  }
}

/**
 * Delete a custom field
 */
export async function deleteCustomField(fieldId: string): Promise<void> {
  try {
    console.log('[CustomFields] Deleting custom field:', fieldId);

    const fieldRef = doc(db, 'customFields', fieldId);
    await deleteDoc(fieldRef);

    console.log('[CustomFields] ✅ Custom field deleted');
  } catch (error) {
    console.error('[CustomFields] ❌ Error deleting custom field:', error);
    throw error;
  }
}
