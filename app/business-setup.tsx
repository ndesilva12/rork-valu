import { useRouter } from 'expo-router';
import { Building2, ChevronDown, MapPin } from 'lucide-react-native';
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
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const handleLocationSelect = (locationName: string, lat: number, lon: number) => {
    setLocation(locationName);
    setLatitude(lat);
    setLongitude(lon);
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

    // Save basic business info (including location if provided)
    const businessInfo: any = {
      name: businessName.trim(),
      category: selectedCategory,
      acceptsValuCodes: false, // Default to false, can be changed in profile later
    };

    if (location.trim()) {
      businessInfo.location = location.trim();
    }
    if (latitude !== undefined) {
      businessInfo.latitude = latitude;
    }
    if (longitude !== undefined) {
      businessInfo.longitude = longitude;
    }

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
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ohh0oqrvnuowj1apebwt9' }}
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

        {/* Location Input */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <MapPin size={18} color={colors.text} strokeWidth={2} />
            <Text style={[styles.label, { color: colors.text }]}>
              Location (Optional)
            </Text>
          </View>
          <LocationAutocomplete
            value={location}
            onLocationSelect={handleLocationSelect}
            isDarkMode={isDarkMode}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Adding your location helps customers find you on the map
          </Text>
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            You'll be able to add more details like your logo, description, and website in your profile settings after completing value selection.
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: businessName.trim() && selectedCategory ? colors.primary : colors.border,
            }
          ]}
          onPress={handleContinue}
          disabled={!businessName.trim() || !selectedCategory}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.continueButtonText,
            { color: businessName.trim() && selectedCategory ? colors.white : colors.textSecondary }
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
    alignItems: 'center',
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
});
