import { useRouter } from 'expo-router';
import { Heart, Shield, Users, Building2, Globe, User, Check, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { AVAILABLE_CHARITIES, CHARITY_CATEGORIES } from '@/mocks/charities';
import { Charity } from '@/types';

const CATEGORY_ICONS: Record<string, any> = {
  'Environmental': Globe,
  'Human Rights': Heart,
  'Education': Users,
  'Health': Heart,
  'Poverty & Hunger': Heart,
  'Animal Welfare': Heart,
  'Veterans & Military': Shield,
};

const MAX_CHARITIES = 3;

export default function SelectCharitiesScreen() {
  const router = useRouter();
  const { profile, updateSelectedCharities, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const [selectedCharities, setSelectedCharities] = useState<Charity[]>(() => {
    return profile.selectedCharities || [];
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (profile.selectedCharities) {
      setSelectedCharities(profile.selectedCharities);
    }
  }, [profile.selectedCharities]);

  const toggleCharity = (charity: Charity) => {
    setSelectedCharities(prev => {
      const existing = prev.find(c => c.id === charity.id);

      if (existing) {
        // Remove if already selected
        return prev.filter(c => c.id !== charity.id);
      } else {
        // Add if under limit
        if (prev.length < MAX_CHARITIES) {
          return [...prev, charity];
        }
        return prev;
      }
    });
  };

  const isCharitySelected = (charityId: string): boolean => {
    return selectedCharities.some(c => c.id === charityId);
  };

  const handleSave = async () => {
    await updateSelectedCharities(selectedCharities);
    router.back();
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

  const groupedCharities = CHARITY_CATEGORIES.reduce((acc, category) => {
    acc[category] = AVAILABLE_CHARITIES.filter(c => c.category === category);
    return acc;
  }, {} as Record<string, Charity[]>);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Charities</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
          Platform.OS === 'web' && styles.webContent
        ]}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Choose Your Impact</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select up to {MAX_CHARITIES} organizations to receive donations on your behalf as you shop.
          </Text>
          <View style={[styles.counterContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.counterText, { color: colors.primary }]}>
              {selectedCharities.length} / {MAX_CHARITIES} selected
            </Text>
          </View>
        </View>

        {CHARITY_CATEGORIES.map(category => {
          const charities = groupedCharities[category] || [];
          const isExpanded = expandedCategories.has(category);
          const CategoryIcon = CATEGORY_ICONS[category] || Heart;

          return (
            <View key={category} style={styles.categorySection}>
              <TouchableOpacity
                style={[styles.categoryHeader, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => toggleCategoryExpanded(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeaderLeft}>
                  <CategoryIcon size={20} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>{category}</Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color={colors.textSecondary} strokeWidth={2} />
                ) : (
                  <ChevronDown size={20} color={colors.textSecondary} strokeWidth={2} />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.charitiesContainer}>
                  {charities.map(charity => {
                    const isSelected = isCharitySelected(charity.id);
                    const canSelect = selectedCharities.length < MAX_CHARITIES || isSelected;

                    return (
                      <TouchableOpacity
                        key={charity.id}
                        style={[
                          styles.charityCard,
                          {
                            backgroundColor: colors.backgroundSecondary,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderWidth: isSelected ? 2 : 1,
                            opacity: !canSelect ? 0.5 : 1,
                          },
                        ]}
                        onPress={() => toggleCharity(charity)}
                        activeOpacity={0.7}
                        disabled={!canSelect}
                      >
                        <View style={styles.charityCardContent}>
                          <View style={styles.charityInfo}>
                            <Text style={[styles.charityName, { color: colors.text }]}>{charity.name}</Text>
                            <Text style={[styles.charityDescription, { color: colors.textSecondary }]}>
                              {charity.description}
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                              <Check size={16} color={colors.white} strokeWidth={3} />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: selectedCharities.length > 0 ? colors.primary : colors.border,
            },
          ]}
          onPress={handleSave}
          disabled={selectedCharities.length === 0}
          activeOpacity={0.7}
        >
          <Text style={[styles.saveButtonText, { color: colors.white }]}>
            Save Selection
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  webContent: {
    maxWidth: 768,
    alignSelf: 'center' as const,
    width: '100%',
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  counterContainer: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  charitiesContainer: {
    marginTop: 8,
    gap: 8,
  },
  charityCard: {
    borderRadius: 12,
    padding: 16,
  },
  charityCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charityInfo: {
    flex: 1,
    marginRight: 12,
  },
  charityName: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  charityDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
