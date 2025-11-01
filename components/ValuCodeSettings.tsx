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
import { Percent, Plus, Minus, Info } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function ValuCodeSettings() {
  const { isDarkMode, profile, setBusinessInfo } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const businessInfo = profile.businessInfo || {
    name: '',
    category: '',
    acceptsValuCodes: false,
    valuCodeDiscount: 10,
  };

  const [acceptsValuCodes, setAcceptsValuCodes] = useState(businessInfo.acceptsValuCodes);
  const [discountPercent, setDiscountPercent] = useState(businessInfo.valuCodeDiscount || 10);
  const [inputValue, setInputValue] = useState((businessInfo.valuCodeDiscount || 10).toString());

  const handleToggleValuCodes = async (value: boolean) => {
    setAcceptsValuCodes(value);
    await setBusinessInfo({
      acceptsValuCodes: value,
    });

    if (value) {
      Alert.alert(
        'Valu Codes Enabled',
        'Customers can now use their valu codes at your business to receive a discount!',
        [{ text: 'Great!' }]
      );
    }
  };

  const handleSetDiscount = async (percent: number) => {
    // Clamp between 1 and 50
    const clampedPercent = Math.max(1, Math.min(50, percent));
    // Round to nearest 0.5
    const roundedPercent = Math.round(clampedPercent * 2) / 2;

    setDiscountPercent(roundedPercent);
    setInputValue(roundedPercent.toString());
    await setBusinessInfo({
      valuCodeDiscount: roundedPercent,
    });
  };

  const handleIncrement = () => {
    handleSetDiscount(discountPercent + 0.5);
  };

  const handleDecrement = () => {
    handleSetDiscount(discountPercent - 0.5);
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
      handleSetDiscount(parsed);
    }
  };

  const handleInputBlur = () => {
    // Reset to current valid value if input is invalid
    setInputValue(discountPercent.toString());
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Valu Code Settings</Text>

      <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
        {/* Toggle Section */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Accept Valu Codes
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Allow customers to use valu codes for discounts at your business
            </Text>
          </View>
          <Switch
            value={acceptsValuCodes}
            onValueChange={handleToggleValuCodes}
            trackColor={{ false: colors.border, true: colors.primary + '60' }}
            thumbColor={acceptsValuCodes ? colors.primary : colors.textSecondary}
          />
        </View>

        {/* Discount Percentage (only show if accepting codes) */}
        {acceptsValuCodes && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.discountSection}>
              <View style={styles.discountHeader}>
                <Percent size={20} color={colors.text} strokeWidth={2} />
                <Text style={[styles.discountTitle, { color: colors.text }]}>
                  Valu Code Percentage
                </Text>
              </View>
              <Text style={[styles.discountSubtitle, { color: colors.textSecondary }]}>
                Choose the percentage for valu code transactions (1% - 50%)
              </Text>

              {/* Percentage Input Controls */}
              <View style={styles.percentageControls}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    discountPercent <= 1 && styles.controlButtonDisabled
                  ]}
                  onPress={handleDecrement}
                  disabled={discountPercent <= 1}
                  activeOpacity={0.7}
                >
                  <Minus size={20} color={discountPercent <= 1 ? colors.textSecondary : colors.text} strokeWidth={2} />
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
                    discountPercent >= 50 && styles.controlButtonDisabled
                  ]}
                  onPress={handleIncrement}
                  disabled={discountPercent >= 50}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color={discountPercent >= 50 ? colors.textSecondary : colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Split Explanation */}
              <View style={[styles.splitExplanation, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                <View style={styles.splitHeader}>
                  <Info size={16} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.splitTitle, { color: colors.text }]}>
                    How the {discountPercent}% is split:
                  </Text>
                </View>
                <View style={styles.splitBreakdown}>
                  <View style={styles.splitRow}>
                    <Text style={[styles.splitLabel, { color: colors.textSecondary }]}>
                      Customer Discount:
                    </Text>
                    <Text style={[styles.splitValue, { color: colors.primary }]}>
                      {(discountPercent / 2).toFixed(2)}%
                    </Text>
                  </View>
                  <View style={styles.splitRow}>
                    <Text style={[styles.splitLabel, { color: colors.textSecondary }]}>
                      Paid to Valu:
                    </Text>
                    <Text style={[styles.splitValue, { color: colors.primary }]}>
                      {(discountPercent / 2).toFixed(2)}%
                    </Text>
                  </View>
                </View>
                <Text style={[styles.splitExample, { color: colors.textSecondary }]}>
                  Example: $100 purchase = ${(discountPercent / 2).toFixed(2)} customer discount + ${(discountPercent / 2).toFixed(2)} to Valu
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            How Valu Codes Work
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Customers show their unique valu code at checkout{'\n'}
            • You apply the selected discount to their purchase{'\n'}
            • Track customer demographics and values in your Data tab{'\n'}
            • Build loyalty with value-aligned customers
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
    marginBottom: 20,
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
  // Split Explanation
  splitExplanation: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
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
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitLabel: {
    fontSize: 13,
  },
  splitValue: {
    fontSize: 16,
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
