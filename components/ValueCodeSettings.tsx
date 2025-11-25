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

  // Discount percentage
  const [discountPercent, setDiscountPercent] = useState(businessInfo.customerDiscountPercent || 5);

  // Endorsement settings
  const [endorsementEnabled, setEndorsementEnabled] = useState(businessInfo.endorsementEnabled || false);
  const [endorsementType, setEndorsementType] = useState<EndorsementType>(businessInfo.endorsementType || 'any');
  const [endorsementMinDays, setEndorsementMinDays] = useState(businessInfo.endorsementMinDays || 0);
  const [showEndorsementTypeDropdown, setShowEndorsementTypeDropdown] = useState(false);

  // Endorsement discount percentage (must be >= base discount)
  const [endorsementDiscountPercent, setEndorsementDiscountPercent] = useState(
    businessInfo.endorsementDiscountPercent || businessInfo.customerDiscountPercent || 5
  );

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
        'Customers can now use iEndorse to receive discounts at your business!',
        [{ text: 'Great!' }]
      );
    }
  };

  const handleChangeDiscountPercent = async (newValue: number) => {
    const clamped = Math.max(0, Math.min(50, newValue));
    setDiscountPercent(clamped);
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

  const handleChangeEndorsementMinDays = async (newDays: number) => {
    const clamped = Math.max(0, Math.min(365, newDays));
    setEndorsementMinDays(clamped);
    await setBusinessInfo({
      endorsementMinDays: clamped,
    });
  };

  const handleChangeEndorsementDiscountPercent = async (newValue: number) => {
    // Endorsement discount must be >= base discount
    const clamped = Math.max(discountPercent, Math.min(50, newValue));
    setEndorsementDiscountPercent(clamped);
    await setBusinessInfo({
      endorsementDiscountPercent: clamped,
    });
  };

  const handleCustomDiscountChange = async (text: string) => {
    setCustomDiscountText(text);
    await setBusinessInfo({
      customDiscount: text,
    });
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

              {/* ROW 1: All User Discount */}
              <View style={[styles.discountRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.rowContentCentered}>
                  <Text style={[styles.discountRowTitle, { color: colors.text }]}>All User Discount</Text>
                  <View style={styles.inlineCounter}>
                    <TouchableOpacity
                      style={[styles.smallButton, { borderColor: colors.border }]}
                      onPress={() => handleChangeDiscountPercent(discountPercent - 0.5)}
                      activeOpacity={0.7}
                    >
                      <Minus size={16} color={colors.text} strokeWidth={2} />
                    </TouchableOpacity>
                    <Text style={[styles.counterValue, { color: colors.primary }]}>
                      {discountPercent.toFixed(1)}%
                    </Text>
                    <TouchableOpacity
                      style={[styles.smallButton, { borderColor: colors.border }]}
                      onPress={() => handleChangeDiscountPercent(discountPercent + 0.5)}
                      activeOpacity={0.7}
                    >
                      <Plus size={16} color={colors.text} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Requirements Section Title */}
              <Text style={[styles.requirementsTitle, { color: colors.textSecondary }]}>
                Requirements (optional)
              </Text>

              {/* ROW 2: Endorsement */}
              <View style={[styles.discountRow, { backgroundColor: colors.background, borderColor: colors.border, zIndex: showEndorsementTypeDropdown ? 1000 : 1 }]}>
                <View style={styles.rowContentSpaced}>
                  <Text style={[styles.discountRowTitle, { color: colors.text }]}>Endorsement</Text>
                  <Switch
                    value={endorsementEnabled}
                    onValueChange={handleToggleEndorsement}
                    trackColor={{ false: '#D1D5DB', true: '#000000' }}
                    thumbColor='#FFFFFF'
                    ios_backgroundColor='#E5E7EB'
                  />
                </View>

                {endorsementEnabled && (
                  <>
                    {/* Endorsement Discount Percentage */}
                    <View style={[styles.endorsementDiscountRow, { borderTopColor: colors.border }]}>
                      <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Discount</Text>
                      <View style={styles.inlineCounter}>
                        <TouchableOpacity
                          style={[styles.smallButton, { borderColor: colors.border }]}
                          onPress={() => handleChangeEndorsementDiscountPercent(endorsementDiscountPercent - 0.5)}
                          activeOpacity={0.7}
                        >
                          <Minus size={16} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                        <Text style={[styles.counterValue, { color: colors.primary }]}>
                          {endorsementDiscountPercent.toFixed(1)}%
                        </Text>
                        <TouchableOpacity
                          style={[styles.smallButton, { borderColor: colors.border }]}
                          onPress={() => handleChangeEndorsementDiscountPercent(endorsementDiscountPercent + 0.5)}
                          activeOpacity={0.7}
                        >
                          <Plus size={16} color={colors.text} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.expandedOptionsSpaced}>
                      {/* Type Dropdown */}
                      <View style={[styles.optionGroupCentered, { zIndex: 1000 }]}>
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

                      {/* Minimum Days */}
                      <View style={styles.optionGroupCentered}>
                        <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Min Days</Text>
                        <View style={styles.inlineCounterSmall}>
                          <TouchableOpacity
                            style={[styles.smallButtonCompact, { borderColor: colors.border }]}
                            onPress={() => handleChangeEndorsementMinDays(endorsementMinDays - 1)}
                            activeOpacity={0.7}
                          >
                            <Minus size={14} color={colors.text} strokeWidth={2} />
                          </TouchableOpacity>
                          <Text style={[styles.counterValueSmall, { color: colors.primary }]}>
                            {endorsementMinDays}
                          </Text>
                          <TouchableOpacity
                            style={[styles.smallButtonCompact, { borderColor: colors.border }]}
                            onPress={() => handleChangeEndorsementMinDays(endorsementMinDays + 1)}
                            activeOpacity={0.7}
                          >
                            <Plus size={14} color={colors.text} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* iEndorse Fee */}
              <View style={styles.feeRow}>
                <Text style={[styles.feeText, { color: colors.textSecondary }]}>
                  iEndorse Fee: 2.5% Fixed
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
                    onChangeText={handleCustomDiscountChange}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
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
  // Requirements Title
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 4,
  },
  // Discount Rows
  discountRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  endorsementDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  rowContentCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowContentSpaced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountRowTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  inlineCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineCounterSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonCompact: {
    width: 28,
    height: 28,
    borderRadius: 6,
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
    minWidth: 40,
    textAlign: 'center',
  },
  // Expanded Options
  expandedOptionsSpaced: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  expandedOptionsCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  optionGroupCentered: {
    alignItems: 'center',
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
});
