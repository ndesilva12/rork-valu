import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Plus, Minus, ChevronDown } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

type EndorsementType = 'any' | 'top10' | 'top5';

export default function ValueCodeSettings() {
  const { isDarkMode, profile, setBusinessInfo } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const businessInfo = profile.businessInfo || {
    name: '',
    category: '',
    acceptsStandDiscounts: false,
    customerDiscountPercent: 5,
    customDiscount: '',
  };

  const [acceptsDiscounts, setAcceptsDiscounts] = useState(
    businessInfo.acceptsStandDiscounts ?? false
  );

  // Universal discount
  const [universalDiscount, setUniversalDiscount] = useState(businessInfo.customerDiscountPercent || 5);

  // Endorsement discount
  const [endorsementEnabled, setEndorsementEnabled] = useState(businessInfo.endorsementEnabled || false);
  const [endorsementType, setEndorsementType] = useState<EndorsementType>(businessInfo.endorsementType || 'any');
  const [endorsementDiscount, setEndorsementDiscount] = useState(businessInfo.endorsementDiscount || 10);
  const [endorsementMinDays, setEndorsementMinDays] = useState(businessInfo.endorsementMinDays || 0);
  const [showEndorsementTypeDropdown, setShowEndorsementTypeDropdown] = useState(false);

  // Follows discount
  const [followsEnabled, setFollowsEnabled] = useState(businessInfo.followsEnabled || false);
  const [followsDiscount, setFollowsDiscount] = useState(businessInfo.followsDiscount || 7);
  const [followsMinDays, setFollowsMinDays] = useState(businessInfo.followsMinDays || 0);

  // Custom discount
  const [customDiscountText, setCustomDiscountText] = useState(businessInfo.customDiscount || '');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleToggleDiscounts = async (value: boolean) => {
    setAcceptsDiscounts(value);
    await setBusinessInfo({
      acceptsStandDiscounts: value,
    });

    if (value) {
      Alert.alert(
        'Discounts Enabled',
        'Customers can now use Upright to receive discounts at your business!',
        [{ text: 'Great!' }]
      );
    }
  };

  const handleChangeUniversalDiscount = async (newValue: number) => {
    const clamped = Math.max(0, Math.min(50, newValue));
    setUniversalDiscount(clamped);
    await setBusinessInfo({
      customerDiscountPercent: clamped,
    });
  };

  const handleToggleEndorsement = async (value: boolean) => {
    setEndorsementEnabled(value);
    await setBusinessInfo({
      endorsementEnabled: value,
    });
  };

  const handleChangeEndorsementType = async (type: EndorsementType) => {
    setEndorsementType(type);
    setShowEndorsementTypeDropdown(false);
    await setBusinessInfo({
      endorsementType: type,
    });
  };

  const handleChangeEndorsementDiscount = async (newValue: number) => {
    // Must be higher than universal discount
    const minValue = universalDiscount + 0.5;
    const clamped = Math.max(minValue, Math.min(50, newValue));
    setEndorsementDiscount(clamped);
    await setBusinessInfo({
      endorsementDiscount: clamped,
    });
  };

  const handleChangeEndorsementMinDays = async (newDays: number) => {
    const clamped = Math.max(0, Math.min(365, newDays));
    setEndorsementMinDays(clamped);
    await setBusinessInfo({
      endorsementMinDays: clamped,
    });
  };

  const handleToggleFollows = async (value: boolean) => {
    setFollowsEnabled(value);
    await setBusinessInfo({
      followsEnabled: value,
    });
  };

  const handleChangeFollowsDiscount = async (newValue: number) => {
    const clamped = Math.max(0, Math.min(50, newValue));
    setFollowsDiscount(clamped);
    await setBusinessInfo({
      followsDiscount: clamped,
    });
  };

  const handleChangeFollowsMinDays = async (newDays: number) => {
    const clamped = Math.max(0, Math.min(365, newDays));
    setFollowsMinDays(clamped);
    await setBusinessInfo({
      followsMinDays: clamped,
    });
  };

  const handleSaveCustomDiscount = async () => {
    if (!customDiscountText.trim()) {
      Alert.alert('Error', 'Please enter your custom discount details');
      return;
    }

    await setBusinessInfo({
      customDiscount: customDiscountText.trim(),
    });

    Alert.alert(
      'Custom Discount Submitted',
      'Thank you! We will reach out to confirm and approve your custom discount.',
      [{ text: 'OK' }]
    );
    setShowCustomInput(false);
  };

  const getEndorsementTypeLabel = (type: EndorsementType) => {
    switch (type) {
      case 'any': return 'Any';
      case 'top10': return 'Top 10';
      case 'top5': return 'Top 5';
    }
  };

  return (
    <>
      {/* DISCOUNTS SECTION */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Discounts</Text>

        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
          {/* Toggle */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Accept Discounts</Text>
            <Switch
              value={acceptsDiscounts}
              onValueChange={handleToggleDiscounts}
              trackColor={{ false: '#D1D5DB', true: '#000000' }}
              thumbColor='#FFFFFF'
              ios_backgroundColor='#E5E7EB'
            />
          </View>

          {/* What You Get box - Only visible when discounts are NOT accepted */}
          {!acceptsDiscounts && (
            <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                What You Get For Discounts
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                <Text style={styles.underlinedText}>When you accept discounts, you get invaluable insights about what your customers believe.</Text> Find out: ideologies, causes, social issues, interests, celebrity sentiments, religions, etc.
              </Text>
            </View>
          )}

          {acceptsDiscounts && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* ROW 1: Universal Discount */}
              <View style={[styles.discountRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.discountRowHeader}>
                  <Text style={[styles.discountRowTitle, { color: colors.text }]}>Universal Discount</Text>
                  <Text style={[styles.discountRowDescription, { color: colors.textSecondary }]}>
                    Available to all customers
                  </Text>
                </View>
                <View style={styles.inlineCounter}>
                  <TouchableOpacity
                    style={[styles.smallButton, { borderColor: colors.border }]}
                    onPress={() => handleChangeUniversalDiscount(universalDiscount - 0.5)}
                    activeOpacity={0.7}
                  >
                    <Minus size={16} color={colors.text} strokeWidth={2} />
                  </TouchableOpacity>
                  <Text style={[styles.counterValue, { color: colors.primary }]}>
                    {universalDiscount.toFixed(1)}%
                  </Text>
                  <TouchableOpacity
                    style={[styles.smallButton, { borderColor: colors.border }]}
                    onPress={() => handleChangeUniversalDiscount(universalDiscount + 0.5)}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={colors.text} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ROW 2: Endorsement Discount */}
              <View style={[styles.discountRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.discountRowHeaderWithToggle}>
                  <View style={styles.discountRowHeader}>
                    <Text style={[styles.discountRowTitle, { color: colors.text }]}>Endorsement</Text>
                    <Text style={[styles.discountRowDescription, { color: colors.textSecondary }]}>
                      Rank and time requirement
                    </Text>
                  </View>
                  <Switch
                    value={endorsementEnabled}
                    onValueChange={handleToggleEndorsement}
                    trackColor={{ false: '#D1D5DB', true: '#000000' }}
                    thumbColor='#FFFFFF'
                    ios_backgroundColor='#E5E7EB'
                  />
                </View>

                {endorsementEnabled && (
                  <View style={styles.expandedOptions}>
                    {/* Type Dropdown */}
                    <View style={styles.optionGroup}>
                      <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Type</Text>
                      <TouchableOpacity
                        style={[styles.dropdown, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                        onPress={() => setShowEndorsementTypeDropdown(!showEndorsementTypeDropdown)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dropdownText, { color: colors.text }]}>
                          {getEndorsementTypeLabel(endorsementType)}
                        </Text>
                        <ChevronDown size={16} color={colors.textSecondary} strokeWidth={2} />
                      </TouchableOpacity>
                      {showEndorsementTypeDropdown && (
                        <View style={[styles.dropdownList, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                          {(['any', 'top10', 'top5'] as EndorsementType[]).map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.dropdownItem,
                                { borderBottomColor: colors.border },
                                endorsementType === type && { backgroundColor: colors.primary + '15' }
                              ]}
                              onPress={() => handleChangeEndorsementType(type)}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.dropdownItemText,
                                { color: endorsementType === type ? colors.primary : colors.text }
                              ]}>
                                {getEndorsementTypeLabel(type)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Discount Percentage */}
                    <View style={styles.optionGroup}>
                      <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Discount</Text>
                      <View style={styles.inlineCounter}>
                        <TouchableOpacity
                          style={[styles.smallButton, { borderColor: colors.border }]}
                          onPress={() => handleChangeEndorsementDiscount(endorsementDiscount - 0.5)}
                          activeOpacity={0.7}
                        >
                          <Minus size={14} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                        <Text style={[styles.counterValueSmall, { color: colors.primary }]}>
                          {endorsementDiscount.toFixed(1)}%
                        </Text>
                        <TouchableOpacity
                          style={[styles.smallButton, { borderColor: colors.border }]}
                          onPress={() => handleChangeEndorsementDiscount(endorsementDiscount + 0.5)}
                          activeOpacity={0.7}
                        >
                          <Plus size={14} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Minimum Days */}
                    <View style={styles.optionGroup}>
                      <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Min Days</Text>
                      <View style={styles.inlineCounter}>
                        <TouchableOpacity
                          style={[styles.smallButton, { borderColor: colors.border }]}
                          onPress={() => handleChangeEndorsementMinDays(endorsementMinDays - 1)}
                          activeOpacity={0.7}
                        >
                          <Minus size={14} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                        <Text style={[styles.counterValueSmall, { color: colors.primary }]}>
                          {endorsementMinDays}
                        </Text>
                        <TouchableOpacity
                          style={[styles.smallButton, { borderColor: colors.border }]}
                          onPress={() => handleChangeEndorsementMinDays(endorsementMinDays + 1)}
                          activeOpacity={0.7}
                        >
                          <Plus size={14} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* ROW 3: Follows Discount */}
              <View style={[styles.discountRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.discountRowHeaderWithToggle}>
                  <View style={styles.discountRowHeader}>
                    <Text style={[styles.discountRowTitle, { color: colors.text }]}>Follows</Text>
                    <Text style={[styles.discountRowDescription, { color: colors.textSecondary }]}>
                      Requires following your business
                    </Text>
                  </View>
                  <Switch
                    value={followsEnabled}
                    onValueChange={handleToggleFollows}
                    trackColor={{ false: '#D1D5DB', true: '#000000' }}
                    thumbColor='#FFFFFF'
                    ios_backgroundColor='#E5E7EB'
                  />
                </View>

                {followsEnabled && (
                  <View style={styles.expandedOptions}>
                    {/* Discount Percentage */}
                    <View style={styles.optionGroup}>
                      <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Discount</Text>
                      <View style={styles.inlineCounter}>
                        <TouchableOpacity
                          style={[styles.smallButton, { borderColor: colors.border }]}
                          onPress={() => handleChangeFollowsDiscount(followsDiscount - 0.5)}
                          activeOpacity={0.7}
                        >
                          <Minus size={14} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                        <Text style={[styles.counterValueSmall, { color: colors.primary }]}>
                          {followsDiscount.toFixed(1)}%
                        </Text>
                        <TouchableOpacity
                          style={[styles.smallButton, { borderColor: colors.border }]}
                          onPress={() => handleChangeFollowsDiscount(followsDiscount + 0.5)}
                          activeOpacity={0.7}
                        >
                          <Plus size={14} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Minimum Days */}
                    <View style={styles.optionGroup}>
                      <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Min Days</Text>
                      <View style={styles.inlineCounter}>
                        <TouchableOpacity
                          style={[styles.smallButton, { borderColor: colors.border }]}
                          onPress={() => handleChangeFollowsMinDays(followsMinDays - 1)}
                          activeOpacity={0.7}
                        >
                          <Minus size={14} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                        <Text style={[styles.counterValueSmall, { color: colors.primary }]}>
                          {followsMinDays}
                        </Text>
                        <TouchableOpacity
                          style={[styles.smallButton, { borderColor: colors.border }]}
                          onPress={() => handleChangeFollowsMinDays(followsMinDays + 1)}
                          activeOpacity={0.7}
                        >
                          <Plus size={14} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Upright Fee */}
              <View style={styles.feeRow}>
                <Text style={[styles.feeText, { color: colors.textSecondary }]}>
                  Upright Fee: 2.5% Fixed
                </Text>
              </View>

              {/* Custom Discount Button - at bottom */}
              <TouchableOpacity
                style={[styles.customDiscountButton, { borderColor: colors.border }]}
                onPress={() => setShowCustomInput(!showCustomInput)}
                activeOpacity={0.7}
              >
                <Text style={[styles.customDiscountButtonText, { color: colors.primary }]}>
                  {showCustomInput ? 'Hide Custom Discount' : 'Add Custom Discount'}
                </Text>
              </TouchableOpacity>

              {showCustomInput && (
                <View style={styles.customDiscountSection}>
                  <Text style={[styles.customDiscountLabel, { color: colors.textSecondary }]}>
                    Describe your custom discount structure
                  </Text>
                  <TextInput
                    style={[
                      styles.customDiscountInput,
                      { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }
                    ]}
                    placeholder="e.g., 15% off for veterans, 10% for students..."
                    placeholderTextColor={colors.textSecondary}
                    value={customDiscountText}
                    onChangeText={setCustomDiscountText}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={[styles.saveCustomButton, { backgroundColor: colors.primary }]}
                    onPress={handleSaveCustomDiscount}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.saveCustomButtonText, { color: colors.white }]}>
                      Submit Custom Discount
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  underlinedText: {
    textDecorationLine: 'underline',
    fontWeight: '600' as const,
  },
  // Discount Rows
  discountRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  discountRowHeader: {
    flex: 1,
  },
  discountRowHeaderWithToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountRowTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  discountRowDescription: {
    fontSize: 13,
  },
  inlineCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    minWidth: 70,
    textAlign: 'center',
  },
  counterValueSmall: {
    fontSize: 16,
    fontWeight: '700' as const,
    minWidth: 50,
    textAlign: 'center',
  },
  // Expanded Options
  expandedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  optionGroup: {
    minWidth: 100,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  dropdownList: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  // Fee Row
  feeRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  feeText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  // Custom Discount
  customDiscountButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  customDiscountButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  customDiscountSection: {
    marginTop: 16,
  },
  customDiscountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  customDiscountInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  saveCustomButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveCustomButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
