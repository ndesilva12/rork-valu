/**
 * Endorsed Badge Component
 * Shows an "ENDORSED" badge like X.com verification - blue badge with white checkmark
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
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
      badge: { width: 16, height: 16 },
      icon: 10,
      text: { fontSize: 11, marginLeft: 4 },
    },
    medium: {
      badge: { width: 20, height: 20 },
      icon: 13,
      text: { fontSize: 12, marginLeft: 5 },
    },
    large: {
      badge: { width: 24, height: 24 },
      icon: 16,
      text: { fontSize: 13, marginLeft: 6 },
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={styles.container}>
      {/* Blue badge with white checkmark */}
      <View
        style={[
          styles.badge,
          currentSize.badge,
          {
            backgroundColor: colors.primary,
          }
        ]}
      >
        <Check size={currentSize.icon} color={colors.white} strokeWidth={3} />
      </View>

      {/* Text outside badge */}
      {showText && (
        <Text
          style={[
            styles.badgeText,
            currentSize.text,
            { color: colors.primary }
          ]}
        >
          ENDORSED
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
