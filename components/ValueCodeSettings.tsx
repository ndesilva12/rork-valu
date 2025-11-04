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
import { Percent, Plus, Minus, Info, DollarSign, Heart } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function ValueCodeSettings() {
  const { isDarkMode, profile, setBusinessInfo } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const businessInfo = profile.businessInfo || {
    name: '',
    category: '',
    acceptsValueCodes: false,
    valueCodeDiscount: 10,
    customerDiscountPercent: 5,
    donationPercent: 2.5,
  };

  const VALU_APP_FEE = 2.5; // Fixed at 2.5%

  const [acceptsValueCodes, setAcceptsValueCodes] = useState(businessInfo.acceptsValueCodes);
  const [totalPercent, setTotalPercent] = useState(businessInfo.valueCodeDiscount || 10);
  const [customerDiscountPercent, setCustomerDiscountPercent] = useState(
    businessInfo.customerDiscountPercent || 5
  );
  const [inputValue, setInputValue] = useState((businessInfo.valueCodeDiscount || 10).toString());

  // Calculate donation percentage (total - customer discount - fee)
  const donationPercent = Math.max(0, totalPercent - customerDiscountPercent - VALU_APP_FEE);

  const handleToggleValueCodes = async (value: boolean) => {
    setAcceptsValueCodes(value);
    await setBusinessInfo({
      acceptsValueCodes: value,
    });

    if (value) {
      Alert.alert(
        'Value Codes Enabled',
        'Customers can now use their value codes at your business to receive a discount!',
        [{ text: 'Great!' }]
      );
    }
  };

  const handleSetTotal = async (percent: number) => {
    // Clamp between minimum (VALU_APP_FEE + 0.5) and 50
    const minPercent = VALU_APP_FEE + 0.5;
    const clampedPercent = Math.max(minPercent, Math.min(50, percent));
    // Round to nearest 0.5
    const roundedPercent = Math.round(clampedPercent * 2) / 2;

    setTotalPercent(roundedPercent);
    setInputValue(roundedPercent.toString());

    // Adjust customer discount if it exceeds the new total
    const maxCustomerDiscount = roundedPercent - VALU_APP_FEE;
    if (customerDiscountPercent > maxCustomerDiscount) {
      setCustomerDiscountPercent(Math.max(0, maxCustomerDiscount));
    }

    await setBusinessInfo({
      valueCodeDiscount: roundedPercent,
      customerDiscountPercent: Math.min(customerDiscountPercent, maxCustomerDiscount),
      donationPercent: Math.max(0, roundedPercent - Math.min(customerDiscountPercent, maxCustomerDiscount) - VALU_APP_FEE),
    });
  };

  const handleSetCustomerDiscount = async (percent: number) => {
    const maxDiscount = totalPercent - VALU_APP_FEE;
    const clampedPercent = Math.max(0, Math.min(maxDiscount, percent));
    const roundedPercent = Math.round(clampedPercent * 2) / 2;

    setCustomerDiscountPercent(roundedPercent);

    const newDonation = Math.max(0, totalPercent - roundedPercent - VALU_APP_FEE);

    await setBusinessInfo({
      customerDiscountPercent: roundedPercent,
      donationPercent: newDonation,
    });
  };

  const handleIncrement = () => {
    handleSetTotal(totalPercent + 0.5);
  };

  const handleDecrement = () => {
    handleSetTotal(totalPercent - 0.5);
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed >= VALU_APP_FEE + 0.5 && parsed <= 50) {
      handleSetTotal(parsed);
    }
  };

  const handleInputBlur = () => {
    // Reset to current valid value if input is invalid
    setInputValue(totalPercent.toString());
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Value Code Settings</Text>

      <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
        {/* Toggle Section */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Accept Value Codes
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Allow customers to use value codes for discounts at your business
            </Text>
          </View>
          <Switch
            value={acceptsValueCodes}
            onValueChange={handleToggleValueCodes}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {/* Discount Percentage (only show if accepting codes) */}
        {acceptsValueCodes && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.discountSection}>
              <View style={styles.discountHeader}>
                <Percent size={20} color={colors.text} strokeWidth={2} />
                <Text style={[styles.discountTitle, { color: colors.text }]}>
                  Total Value Code Commitment
                </Text>
              </View>
              <Text style={[styles.discountSubtitle, { color: colors.textSecondary }]}>
                Set your total percentage commitment ({VALU_APP_FEE + 0.5}% - 50%)
              </Text>

              {/* Percentage Input Controls */}
              <View style={styles.percentageControls}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    totalPercent <= VALU_APP_FEE + 0.5 && styles.controlButtonDisabled
                  ]}
                  onPress={handleDecrement}
                  disabled={totalPercent <= VALU_APP_FEE + 0.5}
                  activeOpacity={0.7}
                >
                  <Minus size={20} color={totalPercent <= VALU_APP_FEE + 0.5 ? colors.textSecondary : colors.text} strokeWidth={2} />
                </TouchableOpacity>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.percentInput, { color: colors.text, borderColor: colors.border }]}
                    value={inputValue}
                    onChangeText={handleInputChange}
                    onBlur={handleInputBlur}
                    keyboardType="decimal-pad"
                    maxLength={4}
                    selectTextOnFocus
                  />
                  <Text style={[styles.percentSymbol, { color: colors.text }]}>%</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    totalPercent >= 50 && styles.controlButtonDisabled
                  ]}
                  onPress={handleIncrement}
                  disabled={totalPercent >= 50}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color={totalPercent >= 50 ? colors.textSecondary : colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Customer Discount Slider */}
              <View style={styles.sliderSection}>
                <View style={styles.sliderHeader}>
                  <DollarSign size={18} color={colors.success} strokeWidth={2} />
                  <Text style={[styles.sliderLabel, { color: colors.text }]}>
                    Customer Discount
                  </Text>
                  <Text style={[styles.sliderValue, { color: colors.success }]}>
                    {customerDiscountPercent.toFixed(1)}%
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={totalPercent - VALU_APP_FEE}
                  value={customerDiscountPercent}
                  onValueChange={(value) => setCustomerDiscountPercent(Math.round(value * 2) / 2)}
                  onSlidingComplete={handleSetCustomerDiscount}
                  minimumTrackTintColor={colors.success}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.success}
                  step={0.5}
                />
              </View>

              {/* Split Breakdown */}
              <View style={[styles.splitExplanation, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                <View style={styles.splitHeader}>
                  <Info size={16} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.splitTitle, { color: colors.text }]}>
                    How the {totalPercent}% is split:
                  </Text>
                </View>
                <View style={styles.splitBreakdown}>
                  <View style={styles.splitRow}>
                    <View style={styles.splitLabelContainer}>
                      <DollarSign size={14} color={colors.success} strokeWidth={2} />
                      <Text style={[styles.splitLabel, { color: colors.textSecondary }]}>
                        Customer Discount:
                      </Text>
                    </View>
                    <Text style={[styles.splitValue, { color: colors.success }]}>
                      {customerDiscountPercent.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.splitRow}>
                    <View style={styles.splitLabelContainer}>
                      <Percent size={14} color={colors.primary} strokeWidth={2} />
                      <Text style={[styles.splitLabel, { color: colors.textSecondary }]}>
                        Valu App Fee:
                      </Text>
                    </View>
                    <Text style={[styles.splitValue, { color: colors.primary }]}>
                      {VALU_APP_FEE.toFixed(1)}% (fixed)
                    </Text>
                  </View>
                  <View style={styles.splitRow}>
                    <View style={styles.splitLabelContainer}>
                      <Heart size={14} color={colors.danger} strokeWidth={2} />
                      <Text style={[styles.splitLabel, { color: colors.textSecondary }]}>
                        Donation:
                      </Text>
                    </View>
                    <Text style={[styles.splitValue, { color: colors.danger }]}>
                      {donationPercent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />
                <Text style={[styles.splitExample, { color: colors.textSecondary }]}>
                  Example: $100 purchase = ${customerDiscountPercent.toFixed(2)} customer saves + ${VALU_APP_FEE.toFixed(2)} to Valu + ${donationPercent.toFixed(2)} donated
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            How Value Codes Work
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Customers show their unique value code at checkout{'\n'}
            • You apply the discount to their purchase{'\n'}
            • Valu charges a small fee to maintain the platform{'\n'}
            • The remainder goes to charity on the customer's behalf{'\n'}
            • Track customer demographics and values in your Data tab
          </Text>
        </View>
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
  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  // Discount Section
  discountSection: {
    marginBottom: 20,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  discountSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  // Percentage Controls
  percentageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentInput: {
    fontSize: 36,
    fontWeight: '700' as const,
    textAlign: 'center',
    minWidth: 80,
    borderBottomWidth: 2,
    paddingVertical: 4,
  },
  percentSymbol: {
    fontSize: 28,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  // Slider Section
  sliderSection: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  // Split Explanation
  splitExplanation: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  splitTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  splitBreakdown: {
    gap: 8,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  splitLabel: {
    fontSize: 13,
  },
  splitValue: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  splitExample: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  // Info Box
  infoBox: {
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
