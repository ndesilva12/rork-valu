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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { getCustomFields, CustomField } from '@/services/firebase/customFieldsService';
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
      // Build social media object
      const socialMedia: SocialMedia = {};
      if (formFacebook) socialMedia.facebook = formFacebook;
      if (formInstagram) socialMedia.instagram = formInstagram;
      if (formTwitter) socialMedia.twitter = formTwitter;
      if (formLinkedin) socialMedia.linkedin = formLinkedin;
      if (formYelp) socialMedia.yelp = formYelp;
      if (formYoutube) socialMedia.youtube = formYoutube;

      // Build user details object
      const userDetails: UserDetails = {
        name: formName,
        description: formDescription,
        website: formWebsite,
        location: formLocation,
        latitude: parseFloat(formLatitude) || undefined,
        longitude: parseFloat(formLongitude) || undefined,
        socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
      };

      // Parse search history
      const searchHistory = formSearchHistory
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);

      const updatedData: Record<string, any> = {
        firstName: formFirstName,
        lastName: formLastName,
        fullName: formFullName,
        userDetails: userDetails,
        causes: parseCauses(formCauses),
        searchHistory: searchHistory,
        promoCode: formPromoCode,
        donationAmount: parseFloat(formDonationAmount) || 0,
        selectedCharities: parseCharities(formSelectedCharities),
        consentGivenAt: formConsentGivenAt,
        consentVersion: formConsentVersion,
      };

      // Add custom field values
      customFields.forEach((field) => {
        const value = customFieldValues[field.fieldName];
        if (value !== undefined && value !== '') {
          // Convert value based on field type
          switch (field.fieldType) {
            case 'number':
              updatedData[field.fieldName] = parseFloat(value) || 0;
              break;
            case 'boolean':
              updatedData[field.fieldName] = value === 'true' || value === true;
              break;
            default:
              updatedData[field.fieldName] = value;
          }
        }
      });

      console.log('[Admin Users] Updating user with data:', updatedData);

      const userRef = doc(db, 'users', editingUser.userId);

      // Update all user fields
      await updateDoc(userRef, updatedData);

      console.log('[Admin Users] User updated successfully');

      Alert.alert(
        'Success',
        `User "${formName || editingUser.email}" updated successfully`,
        [{ text: 'OK', onPress: () => {
          closeModal();
          loadUsers();
        }}]
      );
    } catch (error) {
      console.error('[Admin Users] Error updating user:', error);
      Alert.alert('Error', `Failed to update user data: ${error}`);
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
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(user)}
                  >
                    <Text style={styles.editButtonText}>Edit All Fields</Text>
                  </TouchableOpacity>
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
});
