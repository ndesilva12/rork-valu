/**
 * ConfirmDialog Component
 * In-app confirmation dialog to replace browser confirm()
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode?: boolean;
  destructive?: boolean;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDarkMode = false,
  destructive = false,
}: ConfirmDialogProps) {
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              {/* Icon */}
              {destructive && (
                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <AlertTriangle size={28} color="#DC2626" strokeWidth={2} />
                </View>
              )}

              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

              {/* Message */}
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: destructive ? '#DC2626' : colors.primary },
                  ]}
                  onPress={() => {
                    onConfirm();
                    onCancel(); // Close dialog after confirm
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmButtonText, { color: colors.white }]}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
