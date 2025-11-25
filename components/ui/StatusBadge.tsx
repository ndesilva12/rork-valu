/**
 * StatusBadge Component
 * Visual indicator for status, labels, and tags
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '@/constants/designTokens';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  isDarkMode?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  dot?: boolean;
}

export default function StatusBadge({
  label,
  variant = 'neutral',
  size = 'md',
  isDarkMode = false,
  style,
  textStyle,
  dot = false,
}: StatusBadgeProps) {
  const colors = isDarkMode ? darkColors : lightColors;

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; dotColor: string } => {
    switch (variant) {
      case 'success':
        return {
          container: {
            backgroundColor: isDarkMode ? 'rgba(30, 136, 229, 0.2)' : colors.successLight,
          },
          text: {
            color: colors.success,
          },
          dotColor: colors.success,
        };
      case 'danger':
        return {
          container: {
            backgroundColor: isDarkMode ? 'rgba(255, 31, 122, 0.2)' : colors.dangerLight,
          },
          text: {
            color: colors.danger,
          },
          dotColor: colors.danger,
        };
      case 'warning':
        return {
          container: {
            backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : colors.warningLight,
          },
          text: {
            color: colors.warning,
          },
          dotColor: colors.warning,
        };
      case 'info':
        return {
          container: {
            backgroundColor: isDarkMode ? 'rgba(0, 170, 250, 0.2)' : 'rgba(3, 68, 102, 0.1)',
          },
          text: {
            color: colors.primary,
          },
          dotColor: colors.primary,
        };
      case 'neutral':
      default:
        return {
          container: {
            backgroundColor: colors.neutralLight,
          },
          text: {
            color: colors.neutral,
          },
          dotColor: colors.neutral,
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle; dotSize: number } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
          },
          text: {
            fontSize: fontSize.xs,
          },
          dotSize: 6,
        };
      case 'md':
      default:
        return {
          container: {
            paddingVertical: spacing.xs + 2,
            paddingHorizontal: spacing.md,
          },
          text: {
            fontSize: fontSize.sm,
          },
          dotSize: 8,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        variantStyles.container,
        sizeStyles.container,
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            {
              width: sizeStyles.dotSize,
              height: sizeStyles.dotSize,
              backgroundColor: variantStyles.dotColor,
            },
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          variantStyles.text,
          sizeStyles.text,
          dot && styles.textWithDot,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: borderRadius.full,
  },
  text: {
    fontWeight: fontWeight.medium,
  },
  textWithDot: {
    marginLeft: spacing.xs + 2,
  },
});
