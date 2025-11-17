/**
 * Endorsed Badge Component
 * Shows an "ENDORSED" badge for endorsement lists with a verified icon
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';

interface EndorsedBadgeProps {
  isDarkMode?: boolean;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function EndorsedBadge({ isDarkMode = false, size = 'medium', showText = true }: EndorsedBadgeProps) {
  const colors = isDarkMode ? darkColors : lightColors;

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 6, paddingVertical: 3, gap: 4 },
      icon: 12,
      text: { fontSize: 11 },
    },
    medium: {
      container: { paddingHorizontal: 8, paddingVertical: 4, gap: 5 },
      icon: 14,
      text: { fontSize: 12 },
    },
    large: {
      container: { paddingHorizontal: 10, paddingVertical: 5, gap: 6 },
      icon: 16,
      text: { fontSize: 13 },
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[
      styles.badge,
      currentSize.container,
      {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      }
    ]}>
      <Shield size={currentSize.icon} color={colors.white} strokeWidth={2.5} fill={colors.white} />
      {showText && (
        <Text style={[
          styles.badgeText,
          currentSize.text,
          { color: colors.white }
        ]}>
          ENDORSED
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
