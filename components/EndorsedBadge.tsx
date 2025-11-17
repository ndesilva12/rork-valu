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
      container: { paddingHorizontal: 6, paddingVertical: 2 },
      text: { fontSize: 10 },
      icon: 12,
    },
    medium: {
      container: { paddingHorizontal: 8, paddingVertical: 4 },
      text: { fontSize: 11 },
      icon: 14,
    },
    large: {
      container: { paddingHorizontal: 10, paddingVertical: 5 },
      text: { fontSize: 12 },
      icon: 16,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[
      styles.badge,
      currentSize.container,
      { backgroundColor: colors.primary }
    ]}>
      <CheckCircle size={currentSize.icon} color={colors.white} strokeWidth={2.5} />
      <Text style={[
        styles.badgeText,
        currentSize.text,
        { color: colors.white }
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
