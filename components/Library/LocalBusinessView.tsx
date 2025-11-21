/**
 * LocalBusinessView Component
 * Displays local businesses with distance filtering and sorting
 * Integrated into the UnifiedLibrary as a section
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MapPin, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { BusinessUser, isBusinessWithinRange } from '@/services/firebase/businessService';
import { Cause } from '@/types';
import { calculateSimilarityScore } from '@/lib/scoring';
import { formatDistance } from '@/lib/distance';
import { getLogoUrl } from '@/lib/logo';

type LocalDistanceOption = 1 | 5 | 10 | 50 | 100 | null;

interface LocalBusinessViewProps {
  userBusinesses: BusinessUser[];
  userLocation?: { latitude: number; longitude: number } | null;
  userCauses?: Cause[];
  isDarkMode?: boolean;
  onRequestLocation?: () => void;
}

interface BusinessWithScore {
  business: BusinessUser;
  alignmentScore: number;
  distance?: number;
  closestLocation?: string;
  isWithinRange: boolean;
}

// Normalize similarity scores to 1-99 range with median at 50
const normalizeSimilarityScores = (businesses: BusinessWithScore[]): BusinessWithScore[] => {
  if (businesses.length === 0) return [];

  const scores = businesses.map((b) => b.alignmentScore);
  scores.sort((a, b) => a - b);

  const median = scores[Math.floor(scores.length / 2)];
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  return businesses.map((business) => {
    let normalized: number;

    if (business.alignmentScore >= median) {
      // Map [median, max] to [50, 99]
      if (max === median) {
        normalized = 99;
      } else {
        normalized = 50 + ((business.alignmentScore - median) / (max - median)) * 49;
      }
    } else {
      // Map [min, median) to [1, 50)
      if (median === min) {
        normalized = 1;
      } else {
        normalized = 1 + ((business.alignmentScore - min) / (median - min)) * 49;
      }
    }

    return {
      ...business,
      alignmentScore: Math.round(normalized),
    };
  });
};

export default function LocalBusinessView({
  userBusinesses,
  userLocation,
  userCauses = [],
  isDarkMode = false,
  onRequestLocation,
}: LocalBusinessViewProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const router = useRouter();

  const [localDistance, setLocalDistance] = useState<LocalDistanceOption>(null);
  const [localSortDirection, setLocalSortDirection] = useState<'highToLow' | 'lowToHigh'>('highToLow');

  const localDistanceOptions: LocalDistanceOption[] = [100, 50, 10, 5, 1];

  const localBusinessData = useMemo(() => {
    if (!userLocation || userBusinesses.length === 0) {
      return {
        allBusinesses: [],
        alignedBusinesses: [],
        unalignedBusinesses: [],
      };
    }

    // Filter businesses by distance and calculate similarity scores
    const businessesWithScores = userBusinesses.map((business) => {
      let rangeResult;
      if (localDistance === null) {
        const tempResult = isBusinessWithinRange(business, userLocation.latitude, userLocation.longitude, 999999);
        rangeResult = {
          ...tempResult,
          isWithinRange: true,
        };
      } else {
        rangeResult = isBusinessWithinRange(business, userLocation.latitude, userLocation.longitude, localDistance);
      }

      const similarityScore = calculateSimilarityScore(userCauses, business.causes || []);

      return {
        business,
        alignmentScore: similarityScore,
        distance: rangeResult.closestDistance,
        closestLocation: rangeResult.closestLocation,
        isWithinRange: rangeResult.isWithinRange,
      };
    });

    const businessesInRange = businessesWithScores.filter((b) => b.isWithinRange);
    const normalizedBusinesses = normalizeSimilarityScores(businessesInRange);

    const allBusinessesSorted = [...normalizedBusinesses].sort((a, b) => {
      if (localSortDirection === 'highToLow') {
        return b.alignmentScore - a.alignmentScore;
      } else {
        return a.alignmentScore - b.alignmentScore;
      }
    });

    return {
      allBusinesses: allBusinessesSorted,
      alignedBusinesses: normalizedBusinesses.filter((b) => b.alignmentScore >= 60),
      unalignedBusinesses: normalizedBusinesses.filter((b) => b.alignmentScore < 40),
    };
  }, [userLocation, userBusinesses, localDistance, userCauses, localSortDirection]);

  const renderLocalBusinessCard = (
    businessData: BusinessWithScore,
    type: 'aligned' | 'unaligned'
  ) => {
    const { business, alignmentScore, distance, closestLocation } = businessData;
    const isAligned = type === 'aligned';
    const scoreColor = alignmentScore >= 50 ? colors.primary : colors.danger;

    return (
      <View key={business.id} style={{ position: 'relative', marginBottom: 12 }}>
        <TouchableOpacity
          style={[
            styles.businessCard,
            { backgroundColor: 'transparent' },
          ]}
          onPress={() => {
            router.push({
              pathname: '/business/[id]',
              params: { id: business.id },
            });
          }}
          activeOpacity={0.7}
        >
          <View style={styles.businessCardInner}>
            <View style={styles.businessLogoContainer}>
              <Image
                source={{ uri: getLogoUrl(business.businessInfo.website || '') }}
                style={styles.businessLogo}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            </View>
            <View style={styles.businessCardContent}>
              <Text style={[styles.businessName, { color: colors.white }]} numberOfLines={2}>
                {business.businessInfo.name || 'Local Business'}
              </Text>
              <Text style={[styles.businessCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                {closestLocation || 'Local business'}
              </Text>
              {distance !== undefined && (
                <View style={styles.distanceContainer}>
                  <MapPin size={12} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                    {formatDistance(distance)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.businessScoreContainer}>
              <Text style={[styles.businessScore, { color: scoreColor }]}>
                {alignmentScore}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (!userLocation) {
    return (
      <View style={styles.emptySection}>
        <MapPin size={48} color={colors.textSecondary} strokeWidth={1.5} />
        <Text style={[styles.emptySectionText, { color: colors.textSecondary }]}>
          Location access required to view local businesses
        </Text>
        {onRequestLocation && (
          <TouchableOpacity
            style={[styles.enableLocationButton, { backgroundColor: colors.primary }]}
            onPress={onRequestLocation}
            activeOpacity={0.7}
          >
            <Text style={[styles.enableLocationButtonText, { color: colors.white }]}>
              Enable Location
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const { allBusinesses } = localBusinessData;

  return (
    <View style={styles.container}>
      {/* Header with map icon and sort */}
      <View style={[styles.localHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.localHeaderLeft}>
          <MapPin size={24} color={colors.primary} strokeWidth={2} />
          <Text style={[styles.localTitle, { color: colors.text }]}>Local Businesses</Text>
        </View>
        <TouchableOpacity
          onPress={() => setLocalSortDirection(localSortDirection === 'highToLow' ? 'lowToHigh' : 'highToLow')}
          activeOpacity={0.7}
          style={styles.sortButton}
        >
          {localSortDirection === 'highToLow' ? (
            <ChevronDown size={18} color={colors.primary} strokeWidth={2} />
          ) : (
            <ChevronUp size={18} color={colors.primary} strokeWidth={2} />
          )}
          <Text style={[styles.sortButtonText, { color: colors.primary }]}>
            {localSortDirection === 'highToLow' ? 'High to Low' : 'Low to High'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Distance Filter */}
      <View style={styles.distanceFilterRow}>
        <View style={styles.distanceOptionsContainer}>
          {localDistanceOptions.map((option) => (
            <TouchableOpacity
              key={option || 'all'}
              style={[
                styles.distanceFilterButton,
                { backgroundColor: localDistance === option ? colors.primary : colors.backgroundSecondary },
              ]}
              onPress={() => setLocalDistance(option)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.distanceFilterText,
                  { color: localDistance === option ? colors.white : colors.text },
                ]}
              >
                {option === null ? 'All' : `${option} mi`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Business List */}
      <View style={styles.businessList}>
        {allBusinesses.length > 0 ? (
          allBusinesses.map((biz) => {
            const isAligned = biz.alignmentScore >= 50;
            return renderLocalBusinessCard(biz, isAligned ? 'aligned' : 'unaligned');
          })
        ) : (
          <View style={styles.emptySection}>
            <Text style={[styles.emptySectionText, { color: colors.textSecondary }]}>
              {localDistance === null
                ? 'No businesses found'
                : `No businesses found within ${localDistance} mile${localDistance !== 1 ? 's' : ''}`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  localHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  localHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  localTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  distanceFilterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  distanceOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  distanceFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  businessList: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  businessCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  businessCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  businessLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  businessLogo: {
    width: '100%',
    height: '100%',
  },
  businessCardContent: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
  },
  businessScoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessScore: {
    fontSize: 24,
    fontWeight: '700',
  },
  emptySection: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptySectionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  enableLocationButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  enableLocationButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
