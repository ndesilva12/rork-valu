import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { Cause, UserProfile, Charity, AccountType, BusinessInfo, UserDetails, BusinessMembership } from '@/types';
import { saveUserProfile, getUserProfile, createUser, updateUserMetadata, aggregateUserTransactions, aggregateBusinessTransactions } from '@/services/firebase/userService';
import { createList, getUserLists } from '@/services/firebase/listService';
import { hasPermission as checkTeamPermission, initializeBusinessOwner } from '@/services/firebase/businessTeamService';

const PROFILE_KEY = '@user_profile';
const IS_NEW_USER_KEY = '@is_new_user';

// Generate a random 5-digit promo code
const generatePromoCode = (): string => {
  const digits = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `UP${digits}`;
};

export const [UserProvider, useUser] = createContextHook(() => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();
  const [profile, setProfile] = useState<UserProfile>({
    causes: [],
    searchHistory: [],
    promoCode: generatePromoCode(), // Always generate a promo code immediately
    donationAmount: 0,
    selectedCharities: [],
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!clerkUser) {
        console.log('[UserContext] ❌ No clerk user, resetting state');
        if (mounted) {
          setProfile({ causes: [], searchHistory: [], donationAmount: 0, selectedCharities: [] });
          setHasCompletedOnboarding(false);
          setIsNewUser(null);
          setIsLoading(false);
        }
        return;
      }

      console.log('[UserContext] ====== LOADING PROFILE ======');
      console.log('[UserContext] Clerk User ID:', clerkUser.id);
      console.log('[UserContext] Clerk Email:', clerkUser.primaryEmailAddress?.emailAddress);

      try {
        const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
        const isNewUserKey = `${IS_NEW_USER_KEY}_${clerkUser.id}`;

        // Check if this is a new user
        const storedIsNewUser = await AsyncStorage.getItem(isNewUserKey);
        const isFirstTime = storedIsNewUser === null;

        console.log('[UserContext] 🔍 AsyncStorage check:');
        console.log('[UserContext]   - isNewUserKey value:', storedIsNewUser);
        console.log('[UserContext]   - isFirstTime:', isFirstTime);

        // Try to load from Firebase first (source of truth)
        console.log('[UserContext] 🔄 Attempting to load from Firebase...');
        let firebaseProfile: UserProfile | null = null;
        try {
          firebaseProfile = await getUserProfile(clerkUser.id);
          if (firebaseProfile) {
            console.log('[UserContext] ✅ Firebase profile found:', JSON.stringify(firebaseProfile, null, 2));
          } else {
            console.log('[UserContext] ⚠️ No Firebase profile found for user');
          }
        } catch (firebaseError) {
          console.error('[UserContext] ❌ Failed to load from Firebase:', firebaseError);
        }

        if (firebaseProfile && mounted) {
          // Firebase has the profile - use it
          console.log('[UserContext] 📥 Using Firebase profile with', firebaseProfile.causes.length, 'causes');

          // Ensure promo code exists
          if (!firebaseProfile.promoCode) {
            firebaseProfile.promoCode = generatePromoCode();
            console.log('[UserContext] Generated new promo code:', firebaseProfile.promoCode);
          }

          // Ensure required fields are initialized
          firebaseProfile.id = clerkUser.id;
          firebaseProfile.donationAmount = firebaseProfile.donationAmount ?? 0;
          firebaseProfile.selectedCharities = firebaseProfile.selectedCharities ?? [];

          setProfile(firebaseProfile);
          setHasCompletedOnboarding(firebaseProfile.causes.length > 0);

          // Update local cache
          await AsyncStorage.setItem(storageKey, JSON.stringify(firebaseProfile));
        } else {
          // No Firebase profile - check local storage or create new
          const storedProfile = await AsyncStorage.getItem(storageKey);

          if (storedProfile && mounted) {
            const parsedProfile = JSON.parse(storedProfile) as UserProfile;
            console.log('[UserContext] Loaded profile from AsyncStorage with', parsedProfile.causes.length, 'causes');

            // Generate promo code if it doesn't exist
            if (!parsedProfile.promoCode) {
              parsedProfile.promoCode = generatePromoCode();
              console.log('[UserContext] Generated new promo code:', parsedProfile.promoCode);
            }

            parsedProfile.id = clerkUser.id;
            parsedProfile.donationAmount = parsedProfile.donationAmount ?? 0;
            parsedProfile.selectedCharities = parsedProfile.selectedCharities ?? [];

            setProfile(parsedProfile);
            setHasCompletedOnboarding(parsedProfile.causes.length > 0);

            // Sync to Firebase
            try {
              if (isFirstTime) {
                const userData = {
                  email: clerkUser.primaryEmailAddress?.emailAddress,
                  firstName: clerkUser.firstName || undefined,
                  lastName: clerkUser.lastName || undefined,
                  fullName: clerkUser.fullName || undefined,
                  imageUrl: clerkUser.imageUrl || undefined,
                };
                await createUser(clerkUser.id, userData, parsedProfile);
                console.log('[UserContext] ✅ New user created in Firebase');
              } else {
                await saveUserProfile(clerkUser.id, parsedProfile);
                console.log('[UserContext] ✅ Profile synced to Firebase');
              }
            } catch (syncError) {
              console.error('[UserContext] Failed to sync to Firebase:', syncError);
            }
          } else if (mounted) {
            console.log('[UserContext] No stored profile found, creating new profile');
            const newProfile: UserProfile = {
              id: clerkUser.id,
              causes: [],
              searchHistory: [],
              promoCode: generatePromoCode(),
              donationAmount: 0,
              selectedCharities: [],
            };
            setProfile(newProfile);
            setHasCompletedOnboarding(false);

            // Create user in Firebase
            try {
              const userData = {
                email: clerkUser.primaryEmailAddress?.emailAddress,
                firstName: clerkUser.firstName || undefined,
                lastName: clerkUser.lastName || undefined,
                fullName: clerkUser.fullName || undefined,
                imageUrl: clerkUser.imageUrl || undefined,
              };
              await createUser(clerkUser.id, userData, newProfile);
              console.log('[UserContext] ✅ New user created in Firebase');
            } catch (createError) {
              console.error('[UserContext] Failed to create user in Firebase:', createError);
            }

            // Save to local storage
            await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
          }
        }

        if (mounted) {
          if (isFirstTime) {
            console.log('[UserContext] 🆕 FIRST TIME USER - marking as new (isNewUser = true)');
            setIsNewUser(true);
            // Don't mark as false yet - wait until onboarding is complete
            // await AsyncStorage.setItem(isNewUserKey, 'false');
          } else {
            console.log('[UserContext] 👤 RETURNING USER - marking as existing (isNewUser = false)');
            setIsNewUser(false);
          }
          console.log('[UserContext] ====== PROFILE LOADING COMPLETE ======');
        }
      } catch (error) {
        console.error('[UserContext] Failed to load profile:', error);
        if (mounted) {
          const defaultProfile = {
            id: clerkUser.id,
            causes: [],
            searchHistory: [],
            promoCode: generatePromoCode(),
            donationAmount: 0,
            selectedCharities: [],
          };
          setProfile(defaultProfile);
          setHasCompletedOnboarding(false);
          setIsNewUser(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [clerkUser]);

  const addCauses = useCallback(async (causes: Cause[]) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot save causes: User not logged in');
      return;
    }

    console.log('[UserContext] Adding', causes.length, 'causes for user:', clerkUser.id);

    // Use functional update to avoid stale closure
    let newProfile: UserProfile | null = null;
    setProfile((prevProfile) => {
      newProfile = { ...prevProfile, causes };
      console.log('[UserContext] Updated profile with causes. PromoCode:', newProfile!.promoCode);
      return newProfile;
    });
    setHasCompletedOnboarding(causes.length > 0);

    // Wait for state update to propagate
    await new Promise(resolve => setTimeout(resolve, 0));

    if (!newProfile) {
      console.error('[UserContext] Failed to create new profile');
      return;
    }

    try {
      console.log('[UserContext] 🔄 Saving to AsyncStorage and Firebase...');

      // Save to AsyncStorage (local cache)
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      console.log('[UserContext] ✅ Profile saved to AsyncStorage');

      // Save to Firebase (source of truth)
      console.log('[UserContext] 🔄 Calling saveUserProfile...');
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Profile synced to Firebase successfully');

      // Mark user as no longer new after completing onboarding
      if (isNewUser === true && causes.length > 0) {
        console.log('[UserContext] 🎉 User completed onboarding - marking as existing user');
        const isNewUserKey = `${IS_NEW_USER_KEY}_${clerkUser.id}`;
        await AsyncStorage.setItem(isNewUserKey, 'false');
        setIsNewUser(false);

        // Create user's personal list with their name
        try {
          // Check if personal list already exists before creating
          const existingLists = await getUserLists(clerkUser.id);
          console.log('[UserContext] Checking existing lists:', existingLists.map(l => l.name));

          if (existingLists.length === 0) {
            // No lists exist yet - create the personal list
            // Try multiple sources for full name
            const fullNameFromClerk = clerkUser.unsafeMetadata?.fullName as string;
            const firstNameLastName = clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : '';
            const firstName = clerkUser.firstName;
            const userName = fullNameFromClerk || firstNameLastName || firstName || 'My List';

            console.log(`[UserContext] Creating personal list: "${userName}"`);
            await createList(clerkUser.id, userName, 'Your personal collection.');
            console.log('[UserContext] ✅ Personal list created successfully');
          } else {
            console.log('[UserContext] Personal list already exists, skipping creation');
          }
        } catch (listError) {
          console.error('[UserContext] ❌ Failed to create personal list:', listError);
          // Don't fail onboarding if list creation fails
        }
      }
    } catch (error) {
      console.error('[UserContext] ❌ Failed to save profile:', error);
      if (error instanceof Error) {
        console.error('[UserContext] Error details:', error.message, error.stack);
      }
    }
  }, [clerkUser, isNewUser]);

  const removeCauses = useCallback(async (causeIds: string[]) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot remove causes: User not logged in');
      return;
    }

    console.log('[UserContext] Removing', causeIds.length, 'causes for user:', clerkUser.id);

    let newProfile: UserProfile | null = null;
    setProfile((prevProfile) => {
      const newCauses = prevProfile.causes.filter(c => !causeIds.includes(c.id));
      newProfile = { ...prevProfile, causes: newCauses };
      return newProfile;
    });

    if (!newProfile) return;

    setHasCompletedOnboarding(newProfile.causes.length > 0);

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Causes removed and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to remove causes:', error);
    }
  }, [clerkUser]);

  const toggleCauseType = useCallback(async (cause: Cause, newType: 'support' | 'avoid' | 'remove') => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot toggle cause: User not logged in');
      return;
    }

    let newCauses: Cause[];
    if (newType === 'remove') {
      // Check if removing would result in less than 5 values
      if (profile.causes.length <= 5) {
        // Use Alert if available (React Native)
        if (typeof Alert !== 'undefined') {
          Alert.alert('Minimum Values Required', 'You must have at least 5 values selected at all times.');
        } else {
          console.warn('[UserContext] Cannot remove value: Minimum 5 values required');
        }
        return;
      }
      // Remove the cause entirely
      newCauses = profile.causes.filter(c => c.id !== cause.id);
    } else {
      const existingIndex = profile.causes.findIndex(c => c.id === cause.id);
      if (existingIndex >= 0) {
        // Update existing cause type
        newCauses = [...profile.causes];
        newCauses[existingIndex] = { ...cause, type: newType };
      } else {
        // Add new cause
        newCauses = [...profile.causes, { ...cause, type: newType }];
      }
    }

    const newProfile = { ...profile, causes: newCauses };
    console.log('[UserContext] Toggling cause', cause.name, 'to', newType);

    setProfile(newProfile);
    setHasCompletedOnboarding(newCauses.length > 0);

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Cause toggled and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to toggle cause:', error);
    }
  }, [clerkUser, profile]);

  const addToSearchHistory = useCallback(async (query: string) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot save search history: User not logged in');
      return;
    }
    const newHistory = [query, ...profile.searchHistory.filter(q => q !== query)].slice(0, 10);
    const newProfile = { ...profile, searchHistory: newHistory };
    setProfile(newProfile);

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
    } catch (error) {
      console.error('[UserContext] Failed to save search history:', error);
    }
  }, [profile, clerkUser]);

  const updateSelectedCharities = useCallback(async (charities: Charity[]) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot update charities: User not logged in');
      return;
    }

    console.log('[UserContext] Updating selected charities:', charities.length);

    let newProfile: UserProfile | null = null;
    setProfile((prevProfile) => {
      newProfile = { ...prevProfile, selectedCharities: charities };
      return newProfile;
    });

    if (!newProfile) return;

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Selected charities saved and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to save selected charities:', error);
    }
  }, [clerkUser]);

  const resetProfile = useCallback(async () => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot reset profile: User not logged in');
      return;
    }
    try {
      const emptyProfile: UserProfile = {
        id: clerkUser.id,
        causes: [],
        searchHistory: [],
        promoCode: profile.promoCode || generatePromoCode(),
        donationAmount: 0,
        selectedCharities: [],
      };
      setProfile(emptyProfile);
      setHasCompletedOnboarding(false);
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(emptyProfile));
      await saveUserProfile(clerkUser.id, emptyProfile);
      console.log('[UserContext] ✅ Profile reset and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to reset profile:', error);
    }
  }, [clerkUser, profile.promoCode]);

  const clearAllStoredData = useCallback(async () => {
    try {
      console.log('[UserContext] Clearing ALL AsyncStorage data');
      await AsyncStorage.clear();
      setProfile({
        causes: [],
        searchHistory: [],
        promoCode: generatePromoCode(),
        donationAmount: 0,
        selectedCharities: [],
      });
      setHasCompletedOnboarding(false);
      console.log('[UserContext] All data cleared successfully');
    } catch (error) {
      console.error('[UserContext] Failed to clear all data:', error);
    }
  }, []);

  const setAccountType = useCallback(async (accountType: AccountType) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot set account type: User not logged in');
      return;
    }

    console.log('[UserContext] Setting account type to:', accountType);

    let newProfile: UserProfile | null = null;
    setProfile((prevProfile) => {
      newProfile = { ...prevProfile, accountType };
      return newProfile;
    });

    if (!newProfile) return;

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Account type saved and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to save account type:', error);
    }
  }, [clerkUser]);

  const setBusinessInfo = useCallback(async (businessInfo: Partial<BusinessInfo>) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot set business info: User not logged in');
      return;
    }

    console.log('[UserContext] Updating business info');

    const isFirstTimeSetup = !profile.businessInfo;

    let newProfile: UserProfile | null = null;
    setProfile((prevProfile) => {
      newProfile = {
        ...prevProfile,
        businessInfo: {
          ...prevProfile.businessInfo,
          ...businessInfo,
        } as BusinessInfo,
      };
      return newProfile;
    });

    if (!newProfile) return;

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Business info saved and synced to Firebase');

      // Initialize owner as team member on first setup (Phase 0)
      if (isFirstTimeSetup && businessInfo.name) {
        const email = clerkUser.primaryEmailAddress?.emailAddress || '';
        await initializeBusinessOwner(clerkUser.id, businessInfo.name, email);
        console.log('[UserContext] ✅ Business owner initialized in team');
      }
    } catch (error) {
      console.error('[UserContext] ❌ Failed to save business info:', error);
    }
  }, [clerkUser, profile.businessInfo]);

  const setUserDetails = useCallback(async (userDetails: Partial<UserDetails>) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot set user details: User not logged in');
      return;
    }

    console.log('[UserContext] Updating user details:', JSON.stringify(userDetails, null, 2));

    let newProfile: UserProfile | null = null;
    setProfile((prevProfile) => {
      newProfile = {
        ...prevProfile,
        userDetails: {
          ...prevProfile.userDetails,
          ...userDetails,
        } as UserDetails,
      };
      return newProfile;
    });

    if (!newProfile) return;

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ User details saved to profile');

      // Also update top-level user metadata in Firebase
      const metadata: any = {};

      // Extract name and location to top-level fields
      if (userDetails.name) {
        // Split name into first/last if possible
        const nameParts = userDetails.name.trim().split(' ');
        if (nameParts.length > 1) {
          metadata.firstName = nameParts[0];
          metadata.lastName = nameParts.slice(1).join(' ');
          metadata.fullName = userDetails.name.trim();
        } else {
          metadata.firstName = userDetails.name.trim();
          metadata.fullName = userDetails.name.trim();
        }
      }

      if (userDetails.location || userDetails.latitude) {
        metadata.location = {
          city: userDetails.location,
          ...(userDetails.latitude && userDetails.longitude ? {
            coordinates: {
              latitude: userDetails.latitude,
              longitude: userDetails.longitude,
            }
          } : {})
        };
      }

      if (Object.keys(metadata).length > 0) {
        await updateUserMetadata(clerkUser.id, metadata);
        console.log('[UserContext] ✅ User metadata updated in Firebase');
      }
    } catch (error) {
      console.error('[UserContext] ❌ Failed to save user details:', error);
    }
  }, [clerkUser]);

  const refreshTransactionTotals = useCallback(async () => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot refresh transactions: User not logged in');
      return;
    }

    try {
      console.log('[UserContext] 🔄 Refreshing transaction totals for user:', clerkUser.id);

      const isBusiness = profile.accountType === 'business';

      if (isBusiness) {
        // For business accounts, aggregate business transactions
        const businessMetrics = await aggregateBusinessTransactions(clerkUser.id);

        // Update business info with total donated
        const updatedBusinessInfo = {
          ...profile.businessInfo,
          totalDonated: businessMetrics.totalDonated,
        };

        const newProfile = { ...profile, businessInfo: updatedBusinessInfo };
        setProfile(newProfile);

        // Save to Firebase
        await saveUserProfile(clerkUser.id, newProfile);
        console.log('[UserContext] ✅ Business transaction totals refreshed:', businessMetrics);
      } else {
        // For individual accounts, aggregate user transactions
        const { totalSavings, totalDonations } = await aggregateUserTransactions(clerkUser.id);

        const newProfile = {
          ...profile,
          totalSavings,
          donationAmount: totalDonations,
        };
        setProfile(newProfile);

        // Save to Firebase
        await saveUserProfile(clerkUser.id, newProfile);
        console.log('[UserContext] ✅ User transaction totals refreshed:', { totalSavings, totalDonations });
      }
    } catch (error) {
      console.error('[UserContext] ❌ Failed to refresh transaction totals:', error);
    }
  }, [clerkUser, profile]);

  // Team Management (Phase 0)
  const hasPermission = useCallback(async (permission: 'viewData' | 'editMoney' | 'confirmTransactions'): Promise<boolean> => {
    if (!clerkUser) return false;

    // If user is the business owner, they have all permissions
    if (profile.accountType === 'business' && profile.businessInfo) {
      return true;
    }

    // If user is a team member, check their permissions
    if (profile.businessMembership) {
      return await checkTeamPermission(clerkUser.id, permission);
    }

    return false;
  }, [clerkUser, profile]);

  const getBusinessId = useCallback((): string | null => {
    // If they own a business
    if (profile.accountType === 'business' && clerkUser) {
      return clerkUser.id;
    }

    // If they're a team member
    if (profile.businessMembership) {
      return profile.businessMembership.businessId;
    }

    return null;
  }, [profile, clerkUser]);

  const isBusinessOwner = useCallback((): boolean => {
    return profile.accountType === 'business' && !!profile.businessInfo;
  }, [profile]);

  const isTeamMember = useCallback((): boolean => {
    return !!profile.businessMembership && profile.businessMembership.role === 'team';
  }, [profile]);

  return useMemo(() => ({
    profile,
    isLoading: isLoading || !isClerkLoaded,
    hasCompletedOnboarding,
    isNewUser,
    addCauses,
    removeCauses,
    toggleCauseType,
    addToSearchHistory,
    updateSelectedCharities,
    resetProfile,
    clearAllStoredData,
    isDarkMode,
    clerkUser,
    setAccountType,
    setBusinessInfo,
    setUserDetails,
    refreshTransactionTotals,
    // Team Management (Phase 0)
    hasPermission,
    getBusinessId,
    isBusinessOwner,
    isTeamMember,
  }), [profile, isLoading, isClerkLoaded, hasCompletedOnboarding, isNewUser, addCauses, removeCauses, toggleCauseType, addToSearchHistory, updateSelectedCharities, resetProfile, clearAllStoredData, isDarkMode, clerkUser, setAccountType, setBusinessInfo, setUserDetails, refreshTransactionTotals, hasPermission, getBusinessId, isBusinessOwner, isTeamMember]);
});
