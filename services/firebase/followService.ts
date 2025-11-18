/**
 * Follow Service
 * Handles following/unfollowing accounts and retrieving follow relationships
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/firebase';

export type AccountType = 'person' | 'brand' | 'business';

export interface FollowRelationship {
  id: string; // document ID (same as accountId)
  accountId: string; // ID of the followed account
  accountType: AccountType;
  accountName: string;
  profileImage?: string;
  followedAt: Date;
}

const USERS_COLLECTION = 'users';
const FOLLOWING_SUBCOLLECTION = 'following';
const FOLLOWERS_SUBCOLLECTION = 'followers';

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

/**
 * Follow an account
 * Creates a bidirectional relationship: adds to user's following and target's followers
 */
export const followAccount = async (
  userId: string,
  accountId: string,
  accountType: AccountType,
  accountName: string,
  profileImage?: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Add to user's following collection
    const followingRef = doc(
      db,
      USERS_COLLECTION,
      userId,
      FOLLOWING_SUBCOLLECTION,
      accountId
    );
    batch.set(followingRef, {
      accountId,
      accountType,
      accountName,
      profileImage: profileImage || null,
      followedAt: serverTimestamp(),
    });

    // Add to target account's followers collection
    const followerRef = doc(
      db,
      USERS_COLLECTION,
      accountId,
      FOLLOWERS_SUBCOLLECTION,
      userId
    );
    batch.set(followerRef, {
      accountId: userId,
      accountType: 'person', // Followers are always users/people
      followedAt: serverTimestamp(),
    });

    await batch.commit();
    console.log(`[FollowService] User ${userId} followed ${accountType} ${accountId}`);
  } catch (error) {
    console.error('[FollowService] Error following account:', error);
    throw error;
  }
};

/**
 * Unfollow an account
 * Removes the bidirectional relationship
 */
export const unfollowAccount = async (
  userId: string,
  accountId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Remove from user's following collection
    const followingRef = doc(
      db,
      USERS_COLLECTION,
      userId,
      FOLLOWING_SUBCOLLECTION,
      accountId
    );
    batch.delete(followingRef);

    // Remove from target account's followers collection
    const followerRef = doc(
      db,
      USERS_COLLECTION,
      accountId,
      FOLLOWERS_SUBCOLLECTION,
      userId
    );
    batch.delete(followerRef);

    await batch.commit();
    console.log(`[FollowService] User ${userId} unfollowed account ${accountId}`);
  } catch (error) {
    console.error('[FollowService] Error unfollowing account:', error);
    throw error;
  }
};

/**
 * Check if user is following an account
 */
export const isFollowing = async (
  userId: string,
  accountId: string
): Promise<boolean> => {
  try {
    const followingRef = doc(
      db,
      USERS_COLLECTION,
      userId,
      FOLLOWING_SUBCOLLECTION,
      accountId
    );
    const followingSnap = await getDoc(followingRef);
    return followingSnap.exists();
  } catch (error) {
    console.error('[FollowService] Error checking following status:', error);
    return false;
  }
};

/**
 * Get all accounts a user is following
 */
export const getFollowing = async (userId: string): Promise<FollowRelationship[]> => {
  try {
    const followingRef = collection(
      db,
      USERS_COLLECTION,
      userId,
      FOLLOWING_SUBCOLLECTION
    );
    const q = query(followingRef, orderBy('followedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const following: FollowRelationship[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      following.push({
        id: doc.id,
        accountId: data.accountId,
        accountType: data.accountType,
        accountName: data.accountName,
        profileImage: data.profileImage,
        followedAt: timestampToDate(data.followedAt),
      });
    });

    return following;
  } catch (error) {
    console.error('[FollowService] Error getting following:', error);
    return [];
  }
};

/**
 * Get all followers of an account
 */
export const getFollowers = async (accountId: string): Promise<FollowRelationship[]> => {
  try {
    const followersRef = collection(
      db,
      USERS_COLLECTION,
      accountId,
      FOLLOWERS_SUBCOLLECTION
    );
    const q = query(followersRef, orderBy('followedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const followers: FollowRelationship[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      followers.push({
        id: doc.id,
        accountId: data.accountId,
        accountType: data.accountType,
        accountName: data.accountName || 'Unknown',
        profileImage: data.profileImage,
        followedAt: timestampToDate(data.followedAt),
      });
    });

    return followers;
  } catch (error) {
    console.error('[FollowService] Error getting followers:', error);
    return [];
  }
};

/**
 * Get follow counts for an account
 */
export const getFollowCounts = async (
  accountId: string
): Promise<{ following: number; followers: number }> => {
  try {
    const [followingSnapshot, followersSnapshot] = await Promise.all([
      getDocs(collection(db, USERS_COLLECTION, accountId, FOLLOWING_SUBCOLLECTION)),
      getDocs(collection(db, USERS_COLLECTION, accountId, FOLLOWERS_SUBCOLLECTION)),
    ]);

    return {
      following: followingSnapshot.size,
      followers: followersSnapshot.size,
    };
  } catch (error) {
    console.error('[FollowService] Error getting follow counts:', error);
    return { following: 0, followers: 0 };
  }
};
