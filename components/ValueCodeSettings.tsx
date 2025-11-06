import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function ValueCodeSettings() {
  const { isDarkMode, profile, setBusinessInfo } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const businessInfo = profile.businessInfo || {
    name: '',
    category: '',
    acceptsStandDiscounts: false,
    acceptsQRCode: true,
    acceptsValueCode: true,
    valueCodeDiscount: 10,
    customerDiscountPercent: 5,
    donationPercent: 2.5,
    customDiscount: '',
  };

  const STAND_FEE = 2.5; // Fixed at 2.5%

  const [acceptsDiscounts, setAcceptsDiscounts] = useState(
    businessInfo.acceptsStandDiscounts ?? businessInfo.acceptsValueCodes ?? false
  );
  const [acceptsQRCode, setAcceptsQRCode] = useState(businessInfo.acceptsQRCode ?? true);
  const [acceptsPromoCode, setAcceptsPromoCode] = useState(businessInfo.acceptsValueCode ?? true);
  const [discountType, setDiscountType] = useState<'preset' | 'custom'>('preset');
  const [totalDiscount, setTotalDiscount] = useState(businessInfo.valueCodeDiscount || 10);
  const [customerDiscount, setCustomerDiscount] = useState(businessInfo.customerDiscountPercent || 5);
  const [customDiscountText, setCustomDiscountText] = useState(businessInfo.customDiscount || '');

  // Calculate donation automatically (total - customer - stand fee)
  const donationDiscount = Math.max(0, totalDiscount - customerDiscount - STAND_FEE);

  const handleToggleDiscounts = async (value: boolean) => {
    setAcceptsDiscounts(value);
    await setBusinessInfo({
      acceptsStandDiscounts: value,
    });

    if (value) {
      Alert.alert(
        'Discounts Enabled',
        'Customers can now use Stand to receive discounts at your business!',
        [{ text: 'Great!' }]
      );
    }
  };

  const handleToggleQRCode = async (value: boolean) => {
    if (!value && !acceptsPromoCode) {
      Alert.alert('Error', 'You must accept at least one method');
      return;
    }
    setAcceptsQRCode(value);
    await setBusinessInfo({ acceptsQRCode: value });
  };

  const handleTogglePromoCode = async (value: boolean) => {
    if (!value && !acceptsQRCode) {
      Alert.alert('Error', 'You must accept at least one method');
      return;
    }
    setAcceptsPromoCode(value);
    await setBusinessInfo({ acceptsValueCode: value });
  };

  const handleChangeTotalDiscount = async (newTotal: number) => {
    const minTotal = STAND_FEE + 0.5;
    const maxTotal = 50;
    const clampedTotal = Math.max(minTotal, Math.min(maxTotal, newTotal));

    setTotalDiscount(clampedTotal);

    // Adjust customer discount if it exceeds available amount
    const maxCustomer = clampedTotal - STAND_FEE;
    if (customerDiscount > maxCustomer) {
      setCustomerDiscount(maxCustomer);
      await setBusinessInfo({
        valueCodeDiscount: clampedTotal,
        customerDiscountPercent: maxCustomer,
        donationPercent: 0,
      });
    } else {
      const newDonation = clampedTotal - customerDiscount - STAND_FEE;
      await setBusinessInfo({
        valueCodeDiscount: clampedTotal,
        donationPercent: Math.max(0, newDonation),
      });
    }
  };

  const handleChangeCustomerDiscount = async (newCustomer: number) => {
    const maxCustomer = totalDiscount - STAND_FEE;
    const clampedCustomer = Math.max(0, Math.min(maxCustomer, newCustomer));

    setCustomerDiscount(clampedCustomer);

    const newDonation = totalDiscount - clampedCustomer - STAND_FEE;
    await setBusinessInfo({
      customerDiscountPercent: clampedCustomer,
      donationPercent: Math.max(0, newDonation),
    });
  };

  const handleChangeDonationDiscount = async (newDonation: number) => {
    const maxDonation = totalDiscount - STAND_FEE;
    const clampedDonation = Math.max(0, Math.min(maxDonation, newDonation));

    // Calculate customer discount as remainder
    const newCustomer = totalDiscount - clampedDonation - STAND_FEE;
    setCustomerDiscount(Math.max(0, newCustomer));

    await setBusinessInfo({
      customerDiscountPercent: Math.max(0, newCustomer),
      donationPercent: clampedDonation,
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

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Stand Discount Settings</Text>

      <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
        {/* Main Toggle */}
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Accept Discounts</Text>
          <Switch
            value={acceptsDiscounts}
            onValueChange={handleToggleDiscounts}
            trackColor={{ false: colors.border, true: colors.border }}
            thumbColor={colors.white}
          />
        </View>

        {acceptsDiscounts && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* QR Codes & Promo Codes - One Line */}
            <View style={styles.compactRow}>
              <View style={styles.compactItem}>
                <Text style={[styles.compactLabel, { color: colors.text }]}>QR Codes</Text>
                <Switch
                  value={acceptsQRCode}
                  onValueChange={handleToggleQRCode}
                  trackColor={{ false: colors.border, true: colors.border }}
                  thumbColor={colors.white}
                />
              </View>
              <View style={styles.compactItem}>
                <Text style={[styles.compactLabel, { color: colors.text }]}>Promo Codes</Text>
                <Switch
                  value={acceptsPromoCode}
                  onValueChange={handleTogglePromoCode}
                  trackColor={{ false: colors.border, true: colors.border }}
                  thumbColor={colors.white}
                />
              </View>
            </View>

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
                {/* Total Discount - Big Counter */}
                <View style={styles.mainCounter}>
                  <Text style={[styles.counterLabel, { color: colors.textSecondary }]}>Total Discount</Text>
                  <View style={styles.counterControls}>
                    <TouchableOpacity
                      style={[styles.counterButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => handleChangeTotalDiscount(totalDiscount - 0.5)}
                      activeOpacity={0.7}
                    >
                      <Minus size={24} color={colors.text} strokeWidth={2} />
                    </TouchableOpacity>
                    <View style={styles.counterValue}>
                      <Text style={[styles.counterNumber, { color: colors.primary }]}>
                        {totalDiscount.toFixed(1)}%
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.counterButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => handleChangeTotalDiscount(totalDiscount + 0.5)}
                      activeOpacity={0.7}
                    >
                      <Plus size={24} color={colors.text} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Three Small Counters */}
                <View style={styles.smallCountersGrid}>
                  {/* Customer Discount */}
                  <View style={[styles.smallCounter, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.smallCounterLabel, { color: colors.textSecondary }]}>Customer %</Text>
                    <View style={styles.smallCounterControls}>
                      <TouchableOpacity
                        style={styles.smallCounterButton}
                        onPress={() => handleChangeCustomerDiscount(customerDiscount - 0.5)}
                        activeOpacity={0.7}
                      >
                        <Minus size={16} color={colors.text} strokeWidth={2} />
                      </TouchableOpacity>
                      <Text style={[styles.smallCounterValue, { color: colors.text }]}>
                        {customerDiscount.toFixed(1)}%
                      </Text>
                      <TouchableOpacity
                        style={styles.smallCounterButton}
                        onPress={() => handleChangeCustomerDiscount(customerDiscount + 0.5)}
                        activeOpacity={0.7}
                      >
                        <Plus size={16} color={colors.text} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Donation */}
                  <View style={[styles.smallCounter, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.smallCounterLabel, { color: colors.textSecondary }]}>Donation %</Text>
                    <View style={styles.smallCounterControls}>
                      <TouchableOpacity
                        style={styles.smallCounterButton}
                        onPress={() => handleChangeDonationDiscount(donationDiscount - 0.5)}
                        activeOpacity={0.7}
                      >
                        <Minus size={16} color={colors.text} strokeWidth={2} />
                      </TouchableOpacity>
                      <Text style={[styles.smallCounterValue, { color: colors.text }]}>
                        {donationDiscount.toFixed(1)}%
                      </Text>
                      <TouchableOpacity
                        style={styles.smallCounterButton}
                        onPress={() => handleChangeDonationDiscount(donationDiscount + 0.5)}
                        activeOpacity={0.7}
                      >
                        <Plus size={16} color={colors.text} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Stand Fee - Fixed */}
                  <View style={[styles.smallCounter, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.smallCounterLabel, { color: colors.textSecondary }]}>Stand Fee %</Text>
                    <View style={styles.smallCounterControls}>
                      <Text style={[styles.smallCounterValue, styles.fixedValue, { color: colors.textSecondary }]}>
                        {STAND_FEE.toFixed(1)}%
                      </Text>
                      <Text style={[styles.fixedLabel, { color: colors.textSecondary }]}>(fixed)</Text>
                    </View>
                  </View>
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
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  // Compact Row for QR & Promo Codes
  compactRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  compactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  // Discount Type Selection
  discountTypeSection: {
    marginBottom: 20,
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
  // Small Counters Grid
  smallCountersGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  smallCounter: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
  },
  smallCounterLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  smallCounterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallCounterButton: {
    padding: 4,
  },
  smallCounterValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    minWidth: 50,
    textAlign: 'center' as const,
  },
  fixedValue: {
    minWidth: 'auto',
  },
  fixedLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  // Custom Discount Section
  customDiscountSection: {
    marginTop: 20,
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
});
