/**
 * Endorsed Badge Component
 * Shows an "ENDORSED" badge for endorsement lists
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';

interface EndorsedBadgeProps {
  isDarkMode?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function EndorsedBadge({ isDarkMode = false, size = 'medium' }: EndorsedBadgeProps) {
  const colors = isDarkMode ? darkColors : lightColors;

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 8, paddingVertical: 3 },
      text: { fontSize: 12 },
      icon: 14,
    },
    medium: {
      container: { paddingHorizontal: 10, paddingVertical: 4 },
      text: { fontSize: 13 },
      icon: 16,
    },
    large: {
      container: { paddingHorizontal: 12, paddingVertical: 5 },
      text: { fontSize: 14 },
      icon: 18,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[
      styles.badge,
      currentSize.container,
      {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary
      }
    ]}>
      <CheckCircle size={currentSize.icon} color={colors.primary} strokeWidth={2.5} />
      <Text style={[
        styles.badgeText,
        currentSize.text,
        { color: colors.primary }
      ]}>
        ENDORSED
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
