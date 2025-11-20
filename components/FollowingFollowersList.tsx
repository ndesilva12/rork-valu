/**
 * FollowingFollowersList Component
 * Displays list of accounts user is following or followers of user
 * With filtering by type and sorting by alignment score
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MoreVertical, UserPlus, UserMinus, Share2, Award } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { getFollowing, getFollowers, Follow, followEntity, unfollowEntity, isFollowing } from '@/services/firebase/followService';
import { useData } from '@/contexts/DataContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { getLogoUrl } from '@/lib/logo';
import { calculateBrandScore } from '@/lib/scoring';
import ItemOptionsModal from '@/components/ItemOptionsModal';
import { useUser } from '@/contexts/UserContext';

type FilterType = 'all' | 'brand' | 'business' | 'user';

interface FollowingFollowersListProps {
  mode: 'following' | 'followers';
  userId: string;
  entityType?: 'user' | 'brand' | 'business'; // For followers mode
  isDarkMode?: boolean;
  userCauses?: string[];
}

interface EnrichedFollow extends Follow {
  name: string;
  category?: string;
  website?: string;
  logoUrl?: string;
  profileImage?: string;
  alignmentScore?: number;
}

export default function FollowingFollowersList({
  mode,
  userId,
  entityType = 'user',
  isDarkMode = false,
  userCauses = [],
}: FollowingFollowersListProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const router = useRouter();
  const { brands, valuesMatrix } = useData();
  const { clerkUser } = useUser();

  const [loading, setLoading] = useState(true);
  const [follows, setFollows] = useState<EnrichedFollow[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedFollow, setSelectedFollow] = useState<EnrichedFollow | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadFollows();
  }, [userId, mode]);

  const loadFollows = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch follow records
      const followRecords = mode === 'following'
        ? await getFollowing(userId)
        : await getFollowers(userId, entityType);

      // Enrich each follow with entity details
      const enrichedPromises = followRecords.map(async (follow) => {
        const entityId = mode === 'following' ? follow.followedId : follow.followerId;
        const type = mode === 'following' ? follow.followedType : 'user';

        let enriched: EnrichedFollow = {
          ...follow,
          name: 'Unknown',
        };

        try {
          if (type === 'brand') {
            // Fetch brand details
            const brand = brands.find(b => b.id === entityId);
            if (brand) {
              enriched.name = brand.name;
              enriched.category = brand.category;
              enriched.website = brand.website;
              enriched.logoUrl = getLogoUrl(brand.website || '');

              // Calculate alignment score
              if (userCauses.length > 0 && valuesMatrix) {
                const score = calculateBrandScore(brand, valuesMatrix, userCauses);
                enriched.alignmentScore = score;
              }
            }
          } else if (type === 'business') {
            // Fetch business details from users collection
            const businessRef = doc(db, 'users', entityId);
            const businessSnap = await getDoc(businessRef);
            if (businessSnap.exists()) {
              const userData = businessSnap.data();
              if (userData.accountType === 'business' && userData.businessInfo) {
                enriched.name = userData.businessInfo.name || 'Unknown Business';
                enriched.category = userData.businessInfo.category;
                enriched.website = userData.businessInfo.website;
                enriched.logoUrl = userData.businessInfo.logoUrl || getLogoUrl(userData.businessInfo.website || '');
                // Could calculate alignment based on endorsed brand
              } else {
                enriched.name = userData.fullName || 'Unknown Business';
              }
            }
          } else if (type === 'user') {
            // Fetch user details
            const userRef = doc(db, 'users', entityId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              enriched.name = userData.userDetails?.name || userData.name || 'Unknown User';
              enriched.profileImage = userData.userDetails?.profileImage || userData.profileImage;
              // Could calculate alignment based on shared causes
            }
          }
        } catch (error) {
          console.error(`[FollowingFollowersList] Error enriching ${type}:`, error);
        }

        return enriched;
      });

      const enrichedFollows = await Promise.all(enrichedPromises);

      // Sort by alignment score (highest first), then by name
      enrichedFollows.sort((a, b) => {
        if (a.alignmentScore !== undefined && b.alignmentScore !== undefined) {
          return b.alignmentScore - a.alignmentScore;
        }
        if (a.alignmentScore !== undefined) return -1;
        if (b.alignmentScore !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });

      setFollows(enrichedFollows);
    } catch (error) {
      console.error('[FollowingFollowersList] Error loading follows:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFollows = useMemo(() => {
    if (filterType === 'all') return follows;

    return follows.filter(follow => {
      const type = mode === 'following' ? follow.followedType : 'user';
      return type === filterType;
    });
  }, [follows, filterType, mode]);

  const handleFollowToggle = async (follow: EnrichedFollow) => {
    if (!clerkUser?.id) {
      Alert.alert('Error', 'You must be logged in to follow/unfollow');
      return;
    }

    const entityId = mode === 'following' ? follow.followedId : follow.followerId;
    const type = mode === 'following' ? follow.followedType : 'user';

    try {
      // Check current follow status
      const isCurrentlyFollowing = await isFollowing(clerkUser.id, entityId, type);

      if (isCurrentlyFollowing) {
        await unfollowEntity(clerkUser.id, entityId, type);
        Alert.alert('Success', `Unfollowed ${follow.name}`);
      } else {
        await followEntity(clerkUser.id, entityId, type);
        Alert.alert('Success', `Following ${follow.name}`);
      }

      // Reload the list
      await loadFollows();
    } catch (error) {
      console.error('[FollowingFollowersList] Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleShare = async (follow: EnrichedFollow) => {
    const entityId = mode === 'following' ? follow.followedId : follow.followerId;
    const type = mode === 'following' ? follow.followedType : 'user';

    let shareUrl = '';
    if (type === 'brand') {
      shareUrl = `upright-money://brand/${entityId}`;
    } else if (type === 'business') {
      shareUrl = `upright-money://business/${entityId}`;
    } else if (type === 'user') {
      shareUrl = `upright-money://user/${entityId}`;
    }

    try {
      await Share.share({
        message: `Check out ${follow.name} on Upright Money: ${shareUrl}`,
        title: follow.name,
      });
    } catch (error) {
      console.error('[FollowingFollowersList] Error sharing:', error);
    }
  };

  const handleEndorse = async (follow: EnrichedFollow) => {
    const entityId = mode === 'following' ? follow.followedId : follow.followerId;
    const type = mode === 'following' ? follow.followedType : 'user';

    // Navigate to appropriate endorsement flow
    if (type === 'brand') {
      router.push({ pathname: '/brand/[id]', params: { id: entityId } });
    } else if (type === 'business') {
      router.push({ pathname: '/business/[id]', params: { id: entityId } });
    } else {
      Alert.alert('Info', 'User endorsement coming soon');
    }
  };

  const handleOpenMenu = (follow: EnrichedFollow) => {
    setSelectedFollow(follow);
    setModalVisible(true);
  };

  const renderFollowCard = (follow: EnrichedFollow) => {
    const type = mode === 'following' ? follow.followedType : 'user';
    const entityId = mode === 'following' ? follow.followedId : follow.followerId;

    const handlePress = () => {
      if (type === 'brand') {
        router.push({ pathname: '/brand/[id]', params: { id: entityId } });
      } else if (type === 'business') {
        router.push({ pathname: '/business/[id]', params: { id: entityId } });
      } else if (type === 'user') {
        router.push({ pathname: '/user/[userId]', params: { userId: entityId } });
      }
    };

    const scoreColor = follow.alignmentScore !== undefined
      ? (follow.alignmentScore >= 50 ? colors.primary : colors.danger)
      : colors.textSecondary;

    return (
      <TouchableOpacity
        key={follow.id}
        style={[styles.card, { backgroundColor: 'transparent' }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Logo/Avatar */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: follow.logoUrl || follow.profileImage || getLogoUrl('') }}
              style={styles.logo}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {follow.name}
            </Text>
            {follow.category && (
              <Text style={[styles.category, { color: colors.textSecondary }]} numberOfLines={1}>
                {follow.category}
              </Text>
            )}
            <Text style={[styles.type, { color: colors.textSecondary }]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </View>

          {/* Score */}
          {follow.alignmentScore !== undefined && (
            <View style={styles.scoreContainer}>
              <Text style={[styles.score, { color: scoreColor }]}>
                {Math.round(follow.alignmentScore)}
              </Text>
            </View>
          )}

          {/* Action Menu Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={(e) => {
              e.stopPropagation();
              handleOpenMenu(follow);
            }}
            activeOpacity={0.7}
          >
            <MoreVertical size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading {mode}...
        </Text>
      </View>
    );
  }

  if (follows.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {mode === 'following' ? 'Not following anyone yet' : 'No followers yet'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'all' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setFilterType('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, { color: filterType === 'all' ? '#FFFFFF' : colors.text }]}>
            All ({follows.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'brand' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setFilterType('brand')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, { color: filterType === 'brand' ? '#FFFFFF' : colors.text }]}>
            Brands ({follows.filter(f => (mode === 'following' ? f.followedType : 'user') === 'brand').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'business' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setFilterType('business')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, { color: filterType === 'business' ? '#FFFFFF' : colors.text }]}>
            Businesses ({follows.filter(f => (mode === 'following' ? f.followedType : 'user') === 'business').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'user' && { backgroundColor: colors.primary },
            { borderColor: colors.border }
          ]}
          onPress={() => setFilterType('user')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, { color: filterType === 'user' ? '#FFFFFF' : colors.text }]}>
            Users ({follows.filter(f => (mode === 'following' ? f.followedType : 'user') === 'user').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredFollows.map(renderFollowCard)}
      </ScrollView>

      {/* Action Menu Modal */}
      {selectedFollow && (
        <ItemOptionsModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedFollow(null);
          }}
          itemName={selectedFollow.name}
          isDarkMode={isDarkMode}
          options={[
            {
              icon: Share2,
              label: 'Share',
              onPress: () => handleShare(selectedFollow),
            },
            {
              icon: UserPlus,
              label: 'Follow/Unfollow',
              onPress: () => handleFollowToggle(selectedFollow),
            },
            {
              icon: Award,
              label: 'Endorse',
              onPress: () => handleEndorse(selectedFollow),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    marginBottom: 2,
  },
  type: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  scoreContainer: {
    marginLeft: 12,
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
});
