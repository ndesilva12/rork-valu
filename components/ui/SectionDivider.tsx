/**
 * SectionDivider Component
 * Consistent spacing and optional line between sections
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { spacing } from '@/constants/designTokens';

type DividerSize = 'sm' | 'md' | 'lg';

interface SectionDividerProps {
  size?: DividerSize;
  showLine?: boolean;
  isDarkMode?: boolean;
  style?: ViewStyle;
}

export default function SectionDivider({
  size = 'md',
  showLine = false,
  isDarkMode = false,
  style,
}: SectionDividerProps) {
  const colors = isDarkMode ? darkColors : lightColors;

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { height: spacing.md };
      case 'md':
        return { height: spacing.xl };
      case 'lg':
        return { height: spacing['2xl'] };
      default:
        return {};
    }
  };

  if (showLine) {
    return (
      <View style={[styles.container, getSizeStyles(), style]}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
    );
  }

  return <View style={[getSizeStyles(), style]} />;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  line: {
    height: 1,
  },
});
