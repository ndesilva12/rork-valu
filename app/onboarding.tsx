import { useRouter } from 'expo-router';
import { Heart, Shield, Users, Building2, Globe, User, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { AVAILABLE_VALUES } from '@/mocks/values';
import { UserValue, ValueCategory, AlignmentType } from '@/types';

const CATEGORY_ICONS: Record<ValueCategory, any> = {
  social_issue: Heart,
  religion: Building2,
  ideology: Users,
  corporation: Building2,
  nation: Globe,
  organization: Shield,
  person: User,
};

const CATEGORY_LABELS: Record<ValueCategory, string> = {
  social_issue: 'Social Issues',
  religion: 'Religion',
  ideology: 'Ideology',
  corporation: 'Corporations',
  nation: 'Places',
  organization: 'Organizations',
  person: 'People',
};

interface SelectedValue {
  id: string;
  name: string;
  category: ValueCategory;
  type: AlignmentType;
  description?: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { addValues, profile, isDarkMode, clerkUser, isLoading } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const [selectedValues, setSelectedValues] = useState<SelectedValue[]>(() => {
    return profile.values.map(v => ({
      id: v.id,
      name: v.name,
      category: v.category,
      type: v.type,
      description: v.description,
    }));
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<ValueCategory>>(new Set());
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('[Onboarding] Profile values updated:', profile.values.length);
    if (profile.values.length > 0) {
      console.log('[Onboarding] Syncing selected values from profile');
      setSelectedValues(profile.values.map(v => ({
        id: v.id,
        name: v.name,
        category: v.category,
        type: v.type,
        description: v.description,
      })));
    }
  }, [profile.values]);

  const toggleValue = (valueId: string, name: string, category: ValueCategory, description?: string) => {
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
    if (selectedValues.length > 0) {
      const userValues: UserValue[] = selectedValues.map(v => ({
        id: v.id,
        name: v.name,
        category: v.category,
        type: v.type,
        description: v.description,
      }));
      console.log('[Onboarding] Saving values for user:', clerkUser?.id);
      console.log('[Onboarding] Values to save:', JSON.stringify(userValues.map(v => v.name), null, 2));
      await addValues(userValues);
      console.log('[Onboarding] addValues completed');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[Onboarding] Redirecting to home');
      router.replace('/(tabs)/home');
    }
  };

  const toggleCategoryExpanded = (category: ValueCategory) => {
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ohh0oqrvnuowj1apebwt9' }} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Identify Your Values</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select a positive or negative view of any items you feel strongly about.
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

        <View style={styles.valuesContainer}>
          {(['ideology', 'person', 'social_issue', 'religion', 'nation', 'organization'] as ValueCategory[]).map((category) => {
            const values = AVAILABLE_VALUES[category];
            if (!values || values.length === 0) return null;
            const Icon = CATEGORY_ICONS[category as ValueCategory];
            const isExpanded = expandedCategories.has(category);
            const displayedValues = isExpanded ? values : values.slice(0, 3);
            const hasMore = values.length > 3;

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Icon size={20} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    {CATEGORY_LABELS[category as ValueCategory]}
                  </Text>
                </View>
                <View style={styles.valuesGrid}>
                  {displayedValues.map(value => {
                    const state = getValueState(value.id);
                    return (
                      <View key={value.id} style={styles.valueRow}>
                        <TouchableOpacity
                          style={[
                            styles.valueCard,
                            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                            state === 'support' && { backgroundColor: colors.success, borderColor: colors.success },
                            state === 'avoid' && { backgroundColor: colors.danger, borderColor: colors.danger },
                          ]}
                          onPress={() => toggleValue(value.id, value.name, value.category, value.description)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.valueContent}>
                            <Text
                              style={[
                                styles.valueName,
                                { color: colors.text },
                                (state === 'support' || state === 'avoid') && { color: colors.white, fontWeight: '600' as const },
                              ]}
                            >
                              {value.name}
                            </Text>
                            {state !== 'unselected' && (
                              <View style={styles.stateIndicator}>
                                {state === 'support' ? (
                                  <View style={styles.stateBadge}>
                                    <ThumbsUp size={12} color={colors.white} strokeWidth={2} />
                                    <Text style={[styles.stateBadgeText, { color: colors.white }]}>Support</Text>
                                  </View>
                                ) : (
                                  <View style={styles.stateBadge}>
                                    <ThumbsDown size={12} color={colors.white} strokeWidth={2} />
                                    <Text style={[styles.stateBadgeText, { color: colors.white }]}>Oppose</Text>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      </View>
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
                      {isExpanded ? 'Show Less' : `Show ${values.length - 3} More`}
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

      <View style={[styles.footer, { paddingBottom: 32 + insets.bottom, backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border }]}>
        <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
          {selectedValues.length} {selectedValues.length === 1 ? 'value' : 'values'} selected
        </Text>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }, selectedValues.length === 0 && { backgroundColor: colors.neutral, opacity: 0.5 }]}
          onPress={handleContinue}
          disabled={selectedValues.length === 0}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueButtonText, { color: colors.white }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
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

  valuesContainer: {
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
    gap: 12,
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
