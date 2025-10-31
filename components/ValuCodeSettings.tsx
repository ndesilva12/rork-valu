import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Percent } from 'lucide-react-native';
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

  const discountOptions = [5, 10, 15, 20, 25];

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
    setDiscountPercent(percent);
    await setBusinessInfo({
      valuCodeDiscount: percent,
    });
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
                  Discount Percentage
                </Text>
              </View>
              <Text style={[styles.discountSubtitle, { color: colors.textSecondary }]}>
                Choose the discount percentage for valu code users
              </Text>

              {/* Discount Options */}
              <View style={styles.discountOptions}>
                {discountOptions.map((percent) => (
                  <TouchableOpacity
                    key={percent}
                    style={[
                      styles.discountOption,
                      {
                        backgroundColor: colors.background,
                        borderColor: discountPercent === percent ? colors.primary : colors.border,
                        borderWidth: discountPercent === percent ? 2 : 1,
                      }
                    ]}
                    onPress={() => handleSetDiscount(percent)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.discountOptionText,
                      {
                        color: discountPercent === percent ? colors.primary : colors.text,
                        fontWeight: discountPercent === percent ? '700' : '600',
                      }
                    ]}>
                      {percent}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selected Discount Display */}
              <View style={[styles.selectedDiscountBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <Text style={[styles.selectedDiscountLabel, { color: colors.textSecondary }]}>
                  Current Discount
                </Text>
                <Text style={[styles.selectedDiscountValue, { color: colors.primary }]}>
                  {discountPercent}% off
                </Text>
                <Text style={[styles.selectedDiscountDescription, { color: colors.textSecondary }]}>
                  Customers with valu codes save {discountPercent}% on purchases
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
  discountOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  discountOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  discountOptionText: {
    fontSize: 18,
  },
  // Selected Discount Display
  selectedDiscountBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  selectedDiscountLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  selectedDiscountValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  selectedDiscountDescription: {
    fontSize: 13,
    textAlign: 'center',
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
