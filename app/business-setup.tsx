import { useRouter } from 'expo-router';
import { Building2, ChevronDown, MapPin, Plus, X, Star } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { BusinessLocation } from '@/types';

// Common business categories
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

export default function BusinessSetupScreen() {
  const router = useRouter();
  const { isDarkMode, setBusinessInfo } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const [businessName, setBusinessName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [locations, setLocations] = useState<BusinessLocation[]>([
    { address: '', latitude: 0, longitude: 0, isPrimary: true }
  ]);

  const handleLocationSelect = (index: number, locationName: string, lat: number, lon: number) => {
    const newLocations = [...locations];
    newLocations[index] = {
      address: locationName,
      latitude: lat,
      longitude: lon,
      isPrimary: newLocations[index].isPrimary || false,
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

  const handleContinue = async () => {
    if (!businessName.trim()) {
      Alert.alert('Required', 'Please enter your business name');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Required', 'Please select a business category');
      return;
    }

    // Validate all locations
    const validLocations = locations.filter(loc =>
      loc.address.trim() && loc.latitude !== 0 && loc.longitude !== 0
    );

    if (validLocations.length === 0) {
      Alert.alert('Required', 'Please enter at least one business location. This is required so customers can find you on the map.');
      return;
    }

    // Get the primary location (or first location if no primary set)
    const primaryLocation = validLocations.find(loc => loc.isPrimary) || validLocations[0];

    // Save basic business info with multiple locations
    const businessInfo: any = {
      name: businessName.trim(),
      category: selectedCategory,
      locations: validLocations, // New multiple locations array
      // Backwards compatibility: save primary location to old fields
      location: primaryLocation.address,
      latitude: primaryLocation.latitude,
      longitude: primaryLocation.longitude,
      acceptsValueCodes: false, // Default to false, can be changed in profile later
    };

    await setBusinessInfo(businessInfo);

    // Continue to value selection
    router.push('/onboarding');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          Platform.OS === 'web' && styles.webContent
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/upright12dwc.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Building2 size={32} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Tell Us About Your Business
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This information will help us create your brand profile
          </Text>
        </View>

        {/* Business Name Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Business Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                color: colors.text,
              }
            ]}
            placeholder="Enter your business name"
            placeholderTextColor={colors.textSecondary}
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
          />
        </View>

        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Business Category
          </Text>
          <TouchableOpacity
            style={[
              styles.categoryPicker,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.categoryPickerText,
              { color: selectedCategory ? colors.text : colors.textSecondary }
            ]}>
              {selectedCategory || 'Select a category'}
            </Text>
            <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          {showCategoryPicker && (
            <View style={[
              styles.categoryList,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              }
            ]}>
              <ScrollView style={styles.categoryScrollView}>
                {BUSINESS_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      { borderBottomColor: colors.border },
                      selectedCategory === category && { backgroundColor: colors.primary + '10' }
                    ]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      { color: colors.text },
                      selectedCategory === category && { fontWeight: '600' }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Location Inputs */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <MapPin size={18} color={colors.text} strokeWidth={2} />
            <Text style={[styles.label, { color: colors.text }]}>
              Business Locations
            </Text>
          </View>

          {locations.map((location, index) => (
            <View key={index} style={styles.locationItem}>
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
                isConfirmed={location.latitude !== 0 && location.longitude !== 0}
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

          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Add all your business locations so customers can find you on the map. Mark one as primary.
          </Text>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.primary }]}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            You'll be able to add more details like your logo, description, and website in your profile settings after completing value selection.
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: businessName.trim() && selectedCategory && locations.some(loc => loc.address.trim() && loc.latitude !== 0 && loc.longitude !== 0) ? colors.primary : colors.border,
            }
          ]}
          onPress={handleContinue}
          disabled={!businessName.trim() || !selectedCategory || !locations.some(loc => loc.address.trim() && loc.latitude !== 0 && loc.longitude !== 0)}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            { color: businessName.trim() && selectedCategory && locations.some(loc => loc.address.trim() && loc.latitude !== 0 && loc.longitude !== 0) ? colors.white : colors.textSecondary }
          ]}>
            Continue to Value Selection
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingBottom: 80,
  },
  webContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  logo: {
    width: 180,
    height: 52,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
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
    fontSize: 16,
  },
  categoryList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 300,
    overflow: 'hidden',
  },
  categoryScrollView: {
    maxHeight: 300,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  categoryOptionText: {
    fontSize: 15,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  locationItem: {
    marginBottom: 16,
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
    marginBottom: 8,
  },
  addLocationText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
