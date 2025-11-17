import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, List as ListIcon, Globe, Lock, MapPin, User, Eye, EyeOff, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { UserProfile } from '@/types';
import { getUserLists, copyListToLibrary } from '@/services/firebase/listService';
import { UserList } from '@/types/library';
import EndorsedBadge from '@/components/EndorsedBadge';
import { calculateAlignmentScore } from '@/services/firebase/businessService';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { isDarkMode, clerkUser, profile: currentUserProfile } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const scrollViewRef = useRef<ScrollView>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyingListId, setCopyingListId] = useState<string | null>(null);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get user profile
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        setError('User not found');
        setIsLoading(false);
        return;
      }

      const profileData = userDoc.data() as UserProfile;

      // Check if profile is public
      if (!profileData.isPublicProfile && userId !== clerkUser?.id) {
        setError('This profile is private');
        setIsLoading(false);
        return;
      }

      setUserProfile(profileData);

      // Get user's public lists (or all lists if viewing own profile)
      const lists = await getUserLists(userId);
      const publicLists = userId === clerkUser?.id
        ? lists
        : lists.filter(list => list.isPublic);

      setUserLists(publicLists);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyList = async (listId: string) => {
    if (!clerkUser?.id) {
      Alert.alert('Error', 'You must be logged in to copy lists');
      return;
    }

    if (userId === clerkUser.id) {
      Alert.alert('Info', 'This is already in your library');
      return;
    }

    setCopyingListId(listId);

    try {
      const fullNameFromFirebase = currentUserProfile?.userDetails?.name;
      const fullNameFromClerk = clerkUser?.unsafeMetadata?.fullName as string;
      const firstNameLastName = clerkUser?.firstName && clerkUser?.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : '';
      const firstName = clerkUser?.firstName;
      const userName = fullNameFromFirebase || fullNameFromClerk || firstNameLastName || firstName || 'My Library';

      await copyListToLibrary(listId, clerkUser.id, userName);

      if (Platform.OS === 'web') {
        window.alert('List copied to your library!');
      } else {
        Alert.alert('Success', 'List copied to your library!');
      }
    } catch (error: any) {
      console.error('Error copying list:', error);
      const errorMessage = error?.message || 'Could not copy list. Please try again.';
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setCopyingListId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error || !userProfile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Profile Not Available</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error || 'This profile doesn\'t exist or is private.'}
          </Text>
          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/home')}
            activeOpacity={0.7}
          >
            <Text style={[styles.homeButtonText, { color: colors.white }]}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const userDetails = userProfile.userDetails;
  const userName = userDetails?.name || 'User';
  const isOwnProfile = userId === clerkUser?.id;
  const profileImageUrl = userDetails?.profileImage;

  // Calculate alignment score if viewing someone else's profile
  let alignmentData = {
    isAligned: false,
    alignmentStrength: 50
  };

  if (!isOwnProfile && userProfile.causes && currentUserProfile?.causes && currentUserProfile.causes.length > 0) {
    const rawScore = calculateAlignmentScore(currentUserProfile.causes, userProfile.causes);
    const alignmentScore = Math.round(50 + (rawScore * 0.8));
    alignmentData = {
      isAligned: alignmentScore >= 50,
      alignmentStrength: Math.max(10, Math.min(90, alignmentScore))
    };
  }

  const alignmentColor = alignmentData.isAligned ? colors.success : colors.danger;
  const AlignmentIcon = alignmentData.isAligned ? TrendingUp : TrendingDown;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={Platform.OS === 'web' ? styles.webContent : undefined}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Container */}
        <View style={styles.heroImageContainer}>
          <Image
            source={{ uri: profileImageUrl || 'https://via.placeholder.com/800x130/4A90E2/FFFFFF?text=Profile' }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            priority="high"
            placeholder={{ blurhash: 'LGF5?xoffQj[~qoffQof?bofj[ay' }}
          />

          {/* Back button on hero */}
          <TouchableOpacity
            style={[styles.backButtonOverlay, { backgroundColor: colors.backgroundSecondary + 'DD' }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Header with profile image, user info, and alignment score */}
          <View style={styles.header}>
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.headerLogo}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.headerLogoPlaceholder, { backgroundColor: colors.primary }]}>
                <User size={28} color={colors.white} strokeWidth={2} />
              </View>
            )}

            <View style={styles.titleContainer}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              </View>
              {userDetails?.location && (
                <View style={styles.locationRow}>
                  <MapPin size={14} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    {userDetails.location}
                  </Text>
                </View>
              )}
            </View>

            {/* Show alignment score only when viewing another user's profile */}
            {!isOwnProfile && (
              <View style={[styles.scoreCircle, { borderColor: alignmentColor, backgroundColor: colors.backgroundSecondary }]}>
                <AlignmentIcon size={20} color={alignmentColor} strokeWidth={2.5} />
                <Text style={[styles.scoreNumber, { color: alignmentColor }]}>
                  {alignmentData.alignmentStrength}
                </Text>
              </View>
            )}

            {/* Show privacy badge when viewing own profile */}
            {isOwnProfile && (
              <View style={[styles.privacyBadge, { backgroundColor: userProfile.isPublicProfile ? colors.primary : colors.backgroundSecondary }]}>
                {userProfile.isPublicProfile ? (
                  <Eye size={16} color={colors.white} />
                ) : (
                  <EyeOff size={16} color={colors.textSecondary} />
                )}
              </View>
            )}
          </View>

          {userDetails?.description && (
            <Text style={[styles.userDescription, { color: colors.textSecondary }]}>
              {userDetails.description}
            </Text>
          )}

          {/* Library Section - Matches home tab library format */}
          <View style={styles.librarySection}>
            <Text style={[styles.librarySectionTitle, { color: colors.text }]}>
              {isOwnProfile ? 'My Library' : `${userName}'s Library`}
            </Text>

            {userLists.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <ListIcon size={48} color={colors.textSecondary} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {isOwnProfile ? 'No lists yet' : 'No public lists'}
                </Text>
              </View>
            ) : (
              <View style={styles.listsContainer}>
                {userLists.map((list) => {
                  const isExpanded = expandedListId === list.id;
                  const isEndorsed = list.name === userName || (userLists.length > 0 && list.id === userLists.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0].id);

                  return (
                    <View key={list.id} style={styles.listWrapper}>
                      {/* List Header */}
                      <TouchableOpacity
                        style={[styles.listHeader, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                        onPress={() => setExpandedListId(isExpanded ? null : list.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.listHeaderLeft}>
                          <View style={[styles.listIconContainer, { backgroundColor: colors.primary + '20' }]}>
                            <ListIcon size={20} color={colors.primary} strokeWidth={2} />
                          </View>
                          <View style={styles.listHeaderInfo}>
                            <View style={styles.listTitleRow}>
                              <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
                                {list.name}
                              </Text>
                              {isEndorsed && <EndorsedBadge isDarkMode={isDarkMode} size="small" />}
                            </View>
                            <View style={styles.listMetaRow}>
                              <Text style={[styles.listItemCount, { color: colors.textSecondary }]}>
                                {list.entries.length} {list.entries.length === 1 ? 'item' : 'items'}
                              </Text>
                              {list.isPublic ? (
                                <View style={styles.publicIndicator}>
                                  <Globe size={12} color={colors.primary} strokeWidth={2} />
                                </View>
                              ) : (
                                <View style={styles.privateIndicator}>
                                  <Lock size={12} color={colors.textSecondary} strokeWidth={2} />
                                </View>
                              )}
                            </View>
                            {list.description && (
                              <Text style={[styles.listDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                                {list.description}
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Copy Button - Only show if not own profile and list is public */}
                        {!isOwnProfile && list.isPublic && (
                          <TouchableOpacity
                            style={[styles.copyButton, { backgroundColor: colors.primary }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleCopyList(list.id);
                            }}
                            activeOpacity={0.7}
                            disabled={copyingListId === list.id}
                          >
                            {copyingListId === list.id ? (
                              <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                              <Plus size={18} color={colors.white} strokeWidth={2.5} />
                            )}
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>

                      {/* List Items - Expanded View */}
                      {isExpanded && list.entries.length > 0 && (
                        <View style={[styles.listItemsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          {list.entries.slice(0, 5).map((entry, index) => (
                            <View
                              key={entry.id}
                              style={[
                                styles.listItem,
                                index < Math.min(4, list.entries.length - 1) && { borderBottomWidth: 1, borderBottomColor: colors.border }
                              ]}
                            >
                              <Text style={[styles.listItemText, { color: colors.text }]} numberOfLines={1}>
                                {entry.name || entry.brandName || entry.businessName || 'Item'}
                              </Text>
                            </View>
                          ))}
                          {list.entries.length > 5 && (
                            <Text style={[styles.moreItemsText, { color: colors.textSecondary }]}>
                              +{list.entries.length - 5} more
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  webContent: {
    maxWidth: 768,
    alignSelf: 'center' as const,
    width: '100%',
  },
  heroImageContainer: {
    width: '100%',
    height: 130,
    position: 'relative' as const,
  },
  heroImage: {
    width: '100%',
    height: 130,
  },
  backButtonOverlay: {
    position: 'absolute' as const,
    bottom: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  headerLogo: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  locationText: {
    fontSize: 12,
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 3,
  },
  privacyBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  userDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  librarySection: {
    marginTop: 8,
  },
  librarySectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  listsContainer: {
    gap: 12,
  },
  listWrapper: {
    marginBottom: 0,
  },
  listHeader: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  listIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeaderInfo: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    flex: 1,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  listItemCount: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  publicIndicator: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateIndicator: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemsContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItem: {
    padding: 12,
  },
  listItemText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: '600' as const,
    padding: 12,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  homeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
