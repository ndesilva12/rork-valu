import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, List as ListIcon, ExternalLink, Globe, Lock, MapPin } from 'lucide-react-native';
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
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { UserProfile } from '@/types';
import { getUserLists, copyListToLibrary } from '@/services/firebase/listService';
import { UserList } from '@/types/library';
import EndorsedBadge from '@/components/EndorsedBadge';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { isDarkMode, clerkUser, profile: currentUserProfile } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyingListId, setCopyingListId] = useState<string | null>(null);

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
        <Stack.Screen
          options={{
            title: 'Loading...',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
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
        <Stack.Screen
          options={{
            title: 'Error',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            ),
          }}
        />
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: userName,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.profileInfo}>
            {userDetails?.profileImage ? (
              <Image
                source={{ uri: userDetails.profileImage }}
                style={styles.profileImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={[styles.profileImageText, { color: colors.white }]}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileTextInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
                {userProfile.isPublicProfile && (
                  <Globe size={16} color={colors.primary} strokeWidth={2} />
                )}
              </View>
              {userDetails?.location && (
                <View style={styles.locationRow}>
                  <MapPin size={14} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    {userDetails.location}
                  </Text>
                </View>
              )}
              {userDetails?.description && (
                <Text style={[styles.bio, { color: colors.text }]}>{userDetails.description}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Library Section */}
        <View style={styles.librarySection}>
          <View style={styles.librarySectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isOwnProfile ? 'My Library' : `${userName}'s Library`}
            </Text>
            <Text style={[styles.listCount, { color: colors.textSecondary }]}>
              {userLists.length} {userLists.length === 1 ? 'list' : 'lists'}
            </Text>
          </View>

          {userLists.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundSecondary }]}>
              <ListIcon size={48} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isOwnProfile ? 'No lists yet' : 'No public lists'}
              </Text>
            </View>
          ) : (
            <View style={styles.listsContainer}>
              {userLists.map((list) => (
                <View
                  key={list.id}
                  style={[styles.listCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <TouchableOpacity
                    style={styles.listCardContent}
                    onPress={() => router.push(`/list/${list.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.listCardHeader}>
                      <View style={[styles.listIconContainer, list.isEndorsed ? { backgroundColor: colors.primary } : { backgroundColor: colors.primaryLight + '20' }]}>
                        <ListIcon size={20} color={list.isEndorsed ? colors.white : colors.primary} strokeWidth={2} />
                      </View>
                      <View style={styles.listCardInfo}>
                        <View style={styles.listTitleRow}>
                          <Text style={[styles.listCardTitle, { color: colors.text }]} numberOfLines={1}>
                            {list.name}
                          </Text>
                          {list.isEndorsed && (
                            <EndorsedBadge isDarkMode={isDarkMode} size="small" />
                          )}
                        </View>
                        <View style={styles.listMetaRow}>
                          <Text style={[styles.listCardCount, { color: colors.textSecondary }]}>
                            {list.entries.length} {list.entries.length === 1 ? 'item' : 'items'}
                          </Text>
                          {list.isPublic ? (
                            <View style={styles.publicBadge}>
                              <Globe size={12} color={colors.primary} strokeWidth={2} />
                              <Text style={[styles.publicBadgeText, { color: colors.primary }]}>Public</Text>
                            </View>
                          ) : (
                            <View style={styles.privateBadge}>
                              <Lock size={12} color={colors.textSecondary} strokeWidth={2} />
                              <Text style={[styles.privateBadgeText, { color: colors.textSecondary }]}>Private</Text>
                            </View>
                          )}
                        </View>
                        {list.description && (
                          <Text style={[styles.listCardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                            {list.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Copy Button - Only show if not own profile and list is public */}
                  {!isOwnProfile && list.isPublic && (
                    <TouchableOpacity
                      style={[styles.copyButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleCopyList(list.id)}
                      activeOpacity={0.7}
                      disabled={copyingListId === list.id}
                    >
                      {copyingListId === list.id ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Plus size={20} color={colors.white} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
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
  content: {
    padding: 16,
    paddingBottom: 32,
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
    fontWeight: '700',
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
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  profileHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  profileInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    fontSize: 32,
    fontWeight: '700',
  },
  profileTextInfo: {
    flex: 1,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },
  librarySection: {
    marginTop: 8,
  },
  librarySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  listCount: {
    fontSize: 14,
    fontWeight: '600',
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
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  listCardContent: {
    flex: 1,
  },
  listCardHeader: {
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
  listCardInfo: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  listCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  listCardCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  publicBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listCardDescription: {
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
});
