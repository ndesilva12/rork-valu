import { useRouter } from 'expo-router';
import { Heart, Shield, Users, Building2, Globe, User, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Trophy } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { Cause, CauseCategory, AlignmentType } from '@/types';

// Icon mappings for common categories (with fallbacks)
const CATEGORY_ICONS: Record<string, any> = {
  social_issue: Heart,
  religion: Building2,
  ideology: Users,
  corporation: Building2,
  nation: Globe,
  organization: Shield,
  person: User,
  sports: Trophy,
  lifestyle: Heart,
  // Fallback will use Heart for unknown categories
};

// Label mappings for common categories (with dynamic fallback)
const CATEGORY_LABELS: Record<string, string> = {
  social_issue: 'Social Issues',
  religion: 'Religion',
  ideology: 'Ideology',
  corporation: 'Corporations',
  nation: 'Places',
  nations: 'Places',
  places: 'Places', // Handle all variations
  organization: 'Organizations',
  person: 'People',
  people: 'People', // Handle both "person" and "people"
  sports: 'Sports',
  lifestyle: 'Lifestyle',
};

// Normalize category names to handle case variations and synonyms
const normalizeCategory = (category: string): string => {
  const lower = category.toLowerCase().trim();

  // Handle synonyms and variations
  if (lower === 'person' || lower === 'people') return 'person';
  if (lower === 'social_issue' || lower === 'social issues') return 'social_issue';
  if (lower === 'nation' || lower === 'nations' || lower === 'places') return 'nation';

  return lower;
};

// Define category display order
const CATEGORY_ORDER = [
  'ideology',
  'social_issue',
  'person',
  'lifestyle',
  'nation',
  'religion',
  'organization',
  'sports',
];

// Helper to get icon for any category
const getCategoryIcon = (category: string) => {
  const normalized = normalizeCategory(category);
  return CATEGORY_ICONS[normalized] || Heart;
};

// Helper to get label for any category (with auto-capitalize fallback)
const getCategoryLabel = (category: string) => {
  const normalized = normalizeCategory(category);
  if (CATEGORY_LABELS[normalized]) return CATEGORY_LABELS[normalized];
  // Auto-capitalize: "some_category" -> "Some Category"
  return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};


