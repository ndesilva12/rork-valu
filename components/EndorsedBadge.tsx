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
      container: { width: 18, height: 18 },
      icon: 10,
    },
    medium: {
      container: { width: 22, height: 22 },
      icon: 13,
    },
    large: {
      container: { width: 26, height: 26 },
      icon: 15,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[
      styles.badge,
      currentSize.container,
      {
        backgroundColor: colors.primary,
      }
    ]}>
      <CheckCircle size={currentSize.icon} color={colors.white} strokeWidth={2.5} fill={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    // Star/badge shape with 8 points
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
