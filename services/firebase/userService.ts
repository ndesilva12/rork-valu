import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { UserProfile, Cause, Charity, AccountType, BusinessInfo, UserDetails } from '@/types';

// Helper function to remove undefined fields from an object
function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};

  for (const key in obj) {
    if (obj[key] !== undefined) {
      // Recursively clean nested objects
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        cleaned[key] = removeUndefinedFields(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
  }

  return cleaned as Partial<T>;
}

// Clean user profile to ensure no undefined fields
function cleanUserProfile(profile: UserProfile): Partial<UserProfile> {
  const cleaned: Partial<UserProfile> = {
    causes: profile.causes || [],
    searchHistory: profile.searchHistory || [],
    donationAmount: profile.donationAmount ?? 0,
    selectedCharities: profile.selectedCharities || [],
  };

  // Only add fields that are actually defined
  if (profile.promoCode !== undefined) {
    cleaned.promoCode = profile.promoCode;
  }

  if (profile.accountType !== undefined) {
    cleaned.accountType = profile.accountType;
  }

  if (profile.businessInfo !== undefined) {
    cleaned.businessInfo = removeUndefinedFields(profile.businessInfo) as BusinessInfo;
  }

  if (profile.userDetails !== undefined) {
    cleaned.userDetails = removeUndefinedFields(profile.userDetails) as UserDetails;
  }

  return cleaned;
}

/**
 * Save user profile to Firebase Firestore
 * @param userId - The Clerk user ID
 * @param profile - The user profile data
 */
export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  try {
    console.log('[Firebase] Saving profile for user:', userId);

    // Clean the profile to remove any undefined fields
    const cleanedProfile = cleanUserProfile(profile);

    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...cleanedProfile,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('[Firebase] ✅ Profile saved successfully');
  } catch (error) {
    console.error('[Firebase] ❌ Error saving profile:', error);
    if (error instanceof Error) {
      console.error('[Firebase] Error code:', (error as any).code);
      console.error('[Firebase] Error message:', error.message);
    }
    throw error;
  }
}

/**
 * Get user profile from Firebase Firestore
 * @param userId - The Clerk user ID
 * @returns The user profile or null if not found
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log('[Firebase] Fetching profile for user:', userId);

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      console.log('[Firebase] ✅ Profile fetched successfully');

      // Ensure required fields have defaults
      return {
        causes: data.causes || [],
        searchHistory: data.searchHistory || [],
        promoCode: data.promoCode,
        donationAmount: data.donationAmount ?? 0,
        selectedCharities: data.selectedCharities || [],
        accountType: data.accountType,
        businessInfo: data.businessInfo,
        userDetails: data.userDetails,
      };
    } else {
      console.log('[Firebase] No profile found for user');
      return null;
    }
  } catch (error) {
    console.error('[Firebase] ❌ Error fetching profile:', error);
    throw error;
  }
}

/**
 * Create a new user in Firebase Firestore
 * @param userId - The Clerk user ID
 * @param email - User's email
 * @param initialProfile - Initial profile data (optional)
 */
export async function createUser(
  userId: string,
  email: string,
  initialProfile?: Partial<UserProfile>
): Promise<void> {
  try {
    console.log('[Firebase] Creating new user:', userId);

    const userRef = doc(db, 'users', userId);

    // Default profile with no undefined fields
    const defaultProfile: UserProfile = {
      causes: [],
      searchHistory: [],
      donationAmount: 0,
      selectedCharities: [],
    };

    const profile = { ...defaultProfile, ...initialProfile };
    const cleanedProfile = cleanUserProfile(profile);

    await setDoc(userRef, {
      ...cleanedProfile,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('[Firebase] ✅ User created successfully');
  } catch (error) {
    console.error('[Firebase] ❌ Error creating user:', error);
    throw error;
  }
}