interface SelectedValue {
  id: string;
  name: string;
  category: CauseCategory;
  type: AlignmentType;
  description?: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { addCauses, profile, isDarkMode, clerkUser, isLoading } = useUser();
  const { values: firebaseValues } = useData();
  const colors = isDarkMode ? darkColors : lightColors;
  const [selectedValues, setSelectedValues] = useState<SelectedValue[]>(() => {
    return profile.causes.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      type: c.type,
      description: c.description,
    }));
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const insets = useSafeAreaInsets();

  // Group values by NORMALIZED category from Firebase
  const valuesByCategory = firebaseValues.reduce((acc, value) => {
    const normalizedCategory = normalizeCategory(value.category || 'other');
    if (!acc[normalizedCategory]) {
      acc[normalizedCategory] = [];
    }
    acc[normalizedCategory].push(value);
    return acc;
  }, {} as Record<string, typeof firebaseValues>);

  // Get categories in the specified order, then add any additional categories alphabetically
  const knownCategories = CATEGORY_ORDER.filter(cat => valuesByCategory[cat]);
  const unknownCategories = Object.keys(valuesByCategory)
    .filter(cat => !CATEGORY_ORDER.includes(cat))
    .sort();
  const categories = [...knownCategories, ...unknownCategories];

  // Business accounts need minimum 3 values, personal accounts need 5
  const isBusiness = profile.accountType === 'business';
  const minValues = isBusiness ? 3 : 5;

  useEffect(() => {
    console.log('[Onboarding] Profile causes updated:', profile.causes.length);
    if (profile.causes.length > 0) {
      console.log('[Onboarding] Syncing selected values from profile');
      setSelectedValues(profile.causes.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        type: c.type,
        description: c.description,
      })));
    }
  }, [profile.causes]);

  const toggleValue = (valueId: string, name: string, category: string, description?: string) => {
    setSelectedValues(prev => {
      const existing = prev.find(v => v.id === valueId);

      if (!existing) {
        return [...prev, { id: valueId, name, category, type: 'support', description }];
      }

      if (existing.type === 'support') {
        return prev.map(v =>
          v.id === valueId ? { ...v, type: 'avoid' as AlignmentType } : v
        );
      }

      return prev.filter(v => v.id !== valueId);
    });
  };

  const getValueState = (valueId: string): 'unselected' | 'support' | 'avoid' => {
    const found = selectedValues.find(v => v.id === valueId);
    if (!found) return 'unselected';
    return found.type;
  };

  const handleContinue = async () => {
    console.log('[Onboarding] Continue pressed with', selectedValues.length, 'values');
    if (selectedValues.length >= minValues) {
      const causes: Cause[] = selectedValues.map(v => ({
        id: v.id,
        name: v.name,
        category: v.category,
        type: v.type,
        description: v.description,
      }));
      console.log('[Onboarding] Saving causes for user:', clerkUser?.id);
      console.log('[Onboarding] Causes to save:', JSON.stringify(causes.map(c => c.name), null, 2));
      await addCauses(causes);
      console.log('[Onboarding] addCauses completed');

      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[Onboarding] Redirecting to browse tab (Global section)');
      router.replace('/(tabs)/values');
    }
  };

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }, Platform.OS === 'web' && styles.webContent]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/endowide.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Identify Your Values</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select a positive or negative view of at least {minValues} items you feel strongly about.
          </Text>
          <View style={[styles.instructionBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              <Text style={[styles.instructionBold, { color: colors.text }]}>Tap once</Text> to support a value
            </Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              <Text style={[styles.instructionBold, { color: colors.text }]}>Tap twice</Text> to oppose a value
            </Text>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              <Text style={[styles.instructionBold, { color: colors.text }]}>Tap three times</Text> to deselect
            </Text>
          </View>
        </View>

        <View style={styles.causesContainer}>
          {categories.map((category) => {
            const values = valuesByCategory[category];
            if (!values || values.length === 0) return null;
            const Icon = getCategoryIcon(category);
            const isExpanded = expandedCategories.has(category);
            const displayedValues = isExpanded ? values : values.slice(0, 10);
            const hasMore = values.length > 10;

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Icon size={20} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    {getCategoryLabel(category)}
                  </Text>
                </View>
                <View style={styles.valuesGrid}>
                  {displayedValues.map(value => {
                    const state = getValueState(value.id);
                    return (
                      <TouchableOpacity
                        key={value.id}
                        style={[
                          styles.valueChip,
                          { borderColor: colors.border },
                          state === 'support' && { backgroundColor: colors.success, borderColor: colors.success },
                          state === 'avoid' && { backgroundColor: colors.danger, borderColor: colors.danger },
                        ]}
                        onPress={() => toggleValue(value.id, value.name, normalizeCategory(value.category), value.description)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.valueChipText,
                            { color: colors.text },
                            (state === 'support' || state === 'avoid') && { color: colors.white },
                          ]}
                          numberOfLines={1}
                        >
                          {value.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {hasMore && (
                  <TouchableOpacity
                    style={[styles.showMoreButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                    onPress={() => toggleCategoryExpanded(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.showMoreText, { color: colors.primary }]}>
                      {isExpanded ? 'Show Less' : `Show ${values.length - 10} More`}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={16} color={colors.primary} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={16} color={colors.primary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 32 + insets.bottom, backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border }, Platform.OS === 'web' && styles.footerWeb]}>
        <View style={[styles.footerContent, Platform.OS === 'web' && styles.footerContentWeb]}>
          <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
            {selectedValues.length} {selectedValues.length === 1 ? 'value' : 'values'} selected{selectedValues.length < minValues ? ` (minimum ${minValues} required)` : ''}
          </Text>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }, selectedValues.length < minValues && { backgroundColor: colors.neutral, opacity: 0.5 }]}
            onPress={handleContinue}
            disabled={selectedValues.length < minValues}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueButtonText, { color: colors.white }]}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  scrollContent: {},
  webContent: {
    maxWidth: 768,
    alignSelf: 'center' as const,
    width: '100%',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    width: 200,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructionBox: {
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionBold: {
    fontWeight: '600' as const,
  },

  causesContainer: {
    paddingHorizontal: 24,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  valueChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  valueChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  valueRow: {
    width: '100%',
  },
  valueCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  valueCardSupport: {},
  valueCardAvoid: {},
  valueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueName: {
    fontSize: 15,
    fontWeight: '500' as const,
    flex: 1,
  },
  valueNameSelected: {},
  stateIndicator: {
    marginLeft: 12,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stateBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerWeb: {
    alignItems: 'center',
  },
  footerContent: {
    width: '100%',
  },
  footerContentWeb: {
    width: '50%',
    maxWidth: 400,
  },
  selectedCount: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {},
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  showMoreButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
