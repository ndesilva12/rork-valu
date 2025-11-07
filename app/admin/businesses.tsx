/**
 * Admin Panel - User Businesses Management
 *
 * Edit user business profiles, especially money flow sections
 * (affiliates, partnerships, ownership)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

interface Affiliate {
  name: string;
  relationship: string;
}

interface Partnership {
  name: string;
  relationship: string;
}

interface Ownership {
  name: string;
  relationship: string;
}

interface BusinessData {
  userId: string;
  email: string;
  businessName: string;
  category: string;
  affiliates?: Affiliate[];
  partnerships?: Partnership[];
  ownership?: Ownership[];
  ownershipSources?: string;
}

export default function BusinessesManagement() {
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for money flow sections
  const [formAffiliates, setFormAffiliates] = useState('');
  const [formPartnerships, setFormPartnerships] = useState('');
  const [formOwnership, setFormOwnership] = useState('');
  const [formOwnershipSources, setFormOwnershipSources] = useState('');

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('accountType', '==', 'business'));
      const snapshot = await getDocs(q);

      const loadedBusinesses: BusinessData[] = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          if (!data.businessInfo) return null;

          return {
            userId: doc.id,
            email: data.email || 'No email',
            businessName: data.businessInfo.name || 'Unnamed Business',
            category: data.businessInfo.category || 'Uncategorized',
            affiliates: data.businessInfo.affiliates || [],
            partnerships: data.businessInfo.partnerships || [],
            ownership: data.businessInfo.ownership || [],
            ownershipSources: data.businessInfo.ownershipSources || '',
          };
        })
        .filter((b): b is BusinessData => b !== null);

      setBusinesses(loadedBusinesses);
    } catch (error) {
      console.error('Error loading businesses:', error);
      Alert.alert('Error', 'Failed to load businesses from Firebase');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (business: BusinessData) => {
    setEditingBusiness(business);

    // Format money flow sections
    setFormAffiliates(
      business.affiliates?.map((a) => `${a.name}|${a.relationship}`).join('\n') || ''
    );
    setFormPartnerships(
      business.partnerships?.map((p) => `${p.name}|${p.relationship}`).join('\n') || ''
    );
    setFormOwnership(
      business.ownership?.map((o) => `${o.name}|${o.relationship}`).join('\n') || ''
    );
    setFormOwnershipSources(business.ownershipSources || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBusiness(null);
  };

  const parseMoneyFlowSection = (text: string): { name: string; relationship: string }[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => {
        const [name, relationship] = line.split('|').map((s) => s.trim());
        return { name: name || '', relationship: relationship || '' };
      })
      .filter((item) => item.name);
  };

  const handleSave = async () => {
    if (!editingBusiness) return;

    try {
      const updatedBusinessInfo = {
        affiliates: parseMoneyFlowSection(formAffiliates),
        partnerships: parseMoneyFlowSection(formPartnerships),
        ownership: parseMoneyFlowSection(formOwnership),
        ownershipSources: formOwnershipSources.trim(),
      };

      const userRef = doc(db, 'users', editingBusiness.userId);

      // Update only the money flow fields within businessInfo
      await updateDoc(userRef, {
        'businessInfo.affiliates': updatedBusinessInfo.affiliates,
        'businessInfo.partnerships': updatedBusinessInfo.partnerships,
        'businessInfo.ownership': updatedBusinessInfo.ownership,
        'businessInfo.ownershipSources': updatedBusinessInfo.ownershipSources,
      });

      Alert.alert(
        'Success',
        `Money flow data for "${editingBusiness.businessName}" updated successfully`
      );

      closeModal();
      loadBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      Alert.alert('Error', 'Failed to update business data');
    }
  };

  const filteredBusinesses = businesses.filter(
    (business) =>
      business.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Businesses Management</Text>
        <Text style={styles.subtitle}>
          {businesses.length} business accounts ({filteredBusinesses.length} filtered)
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by business name, email, or category..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Businesses List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.listContainer}>
          {filteredBusinesses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No businesses found matching your search' : 'No business accounts yet'}
              </Text>
            </View>
          ) : (
            filteredBusinesses.map((business) => (
              <View key={business.userId} style={styles.businessCard}>
                <View style={styles.businessHeader}>
                  <View style={styles.businessInfo}>
                    <Text style={styles.businessName}>{business.businessName}</Text>
                    <Text style={styles.businessCategory}>{business.category}</Text>
                    <Text style={styles.businessEmail}>{business.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(business)}
                  >
                    <Text style={styles.editButtonText}>Edit Money Flow</Text>
                  </TouchableOpacity>
                </View>

                {/* Money Flow Summary */}
                <View style={styles.moneyFlowSummary}>
                  <Text style={styles.moneyFlowLabel}>Money Flow:</Text>
                  <Text style={styles.moneyFlowText}>
                    {business.affiliates?.length || 0} affiliates, {business.partnerships?.length || 0}{' '}
                    partnerships, {business.ownership?.length || 0} ownership entries
                  </Text>
                </View>

                {/* Quick Preview */}
                {(business.affiliates && business.affiliates.length > 0) && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>Affiliates:</Text>
                    <Text style={styles.previewText}>
                      {business.affiliates.slice(0, 2).map(a => a.name).join(', ')}
                      {business.affiliates.length > 2 && '...'}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Edit Money Flow - {editingBusiness?.businessName}
              </Text>

              <View style={styles.businessDetails}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{editingBusiness?.email}</Text>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{editingBusiness?.category}</Text>
              </View>

              <Text style={styles.sectionTitle}>💰 Money Flow Sections</Text>
              <Text style={styles.helpText}>
                Edit the money flow sections for this business. Format: Name|Relationship (one per line)
              </Text>

              <Text style={styles.label}>
                Affiliates (celebrities/influencers)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Taylor Swift|Multi-million&#10;LeBron James|$5M endorsement"
                value={formAffiliates}
                onChangeText={setFormAffiliates}
                multiline
                numberOfLines={5}
              />

              <Text style={styles.label}>
                Partnerships (business partnerships)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="TSMC|Silicon Supply Chain/2010&#10;Foxconn|Manufacturing/2005"
                value={formPartnerships}
                onChangeText={setFormPartnerships}
                multiline
                numberOfLines={5}
              />

              <Text style={styles.label}>
                Ownership (shareholders/investors)
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Vanguard Group|~9.5%&#10;BlackRock|~7.2%"
                value={formOwnership}
                onChangeText={setFormOwnership}
                multiline
                numberOfLines={5}
              />

              <Text style={styles.label}>Ownership Sources (citations)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="HQ: Official site; Stakes: Q3 2025 13F filings via SEC/Yahoo Finance"
                value={formOwnershipSources}
                onChangeText={setFormOwnershipSources}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  businessEmail: {
    fontSize: 12,
    color: '#888',
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  moneyFlowSummary: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  moneyFlowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  moneyFlowText: {
    fontSize: 13,
    color: '#666',
  },
  previewSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  businessDetails: {
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginTop: 8,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
