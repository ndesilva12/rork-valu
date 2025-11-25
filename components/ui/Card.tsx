/**
 * Card Component
 * Consistent container with elevation and styling
 */
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { spacing, borderRadius, shadows } from '@/constants/designTokens';

type CardVariant = 'elevated' | 'outlined' | 'filled';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  isDarkMode?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  activeOpacity?: number;
}

export default function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  isDarkMode = false,
  onPress,
  style,
  activeOpacity = 0.7,
}: CardProps) {
  const colors = isDarkMode ? darkColors : lightColors;

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.background,
          ...Platform.select({
            ios: shadows.md,
            android: { elevation: shadows.md.elevation },
            web: {
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            },
          }),
        };
      case 'outlined':
        return {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.backgroundSecondary,
        };
      default:
        return {};
    }
  };

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: spacing.sm };
      case 'md':
        return { padding: spacing.lg };
      case 'lg':
        return { padding: spacing.xl };
      default:
        return {};
    }
  };

  const cardStyles = [
    styles.container,
    getVariantStyles(),
    getPaddingStyles(),
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={cardStyles}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});
