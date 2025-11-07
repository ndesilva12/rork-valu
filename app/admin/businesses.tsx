/**
 * Admin Panel - Businesses Management
 *
 * Edit ALL fields in business profiles
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
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

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

interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  yelp?: string;
  youtube?: string;
}

interface BusinessLocation {
  address: string;
  latitude: number;
  longitude: number;
  isPrimary?: boolean;
}

interface GalleryImage {
  imageUrl: string;
  caption: string;
}

interface BusinessData {
  userId: string;
  email: string;
  businessName: string;
  category: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  galleryImages?: GalleryImage[];
  locations?: BusinessLocation[];
  acceptsStandDiscounts: boolean;
  acceptsQRCode?: boolean;
  acceptsValueCode?: boolean;
  valueCodeDiscount?: number;
  customerDiscountPercent?: number;
  donationPercent?: number;
  customDiscount?: string;
  socialMedia?: SocialMedia;
  affiliates?: Affiliate[];
  partnerships?: Partnership[];
  ownership?: Ownership[];
  ownershipSources?: string;
}

export default function BusinessesManagement() {
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [editingBusiness, setEditingBusiness] = useState<BusinessData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state - Basic Info
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formCoverImageUrl, setFormCoverImageUrl] = useState('');

  // Form state - Gallery Images
  const [formGalleryImage1Url, setFormGalleryImage1Url] = useState('');
  const [formGalleryImage1Caption, setFormGalleryImage1Caption] = useState('');
  const [formGalleryImage2Url, setFormGalleryImage2Url] = useState('');
  const [formGalleryImage2Caption, setFormGalleryImage2Caption] = useState('');
  const [formGalleryImage3Url, setFormGalleryImage3Url] = useState('');
  const [formGalleryImage3Caption, setFormGalleryImage3Caption] = useState('');

  // Form state - Locations (as text fields for simplicity)
  const [formLocations, setFormLocations] = useState('');

  // Form state - Discounts
  const [formAcceptsStandDiscounts, setFormAcceptsStandDiscounts] = useState(false);
  const [formAcceptsQRCode, setFormAcceptsQRCode] = useState(false);
  const [formAcceptsValueCode, setFormAcceptsValueCode] = useState(false);
  const [formValueCodeDiscount, setFormValueCodeDiscount] = useState('');
  const [formCustomerDiscountPercent, setFormCustomerDiscountPercent] = useState('');
  const [formDonationPercent, setFormDonationPercent] = useState('');
  const [formCustomDiscount, setFormCustomDiscount] = useState('');

  // Form state - Social Media
  const [formFacebook, setFormFacebook] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formTwitter, setFormTwitter] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formYelp, setFormYelp] = useState('');
  const [formYoutube, setFormYoutube] = useState('');

  // Form state - Money Flow
  const [formAffiliates, setFormAffiliates] = useState('');
  const [formPartnerships, setFormPartnerships] = useState('');
  const [formOwnership, setFormOwnership] = useState('');
  const [formOwnershipSources, setFormOwnershipSources] = useState('');

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('accountType', '==', 'business'));
      const snapshot = await getDocs(q);

      const loadedBusinesses: BusinessData[] = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          if (!data.businessInfo) return null;

          const biz = data.businessInfo;
          return {
            userId: doc.id,
            email: data.email || 'No email',
            businessName: biz.name || 'Unnamed Business',
            category: biz.category || 'Uncategorized',
            description: biz.description || '',
            website: biz.website || '',
            logoUrl: biz.logoUrl || '',
            coverImageUrl: biz.coverImageUrl || '',
            galleryImages: biz.galleryImages || [],
            locations: biz.locations || [],
            acceptsStandDiscounts: biz.acceptsStandDiscounts || false,
            acceptsQRCode: biz.acceptsQRCode || false,
            acceptsValueCode: biz.acceptsValueCode || false,
            valueCodeDiscount: biz.valueCodeDiscount || 0,
            customerDiscountPercent: biz.customerDiscountPercent || 0,
            donationPercent: biz.donationPercent || 0,
            customDiscount: biz.customDiscount || '',
            socialMedia: biz.socialMedia || {},
            affiliates: biz.affiliates || [],
            partnerships: biz.partnerships || [],
            ownership: biz.ownership || [],
            ownershipSources: biz.ownershipSources || '',
          };
        })
        .filter((b): b is BusinessData => b !== null);

      setBusinesses(loadedBusinesses);
    } catch (error) {
      console.error('Error loading businesses:', error);
      Alert.alert('Error', 'Failed to load businesses from Firebase');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (business: BusinessData) => {
    setEditingBusiness(business);

    // Basic info
    setFormName(business.businessName);
    setFormCategory(business.category);
    setFormDescription(business.description || '');
    setFormWebsite(business.website || '');
    setFormLogoUrl(business.logoUrl || '');
    setFormCoverImageUrl(business.coverImageUrl || '');

    // Gallery images
    const gallery = business.galleryImages || [];
    setFormGalleryImage1Url(gallery[0]?.imageUrl || '');
    setFormGalleryImage1Caption(gallery[0]?.caption || '');
    setFormGalleryImage2Url(gallery[1]?.imageUrl || '');
    setFormGalleryImage2Caption(gallery[1]?.caption || '');
    setFormGalleryImage3Url(gallery[2]?.imageUrl || '');
    setFormGalleryImage3Caption(gallery[2]?.caption || '');

    // Locations (formatted as address|lat|lng|isPrimary)
    setFormLocations(
      business.locations
        ?.map((loc) => `${loc.address}|${loc.latitude}|${loc.longitude}|${loc.isPrimary ? 'primary' : ''}`)
        .join('\n') || ''
    );

    // Discounts
    setFormAcceptsStandDiscounts(business.acceptsStandDiscounts);
    setFormAcceptsQRCode(business.acceptsQRCode || false);
    setFormAcceptsValueCode(business.acceptsValueCode || false);
    setFormValueCodeDiscount(business.valueCodeDiscount?.toString() || '');
    setFormCustomerDiscountPercent(business.customerDiscountPercent?.toString() || '');
    setFormDonationPercent(business.donationPercent?.toString() || '');
    setFormCustomDiscount(business.customDiscount || '');

    // Social media
    const social = business.socialMedia || {};
    setFormFacebook(social.facebook || '');
    setFormInstagram(social.instagram || '');
    setFormTwitter(social.twitter || '');
    setFormLinkedin(social.linkedin || '');
    setFormYelp(social.yelp || '');
    setFormYoutube(social.youtube || '');

    // Money flow
    setFormAffiliates(
      business.affiliates?.map((a) => `${a.name}|${a.relationship}`).join('\n') || ''
    );
    setFormPartnerships(
      business.partnerships?.map((p) => `${p.name}|${p.relationship}`).join('\n') || ''
    );
    setFormOwnership(
      business.ownership?.map((o) => `${o.name}|${o.relationship}`).join('\n') || ''
    );
    setFormOwnershipSources(business.ownershipSources || '');

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBusiness(null);
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

  const parseLocations = (text: string): BusinessLocation[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => {
        const [address, lat, lng, isPrimaryStr] = line.split('|').map((s) => s.trim());
        return {
          address: address || '',
          latitude: parseFloat(lat) || 0,
          longitude: parseFloat(lng) || 0,
          isPrimary: isPrimaryStr === 'primary',
        };
      })
      .filter((loc) => loc.address);
  };

  const handleSave = async () => {
    if (!editingBusiness) return;

    try {
      // Build gallery images array
      const galleryImages: GalleryImage[] = [];
      if (formGalleryImage1Url) {
        galleryImages.push({ imageUrl: formGalleryImage1Url, caption: formGalleryImage1Caption });
      }
      if (formGalleryImage2Url) {
        galleryImages.push({ imageUrl: formGalleryImage2Url, caption: formGalleryImage2Caption });
      }
      if (formGalleryImage3Url) {
        galleryImages.push({ imageUrl: formGalleryImage3Url, caption: formGalleryImage3Caption });
      }

      // Build social media object
      const socialMedia: SocialMedia = {};
      if (formFacebook) socialMedia.facebook = formFacebook;
      if (formInstagram) socialMedia.instagram = formInstagram;
      if (formTwitter) socialMedia.twitter = formTwitter;
      if (formLinkedin) socialMedia.linkedin = formLinkedin;
      if (formYelp) socialMedia.yelp = formYelp;
      if (formYoutube) socialMedia.youtube = formYoutube;

      const updatedBusinessInfo = {
        name: formName,
        category: formCategory,
        description: formDescription,
        website: formWebsite,
        logoUrl: formLogoUrl,
        coverImageUrl: formCoverImageUrl,
        galleryImages: galleryImages,
        locations: parseLocations(formLocations),
        acceptsStandDiscounts: formAcceptsStandDiscounts,
        acceptsQRCode: formAcceptsQRCode,
        acceptsValueCode: formAcceptsValueCode,
        valueCodeDiscount: parseFloat(formValueCodeDiscount) || 0,
        customerDiscountPercent: parseFloat(formCustomerDiscountPercent) || 0,
        donationPercent: parseFloat(formDonationPercent) || 0,
        customDiscount: formCustomDiscount,
        socialMedia: socialMedia,
        affiliates: parseMoneyFlowSection(formAffiliates),
        partnerships: parseMoneyFlowSection(formPartnerships),
        ownership: parseMoneyFlowSection(formOwnership),
        ownershipSources: formOwnershipSources.trim(),
      };

      const userRef = doc(db, 'users', editingBusiness.userId);

      // Update the entire businessInfo object
      await updateDoc(userRef, {
        businessInfo: updatedBusinessInfo,
      });

      Alert.alert(
        'Success',
        `Business "${formName}" updated successfully`
      );

      closeModal();
      loadBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      Alert.alert('Error', 'Failed to update business data');
    }
  };

  const filteredBusinesses = businesses.filter(
    (business) =>
      business.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading businesses...</Text>
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
        <Text style={styles.title}>Businesses Management</Text>
        <Text style={styles.subtitle}>
          {businesses.length} business accounts ({filteredBusinesses.length} filtered)
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, styles.actionsBar]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by business name, email, or category..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.bulkButton} onPress={() => setShowBulkModal(true)}>
          <Text style={styles.bulkButtonText}>Bulk Create</Text>
        </TouchableOpacity>
      </View>

      {/* Businesses List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.listContainer}>
          {filteredBusinesses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No businesses found matching your search' : 'No business accounts yet'}
              </Text>
            </View>
          ) : (
            filteredBusinesses.map((business) => (
              <View key={business.userId} style={styles.businessCard}>
                <View style={styles.businessHeader}>
                  <View style={styles.businessInfo}>
                    <Text style={styles.businessName}>{business.businessName}</Text>
                    <Text style={styles.businessCategory}>{business.category}</Text>
                    <Text style={styles.businessEmail}>{business.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(business)}
                  >
                    <Text style={styles.editButtonText}>Edit All Fields</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Preview */}
                {business.website && (
                  <Text style={styles.previewText}>🌐 {business.website}</Text>
                )}
                {business.locations && business.locations.length > 0 && (
                  <Text style={styles.previewText}>📍 {business.locations.length} location(s)</Text>
                )}
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
                Edit Business - {editingBusiness?.businessName}
              </Text>

              <View style={styles.businessDetails}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{editingBusiness?.email}</Text>
              </View>

              {/* BASIC INFO */}
              <Text style={styles.sectionTitle}>📋 Basic Information</Text>

              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Business name"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.label}>Category *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Restaurant, Retail, Service"
                value={formCategory}
                onChangeText={setFormCategory}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Business description"
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

              <Text style={styles.label}>Logo URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/logo.png"
                value={formLogoUrl}
                onChangeText={setFormLogoUrl}
              />

              <Text style={styles.label}>Cover Image URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/cover.jpg"
                value={formCoverImageUrl}
                onChangeText={setFormCoverImageUrl}
              />

              {/* GALLERY IMAGES */}
              <Text style={styles.sectionTitle}>🖼️ Gallery Images (up to 3)</Text>

              <Text style={styles.label}>Gallery Image 1 URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/gallery1.jpg"
                value={formGalleryImage1Url}
                onChangeText={setFormGalleryImage1Url}
              />
              <Text style={styles.label}>Gallery Image 1 Caption</Text>
              <TextInput
                style={styles.input}
                placeholder="Caption for image 1"
                value={formGalleryImage1Caption}
                onChangeText={setFormGalleryImage1Caption}
              />

              <Text style={styles.label}>Gallery Image 2 URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/gallery2.jpg"
                value={formGalleryImage2Url}
                onChangeText={setFormGalleryImage2Url}
              />
              <Text style={styles.label}>Gallery Image 2 Caption</Text>
              <TextInput
                style={styles.input}
                placeholder="Caption for image 2"
                value={formGalleryImage2Caption}
                onChangeText={setFormGalleryImage2Caption}
              />

              <Text style={styles.label}>Gallery Image 3 URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/gallery3.jpg"
                value={formGalleryImage3Url}
                onChangeText={setFormGalleryImage3Url}
              />
              <Text style={styles.label}>Gallery Image 3 Caption</Text>
              <TextInput
                style={styles.input}
                placeholder="Caption for image 3"
                value={formGalleryImage3Caption}
                onChangeText={setFormGalleryImage3Caption}
              />

              {/* LOCATIONS */}
              <Text style={styles.sectionTitle}>📍 Locations</Text>
              <Text style={styles.helpText}>
                Format: address|latitude|longitude|primary (one per line). Add "primary" at the end for primary location.
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="123 Main St, New York, NY|40.7128|-74.0060|primary&#10;456 2nd Ave, Brooklyn, NY|40.6782|-73.9442|"
                value={formLocations}
                onChangeText={setFormLocations}
                multiline
                numberOfLines={5}
              />

              {/* DISCOUNTS & CODES */}
              <Text style={styles.sectionTitle}>💳 Discounts & Value Codes</Text>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Accepts Stand Discounts</Text>
                <Switch
                  value={formAcceptsStandDiscounts}
                  onValueChange={setFormAcceptsStandDiscounts}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Accepts QR Code</Text>
                <Switch
                  value={formAcceptsQRCode}
                  onValueChange={setFormAcceptsQRCode}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Accepts Value Code</Text>
                <Switch
                  value={formAcceptsValueCode}
                  onValueChange={setFormAcceptsValueCode}
                />
              </View>

              <Text style={styles.label}>Value Code Discount (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                value={formValueCodeDiscount}
                onChangeText={setFormValueCodeDiscount}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Customer Discount Percent (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                value={formCustomerDiscountPercent}
                onChangeText={setFormCustomerDiscountPercent}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Donation Percent (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                value={formDonationPercent}
                onChangeText={setFormDonationPercent}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Custom Discount Text</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Buy one get one free"
                value={formCustomDiscount}
                onChangeText={setFormCustomDiscount}
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

              {/* MONEY FLOW */}
              <Text style={styles.sectionTitle}>💰 Money Flow Sections</Text>
              <Text style={styles.helpText}>
                Format: Name|Relationship (one per line)
              </Text>

              <Text style={styles.label}>Affiliates (celebrities/influencers)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Taylor Swift|Multi-million&#10;LeBron James|$5M endorsement"
                value={formAffiliates}
                onChangeText={setFormAffiliates}
                multiline
                numberOfLines={5}
              />

              <Text style={styles.label}>Partnerships (business partnerships)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="TSMC|Silicon Supply Chain/2010&#10;Foxconn|Manufacturing/2005"
                value={formPartnerships}
                onChangeText={setFormPartnerships}
                multiline
                numberOfLines={5}
              />

              <Text style={styles.label}>Ownership (shareholders/investors)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Vanguard Group|~9.5%&#10;BlackRock|~7.2%"
                value={formOwnership}
                onChangeText={setFormOwnership}
                multiline
                numberOfLines={5}
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
              <Text style={styles.modalTitle}>Bulk Create Business Profiles</Text>
              <Text style={styles.helpText}>
                NOTE: This creates database profiles only. Authentication accounts must be created separately.
                {'\n\n'}Format: userId,email,businessName,category
                {'\n\n'}Example:{'\n'}
                userId,email,businessName,category{'\n'}
                business123,shop@example.com,Joe's Coffee,Restaurant
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
                <TouchableOpacity style={styles.saveButton} onPress={() => Alert.alert('Info', 'Bulk creation for businesses requires additional setup. Please use individual creation for now.')}>
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
  helpText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
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
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  businessEmail: {
    fontSize: 12,
    color: '#888',
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
  previewText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  businessDetails: {
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
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
