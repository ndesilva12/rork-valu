import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, AlertCircle } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { getBusinessesAcceptingDiscounts, calculateDistance, BusinessUser } from '@/services/firebase/businessService';

export default function BusinessesAcceptingDiscounts() {
  const router = useRouter();
  const { isDarkMode, profile } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const [businesses, setBusinesses] = useState<BusinessUser[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Check if user has location from profile
  useEffect(() => {
    if (profile.userDetails?.latitude && profile.userDetails?.longitude) {
      setUserLocation({
        latitude: profile.userDetails.latitude,
        longitude: profile.userDetails.longitude,
      });
      setHasLocationPermission(true);
    }
  }, [profile.userDetails]);

  // Fetch businesses from Firebase
  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const fetchedBusinesses = await getBusinessesAcceptingDiscounts();

      // Calculate distances if user has location
      const businessesWithDistance = fetchedBusinesses.map((business) => {
        if (
          userLocation &&
          business.businessInfo.latitude &&
          business.businessInfo.longitude
        ) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            business.businessInfo.latitude,
            business.businessInfo.longitude
          );
          return { ...business, distance };
        }
        return business;
      });

      setBusinesses(businessesWithDistance);
      setFilteredBusinesses(businessesWithDistance);
    } catch (error) {
      console.error('[BusinessesAcceptingDiscounts] Error loading businesses:', error);
      Alert.alert('Error', 'Failed to load businesses. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sort businesses by distance or randomly
  useEffect(() => {
    let sorted = [...filteredBusinesses];

    if (userLocation) {
      // Sort by distance (businesses with location first)
      sorted.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      });
    } else {
      // Random sort
      sorted.sort(() => Math.random() - 0.5);
    }

    setFilteredBusinesses(sorted);
  }, [userLocation, businesses]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBusinesses(businesses);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = businesses.filter((business) => {
      const name = business.businessInfo.name.toLowerCase();
      const category = business.businessInfo.category?.toLowerCase() || '';
      const location = business.businessInfo.location?.toLowerCase() || '';

      return name.includes(query) || category.includes(query) || location.includes(query);
    });

    setFilteredBusinesses(filtered);
  }, [searchQuery, businesses]);

  const handleEnableLocation = () => {
    Alert.alert(
      'Enable Location',
      'To see businesses sorted by distance, please add your location in the Profile → Details tab.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go to Profile', onPress: () => router.push('/profile') }
      ]
    );
  };

  const renderBusinessCard = ({ item }: { item: BusinessUser }) => {
    const { businessInfo, distance } = item;

    // Determine acceptance method
    const acceptsQR = businessInfo.acceptsQRCode ?? true;
    const acceptsValue = businessInfo.acceptsValueCode ?? true;

    return (
      <TouchableOpacity
        style={[styles.businessCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => router.push(`/business/${item.id}`)}
      >
        <View style={styles.businessCardContent}>
          <View style={styles.businessInfo}>
            <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
              {businessInfo.name}
            </Text>
            <Text style={[styles.businessCategory, { color: colors.textSecondary }]} numberOfLines={1}>
              {businessInfo.category}
            </Text>
            {businessInfo.location && (
              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {businessInfo.location}
                  {distance !== undefined && ` • ${distance} mi`}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.acceptanceInfo}>
            {acceptsQR && (
              <Text style={[styles.acceptanceText, { color: colors.primary }]}>QR Code</Text>
            )}
            {acceptsValue && (
              <Text style={[styles.acceptanceText, { color: colors.primary }]}>Promo Code</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Businesses Accepting Stand Discounts</Text>
        <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading businesses...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Businesses Accepting Stand Discounts</Text>

      {/* Search Bar with Location Icon */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
        <Search size={20} color={colors.textSecondary} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search businesses..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {!userLocation && (
          <TouchableOpacity onPress={handleEnableLocation} activeOpacity={0.7} style={styles.locationIconButton}>
            <MapPin size={20} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Business List */}
      {filteredBusinesses.length > 0 ? (
        <FlatList
          data={filteredBusinesses}
          renderItem={renderBusinessCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={false} // Parent handles scrolling
        />
      ) : (
        <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <AlertCircle size={48} color={colors.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {searchQuery ? 'No businesses found matching your search' : 'No businesses accepting Stand discounts yet'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {searchQuery ? 'Try a different search term' : 'Check back soon as more businesses join!'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
  locationIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  listContainer: {
    gap: 12,
  },
  businessCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  businessCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessInfo: {
    flex: 1,
    marginRight: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
  acceptanceInfo: {
    alignItems: 'flex-end',
    gap: 4,
  },
  acceptanceText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
