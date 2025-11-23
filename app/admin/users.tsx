/**
 * Admin Panel - Users Management
 *
 * Edit ALL fields for user accounts
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
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { getCustomFields, CustomField } from '@/services/firebase/customFieldsService';
import { getUserLists, deleteList, removeEntryFromList, addEntryToList, updateEntryInList } from '@/services/firebase/listService';
import { UserList, ListEntry } from '@/types/library';
import { Picker } from '@react-native-picker/picker';

interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  yelp?: string;
  youtube?: string;
}

interface UserDetails {
  name?: string;
  description?: string;
  website?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  socialMedia?: SocialMedia;
}

interface Cause {
  id: string;
  name: string;
  category: string;
  type: 'support' | 'avoid';
}

interface Charity {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface UserData {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  userDetails?: UserDetails;
  causes: Cause[];
  searchHistory: string[];
  promoCode?: string;
  donationAmount?: number;
  selectedCharities?: Charity[];
  consentGivenAt?: string;
  consentVersion?: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Form state - Basic Info
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formFullName, setFormFullName] = useState('');

  // Form state - User Details
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');

  // Form state - Social Media
  const [formFacebook, setFormFacebook] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formTwitter, setFormTwitter] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formYelp, setFormYelp] = useState('');
  const [formYoutube, setFormYoutube] = useState('');

  // Form state - Other fields
  const [formCauses, setFormCauses] = useState('');
  const [formSearchHistory, setFormSearchHistory] = useState('');
  const [formPromoCode, setFormPromoCode] = useState('');
  const [formDonationAmount, setFormDonationAmount] = useState('');
  const [formSelectedCharities, setFormSelectedCharities] = useState('');
  const [formConsentGivenAt, setFormConsentGivenAt] = useState('');
  const [formConsentVersion, setFormConsentVersion] = useState('');

  // List management state
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [newEntryBrandId, setNewEntryBrandId] = useState('');
  const [newEntryBusinessId, setNewEntryBusinessId] = useState('');
  const [editingEntryDateId, setEditingEntryDateId] = useState<string | null>(null);
  const [editingEntryDateValue, setEditingEntryDateValue] = useState('');

  useEffect(() => {
    loadUsers();
    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    try {
      const fields = await getCustomFields('users');
      setCustomFields(fields);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('accountType', '==', 'individual'));
      const snapshot = await getDocs(q);

      const loadedUsers: UserData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          userId: doc.id,
          email: data.email || 'No email',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          fullName: data.fullName || '',
          userDetails: data.userDetails || {},
          causes: data.causes || [],
          searchHistory: data.searchHistory || [],
          promoCode: data.promoCode || '',
          donationAmount: data.donationAmount || 0,
          selectedCharities: data.selectedCharities || [],
          consentGivenAt: data.consentGivenAt || '',
          consentVersion: data.consentVersion || '',
        };
      });

      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users from Firebase');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);

    // Basic info
    setFormFirstName(user.firstName || '');
    setFormLastName(user.lastName || '');
    setFormFullName(user.fullName || '');

    // User details
    const details = user.userDetails || {};
    setFormName(details.name || '');
    setFormDescription(details.description || '');
    setFormWebsite(details.website || '');
    setFormLocation(details.location || '');
    setFormLatitude(details.latitude?.toString() || '');
    setFormLongitude(details.longitude?.toString() || '');

    // Social media
    const social = details.socialMedia || {};
    setFormFacebook(social.facebook || '');
    setFormInstagram(social.instagram || '');
    setFormTwitter(social.twitter || '');
    setFormLinkedin(social.linkedin || '');
    setFormYelp(social.yelp || '');
    setFormYoutube(social.youtube || '');

    // Causes (formatted as id|name|category|type)
    setFormCauses(
      user.causes?.map((c) => `${c.id}|${c.name}|${c.category}|${c.type}`).join('\n') || ''
    );

    // Search history (one per line)
    setFormSearchHistory(user.searchHistory?.join('\n') || '');

    // Promo code
    setFormPromoCode(user.promoCode || '');

    // Donation amount
    setFormDonationAmount(user.donationAmount?.toString() || '');

    // Selected charities (formatted as id|name|description|category)
    setFormSelectedCharities(
      user.selectedCharities?.map((c) => `${c.id}|${c.name}|${c.description}|${c.category}`).join('\n') || ''
    );

    // Consent
    setFormConsentGivenAt(user.consentGivenAt || '');
    setFormConsentVersion(user.consentVersion || '');

    // Load custom field values from user data
    const customValues: Record<string, any> = {};
    customFields.forEach((field) => {
      customValues[field.fieldName] = (user as any)[field.fieldName] || field.defaultValue || '';
    });
    setCustomFieldValues(customValues);

    setShowModal(true);

    // Load user's lists
    if (user.userId) {
      loadUserLists(user.userId);
    }
  };

  const loadUserLists = async (userId: string) => {
    setLoadingLists(true);
    try {
      const lists = await getUserLists(userId);
      setUserLists(lists);
    } catch (error) {
      console.error('[Admin] Error loading user lists:', error);
      if (Platform.OS === 'web') {
        window.alert('Error loading user lists');
      } else {
        Alert.alert('Error', 'Could not load user lists');
      }
    } finally {
      setLoadingLists(false);
    }
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!editingUser) return;

    const confirmDelete = Platform.OS === 'web'
      ? window.confirm(`Are you sure you want to delete the list "${listName}"? This action cannot be undone.`)
      : await new Promise((resolve) => {
          Alert.alert(
            'Delete List',
            `Are you sure you want to delete "${listName}"? This action cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmDelete) return;

    try {
      await deleteList(listId);
      await loadUserLists(editingUser.userId);
      if (Platform.OS === 'web') {
        window.alert(`List "${listName}" deleted successfully`);
      } else {
        Alert.alert('Success', `List "${listName}" deleted successfully`);
      }
    } catch (error) {
      console.error('[Admin] Error deleting list:', error);
      if (Platform.OS === 'web') {
        window.alert('Error deleting list');
      } else {
        Alert.alert('Error', 'Could not delete list');
      }
    }
  };

  const handleRemoveEntry = async (listId: string, entryId: string, entryName: string) => {
    if (!editingUser) return;

    try {
      await removeEntryFromList(listId, entryId);
      await loadUserLists(editingUser.userId);
      if (Platform.OS === 'web') {
        window.alert(`Removed "${entryName}" from list`);
      } else {
        Alert.alert('Success', `Removed "${entryName}" from list`);
      }
    } catch (error) {
      console.error('[Admin] Error removing entry:', error);
      if (Platform.OS === 'web') {
        window.alert('Error removing entry');
      } else {
        Alert.alert('Error', 'Could not remove entry');
      }
    }
  };

  const handleAddEntry = async (listId: string) => {
    if (!newEntryBrandId && !newEntryBusinessId) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a Brand ID or Business ID');
      } else {
        Alert.alert('Error', 'Please enter a Brand ID or Business ID');
      }
      return;
    }

    if (newEntryBrandId && newEntryBusinessId) {
      if (Platform.OS === 'web') {
        window.alert('Please enter either a Brand ID OR a Business ID, not both');
      } else {
        Alert.alert('Error', 'Please enter either a Brand ID OR a Business ID, not both');
      }
      return;
    }

    try {
      const entry: ListEntry = newEntryBrandId
        ? {
            type: 'brand',
            brandId: newEntryBrandId,
            name: newEntryBrandId, // Admin should use actual brand name
            website: '',
            logoUrl: '',
          }
        : {
            type: 'business',
            businessId: newEntryBusinessId,
            name: newEntryBusinessId, // Admin should use actual business name
            website: '',
            logoUrl: '',
          };

      await addEntryToList(listId, entry);

      if (editingUser) {
        await loadUserLists(editingUser.userId);
      }

      setNewEntryBrandId('');
      setNewEntryBusinessId('');
      setEditingListId(null);

      if (Platform.OS === 'web') {
        window.alert('Entry added successfully');
      } else {
        Alert.alert('Success', 'Entry added successfully');
      }
    } catch (error) {
      console.error('[Admin] Error adding entry:', error);
      if (Platform.OS === 'web') {
        window.alert('Error adding entry');
      } else {
        Alert.alert('Error', 'Could not add entry');
      }
    }
  };

  // Helper to format date for display
  const formatDateForDisplay = (date: Date | string | undefined): string => {
    if (!date) return 'Not set';
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (typeof date === 'object' && 'seconds' in date) {
      d = new Date((date as any).seconds * 1000);
    } else {
      return 'Invalid date';
    }
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Helper to calculate days from date
  const calculateDaysFromDate = (date: Date | string | undefined): number => {
    if (!date) return 0;
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (typeof date === 'object' && 'seconds' in date) {
      d = new Date((date as any).seconds * 1000);
    } else {
      return 0;
    }
    if (isNaN(d.getTime())) return 0;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Handle updating entry's createdAt date
  const handleUpdateEntryDate = async (listId: string, entryId: string, newDateString: string) => {
    if (!editingUser) return;

    try {
      const newDate = new Date(newDateString);
      if (isNaN(newDate.getTime())) {
        if (Platform.OS === 'web') {
          window.alert('Invalid date format. Please use YYYY-MM-DD format.');
        } else {
          Alert.alert('Error', 'Invalid date format. Please use YYYY-MM-DD format.');
        }
        return;
      }

      await updateEntryInList(listId, entryId, { createdAt: newDate });
      await loadUserLists(editingUser.userId);

      setEditingEntryDateId(null);
      setEditingEntryDateValue('');

      if (Platform.OS === 'web') {
        window.alert('Entry date updated successfully');
      } else {
        Alert.alert('Success', 'Entry date updated successfully');
      }
    } catch (error) {
      console.error('[Admin] Error updating entry date:', error);
      if (Platform.OS === 'web') {
        window.alert('Error updating entry date');
      } else {
        Alert.alert('Error', 'Could not update entry date');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const parseCauses = (text: string): Cause[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => {
        const [id, name, category, type] = line.split('|').map((s) => s.trim());
        return {
          id: id || '',
          name: name || '',
          category: category || '',
          type: (type as 'support' | 'avoid') || 'support',
        };
      })
      .filter((item) => item.id && item.name);
  };

  const parseCharities = (text: string): Charity[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => {
        const [id, name, description, category] = line.split('|').map((s) => s.trim());
        return {
          id: id || '',
          name: name || '',
          description: description || '',
          category: category || '',
        };
      })
      .filter((item) => item.id && item.name);
  };

  const handleSave = async () => {
    if (!editingUser) {
      console.log('[Admin Users] No editing user found');
      return;
    }

    console.log('[Admin Users] Starting save for user:', editingUser.userId);

    try {
      // Build social media object - only include non-empty values
      const socialMedia: SocialMedia = {};
      if (formFacebook?.trim()) socialMedia.facebook = formFacebook.trim();
      if (formInstagram?.trim()) socialMedia.instagram = formInstagram.trim();
      if (formTwitter?.trim()) socialMedia.twitter = formTwitter.trim();
      if (formLinkedin?.trim()) socialMedia.linkedin = formLinkedin.trim();
      if (formYelp?.trim()) socialMedia.yelp = formYelp.trim();
      if (formYoutube?.trim()) socialMedia.youtube = formYoutube.trim();

      // Build user details object - only include non-empty values
      const userDetails: Record<string, any> = {};
      if (formName?.trim()) userDetails.name = formName.trim();
      if (formDescription?.trim()) userDetails.description = formDescription.trim();
      if (formWebsite?.trim()) userDetails.website = formWebsite.trim();
      if (formLocation?.trim()) userDetails.location = formLocation.trim();
      if (formLatitude && !isNaN(parseFloat(formLatitude))) {
        userDetails.latitude = parseFloat(formLatitude);
      }
      if (formLongitude && !isNaN(parseFloat(formLongitude))) {
        userDetails.longitude = parseFloat(formLongitude);
      }
      if (Object.keys(socialMedia).length > 0) {
        userDetails.socialMedia = socialMedia;
      }

      // Parse search history - only include non-empty lines
      const searchHistory = formSearchHistory
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);

      // Parse causes - only include valid ones
      const causes = parseCauses(formCauses);

      // Parse charities - only include valid ones
      const charities = parseCharities(formSelectedCharities);

      // Build update object - only include fields that have values
      const updatedData: Record<string, any> = {};

      // Basic info - always include even if empty
      if (formFirstName !== undefined) updatedData.firstName = formFirstName.trim();
      if (formLastName !== undefined) updatedData.lastName = formLastName.trim();
      if (formFullName !== undefined) updatedData.fullName = formFullName.trim();

      // User details - only include if has content
      if (Object.keys(userDetails).length > 0) {
        updatedData.userDetails = userDetails;
      }

      // Only include causes if there are valid ones
      if (causes.length > 0) {
        updatedData.causes = causes;
      }

      // Only include search history if there are items
      if (searchHistory.length > 0) {
        updatedData.searchHistory = searchHistory;
      }

      // Only include promo code if not empty
      if (formPromoCode?.trim()) {
        updatedData.promoCode = formPromoCode.trim();
      }

      // Only include donation amount if valid number
      if (formDonationAmount && !isNaN(parseFloat(formDonationAmount))) {
        updatedData.donationAmount = parseFloat(formDonationAmount);
      }

      // Only include charities if there are valid ones
      if (charities.length > 0) {
        updatedData.selectedCharities = charities;
      }

      // Only include consent fields if not empty
      if (formConsentGivenAt?.trim()) {
        updatedData.consentGivenAt = formConsentGivenAt.trim();
      }
      if (formConsentVersion?.trim()) {
        updatedData.consentVersion = formConsentVersion.trim();
      }

      // Add custom field values
      customFields.forEach((field) => {
        const value = customFieldValues[field.fieldName];
        if (value !== undefined && value !== '') {
          // Convert value based on field type
          switch (field.fieldType) {
            case 'number':
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                updatedData[field.fieldName] = numValue;
              }
              break;
            case 'boolean':
              updatedData[field.fieldName] = value === 'true' || value === true;
              break;
            default:
              if (typeof value === 'string' && value.trim()) {
                updatedData[field.fieldName] = value.trim();
              } else if (typeof value !== 'string') {
                updatedData[field.fieldName] = value;
              }
          }
        }
      });

      console.log('[Admin Users] Updating user with data:', updatedData);

      // Check if there's actually anything to update
      if (Object.keys(updatedData).length === 0) {
        console.log('[Admin Users] No fields to update');
        if (Platform.OS === 'web') {
          window.alert('No changes to save');
        } else {
          Alert.alert('Info', 'No changes to save');
        }
        return;
      }

      const userRef = doc(db, 'users', editingUser.userId);
      console.log('[Admin Users] User ref:', userRef.path);
      console.log('[Admin Users] Data to save:', JSON.stringify(updatedData, null, 2));

      // Update all user fields
      try {
        await updateDoc(userRef, updatedData);
        console.log('[Admin Users] ✅ updateDoc completed successfully');
      } catch (updateError: any) {
        console.error('[Admin Users] ❌ updateDoc failed:', updateError);
        console.error('[Admin Users] Error code:', updateError.code);
        console.error('[Admin Users] Error message:', updateError.message);
        throw updateError; // Re-throw to be caught by outer try-catch
      }

      console.log('[Admin Users] User updated successfully');

      // Close modal and reload users first
      closeModal();
      await loadUsers();

      // Show success message
      if (Platform.OS === 'web') {
        window.alert(`User "${formName || editingUser.email}" updated successfully`);
      } else {
        Alert.alert(
          'Success',
          `User "${formName || editingUser.email}" updated successfully`
        );
      }
    } catch (error: any) {
      console.error('[Admin Users] ❌ Error updating user:', error);
      console.error('[Admin Users] Error type:', typeof error);
      console.error('[Admin Users] Error code:', error?.code);
      console.error('[Admin Users] Error message:', error?.message);
      console.error('[Admin Users] Full error:', JSON.stringify(error, null, 2));

      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      if (Platform.OS === 'web') {
        window.alert(`Failed to update user data: ${errorMessage}\n\nCheck console for details.`);
      } else {
        Alert.alert('Error', `Failed to update user data: ${errorMessage}`);
      }
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    // Confirm deletion
    const confirmMessage = `Are you sure you want to delete user "${user.userDetails?.name || user.email}"?\n\nThis will:\n- Delete all Firebase data for this user\n- Delete their lists, transactions, etc.\n\nThis action CANNOT be undone!\n\nNote: If this user still exists in Clerk, you'll need to delete them there separately.`;

    const confirmed = Platform.OS === 'web'
      ? window.confirm(confirmMessage)
      : await new Promise((resolve) => {
          Alert.alert(
            'Delete User',
            confirmMessage,
            [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Delete', onPress: () => resolve(true), style: 'destructive' }
            ]
          );
        });

    if (!confirmed) return;

    try {
      console.log('[Admin Users] Deleting user:', user.userId);

      // Delete user document from Firebase
      const userRef = doc(db, 'users', user.userId);
      await deleteDoc(userRef);
      console.log('[Admin Users] ✅ User document deleted from Firebase');

      // Delete user's lists
      try {
        const listsRef = collection(db, 'userLists');
        const listsQuery = query(listsRef, where('userId', '==', user.userId));
        const listsSnapshot = await getDocs(listsQuery);

        const deleteListPromises = listsSnapshot.docs.map(listDoc =>
          deleteDoc(doc(db, 'userLists', listDoc.id))
        );
        await Promise.all(deleteListPromises);
        console.log('[Admin Users] ✅ Deleted', listsSnapshot.docs.length, 'user lists');
      } catch (listError) {
        console.error('[Admin Users] Error deleting lists:', listError);
      }

      // Delete user's transactions
      try {
        const transactionsRef = collection(db, 'transactions');
        const transactionsQuery = query(transactionsRef, where('userId', '==', user.userId));
        const transactionsSnapshot = await getDocs(transactionsQuery);

        const deleteTransactionPromises = transactionsSnapshot.docs.map(txDoc =>
          deleteDoc(doc(db, 'transactions', txDoc.id))
        );
        await Promise.all(deleteTransactionPromises);
        console.log('[Admin Users] ✅ Deleted', transactionsSnapshot.docs.length, 'transactions');
      } catch (txError) {
        console.error('[Admin Users] Error deleting transactions:', txError);
      }

      // Reload users list
      await loadUsers();

      // Show success message
      const successMessage = `User deleted successfully!\n\nReminder: If this user still exists in Clerk, you'll need to delete them manually at:\nhttps://dashboard.clerk.com`;

      if (Platform.OS === 'web') {
        window.alert(successMessage);
      } else {
        Alert.alert('Success', successMessage);
      }
    } catch (error: any) {
      console.error('[Admin Users] ❌ Error deleting user:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';

      if (Platform.OS === 'web') {
        window.alert(`Failed to delete user: ${errorMessage}`);
      } else {
        Alert.alert('Error', `Failed to delete user: ${errorMessage}`);
      }
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.userDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.userDetails?.location?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading users...</Text>
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
        <Text style={styles.title}>Users Management</Text>
        <Text style={styles.subtitle}>
          {users.length} user accounts ({filteredUsers.length} filtered)
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, styles.actionsBar]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.bulkButton} onPress={() => setShowBulkModal(true)}>
          <Text style={styles.bulkButtonText}>Bulk Create</Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.listContainer}>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No users found matching your search' : 'No user accounts yet'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <View key={user.userId} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {user.fullName || user.userDetails?.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User'}
                    </Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {(user.firstName || user.lastName) && (
                      <Text style={styles.userDetail}>
                        👤 {user.firstName} {user.lastName}
                      </Text>
                    )}
                    {user.userDetails?.location && (
                      <Text style={styles.userLocation}>📍 {user.userDetails.location}</Text>
                    )}
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(user)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteUser(user)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Preview */}
                <View style={styles.previewSection}>
                  <Text style={styles.previewText}>
                    {user.causes?.length || 0} causes • {user.searchHistory?.length || 0} searches
                  </Text>
                  {user.promoCode && (
                    <Text style={styles.previewText}>💳 Promo: {user.promoCode}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Edit User - {editingUser?.userDetails?.name || editingUser?.email}
              </Text>

              <View style={styles.userDetails}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{editingUser?.email}</Text>
                <Text style={styles.detailLabel}>User ID:</Text>
                <Text style={styles.detailValue}>{editingUser?.userId}</Text>
              </View>

              {/* BASIC INFO */}
              <Text style={styles.sectionTitle}>👤 Basic Information</Text>

              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="User's first name"
                value={formFirstName}
                onChangeText={setFormFirstName}
              />

              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="User's last name"
                value={formLastName}
                onChangeText={setFormLastName}
              />

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="User's full name"
                value={formFullName}
                onChangeText={setFormFullName}
              />

              {/* USER DETAILS */}
              <Text style={styles.sectionTitle}>📋 User Details (Profile)</Text>

              <Text style={styles.label}>Name (userDetails.name)</Text>
              <TextInput
                style={styles.input}
                placeholder="User's profile name"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="User bio or description"
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com"
                value={formWebsite}
                onChangeText={setFormWebsite}
              />

              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., New York, NY"
                value={formLocation}
                onChangeText={setFormLocation}
              />

              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="40.7128"
                value={formLatitude}
                onChangeText={setFormLatitude}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                placeholder="-74.0060"
                value={formLongitude}
                onChangeText={setFormLongitude}
                keyboardType="numeric"
              />

              {/* SOCIAL MEDIA */}
              <Text style={styles.sectionTitle}>📱 Social Media</Text>

              <Text style={styles.label}>Facebook</Text>
              <TextInput
                style={styles.input}
                placeholder="https://facebook.com/..."
                value={formFacebook}
                onChangeText={setFormFacebook}
              />

              <Text style={styles.label}>Instagram</Text>
              <TextInput
                style={styles.input}
                placeholder="https://instagram.com/..."
                value={formInstagram}
                onChangeText={setFormInstagram}
              />

              <Text style={styles.label}>Twitter</Text>
              <TextInput
                style={styles.input}
                placeholder="https://twitter.com/..."
                value={formTwitter}
                onChangeText={setFormTwitter}
              />

              <Text style={styles.label}>LinkedIn</Text>
              <TextInput
                style={styles.input}
                placeholder="https://linkedin.com/..."
                value={formLinkedin}
                onChangeText={setFormLinkedin}
              />

              <Text style={styles.label}>Yelp</Text>
              <TextInput
                style={styles.input}
                placeholder="https://yelp.com/..."
                value={formYelp}
                onChangeText={setFormYelp}
              />

              <Text style={styles.label}>YouTube</Text>
              <TextInput
                style={styles.input}
                placeholder="https://youtube.com/..."
                value={formYoutube}
                onChangeText={setFormYoutube}
              />

              {/* CAUSES / VALUES */}
              <Text style={styles.sectionTitle}>⭐ Causes / Values</Text>
              <Text style={styles.helpText}>
                Format: id|name|category|type (one per line). Type should be "support" or "avoid".
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="abortion|Abortion|social_issue|support&#10;climate|Climate Change|social_issue|avoid"
                value={formCauses}
                onChangeText={setFormCauses}
                multiline
                numberOfLines={10}
              />

              {/* SEARCH HISTORY */}
              <Text style={styles.sectionTitle}>🔍 Search History</Text>
              <Text style={styles.helpText}>
                One search term per line
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="nike&#10;starbucks&#10;apple"
                value={formSearchHistory}
                onChangeText={setFormSearchHistory}
                multiline
                numberOfLines={5}
              />

              {/* PROMO & DONATIONS */}
              <Text style={styles.sectionTitle}>💰 Promo & Donations</Text>

              <Text style={styles.label}>Promo Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., SAVE20"
                value={formPromoCode}
                onChangeText={setFormPromoCode}
              />

              <Text style={styles.label}>Donation Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={formDonationAmount}
                onChangeText={setFormDonationAmount}
                keyboardType="numeric"
              />

              {/* SELECTED CHARITIES */}
              <Text style={styles.sectionTitle}>🏥 Selected Charities</Text>
              <Text style={styles.helpText}>
                Format: id|name|description|category (one per line)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="redcross|Red Cross|Humanitarian aid|Health&#10;unicef|UNICEF|Children's welfare|Children"
                value={formSelectedCharities}
                onChangeText={setFormSelectedCharities}
                multiline
                numberOfLines={5}
              />

              {/* CONSENT */}
              <Text style={styles.sectionTitle}>✅ Consent Information</Text>

              <Text style={styles.label}>Consent Given At (ISO timestamp)</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-01T00:00:00.000Z"
                value={formConsentGivenAt}
                onChangeText={setFormConsentGivenAt}
              />

              <Text style={styles.label}>Consent Version</Text>
              <TextInput
                style={styles.input}
                placeholder="1.0"
                value={formConsentVersion}
                onChangeText={setFormConsentVersion}
              />

              {/* CUSTOM FIELDS */}
              {customFields.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>🔧 Custom Fields</Text>
                  <Text style={styles.helpText}>
                    These are custom fields you've created for user documents.
                  </Text>
                  {customFields.map((field) => (
                    <View key={field.id}>
                      <Text style={styles.label}>
                        {field.fieldLabel} {field.required && '*'}
                      </Text>
                      {field.description && (
                        <Text style={styles.helpText}>{field.description}</Text>
                      )}
                      {field.fieldType === 'boolean' ? (
                        <View style={styles.pickerWrapper}>
                          <Picker
                            selectedValue={customFieldValues[field.fieldName]?.toString() || 'false'}
                            onValueChange={(value) =>
                              setCustomFieldValues({
                                ...customFieldValues,
                                [field.fieldName]: value === 'true',
                              })
                            }
                            style={styles.picker}
                          >
                            <Picker.Item label="False" value="false" />
                            <Picker.Item label="True" value="true" />
                          </Picker>
                        </View>
                      ) : field.fieldType === 'textarea' ? (
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          placeholder={field.defaultValue || `Enter ${field.fieldLabel}`}
                          value={customFieldValues[field.fieldName]?.toString() || ''}
                          onChangeText={(value) =>
                            setCustomFieldValues({
                              ...customFieldValues,
                              [field.fieldName]: value,
                            })
                          }
                          multiline
                          numberOfLines={4}
                        />
                      ) : (
                        <TextInput
                          style={styles.input}
                          placeholder={field.defaultValue || `Enter ${field.fieldLabel}`}
                          value={customFieldValues[field.fieldName]?.toString() || ''}
                          onChangeText={(value) =>
                            setCustomFieldValues({
                              ...customFieldValues,
                              [field.fieldName]: value,
                            })
                          }
                          keyboardType={
                            field.fieldType === 'number'
                              ? 'numeric'
                              : field.fieldType === 'phone'
                              ? 'phone-pad'
                              : field.fieldType === 'email'
                              ? 'email-address'
                              : 'default'
                          }
                        />
                      )}
                    </View>
                  ))}
                </>
              )}

              {/* LIBRARY / LIST MANAGEMENT */}
              <Text style={styles.sectionTitle}>📚 Library / List Management</Text>
              <Text style={styles.helpText}>
                Manage this user's lists. Note: Endorsement lists, aligned/unaligned lists cannot be deleted.
              </Text>

              {loadingLists ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
              ) : userLists.length === 0 ? (
                <Text style={styles.helpText}>No lists found for this user.</Text>
              ) : (
                userLists.map((list) => {
                  const isProtected = list.isEndorsed ||
                                    list.name === 'Endorsements' ||
                                    list.name === 'Aligned' ||
                                    list.name === 'Unaligned';
                  const isExpanded = expandedListId === list.id;
                  const isEditing = editingListId === list.id;

                  return (
                    <View key={list.id} style={styles.listCard}>
                      <View style={styles.listHeader}>
                        <TouchableOpacity
                          style={styles.listTitleRow}
                          onPress={() => setExpandedListId(isExpanded ? null : list.id)}
                        >
                          <Text style={styles.listName}>{list.name}</Text>
                          <Text style={styles.listCount}>({list.entries?.length || 0} items)</Text>
                        </TouchableOpacity>

                        {!isProtected && (
                          <TouchableOpacity
                            style={styles.deleteListButton}
                            onPress={() => handleDeleteList(list.id, list.name)}
                          >
                            <Text style={styles.deleteListButtonText}>Delete List</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {isProtected && (
                        <Text style={styles.protectedText}>
                          🔒 Protected list - cannot be deleted
                        </Text>
                      )}

                      {isExpanded && (
                        <View style={styles.listEntries}>
                          <TouchableOpacity
                            style={styles.addEntryButton}
                            onPress={() => setEditingListId(isEditing ? null : list.id)}
                          >
                            <Text style={styles.addEntryButtonText}>
                              {isEditing ? 'Cancel' : '+ Add Brand/Business'}
                            </Text>
                          </TouchableOpacity>

                          {isEditing && (
                            <View style={styles.addEntryForm}>
                              <Text style={styles.label}>Brand ID</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="e.g., nike, starbucks"
                                value={newEntryBrandId}
                                onChangeText={setNewEntryBrandId}
                              />

                              <Text style={styles.label}>OR Business ID (Firebase ID)</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="e.g., abc123xyz"
                                value={newEntryBusinessId}
                                onChangeText={setNewEntryBusinessId}
                              />

                              <TouchableOpacity
                                style={styles.submitEntryButton}
                                onPress={() => handleAddEntry(list.id)}
                              >
                                <Text style={styles.submitEntryButtonText}>Add to List</Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {list.entries && list.entries.length > 0 ? (
                            list.entries.map((entry) => {
                              const entryId = entry.id || '';
                              const entryName = (entry as any).brandName || (entry as any).businessName || (entry as any).name || (entry as any).brandId || (entry as any).businessId || 'Unknown';
                              const entryType = entry.type || 'unknown';
                              const isEditingDate = editingEntryDateId === entryId;
                              const daysEndorsed = calculateDaysFromDate(entry.createdAt);
                              const dateDisplay = formatDateForDisplay(entry.createdAt);

                              return (
                                <View key={entryId} style={styles.entryRow}>
                                  <View style={styles.entryInfo}>
                                    <Text style={styles.entryName}>{entryName}</Text>
                                    <Text style={styles.entryType}>({entryType})</Text>
                                    {list.isEndorsed && (
                                      <View style={styles.entryDateContainer}>
                                        <Text style={styles.entryDateText}>
                                          Endorsed for {daysEndorsed} {daysEndorsed === 1 ? 'day' : 'days'} (since {dateDisplay})
                                        </Text>
                                        {isEditingDate ? (
                                          <View style={styles.editDateContainer}>
                                            <TextInput
                                              style={styles.dateInput}
                                              value={editingEntryDateValue}
                                              onChangeText={setEditingEntryDateValue}
                                              placeholder="YYYY-MM-DD"
                                              placeholderTextColor="#999"
                                            />
                                            <TouchableOpacity
                                              style={styles.saveDateButton}
                                              onPress={() => handleUpdateEntryDate(list.id, entryId, editingEntryDateValue)}
                                            >
                                              <Text style={styles.saveDateButtonText}>Save</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                              style={styles.cancelDateButton}
                                              onPress={() => {
                                                setEditingEntryDateId(null);
                                                setEditingEntryDateValue('');
                                              }}
                                            >
                                              <Text style={styles.cancelDateButtonText}>Cancel</Text>
                                            </TouchableOpacity>
                                          </View>
                                        ) : (
                                          <TouchableOpacity
                                            style={styles.editDateButton}
                                            onPress={() => {
                                              setEditingEntryDateId(entryId);
                                              setEditingEntryDateValue(dateDisplay !== 'Not set' && dateDisplay !== 'Invalid date' ? dateDisplay : '');
                                            }}
                                          >
                                            <Text style={styles.editDateButtonText}>Edit Date</Text>
                                          </TouchableOpacity>
                                        )}
                                      </View>
                                    )}
                                  </View>
                                  <TouchableOpacity
                                    style={styles.removeEntryButton}
                                    onPress={() => handleRemoveEntry(list.id, entryId, entryName)}
                                  >
                                    <Text style={styles.removeEntryButtonText}>Remove</Text>
                                  </TouchableOpacity>
                                </View>
                              );
                            })
                          ) : (
                            <Text style={styles.emptyListText}>No entries in this list</Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save All Changes</Text>
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
              <Text style={styles.modalTitle}>Bulk Create User Profiles</Text>
              <Text style={styles.helpText}>
                <Text style={styles.boldText}>NOTE:</Text> This creates database profiles only. Authentication accounts must be created separately.
                {'\n\n'}
                <Text style={styles.boldText}>Basic Format:</Text> userId,email,name,location
                {'\n'}
                <Text style={styles.boldText}>All Available Fields:</Text>
                {'\n'}• Core: userId,email
                {'\n'}• Profile: name,description,website,location,latitude,longitude
                {'\n'}• Social: facebook,instagram,twitter,linkedin,yelp,youtube
                {'\n'}• Other: promoCode,donationAmount,consentGivenAt,consentVersion
                {'\n'}• Note: causes, searchHistory, selectedCharities are better managed through the edit interface
                {'\n\n'}
                <Text style={styles.boldText}>Format Details:</Text>
                {'\n'}• Coordinates: latitude and longitude as decimal numbers (e.g., 40.7128, -74.0060)
                {'\n'}• Social media: Full URLs (e.g., https://facebook.com/username)
                {'\n'}• Dates: ISO format (e.g., 2025-01-15T10:30:00Z)
                {'\n\n'}
                <Text style={styles.boldText}>Basic Example:</Text>
                {'\n'}userId,email,name,location
                {'\n'}user123,john@example.com,John Doe,New York NY
                {'\n\n'}
                <Text style={styles.boldText}>Full Example:</Text>
                {'\n'}userId,email,name,description,website,location,latitude,longitude,instagram,promoCode
                {'\n'}user456,jane@example.com,Jane Smith,Coffee enthusiast,https://jane.com,Brooklyn NY,40.6782,-73.9442,https://instagram.com/janesmith,WELCOME2025
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
                <TouchableOpacity style={styles.saveButton} onPress={() => Alert.alert('Info', 'Bulk creation for users requires additional setup. Please use individual creation for now.')}>
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
  searchBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 12,
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
  bulkTextArea: {
    height: 300,
    paddingTop: 12,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
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
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 12,
    color: '#666',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  previewSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  previewText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
    marginBottom: 16,
  },
  userDetails: {
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginTop: 8,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '600',
    color: '#333',
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
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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
  // List management styles
  listCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  listCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  protectedText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  deleteListButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteListButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listEntries: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  addEntryButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  addEntryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  addEntryForm: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  submitEntryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  submitEntryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryName: {
    fontSize: 14,
    color: '#000',
    marginRight: 8,
  },
  entryType: {
    fontSize: 12,
    color: '#6c757d',
  },
  removeEntryButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeEntryButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyListText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  entryDateContainer: {
    marginTop: 4,
  },
  entryDateText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  editDateButton: {
    marginTop: 4,
  },
  editDateButtonText: {
    fontSize: 11,
    color: '#6c757d',
    textDecorationLine: 'underline',
  },
  editDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    backgroundColor: '#fff',
  },
  saveDateButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saveDateButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cancelDateButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelDateButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
