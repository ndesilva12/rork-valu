import { useRouter } from 'expo-router';
import { Heart, Building2, GraduationCap, Sprout, Users, Baby, ShieldCheck, Church } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { AVAILABLE_ORGANIZATIONS, ORGANIZATION_CATEGORIES } from '@/mocks/organizations';
import { Organization } from '@/types';

const CATEGORY_ICONS: Record<string, any> = {
  'environmental': Sprout,
  'human-rights': Users,
  'healthcare': Heart,
  'education': GraduationCap,
  'poverty': Heart,
  'animal-welfare': Heart,
  'veterans': ShieldCheck,
  'children': Baby,
  'disaster-relief': ShieldCheck,
  'religious': Church,
};

export default function SelectOrganizationsScreen() {
  const router = useRouter();
  const { profile, setSelectedOrganizations, isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const [selectedOrgs, setSelectedOrgs] = useState<Organization[]>(
    profile.selectedOrganizations || []
  );
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTabletOrLarger = Platform.OS === 'web' && width >= 768;
  const MAX_ORGANIZATIONS = 3;

  useEffect(() => {
    console.log('[SelectOrganizations] Profile organizations updated:', profile.selectedOrganizations?.length || 0);
    if (profile.selectedOrganizations && profile.selectedOrganizations.length > 0) {
      setSelectedOrgs(profile.selectedOrganizations);
    }
  }, [profile.selectedOrganizations]);

  const toggleOrganization = (org: Organization) => {
    setSelectedOrgs(prev => {
      const existing = prev.find(o => o.id === org.id);

      if (existing) {
        // Remove if already selected
        return prev.filter(o => o.id !== org.id);
      } else {
        // Add if under limit
        if (prev.length < MAX_ORGANIZATIONS) {
          return [...prev, org];
        }
        return prev;
      }
    });
  };

  const isSelected = (orgId: string): boolean => {
    return selectedOrgs.some(o => o.id === orgId);
  };

  const handleSave = async () => {
    console.log('[SelectOrganizations] Saving', selectedOrgs.length, 'organizations');
    await setSelectedOrganizations(selectedOrgs);
    console.log('[SelectOrganizations] Organizations saved, navigating back');
    router.back();
  };

  // Group organizations by category
  const organizationsByCategory = ORGANIZATION_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = AVAILABLE_ORGANIZATIONS.filter(org => org.category === category.id);
    return acc;
  }, {} as Record<string, Organization[]>);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}>
        {/* Centering wrapper */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ width: '100%', maxWidth: isTabletOrLarger ? '50%' : 768 }}>
            <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Select Your Organizations</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose up to 3 charities and organizations that will receive your matched donations.
          </Text>
          <View style={[styles.instructionBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              <Text style={[styles.instructionBold, { color: colors.text }]}>
                {selectedOrgs.length}/{MAX_ORGANIZATIONS} selected
              </Text>
            </Text>
            {selectedOrgs.length >= MAX_ORGANIZATIONS && (
              <Text style={[styles.instructionText, { color: colors.danger }]}>
                Maximum reached. Deselect an organization to choose another.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.organizationsContainer}>
          {ORGANIZATION_CATEGORIES.map((category) => {
            const orgs = organizationsByCategory[category.id];
            if (!orgs || orgs.length === 0) return null;
            const Icon = CATEGORY_ICONS[category.id] || Heart;

            return (
              <View key={category.id} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Icon size={20} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    {category.name}
                  </Text>
                </View>
                <View style={styles.orgsGrid}>
                  {orgs.map(org => {
                    const selected = isSelected(org.id);
                    const canSelect = selectedOrgs.length < MAX_ORGANIZATIONS || selected;

                    return (
                      <View key={org.id} style={styles.orgRow}>
                        <TouchableOpacity
                          style={[
                            styles.orgCard,
                            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                            selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                            !canSelect && !selected && { opacity: 0.4 },
                          ]}
                          onPress={() => canSelect && toggleOrganization(org)}
                          activeOpacity={0.7}
                          disabled={!canSelect}
                        >
                          <View style={styles.orgContent}>
                            <Text
                              style={[
                                styles.orgName,
                                { color: colors.text },
                                selected && { color: colors.white, fontWeight: '600' as const },
                              ]}
                            >
                              {org.name}
                            </Text>
                            {org.description && (
                              <Text
                                style={[
                                  styles.orgDescription,
                                  { color: colors.textSecondary },
                                  selected && { color: colors.white, opacity: 0.9 },
                                ]}
                                numberOfLines={2}
                              >
                                {org.description}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 32 + insets.bottom, backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border }]}>
        {/* Centering wrapper for footer */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: '100%', maxWidth: isTabletOrLarger ? '50%' : 768 }}>
            <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
          {selectedOrgs.length} organization{selectedOrgs.length !== 1 ? 's' : ''} selected
        </Text>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              selectedOrgs.length === 0 && { backgroundColor: colors.neutral, opacity: 0.5 }
            ]}
            onPress={handleSave}
            disabled={selectedOrgs.length === 0}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveButtonText, { color: colors.white }]}>Save</Text>
          </TouchableOpacity>
        </View>
          </View>
        </View>
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
  title: {
    fontSize: 28,
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
  organizationsContainer: {
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
  orgsGrid: {
    gap: 12,
  },
  orgRow: {
    width: '100%',
  },
  orgCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  orgContent: {
    gap: 4,
  },
  orgName: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  orgDescription: {
    fontSize: 12,
    lineHeight: 16,
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
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
