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
} from 'react-native';
import { Image } from 'expo-image';
import { Building2, ChevronDown, Globe, Upload, MapPin, Facebook, Instagram, Twitter, Linkedin, Plus, X, ExternalLink, Camera } from 'lucide-react-native';
import { pickAndUploadImage } from '@/lib/imageUpload';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import LocationAutocomplete from '@/components/LocationAutocomplete';

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
  const { isDarkMode, profile, setBusinessInfo } = useUser();
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
  const [location, setLocation] = useState(businessInfo.location || '');
  const [latitude, setLatitude] = useState<number | undefined>(businessInfo.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(businessInfo.longitude);
  const [facebook, setFacebook] = useState(businessInfo.socialMedia?.facebook || '');
  const [instagram, setInstagram] = useState(businessInfo.socialMedia?.instagram || '');
  const [twitter, setTwitter] = useState(businessInfo.socialMedia?.twitter || '');
  const [linkedin, setLinkedin] = useState(businessInfo.socialMedia?.linkedin || '');
  const [ownership, setOwnership] = useState(businessInfo.ownership || []);
  const [ownershipSources, setOwnershipSources] = useState(businessInfo.ownershipSources || '');
  const [affiliates, setAffiliates] = useState(businessInfo.affiliates || []);
  const [partnerships, setPartnerships] = useState(businessInfo.partnerships || []);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleLocationSelect = (locationName: string, lat: number, lon: number) => {
    setLocation(locationName);
    setLatitude(lat);
    setLongitude(lon);
  };

  // Sync local state with profile changes
  useEffect(() => {
    setName(businessInfo.name);
    setCategory(businessInfo.category);
    setDescription(businessInfo.description || '');
    setWebsite(businessInfo.website || '');
    setLogoUrl(businessInfo.logoUrl || '');
    setLocation(businessInfo.location || '');
    setLatitude(businessInfo.latitude);
    setLongitude(businessInfo.longitude);
    setFacebook(businessInfo.socialMedia?.facebook || '');
    setInstagram(businessInfo.socialMedia?.instagram || '');
    setTwitter(businessInfo.socialMedia?.twitter || '');
    setLinkedin(businessInfo.socialMedia?.linkedin || '');
    setOwnership(businessInfo.ownership || []);
    setOwnershipSources(businessInfo.ownershipSources || '');
    setAffiliates(businessInfo.affiliates || []);
    setPartnerships(businessInfo.partnerships || []);
  }, [businessInfo]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Business name is required');
      return;
    }

    if (!category) {
      Alert.alert('Required', 'Business category is required');
      return;
    }

    const updateInfo: any = {
      name: name.trim(),
      category,
      description: description.trim(),
      website: website.trim(),
      logoUrl: logoUrl.trim(),
      socialMedia: {
        facebook: facebook.trim(),
        instagram: instagram.trim(),
        twitter: twitter.trim(),
        linkedin: linkedin.trim(),
      },
      ownership: ownership.length > 0 ? ownership : undefined,
      ownershipSources: ownershipSources.trim() || undefined,
      affiliates: affiliates.length > 0 ? affiliates : undefined,
      partnerships: partnerships.length > 0 ? partnerships : undefined,
    };

    if (location.trim()) {
      updateInfo.location = location.trim();
      console.log('[BusinessProfileEditor] Saving location:', location.trim());
    }
    if (latitude !== undefined) {
      updateInfo.latitude = latitude;
      console.log('[BusinessProfileEditor] Saving latitude:', latitude);
    }
    if (longitude !== undefined) {
      updateInfo.longitude = longitude;
      console.log('[BusinessProfileEditor] Saving longitude:', longitude);
    }

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
    setLocation(businessInfo.location || '');
    setLatitude(businessInfo.latitude);
    setLongitude(businessInfo.longitude);
    setFacebook(businessInfo.socialMedia?.facebook || '');
    setInstagram(businessInfo.socialMedia?.instagram || '');
    setTwitter(businessInfo.socialMedia?.twitter || '');
    setLinkedin(businessInfo.socialMedia?.linkedin || '');
    setOwnership(businessInfo.ownership || []);
    setOwnershipSources(businessInfo.ownershipSources || '');
    setAffiliates(businessInfo.affiliates || []);
    setPartnerships(businessInfo.partnerships || []);
    setEditing(false);
  };

  const handleLogoUpload = async () => {
    setUploadingImage(true);
    try {
      const downloadURL = await pickAndUploadImage(profile.id, 'business');
      if (downloadURL) {
        setLogoUrl(downloadURL);
        Alert.alert('Success', 'Business logo uploaded!');
      }
    } catch (error) {
      console.error('Error uploading business logo:', error);
    } finally {
      setUploadingImage(false);
    }
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

        {/* Logo URL and Upload (when editing) */}
        {editing && (
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Logo URL</Text>
            <View style={styles.logoInputRow}>
              <TextInput
                style={[styles.input, styles.logoUrlInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="https://example.com/logo.png"
                placeholderTextColor={colors.textSecondary}
                value={logoUrl}
                onChangeText={setLogoUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TouchableOpacity
                style={[styles.uploadButtonSmall, { backgroundColor: colors.primary }]}
                onPress={handleLogoUpload}
                activeOpacity={0.7}
              >
                <Upload size={16} color={colors.white} strokeWidth={2} />
              </TouchableOpacity>
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

        {/* Compact Layout - Name, Category, Location in rows */}
        <View style={styles.formGrid}>
          <View style={styles.formRow}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Location</Text>
              {editing ? (
                <LocationAutocomplete
                  value={location}
                  onLocationSelect={handleLocationSelect}
                  isDarkMode={isDarkMode}
                />
              ) : (
                <Text style={[styles.value, { color: colors.text }]}>
                  {businessInfo.location || 'Not set'}
                </Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <View style={styles.labelRow}>
                <Globe size={14} color={colors.text} strokeWidth={2} />
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
              ) : businessInfo.website ? (
                <TouchableOpacity
                  style={[styles.linkButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => Linking.openURL(businessInfo.website.startsWith('http') ? businessInfo.website : `https://${businessInfo.website}`)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.linkButtonText, { color: colors.white }]} numberOfLines={1}>
                    {businessInfo.website}
                  </Text>
                  <ExternalLink size={14} color={colors.white} strokeWidth={2} />
                </TouchableOpacity>
              ) : (
                <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
              )}
            </View>
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
  logoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  logoUrlInput: {
    flex: 1,
  },
  uploadButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
});
