/**
 * Customer Discount QR Code Generator
 *
 * Generates a time-limited QR code that merchants can scan
 * to verify the customer and apply discounts/donations
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useUser } from '@/contexts/UserContext';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { lightColors, darkColors } from '@/constants/colors';

const QR_CODE_EXPIRY_MINUTES = 5;

export default function CustomerDiscount() {
  const { profile, isDarkMode } = useUser();
  const { user: clerkUser } = useClerkUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const [qrData, setQrData] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Generate QR code data
  const generateQRCode = () => {
    if (!clerkUser) {
      Alert.alert('Error', 'You must be signed in to use this feature');
      return;
    }

    const now = Date.now();
    const expiry = now + (QR_CODE_EXPIRY_MINUTES * 60 * 1000);
    const transactionId = `txn_${now}_${Math.random().toString(36).substring(7)}`;

    // Generate URL that will be scanned by merchant's camera
    const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://upright.money';
    const verifyUrl = `${baseUrl}/merchant/verify?` +
      `userId=${clerkUser.id}&` +
      `code=${transactionId}&` +
      `exp=${expiry}&` +
      `name=${encodeURIComponent(clerkUser.fullName || 'User')}&` +
      `email=${encodeURIComponent(clerkUser.primaryEmailAddress?.emailAddress || '')}`;

    setQrData(verifyUrl);
    setExpiresAt(expiry);
  };

  // Update countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setQrData(null);
        setExpiresAt(null);
        setTimeRemaining('');
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Auto-generate on mount
  useEffect(() => {
    if (clerkUser) {
      generateQRCode();
    }
  }, [clerkUser]);

  if (!clerkUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Please sign in to use this feature
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Get Discount</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        {/* Instructions */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            How to use:
          </Text>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            1. Show this QR code to the merchant
          </Text>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            2. They'll scan it with their phone camera
          </Text>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            3. They'll confirm the transaction amount
          </Text>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>
            4. You'll receive a confirmation notification
          </Text>
        </View>

        {/* QR Code Display */}
        {qrData ? (
          <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF' }]}>
            <QRCode
              value={qrData}
              size={250}
              backgroundColor="white"
              color="black"
            />

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Expires in:</Text>
              <Text style={styles.timerText}>{timeRemaining}</Text>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{clerkUser.fullName}</Text>
              <Text style={styles.userEmail}>
                {clerkUser.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Generating QR code...
            </Text>
          </View>
        )}

        {/* Regenerate Button */}
        {qrData && (
          <TouchableOpacity
            style={[styles.regenerateButton, { backgroundColor: colors.primary }]}
            onPress={generateQRCode}
          >
            <Text style={styles.regenerateButtonText}>Generate New Code</Text>
          </TouchableOpacity>
        )}

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            💡 Your promo code: <Text style={{ fontWeight: 'bold' }}>{profile.promoCode}</Text>
          </Text>
          <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
            This code is unique to you and can be used as an alternative to the QR code.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    minWidth: 60,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 20,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    gap: 16,
  },
  timerContainer: {
    alignItems: 'center',
    gap: 4,
  },
  timerLabel: {
    fontSize: 12,
    color: '#666',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  regenerateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoSubtext: {
    fontSize: 12,
    lineHeight: 18,
  },
});
