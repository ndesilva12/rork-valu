import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { UserProfile, Cause, Charity, AccountType, BusinessInfo, UserDetails } from '@/types';

// Helper function to remove undefined fields from an object
function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};

  for (const key in obj) {
    if (obj[key] !== undefined) {
      // Recursively clean arrays of objects
      if (Array.isArray(obj[key])) {
        cleaned[key] = obj[key].map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            return removeUndefinedFields(item);
          }
          return item;
        });
      }
      // Recursively clean nested objects
      else if (typeof obj[key] === 'object' && obj[key] !== null) {
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
  // Use removeUndefinedFields to recursively clean everything
  const cleaned = removeUndefinedFields({
    causes: profile.causes || [],
    searchHistory: profile.searchHistory || [],
    donationAmount: profile.donationAmount ?? 0,
    selectedCharities: profile.selectedCharities || [],
    ...(profile.promoCode !== undefined && { promoCode: profile.promoCode }),
    ...(profile.accountType !== undefined && { accountType: profile.accountType }),
    ...(profile.businessInfo !== undefined && { businessInfo: profile.businessInfo }),
    ...(profile.userDetails !== undefined && { userDetails: profile.userDetails }),
  });

  console.log('[Firebase cleanUserProfile] Cleaned profile:', JSON.stringify(cleaned, null, 2));

  return cleaned as Partial<UserProfile>;
}

/**
 * Save user profile to Firebase Firestore
 * @param userId - The Clerk user ID
 * @param profile - The user profile data
 */
export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  try {
    console.log('[Firebase] 🔄 Saving profile for user:', userId);
    console.log('[Firebase] Profile data:', JSON.stringify(profile, null, 2));

    // Clean the profile to remove any undefined fields
    const cleanedProfile = cleanUserProfile(profile);
    console.log('[Firebase] Cleaned profile:', JSON.stringify(cleanedProfile, null, 2));

    const userRef = doc(db, 'users', userId);
    const dataToSave = {
      ...cleanedProfile,
      updatedAt: serverTimestamp(),
    };

    console.log('[Firebase] About to call setDoc with merge:true for user:', userId);
    await setDoc(userRef, dataToSave, { merge: true });
    console.log('[Firebase] ✅ setDoc completed successfully');

    // Verify the save by reading back
    const savedDoc = await getDoc(userRef);
    if (savedDoc.exists()) {
      console.log('[Firebase] ✅ Verified - document exists with data:', JSON.stringify(savedDoc.data(), null, 2));
    } else {
      console.error('[Firebase] ⚠️ Document does not exist after save!');
    }
  } catch (error) {
    console.error('[Firebase] ❌ Error saving profile:', error);
    if (error instanceof Error) {
      console.error('[Firebase] Error code:', (error as any).code);
      console.error('[Firebase] Error message:', error.message);
      console.error('[Firebase] Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Update user metadata (email, name, location, etc.)
 * @param userId - The Clerk user ID
 * @param metadata - User metadata to update
 */
export async function updateUserMetadata(
  userId: string,
  metadata: {
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    imageUrl?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
  }
): Promise<void> {
  try {
    console.log('[Firebase] Updating user metadata for:', userId);

    const userRef = doc(db, 'users', userId);

    // Build update object with only defined fields
    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (metadata.email !== undefined) updateData.email = metadata.email;
    if (metadata.firstName !== undefined) updateData.firstName = metadata.firstName;
    if (metadata.lastName !== undefined) updateData.lastName = metadata.lastName;
    if (metadata.fullName !== undefined) updateData.fullName = metadata.fullName;
    if (metadata.imageUrl !== undefined) updateData.imageUrl = metadata.imageUrl;
    if (metadata.location !== undefined) {
      updateData.location = removeUndefinedFields(metadata.location);
    }

    await setDoc(userRef, updateData, { merge: true });

    console.log('[Firebase] ✅ User metadata updated successfully');
  } catch (error) {
    console.error('[Firebase] ❌ Error updating user metadata:', error);
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
    console.log('[Firebase getUserProfile] 🔄 Fetching profile for user:', userId);

    if (!db) {
      console.error('[Firebase getUserProfile] ❌ db is null or undefined!');
      throw new Error('Firebase db not initialized');
    }

    const userRef = doc(db, 'users', userId);
    console.log('[Firebase getUserProfile] 📍 Document reference created');

    const userSnap = await getDoc(userRef);
    console.log('[Firebase getUserProfile] 📦 Document snapshot received, exists:', userSnap.exists());

    if (userSnap.exists()) {
      const data = userSnap.data();
      console.log('[Firebase getUserProfile] ✅ Document data:', JSON.stringify(data, null, 2));

      // Ensure required fields have defaults
      const profile = {
        causes: data.causes || [],
        searchHistory: data.searchHistory || [],
        promoCode: data.promoCode,
        donationAmount: data.donationAmount ?? 0,
        selectedCharities: data.selectedCharities || [],
        accountType: data.accountType,
        businessInfo: data.businessInfo,
        userDetails: data.userDetails,
      };

      console.log('[Firebase getUserProfile] 📤 Returning profile with', profile.causes.length, 'causes');
      return profile;
    } else {
      console.log('[Firebase getUserProfile] ⚠️ No document found for user:', userId);
      return null;
    }
  } catch (error) {
    console.error('[Firebase getUserProfile] ❌ Error fetching profile:', error);
    if (error instanceof Error) {
      console.error('[Firebase getUserProfile] Error message:', error.message);
      console.error('[Firebase getUserProfile] Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Create a new user in Firebase Firestore
 * @param userId - The Clerk user ID
 * @param userData - User data including email, name, etc.
 * @param initialProfile - Initial profile data (optional)
 */
export async function createUser(
  userId: string,
  userData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    imageUrl?: string;
  },
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

    // Build user document with only defined fields
    const userDoc: Record<string, any> = {
      ...cleanedProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add user data fields only if they're defined
    if (userData.email) userDoc.email = userData.email;
    if (userData.firstName) userDoc.firstName = userData.firstName;
    if (userData.lastName) userDoc.lastName = userData.lastName;
    if (userData.fullName) userDoc.fullName = userData.fullName;
    if (userData.imageUrl) userDoc.imageUrl = userData.imageUrl;

    await setDoc(userRef, userDoc);

    console.log('[Firebase] ✅ User created successfully');
  } catch (error) {
    console.error('[Firebase] ❌ Error creating user:', error);
    throw error;
  }
}
