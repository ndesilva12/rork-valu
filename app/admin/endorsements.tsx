/**
 * Admin Panel - Endorsement History Management
 *
 * Allows admins to:
 * - View all endorsement history
 * - Edit cumulative days
 * - Add backdated endorsement periods
 * - Delete periods
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Plus, Edit, Trash2, Calendar, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import {
  getAllEndorsementHistory,
  getUserEndorsementHistory,
  adminUpdateEndorsementHistory,
  adminAddBackdatedPeriod,
  adminDeletePeriod,
  EndorsementHistory,
  EndorsementPeriod,
} from '@/services/firebase/endorsementHistoryService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

// Admin email whitelist
const ADMIN_EMAILS = [
  'normancdesilva@gmail.com',
];

interface UserBasic {
  id: string;
  name: string;
  email: string;
}

export default function EndorsementManagement() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [histories, setHistories] = useState<EndorsementHistory[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<EndorsementHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHistory, setEditingHistory] = useState<EndorsementHistory | null>(null);
  const [editTotalDays, setEditTotalDays] = useState('');
  const [editDaysTop5, setEditDaysTop5] = useState('');
  const [editDaysTop10, setEditDaysTop10] = useState('');

  // Add period modal state
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);
  const [addPeriodHistoryId, setAddPeriodHistoryId] = useState<string | null>(null);
  const [newPeriodStartDate, setNewPeriodStartDate] = useState('');
  const [newPeriodEndDate, setNewPeriodEndDate] = useState('');
  const [newPeriodPosition, setNewPeriodPosition] = useState('1');

  // Create new endorsement modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUserId, setCreateUserId] = useState('');
  const [createEntityType, setCreateEntityType] = useState<'brand' | 'business' | 'value'>('brand');
  const [createEntityId, setCreateEntityId] = useState('');
  const [createEntityName, setCreateEntityName] = useState('');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createEndDate, setCreateEndDate] = useState('');
  const [createPosition, setCreatePosition] = useState('1');

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      const email = user.primaryEmailAddress.emailAddress;
      setIsAdmin(ADMIN_EMAILS.includes(email));
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    // Filter histories based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = histories.filter(h =>
        h.entityName.toLowerCase().includes(query) ||
        h.userId.toLowerCase().includes(query) ||
        h.entityType.toLowerCase().includes(query) ||
        getUserName(h.userId).toLowerCase().includes(query)
      );
      setFilteredHistories(filtered);
    } else {
      setFilteredHistories(histories);
    }
  }, [searchQuery, histories]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all endorsement histories
      const allHistories = await getAllEndorsementHistory();
      setHistories(allHistories);
      setFilteredHistories(allHistories);

      // Load users for name lookup
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData: UserBasic[] = [];
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          name: data.userDetails?.name || data.name || 'Unknown',
          email: data.email || '',
        });
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load endorsement data');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.name || userId.substring(0, 8) + '...';
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Active';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const parseInputDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Edit handlers
  const handleEditHistory = (history: EndorsementHistory) => {
    setEditingHistory(history);
    setEditTotalDays(history.totalDaysEndorsed.toString());
    setEditDaysTop5(history.totalDaysInTop5.toString());
    setEditDaysTop10(history.totalDaysInTop10.toString());
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingHistory) return;

    try {
      await adminUpdateEndorsementHistory(editingHistory.id, {
        totalDaysEndorsed: parseInt(editTotalDays) || 0,
        totalDaysInTop5: parseInt(editDaysTop5) || 0,
        totalDaysInTop10: parseInt(editDaysTop10) || 0,
      });
      Alert.alert('Success', 'Endorsement history updated');
      setShowEditModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating history:', error);
      Alert.alert('Error', 'Failed to update endorsement history');
    }
  };

  // Add period handlers
  const handleAddPeriod = (historyId: string) => {
    setAddPeriodHistoryId(historyId);
    setNewPeriodStartDate('');
    setNewPeriodEndDate('');
    setNewPeriodPosition('1');
    setShowAddPeriodModal(true);
  };

  const handleSaveNewPeriod = async () => {
    if (!addPeriodHistoryId) return;

    const startDate = parseInputDate(newPeriodStartDate);
    if (!startDate) {
      Alert.alert('Error', 'Please enter a valid start date');
      return;
    }

    const endDate = newPeriodEndDate ? parseInputDate(newPeriodEndDate) : null;
    const position = parseInt(newPeriodPosition) || 1;

    try {
      const history = histories.find(h => h.id === addPeriodHistoryId);
      if (!history) throw new Error('History not found');

      await adminAddBackdatedPeriod(
        history.userId,
        history.entityType,
        history.entityId,
        history.entityName,
        startDate,
        endDate,
        position
      );
      Alert.alert('Success', 'Period added successfully');
      setShowAddPeriodModal(false);
      loadData();
    } catch (error) {
      console.error('Error adding period:', error);
      Alert.alert('Error', 'Failed to add period');
    }
  };

  // Delete period handler
  const handleDeletePeriod = (historyId: string, periodId: string) => {
    Alert.alert(
      'Delete Period',
      'Are you sure you want to delete this endorsement period? This will affect the cumulative totals.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminDeletePeriod(historyId, periodId);
              Alert.alert('Success', 'Period deleted');
              loadData();
            } catch (error) {
              console.error('Error deleting period:', error);
              Alert.alert('Error', 'Failed to delete period');
            }
          },
        },
      ]
    );
  };

  // Create new endorsement handler
  const handleCreateEndorsement = async () => {
    if (!createUserId || !createEntityId || !createEntityName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const startDate = parseInputDate(createStartDate);
    if (!startDate) {
      Alert.alert('Error', 'Please enter a valid start date');
      return;
    }

    const endDate = createEndDate ? parseInputDate(createEndDate) : null;
    const position = parseInt(createPosition) || 1;

    try {
      await adminAddBackdatedPeriod(
        createUserId,
        createEntityType,
        createEntityId,
        createEntityName,
        startDate,
        endDate,
        position
      );
      Alert.alert('Success', 'Endorsement history created');
      setShowCreateModal(false);
      setCreateUserId('');
      setCreateEntityId('');
      setCreateEntityName('');
      setCreateStartDate('');
      setCreateEndDate('');
      loadData();
    } catch (error) {
      console.error('Error creating endorsement:', error);
      Alert.alert('Error', 'Failed to create endorsement history');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading endorsement data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>
            You don't have permission to access this page.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Endorsement History</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by user, entity, or type..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          Total: {filteredHistories.length} endorsement records
        </Text>
        <Text style={styles.statsText}>
          Active: {filteredHistories.filter(h => h.isCurrentlyEndorsed).length}
        </Text>
      </View>

      {/* List */}
      <ScrollView style={styles.list}>
        {filteredHistories.map(history => (
          <View key={history.id} style={styles.historyCard}>
            {/* Main row */}
            <TouchableOpacity
              style={styles.historyHeader}
              onPress={() => setExpandedHistoryId(
                expandedHistoryId === history.id ? null : history.id
              )}
            >
              <View style={styles.historyInfo}>
                <Text style={styles.entityName}>{history.entityName}</Text>
                <Text style={styles.entityType}>
                  {history.entityType.charAt(0).toUpperCase() + history.entityType.slice(1)} • {getUserName(history.userId)}
                </Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statValue}>{history.totalDaysEndorsed}</Text>
                    <Text style={styles.statLabel}>Total Days</Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Text style={styles.statValue}>{history.totalDaysInTop5}</Text>
                    <Text style={styles.statLabel}>Top 5</Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Text style={styles.statValue}>{history.totalDaysInTop10}</Text>
                    <Text style={styles.statLabel}>Top 10</Text>
                  </View>
                  {history.isCurrentlyEndorsed && (
                    <View style={[styles.statBadge, styles.activeBadge]}>
                      <Text style={styles.activeText}>Active</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.historyActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditHistory(history)}
                >
                  <Edit size={18} color="#007bff" />
                </TouchableOpacity>
                {expandedHistoryId === history.id ? (
                  <ChevronUp size={20} color="#666" />
                ) : (
                  <ChevronDown size={20} color="#666" />
                )}
              </View>
            </TouchableOpacity>

            {/* Expanded periods */}
            {expandedHistoryId === history.id && (
              <View style={styles.periodsContainer}>
                <View style={styles.periodsHeader}>
                  <Text style={styles.periodsTitle}>Endorsement Periods</Text>
                  <TouchableOpacity
                    style={styles.addPeriodButton}
                    onPress={() => handleAddPeriod(history.id)}
                  >
                    <Plus size={16} color="#007bff" />
                    <Text style={styles.addPeriodText}>Add Period</Text>
                  </TouchableOpacity>
                </View>
                {history.periods.length === 0 ? (
                  <Text style={styles.noPeriodsText}>No periods recorded</Text>
                ) : (
                  history.periods.map((period, index) => (
                    <View key={period.id} style={styles.periodRow}>
                      <View style={styles.periodInfo}>
                        <Text style={styles.periodDates}>
                          {formatDate(period.startDate)} → {formatDate(period.endDate)}
                        </Text>
                        <Text style={styles.periodStats}>
                          {period.daysInPeriod} days • Position {period.startPosition}
                          {period.daysInTop5 > 0 && ` • ${period.daysInTop5}d in Top 5`}
                          {period.daysInTop10 > 0 && ` • ${period.daysInTop10}d in Top 10`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deletePeriodButton}
                        onPress={() => handleDeletePeriod(history.id, period.id)}
                      >
                        <Trash2 size={16} color="#dc3545" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Endorsement Totals</Text>
            <Text style={styles.modalSubtitle}>{editingHistory?.entityName}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total Days Endorsed</Text>
              <TextInput
                style={styles.input}
                value={editTotalDays}
                onChangeText={setEditTotalDays}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total Days in Top 5</Text>
              <TextInput
                style={styles.input}
                value={editDaysTop5}
                onChangeText={setEditDaysTop5}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total Days in Top 10</Text>
              <TextInput
                style={styles.input}
                value={editDaysTop10}
                onChangeText={setEditDaysTop10}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Period Modal */}
      <Modal visible={showAddPeriodModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Backdated Period</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={newPeriodStartDate}
                onChangeText={setNewPeriodStartDate}
                placeholder="2024-01-15"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date (leave empty for active)</Text>
              <TextInput
                style={styles.input}
                value={newPeriodEndDate}
                onChangeText={setNewPeriodEndDate}
                placeholder="2024-02-15"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Starting Position</Text>
              <TextInput
                style={styles.input}
                value={newPeriodPosition}
                onChangeText={setNewPeriodPosition}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddPeriodModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveNewPeriod}
              >
                <Text style={styles.saveButtonText}>Add Period</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create New Endorsement Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Endorsement History</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>User ID *</Text>
                <TextInput
                  style={styles.input}
                  value={createUserId}
                  onChangeText={setCreateUserId}
                  placeholder="user_xxx..."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Entity Type *</Text>
                <View style={styles.typeSelector}>
                  {(['brand', 'business', 'value'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        createEntityType === type && styles.typeOptionSelected,
                      ]}
                      onPress={() => setCreateEntityType(type)}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          createEntityType === type && styles.typeOptionTextSelected,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Entity ID *</Text>
                <TextInput
                  style={styles.input}
                  value={createEntityId}
                  onChangeText={setCreateEntityId}
                  placeholder="brand_xxx or business ID..."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Entity Name *</Text>
                <TextInput
                  style={styles.input}
                  value={createEntityName}
                  onChangeText={setCreateEntityName}
                  placeholder="Brand or Business Name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Start Date * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={createStartDate}
                  onChangeText={setCreateStartDate}
                  placeholder="2024-01-15"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>End Date (leave empty for active)</Text>
                <TextInput
                  style={styles.input}
                  value={createEndDate}
                  onChangeText={setCreateEndDate}
                  placeholder="2024-02-15"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Starting Position</Text>
                <TextInput
                  style={styles.input}
                  value={createPosition}
                  onChangeText={setCreatePosition}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleCreateEndorsement}
                >
                  <Text style={styles.saveButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  historyInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  entityType: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  activeBadge: {
    backgroundColor: '#d4edda',
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#155724',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  periodsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
    backgroundColor: '#fafafa',
  },
  periodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addPeriodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addPeriodText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  noPeriodsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  periodInfo: {
    flex: 1,
  },
  periodDates: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  periodStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deletePeriodButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: '#007bff',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  typeOptionTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007bff',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
