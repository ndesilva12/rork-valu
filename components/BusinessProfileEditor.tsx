import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Building2, ChevronDown, Globe, Upload, MapPin, Facebook, Instagram, Twitter, Linkedin, Plus, X, ExternalLink, Camera, Star } from 'lucide-react-native';
import { pickAndUploadImage } from '@/lib/imageUpload';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { BusinessLocation, GalleryImage } from '@/types';
import { getUserLists } from '@/services/firebase/listService';
import { UserList, BrandListEntry, BusinessListEntry } from '@/types/library';
import TeamManagement from '@/components/TeamManagement';

const BUSINESS_CATEGORIES = [
  'Retail',
  'Food & Beverage',
  'Restaurant',
  'Cafe & Coffee Shop',
  'Technology',
  'Fashion & Apparel',
  'Health & Wellness',
  'Beauty & Personal Care',
  'Home & Garden',
  'Sports & Recreation',
  'Arts & Entertainment',
  'Professional Services',
  'Financial Services',
  'Education',
  'Automotive',
  'Travel & Hospitality',
  'Real Estate',
  'Non-Profit',
  'Other',
];

export default function BusinessProfileEditor() {
  const { isDarkMode, profile, setBusinessInfo, clerkUser } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const businessInfo = profile.businessInfo || {
    name: '',
    category: '',
    description: '',
    website: '',
    logoUrl: '',
    acceptsStandDiscounts: false,
    acceptsQRCode: true,
    acceptsValueCode: true,
    valueCodeDiscount: 10,
  };

  const [editing, setEditing] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Local state for editing
  const [name, setName] = useState(businessInfo.name);
  const [category, setCategory] = useState(businessInfo.category);
  const [description, setDescription] = useState(businessInfo.description || '');
  const [website, setWebsite] = useState(businessInfo.website || '');
  const [logoUrl, setLogoUrl] = useState(businessInfo.logoUrl || '');
  const [coverImageUrl, setCoverImageUrl] = useState(businessInfo.coverImageUrl || '');
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(businessInfo.galleryImages || []);

  // Multiple locations support
  const [locations, setLocations] = useState<BusinessLocation[]>(() => {
    // Initialize from existing locations array, or fallback to old single location
    if (businessInfo.locations && businessInfo.locations.length > 0) {
      return businessInfo.locations;
    } else if (businessInfo.location && businessInfo.latitude && businessInfo.longitude) {
      return [{ address: businessInfo.location, latitude: businessInfo.latitude, longitude: businessInfo.longitude, isPrimary: true }];
    } else {
      return [];
    }
  });

  const [facebook, setFacebook] = useState(businessInfo.socialMedia?.facebook || '');
  const [instagram, setInstagram] = useState(businessInfo.socialMedia?.instagram || '');
  const [twitter, setTwitter] = useState(businessInfo.socialMedia?.twitter || '');
  const [linkedin, setLinkedin] = useState(businessInfo.socialMedia?.linkedin || '');
  const [yelp, setYelp] = useState(businessInfo.socialMedia?.yelp || '');
  const [youtube, setYoutube] = useState(businessInfo.socialMedia?.youtube || '');
  const [ownership, setOwnership] = useState(businessInfo.ownership || []);
  const [ownershipSources, setOwnershipSources] = useState(businessInfo.ownershipSources || '');
  const [affiliates, setAffiliates] = useState(businessInfo.affiliates || []);
  const [partnerships, setPartnerships] = useState(businessInfo.partnerships || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const handleLocationSelect = (index: number, locationName: string, lat: number, lon: number) => {
    const newLocations = [...locations];
    newLocations[index] = {
      address: locationName,
      latitude: lat,
      longitude: lon,
      isPrimary: newLocations[index]?.isPrimary || false,
    };
    setLocations(newLocations);
  };

  const handleAddLocation = () => {
    setLocations([...locations, { address: '', latitude: 0, longitude: 0, isPrimary: false }]);
  };

  const handleRemoveLocation = (index: number) => {
    if (locations.length === 1) {
      Alert.alert('Required', 'You must have at least one location');
      return;
    }
    const newLocations = locations.filter((_, i) => i !== index);
    // If we removed the primary location, make the first one primary
    if (locations[index].isPrimary && newLocations.length > 0) {
      newLocations[0].isPrimary = true;
    }
    setLocations(newLocations);
  };

  const handleSetPrimary = (index: number) => {
    const newLocations = locations.map((loc, i) => ({
      ...loc,
      isPrimary: i === index,
    }));
    setLocations(newLocations);
  };

  // Sync local state with profile changes
  useEffect(() => {
    setName(businessInfo.name);
    setCategory(businessInfo.category);
    setDescription(businessInfo.description || '');
    setWebsite(businessInfo.website || '');
    setLogoUrl(businessInfo.logoUrl || '');
    setCoverImageUrl(businessInfo.coverImageUrl || '');
    setGalleryImages(businessInfo.galleryImages || []);

    // Sync locations
    if (businessInfo.locations && businessInfo.locations.length > 0) {
      setLocations(businessInfo.locations);
    } else if (businessInfo.location && businessInfo.latitude && businessInfo.longitude) {
      setLocations([{ address: businessInfo.location, latitude: businessInfo.latitude, longitude: businessInfo.longitude, isPrimary: true }]);
    } else {
      setLocations([]);
    }

    setFacebook(businessInfo.socialMedia?.facebook || '');
    setInstagram(businessInfo.socialMedia?.instagram || '');
    setTwitter(businessInfo.socialMedia?.twitter || '');
    setLinkedin(businessInfo.socialMedia?.linkedin || '');
    setYelp(businessInfo.socialMedia?.yelp || '');
    setYoutube(businessInfo.socialMedia?.youtube || '');
    setOwnership(businessInfo.ownership || []);
    setOwnershipSources(businessInfo.ownershipSources || '');
    setAffiliates(businessInfo.affiliates || []);
    setPartnerships(businessInfo.partnerships || []);
  }, [businessInfo]);

  // Fetch user lists to show brands & businesses
  useEffect(() => {
    const loadUserLists = async () => {
      if (!clerkUser?.id) return;

      try {
        setLoadingLists(true);
        const lists = await getUserLists(clerkUser.id);
        setUserLists(lists);
      } catch (error) {
        console.error('Error loading user lists:', error);
      } finally {
        setLoadingLists(false);
      }
    };

    loadUserLists();
  }, [clerkUser?.id]);

  // Helper to extract all brands and businesses from user lists
  const extractBrandsAndBusinesses = () => {
    const brands: { name: string; listName: string }[] = [];
    const businesses: { name: string; listName: string }[] = [];

    userLists.forEach(list => {
      list.entries.forEach(entry => {
        if (entry.type === 'brand' && 'brandId' in entry && 'brandName' in entry) {
          brands.push({
            name: (entry as BrandListEntry).brandName,
            listName: list.name
          });
        } else if (entry.type === 'business' && 'businessId' in entry && 'businessName' in entry) {
          businesses.push({
            name: (entry as BusinessListEntry).businessName,
            listName: list.name
          });
        }
      });
    });

    return { brands, businesses };
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Business name is required');
      return;
    }

    if (!category) {
      Alert.alert('Required', 'Business category is required');
      return;
    }

    // Validate locations
    const validLocations = locations.filter(loc =>
      loc.address.trim() && loc.latitude !== 0 && loc.longitude !== 0
    );

    if (validLocations.length === 0) {
      Alert.alert('Required', 'Please add at least one business location');
      return;
    }

    // Get the primary location (or first location if no primary set)
    const primaryLocation = validLocations.find(loc => loc.isPrimary) || validLocations[0];

    const updateInfo: any = {
      name: name.trim(),
      category,
      description: description.trim(),
      website: website.trim(),
      logoUrl: logoUrl.trim(),
      coverImageUrl: coverImageUrl.trim() || undefined,
      galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
      socialMedia: {
        facebook: facebook.trim(),
        instagram: instagram.trim(),
        twitter: twitter.trim(),
        linkedin: linkedin.trim(),
        yelp: yelp.trim(),
        youtube: youtube.trim(),
      },
      ownership: ownership.length > 0 ? ownership : undefined,
      ownershipSources: ownershipSources.trim() || undefined,
      affiliates: affiliates.length > 0 ? affiliates : undefined,
      partnerships: partnerships.length > 0 ? partnerships : undefined,
      // Multiple locations support
      locations: validLocations,
      // Backwards compatibility: save primary location to old fields
      location: primaryLocation.address,
      latitude: primaryLocation.latitude,
      longitude: primaryLocation.longitude,
    };

    console.log('[BusinessProfileEditor] Saving locations:', validLocations);
    console.log('[BusinessProfileEditor] Full updateInfo:', updateInfo);
    await setBusinessInfo(updateInfo);

    setEditing(false);
    Alert.alert('Success', 'Business profile updated');
  };

  const handleCancel = () => {
    // Reset to saved values
    setName(businessInfo.name);
    setCategory(businessInfo.category);
    setDescription(businessInfo.description || '');
    setWebsite(businessInfo.website || '');
    setLogoUrl(businessInfo.logoUrl || '');
    setCoverImageUrl(businessInfo.coverImageUrl || '');
    setGalleryImages(businessInfo.galleryImages || []);

    // Reset locations
    if (businessInfo.locations && businessInfo.locations.length > 0) {
      setLocations(businessInfo.locations);
    } else if (businessInfo.location && businessInfo.latitude && businessInfo.longitude) {
      setLocations([{ address: businessInfo.location, latitude: businessInfo.latitude, longitude: businessInfo.longitude, isPrimary: true }]);
    } else {
      setLocations([]);
    }

    setFacebook(businessInfo.socialMedia?.facebook || '');
    setInstagram(businessInfo.socialMedia?.instagram || '');
    setTwitter(businessInfo.socialMedia?.twitter || '');
    setLinkedin(businessInfo.socialMedia?.linkedin || '');
    setYelp(businessInfo.socialMedia?.yelp || '');
    setYoutube(businessInfo.socialMedia?.youtube || '');
    setOwnership(businessInfo.ownership || []);
    setOwnershipSources(businessInfo.ownershipSources || '');
    setAffiliates(businessInfo.affiliates || []);
    setPartnerships(businessInfo.partnerships || []);
    setEditing(false);
  };

  const handleLogoUpload = async () => {
    if (!clerkUser?.id) {
      console.error('[BusinessProfileEditor] No clerk user ID available');
      Alert.alert('Error', 'User not logged in. Please log in and try again.');
      return;
    }

    console.log('[BusinessProfileEditor] Starting logo upload for user:', clerkUser.id);
    setUploadingImage(true);
    try {
      const downloadURL = await pickAndUploadImage(clerkUser.id, 'business');
      console.log('[BusinessProfileEditor] Logo upload returned:', downloadURL);

      if (downloadURL) {
        console.log('[BusinessProfileEditor] Setting logo URL to:', downloadURL);
        setLogoUrl(downloadURL);
        Alert.alert('Success', 'Business logo uploaded! Remember to click "Save Changes" to save it to your profile.');
      } else {
        console.warn('[BusinessProfileEditor] Logo upload returned null - cancelled or failed');
      }
    } catch (error: any) {
      console.error('[BusinessProfileEditor] Error uploading business logo:', error);
      console.error('[BusinessProfileEditor] Error stack:', error?.stack);
      Alert.alert('Error', `Failed to upload logo: ${error?.message || 'Unknown error'}`);
    } finally {
      console.log('[BusinessProfileEditor] Logo upload complete, stopping spinner');
      setUploadingImage(false);
    }
  };

  const handleCoverImageUpload = async () => {
    if (!clerkUser?.id) {
      console.error('[BusinessProfileEditor] No clerk user ID available');
      Alert.alert('Error', 'User not logged in. Please log in and try again.');
      return;
    }

    console.log('[BusinessProfileEditor] Starting cover image upload for user:', clerkUser.id);
    setUploadingImage(true);
    try {
      // Cover image should be wide (16:9 aspect ratio)
      const downloadURL = await pickAndUploadImage(clerkUser.id, 'cover', [16, 9]);
      console.log('[BusinessProfileEditor] Cover upload returned:', downloadURL);

      if (downloadURL) {
        console.log('[BusinessProfileEditor] Setting cover image URL to:', downloadURL);
        setCoverImageUrl(downloadURL);
        Alert.alert('Success', 'Cover image uploaded! Remember to click "Save Changes" to save it to your profile.');
      } else {
        console.warn('[BusinessProfileEditor] Cover upload returned null - cancelled or failed');
      }
    } catch (error: any) {
      console.error('[BusinessProfileEditor] Error uploading cover image:', error);
      console.error('[BusinessProfileEditor] Error stack:', error?.stack);
      Alert.alert('Error', `Failed to upload cover: ${error?.message || 'Unknown error'}`);
    } finally {
      console.log('[BusinessProfileEditor] Cover upload complete, stopping spinner');
      setUploadingImage(false);
    }
  };

  const handleGalleryImageUpload = async () => {
    if (!clerkUser?.id) {
      console.error('[BusinessProfileEditor] No clerk user ID available');
      Alert.alert('Error', 'User not logged in. Please log in and try again.');
      return;
    }

    if (galleryImages.length >= 3) {
      Alert.alert('Maximum Reached', 'You can only upload up to 3 gallery images.');
      return;
    }

    console.log('[BusinessProfileEditor] Starting gallery image upload for user:', clerkUser.id);
    console.log('[BusinessProfileEditor] Current gallery images count:', galleryImages.length);
    setUploadingImage(true);
    try {
      // Gallery images should be square
      const downloadURL = await pickAndUploadImage(clerkUser.id, 'gallery', [1, 1]);
      console.log('[BusinessProfileEditor] Gallery upload returned:', downloadURL);

      if (downloadURL) {
        console.log('[BusinessProfileEditor] Adding gallery image to array');
        // Add image with empty caption - user can add caption in text field
        setGalleryImages([...galleryImages, { imageUrl: downloadURL, caption: '' }]);
        Alert.alert('Success', 'Image uploaded! Add a caption below and click "Save Changes".');
      } else {
        console.warn('[BusinessProfileEditor] Gallery upload returned null - cancelled or failed');
      }
    } catch (error: any) {
      console.error('[BusinessProfileEditor] Error uploading gallery image:', error);
      console.error('[BusinessProfileEditor] Error stack:', error?.stack);
      Alert.alert('Error', `Failed to upload gallery image: ${error?.message || 'Unknown error'}`);
    } finally {
      console.log('[BusinessProfileEditor] Gallery upload complete, stopping spinner');
      setUploadingImage(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  const updateGalleryImageCaption = (index: number, caption: string) => {
    const updated = [...galleryImages];
    updated[index] = { ...updated[index], caption };
    setGalleryImages(updated);
  };

  // Ownership management
  const addOwnership = () => {
    setOwnership([...ownership, { name: '', relationship: '' }]);
  };

  const removeOwnership = (index: number) => {
    setOwnership(ownership.filter((_, i) => i !== index));
  };

  const updateOwnership = (index: number, field: 'name' | 'relationship', value: string) => {
    const updated = [...ownership];
    updated[index] = { ...updated[index], [field]: value };
    setOwnership(updated);
  };

  // Affiliates management
  const addAffiliate = () => {
    setAffiliates([...affiliates, { name: '', relationship: '' }]);
  };

  const removeAffiliate = (index: number) => {
    setAffiliates(affiliates.filter((_, i) => i !== index));
  };

  const updateAffiliate = (index: number, field: 'name' | 'relationship', value: string) => {
    const updated = [...affiliates];
    updated[index] = { ...updated[index], [field]: value };
    setAffiliates(updated);
  };

  // Partnerships management
  const addPartnership = () => {
    setPartnerships([...partnerships, { name: '', relationship: '' }]);
  };

  const removePartnership = (index: number) => {
    setPartnerships(partnerships.filter((_, i) => i !== index));
  };

  const updatePartnership = (index: number, field: 'name' | 'relationship', value: string) => {
    const updated = [...partnerships];
    updated[index] = { ...updated[index], [field]: value };
    setPartnerships(updated);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Brand Profile</Text>
        {!editing && (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.editButton, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
        {/* Logo and Basic Info - Compact Horizontal Layout */}
        <View style={styles.compactHeader}>
          <View style={styles.logoWrapper}>
            <View style={[styles.logoContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {logoUrl || businessInfo.logoUrl ? (
                <Image
                  source={{ uri: logoUrl || businessInfo.logoUrl }}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              ) : (
                <Building2 size={32} color={colors.textSecondary} strokeWidth={1.5} />
              )}
            </View>
            {editing && (
              <TouchableOpacity
                style={[styles.uploadImageButton, { backgroundColor: colors.primary }]}
                onPress={handleLogoUpload}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Camera size={16} color={colors.white} strokeWidth={2} />
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.businessName, { color: colors.text }]}>
              {businessInfo.name || 'Business Name'}
            </Text>
            <Text style={[styles.businessCategory, { color: colors.textSecondary }]}>
              {businessInfo.category || 'Category'}
            </Text>
            {businessInfo.location && (
              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.locationText, { color: colors.textSecondary }]}>{businessInfo.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Logo Upload (when editing) */}
        {editing && (
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Business Logo</Text>
            <View style={styles.imageUploadContainer}>
              <View style={[styles.imagePreviewBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                {logoUrl ? (
                  <Image
                    source={{ uri: logoUrl }}
                    style={styles.imagePreview}
                    contentFit="cover"
                  />
                ) : (
                  <Camera size={32} color={colors.textSecondary} strokeWidth={1.5} />
                )}
              </View>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={handleLogoUpload}
                activeOpacity={0.7}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Upload size={16} color={colors.white} strokeWidth={2} />
                    <Text style={[styles.uploadButtonText, { color: colors.white }]}>Upload Logo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cover Image Upload (when editing) */}
        {editing && (
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Cover Image (Optional)</Text>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Wide banner image displayed on your business page
            </Text>
            <View style={styles.imageUploadContainer}>
              <View style={[styles.coverPreviewBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                {coverImageUrl ? (
                  <Image
                    source={{ uri: coverImageUrl }}
                    style={styles.coverPreview}
                    contentFit="cover"
                  />
                ) : (
                  <Camera size={32} color={colors.textSecondary} strokeWidth={1.5} />
                )}
              </View>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={handleCoverImageUpload}
                activeOpacity={0.7}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Upload size={16} color={colors.white} strokeWidth={2} />
                    <Text style={[styles.uploadButtonText, { color: colors.white }]}>Upload Cover</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Gallery Images Upload (when editing) */}
        {editing && (
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Gallery Images ({galleryImages.length}/3)</Text>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Add up to 3 images to showcase your business
            </Text>

            <View style={styles.galleryUploadGrid}>
              {[0, 1, 2].map((slotIndex) => {
                const image = galleryImages[slotIndex];
                return (
                  <View key={slotIndex} style={styles.gallerySlot}>
                    <View style={[styles.galleryPreviewBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                      {image ? (
                        <>
                          <Image
                            source={{ uri: image.imageUrl }}
                            style={styles.galleryPreview}
                            contentFit="cover"
                          />
                          <TouchableOpacity
                            style={[styles.removeGalleryButton, { backgroundColor: colors.error }]}
                            onPress={() => removeGalleryImage(slotIndex)}
                            activeOpacity={0.7}
                          >
                            <X size={12} color={colors.white} strokeWidth={2.5} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <Camera size={24} color={colors.textSecondary} strokeWidth={1.5} />
                      )}
                    </View>

                    {image ? (
                      <TextInput
                        style={[styles.galleryCaption, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                        placeholder="Caption..."
                        placeholderTextColor={colors.textSecondary}
                        value={image.caption}
                        onChangeText={(text) => updateGalleryImageCaption(slotIndex, text)}
                        multiline
                      />
                    ) : (
                      <TouchableOpacity
                        style={[styles.galleryUploadButton, { backgroundColor: colors.primary }]}
                        onPress={handleGalleryImageUpload}
                        activeOpacity={0.7}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <Plus size={14} color={colors.white} strokeWidth={2.5} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Business Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Business Name</Text>
          {editing ? (
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter business name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          ) : (
            <Text style={[styles.value, { color: colors.text }]}>{businessInfo.name}</Text>
          )}
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          {editing ? (
            <>
              <TouchableOpacity
                style={[styles.categoryPicker, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryPickerText, { color: category ? colors.text : colors.textSecondary }]}>
                  {category || 'Select a category'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>

              {showCategoryPicker && (
                <View style={[styles.categoryDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        { borderBottomColor: colors.border },
                        category === cat && { backgroundColor: colors.primary + '10' }
                      ]}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategoryPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryOptionText, { color: colors.text }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={[styles.value, { color: colors.text }]}>{businessInfo.category}</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          {editing ? (
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }
              ]}
              placeholder="Tell customers about your business..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          ) : (
            <Text style={[styles.value, { color: colors.text }]}>
              {businessInfo.description || 'No description added'}
            </Text>
          )}
        </View>

        {/* Website */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Globe size={16} color={colors.text} strokeWidth={2} />
            <Text style={[styles.label, { color: colors.text }]}>Website</Text>
          </View>
          {editing ? (
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="https://your-website.com"
              placeholderTextColor={colors.textSecondary}
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              keyboardType="url"
            />
          ) : (
            <Text style={[styles.value, styles.link, { color: colors.primary }]}>
              {businessInfo.website || 'No website added'}
            </Text>
          )}
        </View>

        {/* Business Locations Section */}
        <View style={styles.formGrid}>
          <View style={styles.inputGroup}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Business Locations</Text>

            {editing ? (
              <>
                {locations.map((location, index) => (
                  <View key={index} style={[styles.locationItem, { borderColor: colors.border }]}>
                    <View style={styles.locationHeader}>
                      <Text style={[styles.locationNumber, { color: colors.textSecondary }]}>
                        Location {index + 1}
                        {location.isPrimary && (
                          <Text style={{ color: colors.primary }}> (Primary)</Text>
                        )}
                      </Text>
                      <View style={styles.locationActions}>
                        {!location.isPrimary && locations.length > 1 && (
                          <TouchableOpacity
                            onPress={() => handleSetPrimary(index)}
                            style={styles.iconButton}
                            activeOpacity={0.7}
                          >
                            <Star size={18} color={colors.textSecondary} strokeWidth={2} />
                          </TouchableOpacity>
                        )}
                        {locations.length > 1 && (
                          <TouchableOpacity
                            onPress={() => handleRemoveLocation(index)}
                            style={styles.iconButton}
                            activeOpacity={0.7}
                          >
                            <X size={18} color={colors.danger} strokeWidth={2} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <LocationAutocomplete
                      value={location.address}
                      onLocationSelect={(address, lat, lon) => handleLocationSelect(index, address, lat, lon)}
                      isDarkMode={isDarkMode}
                    />
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.addLocationButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.primary }]}
                  onPress={handleAddLocation}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.addLocationText, { color: colors.primary }]}>
                    Add Another Location
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.locationsDisplay}>
                {locations.length > 0 ? (
                  locations.map((location, index) => (
                    <View key={index} style={[styles.locationDisplayItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <MapPin size={14} color={colors.primary} strokeWidth={2} />
                      <Text style={[styles.locationDisplayText, { color: colors.text }]}>
                        {location.address}
                        {location.isPrimary && (
                          <Text style={{ color: colors.primary, fontWeight: '600' }}> (Primary)</Text>
                        )}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>No locations set</Text>
                )}
              </View>
            )}
          </View>

          {/* Social Media - 2x2 Grid */}
          <View style={styles.socialMediaSection}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Social Media</Text>

            <View style={styles.formRow}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <View style={styles.labelRow}>
                  <Facebook size={14} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.label, { color: colors.text }]}>Facebook</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="facebook.com/business"
                    placeholderTextColor={colors.textSecondary}
                    value={facebook}
                    onChangeText={setFacebook}
                    autoCapitalize="none"
                  />
                ) : businessInfo.socialMedia?.facebook ? (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => Linking.openURL(businessInfo.socialMedia.facebook.startsWith('http') ? businessInfo.socialMedia.facebook : `https://${businessInfo.socialMedia.facebook}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.socialButtonText, { color: colors.white }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <View style={styles.labelRow}>
                  <Instagram size={14} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.label, { color: colors.text }]}>Instagram</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="@business"
                    placeholderTextColor={colors.textSecondary}
                    value={instagram}
                    onChangeText={setInstagram}
                    autoCapitalize="none"
                  />
                ) : businessInfo.socialMedia?.instagram ? (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => Linking.openURL(businessInfo.socialMedia.instagram.startsWith('http') ? businessInfo.socialMedia.instagram : `https://instagram.com/${businessInfo.socialMedia.instagram.replace('@', '')}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.socialButtonText, { color: colors.white }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
                )}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <View style={styles.labelRow}>
                  <Twitter size={14} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.label, { color: colors.text }]}>Twitter/X</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="@business"
                    placeholderTextColor={colors.textSecondary}
                    value={twitter}
                    onChangeText={setTwitter}
                    autoCapitalize="none"
                  />
                ) : businessInfo.socialMedia?.twitter ? (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => Linking.openURL(businessInfo.socialMedia.twitter.startsWith('http') ? businessInfo.socialMedia.twitter : `https://twitter.com/${businessInfo.socialMedia.twitter.replace('@', '')}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.socialButtonText, { color: colors.white }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <View style={styles.labelRow}>
                  <Linkedin size={14} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.label, { color: colors.text }]}>LinkedIn</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="linkedin.com/company/business"
                    placeholderTextColor={colors.textSecondary}
                    value={linkedin}
                    onChangeText={setLinkedin}
                    autoCapitalize="none"
                  />
                ) : businessInfo.socialMedia?.linkedin ? (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => Linking.openURL(businessInfo.socialMedia.linkedin.startsWith('http') ? businessInfo.socialMedia.linkedin : `https://${businessInfo.socialMedia.linkedin}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.socialButtonText, { color: colors.white }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
                )}
              </View>
            </View>

            {/* Yelp */}
            <View style={styles.formRow}>
              <View style={styles.halfWidth}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>Yelp</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="yelp.com/biz/business-name"
                    placeholderTextColor={colors.textSecondary}
                    value={yelp}
                    onChangeText={setYelp}
                    autoCapitalize="none"
                  />
                ) : businessInfo.socialMedia?.yelp ? (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => Linking.openURL(businessInfo.socialMedia.yelp.startsWith('http') ? businessInfo.socialMedia.yelp : `https://${businessInfo.socialMedia.yelp}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.socialButtonText, { color: colors.white }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
                )}
              </View>

              {/* YouTube */}
              <View style={styles.halfWidth}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text }]}>YouTube</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="youtube.com/@channel or youtube.com/c/channel"
                    placeholderTextColor={colors.textSecondary}
                    value={youtube}
                    onChangeText={setYoutube}
                    autoCapitalize="none"
                  />
                ) : businessInfo.socialMedia?.youtube ? (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => Linking.openURL(businessInfo.socialMedia.youtube.startsWith('http') ? businessInfo.socialMedia.youtube : `https://${businessInfo.socialMedia.youtube}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.socialButtonText, { color: colors.white }]} numberOfLines={1}>
                      View Channel
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Money Flow Section - Admin Only */}
        <View style={styles.moneyFlowSection}>
          <View style={styles.moneyFlowHeader}>
            <Text style={[styles.moneyFlowTitle, { color: colors.text }]}>Money Flow</Text>
            <Text style={[styles.adminOnlyNote, { color: colors.textSecondary }]}>
              (Admin editable only via Firebase)
            </Text>
          </View>

          {/* Ownership Section */}
          <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            <View style={[styles.subsectionHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>OWNERSHIP</Text>
            </View>

            {ownership.length > 0 ? (
              <>
                {ownership.map((owner, index) => (
                  <View key={`owner-${index}`} style={[styles.moneyFlowItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.moneyFlowItemRow}>
                      <Text style={[styles.moneyFlowName, { color: colors.text }]}>{owner.name}</Text>
                      <Text style={[styles.moneyFlowRelationship, { color: colors.textSecondary }]}>{owner.relationship}</Text>
                    </View>
                  </View>
                ))}
                {ownershipSources && (
                  <View style={[styles.sourcesContainer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sourcesLabel, { color: colors.text }]}>Sources:</Text>
                    <Text style={[styles.sourcesText, { color: colors.textSecondary }]}>{ownershipSources}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No ownership data</Text>
            )}
          </View>

          {/* Affiliates Section */}
          <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            <View style={[styles.subsectionHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>AFFILIATES</Text>
            </View>

            {affiliates.length > 0 ? (
              affiliates.map((affiliate, index) => (
                <View key={`affiliate-${index}`} style={[styles.moneyFlowItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.moneyFlowItemRow}>
                    <Text style={[styles.moneyFlowName, { color: colors.text }]}>{affiliate.name}</Text>
                    <Text style={[styles.moneyFlowRelationship, { color: colors.textSecondary }]}>{affiliate.relationship}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No affiliates</Text>
            )}
          </View>

          {/* Partnerships Section */}
          <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            <View style={[styles.subsectionHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>PARTNERSHIPS</Text>
            </View>

            {partnerships.length > 0 ? (
              partnerships.map((partnership, index) => (
                <View key={`partnership-${index}`} style={[styles.moneyFlowItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.moneyFlowItemRow}>
                    <Text style={[styles.moneyFlowName, { color: colors.text }]}>{partnership.name}</Text>
                    <Text style={[styles.moneyFlowRelationship, { color: colors.textSecondary }]}>{partnership.relationship}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No partnerships</Text>
            )}
          </View>

          {/* User's Brands & Businesses Section */}
          <View style={[styles.moneyFlowCard, { backgroundColor: colors.background, borderColor: colors.success }]}>
            <View style={[styles.subsectionHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>USER'S BRANDS & BUSINESSES</Text>
            </View>

            {loadingLists ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ padding: 16 }} />
            ) : (() => {
              const { brands, businesses } = extractBrandsAndBusinesses();
              const hasData = brands.length > 0 || businesses.length > 0;

              if (!hasData) {
                return <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No brands or businesses in lists</Text>;
              }

              return (
                <>
                  {brands.length > 0 && (
                    <View style={[styles.listSection, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.listSectionTitle, { color: colors.primary }]}>Brands ({brands.length})</Text>
                      {brands.map((brand, index) => (
                        <View key={`brand-${index}`} style={[styles.moneyFlowItem, { borderBottomColor: colors.border }]}>
                          <View style={styles.moneyFlowItemRow}>
                            <Text style={[styles.moneyFlowName, { color: colors.text }]}>{brand.name}</Text>
                            <Text style={[styles.moneyFlowRelationship, { color: colors.textSecondary }]}>{brand.listName}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {businesses.length > 0 && (
                    <View style={styles.listSection}>
                      <Text style={[styles.listSectionTitle, { color: colors.primary }]}>Businesses ({businesses.length})</Text>
                      {businesses.map((business, index) => (
                        <View key={`business-${index}`} style={[styles.moneyFlowItem, { borderBottomColor: colors.border }]}>
                          <View style={styles.moneyFlowItemRow}>
                            <Text style={[styles.moneyFlowName, { color: colors.text }]}>{business.name}</Text>
                            <Text style={[styles.moneyFlowRelationship, { color: colors.textSecondary }]}>{business.listName}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        </View>

        {/* Edit Actions */}
        {editing && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, { color: colors.white }]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Team Management (Phase 0) */}
      <TeamManagement />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  // Compact Header Layout
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'relative',
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  uploadImageButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  businessCategory: {
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
  },
  // Image Upload Container
  imageUploadContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  imagePreviewBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  coverPreviewBox: {
    width: 160,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  // Compact Form Layout
  formGrid: {
    gap: 12,
    marginTop: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
    marginTop: 8,
  },
  socialMediaSection: {
    marginTop: 8,
  },
  // Input Groups
  inputGroup: {
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    textDecorationLine: 'underline',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  socialButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  // Category Picker
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPickerText: {
    fontSize: 15,
  },
  categoryDropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryOptionText: {
    fontSize: 14,
  },
  // Edit Actions
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  // Money Flow Section Styles
  moneyFlowSection: {
    marginTop: 24,
    gap: 16,
  },
  moneyFlowHeader: {
    marginBottom: 8,
  },
  moneyFlowTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  adminOnlyNote: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  moneyFlowCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  moneyFlowItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moneyFlowItemInputs: {
    flex: 1,
    gap: 8,
  },
  moneyFlowInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  moneyFlowItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  moneyFlowName: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'center' as const,
  },
  moneyFlowRelationship: {
    fontSize: 13,
    flex: 1,
    textAlign: 'center' as const,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center' as const,
    paddingVertical: 16,
  },
  sourcesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sourcesLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  sourcesText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic' as const,
  },
  listSection: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    marginBottom: 8,
    paddingHorizontal: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  // Location styles
  locationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  locationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  addLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 8,
    marginBottom: 16,
  },
  addLocationText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  locationsDisplay: {
    gap: 8,
  },
  locationDisplayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationDisplayText: {
    fontSize: 14,
    flex: 1,
  },
  // Gallery Styles
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  galleryUploadGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  gallerySlot: {
    flex: 1,
    gap: 8,
  },
  galleryPreviewBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  galleryPreview: {
    width: '100%',
    height: '100%',
  },
  removeGalleryButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCaption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    minHeight: 36,
    textAlignVertical: 'top',
  },
  galleryUploadButton: {
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
