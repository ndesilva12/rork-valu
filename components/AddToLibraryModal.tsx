/**
 * AddToLibraryModal Component
 * Modal for adding items to library lists with option to create new lists
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, Plus, List as ListIcon, ChevronRight, Check } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { UserList, ListEntry } from '@/types/library';

interface AddToLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  availableLists: UserList[];
  onSelectList: (listId: string) => Promise<void>;
  onCreateNewList: (listName: string) => Promise<void>;
  itemName?: string;
  isDarkMode?: boolean;
}

export default function AddToLibraryModal({
  visible,
  onClose,
  availableLists,
  onSelectList,
  onCreateNewList,
  itemName,
  isDarkMode = false,
}: AddToLibraryModalProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const handleSelectList = async (listId: string) => {
    setSelectedListId(listId);
    try {
      await onSelectList(listId);
      // Close is now handled by parent after success
      setTimeout(() => {
        setSelectedListId(null);
        onClose();
      }, 500); // Brief delay to show success feedback
    } catch (error: any) {
      setSelectedListId(null);
      Alert.alert('Error', error.message || 'Failed to add item');
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    setIsCreating(true);
    try {
      await onCreateNewList(newListName.trim());
      setNewListName('');
      setShowCreateNew(false);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create list');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>Add to Library</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Item Name */}
              {itemName && (
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                    {itemName}
                  </Text>
                  <Text style={[styles.itemHint, { color: colors.textSecondary }]}>
                    Select a list to add this item to
                  </Text>
                </View>
              )}

              {/* Lists */}
              <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {availableLists.map((list) => {
                  const isSelected = selectedListId === list.id;
                  return (
                    <TouchableOpacity
                      key={list.id}
                      style={[
                        styles.listItem,
                        { backgroundColor: colors.backgroundSecondary },
                        isSelected && { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 2 }
                      ]}
                      onPress={() => handleSelectList(list.id)}
                      activeOpacity={0.7}
                      disabled={isSelected}
                    >
                      <View style={styles.listItemLeft}>
                        <View style={[styles.listIcon, { backgroundColor: colors.primary + '20' }]}>
                          {isSelected ? (
                            <Check size={20} color={colors.primary} strokeWidth={2.5} />
                          ) : (
                            <ListIcon size={20} color={colors.primary} strokeWidth={2} />
                          )}
                        </View>
                        <View style={styles.listInfo}>
                          <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>
                            {list.name}
                          </Text>
                          <Text style={[styles.listCount, { color: colors.textSecondary }]}>
                            {list.entries.length} {list.entries.length === 1 ? 'item' : 'items'}
                          </Text>
                        </View>
                      </View>
                      {isSelected ? (
                        <Text style={[styles.addingText, { color: colors.primary }]}>Adding...</Text>
                      ) : (
                        <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Create New List Section */}
                {!showCreateNew ? (
                  <TouchableOpacity
                    style={[styles.createNewButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                    onPress={() => setShowCreateNew(true)}
                    activeOpacity={0.7}
                  >
                    <Plus size={20} color={colors.primary} strokeWidth={2} />
                    <Text style={[styles.createNewText, { color: colors.primary }]}>
                      Create New List
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.createNewForm, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.createNewLabel, { color: colors.text }]}>New List Name</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="Enter list name..."
                      placeholderTextColor={colors.textSecondary}
                      value={newListName}
                      onChangeText={setNewListName}
                      autoFocus
                    />
                    <View style={styles.createNewActions}>
                      <TouchableOpacity
                        style={[styles.cancelButton, { backgroundColor: colors.background }]}
                        onPress={() => {
                          setShowCreateNew(false);
                          setNewListName('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: colors.primary }]}
                        onPress={handleCreateList}
                        disabled={isCreating}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.createButtonText, { color: colors.white }]}>
                          {isCreating ? 'Creating...' : 'Create & Add'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>
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
    maxWidth: 500,
    borderRadius: 16,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  itemInfo: {
    marginBottom: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemHint: {
    fontSize: 14,
  },
  listContainer: {
    maxHeight: 400,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  listCount: {
    fontSize: 13,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createNewForm: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  createNewLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
  },
  createNewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  addingText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
