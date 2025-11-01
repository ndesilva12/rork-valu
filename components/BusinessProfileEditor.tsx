import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Building2, ChevronDown, Globe, Upload, MapPin } from 'lucide-react-native';
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
    acceptsValuCodes: false,
    valuCodeDiscount: 10,
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

  const handleLocationSelect = (locationName: string, lat: number, lon: number) => {
    setLocation(locationName);
    setLatitude(lat);
    setLongitude(lon);
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

    const updateInfo: any = {
      name: name.trim(),
      category,
      description: description.trim(),
      website: website.trim(),
      logoUrl: logoUrl.trim(),
    };

    if (location.trim()) {
      updateInfo.location = location.trim();
    }
    if (latitude !== undefined) {
      updateInfo.latitude = latitude;
    }
    if (longitude !== undefined) {
      updateInfo.longitude = longitude;
    }

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
    setEditing(false);
  };

  const handleLogoUpload = () => {
    // In a real app, this would open an image picker
    Alert.alert(
      'Upload Logo',
      'Logo upload functionality will be available in a future update. For now, you can enter a logo URL directly.',
      [{ text: 'OK' }]
    );
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
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {logoUrl || businessInfo.logoUrl ? (
              <Image
                source={{ uri: logoUrl || businessInfo.logoUrl }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : (
              <Building2 size={48} color={colors.textSecondary} strokeWidth={1.5} />
            )}
          </View>
          {editing && (
            <View style={styles.logoActions}>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={handleLogoUpload}
                activeOpacity={0.7}
              >
                <Upload size={16} color={colors.white} strokeWidth={2} />
                <Text style={[styles.uploadButtonText, { color: colors.white }]}>
                  Upload Logo
                </Text>
              </TouchableOpacity>
              <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>
                or enter URL below
              </Text>
            </View>
          )}
        </View>

        {/* Logo URL Input (when editing) */}
        {editing && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Logo URL</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="https://example.com/logo.png"
              placeholderTextColor={colors.textSecondary}
              value={logoUrl}
              onChangeText={setLogoUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
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

        {/* Location */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <MapPin size={16} color={colors.text} strokeWidth={2} />
            <Text style={[styles.label, { color: colors.text }]}>Location</Text>
          </View>
          {editing ? (
            <LocationAutocomplete
              value={location}
              onLocationSelect={handleLocationSelect}
              isDarkMode={isDarkMode}
            />
          ) : (
            <Text style={[styles.value, { color: colors.text }]}>
              {businessInfo.location || 'No location added'}
            </Text>
          )}
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
    padding: 20,
  },
  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  logoActions: {
    alignItems: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    marginBottom: 6,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  uploadHint: {
    fontSize: 12,
  },
  // Input Groups
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  value: {
    fontSize: 15,
    lineHeight: 22,
  },
  link: {
    textDecorationLine: 'underline',
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
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
