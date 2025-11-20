/**
 * Admin Panel - Main Dashboard
 *
 * Provides access to manage:
 * - Values (causes)
 * - Brands
 * - Businesses
 * - Users
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Admin email whitelist
const ADMIN_EMAILS = [
  'normancdesilva@gmail.com',
  // Add more admin emails here
];

export default function AdminDashboard() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (user?.primaryEmailAddress?.emailAddress) {
      const email = user.primaryEmailAddress.emailAddress;
      setIsAdmin(ADMIN_EMAILS.includes(email));
    }
    setIsLoading(false);
  }, [user]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
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
            You don't have permission to access the admin panel.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>
            Manage values, brands, businesses, and users
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Values Management */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/admin/values')}
          >
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardTitle}>Values Management</Text>
            <Text style={styles.cardDescription}>
              Add, edit, or delete values and their brand associations
            </Text>
          </TouchableOpacity>

          {/* Brands Management */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/admin/brands')}
          >
            <Text style={styles.cardIcon}>🏢</Text>
            <Text style={styles.cardTitle}>Brands Management</Text>
            <Text style={styles.cardDescription}>
              Manage brands, money flow sections, and all brand data
            </Text>
          </TouchableOpacity>

          {/* Incomplete Brands */}
          <TouchableOpacity
            style={[styles.card, styles.highlightCard]}
            onPress={() => router.push('/admin/incomplete-brands')}
          >
            <Text style={styles.cardIcon}>⚠️</Text>
            <Text style={styles.cardTitle}>Incomplete Brands</Text>
            <Text style={styles.cardDescription}>
              Manage auto-created brands that need completion. Fill in details and mark as verified.
            </Text>
          </TouchableOpacity>

          {/* Cleanup Duplicates */}
          <TouchableOpacity
            style={[styles.card, styles.warningCard]}
            onPress={() => router.push('/admin/cleanup-duplicates')}
          >
            <Text style={styles.cardIcon}>🧹</Text>
            <Text style={styles.cardTitle}>Cleanup Duplicate Brands</Text>
            <Text style={styles.cardDescription}>
              Find and remove duplicate auto-created brands
            </Text>
          </TouchableOpacity>

          {/* Business Management */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/admin/businesses')}
          >
            <Text style={styles.cardIcon}>👥</Text>
            <Text style={styles.cardTitle}>Businesses</Text>
            <Text style={styles.cardDescription}>
              Edit business profiles and all business data
            </Text>
          </TouchableOpacity>

          {/* Users Management */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/admin/users')}
          >
            <Text style={styles.cardIcon}>👤</Text>
            <Text style={styles.cardTitle}>Users</Text>
            <Text style={styles.cardDescription}>
              Edit user profiles, causes, and personal data
            </Text>
          </TouchableOpacity>

          {/* Transactions */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/admin/transactions')}
          >
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.cardTitle}>All Transactions</Text>
            <Text style={styles.cardDescription}>
              View all transactions across all businesses
            </Text>
          </TouchableOpacity>

          {/* Business Financials */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/admin/financials')}
          >
            <Text style={styles.cardIcon}>💰</Text>
            <Text style={styles.cardTitle}>Business Financials</Text>
            <Text style={styles.cardDescription}>
              Manage business accounts, amounts owed, and record payments
            </Text>
          </TouchableOpacity>

          {/* Custom Fields */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/admin/custom-fields')}
          >
            <Text style={styles.cardIcon}>🔧</Text>
            <Text style={styles.cardTitle}>Custom Fields</Text>
            <Text style={styles.cardDescription}>
              Create and manage custom fields for users, businesses, brands, and transactions
            </Text>
          </TouchableOpacity>

          {/* Database Stats */}
          <View style={[styles.card, styles.statsCard]}>
            <Text style={styles.cardIcon}>📈</Text>
            <Text style={styles.cardTitle}>Quick Stats</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Collections:</Text>
                <Text style={styles.statValue}>brands, values, users, transactions</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Admin:</Text>
                <Text style={styles.statValue}>{user?.primaryEmailAddress?.emailAddress}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  cardsContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 280,
    maxWidth: 400,
    flex: 1,
    flexBasis: Platform.OS === 'web' ? '30%' : '100%',
  },
  statsCard: {
    backgroundColor: '#f0f4f8',
  },
  highlightCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
    backgroundColor: '#e3f2fd',
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    backgroundColor: '#fff8e1',
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  statsContainer: {
    marginTop: 12,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  statValue: {
    fontSize: 14,
    color: '#777',
    flex: 1,
  },
});
