/**
 * ItemOptionsModal Component
 * Centered modal for item action options (Add to, Follow, Share, Remove)
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
import { Plus, UserPlus, Share2, Trash2 } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';

interface ItemOption {
  icon: any;
  label: string;
  onPress: () => void;
  isDanger?: boolean;
}

interface ItemOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  options: ItemOption[];
  isDarkMode?: boolean;
  itemName?: string;
}

export default function ItemOptionsModal({
  visible,
  onClose,
  options,
  isDarkMode = false,
  itemName,
}: ItemOptionsModalProps) {
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              {itemName && (
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                  {itemName}
                </Text>
              )}

              {/* Options */}
              <View style={styles.optionsContainer}>
                {options.map((option, index) => {
                  const Icon = option.icon;
                  const textColor = option.isDanger ? colors.danger : colors.text;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                      onPress={() => {
                        option.onPress();
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <Icon size={20} color={textColor} strokeWidth={2} />
                      <Text style={[styles.optionText, { color: textColor }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
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
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
