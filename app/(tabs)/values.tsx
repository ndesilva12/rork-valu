import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { ChevronRight, ChevronDown, ChevronUp, Heart, Building2, Users, Globe, Shield, User as UserIcon, Plus, Edit3, X } from 'lucide-react-native';
import { useState } from 'react';
import MenuButton from '@/components/MenuButton';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { AVAILABLE_VALUES } from '@/mocks/causes';
import { CauseCategory, Cause } from '@/types';

const CATEGORY_ICONS: Record<CauseCategory, any> = {
  social_issue: Heart,
  religion: Building2,
  ideology: Users,
  corporation: Building2,
  nation: Globe,
  organization: Shield,
  person: UserIcon,
};

const CATEGORY_LABELS: Record<CauseCategory, string> = {
  social_issue: 'Social Issues',
  religion: 'Religion',
  ideology: 'Ideology',
  corporation: 'Corporations',
  nation: 'Places',
  organization: 'Organizations',
  person: 'People',
};

export default function ValuesScreen() {
  const router = useRouter();
  const { profile, isDarkMode, removeCauses, toggleCauseType } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const [expandedCategories, setExpandedCategories] = useState<Set<CauseCategory>>(new Set());
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [addingValueId, setAddingValueId] = useState<string | null>(null);

  const supportCauses = (profile.causes || [])
    .filter(c => c.type === 'support')
    .sort((a, b) => a.name.localeCompare(b.name));
  const avoidCauses = (profile.causes || [])
    .filter(c => c.type === 'avoid')
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get all selected value IDs
  const selectedValueIds = new Set((profile.causes || []).map(c => c.id));

  // Get unselected values by category
  const unselectedValuesByCategory: Record<CauseCategory, typeof AVAILABLE_VALUES[keyof typeof AVAILABLE_VALUES]> = {
    social_issue: [],
    religion: [],
    ideology: [],
    corporation: [],
    nation: [],
    organization: [],
    person: [],
  };

  // Populate unselected values
  (['ideology', 'person', 'social_issue', 'religion', 'nation', 'organization'] as CauseCategory[]).forEach(category => {
    const values = AVAILABLE_VALUES[category] || [];
    unselectedValuesByCategory[category] = values.filter(v => !selectedValueIds.has(v.id));
  });

  const toggleCategoryExpanded = (category: CauseCategory) => {
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

  const handleUpdateValues = () => {
    router.push('/onboarding');
  };

  const handleResetValues = () => {
    Alert.alert(
      'Reset All Values',
      'Are you sure you want to reset all your values? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            // Remove all causes
            const allCauseIds = (profile.causes || []).map(c => c.id);
            await removeCauses(allCauseIds);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCycleValue = async (cause: Cause) => {
    // Cycle: aligned → unaligned → unselected → aligned
    if (cause.type === 'support') {
      await toggleCauseType(cause, 'avoid');
    } else if (cause.type === 'avoid') {
      await toggleCauseType(cause, 'remove');
    }
    setEditingValueId(null);
  };

  const handleAddValue = async (value: any, type: 'support' | 'avoid') => {
    const newCause: Cause = {
      id: value.id,
      name: value.name,
      category: value.category,
      type,
      description: value.description,
    };
    await toggleCauseType(newCause, type);
    setAddingValueId(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.stickyHeaderContainer, { backgroundColor: colors.background, borderBottomColor: 'rgba(0, 0, 0, 0.05)' }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Image
            source={isDarkMode ? require('@/assets/images/stand logo white.png') : require('@/assets/images/stand logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <MenuButton />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleUpdateValues}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, { color: colors.white }]}>
              Update All Values
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton, { borderColor: colors.danger }]}
            onPress={handleResetValues}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, { color: colors.danger }]}>
              Reset All Values
            </Text>
          </TouchableOpacity>
        </View>

        {supportCauses.length === 0 && avoidCauses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Values Selected</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap "Update All Values" to add values
            </Text>
          </View>
        ) : (
          <>
            {supportCauses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Aligned
                </Text>
                <View style={styles.valuesList}>
                  {supportCauses.map(cause => (
                    <View key={cause.id} style={styles.valueRowContainer}>
                      <TouchableOpacity
                        style={[styles.valueRow, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => {
                          if (editingValueId !== cause.id) {
                            router.push(`/value/${cause.id}`);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.valueNameBox, { borderColor: colors.success }]}>
                          <Text style={[styles.valueNameText, { color: colors.success }]} numberOfLines={1}>
                            {cause.name}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => setEditingValueId(editingValueId === cause.id ? null : cause.id)}
                          activeOpacity={0.7}
                        >
                          {editingValueId === cause.id ? (
                            <X size={18} color={colors.textSecondary} strokeWidth={2} />
                          ) : (
                            <Edit3 size={18} color={colors.textSecondary} strokeWidth={2} />
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {editingValueId === cause.id && (
                        <View style={[styles.editActions, { backgroundColor: colors.background }]}>
                          <TouchableOpacity
                            style={[styles.cycleButton, { backgroundColor: colors.danger }]}
                            onPress={() => handleCycleValue(cause)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.cycleButtonText, { color: colors.white }]}>
                              Change to Unaligned
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.removeButton, { borderColor: colors.border }]}
                            onPress={() => {
                              toggleCauseType(cause, 'remove');
                              setEditingValueId(null);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.removeButtonText, { color: colors.textSecondary }]}>
                              Remove
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {avoidCauses.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Unaligned
                </Text>
                <View style={styles.valuesList}>
                  {avoidCauses.map(cause => (
                    <View key={cause.id} style={styles.valueRowContainer}>
                      <TouchableOpacity
                        style={[styles.valueRow, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => {
                          if (editingValueId !== cause.id) {
                            router.push(`/value/${cause.id}`);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.valueNameBox, { borderColor: colors.danger }]}>
                          <Text style={[styles.valueNameText, { color: colors.danger }]} numberOfLines={1}>
                            {cause.name}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => setEditingValueId(editingValueId === cause.id ? null : cause.id)}
                          activeOpacity={0.7}
                        >
                          {editingValueId === cause.id ? (
                            <X size={18} color={colors.textSecondary} strokeWidth={2} />
                          ) : (
                            <Edit3 size={18} color={colors.textSecondary} strokeWidth={2} />
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {editingValueId === cause.id && (
                        <View style={[styles.editActions, { backgroundColor: colors.background }]}>
                          <TouchableOpacity
                            style={[styles.cycleButton, { backgroundColor: colors.neutral }]}
                            onPress={() => handleCycleValue(cause)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.cycleButtonText, { color: colors.white }]}>
                              Remove from Values
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.removeButton, { borderColor: colors.border }]}
                            onPress={async () => {
                              await toggleCauseType(cause, 'support');
                              setEditingValueId(null);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.removeButtonText, { color: colors.success }]}>
                              Change to Aligned
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Unselected Values Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Unselected Values
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Tap any value to explore brands associated with it
          </Text>

          {(['ideology', 'person', 'social_issue', 'religion', 'nation', 'organization'] as CauseCategory[]).map((category) => {
            const values = unselectedValuesByCategory[category];
            if (!values || values.length === 0) return null;

            const Icon = CATEGORY_ICONS[category];
            const isExpanded = expandedCategories.has(category);
            const displayedValues = isExpanded ? values : values.slice(0, 3);
            const hasMore = values.length > 3;

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Icon size={18} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    {CATEGORY_LABELS[category]}
                  </Text>
                </View>
                <View style={styles.valuesList}>
                  {displayedValues.map(value => (
                    <View key={value.id} style={styles.valueRowContainer}>
                      <TouchableOpacity
                        style={[styles.valueRow, styles.unselectedValueRow, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => {
                          if (addingValueId !== value.id) {
                            router.push(`/value/${value.id}`);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.valueNameBox, styles.unselectedValueNameBox, { borderColor: colors.neutral }]}>
                          <Text style={[styles.valueNameText, styles.unselectedValueText, { color: colors.neutral }]} numberOfLines={1}>
                            {value.name}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.addButton}
                          onPress={() => setAddingValueId(addingValueId === value.id ? null : value.id)}
                          activeOpacity={0.7}
                        >
                          {addingValueId === value.id ? (
                            <X size={18} color={colors.neutral} strokeWidth={2} />
                          ) : (
                            <Plus size={18} color={colors.primary} strokeWidth={2.5} />
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {addingValueId === value.id && (
                        <View style={[styles.addActions, { backgroundColor: colors.background }]}>
                          <TouchableOpacity
                            style={[styles.addTypeButton, { backgroundColor: colors.success }]}
                            onPress={() => handleAddValue(value, 'support')}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.addTypeButtonText, { color: colors.white }]}>
                              Add as Aligned
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.addTypeButton, { backgroundColor: colors.danger }]}
                            onPress={() => handleAddValue(value, 'avoid')}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.addTypeButtonText, { color: colors.white }]}>
                              Add as Unaligned
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
                {hasMore && (
                  <TouchableOpacity
                    style={[styles.showMoreButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                    onPress={() => toggleCategoryExpanded(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.showMoreText, { color: colors.textSecondary }]}>
                      {isExpanded ? 'Show Less' : `Show ${values.length - 3} More`}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={16} color={colors.textSecondary} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About Your Values</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Tap any value to see brands that align with it. Green values represent causes you support,
            while red values represent causes you avoid, and grey values are unselected.
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your values help us recommend products and brands that match your beliefs and priorities.
          </Text>
        </View>
      </ScrollView>
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  stickyHeaderContainer: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 0 : 56,
    paddingBottom: 12,
  },
  headerLogo: {
    width: 140,
    height: 41,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  valuesList: {
    gap: 12,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  unselectedValueRow: {
    opacity: 0.9,
  },
  valueNameBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignSelf: 'flex-start',
  },
  unselectedValueNameBox: {
    borderWidth: 1.5,
  },
  valueNameText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  unselectedValueText: {
    fontWeight: '500' as const,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  valueRowContainer: {
    marginBottom: 0,
  },
  editButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  addActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  cycleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cycleButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  removeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  addTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addTypeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
