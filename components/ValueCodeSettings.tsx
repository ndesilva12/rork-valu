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
import { Plus, Minus } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function ValueCodeSettings() {
  const { isDarkMode, profile, setBusinessInfo } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const businessInfo = profile.businessInfo || {
    name: '',
    category: '',
    acceptsStandDiscounts: false,
    acceptsQRCode: true,
    acceptsValueCode: true,
    valueCodeDiscount: 10,
    customerDiscountPercent: 5,
    customDiscount: '',
  };

  const [acceptsDiscounts, setAcceptsDiscounts] = useState(
    businessInfo.acceptsStandDiscounts ?? businessInfo.acceptsValueCodes ?? false
  );
  const [discountType, setDiscountType] = useState<'preset' | 'custom'>('preset');
  const [customerDiscount, setCustomerDiscount] = useState(businessInfo.customerDiscountPercent || 5);
  const [customDiscountText, setCustomDiscountText] = useState(businessInfo.customDiscount || '');
  const [requireFollow, setRequireFollow] = useState(businessInfo.requireFollow || false);
  const [requireEndorse, setRequireEndorse] = useState(businessInfo.requireEndorse || false);

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

  const handleChangeCustomerDiscount = async (newCustomer: number) => {
    const clampedCustomer = Math.max(0, Math.min(50, newCustomer));
    setCustomerDiscount(clampedCustomer);
    await setBusinessInfo({
      customerDiscountPercent: clampedCustomer,
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
  };

  const handleToggleRequireFollow = async (value: boolean) => {
    setRequireFollow(value);
    await setBusinessInfo({
      requireFollow: value,
    });
  };

  const handleToggleRequireEndorse = async (value: boolean) => {
    setRequireEndorse(value);
    await setBusinessInfo({
      requireEndorse: value,
    });
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
                <Text style={styles.underlinedText}>When you accept discounts, you get invaluable insights about what your customers believe.</Text> Find out: ideologies, causes, social issues, interests, celebrity sentiments, religions, etc. These are deep connections to your customers that you cannot find anywhere else.
              </Text>
            </View>
          )}

        {acceptsDiscounts && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Discount Type Selection */}
            <View style={styles.discountTypeSection}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>Set Your Discount</Text>
              <View style={styles.discountTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    discountType === 'preset' && { borderColor: colors.primary }
                  ]}
                  onPress={() => setDiscountType('preset')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.typeButtonText,
                    { color: discountType === 'preset' ? colors.primary : colors.text }
                  ]}>
                    Preset Discount
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    discountType === 'custom' && { borderColor: colors.primary }
                  ]}
                  onPress={() => setDiscountType('custom')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.typeButtonText,
                    { color: discountType === 'custom' ? colors.primary : colors.text }
                  ]}>
                    Custom Discount
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {discountType === 'preset' ? (
              <>
                {/* Customer Discount Counter with buttons on left/right */}
                <View style={styles.singleCounterRow}>
                  <TouchableOpacity
                    style={[styles.sideButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                    onPress={() => handleChangeCustomerDiscount(customerDiscount - 0.5)}
                    activeOpacity={0.7}
                  >
                    <Minus size={24} color={colors.text} strokeWidth={2} />
                  </TouchableOpacity>

                  <View style={[styles.centerCounter, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.smallCounterLabel, { color: colors.textSecondary }]}>Customer %</Text>
                    <Text style={[styles.largeCounterValue, { color: colors.primary }]}>
                      {customerDiscount.toFixed(1)}%
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.sideButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                    onPress={() => handleChangeCustomerDiscount(customerDiscount + 0.5)}
                    activeOpacity={0.7}
                  >
                    <Plus size={24} color={colors.text} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* Upright Fee text */}
                <View style={styles.standFeeTextContainer}>
                  <Text style={[styles.standFeeText, { color: colors.textSecondary }]}>
                    Upright Fee: 2.5% Fixed
                  </Text>
                </View>

                {/* Discount Requirements */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.subsectionTitle, { color: colors.text }]}>Discount Requirements</Text>
                <Text style={[styles.requirementsHelpText, { color: colors.textSecondary }]}>
                  Choose which actions customers must take to receive the discount
                </Text>

                {/* Require Follow Toggle */}
                <View style={styles.requirementRow}>
                  <View style={styles.requirementText}>
                    <Text style={[styles.requirementLabel, { color: colors.text }]}>Require Follow</Text>
                    <Text style={[styles.requirementDescription, { color: colors.textSecondary }]}>
                      Customer must follow your business
                    </Text>
                  </View>
                  <Switch
                    value={requireFollow}
                    onValueChange={handleToggleRequireFollow}
                    trackColor={{ false: '#D1D5DB', true: '#000000' }}
                    thumbColor='#FFFFFF'
                    ios_backgroundColor='#E5E7EB'
                  />
                </View>

                {/* Require Endorse Toggle */}
                <View style={styles.requirementRow}>
                  <View style={styles.requirementText}>
                    <Text style={[styles.requirementLabel, { color: colors.text }]}>Require Endorse</Text>
                    <Text style={[styles.requirementDescription, { color: colors.textSecondary }]}>
                      Customer must endorse your business
                    </Text>
                  </View>
                  <Switch
                    value={requireEndorse}
                    onValueChange={handleToggleRequireEndorse}
                    trackColor={{ false: '#D1D5DB', true: '#000000' }}
                    thumbColor='#FFFFFF'
                    ios_backgroundColor='#E5E7EB'
                  />
                </View>
              </>
            ) : (
              /* Custom Discount Input */
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
                <Text style={[styles.customDiscountNote, { color: colors.textSecondary }]}>
                  Note: We will reach out to you to confirm and approve your custom discount.
                </Text>
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
  // Discount Type Selection
  discountTypeSection: {
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  discountTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  // Main Counter (Total Discount)
  mainCounter: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  counterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    minWidth: 120,
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 48,
    fontWeight: '700' as const,
  },
  // Upright Fee Text
  standFeeTextContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  standFeeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  // Single Counter Row with buttons on sides
  singleCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCounter: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
  },
  smallCounterLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  largeCounterValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  // Custom Discount Section
  customDiscountSection: {
    marginTop: 12,
  },
  customDiscountLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  customDiscountInput: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 12,
  },
  customDiscountNote: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    marginBottom: 16,
    lineHeight: 18,
  },
  saveCustomButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveCustomButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  infoBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
  },
  underlinedText: {
    textDecorationLine: 'underline' as const,
  },
  // Requirement Toggles
  requirementsHelpText: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  requirementText: {
    flex: 1,
  },
  requirementLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  requirementDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
